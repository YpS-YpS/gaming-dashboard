# Architecture Overview

## Tech Stack
- **Frontend**: React 18, Vite 7, Tailwind CSS 3, Recharts, Lucide icons, React Router v7
- **Backend**: FastAPI 0.115, DuckDB 1.1.3, Polars 1.9 (CSV parsing), Pydantic 2.9, NumPy 2.1
- **Theme**: Dark cyberpunk/deep-space (#0f0a1e background, Space Grotesk font)

## End-to-End Data Flow

```
Raw Files (per build folder)
  PTAT_logs/*.csv          - CPU telemetry (freq, temp, power, clip, cstate)
  Presentmon_logs/*.json   - Frame times + FPS (CapFrameX JSON — manual data)
  Presentmon_logs/*.csv    - Frame times + FPS (PresentMon CSV — automation data)
  *SystemScope*.json       - System config tree
       |
       v
  ETL Options:
    Manual:     python -m backend.etl.process_build --input <folder> --sku <id>
    Automation: python -m backend.etl.ingest_gui  (tkinter GUI — preferred)
    Automation: python -m backend.etl.ingest_run  (CLI wizard — headless/scripted)
       |
       v
  DuckDB (backend/data/gaming_dashboard.duckdb)
    - game_summary     : 1 row per (build, sku, game) with KPI metrics + build_type/parent_bkc
    - timeseries       : 1 row per (build, sku, game, chart_type) with JSON arrays
    - system_scope     : 1 row per (build, sku) with config tree
       |
       v
  FastAPI (port 9001) - 15 endpoints, LTTB downsampling, 5-min TTL cache, DB release/reacquire for ETL
       |
       v
  React Frontend (port 5173 dev / 8000 prod)
    - ProgramsContext    -> /api/programs
    - useGameData        -> /api/summary
    - useTimeseries      -> /api/timeseries/{slug}
    - usePerformanceIndex -> /api/performance-index
    - useSystemConfig    -> /api/system-config
    - useSystemScope     -> /api/system-scope-details
    - useBuildTree       -> /api/build-tree
    - useAvailableBuilds -> /api/builds
       |
       v
  Pages: LandingPage -> ProgramDashboard -> GameCard -> GameOverlay -> DetailedAnalysisPage
```

## Build Hierarchy (BKC + Experiments)

Builds follow a git-like model:
- **BKC (Best Known Configuration)** = "main branch" — primary validated build
- **Experiments** = "feature branches" — BIOS/IFWI/config variations branching off a BKC
- Stored in `game_summary.build_type` ("bkc" | "experiment"), `game_summary.parent_bkc` (NULL for BKC, parent build_id for experiments), and `game_summary.experiment_label` (optional human-readable name)
- Exposed via `/api/build-tree` endpoint and rendered as a git-graph-style tree in the sidebar (continuous vertical rail + horizontal branch connectors)
- Experiment labels shown in sidebar tree (amber text) and experiment banner on ProgramDashboard

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
10. **Dual FPS parsers** - CapFrameX JSON (manual data) + PresentMon CSV (automation data), same output shape
11. **Automation data stays in-place** - ingestion wizard reads from Raptor-X logs path, no file copying

## Directory Structure

```
gaming-dashboard/
  CLAUDE.md                 - Project instructions (checked in)
  knowledge/                - This documentation
  docs/plans/               - Implementation plans
  start.bat / stop.bat      - Dev server scripts
  package.json              - Frontend deps
  vite.config.js            - Vite config (proxy to :9001)
  tailwind.config.js        - Tailwind theme
  index.html                - SPA entry point
  src/                      - React frontend
    main.jsx                - Root mount (BrowserRouter)
    App.jsx                 - Horizontal layout (sidebar + main), routes, splash, demo
    index.css               - Global styles + keyframes
    context/                - ProgramsContext
    hooks/                  - 7 custom hooks (data fetching + build tree)
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
      layout/               - Sidebar (collapsible left nav) + BuildTree (git-branch tree)
      common/               - GameImage, DeltaBadge
  backend/
    main.py                 - FastAPI app (routes, cache, static serving)
    db.py                   - DuckDB schema + helpers (build_type, parent_bkc columns)
    requirements.txt        - Python deps
    data/                   - DuckDB file (gitignored)
    parsers/                - PTAT, CapFrameX, PresentMon CSV, SystemScope, game_map, sku_map
    etl/
      process_build.py      - CLI entry point (manual builds)
      ingest_run.py         - CLI ingestion wizard (automation builds)
      ingest_gui.py         - Tkinter GUI ingestion wizard (preferred)
  Gametraces/               - Program manifests + raw build data
    <Program>/
      program.json          - Program + SKU definitions
      SKU Card.txt          - Description text
      <SKU>/
        <Build>/            - Build folder (PTAT_logs/, Presentmon_logs/, SystemScope)
```
