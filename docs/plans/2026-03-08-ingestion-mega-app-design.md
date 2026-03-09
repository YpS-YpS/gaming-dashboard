# Ingestion Mega-App Design

**Date:** 2026-03-08
**Status:** Approved
**Supersedes:** `2026-03-07-ingestion-gui-design.md`, `ingest_gui.py` (Tkinter), `ingest_run.py` (CLI)

## Problem

The gaming dashboard needs a robust ingestion system for a performance engineer who:

- Works across many SKUs during their entire product lifetime (ARL, NVL, PTL, RPL variants)
- Runs weekly BKC (official firmware) validation campaigns across 15+ games
- Debugs issues by branching experiments off BKC builds (disable HT, change BIOS knobs, rerun subset of games)
- Cherry-picks and mixes results from different automation runs — campaigns crash mid-run, standalone reruns fill the gaps
- Needs to compare across builds, SKUs, and experiments
- Will add future loggers (EMON, SocWatch) alongside existing PTAT and PresentMon/CapFrameX

Current tools (`ingest_gui.py` Tkinter GUI, `ingest_run.py` CLI wizard) are functional but disconnected from the dashboard, limited in control, and don't support the full engineer workflow.

## Solution

Build the ingestion system as a new `/ingestion` route inside the existing Gaming Dashboard React+FastAPI app. A five-stage pipeline with full control at every step:

```
SOURCES  →  BROWSE & VIEW  →  WORKBENCH  →  REVIEW  →  PUSH
```

The key insight: **staging is not "pick and push" — it's build assembly.** A build in the dashboard is assembled from multiple automation runs, reruns, and manual traces. The workbench is where that assembly happens.

## Architecture

### Frontend

New route: `/ingestion` with sub-views managed by internal tabs/panels (not separate routes — keep it as a single-page workflow).

```
src/components/ingestion/
├── IngestionPage.jsx              # Main page, tab controller
├── SourceManager.jsx              # Source path configuration
├── RunExplorer.jsx                # Browse & filter discovered runs
├── RunDetailPanel.jsx             # Expanded run view (manifest, games, health)
├── RawFileViewer.jsx              # JSON/CSV/image inline viewer
├── Workbench.jsx                  # Build assembly workbench
├── WorkbenchTab.jsx               # Single workbench instance
├── WorkbenchGameRow.jsx           # Game row in workbench with metadata
├── ReviewPanel.jsx                # Parsed preview, validation, conflicts
├── ReviewMetricsTable.jsx         # FPS/power/thermal/freq summary table
├── ReviewSparklines.jsx           # Mini timeseries preview charts
├── PushPanel.jsx                  # Execute, progress, post-push actions
├── IngestionHistory.jsx           # Past ingestion log with rollback
└── ConflictResolver.jsx           # Old vs new diff, overwrite/skip controls
```

New hooks:

```
src/hooks/
├── useIngestionSources.js         # CRUD for saved source paths
├── useRunExplorer.js              # Scan + filter discovered runs
├── useWorkbench.js                # Workbench state, add/remove/replace games
└── useIngestionHistory.js         # Past push log
```

### Backend

New endpoint group under `/api/ingestion/`:

```
backend/
├── ingestion/
│   ├── __init__.py
│   ├── routes.py                  # All /api/ingestion/* endpoints
│   ├── scanner.py                 # Discover runs from source paths
│   ├── workbench.py               # Workbench state management
│   └── history.py                 # Ingestion log persistence
├── parsers/
│   ├── registry.py                # Parser plugin registry (NEW)
│   ├── base.py                    # BaseParser interface (NEW)
│   ├── ptat.py                    # (existing, adapted to registry)
│   ├── capframex.py               # (existing, adapted to registry)
│   ├── presentmon_csv.py          # (existing, adapted to registry)
│   ├── system_scope.py            # (existing, adapted to registry)
│   ├── emon.py                    # (future)
│   └── socwatch.py                # (future)
└── db.py                          # (existing, add ingestion tables)
```

### Database Additions

Two new tables in DuckDB:

