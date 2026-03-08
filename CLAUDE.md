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
# Backend: python -m uvicorn backend.main:app --port 9001 --host 0.0.0.0
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
- **LTTB downsampling on API response** — `max_points=1000` default for detailed charts, GameCard mini charts request `max_points=2000` for accuracy
- **No synthetic data fallback** — only real data is shown; games without data don't render
- **URL is source of truth** — programId, skuId, gameSlug in pathname; `?build=` query param
- **In-memory caching** in React hooks (Map-based, per session) + TTL response cache on backend (5 min)
- **Single-port deployment** — FastAPI serves static frontend build from `dist/` on port 8000
- **Thread-safe DuckDB** — single parent connection + per-request cursors via `parent.cursor()`
- **Dynamic Programs/SKUs** — single source of truth in `Gametraces/<Program>/program.json`; backend scans at startup, frontend uses ProgramsContext with static fallback

### Frontend Structure
```
src/
  context/       - ProgramsContext.jsx (dynamic programs/SKUs from API with static fallback)
  data/          - Static manifests (programs.js with SKUs + graphics/gpu fields, games.js with 45 titles)
  hooks/         - API data fetching (useGameData, useTimeseries, usePerformanceIndex, useSystemConfig, useSystemScope)
  utils/         - Color mappings (getFpsColor, pCoreColors, eCoreColors, tempCoreColors, clipReasonColors)
  components/
    pages/       - SplashPage, LandingPage, ProgramDashboard, DetailedAnalysisPage
    cards/       - GameCard (expandable with 4 mini charts), SKUCard, MetricCard
    charts/      - 8 analysis charts + LazyChart (staggered loading) + TrendSparkline + tooltips
    comparison/  - ComparisonPage with side-by-side selectors, metrics, charts
    demo/        - DemoMode (fullscreen auto-cycling), DemoGameCardView
    overlay/     - GameOverlay (full-page modal with game switcher)
    system/      - SystemScopePanel (hierarchical telemetry tree, default unchecked)
    layout/      - Sidebar (top nav)
    common/      - GameImage, DeltaBadge
```

### Backend Structure
```
backend/
  main.py           - FastAPI app (12 endpoints + static file serving + TTL cache)
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
Programs are loaded from `Gametraces/<Program>/program.json` files at startup.

| Program | SKUs |
|---------|------|
| Arrow Lake (ARL) `#a855f7` | ARL S (24C, 125W), ARL HX (24C, 55W), ARL H (16C, 45W) |
| Arrow Lake Refresh (ARL-R) `#c084fc` | ARL-R S (24C, 125W) |
| Nova Lake (NVL) `#22d3ee` | NVL S K 28C (8P+16E+4LPE, 125W, dGFX RTX 5090), NVL S K 28C bLLC, NVL S K 52C (16P+32E+4LPE, 150W), NVL S K 52C bLLC |
| Panther Lake (PTL) `#f472b6` | PTL U (12C, 15W, iGFX), PTL H (20C, 45W, iGFX) |
| Raptor Lake (RPL) `#f97316` | RPL S (24C, 125W), RPL HX (24C, 55W) |
| Raptor Lake Refresh (RPL-R) `#fb923c` | RPL-R S (24C, 125W) |

Each SKU has `graphics` ("iGFX"|"dGFX") and optional `gpu` fields, shown as badges on cards.

## ETL Command
```bash
python -m backend.etl.process_build --input "C:/path/to/build_folder" --sku nvl-sk-28c
# --build is optional (auto-extracted from SystemScope JSON)
# Build folder structure: PTAT_logs/*.csv + Presentmon_logs/*.json + *SystemScope*.json
# After ETL: POST /api/cache/clear to invalidate backend cache
```

## API Endpoints
- `GET /api/programs` — dynamic program/SKU list from JSON manifests (cached)
- `GET /api/builds?sku_id=` — available build IDs (cached)
- `GET /api/summary?build_id=&sku_id=` — KPI metrics for all games (cached)
- `GET /api/timeseries/{slug}?build_id=&sku_id=&max_points=1000` — chart data (LTTB downsampled)
- `GET /api/performance-index?sku_id=` — per-build avg FPS trend (cached)
- `GET /api/system-config?build_id=&sku_id=` — basic system info
- `GET /api/system-scope-details?build_id=&sku_id=` — full telemetry tree
- `GET /api/compare` — side-by-side comparison
- `POST /api/cache/clear` — invalidate TTL cache (call after ETL)
- `GET /health` — health check

