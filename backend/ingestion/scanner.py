"""
Ingestion scanner — discovers automation runs from various source types.

Supports:
  - raptor-x:    Raptor-X logs/runs/ directory (campaign + single runs)
  - gametraces:  Gametraces/<Program>/<SKU>/<Build>/ structure
  - custom:      Flat folder with trace files
"""

import base64
import csv
import hashlib
import json
import logging
import math
import os
import statistics
from datetime import datetime
from pathlib import Path

from backend.parsers.game_map import ptat_filename_to_slug

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}
TRACE_EXTENSIONS = {".csv", ".json", ".etl", ".dat", ".bin"}

MIME_MAP = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
}


def _hash_id(text: str) -> str:
    """Deterministic short hash for a folder path."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def _safe_read_json(path: str) -> dict | None:
    """Read a JSON file, returning None on any error."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _folder_mtime_iso(folder_path: str) -> str:
    """Return folder modification time as ISO string."""
    try:
        ts = os.path.getmtime(folder_path)
        return datetime.fromtimestamp(ts).isoformat()
    except Exception:
        return datetime.now().isoformat()


def _classify_file_type(ext: str) -> str:
    """Classify a file extension into a broad type category."""
    ext = ext.lower()
    if ext in (".json",):
        return "json"
    if ext in (".csv",):
        return "csv"
    if ext in IMAGE_EXTENSIONS:
        return "image"
    if ext in (".log", ".txt", ".xml", ".ini", ".cfg", ".yaml", ".yml"):
        return "text"
    if ext in (".bin", ".etl", ".dat"):
        return "binary"
    return "other"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def scan_source(source: dict) -> list[dict]:
    """
    Main entry point.  Takes a source dict and returns discovered runs.

    Parameters
    ----------
    source : dict
        Keys: id, label, path, source_type ("raptor-x" | "gametraces" | "custom")

    Returns
    -------
    list[dict]   Each dict is a run record (see module docstring for shape).
    """
    source_type = source.get("source_type", "custom")
    source_id = source.get("id", "unknown")
    path = source.get("path", "")

    if not os.path.isdir(path):
        logger.warning("Source path does not exist: %s", path)
        return []

    dispatch = {
        "raptor-x": _scan_raptor_x,
        "gametraces": _scan_gametraces,
        "custom": _scan_custom,
    }
    scanner = dispatch.get(source_type, _scan_custom)
    try:
        runs = scanner(path, source_id)
    except Exception:
        logger.exception("Error scanning source %s (%s)", source_id, path)
        runs = []

    # Sort newest-first by created_at
    runs.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return runs


def get_run_files(run_path: str) -> list[dict]:
    """
    List all files in a run folder with metadata.

    Returns a list of dicts with keys:
        name, relative_path, absolute_path, size, extension, type
    """
    results = []
    run_root = Path(run_path)
    if not run_root.is_dir():
        return results

    for file_path in run_root.rglob("*"):
        if not file_path.is_file():
            continue
        ext = file_path.suffix.lower()
        rel = str(file_path.relative_to(run_root)).replace("\\", "/")
        results.append({
            "name": file_path.name,
            "relative_path": rel,
            "absolute_path": str(file_path),
            "size": file_path.stat().st_size,
            "extension": ext,
            "type": _classify_file_type(ext),
        })

    results.sort(key=lambda f: f["relative_path"])
    return results