```sql
-- Saved source paths
CREATE TABLE IF NOT EXISTS ingestion_sources (
    id              TEXT PRIMARY KEY,
    label           TEXT NOT NULL,
    path            TEXT NOT NULL,
    source_type     TEXT NOT NULL,  -- 'raptor-x' | 'gametraces' | 'custom'
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingestion history log
CREATE TABLE IF NOT EXISTS ingestion_log (
    id              TEXT PRIMARY KEY,
    pushed_at       TIMESTAMP NOT NULL,
    build_id        TEXT NOT NULL,
    sku_id          TEXT NOT NULL,
    build_type      TEXT NOT NULL,  -- 'bkc' | 'experiment'
    parent_bkc      TEXT,
    experiment_label TEXT,
    games           TEXT NOT NULL,  -- JSON array of game slugs
    game_count      INTEGER NOT NULL,
    source_paths    TEXT NOT NULL,  -- JSON array of source run folders
    chart_types     TEXT NOT NULL,  -- JSON array of chart types written
    status          TEXT NOT NULL,  -- 'completed' | 'partial' | 'rolled_back'
    notes           TEXT
);
```

Workbench state is frontend-only (localStorage + React state). Not persisted in DB — kept simple. If the user closes the browser, workbench contents survive in localStorage.

---

## Stage 1: Source Manager

### Behavior

- Displays saved source paths in a compact list with label, path, type, and scan status
- "Add Source" button opens inline form: label + path + type dropdown
- "Scan" button per source, or "Scan All" to discover runs from all sources
- Scan results cached in memory until next scan
- Source paths persisted in DB via `/api/ingestion/sources` endpoints

### Source Types

| Type | Expected Structure | Discovery Logic |
|---|---|---|
| `raptor-x` | `logs/runs/{run_folder}/manifest.json` | Parse manifest.json for run metadata, expand campaigns into per-game entries |
| `gametraces` | `{Program}/{SKU}/{Build}/PTAT_logs/*.csv` | Walk directory tree, match known folder structure |
| `custom` | Flat folder with PTAT/PresentMon/CapFrameX files | Auto-detect file types by pattern matching |

### API Endpoints

```
GET    /api/ingestion/sources          — list saved sources
POST   /api/ingestion/sources          — add a new source
DELETE /api/ingestion/sources/{id}     — remove a source
POST   /api/ingestion/scan             — scan given source IDs, return discovered runs
```

### Scan Response Shape

```json
{
  "runs": [
    {
      "id": "hash-of-folder-path",
      "folder_name": "2026-02-26_ACM-BMW-C2-+4_201535_192-168-0-196",
      "folder_path": "C:/Users/.../logs/runs/...",
      "source_id": "src-1",
      "source_type": "raptor-x",
      "run_type": "campaign",
      "created_at": "2026-02-26T20:15:35",
      "status": "completed",
      "sut": { "hostname": "MININT-153JP2L", "ip": "192.168.0.196", "cpu_brand": "...", "gpu_short": "RTX 5090" },
      "games": [
        {
          "game_name": "Assassin's Creed Mirage",
          "game_slug": "ac-mirage",
          "status": "completed",
          "iterations": 3,
          "has_scores": true,
          "scores": { "avg_fps": 240.13 },
          "traces": { "ptat": true, "presentmon": true, "capframex": false, "emon": false, "socwatch": false }
        }
      ],
      "ingestion_state": "new",
      "ingested_build_id": null,
      "health": "green"
    }
  ],
  "scan_duration_ms": 1234,
  "total_runs": 42,
  "total_games": 186
}
```

---

## Stage 2: Browse & Explore

### Run Explorer

- **Table view** with columns: Date, Run Name, Type (campaign/single), SUT, Games, Status, Health, Ingestion State
- **Sortable** by any column
- **Filterable** with persistent filter bar:
  - Date range picker
  - Game name multi-select (populated from scan results)
  - SUT hostname/IP text filter
  - Status: completed / failed / all
  - Ingestion state: new / ingested / stale / all
  - SKU auto-detected multi-select
- **Search** — free-text across folder names, game names, SUT hostnames
- **Campaign expansion** — click a campaign row to expand into per-game sub-rows
- **Selection** — checkboxes on runs and games for batch "Add to Workbench"

### Run Detail Panel

Clicking a run opens a side/bottom detail panel showing:

- **Header**: Run name, date, duration, status badge, SUT info (hostname, IP, CPU, GPU, BIOS)
- **Games list**: Each game with iteration count, scores (inline FPS), trace availability icons
- **Timeline**: Key events from timeline.json as a compact vertical timeline
- **Errors**: Any errors from manifest.json highlighted in red
- **Files tab**: Tree of all files in the run folder

### Raw File Viewer

Clicking a file in the files tree opens an inline viewer:

