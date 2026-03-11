# Parsers & ETL Pipeline

## ETL Entry Points

### 1. Manual Ingestion: backend/etl/process_build.py

```bash
python -m backend.etl.process_build --input "C:/path/to/build_folder" --sku nvl-sk-28c
# --build optional (auto-extracted from SystemScope JSON)
# --sku optional (reads from PTAT CPU Name if omitted)
# --db optional (default: backend/data/gaming_dashboard.duckdb)
```

**Pipeline Steps**:
1. **init_schema()** - Create DB tables if needed
2. **Discover SystemScope** - Find `*SystemScope*.json`, parse it, extract build_id
3. **Discover files** - `PTAT_logs/*.csv` + `Presentmon_logs/*.json` + `Presentmon_logs/*.csv`
4. **Parse CapFrameX/PresentMon** - Each file -> fps_by_slug dict (game slug -> FPS data)
5. **Parse PTAT** - Each CSV -> ptat_by_slug dict (game slug -> CPU telemetry)
6. **Merge by game slug** - Combine FPS + PTAT summaries, extract system info
7. **Write to DB** - upsert_summary + upsert_timeseries for each game
8. **Write SystemScope** - upsert_system_scope for build+SKU

**Build Folder Structure** (manual):
```
<Build Name>/
  PTAT_logs/
    AssasinCreed_PTATMonitor_*.csv
    ...
  Presentmon_logs/
    CapFrameX-ACMirage.exe-*.json     (or PresentMon *.csv)
    ...
  MININT-*_SystemScope_*.json
```

### 2. Automation Ingestion CLI: backend/etl/ingest_run.py (~776 lines)

```bash
python -m backend.etl.ingest_run
```

**CLI wizard** that scans Raptor-X automation logs and ingests them into the dashboard DB.
Mostly superseded by the GUI (below) but still works for scripted/headless use.

### 3. Automation Ingestion GUI: backend/etl/ingest_gui.py

```bash
python -m backend.etl.ingest_gui
```

**Tkinter GUI** for ingestion. Preferred over the CLI wizard.

**Two tabs** (ttk.Notebook):

