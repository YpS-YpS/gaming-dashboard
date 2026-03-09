"""
DuckDB schema setup for the gaming dashboard backend.
Five tables:
  - game_summary       : one row per (build, sku, game) — KPI metrics
  - timeseries         : one row per (build, sku, game, chart_type) — chart arrays stored as JSON
  - system_scope       : one row per (build, sku) — full System Scope log data as JSON
  - ingestion_sources  : saved source paths for the ingestion wizard
  - ingestion_log      : audit trail of every push operation
"""

import json
from pathlib import Path

import duckdb

# Database file lives alongside this module
DEFAULT_DB_PATH = Path(__file__).parent / "data" / "gaming_dashboard.duckdb"


def get_connection(db_path: Path = DEFAULT_DB_PATH, read_only: bool = False) -> duckdb.DuckDBPyConnection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return duckdb.connect(str(db_path), read_only=read_only)


def init_schema(db_path_or_con=None) -> None:
    """Create tables if they don't exist.

    Args:
        db_path_or_con: Either a Path to the DB file, an existing DuckDB connection,
                        or None to use DEFAULT_DB_PATH.
    """
    if isinstance(db_path_or_con, duckdb.DuckDBPyConnection):
        con = db_path_or_con
        owns_connection = False
    else:
        db_path = db_path_or_con or DEFAULT_DB_PATH
        con = get_connection(db_path)
        owns_connection = True
    con.execute("""
        CREATE TABLE IF NOT EXISTS game_summary (
            build_id            TEXT NOT NULL,
            sku_id              TEXT NOT NULL,
            game_slug           TEXT NOT NULL,
            -- FPS metrics (from CapFrameX)
            avg_fps             FLOAT,
            one_pct_low         FLOAT,
            zero_one_pct_low    FLOAT,
            max_fps             FLOAT,
            min_fps             FLOAT,
            avg_frame_time_ms   FLOAT,
            p95_frame_time_ms   FLOAT,
            p99_frame_time_ms   FLOAT,
            avg_gpu_active_ms   FLOAT,
            avg_cpu_active_ms   FLOAT,
            -- Power metrics (from PTAT)
            avg_ia_power        FLOAT,
            max_ia_power        FLOAT,
            avg_pkg_power       FLOAT,
            max_pkg_power       FLOAT,
            -- Thermal metrics (from PTAT)
            avg_pkg_temp        FLOAT,
            max_pkg_temp        FLOAT,
            -- Frequency metrics (from PTAT)
            avg_p_core_mhz      FLOAT,
            max_p_core_mhz      FLOAT,
            min_p_core_mhz      FLOAT,
            avg_e_core_mhz      FLOAT,
            max_e_core_mhz      FLOAT,
            min_e_core_mhz      FLOAT,
            -- Core topology (from PTAT)
            p_core_count        INTEGER,
            e_core_count        INTEGER,
            -- Throttling
            throttling          TEXT,       -- JSON array of strings
            -- System info
            cpu_brand           TEXT,
            firmware            TEXT,
            gpu                 TEXT,
            os                  TEXT,
            motherboard         TEXT,
            -- Build classification
            build_type          TEXT DEFAULT 'bkc',      -- 'bkc' or 'experiment'
            parent_bkc          TEXT,                     -- NULL for BKC, parent build_id for experiments
            experiment_label    TEXT,                     -- Optional human-readable label (e.g. "bLLC Enabled")
            -- Metadata
            created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (build_id, sku_id, game_slug)
        )
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS timeseries (
            build_id    TEXT NOT NULL,
            sku_id      TEXT NOT NULL,
            game_slug   TEXT NOT NULL,
            chart_type  TEXT NOT NULL,   -- 'frametimes' | 'frequency' | 'temperature' | 'power' | 'clipReason' | 'cstateResidency'
            data        TEXT NOT NULL,   -- JSON array
            PRIMARY KEY (build_id, sku_id, game_slug, chart_type)
        )
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS system_scope (
            build_id        TEXT NOT NULL,
            sku_id          TEXT NOT NULL,
            bkc_name        TEXT,
            program_name    TEXT,
            creation_date   TEXT,
            log_info        TEXT,       -- JSON object
            quick_specs     TEXT,       -- JSON array of {category, label, value}
            sections        TEXT,       -- JSON array of {module, plugin, groups[]}
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (build_id, sku_id)
        )
    """)

    # -- Ingestion management tables --

    con.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_sources (
            id              TEXT PRIMARY KEY,
            label           TEXT NOT NULL,
            path            TEXT NOT NULL,
            source_type     TEXT NOT NULL,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_log (
            id              TEXT PRIMARY KEY,
            pushed_at       TIMESTAMP NOT NULL,
            build_id        TEXT NOT NULL,
            sku_id          TEXT NOT NULL,
            build_type      TEXT NOT NULL DEFAULT 'bkc',
            parent_bkc      TEXT,
            experiment_label TEXT,
            games           TEXT NOT NULL,
            game_count      INTEGER NOT NULL,
            source_paths    TEXT NOT NULL,
            chart_types     TEXT NOT NULL,
            status          TEXT NOT NULL DEFAULT 'completed',
            notes           TEXT
        )
    """)

    if owns_connection:
        con.close()
        print(f"  [DB] Schema initialised at {db_path}")


def upsert_system_scope(con: duckdb.DuckDBPyConnection, build_id: str, sku_id: str,
                         scope_data: dict) -> None:
    """Insert or replace a system_scope row."""
    con.execute("""
        INSERT OR REPLACE INTO system_scope (build_id, sku_id, bkc_name, program_name, creation_date, log_info, quick_specs, sections)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        build_id, sku_id,
        scope_data.get("bkc_name", ""),
        scope_data.get("program_name", ""),
        scope_data.get("creation_date", ""),
        json.dumps(scope_data.get("log_info", {})),
        json.dumps(scope_data.get("quick_specs", [])),
        json.dumps(scope_data.get("sections", [])),
    ])


