"""FastAPI routes for the ingestion pipeline — /api/ingestion/*"""

import os
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from backend import db
from backend.ingestion.scanner import scan_source, get_run_files, read_file_content
from backend.ingestion.push import parse_preview, check_conflicts, push_games, write_marker
from backend.parsers.registry import get_all_parsers

router = APIRouter(prefix="/api/ingestion")


# ── Pydantic request models ─────────────────────────────────────────────────

class AddSourceRequest(BaseModel):
    label: str
    path: str
    source_type: str  # "raptor-x" | "gametraces" | "custom"


class ScanRequest(BaseModel):
    source_ids: list[str] | None = None
    force: bool = False  # bypass incremental cache, do full rescan


class GamePreviewItem(BaseModel):
    game_slug: str
    source_path: str
    source_type: str
    manual_fps: float | None = None


class ParsePreviewRequest(BaseModel):
    games: list[GamePreviewItem]


class PushGameItem(BaseModel):
    game_slug: str
    source_path: str
    source_type: str
    conflict_resolution: str = "overwrite"  # "overwrite" | "skip"
    manual_fps: float | None = None


class PushRequest(BaseModel):
    build_id: str
    sku_id: str
    build_type: str = "bkc"
    parent_bkc: str | None = None
    experiment_label: str | None = None
    notes: str | None = None
    games: list[PushGameItem]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_db_read(request: Request):
    """Return a cursor for the read DB connection from app state."""
    con = getattr(request.app.state, "db", None)
    if con is None:
        raise HTTPException(status_code=503, detail="Read database not available")
    return con.cursor()


def _get_db_write(request: Request):
    """Return a cursor for the writable DB connection (thread-safe)."""
    con = getattr(request.app.state, "db_write", None)
    if con is None:
        # Attempt lazy initialisation
        from backend.main import init_db_write
        con = init_db_write()
    if con is None:
        raise HTTPException(status_code=503, detail="Writable database not available")
    return con.cursor()


def _scan_source_incremental(source: dict, cached_map: dict) -> tuple[list[dict], dict]:
    """
    Scan a source incrementally.

    If no folders changed since last scan, returns cached data.
    If any folders are new/changed/removed, does a full rescan and updates cache.

    cached_map: {folder_path: {folder_mtime, scanned_at, run_data}} from DB
    Returns (runs, stats) where stats = {new: int, updated: int, cached: int}
    """
    source_path = source.get("path", "")

    if not os.path.isdir(source_path):
        return [], {"new": 0, "updated": 0, "cached": 0}

    # List subfolders on disk and get their mtimes
    disk_folders = {}
    try:
        for entry in os.listdir(source_path):
            fp = os.path.join(source_path, entry)
            if os.path.isdir(fp):
                try:
                    disk_folders[fp] = os.path.getmtime(fp)
                except OSError:
                    disk_folders[fp] = 0.0
    except OSError:
        return [], {"new": 0, "updated": 0, "cached": 0}

    # Check if anything changed
    new_folders = set()
    changed_folders = set()

    for fp, mtime in disk_folders.items():
        cached = cached_map.get(fp)
        if cached is None:
            new_folders.add(fp)
        elif cached["folder_mtime"] is None or mtime > cached["folder_mtime"]:
            changed_folders.add(fp)

    removed = set(cached_map.keys()) - set(disk_folders.keys())

    # If nothing changed, return cached data
    if not new_folders and not changed_folders and not removed:
        runs = [entry["run_data"] for entry in cached_map.values()]
        return runs, {"new": 0, "updated": 0, "cached": len(runs)}

    # Something changed — do a full rescan of this source
    fresh_runs = scan_source(source)

    # Tag new runs
    fresh_paths = set()
    for run in fresh_runs:
        fp = run.get("folder_path", "")
        fresh_paths.add(fp)
        if fp in new_folders:
            run["_is_new"] = True

    return fresh_runs, {
        "new": len(new_folders & fresh_paths),
        "updated": len(changed_folders & fresh_paths),
        "cached": 0,
    }