def read_file_content(file_path: str, max_csv_rows: int = 500) -> dict:
    """
    Read a file and return structured content.

    Returns
    -------
    dict with keys:
        type : str          – "json" | "csv" | "image" | "text" | "binary"
        content : any       – parsed JSON, CSV table, base64 string, or raw text
        error : str | None  – error message if reading failed
    """
    p = Path(file_path)
    if not p.is_file():
        return {"type": "error", "content": None, "error": "File not found"}

    ext = p.suffix.lower()

    # JSON
    if ext == ".json":
        try:
            with open(p, "r", encoding="utf-8") as f:
                return {"type": "json", "content": json.load(f), "error": None}
        except Exception as e:
            return {"type": "json", "content": None, "error": str(e)}

    # CSV
    if ext == ".csv":
        try:
            with open(p, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f)
                headers = next(reader, [])
                rows = []
                total = 0
                for row in reader:
                    total += 1
                    if total <= max_csv_rows:
                        rows.append(row)
                return {
                    "type": "csv",
                    "content": {
                        "headers": headers,
                        "rows": rows,
                        "total_rows": total,
                        "truncated": total > max_csv_rows,
                    },
                    "error": None,
                }
        except Exception as e:
            return {"type": "csv", "content": None, "error": str(e)}

    # Images
    if ext in IMAGE_EXTENSIONS:
        try:
            with open(p, "rb") as f:
                data = base64.b64encode(f.read()).decode("ascii")
            mime = MIME_MAP.get(ext, "application/octet-stream")
            return {
                "type": "image",
                "content": {"base64": data, "mime_type": mime},
                "error": None,
            }
        except Exception as e:
            return {"type": "image", "content": None, "error": str(e)}

    # Binary files
    if ext in (".bin", ".etl", ".dat"):
        return {"type": "binary", "content": None, "error": "Binary file — not readable as text"}

    # Everything else: raw text
    try:
        with open(p, "r", encoding="utf-8", errors="replace") as f:
            text = f.read(100_000)
        truncated = p.stat().st_size > 100_000
        return {
            "type": "text",
            "content": text + ("\n... [truncated]" if truncated else ""),
            "error": None,
        }
    except Exception as e:
        return {"type": "text", "content": None, "error": str(e)}


# ---------------------------------------------------------------------------
# Raptor-X scanner
# ---------------------------------------------------------------------------


def _scan_raptor_x(logs_path: str, source_id: str) -> list[dict]:
    """
    Scan Raptor-X logs/runs/ directory.

    Each subfolder is either:
      - A campaign run  (has campaign_manifest.json)
      - A single run    (has manifest.json but no campaign_manifest.json)
    """
    runs = []
    try:
        entries = os.listdir(logs_path)
    except OSError:
        return runs

    for folder_name in entries:
        folder_path = os.path.join(logs_path, folder_name)
        if not os.path.isdir(folder_path):
            continue

        try:
            run = _parse_raptor_run(folder_name, folder_path, source_id)
            if run:
                runs.append(run)
        except Exception:
            logger.exception("Error parsing run folder: %s", folder_name)

    return runs


def _parse_raptor_run(folder_name: str, folder_path: str, source_id: str) -> dict | None:
    """Parse a single Raptor-X run folder into a run record."""
    campaign_manifest_path = os.path.join(folder_path, "campaign_manifest.json")
    manifest_path = os.path.join(folder_path, "manifest.json")

    is_campaign = os.path.isfile(campaign_manifest_path)
    is_single = os.path.isfile(manifest_path)

    if not is_campaign and not is_single:
        # Not a recognized run folder
        return None

    # --- Campaign run ---
    if is_campaign:
        return _parse_campaign_run(folder_name, folder_path, source_id, campaign_manifest_path)

    # --- Single run ---
    return _parse_single_run(folder_name, folder_path, source_id, manifest_path)