def upsert_summary(con: duckdb.DuckDBPyConnection, row: dict) -> None:
    """Insert or replace a game_summary row."""
    con.execute("""
        INSERT OR REPLACE INTO game_summary (
            build_id, sku_id, game_slug,
            avg_fps, one_pct_low, zero_one_pct_low, max_fps, min_fps,
            avg_frame_time_ms, p95_frame_time_ms, p99_frame_time_ms,
            avg_gpu_active_ms, avg_cpu_active_ms,
            avg_ia_power, max_ia_power, avg_pkg_power, max_pkg_power,
            avg_pkg_temp, max_pkg_temp,
            avg_p_core_mhz, max_p_core_mhz, min_p_core_mhz,
            avg_e_core_mhz, max_e_core_mhz, min_e_core_mhz,
            p_core_count, e_core_count,
            throttling,
            cpu_brand, firmware, gpu, os, motherboard,
            build_type, parent_bkc, experiment_label,
            created_at
        ) VALUES (
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            CURRENT_TIMESTAMP
        )
    """, [
        row["build_id"], row["sku_id"], row["game_slug"],
        row.get("avg_fps"), row.get("one_pct_low"), row.get("zero_one_pct_low"),
        row.get("max_fps"), row.get("min_fps"),
        row.get("avg_frame_time_ms"), row.get("p95_frame_time_ms"), row.get("p99_frame_time_ms"),
        row.get("avg_gpu_active_ms"), row.get("avg_cpu_active_ms"),
        row.get("avg_ia_power"), row.get("max_ia_power"),
        row.get("avg_pkg_power"), row.get("max_pkg_power"),
        row.get("avg_pkg_temp"), row.get("max_pkg_temp"),
        row.get("avg_p_core_mhz"), row.get("max_p_core_mhz"), row.get("min_p_core_mhz"),
        row.get("avg_e_core_mhz"), row.get("max_e_core_mhz"), row.get("min_e_core_mhz"),
        row.get("p_core_count"), row.get("e_core_count"),
        json.dumps(row.get("throttling", [])),
        row.get("cpu_brand", ""), row.get("firmware", ""),
        row.get("gpu", ""), row.get("os", ""), row.get("motherboard", ""),
        row.get("build_type", "bkc"), row.get("parent_bkc"),
        row.get("experiment_label"),
    ])