| File Type | Viewer |
|---|---|
| `.json` | Syntax-highlighted with collapsible sections, copy button |
| `.csv` | Table with sortable columns, column search/filter, first 500 rows, row count indicator |
| `.png` / `.jpg` | Image preview with zoom |
| Other | Raw text with line numbers |

### API Endpoints

```
GET  /api/ingestion/runs/{run_id}                  — full run details
GET  /api/ingestion/runs/{run_id}/files             — file tree listing
GET  /api/ingestion/runs/{run_id}/file?path=...     — read a specific file (JSON/CSV/image)
```

File endpoint returns:
- JSON files: parsed object
- CSV files: `{ headers: [...], rows: [...first 500...], total_rows: N }`
- Images: base64 encoded with mime type
- Other: raw text content

---

## Stage 3: Build Workbench

### Core Concept

A workbench represents a **build being assembled**. It has a target identity:

```
{
  "build_id": "WW09-BKC",
  "sku_id": "nvl-sk-28c",
  "build_type": "bkc",
  "parent_bkc": null,
  "experiment_label": null
}
```

And a list of **game slots**, each sourced from a specific run:

```
{
  "game_slug": "cyberpunk-2077",
  "source_run_id": "abc123",
  "source_run_name": "2026-03-05_Campaign_...",
  "source_game_path": "C:/Users/.../Cyberpunk-2077/",
  "traces": { "ptat": true, "presentmon": true },
  "added_at": "2026-03-08T10:30:00"
}
```

### Behavior

- **Create workbench**: Opens a new tab. Set Build ID + SKU + Type. Auto-detect from first added run.
- **Add games**: From the browse panel, click "Add to Workbench" on a game or run. If a campaign, all its games are added.
- **Replace**: Adding a game that already exists in workbench shows confirmation: "Replace AC Mirage from Run A with AC Mirage from Run B?" Shows source info for both.
- **Remove**: Right-click or X button per game row.
- **Batch operations**: "Add entire run" button. "Clear workbench" with confirmation.
- **Multiple workbenches**: Tab bar at top. Common pattern: one tab for BKC, one for experiment.
- **Metadata editing**: Build ID, SKU, Type, Parent BKC, Label — all editable in a header section.
- **Auto-detect**: When first game is added, attempt to read BIOS version from manifest/SystemScope → suggest Build ID. Read PTAT CPU name → suggest SKU.
- **Persistence**: Workbench state stored in localStorage. Survives browser refresh and close. "Save" and "Load" buttons for named workbenches.

### Game Row Display

Each game in the workbench shows:

```
| Game              | Source Run           | Date       | Traces          | FPS (quick) | Actions    |
|-------------------|----------------------|------------|-----------------|-------------|------------|
| Cyberpunk 2077    | WW09 Campaign Run    | 2026-03-05 | PTAT PM         | 87.3 avg    | Replace, X |
| AC Mirage         | Standalone Rerun     | 2026-03-06 | PTAT PM CFX     | 241.0 avg   | Replace, X |
| F1 24             | WW09 Campaign Run    | 2026-03-05 | PTAT PM         | 155.2 avg   | Replace, X |
```

Trace columns use small icons/badges: `PTAT` `PM` `CFX` `EMON` `SW` — colored if present, dimmed if absent.

### State (localStorage)

```json
{
  "workbenches": [
    {
      "id": "wb-1",
      "name": "WW09 BKC - NVL 28C",
      "build_id": "NVL-S-CONS-26.03.9.150",
      "sku_id": "nvl-sk-28c",
      "build_type": "bkc",
      "parent_bkc": null,
      "experiment_label": null,
      "games": [ ... ]
    }
  ],
  "active_workbench_id": "wb-1"
}
```

---

## Stage 4: Review & Validate

### Behavior

Triggered by "Review" button on a workbench. Sends all game file paths to backend for parsing. Backend runs parsers and returns extracted metrics without writing to DB.

### API Endpoint

```
POST /api/ingestion/parse-preview
Body: {
  "games": [
    {
      "game_slug": "cyberpunk-2077",
      "source_path": "C:/Users/.../Cyberpunk-2077/",
      "source_type": "raptor-x"
    }
  ]
}

Response: {
  "results": [
    {
      "game_slug": "cyberpunk-2077",
      "status": "ok",
      "summary": {
        "avg_fps": 87.3, "one_pct_low": 62.1, "zero_one_pct_low": 48.9,
        "avg_ia_power": 95.2, "max_ia_power": 142.0,
        "avg_pkg_temp": 72.3, "max_pkg_temp": 89.1,
        "avg_p_core_mhz": 5100, "avg_e_core_mhz": 4200,
        "p_core_count": 8, "e_core_count": 16
      },
      "chart_types_found": ["frametimes", "frequency", "temperature", "power", "clipReason", "cstateResidency"],
      "total_data_points": 42000,
      "warnings": [],
      "errors": []
    }
  ]
}
```

