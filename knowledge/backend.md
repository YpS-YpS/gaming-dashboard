# Backend Deep Dive

## Files

```
backend/
  __init__.py
  main.py            - FastAPI app (12 routes, caching, static serving)
  db.py              - DuckDB schema + connection + upsert helpers
  requirements.txt   - fastapi, uvicorn, duckdb, polars, pydantic, numpy
  data/
    gaming_dashboard.duckdb   - 113 MB database (gitignored)
  parsers/           - See parsers-etl.md
  etl/               - See parsers-etl.md
```

## main.py - FastAPI Application

### Startup
- CORS enabled for all origins
- Loads program manifests from `Gametraces/*/program.json` (falls back to hardcoded FALLBACK_PROGRAMS)
- DuckDB opened `read_only=True`

### Thread-Safe DB Access
```python
_db_conn = None          # Single parent connection (initialized once)
_db_lock = threading.Lock()
def _get_db():           # Returns per-request cursor from parent
```

### TTL Cache (5-minute)
```python
_cache: dict[str, tuple[float, object]] = {}
_cache_lock = threading.Lock()
def _cached(key, fn):    # Check TTL, call fn if expired
def _invalidate_cache():  # Clear all (call after ETL)
```

### LTTB Downsampling
- `_lttb_downsample(data, max_points)` - Largest-Triangle-Three-Buckets algorithm
  - Preserves peaks/valleys/trends better than uniform sampling
  - Always keeps first and last point
- `_downsample_timeseries(chart_type, data, max_points)` routes per type:
  - frametimes: LTTB on "frameTime"
  - power: LTTB on "iaPower"
  - frequency: LTTB on first pCore field
  - temperature: LTTB on "package"
  - cstateResidency: LTTB on "residency"
  - clipReason: no downsampling (sparse events)

### API Endpoints

| Endpoint | Method | Params | Cached | Purpose |
|----------|--------|--------|--------|---------|
| `/health` | GET | - | No | Health check + DB file status |
| `/api/programs` | GET | - | 5m | Program/SKU manifest + hasData flags |
| `/api/builds` | GET | `sku_id?` | 5m | Available build IDs (DESC) |
| `/api/summary` | GET | `build_id, sku_id` | 5m | All game KPIs for build+SKU |
| `/api/timeseries/{slug}` | GET | `build_id, sku_id, charts?, max_points=1000` | No | Chart data (LTTB downsampled) |
| `/api/system-config` | GET | `build_id, sku_id` | No | CPU/GPU/OS/firmware/motherboard |
| `/api/performance-index` | GET | `sku_id` | 5m | Per-build avg FPS trend |
| `/api/system-scope-details` | GET | `build_id, sku_id` | No | Full telemetry tree |
| `/api/compare` | GET | `left_build, left_sku, right_build, right_sku, game_slug, charts?` | No | Side-by-side comparison |
| `/api/games/available` | GET | `build_id?, sku_id?` | No | Game slugs with data |
| `/api/cache/clear` | POST | - | N/A | Invalidate TTL cache |
| `/{path}` | GET | - | No | SPA static files + index.html fallback |

### Key Endpoint Details

**GET /api/programs**
- Returns programs from JSON manifests
- Annotates each SKU with `hasData: bool` (queries game_summary for distinct sku_ids)

**GET /api/summary**
- Returns all game rows for build+SKU
- Throttling parsed from JSON string to array
- Ordered by avg_fps DESC

**GET /api/timeseries/{slug}**
- Optional `charts` filter (comma-separated)
- `max_points=0` disables downsampling
- Default 1000 points

**GET /api/performance-index**
- Aggregates avg FPS across all games per build
- Returns [{build_id, perf_index, game_count}]

### Static File Serving (Production)
- Mounts `dist/` for built frontend assets
- Fallback to `index.html` for all non-API routes (SPA routing)

## db.py - Database Layer

### Functions
- `get_connection(db_path, read_only)` - Create/return DuckDB connection
- `init_schema(db_path)` - Create tables if not exist
- `upsert_summary(con, row)` - INSERT OR REPLACE game summary
- `upsert_timeseries(con, build_id, sku_id, game_slug, chart_type, data)` - INSERT OR REPLACE timeseries (data as JSON string)
- `upsert_system_scope(con, build_id, sku_id, scope_data)` - INSERT OR REPLACE scope

### Schema

**game_summary** (PK: build_id, sku_id, game_slug)
```
build_id, sku_id, game_slug          TEXT
avg_fps, one_pct_low, zero_one_pct_low, max_fps, min_fps   DOUBLE
avg_frame_time_ms, p95_frame_time_ms, p99_frame_time_ms     DOUBLE
avg_gpu_active_ms, avg_cpu_active_ms                        DOUBLE
avg_ia_power, max_ia_power, avg_pkg_power, max_pkg_power    DOUBLE
avg_pkg_temp, max_pkg_temp                                  DOUBLE
avg_p_core_mhz, max_p_core_mhz, min_p_core_mhz           DOUBLE
avg_e_core_mhz, max_e_core_mhz, min_e_core_mhz           DOUBLE
p_core_count, e_core_count                                  INTEGER
throttling                                                  TEXT (JSON array)
cpu_brand, firmware, gpu, os, motherboard                   TEXT
created_at                                                  TIMESTAMP (auto)
```

**timeseries** (PK: build_id, sku_id, game_slug, chart_type)
```
build_id, sku_id, game_slug, chart_type   TEXT
data                                       TEXT (JSON array of points)
```
chart_type values: "frametimes", "frequency", "temperature", "power", "clipReason", "cstateResidency"

**system_scope** (PK: build_id, sku_id)
```
build_id, sku_id                           TEXT
bkc_name, program_name, creation_date      TEXT
log_info                                   TEXT (JSON)
quick_specs                                TEXT (JSON array of {category, label, value})
sections                                   TEXT (JSON array of module groups)
created_at                                 TIMESTAMP (auto)
```
