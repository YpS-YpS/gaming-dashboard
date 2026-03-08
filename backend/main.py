"""
FastAPI backend for the Intel Gaming Performance Dashboard.

Endpoints:
  GET /api/programs             → program + SKU manifest (replaces programs.js static data)
  GET /api/builds               → available builds in the DB
  GET /api/summary              → KPI table data per build+sku (game cards, landing page)
  GET /api/timeseries/{slug}    → chart timeseries data per build+sku+game+chart_type
  GET /api/system-config        → system config (CPU, GPU, OS, etc.) for a build+sku
  GET /api/performance-index    → per-build average FPS for a SKU
  GET /api/system-scope-details  → full System Scope log data (all sections/groups/items)
  GET /api/compare              → side-by-side comparison of two configs
  GET /health                   → health check

Run with:
  uvicorn backend.main:app --reload --port 8000 --workers 1
"""

import json
import math
import threading
import time
from pathlib import Path
from typing import Optional

import duckdb
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .db import DEFAULT_DB_PATH, get_connection

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Intel Gaming Performance Dashboard API",
    version="1.0.0",
    description="Backend API serving real PTAT + CapFrameX gaming performance data",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten in production
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Static frontend (production build) ────────────────────────────────────────
DIST_DIR = Path(__file__).parent.parent / "dist"
GAMETRACES_DIR = Path(__file__).parent.parent / "Gametraces"

# ── Programs manifest ────────────────────────────────────────────────────────
FALLBACK_PROGRAMS = [
    {
        "id": "arrow-lake", "name": "Arrow Lake", "codename": "ARL",
        "icon": "🏹", "color": "#a855f7",
        "skus": [
            {"id": "arl-s",   "name": "ARL S",   "fullName": "Arrow Lake S Desktop",       "cores": "24C/24T", "tdp": "125W", "graphics": "dGFX", "gpu": "RTX 5090"},
            {"id": "arl-hx",  "name": "ARL HX",  "fullName": "Arrow Lake HX Mobile",       "cores": "24C/24T", "tdp": "55W",  "graphics": "dGFX", "gpu": "RTX 5090"},
            {"id": "arl-h",   "name": "ARL H",   "fullName": "Arrow Lake H Mobile",        "cores": "16C/16T", "tdp": "45W",  "graphics": "iGFX"},
        ],
    },
    {
        "id": "nova-lake", "name": "Nova Lake", "codename": "NVL",
        "icon": "✨", "color": "#22d3ee",
        "skus": [
            {"id": "nvl-sk-28c",      "name": "NVL S K 28C",      "fullName": "Nova Lake S K 28C",      "cores": "28C/28T", "coreConfig": "8P + 16E + 4LPE", "tdp": "125W", "graphics": "dGFX", "gpu": "RTX 5090"},
            {"id": "nvl-sk-28c-bllc", "name": "NVL S K 28C bLLC", "fullName": "Nova Lake S K 28C bLLC", "cores": "28C/28T", "coreConfig": "8P + 16E + 4LPE", "tdp": "125W", "cache": "bLLC", "graphics": "dGFX", "gpu": "RTX 5090"},
            {"id": "nvl-sk-52c",      "name": "NVL S K 52C",      "fullName": "Nova Lake S K 52C",      "cores": "52C/52T", "coreConfig": "16P + 32E + 4LPE", "tdp": "150W", "graphics": "dGFX", "gpu": "RTX 5090"},
            {"id": "nvl-sk-52c-bllc", "name": "NVL S K 52C bLLC", "fullName": "Nova Lake S K 52C bLLC", "cores": "52C/52T", "coreConfig": "16P + 32E + 4LPE", "tdp": "150W", "cache": "bLLC", "graphics": "dGFX", "gpu": "RTX 5090"},
        ],
    },
    {
        "id": "panther-lake", "name": "Panther Lake", "codename": "PTL",
        "icon": "🐾", "color": "#f472b6",
        "skus": [
            {"id": "ptl-u", "name": "PTL U", "fullName": "Panther Lake U Ultra-Mobile", "cores": "12C/16T", "tdp": "15W", "graphics": "iGFX"},
            {"id": "ptl-h", "name": "PTL H", "fullName": "Panther Lake H Mobile",       "cores": "20C/24T", "tdp": "45W", "graphics": "iGFX"},
        ],
    },
]


