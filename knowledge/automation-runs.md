# Raptor-X Automation Run Logs

## Location
`C:\Users\Local_Admin\Documents\Raptor-X\rpx-core\logs\runs\`

## Run Types
- **single** — one game, 1 iteration (perf) + trace runs
- **campaign** — multiple games (up to 12), 3 perf iterations + trace runs per game

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
- `sut.ip`, `sut.hostname`, `sut.cpu_brand`, `sut.gpu_short`, `sut.ram_gb`, `sut.bios_version`
- `config.run_type` ("single"|"campaign"), `config.games[]`, `config.preset_level`, `config.iterations`
- `campaign_id`, `campaign_name` (null for singles)

## Trace File Formats
- **PresentMon CSV**: columns include Application, MsBetweenPresents, MsGPUBusy, MsCPUBusy, TimeInMs, FrameType
- **PTAT CSV**: identical format to old manual PTAT files (same parser works)
- **No CapFrameX JSON** — automation uses PresentMon CSV instead

## SUTs (as of Mar 2026)
- 192.168.0.106 (SATYANVLS) — NVL S K 28C
- 192.168.0.196 — NVL S K 28C (different board/silicon)
- 192.168.0.141 — seen once (Counter-Strike 2 test)

## Scores.json
Per-iteration benchmark scores extracted from game config/output:
```json
{ "game": "...", "game_slug": "...", "scores": { "avg_fps": 248.56 } }
```