### Metrics Table

Displays all games in a summary table:

| Game | Avg FPS | 1% Low | 0.1% Low | Avg Power | Max Temp | P-Core MHz | Warnings | Status |
|---|---|---|---|---|---|---|---|---|
| Cyberpunk 2077 | 87.3 | 62.1 | 48.9 | 95.2W | 89.1C | 5100 | — | OK |
| AC Mirage | 241.0 | 198.5 | 172.3 | 88.7W | 75.2C | 5250 | — | OK |
| F1 24 | 155.2 | 120.8 | 98.4 | 102.1W | 92.3C | 4950 | Max temp >90 | WARN |

FPS cells use the existing dashboard color coding (>=120 green, >=60 cyan, >=30 amber, <30 red).

### Sparkline Preview

Below the table, each game has expandable mini charts (Recharts sparklines) for each detected chart type. Quick visual sanity check — does the frametime graph look reasonable? Is there a weird power spike?

### Validation Panel

Automatic checks:

| Check | Severity | Message |
|---|---|---|
| Missing PTAT traces | Warning | "No PTAT data — power/thermal/frequency charts will be empty" |
| Missing PresentMon + CapFrameX | Error | "No frame time data — FPS metrics cannot be computed" |
| avg_fps = 0 or NaN | Error | "FPS is zero — parser may have failed or benchmark didn't run" |
| max_pkg_temp > 100 | Warning | "Package temperature exceeded 100C — possible thermal throttling" |
| Parse failure | Error | "Failed to parse PTAT file: {error message}" |
| Incomplete iterations | Warning | "Only 1 of 3 iterations completed" |

### Conflict Panel

For each game, checks if `(build_id, sku_id, game_slug)` already exists in DB:

```
| Game           | Existing Avg FPS | New Avg FPS | Delta  | Resolution |
|----------------|------------------|-------------|--------|------------|
| Cyberpunk 2077 | 85.1             | 87.3        | +2.6%  | Overwrite ▾|
| AC Mirage      | —                | 241.0       | (new)  | Write      |
```

Resolution options per game: **Overwrite** / **Skip** / **Keep Both** (appends `-rerun` suffix to build_id)

### Approve/Reject

Each game has a checkbox (default: approved). Uncheck to exclude from push without removing from workbench. Useful when one game has parse errors but the rest are fine.

---

## Stage 5: Push & Track

### Push Execution

```
POST /api/ingestion/push
Body: {
  "build_id": "NVL-S-CONS-26.03.9.150",
  "sku_id": "nvl-sk-28c",
  "build_type": "bkc",
  "parent_bkc": null,
  "experiment_label": null,
  "games": [
    {
      "game_slug": "cyberpunk-2077",
      "source_path": "C:/Users/.../Cyberpunk-2077/",
      "source_type": "raptor-x",
      "conflict_resolution": "overwrite"
    }
  ]
}
```

### Progress

Uses Server-Sent Events (SSE) or WebSocket for real-time progress:

```
{ "game": "cyberpunk-2077", "step": "parsing_ptat", "progress": 0.2 }
{ "game": "cyberpunk-2077", "step": "parsing_presentmon", "progress": 0.4 }
{ "game": "cyberpunk-2077", "step": "writing_summary", "progress": 0.7 }
{ "game": "cyberpunk-2077", "step": "writing_timeseries", "progress": 0.9 }
{ "game": "cyberpunk-2077", "step": "done", "progress": 1.0 }
{ "game": "ac-mirage", "step": "parsing_ptat", "progress": 0.1 }
...
{ "status": "complete", "ingestion_id": "ing-20260308-001" }
```

### Post-Push Actions

1. **Auto-clear cache** — calls `POST /api/cache/clear`
2. **Write marker files** — writes `dashboard_ingestion.json` to each source run folder:
   ```json
   {
     "ingestion_id": "ing-20260308-001",
     "build_id": "NVL-S-CONS-26.03.9.150",
     "sku_id": "nvl-sk-28c",
     "ingested_at": "2026-03-08T14:30:00",
     "games_ingested": ["cyberpunk-2077", "ac-mirage", "f1-24"]
   }
   ```
