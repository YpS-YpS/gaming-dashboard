# Data Models & API Response Shapes

## DuckDB Tables

### game_summary
One row per (build_id, sku_id, game_slug).

| Column | Type | Description |
|--------|------|-------------|
| build_id | TEXT | Build identifier (e.g., "NVL-S-CONS-26.03.5.139") |
| sku_id | TEXT | SKU identifier (e.g., "nvl-sk-28c") |
| game_slug | TEXT | Game slug (e.g., "cb2077") |
| avg_fps | FLOAT | Average FPS |
| one_pct_low | FLOAT | 1% low FPS |
| zero_one_pct_low | FLOAT | 0.1% low FPS |
| max_fps | FLOAT | Maximum FPS |
| min_fps | FLOAT | Minimum FPS |
| avg_frame_time_ms | FLOAT | Average frame time |
| p95_frame_time_ms | FLOAT | 95th percentile frame time |
| p99_frame_time_ms | FLOAT | 99th percentile frame time |
| avg_gpu_active_ms | FLOAT | Avg GPU active time |
| avg_cpu_active_ms | FLOAT | Avg CPU active time |
| avg_ia_power | FLOAT | Avg IA power (W) |
| max_ia_power | FLOAT | Max IA power (W) |
| avg_pkg_power | FLOAT | Avg package power (W) |
| max_pkg_power | FLOAT | Max package power (W) |
| avg_pkg_temp | FLOAT | Avg package temp (C) |
| max_pkg_temp | FLOAT | Max package temp (C) |
| avg_p_core_mhz | FLOAT | Avg P-core frequency |
| max_p_core_mhz | FLOAT | Max P-core frequency |
| min_p_core_mhz | FLOAT | Min P-core frequency |
| avg_e_core_mhz | FLOAT | Avg E-core frequency |
| max_e_core_mhz | FLOAT | Max E-core frequency |
| min_e_core_mhz | FLOAT | Min E-core frequency |
| p_core_count | INTEGER | Number of P-cores |
| e_core_count | INTEGER | Number of E-cores |
| throttling | TEXT | JSON array of strings |
| cpu_brand | TEXT | CPU brand string |
| firmware | TEXT | Firmware/BIOS version |
| gpu | TEXT | GPU model |
| os | TEXT | OS name |
| motherboard | TEXT | Motherboard model |
| build_type | TEXT | "bkc" (default) or "experiment" |
| parent_bkc | TEXT | NULL for BKC, parent build_id for experiments |
| experiment_label | TEXT | Optional human-readable label (e.g. "bLLC Enabled") |
| created_at | TIMESTAMP | Auto-generated |

### timeseries
One row per (build_id, sku_id, game_slug, chart_type). Data stored as JSON string.

chart_type values and their data shapes:

**"frametimes"**
```json
[{"frame": 0, "frameTime": 5.23, "fps": 191.0, "movingAvg": 5.39, "percentile95": 6.05, "percentile99": 6.21}, ...]
```

**"frequency"**
```json
[{"time": 0, "pCore0": 3200, "pCore1": 3250, ..., "eCore0": 2100, ...}, ...]
```

**"temperature"**
```json
[{"time": 0, "core0": 45.2, "core1": 46.1, ..., "package": 50.5}, ...]
```

**"power"**
```json
[{"time": 0, "iaPower": 85.5, "packagePower": 110.2, "gtPower": 5.0, "iaTrendLine": 84.2, "pkgTrendLine": 109.5}, ...]
```

**"clipReason"**
```json
[{"time": 5230, "reason": "Thermal Throttling Engaged"}, ...]
```
Sparse - only events where clipping occurs.

**"cstateResidency"**
```json
[{"time": 0, "residency": 45.2, "c6": 32.1, "trendLine": 45.2}, ...]
```

### system_scope
One row per (build_id, sku_id).

| Column | Type | Description |
|--------|------|-------------|
| build_id, sku_id | TEXT | Composite key |
| bkc_name | TEXT | BKC name |
| program_name | TEXT | Program name |
| creation_date | TEXT | Date string |
| log_info | TEXT (JSON) | {ip, capture_time, tool_version, system_name} |
| quick_specs | TEXT (JSON) | [{category, label, value}, ...] |
| sections | TEXT (JSON) | [{module, plugin, groups: [{name, items}]}] |

## API Response Shapes

### GET /api/build-tree
```json
[
  {
    "build_id": "NVL-S-CONS-26.03.5.139",
    "type": "bkc",
    "game_count": 12,
    "experiments": [
      {
        "build_id": "NVL-S-EXP-BIOS-v2",
        "game_count": 6,
        "label": "bLLC Enabled"
      }
    ]
  }
]
```

### GET /api/programs
```json
[
  {
    "id": "nova-lake", "name": "Nova Lake", "codename": "NVL",
    "icon": "emoji", "color": "#22d3ee",
    "skus": [
      { "id": "nvl-sk-28c", "name": "NVL S K 28C", "hasData": true, ... }
    ]
  }
]
```

## Hook Return Types

### useGameData(skuId, buildId)
```js
{
  getMetrics(slug) -> {
    avgFps, onePercentLow, zeroOnePercentLow, maxFps, minFps,
    avgFrameTime, p95FrameTime, p99FrameTime,
    avgGpuActive, avgCpuActive,
    avgIaPower, maxIaPower, avgPkgPower, maxPkgPower,
    avgPkgTemp, maxPkgTemp,
    avgPCoreMhz, maxPCoreMhz, minPCoreMhz,
    avgECoreMhz, maxECoreMhz, minECoreMhz,
    pCoreCount, eCoreCount,
    throttling: string[],
    cpuBrand, firmware, gpu, os, motherboard
  } | null,
  loading: boolean,
  error: Error | null,
  availableSlugs: Set<string>
}
```

### useBuildTree(skuId)
```js
{
  tree: [
    {
      build_id: string,
      type: "bkc",
      game_count: number,
      experiments: [{ build_id: string, game_count: number, label?: string }]
    }
  ],
  loading: boolean
}
```

### useAvailableBuilds(skuId)
```js
string[]  // Array of build IDs, e.g. ["NVL-S-CONS-26.03.5.139"]
```

### useTimeseries(slug, skuId, buildId, chartTypes, maxPoints)
```js
{
  data: {
    frametimes: [...],
    frequency: [...],
    temperature: [...],
    power: [...],
    clipReason: [...],
    cstateResidency: [...]
  },
  loading: boolean
}
```

### usePerformanceIndex(skuId)
```js
{ data: [{build_id, perf_index, game_count}], loading: boolean }
```

### useSystemConfig(buildId, skuId)
```js
{ config: {cpu, gpu, firmware, os, motherboard}, loading: boolean }
```

### useSystemScope(buildId, skuId)
```js
{ data: {bkc_name, program_name, creation_date, log_info, sections[]}, loading: boolean }
```