def _load_programs() -> list[dict]:
    """Load program manifests from Gametraces/*/program.json, fall back to FALLBACK_PROGRAMS."""
    if not GAMETRACES_DIR.exists():
        return FALLBACK_PROGRAMS

    loaded = []
    for program_dir in sorted(GAMETRACES_DIR.iterdir()):
        manifest = program_dir / "program.json"
        if manifest.exists():
            try:
                with open(manifest, "r", encoding="utf-8") as f:
                    loaded.append(json.load(f))
            except Exception:
                continue

    return loaded if loaded else FALLBACK_PROGRAMS


PROGRAMS = _load_programs()


# ── DB connection (thread-safe via per-thread cursors) ────────────────────────
_db_conn: duckdb.DuckDBPyConnection | None = None
_db_lock = threading.Lock()

def _init_db() -> duckdb.DuckDBPyConnection:
    """Initialise the shared parent connection (called once)."""
    global _db_conn
    with _db_lock:
        if _db_conn is None:
            _db_conn = get_connection(DEFAULT_DB_PATH, read_only=True)
        return _db_conn

def _get_db() -> duckdb.DuckDBPyConnection:
    """Return a thread-local cursor from the shared connection."""
    if not DEFAULT_DB_PATH.exists():
        raise HTTPException(status_code=503, detail="Database not initialised. Run the ETL pipeline first.")
    parent = _init_db()
    return parent.cursor()


# ── Response cache (data only changes on ETL runs) ───────────────────────────
_cache: dict[str, tuple[float, object]] = {}
_cache_lock = threading.Lock()
CACHE_TTL = 300  # 5 minutes

def _cached(key: str, fn):
    """Return cached result or compute via fn(). Thread-safe, TTL-based."""
    now = time.monotonic()
    with _cache_lock:
        if key in _cache:
            ts, val = _cache[key]
            if now - ts < CACHE_TTL:
                return val
    result = fn()
    with _cache_lock:
        _cache[key] = (now, result)
    return result

def _invalidate_cache():
    """Clear all cached responses (call after ETL)."""
    with _cache_lock:
        _cache.clear()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    db_ok = DEFAULT_DB_PATH.exists()
    return {"status": "ok", "db": str(DEFAULT_DB_PATH), "db_exists": db_ok}


@app.post("/api/cache/clear")
def clear_cache():
    """Clear response cache. Call after ETL ingestion to pick up new data."""
    _invalidate_cache()
    return {"status": "cleared"}


@app.get("/api/programs")
def get_programs():
    """Return all programs and SKUs. Also annotates which have real data in the DB."""
    def _fetch():
        import copy
        programs = copy.deepcopy(PROGRAMS)
        if not DEFAULT_DB_PATH.exists():
            return programs
        try:
            con = _get_db()
            result = con.execute("SELECT DISTINCT sku_id FROM game_summary").fetchall()
            skus_with_data = {r[0] for r in result}
        except Exception:
            skus_with_data = set()
        for program in programs:
            for sku in program["skus"]:
                sku["hasData"] = sku["id"] in skus_with_data
        return programs
    return _cached("programs", _fetch)


@app.get("/api/builds")
def get_builds(sku_id: Optional[str] = Query(None)):
    """Return available build IDs, optionally filtered by SKU."""
    def _fetch():
        if not DEFAULT_DB_PATH.exists():
            return []
        con = _get_db()
        if sku_id:
            rows = con.execute(
                "SELECT DISTINCT build_id FROM game_summary WHERE sku_id = ? ORDER BY build_id DESC",
                [sku_id]
            ).fetchall()
        else:
            rows = con.execute(
                "SELECT DISTINCT build_id FROM game_summary ORDER BY build_id DESC"
            ).fetchall()
        return [r[0] for r in rows]
    try:
        return _cached(f"builds:{sku_id}", _fetch)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/build-tree")
