# Automation Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bridge Raptor-X automation output to the gaming dashboard — new PresentMon CSV parser, interactive ingestion wizard, DB schema update for BKC/experiment branches, build tree API endpoint, and collapsible left sidebar with branch visualization.

**Architecture:** Automation logs stay in-place (no copying). New `ingest_run.py` reads manifests + traces directly, writes to DuckDB. DB gets 2 new columns (`build_type`, `parent_bkc`). New `/api/build-tree` endpoint. Frontend sidebar moves from top to collapsible left rail with git-branch style build tree.

**Tech Stack:** Python (FastAPI, DuckDB, Polars, NumPy), React 18, Tailwind CSS, Recharts, Lucide icons

**Design Doc:** `docs/plans/2026-03-07-automation-integration-design.md`

---

## Phase 1: Backend — Parser & DB Changes

### Task 1: PresentMon CSV Parser

**Files:**
- Create: `backend/parsers/presentmon_csv.py`
- Modify: `backend/parsers/__init__.py` (add export)

**Step 1: Create the PresentMon CSV parser**

This parser reads PresentMon CSV files (automation output) and produces the same output shape as `capframex.py`. Reference `backend/parsers/capframex.py` for the expected return structure.

```python
"""
PresentMon CSV parser for Raptor-X automation output.
Produces the same output shape as capframex.py for dashboard compatibility.

PresentMon CSV columns used:
  Application, TimeInMs, MsBetweenPresents, MsGPUBusy, MsCPUBusy, FrameType
"""

import csv
from pathlib import Path

import numpy as np

from .game_map import capframex_to_slug


def _percentile_fps(frame_times_ms: list[float], p: float) -> float:
    if not frame_times_ms:
        return 0.0
    pct_ft = float(np.percentile(frame_times_ms, p))
    return round(1000.0 / pct_ft, 1) if pct_ft > 0 else 0.0


def _build_frametimes(frame_times_ms: list[float]) -> list[dict]:
    if not frame_times_ms:
        return []
    arr = np.array(frame_times_ms, dtype=float)
    avg_ft = round(float(arr.mean()), 3)
    p95_ft = round(float(np.percentile(arr, 95)), 3)
    p99_ft = round(float(np.percentile(arr, 99)), 3)
    result = []
    for i in range(len(arr)):
        ft = float(arr[i])
        result.append({
            "frame": i,
            "frameTime": round(ft, 3),
            "fps": round(1000.0 / ft, 1) if ft > 0 else 0,
            "movingAvg": avg_ft,
            "percentile95": p95_ft,
            "percentile99": p99_ft,
        })
    return result


def parse_presentmon_csv(filepath: str | Path, manifest: dict | None = None) -> dict | None:
    """
    Parse a PresentMon CSV file from Raptor-X automation.

    Args:
        filepath: Path to the presentmon_*.csv file
        manifest: Optional manifest.json dict for SUT metadata (gpu, os, motherboard)

    Returns dict matching capframex.py output shape, or None if unmappable.
    """
    filepath = Path(filepath)

    # Read CSV
    rows = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    if not rows:
        return None

    # Identify game from Application column (process name)
    process_name = rows[0].get("Application", "")
    # PresentMon uses full exe name; strip .exe for lookup
    game_slug = capframex_to_slug("", process_name)
    if not game_slug:
        print(f"  [WARN] PresentMon CSV: could not map process {process_name!r}")
        return None

    # Extract frame times (filter Application frames only)
    frame_times: list[float] = []
    gpu_active: list[float] = []
    cpu_active: list[float] = []

    for row in rows:
        # Only count Application frames (skip compositor/dwm frames)
        frame_type = row.get("FrameType", "Application")
        if frame_type and frame_type != "Application":
            continue

        ft_str = row.get("MsBetweenPresents", "")
        try:
            ft = float(ft_str)
            if ft > 0:
                frame_times.append(ft)
        except (ValueError, TypeError):
            continue

        gpu_str = row.get("MsGPUBusy", "")
        try:
            gpu_active.append(float(gpu_str))
        except (ValueError, TypeError):
            pass

        cpu_str = row.get("MsCPUBusy", "")
        try:
            cpu_active.append(float(cpu_str))
        except (ValueError, TypeError):
            pass

    if not frame_times:
        return None

    arr = np.array(frame_times, dtype=float)

    avg_fps = round(1000.0 / float(arr.mean()), 1)
    one_pct_low = _percentile_fps(frame_times, 99)
    zero_one_pct_low = _percentile_fps(frame_times, 99.9)
    max_fps = round(1000.0 / float(arr.min()), 1) if arr.min() > 0 else 0
    min_fps = round(1000.0 / float(arr.max()), 1) if arr.max() > 0 else 0

    avg_gpu_active_ms = round(float(np.mean(gpu_active)), 2) if gpu_active else 0.0
    avg_cpu_active_ms = round(float(np.mean(cpu_active)), 2) if cpu_active else 0.0

    # Extract SUT info from manifest if available
    sut = manifest.get("sut", {}) if manifest else {}

    return {
        "game_slug": game_slug,
        "info": {
            "game_name": "",  # PresentMon CSV doesn't have game name, just process
            "process_name": process_name,
            "gpu": sut.get("gpu_name", ""),
            "motherboard": "",  # Not in PresentMon CSV, could come from SystemScope
            "os": f"{sut.get('os_name', '')} {sut.get('os_version', '')}".strip(),
            "creation_date": manifest.get("created_at", "") if manifest else "",
            "app_version": "",
            "total_frames": len(frame_times),
        },
        "summary": {
            "avg_fps": avg_fps,
            "one_pct_low": one_pct_low,
            "zero_one_pct_low": zero_one_pct_low,
            "max_fps": max_fps,
            "min_fps": min_fps,
            "avg_gpu_active_ms": avg_gpu_active_ms,
            "avg_cpu_active_ms": avg_cpu_active_ms,
            "avg_frame_time_ms": round(float(arr.mean()), 3),
            "p95_frame_time_ms": round(float(np.percentile(arr, 95)), 3),
            "p99_frame_time_ms": round(float(np.percentile(arr, 99)), 3),
        },
        "frametimes": _build_frametimes(frame_times),
    }
```

