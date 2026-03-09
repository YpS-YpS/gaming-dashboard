"""
Parse preview and push-to-database logic for the ingestion pipeline.

Handles:
- parse_preview: Run parsers without writing to DB, return metrics summary
- push: Parse and write to DB, log the ingestion, write marker files
- rollback: Delete data from a past ingestion batch
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

import duckdb

from backend import db
from backend.parsers.registry import get_all_parsers, match_files

log = logging.getLogger(__name__)

MARKER_FILE = "dashboard_ingestion.json"


def _collect_trace_files(game: dict) -> list[str]:
    """Collect all trace file paths from a game entry."""
    source_path = Path(game["source_path"])
    files = []

    # Raptor-X structure
    for subdir in ["traces/ptat", "traces/presentmon"]:
        d = source_path / subdir
        if d.exists():
            files.extend(str(f) for f in d.glob("*") if f.is_file())

    # Gametraces structure
    for subdir in ["PTAT_logs", "Presentmon_logs"]:
        d = source_path / subdir
        if d.exists():
            files.extend(str(f) for f in d.glob("*") if f.is_file())

    # Direct files in source path (custom)
    if not files:
        files.extend(
            str(f) for f in source_path.glob("*")
            if f.is_file() and f.suffix.lower() in (".csv", ".json")
        )

    return files


def _find_system_scope(game: dict) -> Path | None:
    """Find SystemScope JSON near the game folder."""
    source = Path(game["source_path"])

    # Check in game folder
    for f in source.glob("*SystemScope*.json"):
        return f
    for f in source.glob("*systemscope*.json"):
        return f

    # Check parent (campaign root or build root)
    parent = source.parent
    for f in parent.glob("*SystemScope*.json"):
        return f
    for f in parent.glob("*systemscope*.json"):
        return f

    return None


def _read_manifest(game: dict) -> dict | None:
    """Read Raptor-X manifest.json for a game."""
    source = Path(game["source_path"])
    manifest_path = source / "manifest.json"
    if manifest_path.exists():
        try:
            return json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return None


def parse_preview(games: list[dict]) -> list[dict]:
    """
    Run parsers on game files without writing to DB.

    Args:
        games: List of {"game_slug", "source_path", "source_type"}

    Returns:
        List of results per game with parsed summary, chart types, warnings.
    """
    all_parsers = get_all_parsers()
    results = []

    for game in games:
        slug = game["game_slug"]
        trace_files = _collect_trace_files(game)
        matched = match_files(trace_files)

        summary = {}
        chart_types_found = []
        warnings = []
        errors = []
        total_points = 0

        for parser_key, files in matched.items():
            parser = all_parsers.get(parser_key)
            if not parser:
                continue

            try:
                manifest = _read_manifest(game)
                result = parser.parse(files, slug, manifest=manifest)
                if result is None:
                    warnings.append(f"{parser.name}: returned no data")
                    continue

                # Merge summary
                if result.get("summary"):
                    summary.update(result["summary"])

                # Count chart types and data points
                for ct, data in result.get("timeseries", {}).items():
                    chart_types_found.append(ct)
                    total_points += len(data) if isinstance(data, list) else 0

            except Exception as e:
                errors.append(f"{parser.name}: {str(e)}")

        # Validation checks
        if not summary.get("avg_fps") and not summary.get("avg_ia_power"):
            warnings.append("No FPS or power data extracted")
        if summary.get("avg_fps") is not None and summary["avg_fps"] == 0:
            errors.append("FPS is zero — benchmark may not have run")
        if summary.get("max_pkg_temp") and summary["max_pkg_temp"] > 100:
            warnings.append(f"Package temp {summary['max_pkg_temp']:.0f}C exceeds 100C")

        results.append({
            "game_slug": slug,
            "status": "error" if errors else ("warning" if warnings else "ok"),
            "summary": summary,
            "chart_types_found": chart_types_found,
            "total_data_points": total_points,
            "warnings": warnings,
            "errors": errors,
            "parsers_matched": list(matched.keys()),
        })

    return results


def check_conflicts(con: duckdb.DuckDBPyConnection, build_id: str, sku_id: str, game_slugs: list[str]) -> list[dict]:
    """Check which games already exist in the DB."""
    conflicts = []
    for slug in game_slugs:
        row = con.execute(
            "SELECT avg_fps, one_pct_low, avg_ia_power, max_pkg_temp "
            "FROM game_summary WHERE build_id = ? AND sku_id = ? AND game_slug = ?",
            [build_id, sku_id, slug],
        ).fetchone()
        if row:
            conflicts.append({
                "game_slug": slug,
                "existing": {
                    "avg_fps": row[0], "one_pct_low": row[1],
                    "avg_ia_power": row[2], "max_pkg_temp": row[3],
                },
            })
    return conflicts


def push_games(
    con: duckdb.DuckDBPyConnection,
    build_id: str,
    sku_id: str,
    build_type: str,
    parent_bkc: str | None,
    experiment_label: str | None,
    games: list[dict],
    on_progress=None,
) -> dict:
    """
    Parse and write games to the database.

    Args:
        con: DuckDB connection (writable)
        build_id, sku_id, build_type, parent_bkc, experiment_label: Build metadata
        games: List of {"game_slug", "source_path", "source_type", "conflict_resolution"}
        on_progress: Optional callback(game_slug, step, progress_pct)

    Returns:
        {"ingestion_id", "games_written", "games_skipped", "errors", "chart_types"}
    """
    all_parsers = get_all_parsers()
    ingestion_id = f"ing-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"

    games_written = []
    games_skipped = []
    game_errors = []
    all_chart_types = set()
    source_paths = set()

    for i, game in enumerate(games):
        slug = game["game_slug"]
        resolution = game.get("conflict_resolution", "overwrite")

        if on_progress:
            on_progress(slug, "starting", i / len(games))

        # Check conflict resolution
        if resolution == "skip":
            existing = con.execute(
                "SELECT 1 FROM game_summary WHERE build_id = ? AND sku_id = ? AND game_slug = ?",
                [build_id, sku_id, slug],
            ).fetchone()
            if existing:
                games_skipped.append(slug)
                continue

        try:
            trace_files = _collect_trace_files(game)
            matched = match_files(trace_files)

            merged_summary = {
                "build_id": build_id,
                "sku_id": sku_id,
                "game_slug": slug,
                "build_type": build_type,
                "parent_bkc": parent_bkc,
                "experiment_label": experiment_label,
            }

            if on_progress:
                on_progress(slug, "parsing", (i + 0.3) / len(games))

            for parser_key, files in matched.items():
                parser = all_parsers.get(parser_key)
                if not parser:
                    continue

                manifest = _read_manifest(game)
                result = parser.parse(files, slug, manifest=manifest)
                if result is None:
                    continue

                # Merge summary fields
                if result.get("summary"):
                    merged_summary.update(result["summary"])

                # Merge system_info fields
                sys_info = result.get("system_info", {})
                if sys_info:
                    for field in ["cpu_brand", "firmware", "gpu", "os", "motherboard"]:
                        if field in sys_info and field not in merged_summary:
                            merged_summary[field] = sys_info[field]

                # Write timeseries
                for chart_type, data in result.get("timeseries", {}).items():
                    if data:
                        db.upsert_timeseries(con, build_id, sku_id, slug, chart_type, data)
                        all_chart_types.add(chart_type)

            if on_progress:
                on_progress(slug, "writing_summary", (i + 0.7) / len(games))

            # Write summary
            db.upsert_summary(con, merged_summary)

            # Handle SystemScope
            sys_scope_path = _find_system_scope(game)
            if sys_scope_path:
                from backend.parsers.system_scope import parse_system_scope
                scope_data = parse_system_scope(sys_scope_path)
                if scope_data:
                    db.upsert_system_scope(con, build_id, sku_id, scope_data)

            games_written.append(slug)
            source_paths.add(game["source_path"])

            if on_progress:
                on_progress(slug, "done", (i + 1) / len(games))

        except Exception as e:
            log.error("Failed to ingest %s: %s", slug, e, exc_info=True)
            game_errors.append({"game_slug": slug, "error": str(e)})

    # Write ingestion log
    log_entry = {
        "id": ingestion_id,
        "pushed_at": datetime.now(timezone.utc).isoformat(),
        "build_id": build_id,
        "sku_id": sku_id,
        "build_type": build_type,
        "parent_bkc": parent_bkc,
        "experiment_label": experiment_label,
        "games": json.dumps(games_written),
        "game_count": len(games_written),
        "source_paths": json.dumps(list(source_paths)),
        "chart_types": json.dumps(sorted(all_chart_types)),
        "status": "completed" if not game_errors else "partial",
    }
    db.insert_ingestion_log(con, log_entry)

    return {
        "ingestion_id": ingestion_id,
        "games_written": games_written,
        "games_skipped": games_skipped,
        "errors": game_errors,
        "chart_types": sorted(all_chart_types),
    }


def write_marker(source_path: str, build_id: str, sku_id: str, ingestion_id: str, game_slugs: list[str]) -> None:
    """Write dashboard_ingestion.json marker to the source run folder."""
    marker_path = Path(source_path) / MARKER_FILE
    marker = {
        "ingestion_id": ingestion_id,
        "build_id": build_id,
        "sku_id": sku_id,
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "games_ingested": game_slugs,
    }
    try:
        marker_path.write_text(json.dumps(marker, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning("Failed to write marker to %s: %s", marker_path, e)
