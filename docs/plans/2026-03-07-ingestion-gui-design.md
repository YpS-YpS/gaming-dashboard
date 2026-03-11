# Ingestion GUI Design

**Goal:** Replace CLI ingestion wizard with a simple tkinter GUI that lets users cherry-pick games from campaigns + single reruns, configure build metadata, ingest to DuckDB, and tag official runs with marker files.

**Approach:** Single-file tkinter app reusing all existing `ingest_run.py` backend logic. Zero new dependencies.

## Layout

```
+--------------------------------------------------------------+
| Intel Gaming Dashboard -- Ingestion Wizard            [Scan] |
| Logs: C:\...\runs                                            |
| Filter: [All | Uningested | Tagged Official]                |
+--------------------------------------------------------------+
| # | Check | Date | Source | Game | IP | Tagged               |
+--------------------------------------------------------------+
| SKU: [dropdown]   Build ID: [text field]                     |
| Type: (BKC) (Experiment)    Parent BKC: [text field]         |
+--------------------------------------------------------------+
| [Ingest Selected]  [Select All]  [Clear All]  [Clear Cache]  |
+--------------------------------------------------------------+
| Log output text area                                         |
+--------------------------------------------------------------+
```

## Key Features

1. **Scan**: Reuses `scan_runs()`, expands campaigns into per-game rows
2. **Cherry-pick**: Checkbox per game row, mix campaigns + singles
3. **Auto-detect**: SKU from PTAT, build ID from BIOS version
4. **Ingest**: Background thread, reuses `ingest_single_run()`
5. **Tag**: Drops `dashboard_ingestion.json` marker into run folders
6. **Replace tracking**: Old markers get `replaced_by` when rerun overwrites a game
7. **Filter**: All / Uningested / Tagged Official

## Marker File

`dashboard_ingestion.json` placed in each ingested run folder:
```json
{
  "build_id": "...",
  "sku_id": "...",
  "build_type": "bkc",
  "ingested_at": "ISO timestamp",
  "games_ingested": ["ac-mirage", "wukong"],
  "replaced_by": null
}
```

## Future: Download Endpoint

Marker files enable `GET /api/download-traces?build_id=X&sku_id=Y` to locate and zip raw traces.
