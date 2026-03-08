# Automation Integration & Gametraces Restructuring Design

**Date**: 2026-03-07
**Branch**: real-NVL-wip
**Status**: Approved

## Problem

Dashboard data was manually copied into `Gametraces/` folders. Now Raptor-X automation produces structured run logs at `C:\Users\Local_Admin\Documents\Raptor-X\rpx-core\logs\runs\` with PTAT CSVs, PresentMon CSVs (not CapFrameX JSON), manifests, and soon SystemScope JSONs. Need to bridge automation output to the dashboard without file duplication.

## Data Hierarchy

```
BKC Build (from SystemScope)              <- "main" branch
  e.g., NVL-S-CONS-26.03.5.139
  │
  ├── SKU: nvl-sk-28c
  │   ├── Game 1 (traces from any SUT)
  │   ├── Game 2 ...
  │
  ├── SKU: nvl-sk-52c (future)
  │
  └── Experiments (branches off this BKC)  <- "feature branches"
      ├── "bios-3081-thermal-cap"
      │   └── SKU: nvl-sk-28c
      └── "ifwi-hotfix-242"
          └── ...
```

- BKC is the primary build identifier (extracted from SystemScope)
- SKU derived from SystemScope / PTAT CPU Name field
- SUT is infrastructure metadata, not a navigation dimension
- Multiple SUTs running same (BKC, SKU) merge naturally
- Experiments are named branches off a parent BKC

## Folder Strategy: Approach B (No Copying)

Automation logs stay at their source path. Dashboard reads directly from there.

```
Raptor-X logs (untouched)  →  Ingestion wizard  →  DuckDB
  runs/                        reads manifests,
    2026-03-06_single_.../     SystemScope,
    2026-03-05_campaign_.../   traces CSVs

Gametraces/                ← only program.json manifests live here
  Nova Lake/
    program.json