**Step 2: Verify parser works on real data**

Run:
```bash
cd D:/code/gaming-dashboard
python -c "
from backend.parsers.presentmon_csv import parse_presentmon_csv
result = parse_presentmon_csv('C:/Users/Local_Admin/Documents/Raptor-X/rpx-core/logs/runs/2026-03-05_133134_campaign_ACM-BMW-C2-+9_high-1080p_0000_192-168-0-106/Assassin'\''s-Creed-Mirage/traces/presentmon/presentmon_assassins-creed-mirage_192-168-0-106_05-03-2026_141323.csv')
if result:
    print(f'Game: {result[\"game_slug\"]}')
    print(f'Avg FPS: {result[\"summary\"][\"avg_fps\"]}')
    print(f'1% Low: {result[\"summary\"][\"one_pct_low\"]}')
    print(f'Frames: {len(result[\"frametimes\"])}')
else:
    print('FAILED: returned None')
"
```
Expected: Game slug, FPS metrics, and frame count printed.

**Step 3: Commit**
```bash
git add backend/parsers/presentmon_csv.py
git commit -m "feat: add PresentMon CSV parser for automation output"
```

---

### Task 2: Game Map Updates for Automation

**Files:**
- Modify: `backend/parsers/game_map.py`

**Step 1: Add automation game slug mappings**

The automation uses PresentMon CSVs where the `Application` column has the exe name. Some exe names already exist in `CAPFRAMEX_PROCESS_TO_SLUG`. Check which games from automation runs need new mappings.

Automation games and their process names (from PresentMon CSV `Application` column):
- `ACMirage.exe` -> already mapped to `ac-mirage`
- `b1-Win64-Shipping.exe` -> already mapped to `wukong`
- `Cyberpunk2077.exe` -> already mapped to `cb2077`
- `F1_24.exe` -> already mapped to `f1-24`
- `FarCry6.exe` -> already mapped to `far-cry-6`
- `ffxiv_dx11.exe` -> already mapped to `ffxiv`
- `HITMAN3.exe` -> already mapped to `hitman3`
- `HorizonZeroDawnRemastered.exe` -> already mapped to `hzd`
- `RDR2.exe` -> already mapped to `rdr2`
- `SOTTR.exe` -> already mapped to `sotr`
- `CivilizationVI_DX12.exe` -> already mapped to `civ6`
- `Wonderlands.exe` -> already mapped to `tiny-tina`
- `cs2.exe` -> already mapped to `cs2`

Also add automation PTAT filename prefix mappings. The automation PTAT files use slugged names like `ptat_assassins-creed-mirage_*.csv`:

Add to `PTAT_FILENAME_PREFIX_TO_SLUG` in `backend/parsers/game_map.py`:
```python
    # Automation PTAT filename slugs
    "ptat_assassins-creed-mirage":      "ac-mirage",
    "ptat_black-myth-wukong":           "wukong",
    "ptat_cyberpunk-2077":              "cb2077",
    "ptat_f1-24":                       "f1-24",
    "ptat_far-cry-6":                   "far-cry-6",
    "ptat_final-fantasy-xiv":           "ffxiv",
    "ptat_hitman-3":                    "hitman3",
    "ptat_horizon-zero-dawn":           "hzd",
    "ptat_red-dead-redemption":         "rdr2",
    "ptat_shadow-of-the-tomb-raider":   "sotr",
    "ptat_sid-meiers-civilization":      "civ6",
    "ptat_tiny-tina":                   "tiny-tina",
    "ptat_counter-strike":              "cs2",
```

**Step 2: Verify mappings**