3. **Deep links** — per-game "View in Dashboard" button that navigates to the game's page

### Ingestion History

```
GET /api/ingestion/history                    — list all past ingestions
DELETE /api/ingestion/history/{id}/rollback   — delete all data from that ingestion batch
POST /api/ingestion/history/{id}/reingest     — re-parse and overwrite from same sources
```

History table:

| Date | Build | SKU | Type | Games | Status | Actions |
|---|---|---|---|---|---|---|
| 2026-03-08 14:30 | WW09-BKC | nvl-sk-28c | BKC | 15 games | Completed | View, Rollback, Re-ingest |
| 2026-03-07 10:15 | WW08-noHT | nvl-sk-28c | Experiment | 3 games | Completed | View, Rollback, Re-ingest |

### Rollback

Deletes from `game_summary`, `timeseries`, and `system_scope` all rows matching the ingestion batch. Updates `ingestion_log` status to `rolled_back`. Clears cache.

---

## Stage 6: Parser Plugin System

### Interface

```python
# backend/parsers/base.py

from abc import ABC, abstractmethod
from typing import Any

class BaseParser(ABC):
    """Base interface for all data parsers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable parser name (e.g., 'Intel PTAT Monitor')."""

    @property
    @abstractmethod
    def key(self) -> str:
        """Short key used in DB and API (e.g., 'ptat')."""

    @property
    @abstractmethod
    def file_patterns(self) -> list[str]:
        """Glob patterns this parser handles (e.g., ['ptat_*.csv'])."""

    @property
    @abstractmethod
    def chart_types(self) -> list[str]:
        """Timeseries chart types this parser produces (e.g., ['frequency', 'temperature', 'power'])."""

    @property
    @abstractmethod
    def summary_fields(self) -> list[str]:
        """KPI fields this parser contributes to game_summary (e.g., ['avg_ia_power', 'max_pkg_temp'])."""

    @abstractmethod
    def parse(self, file_paths: list[str], game_slug: str) -> dict[str, Any]:
        """
        Parse the given files and return extracted data.

        Returns:
            {
                "summary": { ... KPI fields ... },
                "timeseries": { "chart_type": [ ... data points ... ], ... },
                "system_info": { ... optional system metadata ... }
            }
        """
```

### Registry

```python
# backend/parsers/registry.py

import importlib
import pkgutil
from pathlib import Path
from .base import BaseParser

_parsers: dict[str, BaseParser] = {}

def discover_parsers():
    """Auto-discover all parser modules in this package."""
    package_dir = Path(__file__).parent
    for _, module_name, _ in pkgutil.iter_modules([str(package_dir)]):
        if module_name in ("registry", "base", "__init__"):
            continue
        module = importlib.import_module(f".{module_name}", package=__package__)
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if isinstance(attr, type) and issubclass(attr, BaseParser) and attr is not BaseParser:
                instance = attr()
                _parsers[instance.key] = instance

def get_parser(key: str) -> BaseParser | None:
    return _parsers.get(key)

def get_all_parsers() -> dict[str, BaseParser]:
    return dict(_parsers)

def match_files(file_paths: list[str]) -> dict[str, list[str]]:
    """Match files to parsers by glob pattern. Returns {parser_key: [matched_files]}."""
    ...
```

### Adding a New Logger (e.g., EMON)

1. Create `backend/parsers/emon.py`
2. Implement `EmonParser(BaseParser)` with file_patterns, chart_types, summary_fields, parse()
3. Done — auto-discovered on next server start

No changes needed to:
- Database schema (`timeseries.chart_type` is a free-form string)
- Ingestion pipeline (registry matches files automatically)
- Frontend browse panel (trace columns populated from parser registry)
- Review panel (charts rendered for whatever chart_types the parsers produce)

Frontend chart rendering for new chart types: add a new chart component in `src/components/charts/analysis/` and register it in the chart type → component mapping. This is the only frontend change needed per new logger.

---

## UI Layout