def _parse_campaign_run(
    folder_name: str, folder_path: str, source_id: str, campaign_manifest_path: str
) -> dict:
    """Parse a Raptor-X campaign run (multiple games)."""
    campaign_manifest = _safe_read_json(campaign_manifest_path) or {}

    # Discover game subdirectories (each has its own manifest.json)
    games = []
    sut_info = {}
    config_info = {}
    overall_status = campaign_manifest.get("status", "unknown")
    created_at = campaign_manifest.get("created_at", _folder_mtime_iso(folder_path))

    for entry in sorted(os.listdir(folder_path)):
        entry_path = os.path.join(folder_path, entry)
        if not os.path.isdir(entry_path):
            continue
        game_manifest_path = os.path.join(entry_path, "manifest.json")
        if not os.path.isfile(game_manifest_path):
            continue

        game_manifest = _safe_read_json(game_manifest_path) or {}

        # Grab SUT from first game manifest (they all share the same SUT)
        if not sut_info and game_manifest.get("sut"):
            sut_info = game_manifest["sut"]
        if not config_info and game_manifest.get("config"):
            config_info = game_manifest["config"]

        game_record = _build_game_record(entry, entry_path, game_manifest)
        games.append(game_record)

    # Check ingestion state
    ingestion_state, ingested_build_id = _read_ingestion_marker(folder_path)

    # Compute health
    health = _compute_health(games, overall_status)

    return {
        "id": _hash_id(folder_path),
        "folder_name": folder_name,
        "folder_path": folder_path,
        "source_id": source_id,
        "source_type": "raptor-x",
        "run_type": "campaign",
        "created_at": created_at,
        "status": overall_status,
        "sut": _normalize_sut(sut_info),
        "config": config_info,
        "games": games,
        "game_count": len(games),
        "ingestion_state": ingestion_state,
        "ingested_build_id": ingested_build_id,
        "health": health,
    }


def _parse_single_run(
    folder_name: str, folder_path: str, source_id: str, manifest_path: str
) -> dict:
    """Parse a Raptor-X single-game run."""
    manifest = _safe_read_json(manifest_path) or {}

    sut_info = manifest.get("sut", {})
    config_info = manifest.get("config", {})
    overall_status = manifest.get("status", "unknown")
    created_at = manifest.get("created_at", _folder_mtime_iso(folder_path))

    game_record = _build_game_record(folder_name, folder_path, manifest)
    games = [game_record]

    # Check ingestion state
    ingestion_state, ingested_build_id = _read_ingestion_marker(folder_path)

    health = _compute_health(games, overall_status)

    return {
        "id": _hash_id(folder_path),
        "folder_name": folder_name,
        "folder_path": folder_path,
        "source_id": source_id,
        "source_type": "raptor-x",
        "run_type": "single",
        "created_at": created_at,
        "status": overall_status,
        "sut": _normalize_sut(sut_info),
        "config": config_info,
        "games": games,
        "game_count": len(games),
        "ingestion_state": ingestion_state,
        "ingested_build_id": ingested_build_id,
        "health": health,
    }


def _build_game_record(entry_name: str, game_path: str, manifest: dict) -> dict:
    """
    Build a game record dict from a game folder and its manifest.

    Works for both campaign sub-games and single runs.
    """
    # Determine game name from manifest config or folder name
    config = manifest.get("config", {})
    game_list = config.get("games", [])
    game_name = game_list[0] if game_list else entry_name.replace("-", " ")

    # Status and iterations from manifest
    status = manifest.get("status", "unknown")
    iterations_list = manifest.get("iterations", [])
    num_iterations = len(iterations_list)

    # Detect traces
    traces = _detect_traces(game_path)

    # Read scores from ALL perf-run-*/results/scores.json and compute median
    scores, has_scores = _read_all_scores(game_path)

    # Quick PresentMon stats from trace CSVs
    pm_stats = _read_presentmon_stats(game_path) if traces.get("presentmon") else None

    # Try to detect game slug from PTAT filenames
    game_slug = _detect_game_slug(game_path, game_name)

    return {
        "game_name": game_name,
        "game_slug": game_slug,
        "game_path": game_path,
        "status": status,
        "iterations": num_iterations,
        "has_scores": has_scores,
        "scores": scores,
        "pm_stats": pm_stats,
        "traces": traces,
    }