Run:
```bash
python -c "
from backend.parsers.game_map import ptat_filename_to_slug, capframex_to_slug
# Test automation PTAT filename
print(ptat_filename_to_slug('ptat_assassins-creed-mirage_192-168-0-106_05-03-2026_141324.csv'))
# Test PresentMon process name
print(capframex_to_slug('', 'ffxiv_dx11.exe'))
"
```
Expected: `ac-mirage` and `ffxiv`

**Step 3: Commit**
```bash
git add backend/parsers/game_map.py
git commit -m "feat: add automation PTAT filename mappings to game_map"
```

---

### Task 3: SKU Map Updates

**Files:**
- Modify: `backend/parsers/sku_map.py`

**Step 1: Verify existing SKU mappings work for automation**

The automation PTAT CSVs have `CPU Name` = `NVL S` (same as manual data). Existing mapping `"NVL S": "nvl-s"` works, but the dashboard program.json uses `nvl-sk-28c` not `nvl-s`.

We need a mapping from the PTAT SKU ID to the dashboard SKU ID. This can be handled in the ingestion wizard (user confirms/overrides SKU), OR we add the dashboard SKU IDs directly.

Add dashboard SKU IDs to `PTAT_CPU_NAME_TO_SKU`:
```python
    # Dashboard SKU IDs (used by program.json)
    "NVL S K 28C":        "nvl-sk-28c",
    "NVL S K 52C":        "nvl-sk-52c",
```

And a mapping from short PTAT SKU to dashboard SKU IDs:
```python
# Short PTAT SKU -> full dashboard SKU ID (used by ingestion wizard)
PTAT_SKU_TO_DASHBOARD_SKU: dict[str, list[str]] = {
    "nvl-s":        ["nvl-sk-28c", "nvl-sk-28c-bllc", "nvl-sk-52c", "nvl-sk-52c-bllc"],
    "nvl-s-bllc":   ["nvl-sk-28c-bllc", "nvl-sk-52c-bllc"],
    "arl-s":        ["arl-s"],
    "arl-hx":       ["arl-hx"],
    "arl-h":        ["arl-h"],
    "ptl-u":        ["ptl-u"],
    "ptl-h":        ["ptl-h"],
}
```

**Step 2: Commit**
```bash
git add backend/parsers/sku_map.py
git commit -m "feat: add dashboard SKU ID mappings to sku_map"
```

---

### Task 4: Database Schema Update

**Files:**
- Modify: `backend/db.py`

**Step 1: Add build_type and parent_bkc columns**

In `backend/db.py`, update the `game_summary` CREATE TABLE to include:
```python
            -- Build classification
            build_type          TEXT DEFAULT 'bkc',      -- 'bkc' or 'experiment'
            parent_bkc          TEXT,                     -- NULL for BKC, parent build_id for experiments
```

Add these after the `motherboard TEXT,` line (before `created_at`).

Also update `upsert_summary` to include the 2 new columns in the INSERT statement. Add after `row.get("motherboard", "")`:
```python
        row.get("build_type", "bkc"),
        row.get("parent_bkc"),
```

And update the VALUES placeholder count accordingly (add 2 more `?` marks).

**Step 2: Verify schema compiles**
```bash
python -c "from backend.db import init_schema; print('Schema OK')"
```

**Step 3: Commit**
```bash
git add backend/db.py
git commit -m "feat: add build_type and parent_bkc columns to game_summary"
```

---

### Task 5: Build Tree API Endpoint

**Files:**
- Modify: `backend/main.py`

**Step 1: Add /api/build-tree endpoint**

Add after the existing `/api/builds` endpoint in `backend/main.py`:

```python
@app.get("/api/build-tree")
def get_build_tree(sku_id: Optional[str] = Query(None)):
    """Return builds organized as BKC + experiment branches."""
    def _fetch():
        if not DEFAULT_DB_PATH.exists():
            return []
        con = _get_db()

        # Get all builds with their type and parent
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

        for build_id, build_type, parent_bkc, game_count in rows:
            if build_type == "experiment" and parent_bkc:
                experiments.append({
                    "build_id": build_id,
                    "game_count": game_count,
                    "parent_bkc": parent_bkc,
                })
            else:
                bkc_map[build_id] = {
                    "build_id": build_id,
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
                # Orphan experiment (parent BKC not in DB) — show as standalone
                bkc_map[exp["build_id"]] = {
                    "build_id": exp["build_id"],
                    "type": "experiment",
                    "game_count": exp["game_count"],
                    "parent_bkc": parent,
                    "experiments": [],
                }

        return list(bkc_map.values())

    return _cached(f"build-tree:{sku_id}", _fetch)
```

**Step 2: Verify endpoint**
```bash
# Start backend, then:
curl http://localhost:9001/api/build-tree?sku_id=nvl-sk-28c
```
Expected: JSON array with BKC builds (existing data will show as `type: "bkc"` with empty experiments).

**Step 3: Commit**
```bash
git add backend/main.py
git commit -m "feat: add /api/build-tree endpoint for BKC/experiment hierarchy"
```

---