### Desktop Layout (>=1280px)

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (existing)  │  Ingestion Page                          │
│                      │ ┌─────────────────────────────────────┐  │
│  [Programs]          │ │ Sources Bar  [+ Add] [Scan All]     │  │
│  [SKUs]              │ │ src-1: Raptor-X ✓  src-2: Manual ✓  │  │
│  [Build Tree]        │ ├──────────────────┬──────────────────┤  │
│  [Tools]             │ │ Run Explorer     │ Detail / Viewer  │  │
│    > Ingestion ★     │ │                  │                  │  │
│    > Demo            │ │ [Filters]        │ [Manifest]       │  │
│    > Compare         │ │                  │ [Files]          │  │
│                      │ │ Run list with    │ [Raw viewer]     │  │
│                      │ │ expand/select    │ [Screenshots]    │  │
│                      │ │                  │                  │  │
│                      │ ├──────────────────┴──────────────────┤  │
│                      │ │ Workbench Tabs                       │  │
│                      │ │ [WW09 BKC] [WW09-noHT exp] [+]     │  │
│                      │ │                                      │  │
│                      │ │ Build: WW09-BKC  SKU: nvl-sk-28c    │  │
│                      │ │ Type: ● BKC ○ Experiment             │  │
│                      │ │                                      │  │
│                      │ │ | Game | Source | Traces | FPS | ✓ | │  │
│                      │ │ | ...  | ...    | ...    | ... | ☑ | │  │
│                      │ │                                      │  │
│                      │ │ [Review & Validate]  [Push]          │  │
│                      │ └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

Top half: Browse & explore (resizable split pane)
Bottom half: Workbench with review/push controls

Review and Push open as modal overlays or slide-out panels (not separate pages — avoid losing browse context).

### Color & Theme

Follows existing dashboard cyberpunk dark theme:
- Background: `#0f0a1e`
- Glass panels: `bg-[#140f2d]/60` + `border border-primary/15`
- Primary accent: purple `#a855f7`
- Ingestion-specific accent: amber `#f59e0b` (distinguishes it from dashboard purple)
- Success/push: green `#10b981`
- Warnings: amber `#f59e0b`
- Errors: red `#ef4444`
- Trace badges: each logger gets a consistent color (PTAT=cyan, PM=purple, CFX=blue, EMON=orange, SW=green)

---

## Data Flow Summary

```
1. User configures source paths (persisted in DB)
2. Scan discovers runs → returns run metadata + game list (no parsing yet)
3. User browses runs, views raw files, inspects manifests
4. User creates workbench, adds games from various runs
5. User clicks "Review" → backend parses all files, returns metrics preview
6. User reviews metrics, resolves conflicts, approves/rejects games
7. User clicks "Push" → backend writes to DuckDB, clears cache, writes markers
8. User clicks "View in Dashboard" → navigates to game page with new data
```

---

## Files Changed Summary

### New Files

**Backend (11 files):**
- `backend/ingestion/__init__.py`
- `backend/ingestion/routes.py` — all `/api/ingestion/*` endpoints
- `backend/ingestion/scanner.py` — run discovery from source paths
- `backend/ingestion/workbench.py` — parse-preview and push logic
- `backend/ingestion/history.py` — ingestion log CRUD + rollback
- `backend/parsers/registry.py` — auto-discovery plugin registry
- `backend/parsers/base.py` — BaseParser ABC

**Frontend (14 files):**
- `src/components/ingestion/IngestionPage.jsx`
- `src/components/ingestion/SourceManager.jsx`
- `src/components/ingestion/RunExplorer.jsx`
- `src/components/ingestion/RunDetailPanel.jsx`
- `src/components/ingestion/RawFileViewer.jsx`
- `src/components/ingestion/Workbench.jsx`
- `src/components/ingestion/WorkbenchTab.jsx`
- `src/components/ingestion/WorkbenchGameRow.jsx`
- `src/components/ingestion/ReviewPanel.jsx`
- `src/components/ingestion/ReviewMetricsTable.jsx`
- `src/components/ingestion/ReviewSparklines.jsx`
- `src/components/ingestion/PushPanel.jsx`
- `src/components/ingestion/IngestionHistory.jsx`
- `src/components/ingestion/ConflictResolver.jsx`
- `src/hooks/useIngestionSources.js`
- `src/hooks/useRunExplorer.js`
- `src/hooks/useWorkbench.js`
- `src/hooks/useIngestionHistory.js`

### Modified Files

**Backend:**
- `backend/main.py` — mount ingestion routes
- `backend/db.py` — add `ingestion_sources` and `ingestion_log` tables
- `backend/parsers/ptat.py` — adapt to BaseParser interface
- `backend/parsers/capframex.py` — adapt to BaseParser interface
- `backend/parsers/presentmon_csv.py` — adapt to BaseParser interface
- `backend/parsers/system_scope.py` — adapt to BaseParser interface

**Frontend:**
- `src/App.jsx` — add `/ingestion` route
- `src/components/layout/Sidebar.jsx` — add Ingestion link under Tools