def _detect_traces(game_path: str) -> dict:
    """Detect which trace types are present in a game folder."""
    traces = {
        "ptat": False,
        "presentmon": False,
        "capframex": False,
        "emon": False,
        "socwatch": False,
    }

    # Check traces/ subdirectory (newer layout)
    traces_dir = os.path.join(game_path, "traces")
    if os.path.isdir(traces_dir):
        ptat_dir = os.path.join(traces_dir, "ptat")
        if os.path.isdir(ptat_dir) and os.listdir(ptat_dir):
            traces["ptat"] = True
        pm_dir = os.path.join(traces_dir, "presentmon")
        if os.path.isdir(pm_dir) and os.listdir(pm_dir):
            traces["presentmon"] = True

    # Check trace-run-* directories (present in runs that collected traces)
    for entry in os.listdir(game_path):
        lower = entry.lower()
        if lower == "trace-run-ptat" and os.path.isdir(os.path.join(game_path, entry)):
            traces["ptat"] = True
        elif lower == "trace-run-presentmon" and os.path.isdir(os.path.join(game_path, entry)):
            traces["presentmon"] = True
        elif lower == "trace-run-emon" and os.path.isdir(os.path.join(game_path, entry)):
            traces["emon"] = True
        elif lower == "trace-run-socwatch" and os.path.isdir(os.path.join(game_path, entry)):
            traces["socwatch"] = True
        elif lower == "trace-run-capframex" and os.path.isdir(os.path.join(game_path, entry)):
            traces["capframex"] = True

    return traces


def _read_all_scores(game_path: str) -> tuple[dict | None, bool]:
    """
    Read scores from ALL perf-run iterations and compute median avg_fps.

    Returns (scores_dict_with_median | None, has_scores: bool).
    """
    perf_runs = []
    for entry in os.listdir(game_path):
        if entry.startswith("perf-run-") and os.path.isdir(os.path.join(game_path, entry)):
            try:
                num = int(entry.split("-")[-1])
                perf_runs.append((num, entry))
            except ValueError:
                perf_runs.append((0, entry))

    if not perf_runs:
        return None, False

    perf_runs.sort(key=lambda x: x[0])

    all_avg_fps = []
    all_min_fps = []
    all_max_fps = []
    last_scores = None

    for _num, run_dir in perf_runs:
        scores_path = os.path.join(game_path, run_dir, "results", "scores.json")
        data = _safe_read_json(scores_path)
        if not data:
            continue
        scores = data.get("scores", data)
        last_scores = scores
        if scores.get("avg_fps") is not None:
            all_avg_fps.append(scores["avg_fps"])
        if scores.get("min_fps") is not None:
            all_min_fps.append(scores["min_fps"])
        if scores.get("max_fps") is not None:
            all_max_fps.append(scores["max_fps"])

    if not last_scores:
        return None, False

    result = dict(last_scores)
    # Override with median across all runs
    if all_avg_fps:
        result["avg_fps"] = round(statistics.median(all_avg_fps), 2)
        result["avg_fps_runs"] = len(all_avg_fps)
        result["avg_fps_all"] = [round(v, 2) for v in all_avg_fps]
    if all_min_fps:
        result["min_fps"] = round(statistics.median(all_min_fps), 2)
    if all_max_fps:
        result["max_fps"] = round(statistics.median(all_max_fps), 2)

    return result, True