## Phase 2: Ingestion Wizard

### Task 6: Interactive Ingestion Wizard

**Files:**
- Create: `backend/etl/ingest_run.py`

**Step 1: Create the ingestion wizard**

This is the largest single file. It needs to:
1. Scan Raptor-X logs directory
2. Load ingestion log to filter already-ingested runs
3. Display runs interactively
4. For each selected run: read manifest, parse SystemScope, parse traces, write to DB
5. Save ingestion log

```python
"""
Interactive ingestion wizard for Raptor-X automation runs.

Usage:
    python -m backend.etl.ingest_run
    python -m backend.etl.ingest_run --logs-path "C:/custom/path/to/runs"
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.db import DEFAULT_DB_PATH, init_schema, get_connection, upsert_summary, upsert_timeseries, upsert_system_scope
from backend.parsers.ptat import parse_ptat
from backend.parsers.presentmon_csv import parse_presentmon_csv
from backend.parsers.system_scope import parse_system_scope
from backend.parsers.sku_map import cpu_name_to_sku_id, PTAT_SKU_TO_DASHBOARD_SKU

DEFAULT_LOGS_PATH = Path(r"C:\Users\Local_Admin\Documents\Raptor-X\rpx-core\logs\runs")
INGESTION_LOG_PATH = Path(__file__).parent / "ingestion_log.json"


def load_ingestion_log() -> dict:
    if INGESTION_LOG_PATH.exists():
        with open(INGESTION_LOG_PATH, "r") as f:
            return json.load(f)
    return {"version": "1.0", "ingested_runs": {}}


def save_ingestion_log(log: dict):
    with open(INGESTION_LOG_PATH, "w") as f:
        json.dump(log, f, indent=2, default=str)


def discover_runs(logs_path: Path) -> list[dict]:
    """Scan logs directory and return run metadata."""
    runs = []
    for entry in sorted(logs_path.iterdir()):
        if not entry.is_dir():
            continue
        # Skip non-run directories
        if entry.name in ("build", ".claude"):
            continue
        if entry.name.endswith(".json"):
            continue

        # Check for campaign
        campaign_manifest = entry / "campaign_manifest.json"
        if campaign_manifest.exists():
            with open(campaign_manifest, "r") as f:
                cm = json.load(f)
            # Count game subfolders
            game_dirs = [d for d in entry.iterdir() if d.is_dir() and (d / "manifest.json").exists()]
            runs.append({
                "path": entry,
                "folder_name": entry.name,
                "type": "campaign",
                "campaign_name": cm.get("campaign_name", ""),
                "status": cm.get("status", "unknown"),
                "created_at": cm.get("created_at", ""),
                "sut_ip": cm.get("sut_ip", ""),
                "game_count": len(game_dirs),
                "game_dirs": game_dirs,
            })
            continue

        # Check for single run
        manifest_file = entry / "manifest.json"
        if manifest_file.exists():
            with open(manifest_file, "r") as f:
                m = json.load(f)
            runs.append({
                "path": entry,
                "folder_name": entry.name,
                "type": "single",
                "campaign_name": "",
                "status": m.get("status", "unknown"),
                "created_at": m.get("created_at", ""),
                "sut_ip": m.get("sut", {}).get("ip", ""),
                "game_count": 1,
                "games": m.get("config", {}).get("games", []),
                "manifest": m,
            })

    return runs


def parse_game_run(run_dir: Path, manifest: dict | None, build_id: str, sku_id: str,
                   build_type: str, parent_bkc: str | None,
                   con, db_path: Path) -> bool:
    """Parse and ingest a single game's traces from a run directory."""
    # Find trace files
    ptat_dir = run_dir / "traces" / "ptat"
    pm_dir = run_dir / "traces" / "presentmon"

    ptat_files = sorted(ptat_dir.glob("*.csv")) if ptat_dir.exists() else []
    pm_files = sorted(pm_dir.glob("*.csv")) if pm_dir.exists() else []

    if not ptat_files and not pm_files:
        return False

    fps_result = None
    ptat_result = None

    # Parse PresentMon
    for fp in pm_files:
        try:
            fps_result = parse_presentmon_csv(fp, manifest)
            if fps_result:
                break
        except Exception as e:
            print(f"    [ERROR] PresentMon parse: {e}")

    # Parse PTAT
    for fp in ptat_files:
        try:
            ptat_result = parse_ptat(fp)
            if ptat_result:
                break
        except Exception as e:
            print(f"    [ERROR] PTAT parse: {e}")

    if not fps_result and not ptat_result:
        return False

    slug = (fps_result or ptat_result).get("game_slug")
    if not slug:
        return False

    # Build merged summary row
    row = {
        "build_id": build_id,
        "sku_id": sku_id,
        "game_slug": slug,
        "build_type": build_type,
        "parent_bkc": parent_bkc,
    }

    if fps_result:
        row.update(fps_result["summary"])
        row["gpu"] = fps_result["info"].get("gpu", "")
        row["os"] = fps_result["info"].get("os", "")
        row["motherboard"] = fps_result["info"].get("motherboard", "")

    if ptat_result:
        row.update(ptat_result["summary"])
        row["cpu_brand"] = ptat_result["system_info"].get("cpu_brand", "")
        row["firmware"] = ptat_result.get("firmware", "")

    try:
        upsert_summary(con, row)
    except Exception as e:
        print(f"    [ERROR] DB write for {slug}: {e}")
        return False

    # Write timeseries
    if fps_result:
        upsert_timeseries(con, build_id, sku_id, slug, "frametimes", fps_result["frametimes"])
    if ptat_result:
        for chart_type, data in ptat_result["timeseries"].items():
            upsert_timeseries(con, build_id, sku_id, slug, chart_type, data)

    print(f"    [OK] {slug} -> {sku_id} @ {build_id} ({build_type})")
    return True


def prompt_choice(prompt: str, options: list[str], default: int = 0) -> int:
    """Interactive choice prompt. Returns 0-based index."""
    for i, opt in enumerate(options):
        marker = "*" if i == default else " "
        print(f"  {marker} [{i + 1}] {opt}")
    while True:
        raw = input(f"{prompt} [{default + 1}]: ").strip()
        if not raw:
            return default
        try:
            idx = int(raw) - 1
            if 0 <= idx < len(options):
                return idx
        except ValueError:
            pass
        print(f"  Please enter 1-{len(options)}")


def run_wizard(logs_path: Path, db_path: Path):
    print(f"\n{'='*60}")
    print(f"  Intel Gaming Dashboard - Ingestion Wizard")
    print(f"{'='*60}")
    print(f"  Logs path: {logs_path}")
    print(f"  DB path:   {db_path}\n")

    init_schema(db_path)
    ingestion_log = load_ingestion_log()
    ingested = ingestion_log.get("ingested_runs", {})

    # Discover runs
    all_runs = discover_runs(logs_path)
    if not all_runs:
        print("  No runs found.")
        return

    # Filter options
    print(f"  Found {len(all_runs)} total runs.\n")
    filter_idx = prompt_choice("  Filter:", [
        "Show all runs",
        f"Show only new/uningested ({sum(1 for r in all_runs if r['folder_name'] not in ingested)} new)",
        "Pick a specific date range",
    ], default=1)

    if filter_idx == 1:
        runs = [r for r in all_runs if r["folder_name"] not in ingested]
    elif filter_idx == 2:
        date_str = input("  Enter start date (YYYY-MM-DD): ").strip()
        runs = [r for r in all_runs if r["folder_name"] >= date_str]
    else:
        runs = all_runs

    if not runs:
        print("\n  No matching runs found.")
        return

    # Display runs
    print(f"\n  {'#':<4} {'Date':<12} {'Type':<10} {'Name/Game':<35} {'IP':<16} {'Games':<6} {'Status'}")
    print(f"  {'─'*95}")
    for i, run in enumerate(runs):
        date = run["created_at"][:10] if run["created_at"] else "?"
        name = run.get("campaign_name") or (run.get("games", ["?"])[0] if run.get("games") else "?")
        ip_short = "." + run["sut_ip"].split(".")[-1] if run["sut_ip"] else "?"
        print(f"  {i+1:<4} {date:<12} {run['type']:<10} {name[:35]:<35} {ip_short:<16} {run['game_count']:<6} {run['status']}")

    # Select runs
    selection = input(f"\n  Select runs to ingest (comma-separated, 'all', or range '1-3'): ").strip()
    if selection.lower() == "all":
        selected = runs
    elif "-" in selection:
        start, end = selection.split("-")
        selected = runs[int(start)-1:int(end)]
    else:
        indices = [int(x.strip())-1 for x in selection.split(",") if x.strip()]
        selected = [runs[i] for i in indices if 0 <= i < len(runs)]

    if not selected:
        print("  No runs selected.")
        return

    # Process each run
    con = get_connection(db_path)
    total_games = 0

    for run in selected:
        print(f"\n{'─'*60}")
        run_type = run["type"]
        name = run.get("campaign_name") or (run.get("games", ["?"])[0] if run.get("games") else "?")
        print(f"  Run: {name} ({run_type}, {run['game_count']} game(s))")
        print(f"  SUT: {run['sut_ip']}")

        # Try to find SystemScope
        scope_data = None
        build_id = None
        scope_files = list(run["path"].glob("*SystemScope*.json"))
        if not scope_files and run_type == "campaign":
            # Check first game subfolder
            for gd in run.get("game_dirs", []):
                scope_files = list(gd.glob("*SystemScope*.json"))
                if scope_files:
                    break
        if scope_files:
            try:
                scope_data = parse_system_scope(scope_files[0])
                build_id = scope_data.get("build_id")
                print(f"  BKC: {build_id}")
            except Exception as e:
                print(f"  [WARN] SystemScope parse error: {e}")

        if not build_id:
            # Try BIOS version from manifest
            manifest = run.get("manifest")
            if not manifest and run_type == "campaign":
                game_dirs = run.get("game_dirs", [])
                if game_dirs:
                    mf = game_dirs[0] / "manifest.json"
                    if mf.exists():
                        with open(mf) as f:
                            manifest = json.load(f)
            if manifest:
                build_id = manifest.get("sut", {}).get("bios_version", "")
                print(f"  BKC (from BIOS): {build_id}")

        if not build_id:
            build_id = input("  Enter build ID manually: ").strip()
            if not build_id:
                print("  Skipping (no build ID).")
                continue

        # Detect SKU from first PTAT file
        sku_id = None
        if run_type == "single":
            ptat_dir = run["path"] / "traces" / "ptat"
            ptat_files = sorted(ptat_dir.glob("*.csv")) if ptat_dir.exists() else []
            if ptat_files:
                try:
                    ptat_peek = parse_ptat(ptat_files[0])
                    if ptat_peek:
                        short_sku = ptat_peek.get("sku_id")
                        candidates = PTAT_SKU_TO_DASHBOARD_SKU.get(short_sku, [short_sku] if short_sku else [])
                        if len(candidates) == 1:
                            sku_id = candidates[0]
                        elif candidates:
                            print(f"  Multiple SKUs match '{short_sku}':")
                            idx = prompt_choice("  Select SKU:", candidates)
                            sku_id = candidates[idx]
                except Exception:
                    pass
        elif run_type == "campaign":
            game_dirs = run.get("game_dirs", [])
            if game_dirs:
                ptat_dir = game_dirs[0] / "traces" / "ptat"
                ptat_files = sorted(ptat_dir.glob("*.csv")) if ptat_dir.exists() else []
                if ptat_files:
                    try:
                        ptat_peek = parse_ptat(ptat_files[0])
                        if ptat_peek:
                            short_sku = ptat_peek.get("sku_id")
                            candidates = PTAT_SKU_TO_DASHBOARD_SKU.get(short_sku, [short_sku] if short_sku else [])
                            if len(candidates) == 1:
                                sku_id = candidates[0]
                            elif candidates:
                                print(f"  Multiple SKUs match '{short_sku}':")
                                idx = prompt_choice("  Select SKU:", candidates)
                                sku_id = candidates[idx]
                    except Exception:
                        pass

        if not sku_id:
            sku_id = input("  Enter SKU ID (e.g., nvl-sk-28c): ").strip()
            if not sku_id:
                print("  Skipping (no SKU).")
                continue

        print(f"  SKU: {sku_id}")

        # Build type
        bt_idx = prompt_choice("  Build type:", ["BKC build", "Experiment"], default=0)
        build_type = "bkc" if bt_idx == 0 else "experiment"
        parent_bkc = None
        if build_type == "experiment":
            exp_name = input("  Experiment name: ").strip()
            if exp_name:
                parent_bkc = build_id
                build_id = exp_name
            else:
                print("  No experiment name, treating as BKC.")
                build_type = "bkc"

        # Ingest games
        games_written = 0
        if run_type == "single":
            manifest = run.get("manifest")
            if parse_game_run(run["path"], manifest, build_id, sku_id, build_type, parent_bkc, con, db_path):
                games_written += 1
        elif run_type == "campaign":
            for game_dir in run.get("game_dirs", []):
                manifest_file = game_dir / "manifest.json"
                manifest = None
                if manifest_file.exists():
                    with open(manifest_file) as f:
                        manifest = json.load(f)
                print(f"  Processing: {game_dir.name}")
                if parse_game_run(game_dir, manifest, build_id, sku_id, build_type, parent_bkc, con, db_path):
                    games_written += 1

        # Write SystemScope
        if scope_data and build_type == "bkc":
            try:
                upsert_system_scope(con, build_id, sku_id, scope_data)
                print(f"  [OK] SystemScope written")
            except Exception as e:
                print(f"  [WARN] SystemScope write failed: {e}")

        total_games += games_written
        print(f"  Ingested {games_written} game(s)")

        # Log this run
        ingested[run["folder_name"]] = {
            "build_id": build_id,
            "sku_id": sku_id,
            "build_type": build_type,
            "games_written": games_written,
            "ingested_at": datetime.now().isoformat(),
        }

    con.close()
    save_ingestion_log(ingestion_log)

    print(f"\n{'='*60}")
    print(f"  Summary: {total_games} games ingested from {len(selected)} run(s)")
    print(f"  Ingestion log saved to: {INGESTION_LOG_PATH}")

    # Clear cache
    clear = input("\n  Clear API cache? [Y/n]: ").strip().lower()
    if clear != "n":
        try:
            import urllib.request
            urllib.request.urlopen("http://localhost:9001/api/cache/clear", data=b"")
            print("  Cache cleared.")
        except Exception:
            print("  Could not reach backend. Clear cache manually: POST /api/cache/clear")

    print()


def main():
    parser = argparse.ArgumentParser(description="Intel Gaming Dashboard - Automation Run Ingestion Wizard")
    parser.add_argument("--logs-path", default=None, help=f"Path to Raptor-X runs directory (default: {DEFAULT_LOGS_PATH})")
    parser.add_argument("--db", default=None, help="Path to DuckDB file")
    args = parser.parse_args()

    logs_path = Path(args.logs_path) if args.logs_path else DEFAULT_LOGS_PATH
    db_path = Path(args.db) if args.db else DEFAULT_DB_PATH

    if not logs_path.exists():
        print(f"  ERROR: Logs path not found: {logs_path}")
        sys.exit(1)

    run_wizard(logs_path, db_path)


if __name__ == "__main__":
    main()
```

