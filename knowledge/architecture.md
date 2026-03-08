# Architecture Overview

## Tech Stack
- **Frontend**: React 18, Vite 7, Tailwind CSS 3, Recharts, Lucide icons, React Router v7
- **Backend**: FastAPI 0.115, DuckDB 1.1.3, Polars 1.9 (CSV parsing), Pydantic 2.9, NumPy 2.1
- **Theme**: Dark cyberpunk/deep-space (#0f0a1e background, Space Grotesk font)

## End-to-End Data Flow

```
Raw Files (per build folder)
  PTAT_logs/*.csv          - CPU telemetry (freq, temp, power, clip, cstate)
  Presentmon_logs/*.json   - Frame times + FPS (CapFrameX)
  *SystemScope*.json       - System config tree
       |
       v
  ETL: python -m backend.etl.process_build --input <folder> --sku <id>
       |
       v
  DuckDB (backend/data/gaming_dashboard.duckdb)
    - game_summary     : 1 row per (build, sku, game) with KPI metrics
    - timeseries       : 1 row per (build, sku, game, chart_type) with JSON arrays
    - system_scope     : 1 row per (build, sku) with config tree
       |
       v
  FastAPI (port 9001) - 12 endpoints, LTTB downsampling, 5-min TTL cache
       |
       v
  React Frontend (port 5173 dev / 8000 prod)
    - ProgramsContext   -> /api/programs
    - useGameData       -> /api/summary
    - useTimeseries     -> /api/timeseries/{slug}
    - usePerformanceIndex -> /api/performance-index
    - useSystemConfig   -> /api/system-config
    - useSystemScope    -> /api/system-scope-details
       |
       v
  Pages: LandingPage -> ProgramDashboard -> GameCard -> GameOverlay -> DetailedAnalysisPage
```

## Key Design Decisions

1. **No downsampling in parsers** - all raw rows stored in DB
2. **LTTB downsampling on API response** - `max_points=1000` default, preserves visual peaks/valleys
3. **No synthetic data** - only real data shown; games without data don't render
4. **URL is source of truth** - programId/skuId/gameSlug in pathname, `?build=` query param
5. **In-memory caching** - React hooks use Map-based per-session cache; backend has 5-min TTL
6. **Single-port production** - FastAPI serves built frontend from `dist/` on port 8000
7. **Thread-safe DuckDB** - single parent connection + per-request cursors
8. **Dynamic programs/SKUs** - from `Gametraces/<Program>/program.json`, with static fallback
9. **Read-only DB on backend** - `read_only=True` for safety

## Directory Structure

```
gaming-dashboard/
  CLAUDE.md                 - Project instructions (checked in)
  knowledge/                - This documentation
  start.bat / stop.bat      - Dev server scripts
  package.json              - Frontend deps
  vite.config.js            - Vite config (proxy to :9001)
  tailwind.config.js        - Tailwind theme
  index.html                - SPA entry point
  src/                      - React frontend
    main.jsx                - Root mount (BrowserRouter)
    App.jsx                 - Layout + routes + splash + demo
    index.css               - Global styles + keyframes
    context/                - ProgramsContext
    hooks/                  - 5 custom hooks (data fetching)
    data/                   - Static manifests (programs, games)
    utils/                  - Color mappings
    components/
      pages/                - SplashPage, LandingPage, ProgramDashboard, DetailedAnalysisPage
      cards/                - GameCard, SKUCard, MetricCard
      charts/               - 8 analysis charts + LazyChart + TrendSparkline + tooltips
      comparison/           - ComparisonPage + ComparisonSelector
      demo/                 - DemoMode + DemoGameCardView
      overlay/              - GameOverlay
      system/               - SystemScopePanel
      layout/               - Sidebar
      common/               - GameImage, DeltaBadge
  backend/
    main.py                 - FastAPI app (routes, cache, static serving)
    db.py                   - DuckDB schema + helpers
    requirements.txt        - Python deps
    data/                   - DuckDB file (gitignored)
    parsers/                - PTAT, CapFrameX, SystemScope, game_map, sku_map
    etl/                    - process_build.py (CLI entry point)
  Gametraces/               - Program manifests + raw build data
    <Program>/
      program.json          - Program + SKU definitions
      SKU Card.txt          - Description text
      <SKU>/
        <Build>/            - Build folder (PTAT_logs/, Presentmon_logs/, SystemScope)
```