## Summary Metrics (game_summary table)
Each game row includes: avg/max/min FPS, 1%/0.1% lows, frame times (avg/p95/p99), GPU/CPU active ms, IA/Pkg power (avg/max), Pkg temp (avg/max), P-core freq (avg/max/min), E-core freq (avg/max/min), core counts, throttling flags, system info.

## FPS Color Coding
- >= 120 FPS: green `#10b981`
- >= 60 FPS: cyan `#06b6d4`
- >= 30 FPS: amber `#f59e0b`
- < 30 FPS: red `#ef4444`

## Chart Color Conventions
- **P-Cores**: purple palette (`pCoreColors` — solid lines)
- **E-Cores**: green palette (`eCoreColors` — dashed lines)
- **Temperature**: same P/E grouping as frequency, Package in rose-red thick line
- **Power**: IA blue, Package violet, trend lines darker variants
- **Clip Reasons**: color-coded by reason type (dynamic legend from data)

## Gametraces Structure
```
Gametraces/
  Nova Lake/
    program.json             - Program manifest (single source of truth)
    NVL S K 28C/
      WW08 BKC/             - Build folder
        PTAT_logs/*.csv
        Presentmon_logs/*.json
        *SystemScope*.json
      WW08 Baseline OOB/    - Another build
```
New builds go under `Gametraces/<Program>/<SKU>/<Build Name>/`.

## UI/UX Features
- **Staggered chart loading** — `LazyChart` wrapper shows skeleton placeholders during API load, charts fade in one by one (500ms gap) on DetailedAnalysisPage
- **Staggered game card loading** — skeleton cards while loading, then `fadeSlideIn` animation (80ms per card)
- **Beacon button** — detailed analysis button pulses with gradient beacon animation when card is expanded
- **System Scope** — defaults to all modules unchecked; users expand what they need
- **All time-based X-axes** auto-scale from data with clean 5s/10s tick intervals
- **All Y-axes** auto-scale from data (no hardcoded domains)
- **Decimal precision** — FPS/power/temps rounded to 2 decimal places, frequencies to integers

## Ports
- **Backend**: 9001 (configured in `start.bat` and `vite.config.js` proxy)
- **Frontend dev**: 5173 (Vite default)
- **Production**: 8000 (FastAPI serves `dist/`)

## Important Notes
- **DO NOT remove chart animations** without asking — user wants to keep Recharts animations on
- **DB schema change** — new columns `min_p_core_mhz`, `max_e_core_mhz`, `min_e_core_mhz` added; requires DB recreation + re-ingestion
- **No `--reload` on uvicorn** — removed due to Windows instability; restart backend manually after code changes
- **DuckDB opened read-only** on backend (`read_only=True`)

## Current State (as of Feb 2026)
- Branch: `real-NVL-wip`
- 12 games ingested for `nvl-sk-28c` build `NVL-S-CONS-26.03.5.139` (WW08 BKC)
- Also ingested: WW08 Baseline OOB build for same SKU
- Games: AC Mirage, Wukong, Civ6, Cyberpunk 2077, F1 24, Far Cry 6, FFXIV, Hitman 3, HZD Remastered, RDR2, SOTR, Tiny Tina
- All other SKUs have no real data yet
- DemoMode hardcoded to `nvl-sk-28c` (best data availability)
- **Pending**: DB needs recreation to pick up new frequency min/max columns, then re-ingest all builds

## CSS Keyframe Animations
Defined in `src/index.css`:
- `fadeSlideIn` — opacity 0→1 + translateY 12px→0 (game card stagger)
- `beacon` — scale 1→2.2 + opacity 0.6→0 (detail button pulse)
- `loading` — translateX sweep (splash screen loading bar, also used for shimmer effects)
