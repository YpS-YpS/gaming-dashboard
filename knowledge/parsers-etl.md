# Parsers & ETL Pipeline

## ETL Entry Point: backend/etl/process_build.py

### Usage
```bash
python -m backend.etl.process_build --input "C:/path/to/build_folder" --sku nvl-sk-28c
# --build optional (auto-extracted from SystemScope JSON)
# --sku optional (reads from PTAT CPU Name if omitted)
# --db optional (default: backend/data/gaming_dashboard.duckdb)
```

### Pipeline Steps

1. **init_schema()** - Create DB tables if needed
2. **Discover SystemScope** - Find `*SystemScope*.json`, parse it, extract build_id
3. **Discover files** - `PTAT_logs/*.csv` + `Presentmon_logs/*.json`
4. **Parse CapFrameX** - Each JSON -> fps_by_slug dict (game slug -> FPS data)
5. **Parse PTAT** - Each CSV -> ptat_by_slug dict (game slug -> CPU telemetry)
6. **Merge by game slug** - Combine FPS + PTAT summaries, extract system info
7. **Write to DB** - upsert_summary + upsert_timeseries for each game
8. **Write SystemScope** - upsert_system_scope for build+SKU

### Build Folder Structure
```
<Build Name>/
  PTAT_logs/
    AssasinCreed_PTATMonitor_*.csv
    BlackMyth_PTATMonitor_*.csv
    ...
  Presentmon_logs/
    CapFrameX-ACMirage.exe-*.json
    CapFrameX-b1-Win64-Shipping.exe-*.json
    ...
  MININT-*_SystemScope_*.json
```

---

## Parsers

### ptat.py - PTAT CSV Parser

**Input**: PTAT Monitor CSV file (per-game CPU telemetry)
**Function**: `parse_ptat(filepath) -> dict | None`

**Processing**:
1. Read CSV with Polars (UTF-8-lossy, null values: "Invalid", "N/A", "Error retrieving EU count")
2. Extract CPU Name from column 10 -> map to SKU via `cpu_name_to_sku_id()`
3. Map filename to game slug via `ptat_filename_to_slug()`
4. Detect cores: scan CPU0-CPU127, identify P-Core vs E-Core from "CPU{n}-Core Type"
   - Fallback: first 40% = P-Cores, rest = E-Cores
5. Build timeseries (ALL raw rows):
   - **frequency**: `{time, pCore0..N, eCore0..N}` (integers)
   - **temperature**: `{time, core0..N, package}` (package = max across cores)
   - **power**: `{time, iaPower, packagePower, gtPower, iaTrendLine, pkgTrendLine}` (20-sample rolling mean for trends)
   - **clipReason**: `{time, reason}` (sparse, only when clipping occurs)
   - **cstateResidency**: `{time, residency, c6, trendLine}` (C0 = 100 - C2 - C6 - C8 - C10)
6. Aggregate summary: avg/max power, avg/max temp, avg/max/min P-core freq, avg/max/min E-core freq, throttling flags

**Output**:
```python
{
  "sku_id": str, "game_slug": str, "firmware": str,
  "system_info": {cpu_name, cpu_brand, tjmax, tsc_freq, core_count, p_core_count, e_core_count},
  "summary": {avg/max ia/pkg power, avg/max pkg temp, avg/max/min p/e core mhz, throttling[], core counts},
  "timeseries": {frequency[], temperature[], power[], clipReason[], cstateResidency[]}
}
```

### capframex.py - CapFrameX JSON Parser

**Input**: CapFrameX session JSON (frame times + metadata)
**Function**: `parse_capframex(filepath) -> dict | None`

**Processing**:
1. Read JSON (UTF-8-sig for BOM)
2. Map GameName + ProcessName to slug via `capframex_to_slug()`
3. Aggregate frames across all Runs: MsBetweenPresents, GpuActive, CpuActive
4. Calculate FPS metrics:
   - avg_fps = 1000 / mean(frame_times)
   - one_pct_low = 1000 / percentile_99(frame_times)
   - zero_one_pct_low = 1000 / percentile_99.9(frame_times)
   - max_fps = 1000 / min(frame_times)
   - min_fps = 1000 / max(frame_times)
5. Build frametimes array (ALL frames): `{frame, frameTime, fps, movingAvg, percentile95, percentile99}`

**Output**:
```python
{
  "game_slug": str,
  "info": {game_name, process_name, gpu, motherboard, os, creation_date, app_version, total_frames},
  "summary": {avg_fps, one_pct_low, zero_one_pct_low, max_fps, min_fps, avg_gpu_active_ms, avg_cpu_active_ms, avg/p95/p99 frame_time_ms},
  "frametimes": [{frame, frameTime, fps, movingAvg, percentile95, percentile99}, ...]
}
```

### system_scope.py - System Scope JSON Parser

**Input**: Intel System Scope Tool JSON log
**Function**: `parse_system_scope(file_path) -> dict | None`

**Processing**:
1. Extract LogInformation (IP, capture time, tool version, system name)
2. Build module index: `{module_name: (plugin_name, module_dict)}`
3. Extract build_id from "Bkcmeta Information" module (Version field preferred)
4. Organize sections in DASHBOARD_SECTIONS order, then remaining
5. Extract quick_specs: flatten system info into `[{category, label, value}]`
   - Categories: System, Processor, Platform, Memory, OS, Graphics, Power, Security

**Output**:
```python
{
  "build_id": str, "bkc_name": str, "program_name": str, "creation_date": str,
  "log_info": {ip, capture_time, capture_end_time, tool_version, system_name},
  "quick_specs": [{category, label, value}, ...],
  "sections": [{module, plugin, groups: [{name, items: [{name, value}]}]}, ...]
}
```

### game_map.py - Game Name Mapping

Three mapping tables:
1. **CAPFRAMEX_GAME_NAME_TO_SLUG**: "Cyberpunk 2077" -> "cb2077" (45 games)
2. **CAPFRAMEX_PROCESS_TO_SLUG**: "Cyberpunk2077.exe" -> "cb2077" (fallback)
3. **PTAT_FILENAME_PREFIX_TO_SLUG**: "Cyberpunk*" -> "cb2077"

Functions:
- `capframex_to_slug(game_name, process_name)` - tries GameName (exact then partial), falls back to ProcessName
- `ptat_filename_to_slug(filename)` - prefix matching (case-insensitive)

### sku_map.py - SKU Mapping

Two mapping tables:
1. **PTAT_CPU_NAME_TO_SKU**: "NVL S" -> "nvl-s"
2. **FOLDER_FRAGMENT_TO_SKU**: folder name substring -> SKU

Functions:
- `cpu_name_to_sku_id(cpu_name)` - exact match, then partial
- `folder_to_sku_id(folder_name)` - case-insensitive substring search
