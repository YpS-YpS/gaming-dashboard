# Intel Gaming Performance Dashboard

## Project Overview
React + FastAPI dashboard for Intel CPU gaming performance validation. Displays real telemetry data (FPS, frame times, power, thermals, frequency, C-states, clip reasons) from PTAT Monitor CSVs and CapFrameX JSON logs.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide icons, React Router v7
- **Backend**: FastAPI (Python), DuckDB, Polars (for CSV parsing)
- **Theme**: Dark cyberpunk/deep-space aesthetic (`#0f0a1e` background, Space Grotesk font)

## Quick Start
```bash
npm install
pip install -r backend/requirements.txt
# Ingest build data:
python -m backend.etl.process_build --input "path/to/build_folder" --sku nvl-sk-28c
# Start both servers:
start.bat
# Or manually:
# Backend: python -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0
# Frontend: npm run dev
```

## Architecture

### Data Flow
```
Raw Files (PTAT CSV + CapFrameX JSON + SystemScope JSON)
  -> backend/etl/process_build.py (ETL)
  -> DuckDB (backend/data/gaming_dashboard.duckdb)
  -> FastAPI endpoints (/api/summary, /api/timeseries, etc.)
  -> React hooks (useGameData, useTimeseries, usePerformanceIndex, etc.)
  -> Components (LandingPage -> ProgramDashboard -> GameCard -> GameOverlay -> DetailedAnalysisPage)
```

### Key Design Decisions
- **No downsampling in parsers** — all raw PTAT rows and CapFrameX frames stored in DB
- **LTTB downsampling on API response** — `max_points=2000` default, pass `max_points=0` for full raw data
- **No synthetic data fallback** — only real data is shown; games without data don't render
- **URL is source of truth** — programId, skuId, gameSlug in pathname; `?build=` query param
- **In-memory caching** in React hooks (Map-based, per session)
- **Single-port deployment** — FastAPI serves static frontend build from `dist/` on port 8000

### Frontend Structure
```
src/
  data/          - Static manifests (programs.js with SKUs, games.js with 45 titles)
  hooks/         - API data fetching (useGameData, useTimeseries, usePerformanceIndex, useSystemConfig, useSystemScope)
  utils/         - Color mappings (getFpsColor, core colors, clip reason colors)
  components/
    pages/       - SplashPage, LandingPage, ProgramDashboard, DetailedAnalysisPage
    cards/       - GameCard (expandable), SKUCard, MetricCard
    charts/      - 8 analysis charts + TrendSparkline + tooltips
    comparison/  - ComparisonPage with side-by-side selectors, metrics, charts
    demo/        - DemoMode (fullscreen auto-cycling), DemoGameCardView
    overlay/     - GameOverlay (full-page modal with game switcher)
    system/      - SystemScopePanel (hierarchical telemetry tree)
    layout/      - Sidebar (top nav)
    common/      - GameImage, DeltaBadge
```

### Backend Structure
```
backend/
  main.py           - FastAPI app (11 endpoints + static file serving)
  db.py             - DuckDB schema (game_summary, timeseries, system_scope)
  parsers/
    ptat.py         - PTAT CSV -> per-core freq/temp/power/clip/cstate (all raw rows)
    capframex.py    - CapFrameX JSON -> FPS metrics + all frame times
    system_scope.py - System Scope JSON -> config tree
    game_map.py     - Game name -> slug mapping
    sku_map.py      - CPU name string -> SKU ID mapping
  etl/
    process_build.py - Entry point: discovers files, parses, merges, writes to DB
```

## Programs & SKUs

| Program | SKUs |
|---------|------|
| Arrow Lake (ARL) `#a855f7` | ARL S (24C, 125W), ARL HX (24C, 55W), ARL H (16C, 45W) |
| Nova Lake (NVL) `#22d3ee` | NVL S K 28C (8P+16E+4LPE, 125W), NVL S K 28C bLLC, NVL S K 52C (16P+32E+4LPE, 150W), NVL S K 52C bLLC |
| Panther Lake (PTL) `#f472b6` | PTL U (12C, 15W), PTL H (20C, 45W) |

## ETL Command
```bash
python -m backend.etl.process_build --input "C:/path/to/build_folder" --sku nvl-sk-28c
# --build is optional (auto-extracted from SystemScope JSON)
# Build folder structure: PTAT_logs/*.csv + Presentmon_logs/*.json + *SystemScope*.json
```

## API Endpoints
- `GET /api/builds?sku_id=` — available build IDs
- `GET /api/summary?build_id=&sku_id=` — KPI metrics for all games
- `GET /api/timeseries/{slug}?build_id=&sku_id=&max_points=2000` — chart data (LTTB downsampled)
- `GET /api/performance-index?sku_id=` — per-build avg FPS trend
- `GET /api/system-config?build_id=&sku_id=` — basic system info
- `GET /api/system-scope-details?build_id=&sku_id=` — full telemetry tree
- `GET /api/compare` — side-by-side comparison
- `GET /health` — health check

## FPS Color Coding
- >= 120 FPS: green `#10b981`
- >= 60 FPS: cyan `#06b6d4`
- >= 30 FPS: amber `#f59e0b`
- < 30 FPS: red `#ef4444`

## Current State (as of Feb 2026)
- Branch: `real-NVL-wip`
- 12 games ingested for `nvl-sk-28c` build `NVL-S-CONS-26.03.5.139`
- All other SKUs have no real data yet
- DemoMode hardcoded to `nvl-sk-28c` (best data availability)