```

- No file duplication (campaigns are ~2.6 GB each)
- Automation format can evolve independently
- DB is the real source of truth
- Can always re-ingest from raw logs if schema changes

## Automation Output Structure

### Single Run
```
2026-03-06_151120_single_FFXIV_high-1080p_0000_192-168-0-106/
  manifest.json          <- run metadata (SUT, game, preset, iterations, status)
  systemscope.json       <- BKC + system config (automation will produce this)
  timeline.json          <- event log
  perf-run-1/            <- benchmark iteration (scores.json, screenshots)
  trace-run-presentmon/  <- PresentMon trace iteration
  trace-run-ptat/        <- PTAT trace iteration
  traces/
    presentmon/*.csv     <- final PresentMon output (MsBetweenPresents, GPU/CPU metrics)
    ptat/*.csv           <- final PTAT output (per-core freq/temp/power/clip/cstate)
  service_logs/
```

### Campaign Run
```
2026-03-05_campaign_ACM-BMW-C2-+9_high-1080p_0000_192-168-0-106/
  campaign_manifest.json
  Assassin's-Creed-Mirage/
    manifest.json
    traces/presentmon/*.csv
    traces/ptat/*.csv
  Black-Myth-Wukong/
    ...
  (12 game subfolders, each same structure as single)
```

### Key Format Differences from Manual Data
| Aspect | Old Manual | New Automation |
|--------|-----------|----------------|
| Frame data | CapFrameX JSON | PresentMon CSV |
| PTAT | Same CSV format | Same CSV format |
| SystemScope | Manual file | Automation-generated |
| Folder structure | Gametraces/Program/SKU/Build/ | Flat date-stamped run folders |
| Build ID source | SystemScope BKC Version | Same |

## Interactive Ingestion Wizard

New entry point: `python -m backend.etl.ingest_run`

### Flow
1. Scan Raptor-X logs path
2. Filter: all / uningested only / date range / specific campaign
3. Display found runs with metadata (SUT, BKC, SKU, game count, status)
4. User selects runs to ingest
5. For each run:
   - Show detected BKC, SKU, SUT info
   - User classifies: BKC build or experiment
   - If experiment: user names it, confirms parent BKC
6. Ingest traces (PTAT + PresentMon CSVs)
7. Write to DuckDB
8. Clear API cache
9. Log ingestion to `ingestion_log.json` (tracks what's been ingested)

### Example Session
```
$ python -m backend.etl.ingest_run

Scanning: C:\Users\...\rpx-core\logs\runs\
Found 8 new runs.

  1. 2026-03-06 | single   | FFXIV Dawntrail      | .106 | completed
  2. 2026-03-05 | campaign | ACM-BMW-C2-+9 (12g)  | .106 | partial

Select runs to ingest: 1,2

── Run 1: FFXIV Dawntrail ──
  BKC: NVL-S-CONS-26.03.5.139 | SKU: nvl-sk-28c
  Build type: [1] BKC  [2] Experiment  > 1
  ✅ Ingested 1 game

── Run 2: Campaign ACM-BMW-C2-+9 (12 games) ──
  BKC: NVL-S-CONS-26.03.5.139 | SKU: nvl-sk-28c
  Build type: [1] BKC  [2] Experiment  > 2
  Experiment name: bios-3081-thermal-cap
  Parent BKC [NVL-S-CONS-26.03.5.139]: ↵
  ✅ Ingested 12 games

Summary: 13 games, 2 runs. Cache cleared.
```

## New Parser: presentmon_csv.py

Parses PresentMon CSV output (automation format). Same output shape as `capframex.py`.

### Input Columns Used
- `Application` — process name for game mapping
- `TimeInMs` — timestamp
- `MsBetweenPresents` — frame time (primary metric)
- `MsGPUBusy` — GPU active time
- `MsCPUBusy` — CPU active time
- `FrameType` — filter for "Application" frames only

### Output (matches capframex.py shape)
```python
{
  "game_slug": "ac-mirage",
  "info": { game_name, process_name, gpu, os, ... },  # from manifest.json
  "summary": { avg_fps, one_pct_low, zero_one_pct_low, max_fps, min_fps,
               avg_gpu_active_ms, avg_cpu_active_ms,
               avg_frame_time_ms, p95_frame_time_ms, p99_frame_time_ms },
  "frametimes": [{ frame, frameTime, fps, movingAvg, percentile95, percentile99 }, ...]
}
```

## Database Changes

### game_summary — 2 new columns
```sql
ALTER TABLE game_summary ADD COLUMN build_type TEXT DEFAULT 'bkc';
ALTER TABLE game_summary ADD COLUMN parent_bkc TEXT DEFAULT NULL;
```
- `build_type`: 'bkc' or 'experiment'
- `parent_bkc`: NULL for BKC builds, parent build_id for experiments

### New API Endpoint
```
GET /api/build-tree?sku_id=nvl-sk-28c
→ [
    {
      "build_id": "NVL-S-CONS-26.03.5.139",
      "type": "bkc",
      "game_count": 12,
      "experiments": [
        { "build_id": "bios-3081-thermal-cap", "game_count": 12 },
        { "build_id": "ifwi-hotfix-242", "game_count": 3 }
      ]
    }
  ]
```

### Existing Endpoints — No Changes
All existing endpoints work as-is. `build_id` can be a BKC or experiment name.

## Frontend Changes

### Sidebar: Top Nav → Collapsible Left Sidebar

**Expanded** (~260px):
```
┌──────────────────────┐
│  ◀  Intel SIV        │
│     Gaming Perf Lab  │
│  ─────────────────── │
│  PROGRAMS            │
│  ● Nova Lake         │
│    Arrow Lake        │
│  ─────────────────── │
│  SKU                 │
│  ● NVL S K 28C      │
│    NVL S K 52C       │
│  ─────────────────── │
│  BUILDS              │
│  ● 26.03.5.139 (BKC) │
│  ├── bios-3081-therm │
│  ├── ifwi-hotfix-242 │
│  ● 26.03.4.102 (BKC) │
│  ├── power-limit-test│
│  ─────────────────── │
│  TOOLS               │
│  Compare · Demo      │
│  ─────────────────── │
│  12 games · 2 builds │
└──────────────────────┘
```

**Collapsed** (~48px): Icon rail only, content gets full width.

### Build Tree Component
- Git-branch style: BKC nodes bold with dot, experiments indented with branch lines
- Active selection highlighted with program color
- Game count badges
- Smooth expand/collapse animation

### Experiment Banner
When viewing experiment data, subtle banner above content:
"Experiment: bios-3081-thermal-cap (branched from NVL-S-CONS-26.03.5.139)"

### Unchanged Components
- GameCard, all charts, GameOverlay, DetailedAnalysisPage
- ComparisonPage (can compare BKC vs experiment)
- DemoMode, LandingPage
- All hooks and data fetching (just receive different build_id)

## Files to Create/Modify

### New Files
- `backend/parsers/presentmon_csv.py` — PresentMon CSV parser
- `backend/etl/ingest_run.py` — Interactive ingestion wizard
- `backend/etl/ingestion_log.json` — Tracks ingested runs
- `src/components/layout/BuildTree.jsx` — Branch visualization component

### Modified Files
- `backend/db.py` — Add build_type + parent_bkc columns
- `backend/main.py` — Add /api/build-tree endpoint
- `backend/parsers/game_map.py` — Add automation game slug mappings
- `backend/parsers/sku_map.py` — Verify automation CPU Name strings
- `src/components/layout/Sidebar.jsx` — Rewrite as left collapsible sidebar
- `src/App.jsx` — Layout change (sidebar left instead of top)
- `src/hooks/useGameData.js` — Add useBuildTree hook (or new hook file)

### Unchanged Files
- `backend/parsers/ptat.py` — Works as-is
- `backend/parsers/capframex.py` — Kept for legacy manual data
- All chart components, GameCard, overlay, comparison, demo
- `src/data/games.js`, `src/data/programs.js`
- `src/utils/colors.js`

## Migration Notes

- Old manual data (CapFrameX JSON) continues to work via existing `capframex.py` parser
- Old `process_build.py` ETL still works for manual ingestion
- DB recreation needed to add new columns (then re-ingest all existing data)
- `ingestion_log.json` starts empty — first run indexes everything