**Step 2: Test the wizard interactively**
```bash
python -m backend.etl.ingest_run
```
Expected: Wizard launches, shows discovered runs, prompts for selection and classification.

**Step 3: Commit**
```bash
git add backend/etl/ingest_run.py
git commit -m "feat: add interactive ingestion wizard for Raptor-X automation runs"
```

---

## Phase 3: Frontend — Sidebar & Build Tree

### Task 7: Build Tree Hook

**Files:**
- Create: `src/hooks/useBuildTree.js`

**Step 1: Create the hook**

```javascript
import { useState, useEffect } from 'react';

const buildTreeCache = new Map();

export function useBuildTree(skuId) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!skuId) { setTree([]); return; }

        const cacheKey = skuId;
        if (buildTreeCache.has(cacheKey)) {
            setTree(buildTreeCache.get(cacheKey));
            return;
        }

        setLoading(true);
        fetch(`/api/build-tree?sku_id=${encodeURIComponent(skuId)}`)
            .then(r => r.json())
            .then(data => {
                buildTreeCache.set(cacheKey, data);
                setTree(data);
            })
            .catch(() => setTree([]))
            .finally(() => setLoading(false));
    }, [skuId]);

    return { tree, loading };
}
```

**Step 2: Commit**
```bash
git add src/hooks/useBuildTree.js
git commit -m "feat: add useBuildTree hook for build hierarchy"
```