**Tab 1: Ingest**
- Scans `C:\Users\Local_Admin\Documents\Raptor-X\rpx-core\logs\runs\` for run folders
- Expands campaigns into per-game rows — cherry-pick individual games
- Mix campaigns + single reruns into one build (reruns overwrite bad scores via UPSERT)
- Auto-detect SKU from PTAT and build ID from BIOS version
- Filter: All / Uningested / Tagged Official
- Build config: SKU dropdown, build ID, BKC vs Experiment with parent BKC, **experiment label**
- Background-threaded ingestion (GUI stays responsive)
- **Marker files**: drops `dashboard_ingestion.json` into each ingested run folder
- **Replace tracking**: when a rerun overwrites a game, the old marker gets `replaced_by` updated
- Tracks ingested runs via `ingestion_log.json`
- "Clear API Cache" button (hits POST /api/cache/clear)
- **DB coordination**: calls `POST /api/db/release` before ingestion and `POST /api/db/reacquire` after, so backend doesn't block DuckDB writes

**Tab 2: Manage Builds**
- Lists all ingested builds from DB (build_id, SKU, type, label, parent BKC, game count, last ingested)
- Click a build → shows editable fields + game list with FPS/temp/power per game
- Edit: build_type (BKC ↔ Experiment), parent_bkc, experiment_label
- Delete: removes all game_summary + timeseries + system_scope rows for build+sku
- Auto-refreshes when tab is selected
- Uses silent release/reacquire helpers for DB write operations

**Key Classes**:
- `IngestionApp` - Main tkinter application (2 tabs, ~850 lines)
- `GameRow` - One game from a run (holds RunInfo, game name, trace path)
- `TreeEntry` - Groups a RunInfo with its GameRows; `is_campaign=True` for multi-game campaigns
- `RunInfo` (from ingest_run.py) - Metadata for a discovered run

**Campaign Grouping (Treeview)**:
- Campaigns display as collapsible parent nodes (`open=False` by default) with +/- expand
- Single runs display as flat rows (no parent)
- `build_tree_entries(runs)` converts RunInfo list → TreeEntry list, expanding campaigns into per-game GameRows
- `_populate_table()` inserts campaign parents with `show="tree headings"`, nests children under parent iid
- `campaign_children` dict maps parent iid → list of child iids for bulk checkbox toggle
- Clicking a campaign parent row toggles all children's check state on/off

**Marker file** (`dashboard_ingestion.json` in each run folder):
```json
{
  "build_id": "...", "sku_id": "...", "build_type": "bkc",
  "ingested_at": "ISO timestamp",
  "games_ingested": ["ac-mirage", "wukong"],
  "replaced_by": null
}
```

**Automation folder -> Dashboard mapping**:
- `traces/ptat/*.csv` -> PTAT parser (identical format to manual)
- `traces/presentmon/*.csv` -> PresentMon CSV parser (new, replaces CapFrameX JSON)
- `manifest.json` -> SUT info (gpu_name, cpu_brand, bios_version)

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

**Output**: Same shape as PresentMon CSV parser (below).

### presentmon_csv.py - PresentMon CSV Parser (NEW)

**Input**: PresentMon CSV file (automation frame times)
**Function**: `parse_presentmon_csv(filepath, manifest=None) -> dict | None`

**Processing**:
1. Read CSV with `csv.DictReader` (UTF-8-sig encoding)
2. Filter rows where `FrameType == "Application"` (skip "Presented" rows)
3. Extract frame times from `MsBetweenPresents`, GPU from `MsGPUBusy`, CPU from `MsCPUBusy`
4. Map application name to game slug via `capframex_to_slug()`
5. Calculate same FPS metrics as CapFrameX parser
6. Build same frametimes array shape

**Output** (matches CapFrameX exactly):
```python
{
  "game_slug": str,
  "info": {game_name, process_name, gpu, motherboard, os, creation_date, app_version, total_frames},
  "summary": {avg_fps, one_pct_low, zero_one_pct_low, max_fps, min_fps, avg_gpu_active_ms, avg_cpu_active_ms, avg/p95/p99 frame_time_ms},
  "frametimes": [{frame, frameTime, fps, movingAvg, percentile95, percentile99}, ...]
}
```

**Key difference from CapFrameX**: `info` fields (gpu, motherboard, os) populated from `manifest` dict parameter instead of JSON metadata.

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

Four mapping tables:
1. **CAPFRAMEX_GAME_NAME_TO_SLUG**: "Cyberpunk 2077" -> "cb2077" (45 games)
2. **CAPFRAMEX_PROCESS_TO_SLUG**: "Cyberpunk2077.exe" -> "cb2077" (fallback)
3. **PTAT_FILENAME_PREFIX_TO_SLUG**: "Cyberpunk*" -> "cb2077" (manual PTAT filenames)
4. **Automation PTAT prefixes**: "ptat_cyberpunk-2077" -> "cb2077" (automation filenames like `ptat_<game-slug>_<ip>_<date>.csv`)

Functions:
- `capframex_to_slug(game_name, process_name)` - tries GameName (exact then partial), falls back to ProcessName
- `ptat_filename_to_slug(filename)` - prefix matching (case-insensitive)

### sku_map.py - SKU Mapping

Three mapping structures:
1. **PTAT_CPU_NAME_TO_SKU**: "NVL S" -> "nvl-s", "RPL S" -> "rpl-s", etc.
2. **FOLDER_FRAGMENT_TO_SKU**: folder name substring -> SKU
3. **PTAT_SKU_TO_DASHBOARD_SKU**: Maps short PTAT SKU to dashboard SKU candidates
   - "nvl-s" -> ["nvl-sk-28c", "nvl-sk-28c-bllc", "nvl-sk-52c", "nvl-sk-52c-bllc"]
   - "arl-s" -> ["arl-s"], etc.
   - Used by ingestion wizard to prompt user for exact dashboard SKU

Functions:
- `cpu_name_to_sku_id(cpu_name)` - exact match, then partial
- `folder_to_sku_id(folder_name)` - case-insensitive substring search