def get_build_tree(sku_id: Optional[str] = Query(None)):
    """Return builds organized as BKC + experiment branches."""
    def _fetch():
        if not DEFAULT_DB_PATH.exists():
            return []
        con = _get_db()

        query = """
            SELECT DISTINCT build_id,
                   COALESCE(build_type, 'bkc') as build_type,
                   parent_bkc,
                   COUNT(DISTINCT game_slug) as game_count
            FROM game_summary
        """
        params = []
        if sku_id:
            query += " WHERE sku_id = ?"
            params.append(sku_id)
        query += " GROUP BY build_id, build_type, parent_bkc ORDER BY build_id DESC"

        rows = con.execute(query, params).fetchall()

        # Organize into tree: BKCs with nested experiments
        bkc_map = {}
        experiments = []

        for build_id_val, build_type, parent_bkc, game_count in rows:
            if build_type == "experiment" and parent_bkc:
                experiments.append({
                    "build_id": build_id_val,
                    "game_count": game_count,
                    "parent_bkc": parent_bkc,
                })
            else:
                bkc_map[build_id_val] = {
                    "build_id": build_id_val,
                    "type": "bkc",
                    "game_count": game_count,
                    "experiments": [],
                }

        # Attach experiments to their parent BKCs
        for exp in experiments:
            parent = exp["parent_bkc"]
            if parent in bkc_map:
                bkc_map[parent]["experiments"].append({
                    "build_id": exp["build_id"],
                    "game_count": exp["game_count"],
                })
            else:
                bkc_map[exp["build_id"]] = {
                    "build_id": exp["build_id"],
                    "type": "experiment",
                    "game_count": exp["game_count"],
                    "parent_bkc": parent,
                    "experiments": [],
                }

        return list(bkc_map.values())

    try:
        return _cached(f"build-tree:{sku_id}", _fetch)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/summary")
def get_summary(
    build_id: str = Query(..., description="Build ID, e.g. WW0826"),
    sku_id:   str = Query(..., description="SKU ID, e.g. nvl-s"),
):
    """
    Return aggregated KPI metrics for all games in a given build+sku.
    Powers: game cards, landing page performance index, comparison page.
    """
    def _fetch():
        if not DEFAULT_DB_PATH.exists():
            return []
        con = _get_db()
        rows = con.execute("""
            SELECT
                game_slug, avg_fps, one_pct_low, zero_one_pct_low, max_fps, min_fps,
                avg_frame_time_ms, p99_frame_time_ms,
                avg_gpu_active_ms, avg_cpu_active_ms,
                avg_ia_power, max_ia_power, avg_pkg_power, max_pkg_power,
                avg_pkg_temp, max_pkg_temp,
                avg_p_core_mhz, max_p_core_mhz, min_p_core_mhz,
                avg_e_core_mhz, max_e_core_mhz, min_e_core_mhz,
                p_core_count, e_core_count,
                throttling, cpu_brand, firmware, gpu, os, motherboard
            FROM game_summary
            WHERE build_id = ? AND sku_id = ?
            ORDER BY avg_fps DESC
        """, [build_id, sku_id]).fetchall()

        cols = [
            "game_slug", "avg_fps", "one_pct_low", "zero_one_pct_low", "max_fps", "min_fps",
            "avg_frame_time_ms", "p99_frame_time_ms",
            "avg_gpu_active_ms", "avg_cpu_active_ms",
            "avg_ia_power", "max_ia_power", "avg_pkg_power", "max_pkg_power",
            "avg_pkg_temp", "max_pkg_temp",
            "avg_p_core_mhz", "max_p_core_mhz", "min_p_core_mhz",
            "avg_e_core_mhz", "max_e_core_mhz", "min_e_core_mhz",
            "p_core_count", "e_core_count",
            "throttling", "cpu_brand", "firmware", "gpu", "os", "motherboard",
        ]
        results = []
        for row in rows:
            d = dict(zip(cols, row))
            try:
                d["throttling"] = json.loads(d["throttling"] or "[]")
            except Exception:
                d["throttling"] = []
            results.append(d)
        return results

    try:
        return _cached(f"summary:{build_id}:{sku_id}", _fetch)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _lttb_downsample(data: list[dict], max_points: int, x_key: str = "frame", y_key: str = "frameTime") -> list[dict]:
    """
    Largest-Triangle-Three-Buckets (LTTB) downsampling.
    Preserves visual shape (peaks, valleys, trends) far better than uniform sampling.
    Returns original data if len <= max_points.
    """
    n = len(data)
    if n <= max_points or max_points < 3:
        return data

    # Always keep first and last point
    sampled = [data[0]]
    bucket_size = (n - 2) / (max_points - 2)

    a_idx = 0  # index of previously selected point

    for i in range(1, max_points - 1):
        # Calculate bucket range
        bucket_start = int(math.floor((i - 1) * bucket_size)) + 1
        bucket_end = int(math.floor(i * bucket_size)) + 1
        bucket_end = min(bucket_end, n)

        # Calculate next bucket average (for triangle area calc)
        next_start = int(math.floor(i * bucket_size)) + 1
        next_end = int(math.floor((i + 1) * bucket_size)) + 1
        next_end = min(next_end, n)

        avg_x = sum(j for j in range(next_start, next_end)) / max(1, next_end - next_start)
        avg_y = 0
        for j in range(next_start, next_end):
            val = data[j].get(y_key, 0)
            avg_y += val if val is not None else 0
        avg_y /= max(1, next_end - next_start)

        # Find point in current bucket with largest triangle area
        max_area = -1
        max_idx = bucket_start
        a_x = a_idx
        a_y_val = data[a_idx].get(y_key, 0) or 0

        for j in range(bucket_start, bucket_end):
            y_val = data[j].get(y_key, 0) or 0
            area = abs((a_x - avg_x) * (y_val - a_y_val) - (a_x - j) * (avg_y - a_y_val)) * 0.5
            if area > max_area:
                max_area = area
                max_idx = j

        sampled.append(data[max_idx])
        a_idx = max_idx

    sampled.append(data[-1])
    return sampled


