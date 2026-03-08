# Gametraces Folder Structure

## Purpose
`Gametraces/` is the single source of truth for program/SKU definitions and raw build data.
The backend scans `Gametraces/*/program.json` at startup to load programs dynamically.

## Current Structure

```
Gametraces/
  program.txt                              (empty marker)
  Arrow Lake/
    program.json                           (731 bytes - 3 SKUs)
    SKU Card.txt
  Arrow Lake Refresh/
    program.json                           (378 bytes - 1 SKU)
    SKU Card.txt
  Nova Lake/
    program.json                           (1,227 bytes - 4 SKUs)
    SKU Card.txt
    NVL S K 28C/                           ** ONLY SKU WITH DATA **
      WW08 Baseline OOB/                   (build folder)
        MININT-*_SystemScope_*.json        (8.9 MB)
        PTAT_logs/                         (15.6 MB total, 12 CSVs)
          AssasinCreed_PTATMonitor_*.csv
          BlackMyth_PTATMonitor_*.csv
          Civ6_PTATMonitor_*.csv
          Cyberpunk_PTATMonitor_*.csv
          F124_PTATMonitor_*.csv
          FarCry6_PTATMonitor_*.csv
          FFIV_PTATMonitor_*.csv
          Hitman3_PTATMonitor_*.csv
          HZDR_PTATMonitor_*.csv
          RDR2_PTATMonitor_*.csv
          SOTTR_PTATMonitor_*.csv
          TinyTina_PTATMonitor_*.csv
        Presentmon_logs/                   (39.6 MB total, 12 JSONs)
          CapFrameX-ACMirage.exe-*.json
          CapFrameX-b1-Win64-Shipping.exe-*.json
          CapFrameX-CivilizationVI_DX12.exe-*.json
          CapFrameX-Cyberpunk2077.exe-*.json
          CapFrameX-F1_24.exe-*.json
          CapFrameX-FarCry6.exe-*.json
          CapFrameX-ffxiv_dx11.exe-*.json
          CapFrameX-HITMAN3.exe-*.json
          CapFrameX-HorizonZeroDawnRemastered.exe-*.json
          CapFrameX-RDR2.exe-*.json
          CapFrameX-SOTTR.exe-*.json
          CapFrameX-Wonderlands.exe-*.json
  Panther Lake/
    program.json                           (511 bytes - 2 SKUs)
    SKU Card.txt
  Raptor Lake/
    program.json                           (558 bytes - 2 SKUs)
    SKU Card.txt
  Raptor Lake Refresh/
    program.json                           (381 bytes - 1 SKU)
    SKU Card.txt
```

## program.json Schema

```json
{
  "id": "nova-lake",
  "name": "Nova Lake",
  "codename": "NVL",
  "icon": "emoji",
  "color": "#22d3ee",
  "skus": [
    {
      "id": "nvl-sk-28c",
      "name": "NVL S K 28C",
      "fullName": "Nova Lake S K Desktop 28-Core",
      "cores": "28C/28T",
      "coreConfig": "8P + 16E + 4LPE",
      "tdp": "125W",
      "graphics": "dGFX",
      "gpu": "RTX 5090",
      "cache": "bLLC"          // optional
    }
  ]
}
```

## All Registered Programs & SKUs

| Program | Color | SKUs |
|---------|-------|------|
| Arrow Lake (ARL) | #a855f7 | arl-s (24C, 125W, dGFX), arl-hx (24C, 55W, dGFX), arl-h (16C, 45W, iGFX) |
| Arrow Lake Refresh (ARL-R) | #c084fc | arl-r-s (24C, 125W, dGFX) |
| Nova Lake (NVL) | #22d3ee | nvl-sk-28c (28C, 125W, dGFX), nvl-sk-28c-bllc, nvl-sk-52c (52C, 150W), nvl-sk-52c-bllc |
| Panther Lake (PTL) | #f472b6 | ptl-u (12C, 15W, iGFX), ptl-h (20C, 45W, iGFX) |
| Raptor Lake (RPL) | #fb923c | rpl-s (24C, 125W, dGFX), rpl-hx (24C, 55W, dGFX) |
| Raptor Lake Refresh (RPL-R) | #fdba74 | rpl-r-s (24C, 125W, dGFX) |

## Current Data State (March 2026)

- **Only Nova Lake NVL S K 28C has real data**
- 1 build folder: WW08 Baseline OOB
- 12 games with complete PTAT + CapFrameX traces
- Total raw data: ~63.5 MB per build
- DuckDB: 113 MB (includes WW08 BKC build ingested separately)
- All other programs/SKUs: registered in program.json but no build data

## Games with Data

1. Assassin's Creed Mirage
2. Black Myth: Wukong
3. Civilization VI
4. Cyberpunk 2077
5. F1 24
6. Far Cry 6
7. Final Fantasy XIV
8. Hitman 3
9. Horizon Zero Dawn Remastered
10. Red Dead Redemption 2
11. Shadow of the Tomb Raider
12. Tiny Tina's Wonderlands

## Build Folder Convention
```
Gametraces/<Program>/<SKU>/<Build Name>/
  PTAT_logs/*.csv
  Presentmon_logs/*.json
  *SystemScope*.json
```
Build names typically follow: `WW<week> <description>` (e.g., "WW08 BKC", "WW08 Baseline OOB")