# ── 1. GET /sources — list saved sources ─────────────────────────────────────

@router.get("/sources")
def list_sources(request: Request):
    """List all saved ingestion sources."""
    try:
        con = _get_db_write(request)
        return db.list_sources(con)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. POST /sources — add new source ───────────────────────────────────────

@router.post("/sources")
def add_source(body: AddSourceRequest, request: Request):
    """Add a new ingestion source. Validates that the path exists on disk."""
    if not os.path.isdir(body.path):
        raise HTTPException(status_code=400, detail=f"Path does not exist or is not a directory: {body.path}")

    source_id = f"src-{uuid.uuid4().hex[:12]}"
    try:
        con = _get_db_write(request)
        db.add_source(con, source_id, body.label, body.path, body.source_type)
        return {"id": source_id, "label": body.label, "path": body.path, "source_type": body.source_type}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. DELETE /sources/{source_id} — remove source ──────────────────────────

@router.delete("/sources/{source_id}")
def delete_source(source_id: str, request: Request):
    """Remove a saved ingestion source."""
    try:
        con = _get_db_write(request)
        db.delete_source(con, source_id)
        db.delete_cached_runs_for_source(con, source_id)
        return {"deleted": source_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── NEW: GET /runs — return cached runs ──────────────────────────────────

@router.get("/runs")
def get_cached_runs(request: Request):
    """Return cached discovered runs from the database (no filesystem scan)."""
    try:
        con = _get_db_write(request)
        cached = db.list_cached_runs(con)
        runs = [entry["run_data"] for entry in cached]
        # Sort newest first
        runs.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        total_games = sum(r.get("game_count", 0) for r in runs)
        meta = db.get_cache_metadata(con)
        return {
            "runs": runs,
            "total_runs": len(runs),
            "total_games": total_games,
            "cached": True,
            "last_scanned": meta["last_scanned"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. POST /scan — scan sources, return discovered runs ────────────────────

@router.post("/scan")
def scan_sources(body: ScanRequest, request: Request):
    """Scan sources incrementally — only rescans new or changed folders."""
    try:
        con = _get_db_write(request)
        all_sources = db.list_sources(con)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Filter to requested source IDs, or use all
    if body.source_ids:
        sources = [s for s in all_sources if s["id"] in body.source_ids]
    else:
        sources = all_sources

    if not sources:
        return {"runs": [], "errors": [], "new_runs": 0, "updated_runs": 0}

    all_runs = []
    errors = []
    new_count = 0
    updated_count = 0

    for source in sources:
        try:
            cached_map = {}
            if body.force:
                # Force full rescan — scan first, then clear cache (safe if scan throws)
                runs = scan_source(source)
                db.delete_cached_runs_for_source(con, source["id"])
                stats = {"new": len(runs), "updated": 0, "cached": 0}
            else:
                cached_map = db.get_cached_runs_for_source(con, source["id"])
                runs, stats = _scan_source_incremental(source, cached_map)

            # Update cache in DB
            for run in runs:
                folder_path = run.get("folder_path", "")
                if folder_path:
                    try:
                        mtime = os.path.getmtime(folder_path)
                    except OSError:
                        mtime = 0.0
                    db.upsert_cached_run(con, folder_path, source["id"], mtime, run)

            # Remove stale entries (folders that no longer exist) — skip when force (cache was already cleared)
            if not body.force:
                current_paths = {r.get("folder_path", "") for r in runs}
                stale_paths = [p for p in cached_map if p not in current_paths]
                if stale_paths:
                    db.delete_cached_runs(con, stale_paths)

            all_runs.extend(runs)
            new_count += stats["new"]
            updated_count += stats["updated"]
        except Exception as e:
            errors.append({"source_id": source["id"], "error": str(e)})

    # Sort by date descending
    all_runs.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    total_games = sum(r.get("game_count", 0) for r in all_runs)

    meta = db.get_cache_metadata(con)

    return {
        "runs": all_runs,
        "errors": errors,
        "total_runs": len(all_runs),
        "total_games": total_games,
        "new_runs": new_count,
        "updated_runs": updated_count,
        "last_scanned": meta["last_scanned"],
    }


# ── 5. GET /runs/files — list files in a run folder ─────────────────────────

@router.get("/runs/files")
def list_run_files(path: str = Query(..., description="Absolute path to a run folder")):
    """List all files in a run folder with metadata."""
    if not os.path.isdir(path):
        raise HTTPException(status_code=404, detail=f"Directory not found: {path}")
    try:
        return get_run_files(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 6. GET /runs/file — read a specific file ────────────────────────────────

@router.get("/runs/file")
def read_run_file(path: str = Query(..., description="Absolute path to a file")):
    """Read a specific file and return structured content."""
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    try:
        return read_file_content(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 7. POST /parse-preview — run parsers without writing ────────────────────

@router.post("/parse-preview")
def run_parse_preview(body: ParsePreviewRequest):
    """Run parsers on selected games without writing to DB. Returns metrics summary."""
    games = [g.model_dump() for g in body.games]
    try:
        results = parse_preview(games)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 8. GET /conflicts — check existing data ─────────────────────────────────

@router.get("/conflicts")
def get_conflicts(
    request: Request,
    build_id: str = Query(...),
    sku_id: str = Query(...),
    game_slugs: str = Query(..., description="Comma-separated game slugs"),
):
    """Check which games already have data in the DB for a build+sku."""
    slugs = [s.strip() for s in game_slugs.split(",") if s.strip()]
    if not slugs:
        return []
    try:
        con = _get_db_write(request)
        return check_conflicts(con, build_id, sku_id, slugs)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 9. POST /push — parse and write to DB ───────────────────────────────────

@router.post("/push")
def push_data(body: PushRequest, request: Request):
    """Parse game files and write results to the database."""
    con = _get_db_write(request)
    games = [g.model_dump() for g in body.games]

    try:
        result = push_games(
            con=con,
            build_id=body.build_id,
            sku_id=body.sku_id,
            build_type=body.build_type,
            parent_bkc=body.parent_bkc,
            experiment_label=body.experiment_label,
            games=games,
            notes=body.notes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Clear the response cache so new data is picked up
    cache = getattr(request.app.state, "cache", None)
    if cache is not None:
        cache.clear()

    # Write ingestion markers to source folders
    source_paths_seen = set()
    for game in games:
        sp = game["source_path"]
        if sp not in source_paths_seen:
            source_paths_seen.add(sp)
            try:
                write_marker(
                    source_path=sp,
                    build_id=body.build_id,
                    sku_id=body.sku_id,
                    ingestion_id=result["ingestion_id"],
                    game_slugs=result["games_written"],
                )
            except Exception:
                pass  # marker write is best-effort

    return result


# ── 10. GET /history — list past ingestion log entries ───────────────────────

@router.get("/history")
def get_history(request: Request):
    """List all past ingestion log entries."""
    try:
        con = _get_db_write(request)
        return db.list_ingestion_log(con)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 11. DELETE /history/{ingestion_id}/rollback — rollback an ingestion ──────

@router.delete("/history/{ingestion_id}/rollback")
def rollback(ingestion_id: str, request: Request):
    """Roll back an ingestion, deleting all data written by that batch."""
    con = _get_db_write(request)
    try:
        result = db.rollback_ingestion(con, ingestion_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    # Clear cache after rollback
    cache = getattr(request.app.state, "cache", None)
    if cache is not None:
        cache.clear()

    return result


# ── 12. GET /parsers — list registered parser plugins ────────────────────────

@router.get("/parsers")
def list_parsers():
    """List all registered parser plugins with their capabilities."""
    parsers = get_all_parsers()
    return [
        {
            "key": p.key,
            "name": p.name,
            "file_patterns": p.file_patterns,
            "chart_types": p.chart_types,
            "summary_fields": p.summary_fields,
        }
        for p in parsers.values()
    ]