def upsert_timeseries(con: duckdb.DuckDBPyConnection, build_id: str, sku_id: str,
                      game_slug: str, chart_type: str, data: list) -> None:
    """Insert or replace a timeseries row."""
    con.execute("""
        INSERT OR REPLACE INTO timeseries (build_id, sku_id, game_slug, chart_type, data)
        VALUES (?, ?, ?, ?, ?)
    """, [build_id, sku_id, game_slug, chart_type, json.dumps(data)])


# ── Ingestion source management ──────────────────────────────────

def list_sources(con) -> list[dict]:
    """List all saved ingestion sources."""
    rows = con.execute(
        "SELECT id, label, path, source_type, created_at FROM ingestion_sources ORDER BY created_at"
    ).fetchall()
    return [
        {"id": r[0], "label": r[1], "path": r[2], "source_type": r[3], "created_at": str(r[4])}
        for r in rows
    ]


def add_source(con, source_id: str, label: str, path: str, source_type: str) -> None:
    """Add a new ingestion source path."""
    con.execute(
        "INSERT INTO ingestion_sources (id, label, path, source_type) VALUES (?, ?, ?, ?)",
        [source_id, label, path, source_type],
    )


def delete_source(con, source_id: str) -> None:
    """Remove an ingestion source path."""
    con.execute("DELETE FROM ingestion_sources WHERE id = ?", [source_id])


# ── Ingestion log management ─────────────────────────────────────

def list_ingestion_log(con) -> list[dict]:
    """List all ingestion log entries."""
    rows = con.execute(
        "SELECT id, pushed_at, build_id, sku_id, build_type, parent_bkc, "
        "experiment_label, games, game_count, source_paths, chart_types, status, notes "
        "FROM ingestion_log ORDER BY pushed_at DESC"
    ).fetchall()
    cols = [
        "id", "pushed_at", "build_id", "sku_id", "build_type", "parent_bkc",
        "experiment_label", "games", "game_count", "source_paths", "chart_types",
        "status", "notes",
    ]
    return [dict(zip(cols, r)) for r in rows]


def insert_ingestion_log(con, entry: dict) -> None:
    """Insert a new ingestion log entry."""
    con.execute(
        "INSERT INTO ingestion_log (id, pushed_at, build_id, sku_id, build_type, "
        "parent_bkc, experiment_label, games, game_count, source_paths, chart_types, status, notes) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            entry["id"], entry["pushed_at"], entry["build_id"], entry["sku_id"],
            entry["build_type"], entry.get("parent_bkc"), entry.get("experiment_label"),
            entry["games"], entry["game_count"], entry["source_paths"],
            entry["chart_types"], entry.get("status", "completed"), entry.get("notes"),
        ],
    )


def rollback_ingestion(con, ingestion_id: str) -> dict:
    """
    Roll back an ingestion: delete all data written by that batch.
    Returns summary of what was deleted.
    """
    row = con.execute(
        "SELECT build_id, sku_id, games FROM ingestion_log WHERE id = ?",
        [ingestion_id],
    ).fetchone()
    if not row:
        return {"error": "Ingestion not found"}

    build_id, sku_id, games_json = row
    game_slugs = json.loads(games_json)

    for slug in game_slugs:
        con.execute(
            "DELETE FROM game_summary WHERE build_id = ? AND sku_id = ? AND game_slug = ?",
            [build_id, sku_id, slug],
        )
        con.execute(
            "DELETE FROM timeseries WHERE build_id = ? AND sku_id = ? AND game_slug = ?",
            [build_id, sku_id, slug],
        )

    con.execute(
        "UPDATE ingestion_log SET status = 'rolled_back' WHERE id = ?",
        [ingestion_id],
    )

    return {"rolled_back": ingestion_id, "games": game_slugs}