---

### Task 8: BuildTree Component

**Files:**
- Create: `src/components/layout/BuildTree.jsx`

**Step 1: Create the build tree component**

This renders the git-branch style tree in the sidebar. BKC nodes are bold with a dot, experiments are indented with branch lines.

```jsx
import React from 'react';
import { GitBranch, GitCommit, FlaskConical } from 'lucide-react';

export default function BuildTree({ tree, currentBuild, onSelectBuild, programColor = '#a855f7' }) {
    if (!tree || tree.length === 0) return null;

    return (
        <div className="flex flex-col gap-0.5">
            {tree.map((bkc) => (
                <div key={bkc.build_id}>
                    {/* BKC Node */}
                    <button
                        onClick={() => onSelectBuild(bkc.build_id)}
                        className={`
                            w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150
                            ${currentBuild === bkc.build_id
                                ? 'bg-white/10 text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                        `}
                        style={currentBuild === bkc.build_id ? { borderLeft: `2px solid ${programColor}` } : { borderLeft: '2px solid transparent' }}
                    >
                        <GitCommit size={14} className="flex-shrink-0" style={{ color: programColor }} />
                        <span className="text-xs font-semibold truncate flex-1">{bkc.build_id}</span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">{bkc.game_count}g</span>
                    </button>

                    {/* Experiment Branches */}
                    {bkc.experiments && bkc.experiments.map((exp) => (
                        <button
                            key={exp.build_id}
                            onClick={() => onSelectBuild(exp.build_id)}
                            className={`
                                w-full flex items-center gap-2 pl-5 pr-2 py-1 rounded-lg text-left transition-all duration-150
                                ${currentBuild === exp.build_id
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}
                            `}
                            style={currentBuild === exp.build_id ? { borderLeft: `2px solid ${programColor}` } : { borderLeft: '2px solid transparent' }}
                        >
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="w-px h-3 bg-slate-600 ml-0.5" />
                                <FlaskConical size={12} className="text-amber-500/70" />
                            </div>
                            <span className="text-[11px] truncate flex-1">{exp.build_id}</span>
                            <span className="text-[10px] text-slate-600 flex-shrink-0">{exp.game_count}g</span>
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
}
```

**Step 2: Commit**
```bash
git add src/components/layout/BuildTree.jsx
git commit -m "feat: add BuildTree component with git-branch style visualization"
```

---

### Task 9: Collapsible Left Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.jsx` (full rewrite)
- Modify: `src/App.jsx` (layout change)

**Step 1: Rewrite Sidebar.jsx as collapsible left sidebar**

Full rewrite of `src/components/layout/Sidebar.jsx`. The new sidebar:
- Renders vertically on the left
- Has expanded (260px) and collapsed (48px) states
- Sections: Logo, Programs, SKUs, Build Tree, Tools, Stats
- Smooth width transition

This is a full component rewrite — reference the current Sidebar.jsx at `src/components/layout/Sidebar.jsx` for the existing props interface and keep the same prop names. The component receives: `navigate`, `location`, `currentBuild`, `handleBuildSelect`, `handleProgramSelect`, `handleNavigateToLanding`, `isProgramActive`, `onStartDemo`, `displayBuilds`.

Add new props: `collapsed` (boolean), `onToggleCollapse` (callback), `buildTree` (array from useBuildTree), `currentProgram` (object).

Key implementation notes:
- Use `transition-all duration-300` for width animation
- In collapsed mode, show only icons with tooltips
- Build tree section uses the `BuildTree` component from Task 8
- Programs section shows program buttons vertically with program color indicators
- SKU section shows SKU buttons when a program is selected
- Keep the logo animation from the existing sidebar (`logoSequence` keyframe)

**Step 2: Update App.jsx layout**

Change `src/App.jsx` from vertical flex (`flex-col`) to horizontal flex (`flex`):
- Sidebar on the left (fixed width, full height)
- Main content fills remaining space
- Add `collapsed` state and `useBuildTree` hook

Key changes in App.jsx:
```jsx
// Add imports
import { useBuildTree } from './hooks/useBuildTree';

// Add state
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const { tree: buildTree } = useBuildTree(skuIdFromUrl);

// Change layout from flex-col to flex
<div className="relative flex z-10 h-screen">
    <Sidebar
        {...existingProps}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        buildTree={buildTree}
    />
    <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
        {/* Routes unchanged */}
    </main>
</div>
```

**Step 3: Test visually**

Start the dev server and verify:
- Sidebar appears on the left
- Collapse/expand toggle works
- Programs, SKUs, build tree all render
- Content area fills remaining width
- All existing navigation still works

**Step 4: Commit**
```bash
git add src/components/layout/Sidebar.jsx src/App.jsx src/hooks/useBuildTree.js
git commit -m "feat: collapsible left sidebar with build tree navigation"
```

---

### Task 10: Experiment Banner

**Files:**
- Modify: `src/components/pages/ProgramDashboard.jsx`

**Step 1: Add experiment banner**

At the top of the ProgramDashboard content area, check if the current build is an experiment (from build tree data). If so, show a subtle banner:

```jsx
{/* Add after SKU selector row, before game cards */}
{buildTree?.some(bkc => bkc.experiments?.some(e => e.build_id === currentBuild)) && (
    <div className="mx-6 mb-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
        <FlaskConical size={14} className="text-amber-500" />
        <span className="text-xs text-amber-400">
            Experiment: <span className="font-semibold text-amber-300">{currentBuild}</span>
            {' '}(branched from {buildTree.find(bkc => bkc.experiments?.some(e => e.build_id === currentBuild))?.build_id})
        </span>
    </div>
)}
```

This requires passing `buildTree` from App.jsx down to ProgramDashboard (via props or context). The simplest approach: pass it as a prop through the Route element.

**Step 2: Commit**
```bash
git add src/components/pages/ProgramDashboard.jsx
git commit -m "feat: add experiment banner on ProgramDashboard"
```

---

## Phase 4: DB Migration & Testing

### Task 11: DB Recreation and Re-ingestion

**Step 1: Delete old DB**
```bash
rm backend/data/gaming_dashboard.duckdb
```

**Step 2: Re-ingest old manual data**
```bash
python -m backend.etl.process_build --input "D:/code/gaming-dashboard/Gametraces/Nova Lake/NVL S K 28C/WW08 Baseline OOB" --sku nvl-sk-28c
```

**Step 3: Test ingestion wizard with automation data**
```bash
python -m backend.etl.ingest_run
```
Select a campaign, classify as BKC, verify it ingests.

**Step 4: Verify API**
```bash
curl http://localhost:9001/api/build-tree?sku_id=nvl-sk-28c
curl http://localhost:9001/api/summary?sku_id=nvl-sk-28c&build_id=NVL-S-CONS-26.03.5.139
```

**Step 5: Commit**
```bash
git commit --allow-empty -m "chore: DB recreated with new schema, data re-ingested"
```

---

## Task Order Summary

| # | Task | Phase | Depends On |
|---|------|-------|------------|
| 1 | PresentMon CSV Parser | Backend | - |
| 2 | Game Map Updates | Backend | - |
| 3 | SKU Map Updates | Backend | - |
| 4 | DB Schema Update | Backend | - |
| 5 | Build Tree API Endpoint | Backend | 4 |
| 6 | Ingestion Wizard | Backend | 1, 2, 3, 4 |
| 7 | Build Tree Hook | Frontend | 5 |
| 8 | BuildTree Component | Frontend | 7 |
| 9 | Collapsible Left Sidebar | Frontend | 8 |
| 10 | Experiment Banner | Frontend | 7, 9 |
| 11 | DB Migration & Testing | Integration | All |

**Parallelizable:** Tasks 1-4 can all run in parallel. Tasks 7-8 can run in parallel with Task 6.