def _read_presentmon_stats(game_path: str) -> dict | None:
    """
    Quick-parse PresentMon CSVs to extract avg FPS, 1% low, 0.1% low.

    Reads MsBetweenPresents column, converts to FPS.
    """
    pm_csvs = []

    # Check traces/presentmon/
    pm_dir = os.path.join(game_path, "traces", "presentmon")
    if os.path.isdir(pm_dir):
        for f in os.listdir(pm_dir):
            if f.lower().endswith(".csv"):
                pm_csvs.append(os.path.join(pm_dir, f))

    # Check trace-run-presentmon/
    tr_dir = os.path.join(game_path, "trace-run-presentmon")
    if os.path.isdir(tr_dir):
        for f in os.listdir(tr_dir):
            if f.lower().endswith(".csv"):
                pm_csvs.append(os.path.join(tr_dir, f))
        # Also check results/ subfolder
        res_dir = os.path.join(tr_dir, "results")
        if os.path.isdir(res_dir):
            for f in os.listdir(res_dir):
                if f.lower().endswith(".csv"):
                    pm_csvs.append(os.path.join(res_dir, f))

    if not pm_csvs:
        return None

    # Use the last (most recent) CSV
    pm_csvs.sort()
    csv_path = pm_csvs[-1]

    try:
        frame_times = []
        with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            col = None
            for candidate in ("MsBetweenPresents", "msBetweenPresents"):
                if candidate in (reader.fieldnames or []):
                    col = candidate
                    break
            if not col:
                return None
            for row in reader:
                try:
                    ms = float(row[col])
                    if 0.1 < ms < 500:  # filter outliers
                        frame_times.append(ms)
                except (ValueError, KeyError):
                    continue

        if len(frame_times) < 10:
            return None

        frame_times.sort()
        n = len(frame_times)

        avg_ms = statistics.mean(frame_times)
        # 1% low = average of worst 1% frame times
        p1_count = max(1, n // 100)
        p1_ms = statistics.mean(frame_times[-p1_count:])
        # 0.1% low = average of worst 0.1% frame times
        p01_count = max(1, n // 1000)
        p01_ms = statistics.mean(frame_times[-p01_count:])

        return {
            "avg_fps": round(1000.0 / avg_ms, 2),
            "p1_low": round(1000.0 / p1_ms, 2),
            "p01_low": round(1000.0 / p01_ms, 2),
            "frame_count": n,
        }
    except Exception:
        logger.exception("Error reading PresentMon CSV: %s", csv_path)
        return None


def _detect_game_slug(game_path: str, game_name: str) -> str | None:
    """
    Try to detect game slug from PTAT filenames or game name.

    Checks multiple locations for PTAT CSVs, then falls back to
    matching the game name against the known game name map.
    """
    from backend.parsers.game_map import capframex_to_slug

    # Check both trace directory layouts for PTAT CSV filenames
    ptat_dirs = [
        os.path.join(game_path, "traces", "ptat"),
        os.path.join(game_path, "trace-run-ptat"),
    ]
    for ptat_dir in ptat_dirs:
        if os.path.isdir(ptat_dir):
            for fname in os.listdir(ptat_dir):
                if fname.lower().endswith(".csv"):
                    slug = ptat_filename_to_slug(fname)
                    if slug:
                        return slug

    # Fallback: match game_name against known game names (e.g., "Cyberpunk 2077" → "cb2077")
    if game_name:
        slug = capframex_to_slug(game_name, None)
        if slug:
            return slug

    return None


def _read_ingestion_marker(folder_path: str) -> tuple[str, str | None]:
    """
    Read dashboard_ingestion.json marker if it exists.

    Returns (ingestion_state, ingested_build_id).
    """
    marker_path = os.path.join(folder_path, "dashboard_ingestion.json")
    data = _safe_read_json(marker_path)
    if data:
        return "ingested", data.get("build_id")
    return "new", None


def _normalize_sut(sut: dict) -> dict:
    """Extract the SUT fields we care about from a manifest SUT block."""
    if not sut:
        return {
            "hostname": None,
            "ip": None,
            "cpu_brand": None,
            "gpu_short": None,
            "bios_version": None,
        }
    return {
        "hostname": sut.get("hostname"),
        "ip": sut.get("ip"),
        "cpu_brand": sut.get("cpu_brand"),
        "gpu_short": sut.get("gpu_short"),
        "bios_version": sut.get("bios_version"),
    }


def _compute_health(games: list[dict], overall_status: str) -> str:
    """
    Compute a run health indicator.

    green  — all games completed with scores
    yellow — some games completed, some failed or missing scores
    red    — all failed or no games
    gray   — status is unknown / in-progress
    """
    if not games:
        return "gray"

    if overall_status in ("running", "pending", "queued"):
        return "gray"

    completed_with_scores = sum(
        1 for g in games if g["status"] == "completed" and g["has_scores"]
    )
    completed = sum(1 for g in games if g["status"] == "completed")
    failed = sum(1 for g in games if g["status"] == "failed")
    total = len(games)

    if completed_with_scores == total:
        return "green"
    if completed > 0:
        return "yellow"
    if failed == total:
        return "red"
    return "gray"


# ---------------------------------------------------------------------------
# Gametraces scanner
# ---------------------------------------------------------------------------


def _scan_gametraces(path: str, source_id: str) -> list[dict]:
    """
    Scan Gametraces/<Program>/<SKU>/<Build>/ directory structure.

    Each Build folder is treated as one run with multiple games discovered
    from PTAT_logs/*.csv and Presentmon_logs/*.json files.
    """
    runs = []
    try:
        programs = os.listdir(path)
    except OSError:
        return runs

    for program_name in programs:
        program_path = os.path.join(path, program_name)
        if not os.path.isdir(program_path):
            continue

        for sku_name in os.listdir(program_path):
            sku_path = os.path.join(program_path, sku_name)
            if not os.path.isdir(sku_path):
                continue

            for build_name in os.listdir(sku_path):
                build_path = os.path.join(sku_path, build_name)
                if not os.path.isdir(build_path):
                    continue

                try:
                    run = _parse_gametraces_build(
                        program_name, sku_name, build_name, build_path, source_id
                    )
                    if run:
                        runs.append(run)
                except Exception:
                    logger.exception(
                        "Error parsing Gametraces build: %s/%s/%s",
                        program_name, sku_name, build_name,
                    )

    return runs


def _parse_gametraces_build(
    program_name: str,
    sku_name: str,
    build_name: str,
    build_path: str,
    source_id: str,
) -> dict | None:
    """Parse a single Gametraces build folder into a run record."""
    ptat_dir = os.path.join(build_path, "PTAT_logs")
    pm_dir = os.path.join(build_path, "Presentmon_logs")

    has_ptat = os.path.isdir(ptat_dir)
    has_pm = os.path.isdir(pm_dir)

    if not has_ptat and not has_pm:
        return None

    # Discover games from PTAT logs
    games_map: dict[str, dict] = {}  # slug -> game record

    if has_ptat:
        for fname in os.listdir(ptat_dir):
            if not fname.lower().endswith(".csv"):
                continue
            slug = ptat_filename_to_slug(fname)
            game_name = fname.split("_")[0] if "_" in fname else fname.rsplit(".", 1)[0]
            key = slug or game_name.lower()
            if key not in games_map:
                games_map[key] = {
                    "game_name": game_name,
                    "game_slug": slug,
                    "game_path": build_path,
                    "status": "completed",
                    "iterations": 0,
                    "has_scores": False,
                    "scores": None,
                    "traces": {
                        "ptat": False,
                        "presentmon": False,
                        "capframex": False,
                        "emon": False,
                        "socwatch": False,
                    },
                }
            games_map[key]["traces"]["ptat"] = True

    if has_pm:
        for fname in os.listdir(pm_dir):
            if not fname.lower().endswith(".json"):
                continue
            # CapFrameX filenames: CapFrameX-<process>.exe-<date>.json
            pm_game_name = _extract_pm_game_name(fname)
            # Try to find matching slug in existing games; otherwise add new entry
            matched = False
            for key, game in games_map.items():
                if game.get("game_slug") and game["game_slug"] == pm_game_name:
                    game["traces"]["presentmon"] = True
                    matched = True
                    break
            if not matched:
                key = pm_game_name.lower()
                if key not in games_map:
                    games_map[key] = {
                        "game_name": pm_game_name,
                        "game_slug": None,
                        "game_path": build_path,
                        "status": "completed",
                        "iterations": 0,
                        "has_scores": False,
                        "scores": None,
                        "traces": {
                            "ptat": False,
                            "presentmon": False,
                            "capframex": False,
                            "emon": False,
                            "socwatch": False,
                        },
                    }
                games_map[key]["traces"]["presentmon"] = True

    games = list(games_map.values())
    if not games:
        return None

    folder_label = f"{program_name}/{sku_name}/{build_name}"

    return {
        "id": _hash_id(build_path),
        "folder_name": build_name,
        "folder_path": build_path,
        "source_id": source_id,
        "source_type": "gametraces",
        "run_type": "build",
        "created_at": _folder_mtime_iso(build_path),
        "status": "completed",
        "sut": {
            "hostname": None,
            "ip": None,
            "cpu_brand": sku_name,
            "gpu_short": None,
            "bios_version": None,
        },
        "config": {
            "program": program_name,
            "sku": sku_name,
            "build": build_name,
        },
        "games": games,
        "game_count": len(games),
        "ingestion_state": "new",
        "ingested_build_id": None,
        "health": "green" if games else "gray",
    }


def _extract_pm_game_name(filename: str) -> str:
    """
    Extract a human-readable game name from a CapFrameX/PresentMon filename.

    e.g. "CapFrameX-ACMirage.exe-2026-02-19T13479.json" -> "ACMirage"
    """
    base = filename.rsplit(".", 1)[0]  # strip .json
    # Pattern: CapFrameX-<process>.exe-<date>
    if base.startswith("CapFrameX-"):
        base = base[len("CapFrameX-"):]
    # Remove .exe- and everything after
    if ".exe-" in base:
        base = base.split(".exe-")[0]
    elif ".exe" in base:
        base = base.split(".exe")[0]
    return base


# ---------------------------------------------------------------------------
# Custom (flat folder) scanner
# ---------------------------------------------------------------------------


def _scan_custom(path: str, source_id: str) -> list[dict]:
    """
    Scan a flat folder with trace files.

    Each CSV / JSON file is treated as a potential trace belonging to
    a single implicit run.
    """
    games_map: dict[str, dict] = {}

    for fname in os.listdir(path):
        fpath = os.path.join(path, fname)
        if not os.path.isfile(fpath):
            continue
        ext = os.path.splitext(fname)[1].lower()
        if ext not in (".csv", ".json"):
            continue

        slug = ptat_filename_to_slug(fname)
        game_name = fname.rsplit(".", 1)[0]
        key = slug or game_name.lower()

        if key not in games_map:
            games_map[key] = {
                "game_name": game_name,
                "game_slug": slug,
                "game_path": path,
                "status": "unknown",
                "iterations": 0,
                "has_scores": False,
                "scores": None,
                "traces": {
                    "ptat": False,
                    "presentmon": False,
                    "capframex": False,
                    "emon": False,
                    "socwatch": False,
                },
            }

        if ext == ".csv":
            games_map[key]["traces"]["ptat"] = True
        elif ext == ".json":
            games_map[key]["traces"]["presentmon"] = True

    games = list(games_map.values())
    if not games:
        return []

    folder_name = os.path.basename(path)
    return [{
        "id": _hash_id(path),
        "folder_name": folder_name,
        "folder_path": path,
        "source_id": source_id,
        "source_type": "custom",
        "run_type": "custom",
        "created_at": _folder_mtime_iso(path),
        "status": "unknown",
        "sut": {
            "hostname": None,
            "ip": None,
            "cpu_brand": None,
            "gpu_short": None,
            "bios_version": None,
        },
        "config": {},
        "games": games,
        "game_count": len(games),
        "ingestion_state": "new",
        "ingested_build_id": None,
        "health": "gray",
    }]
