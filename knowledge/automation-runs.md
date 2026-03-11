# Raptor-X Automation Run Logs

## Location
`C:\Users\Local_Admin\Documents\Raptor-X\rpx-core\logs\runs\`

## Run Types
- **single** -- one game, 1 iteration (perf) + trace runs
- **campaign** -- multiple games (up to 12), 3 perf iterations + trace runs per game

## Folder Naming (current format, Mar 2026)
```
YYYY-MM-DD_HHMMSS_[single|campaign]_[GameName|CampaignName]_PresetLevel_0000_IP
```
- `0000` is a fixed counter (unused)
- IP is the SUT address (e.g., 192-168-0-106)
- Campaign names: ACM=AC Mirage, BMW=Black Myth Wukong, C2=Cyberpunk, +N=iteration

## Single Run Structure
```
<run-folder>/
  manifest.json              <- SUT info, game, preset, iteration status
  timeline.json              <- detailed event log
  systemscope.json           <- BKC + system config (being added to automation)
  perf-run-1/                <- benchmark (scores.json, screenshots)
  trace-run-presentmon/      <- PresentMon trace iteration
  trace-run-ptat/            <- PTAT trace iteration
  traces/
    presentmon/*.csv         <- final PresentMon CSV output
    ptat/*.csv               <- final PTAT CSV output
  service_logs/
```

## Campaign Run Structure
```
<campaign-folder>/
  campaign_manifest.json     <- campaign_id, run UUIDs, status
  <Game-Name>/               <- one subfolder per game
    manifest.json
    perf-run-1/ perf-run-2/ perf-run-3/
    trace-run-presentmon/
    trace-run-ptat/
    traces/presentmon/*.csv
    traces/ptat/*.csv
```

## Manifest.json Key Fields
- `run_id` (UUID), `status`, `created_at`, `completed_at`
- `sut.ip`, `sut.hostname`, `sut.cpu_brand`, `sut.gpu_short`, `sut.gpu_name`, `sut.ram_gb`, `sut.bios_version`
- `config.run_type` ("single"|"campaign"), `config.games[]`, `config.preset_level`, `config.iterations`
- `campaign_id`, `campaign_name` (null for singles)

## Trace File Formats
- **PresentMon CSV**: columns include Application, MsBetweenPresents, MsGPUBusy, MsCPUBusy, TimeInMs, FrameType
  - Filter: only `FrameType == "Application"` rows (skip "Presented")
  - Parser: `backend/parsers/presentmon_csv.py`
- **PTAT CSV**: identical format to old manual PTAT files (same `backend/parsers/ptat.py` parser works)
- **No CapFrameX JSON** -- automation uses PresentMon CSV instead

## SUTs (as of Mar 2026)
- 192.168.0.106 (SATYANVLS) -- NVL S K 28C (Ultra 9)
- 192.168.0.196 -- NVL S K 28C (different board/silicon)
- 192.168.0.141 -- seen once (Counter-Strike 2 test)
- All current SUTs are NVL S K 28C (Ultra 9), same OC motherboard
- Future: 52-core parts will be added

## Scores.json
Per-iteration benchmark scores extracted from game config/output:
```json
{ "game": "...", "game_slug": "...", "scores": { "avg_fps": 248.56 } }
```

## Ingestion

### GUI (preferred): `python -m backend.etl.ingest_gui`

Tkinter GUI (~850 lines) with **two tabs** (ttk.Notebook):

**Tab 1: Ingest**
1. Scans runs, expands campaigns into per-game rows via `TreeEntry` / `GameRow` classes
2. **Collapsible campaign groups**: campaigns show as parent nodes with +/- expand (native Treeview `open=False`); single runs are flat rows
3. Cherry-pick games: check/uncheck individual games within campaigns; clicking campaign parent toggles all children
4. Mix campaigns + single reruns into one build (reruns overwrite bad scores via UPSERT)
5. Auto-detect SKU from PTAT and build ID from BIOS version
6. Filter: All / Uningested / Tagged Official
7. Build config: SKU dropdown, build ID, BKC vs Experiment with parent BKC, **experiment label**
8. Ingest in background thread (GUI stays responsive), tag runs with `dashboard_ingestion.json` markers
9. Replace tracking: old markers get `replaced_by` when rerun overwrites a game
10. "Clear API Cache" button (hits POST /api/cache/clear)
11. **DB coordination**: auto-calls `POST /api/db/release` before writing and `POST /api/db/reacquire` after

**Tab 2: Manage Builds**
1. Lists all ingested builds from DB (build_id, SKU, type, label, parent, game count, last ingested)
2. Click a build → editable fields (type, parent_bkc, experiment_label) + game list with FPS/temp/power
3. "Save Changes" updates DB directly (`UPDATE game_summary SET ...`)
4. "Delete Build" removes all data for build+sku (game_summary + timeseries + system_scope)
5. Auto-refreshes on tab switch; uses silent release/reacquire for write ops

### CLI (headless): `python -m backend.etl.ingest_run`

Interactive CLI that:
1. Scans the Raptor-X logs directory for run folders
2. Identifies single runs and expands campaigns into per-game sub-runs
3. Filters: all / uningested only / date range
4. For each run:
   - Reads manifest.json for SUT info
   - Detects SKU from PTAT CPU Name
   - Prompts for dashboard SKU (resolves ambiguous short SKU to specific dashboard SKU)
   - Prompts for build classification: BKC vs Experiment (with parent BKC selection)
   - Parses PresentMon CSV + PTAT CSV
   - Writes to DuckDB with build_type/parent_bkc metadata
5. Tracks ingested runs in `ingestion_log.json` to avoid re-processing

**Key design**: Automation files stay in-place (no copying). The wizard reads from Raptor-X logs path and writes directly to the dashboard DB.

## Automation PTAT Filename Pattern
```
ptat_<game-slug>_<sut-ip>_<date>.csv
```
Examples:
- `ptat_assassins-creed-mirage_192-168-0-106_2026-02-28_093000.csv`
- `ptat_black-myth-wukong_192-168-0-196_2026-03-01_141500.csv`

These are mapped in `game_map.py` via prefix matching (e.g., "ptat_assassins-creed-mirage" -> "ac-mirage").

## Marker Files

After GUI ingestion, each run folder gets a `dashboard_ingestion.json`:
```json
{
  "build_id": "NVL-S-CONS-26.03.5.139",
  "sku_id": "nvl-sk-28c",
  "build_type": "bkc",
  "ingested_at": "2026-03-07T14:30:00",
  "games_ingested": ["ac-mirage", "cb2077"],
  "replaced_by": null
}
```

- `replaced_by`: set to the rerun's run_id when a newer trace overwrites this one
- Enables: "Tagged Official" filter in GUI, future download endpoint in dashboard
- Future: `GET /api/download-traces?build_id=X&sku_id=Y` will scan markers to locate and zip raw traces