def _downsample_timeseries(chart_type: str, data: list[dict], max_points: int) -> list[dict]:
    """Apply appropriate downsampling based on chart type."""
    if max_points <= 0 or len(data) <= max_points:
        return data

    if chart_type == "frametimes":
        return _lttb_downsample(data, max_points, x_key="frame", y_key="frameTime")
    elif chart_type == "power":
        return _lttb_downsample(data, max_points, x_key="time", y_key="iaPower")
    elif chart_type == "frequency":
        return _lttb_downsample(data, max_points, x_key="time", y_key=next(
            (k for k in data[0].keys() if k.startswith("pCore")), "time"))
    elif chart_type == "temperature":
        return _lttb_downsample(data, max_points, x_key="time", y_key="package")
    elif chart_type == "cstateResidency":
        return _lttb_downsample(data, max_points, x_key="time", y_key="residency")
    elif chart_type == "clipReason":
        # Sparse events — don't downsample
        return data
    else:
        # Generic: uniform sample
        step = max(1, len(data) // max_points)
        return data[::step][:max_points]


@app.get("/api/timeseries/{game_slug}")
def get_timeseries(
    game_slug:  str,
    build_id:   str = Query(...),
    sku_id:     str = Query(...),
    charts:     Optional[str] = Query(None, description="Comma-separated chart types: frametimes,frequency,temperature,power,clipReason,cstateResidency"),
    max_points: int = Query(1000, description="Max data points per chart. 0 = no limit (full raw data)."),
):
    """
    Return chart timeseries data for the DetailedAnalysisPage.
    Full raw data is stored in DB. Response is downsampled via LTTB for fast rendering.
    Pass max_points=0 to get all raw data points.
    """
    if not DEFAULT_DB_PATH.exists():
        return {}
    try:
        con = _get_db()

        chart_filter = ""
        params = [build_id, sku_id, game_slug]
        if charts:
            requested = [c.strip() for c in charts.split(",")]
            placeholders = ", ".join(["?"] * len(requested))
            chart_filter = f"AND chart_type IN ({placeholders})"
            params.extend(requested)

        rows = con.execute(f"""
            SELECT chart_type, data
            FROM timeseries
            WHERE build_id = ? AND sku_id = ? AND game_slug = ?
            {chart_filter}
        """, params).fetchall()


        result = {}
        for chart_type, data_json in rows:
            try:
                raw = json.loads(data_json)
                result[chart_type] = _downsample_timeseries(chart_type, raw, max_points) if max_points > 0 else raw
            except Exception:
                result[chart_type] = []
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/system-config")
def get_system_config(
    build_id: str = Query(..., description="Build ID, e.g. WW0826"),
    sku_id:   str = Query(..., description="SKU ID, e.g. nvl-s"),
):
    """Return system configuration for a given build+sku (from first game_summary row)."""
    if not DEFAULT_DB_PATH.exists():
        return None
    try:
        con = _get_db()
        row = con.execute("""
            SELECT cpu_brand, firmware, gpu, os, motherboard
            FROM game_summary
            WHERE build_id = ? AND sku_id = ?
            LIMIT 1
        """, [build_id, sku_id]).fetchone()

        if not row:
            return None
        return {
            "cpu": row[0] or "Unknown",
            "firmware": row[1] or "Unknown",
            "gpu": row[2] or "Unknown",
            "os": row[3] or "Unknown",
            "motherboard": row[4] or "Unknown",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/performance-index")
def get_performance_index(
    sku_id: str = Query(..., description="SKU ID, e.g. nvl-s"),
):
    """Return per-build average FPS across all games for a SKU (performance index)."""
    def _fetch():
        if not DEFAULT_DB_PATH.exists():
            return []
        con = _get_db()
        rows = con.execute("""
            SELECT build_id, AVG(avg_fps) AS perf_index, COUNT(*) AS game_count
            FROM game_summary
            WHERE sku_id = ?
            GROUP BY build_id
            ORDER BY build_id DESC
        """, [sku_id]).fetchall()
        return [
            {"build_id": r[0], "perf_index": round(r[1], 1), "game_count": r[2]}
            for r in rows
        ]
    try:
        return _cached(f"perf-index:{sku_id}", _fetch)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/compare")
def get_compare(
    left_build:  str = Query(...),
    left_sku:    str = Query(...),
    right_build: str = Query(...),
    right_sku:   str = Query(...),
    game_slug:   str = Query(...),
    charts:      Optional[str] = Query("frametimes,power,frequency"),
):
    """
    Return summary + timeseries for two configurations side-by-side.
    Powers the ComparisonPage.
    """
    left_summary  = get_summary(left_build,  left_sku)
    right_summary = get_summary(right_build, right_sku)

    left_game  = next((g for g in left_summary  if g["game_slug"] == game_slug), None)
    right_game = next((g for g in right_summary if g["game_slug"] == game_slug), None)

    left_ts  = get_timeseries(game_slug, left_build,  left_sku,  charts)
    right_ts = get_timeseries(game_slug, right_build, right_sku, charts)

    return {
        "left":  {"summary": left_game,  "timeseries": left_ts},
        "right": {"summary": right_game, "timeseries": right_ts},
    }


@app.get("/api/system-scope-details")
def get_system_scope_details(
    build_id: str = Query(..., description="Build ID"),
    sku_id:   str = Query(..., description="SKU ID, e.g. nvl-s"),
):
    """Return full System Scope data (all sections with groups and items) for a build+sku."""
    if not DEFAULT_DB_PATH.exists():
        return None
    try:
        con = _get_db()
        row = con.execute("""
            SELECT bkc_name, program_name, creation_date, log_info, quick_specs, sections
            FROM system_scope
            WHERE build_id = ? AND sku_id = ?
        """, [build_id, sku_id]).fetchone()

        if not row:
            return None
        return {
            "bkc_name": row[0],
            "program_name": row[1],
            "creation_date": row[2],
            "log_info": json.loads(row[3] or "{}"),
            "quick_specs": json.loads(row[4] or "[]"),
            "sections": json.loads(row[5] or "[]"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/games/available")
def get_available_games(
    build_id: Optional[str] = Query(None),
    sku_id:   Optional[str] = Query(None),
):
    """Return list of game slugs that have real data for a given build+sku combo."""
    if not DEFAULT_DB_PATH.exists():
        return []
    try:
        con = _get_db()
        where_clauses = []
        params = []
        if build_id:
            where_clauses.append("build_id = ?")
            params.append(build_id)
        if sku_id:
            where_clauses.append("sku_id = ?")
            params.append(sku_id)
        where = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
        rows = con.execute(f"SELECT DISTINCT game_slug FROM game_summary {where}", params).fetchall()

        return [r[0] for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Serve frontend static files (must be LAST) ───────────────────────────────
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve index.html for all non-API routes (SPA client-side routing)."""
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
