# Frontend Deep Dive

## Entry Points

### src/main.jsx
- Wraps app in `<BrowserRouter>` for React Router v7
- Mounts to `#root` DOM element

### src/App.jsx (124 lines)
- Lazy-loads 3 pages: LandingPage, ComparisonPage, ProgramDashboard
- Wraps everything in `<ProgramsProvider>`
- Manages splash screen (SplashPage), demo mode (DemoMode), build selection
- Background: gradient with blur circles (purple/pink theme)
- Sidebar always visible at top

## Routing (React Router v7)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | LandingPage | Program overview with SKU trend cards |
| `/compare` | ComparisonPage | Side-by-side build/SKU comparison |
| `/program/:programId` | ProgramDashboard | Defaults to first SKU |
| `/program/:programId/sku/:skuId` | ProgramDashboard | Game list for SKU |
| `/program/:programId/sku/:skuId/game/:gameSlug` | ProgramDashboard + GameOverlay | Detail modal |

**Query Params**: `?build=<build_id>`, `?expanded=<game_slug>`

## Context

### ProgramsContext.jsx (44 lines)
- Fetches `/api/programs` on mount, falls back to static `programs.js`
- Provides: `{ programs, loading, error }`
- Hook: `usePrograms()`

## Custom Hooks (5 files)

### useGameData.js (176 lines)
- `useGameData(skuId, buildId)` -> fetches `/api/summary`
- Returns: `{ getMetrics(slug), loading, error, availableSlugs }`
- `getMetrics()` maps API fields to dashboard names (FPS, temps, freq, power, throttling)
- Session-level Map cache (`summaryCache`)

### useTimeseries (in useGameData.js)
- `useTimeseries(gameSlug, skuId, buildId, chartTypes, maxPoints)` -> `/api/timeseries/{slug}`
- Lazy: only called when GameCard expanded or overlay open
- Returns: `{ data, loading }` where data has keys: frametimes, frequency, temperature, power, clipReason, cstateResidency
- Session-level Map cache (`timeseriesCache`)

### usePerformanceIndex.js (38 lines)
- `usePerformanceIndex(skuId)` -> `/api/performance-index`
- Returns: `{ data: [{build_id, perf_index, game_count}], loading }`
- Map cache

### useSystemConfig.js (39 lines)
- `useSystemConfig(buildId, skuId)` -> `/api/system-config`
- Returns: `{ config: {cpu, gpu, firmware, os, motherboard}, loading }`
- Map cache

### useSystemScope.js (35 lines)
- `useSystemScope(buildId, skuId)` -> `/api/system-scope-details`
- Returns: `{ data: {bkc_name, program_name, creation_date, log_info, sections[]}, loading }`
- No cache (always fresh)

### useKeyboardShortcut.js (17 lines)
- `useKeyboardShortcut(key, callback, deps)` -> ESC handler for DemoMode

## Static Data

### programs.js (70 lines)
- 6 programs with SKU arrays (offline fallback for ProgramsContext)
- Each program: id, name, codename, icon (emoji), color (hex), skus[]
- Each SKU: id, name, fullName, cores, tdp, graphics, gpu?, cache?, coreConfig?

### games.js (560 lines)
- 43 game objects: name, slug, genre, steamId, developer, releaseDate, engine, graphicsAPI, benchmarkDuration, benchmarkScene, description, funFacts[]
- `getGameImageUrl(game, type)` -> Cloudflare Steam CDN URL (header/capsule/library/hero)
- `getSteamImageUrl(steamId, type)` -> Direct CDN URL
- `formatPlayerCount(count)` -> "1.2M" / "500K"

## Component Hierarchy

```
App
  Sidebar (top nav)
  SplashPage (3.5s intro)
  DemoMode -> DemoGameCardView (fullscreen auto-cycling, nvl-sk-28c only)
  Routes:
    LandingPage
      SkuCard[] (program icon, perf index, mini trend chart, delta badge, core/tdp badges)
    ComparisonPage
      ComparisonSelector (left) + ComparisonSelector (right)
      Metrics tab / Charts tab
    ProgramDashboard
      SKUCard[] (selector row)
      GameCard[] (staggered fadeSlideIn, 80ms/card)
        Collapsed: thumbnail, name, genre, sparkline, FPS metrics, chevron
        Expanded: build history chart, 6 MetricCards, 4 mini-charts, 4 detail cards
      GameOverlay (full-screen modal, slideIn animations)
        Left sidebar: game list + search + config badges
        Right: DetailedAnalysisPage
          LazyChart wrappers (skeleton -> fade-in, 500ms stagger)
            FrameTimeChart (6 modes: frame time, FPS, p95, p99, 1% low, moving avg)
            FrequencyChart (P-core/E-core toggles, per-core lines)
            TemperatureChart (per-core + package thick line)
            PowerChart (IA + Package scatter+line)
            ClipReasonChart (stacked bar/pie, dynamic legend)
            CpuResidencyChart (C-state visualization)
            PerformanceCapabilityChart
            TrendChart (build trend line)
          SystemScopePanel (hierarchical tree, default unchecked)
```

## Common Components

- **GameImage.jsx** (153 lines): Steam CDN image with spinner + emoji fallback
- **DeltaBadge.jsx** (36 lines): +/- percentage badge (green/red/gray)
- **MetricCard.jsx** (21 lines): Simple label/value/unit/icon card
- **TrendSparkline.jsx** (34 lines): Tiny 20x8px line chart for GameCard
- **LazyChart.jsx** (72 lines): Skeleton -> fade-in wrapper with configurable delay

## State Management Strategy
1. **Context**: Programs/SKUs (ProgramsContext)
2. **URL State**: Program, SKU, Game, Build, Expanded game (React Router)
3. **Component State**: Search query, sort, open FAQs, expanded sections
4. **In-Memory Cache**: Summary, timeseries, performance index (session-level Maps)
5. **No Redux/Zustand** - hooks + context only
