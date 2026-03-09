# Ingestion Mega-App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 5-stage ingestion system (Sources → Browse → Workbench → Review → Push) as a new `/ingestion` route inside the Gaming Dashboard, replacing the Tkinter GUI and CLI wizard.

**Architecture:** New `/api/ingestion/*` FastAPI endpoint group backed by a parser plugin registry. Frontend is a single-page workflow with split-pane layout (explorer top, workbench bottom). Workbench state lives in localStorage. Ingestion history and source paths persisted in DuckDB.

**Tech Stack:** React 18, FastAPI, DuckDB, Recharts (sparklines), Tailwind CSS, existing parser modules adapted to plugin interface.

---

## Phase 1: Backend Foundation

### Task 1: Parser Base Interface & Registry

**Files:**
- Create: `backend/parsers/base.py`
- Create: `backend/parsers/registry.py`

**Step 1: Create the BaseParser abstract class**

Create `backend/parsers/base.py`:

```python
"""Abstract base class for all data parsers."""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class BaseParser(ABC):
    """
    Interface for data parsers in the ingestion pipeline.

    Each parser declares what files it handles and what data it produces.
    The registry auto-discovers all parsers in the parsers/ package.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name, e.g. 'Intel PTAT Monitor'."""

    @property
    @abstractmethod
    def key(self) -> str:
        """Short key for DB and API, e.g. 'ptat'."""

    @property
    @abstractmethod
    def file_patterns(self) -> list[str]:
        """Glob patterns this parser handles, e.g. ['ptat_*.csv']."""

    @property
    @abstractmethod
    def chart_types(self) -> list[str]:
        """Timeseries chart types produced, e.g. ['frequency', 'temperature']."""

    @property
    @abstractmethod
    def summary_fields(self) -> list[str]:
        """KPI fields contributed to game_summary, e.g. ['avg_ia_power']."""

    @abstractmethod
    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        """
        Parse given files and return extracted data.

        Returns:
            {
                "summary": { ...KPI fields... },
                "timeseries": { "chart_type": [...data points...] },
                "system_info": { ...optional metadata... }
            }
            or None if parsing fails.
        """

    def detect_game_slug(self, file_path: str | Path) -> str | None:
        """Optional: detect game slug from filename. Return None if unknown."""
        return None

    def detect_sku(self, file_path: str | Path) -> str | None:
        """Optional: detect SKU from file contents. Return None if unknown."""
        return None
```

**Step 2: Create the parser registry**

Create `backend/parsers/registry.py`:

```python
"""Auto-discovery registry for parser plugins."""

import fnmatch
import importlib
import pkgutil
from pathlib import Path

from .base import BaseParser

_parsers: dict[str, BaseParser] = {}
_discovered = False


def discover_parsers() -> None:
    """Auto-discover all BaseParser subclasses in the parsers package."""
    global _discovered
    if _discovered:
        return

    package_dir = Path(__file__).parent
    skip = {"registry", "base", "__init__", "game_map", "sku_map"}

    for _, module_name, _ in pkgutil.iter_modules([str(package_dir)]):
        if module_name in skip:
            continue
        try:
            module = importlib.import_module(f".{module_name}", package=__package__)
        except Exception:
            continue
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if (
                isinstance(attr, type)
                and issubclass(attr, BaseParser)
                and attr is not BaseParser
            ):
                instance = attr()
                _parsers[instance.key] = instance

    _discovered = True


def get_parser(key: str) -> BaseParser | None:
    """Get a parser by its key."""
    discover_parsers()
    return _parsers.get(key)


def get_all_parsers() -> dict[str, BaseParser]:
    """Get all registered parsers."""
    discover_parsers()
    return dict(_parsers)


def match_files(file_paths: list[str]) -> dict[str, list[str]]:
    """
    Match a list of file paths to parsers by their glob patterns.

    Returns {parser_key: [matched_file_paths]}.
    """
    discover_parsers()
    result: dict[str, list[str]] = {}

    for key, parser in _parsers.items():
        matched = []
        for fp in file_paths:
            name = Path(fp).name
            for pattern in parser.file_patterns:
                if fnmatch.fnmatch(name, pattern):
                    matched.append(fp)
                    break
        if matched:
            result[key] = matched

    return result


def get_all_chart_types() -> list[str]:
    """Get union of all chart types across all parsers."""
    discover_parsers()
    types = set()
    for parser in _parsers.values():
        types.update(parser.chart_types)
    return sorted(types)


def get_all_parser_keys() -> list[str]:
    """Get all registered parser keys."""
    discover_parsers()
    return sorted(_parsers.keys())
```

**Step 3: Verify imports work**

Run: `cd D:\code\gaming-dashboard && python -c "from backend.parsers.registry import get_all_parsers; print(get_all_parsers())"`

Expected: Empty dict `{}` (no parsers adapted yet)

**Step 4: Commit**

```bash
git add backend/parsers/base.py backend/parsers/registry.py
git commit -m "feat(ingestion): add parser base interface and auto-discovery registry"
```

---

### Task 2: Adapt Existing Parsers to Registry

**Files:**
- Create: `backend/parsers/ptat_parser.py` (wrapper)
- Create: `backend/parsers/presentmon_parser.py` (wrapper)
- Create: `backend/parsers/capframex_parser.py` (wrapper)
- Create: `backend/parsers/system_scope_parser.py` (wrapper)

**Why wrappers instead of modifying originals:** The existing `ptat.py`, `capframex.py`, etc. are called directly by `process_build.py` and `ingest_run.py`. We wrap them to avoid breaking existing code while registering them in the plugin system.

**Step 1: PTAT parser wrapper**

Create `backend/parsers/ptat_parser.py`:

```python
"""PTAT Monitor parser — registered plugin wrapper."""

from pathlib import Path
from typing import Any

from .base import BaseParser
from .ptat import parse_ptat
from .game_map import ptat_filename_to_slug
from .sku_map import cpu_name_to_sku_id


class PtatParser(BaseParser):
    @property
    def name(self) -> str:
        return "Intel PTAT Monitor"

    @property
    def key(self) -> str:
        return "ptat"

    @property
    def file_patterns(self) -> list[str]:
        return ["ptat_*.csv", "PTAT_*.csv"]

    @property
    def chart_types(self) -> list[str]:
        return ["frequency", "temperature", "power", "clipReason", "cstateResidency"]

    @property
    def summary_fields(self) -> list[str]:
        return [
            "avg_ia_power", "max_ia_power", "avg_pkg_power", "max_pkg_power",
            "avg_pkg_temp", "max_pkg_temp",
            "avg_p_core_mhz", "max_p_core_mhz", "min_p_core_mhz",
            "avg_e_core_mhz", "max_e_core_mhz", "min_e_core_mhz",
            "p_core_count", "e_core_count",
        ]

    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        # PTAT parser handles one file at a time; use the first valid one
        for fp in file_paths:
            result = parse_ptat(str(fp))
            if result is not None:
                return {
                    "summary": result.get("summary", {}),
                    "timeseries": result.get("timeseries", {}),
                    "system_info": result.get("system_info", {}),
                }
        return None

    def detect_game_slug(self, file_path: str | Path) -> str | None:
        return ptat_filename_to_slug(Path(file_path).name)

    def detect_sku(self, file_path: str | Path) -> str | None:
        result = parse_ptat(str(file_path))
        if result and result.get("sku_id"):
            return cpu_name_to_sku_id(result["sku_id"])
        return None
```

**Step 2: PresentMon CSV parser wrapper**

Create `backend/parsers/presentmon_parser.py`:

```python
"""PresentMon CSV parser — registered plugin wrapper."""

from pathlib import Path
from typing import Any

from .base import BaseParser
from .presentmon_csv import parse_presentmon_csv


class PresentmonParser(BaseParser):
    @property
    def name(self) -> str:
        return "Intel PresentMon"

    @property
    def key(self) -> str:
        return "presentmon"

    @property
    def file_patterns(self) -> list[str]:
        return ["*.csv"]

    @property
    def chart_types(self) -> list[str]:
        return ["frametimes"]

    @property
    def summary_fields(self) -> list[str]:
        return [
            "avg_fps", "one_pct_low", "zero_one_pct_low", "max_fps", "min_fps",
            "avg_frame_time_ms", "p95_frame_time_ms", "p99_frame_time_ms",
            "avg_gpu_active_ms", "avg_cpu_active_ms",
        ]

    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        manifest = kwargs.get("manifest")
        for fp in file_paths:
            result = parse_presentmon_csv(str(fp), manifest=manifest)
            if result is not None:
                return {
                    "summary": result.get("summary", {}),
                    "timeseries": {"frametimes": result.get("frametimes", [])},
                    "system_info": result.get("info", {}),
                }
        return None

    def detect_game_slug(self, file_path: str | Path) -> str | None:
        # PresentMon CSV filenames contain the game process name
        from .game_map import ptat_filename_to_slug
        return ptat_filename_to_slug(Path(file_path).name)
```

**Step 3: CapFrameX parser wrapper**

Create `backend/parsers/capframex_parser.py`:

```python
"""CapFrameX JSON parser — registered plugin wrapper."""

from pathlib import Path
from typing import Any

from .base import BaseParser
from .capframex import parse_capframex


class CapframexParser(BaseParser):
    @property
    def name(self) -> str:
        return "CapFrameX"

    @property
    def key(self) -> str:
        return "capframex"

    @property
    def file_patterns(self) -> list[str]:
        return ["*.json"]

    @property
    def chart_types(self) -> list[str]:
        return ["frametimes"]

    @property
    def summary_fields(self) -> list[str]:
        return [
            "avg_fps", "one_pct_low", "zero_one_pct_low", "max_fps", "min_fps",
            "avg_frame_time_ms", "p95_frame_time_ms", "p99_frame_time_ms",
            "avg_gpu_active_ms", "avg_cpu_active_ms",
        ]

    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        for fp in file_paths:
            result = parse_capframex(str(fp))
            if result is not None:
                return {
                    "summary": result.get("summary", {}),
                    "timeseries": {"frametimes": result.get("frametimes", [])},
                    "system_info": result.get("info", {}),
                }
        return None
```

**Step 4: SystemScope parser wrapper**

Create `backend/parsers/system_scope_parser.py`:

```python
"""System Scope JSON parser — registered plugin wrapper."""

from pathlib import Path
from typing import Any

from .base import BaseParser
from .system_scope import parse_system_scope


class SystemScopeParser(BaseParser):
    @property
    def name(self) -> str:
        return "Intel System Scope"

    @property
    def key(self) -> str:
        return "system_scope"

    @property
    def file_patterns(self) -> list[str]:
        return ["*SystemScope*.json", "*systemscope*.json"]

    @property
    def chart_types(self) -> list[str]:
        return []  # No timeseries — system config only

    @property
    def summary_fields(self) -> list[str]:
        return ["cpu_brand", "firmware", "gpu", "os", "motherboard"]

    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        for fp in file_paths:
            result = parse_system_scope(Path(fp))
            if result is not None:
                return {
                    "summary": {},
                    "timeseries": {},
                    "system_info": result,
                }
        return None
```

**Step 5: Verify registry discovers all 4 parsers**

Run: `cd D:\code\gaming-dashboard && python -c "from backend.parsers.registry import get_all_parsers; print(list(get_all_parsers().keys()))"`

Expected: `['capframex', 'ptat', 'presentmon', 'system_scope']`

**Step 6: Commit**

```bash
git add backend/parsers/ptat_parser.py backend/parsers/presentmon_parser.py backend/parsers/capframex_parser.py backend/parsers/system_scope_parser.py
git commit -m "feat(ingestion): add parser wrappers for registry auto-discovery"
```

---

### Task 3: Database Schema — Ingestion Tables

**Files:**
- Modify: `backend/db.py` (lines 23-102 — init_schema function)

**Step 1: Add ingestion_sources and ingestion_log tables to init_schema**

In `backend/db.py`, add after the `system_scope` table creation (after line ~100), inside the `init_schema` function:

```python
    # -- Ingestion management tables --

    con.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_sources (
            id              TEXT PRIMARY KEY,
            label           TEXT NOT NULL,
            path            TEXT NOT NULL,
            source_type     TEXT NOT NULL,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_log (
            id              TEXT PRIMARY KEY,
            pushed_at       TIMESTAMP NOT NULL,
            build_id        TEXT NOT NULL,
            sku_id          TEXT NOT NULL,
            build_type      TEXT NOT NULL DEFAULT 'bkc',
            parent_bkc      TEXT,
            experiment_label TEXT,
            games           TEXT NOT NULL,
            game_count      INTEGER NOT NULL,
            source_paths    TEXT NOT NULL,
            chart_types     TEXT NOT NULL,
            status          TEXT NOT NULL DEFAULT 'completed',
            notes           TEXT
        )
    """)
```

**Step 2: Add CRUD functions for ingestion tables**

Append to `backend/db.py`:

```python
# ── Ingestion source management ──────────────────────────────────

def list_sources(con) -> list[dict]:
    """List all saved ingestion sources."""
    rows = con.execute(
        "SELECT id, label, path, source_type, created_at FROM ingestion_sources ORDER BY created_at"
    ).fetchall()
    return [
        {"id": r[0], "label": r[1], "path": r[2], "source_type": r[3], "created_at": str(r[4])}
        for r in rows
    ]


def add_source(con, source_id: str, label: str, path: str, source_type: str) -> None:
    """Add a new ingestion source path."""
    con.execute(
        "INSERT INTO ingestion_sources (id, label, path, source_type) VALUES (?, ?, ?, ?)",
        [source_id, label, path, source_type],
    )


def delete_source(con, source_id: str) -> None:
    """Remove an ingestion source path."""
    con.execute("DELETE FROM ingestion_sources WHERE id = ?", [source_id])


# ── Ingestion log management ─────────────────────────────────────

def list_ingestion_log(con) -> list[dict]:
    """List all ingestion log entries."""
    rows = con.execute(
        "SELECT id, pushed_at, build_id, sku_id, build_type, parent_bkc, "
        "experiment_label, games, game_count, source_paths, chart_types, status, notes "
        "FROM ingestion_log ORDER BY pushed_at DESC"
    ).fetchall()
    cols = [
        "id", "pushed_at", "build_id", "sku_id", "build_type", "parent_bkc",
        "experiment_label", "games", "game_count", "source_paths", "chart_types",
        "status", "notes",
    ]
    return [dict(zip(cols, r)) for r in rows]


def insert_ingestion_log(con, entry: dict) -> None:
    """Insert a new ingestion log entry."""
    con.execute(
        "INSERT INTO ingestion_log (id, pushed_at, build_id, sku_id, build_type, "
        "parent_bkc, experiment_label, games, game_count, source_paths, chart_types, status, notes) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            entry["id"], entry["pushed_at"], entry["build_id"], entry["sku_id"],
            entry["build_type"], entry.get("parent_bkc"), entry.get("experiment_label"),
            entry["games"], entry["game_count"], entry["source_paths"],
            entry["chart_types"], entry.get("status", "completed"), entry.get("notes"),
        ],
    )


def rollback_ingestion(con, ingestion_id: str) -> dict:
    """
    Roll back an ingestion: delete all data written by that batch.
    Returns summary of what was deleted.
    """
    # Get the log entry
    row = con.execute(
        "SELECT build_id, sku_id, games FROM ingestion_log WHERE id = ?",
        [ingestion_id],
    ).fetchone()
    if not row:
        return {"error": "Ingestion not found"}

    build_id, sku_id, games_json = row
    import json
    game_slugs = json.loads(games_json)

    deleted = {"summary": 0, "timeseries": 0}

    for slug in game_slugs:
        r1 = con.execute(
            "DELETE FROM game_summary WHERE build_id = ? AND sku_id = ? AND game_slug = ?",
            [build_id, sku_id, slug],
        )
        deleted["summary"] += r1.fetchone()[0] if r1.description else 0

        r2 = con.execute(
            "DELETE FROM timeseries WHERE build_id = ? AND sku_id = ? AND game_slug = ?",
            [build_id, sku_id, slug],
        )
        deleted["timeseries"] += r2.fetchone()[0] if r2.description else 0

    con.execute(
        "UPDATE ingestion_log SET status = 'rolled_back' WHERE id = ?",
        [ingestion_id],
    )

    return deleted
```

**Step 3: Verify schema creates successfully**

Run: `cd D:\code\gaming-dashboard && python -c "
import duckdb
con = duckdb.connect(':memory:')
from backend.db import init_schema
init_schema(con)
print(con.execute('SHOW TABLES').fetchall())
"`

Expected: Should list 5 tables: `game_summary`, `timeseries`, `system_scope`, `ingestion_sources`, `ingestion_log`

**Step 4: Commit**

```bash
git add backend/db.py
git commit -m "feat(ingestion): add ingestion_sources and ingestion_log DB tables"
```

---

### Task 4: Ingestion Scanner Module

**Files:**
- Create: `backend/ingestion/__init__.py`
- Create: `backend/ingestion/scanner.py`

This module discovers runs from source paths — adapted from `ingest_run.py:scan_runs()` (lines 129-197) and `ingest_gui.py` scanner logic.

**Step 1: Create the ingestion package**

Create `backend/ingestion/__init__.py`:

```python
"""Ingestion pipeline — Sources, Browse, Workbench, Review, Push."""
```

**Step 2: Create the scanner module**

Create `backend/ingestion/scanner.py`:

```python
"""
Discover automation runs and game traces from various source types.

Handles three source types:
- raptor-x: Raptor-X automation logs (manifest.json + campaign_manifest.json)
- gametraces: Manual Gametraces folders (Program/SKU/Build/PTAT_logs/)
- custom: Flat folders with trace files
"""

import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path

from backend.parsers.game_map import ptat_filename_to_slug
from backend.parsers.sku_map import cpu_name_to_sku_id

log = logging.getLogger(__name__)

MARKER_FILE = "dashboard_ingestion.json"


def scan_source(source: dict) -> list[dict]:
    """
    Scan a single source path and return discovered runs.

    Args:
        source: {"id", "label", "path", "source_type"}

    Returns:
        List of run dicts with metadata.
    """
    source_type = source["source_type"]
    source_path = Path(source["path"])

    if not source_path.exists():
        log.warning("Source path does not exist: %s", source_path)
        return []

    if source_type == "raptor-x":
        return _scan_raptor_x(source_path, source["id"])
    elif source_type == "gametraces":
        return _scan_gametraces(source_path, source["id"])
    elif source_type == "custom":
        return _scan_custom(source_path, source["id"])
    else:
        log.warning("Unknown source type: %s", source_type)
        return []


def _make_run_id(folder_path: str) -> str:
    """Deterministic run ID from folder path."""
    return hashlib.sha256(folder_path.encode()).hexdigest()[:16]


def _read_json(path: Path) -> dict | None:
    """Safely read a JSON file."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _read_ingestion_marker(run_path: Path) -> dict | None:
    """Read dashboard_ingestion.json marker if it exists."""
    marker = run_path / MARKER_FILE
    if marker.exists():
        return _read_json(marker)
    return None


def _detect_traces(game_path: Path) -> dict:
    """Detect which trace types exist in a game folder."""
    traces = {
        "ptat": False,
        "presentmon": False,
        "capframex": False,
        "emon": False,
        "socwatch": False,
    }

    # Raptor-X structure: traces/ptat/*.csv, traces/presentmon/*.csv
    ptat_dir = game_path / "traces" / "ptat"
    if ptat_dir.exists() and any(ptat_dir.glob("*.csv")):
        traces["ptat"] = True

    pm_dir = game_path / "traces" / "presentmon"
    if pm_dir.exists() and any(pm_dir.glob("*.csv")):
        traces["presentmon"] = True

    # Gametraces structure: PTAT_logs/*.csv, Presentmon_logs/*.json or *.csv
    ptat_logs = game_path / "PTAT_logs"
    if ptat_logs.exists() and any(ptat_logs.glob("*.csv")):
        traces["ptat"] = True

    pm_logs = game_path / "Presentmon_logs"
    if pm_logs.exists():
        if any(pm_logs.glob("*.json")):
            traces["capframex"] = True
        if any(pm_logs.glob("*.csv")):
            traces["presentmon"] = True

    # Future: emon, socwatch
    emon_dir = game_path / "traces" / "emon"
    if emon_dir.exists() and any(emon_dir.iterdir()):
        traces["emon"] = True

    sw_dir = game_path / "traces" / "socwatch"
    if sw_dir.exists() and any(sw_dir.iterdir()):
        traces["socwatch"] = True

    return traces


def _extract_scores(game_path: Path) -> dict | None:
    """Extract quick FPS scores from scores.json files."""
    # Look for perf-run-*/results/scores.json
    scores_files = sorted(game_path.glob("perf-run-*/results/scores.json"))
    if not scores_files:
        return None

    # Use the last iteration's scores
    data = _read_json(scores_files[-1])
    if data and "scores" in data:
        return data["scores"]
    return None


def _run_health(manifest: dict, games: list[dict]) -> str:
    """Determine run health: green/yellow/red/gray."""
    status = manifest.get("status", "unknown")
    if status == "failed":
        return "red"

    has_traces = any(
        any(g["traces"].values()) for g in games
    )
    if not has_traces:
        return "gray"

    has_failed = any(g["status"] != "completed" for g in games)
    if has_failed:
        return "yellow"

    return "green"


def _parse_game_from_manifest(game_path: Path, manifest: dict | None = None) -> dict:
    """Parse a single game entry from a run subfolder."""
    game_name = game_path.name
    game_manifest = _read_json(game_path / "manifest.json") or manifest or {}

    # Get status
    status = game_manifest.get("status", "unknown")

    # Count iterations
    iterations = len(list(game_path.glob("perf-run-*")))

    # Detect traces
    traces = _detect_traces(game_path)

    # Get quick scores
    scores = _extract_scores(game_path)

    # Try to get game slug from PTAT files or game name
    game_slug = None
    ptat_dir = game_path / "traces" / "ptat"
    if ptat_dir.exists():
        for csv in ptat_dir.glob("*.csv"):
            game_slug = ptat_filename_to_slug(csv.name)
            if game_slug:
                break

    return {
        "game_name": game_name,
        "game_slug": game_slug,
        "game_path": str(game_path),
        "status": status,
        "iterations": iterations,
        "has_scores": scores is not None,
        "scores": scores,
        "traces": traces,
    }


def _scan_raptor_x(logs_path: Path, source_id: str) -> list[dict]:
    """Scan a Raptor-X logs/runs/ directory."""
    runs = []

    # The path should point to the runs/ folder or parent
    runs_dir = logs_path
    if (logs_path / "runs").exists():
        runs_dir = logs_path / "runs"

    if not runs_dir.exists():
        return []

    for folder in sorted(runs_dir.iterdir()):
        if not folder.is_dir():
            continue

        campaign_manifest_path = folder / "campaign_manifest.json"
        manifest_path = folder / "manifest.json"

        is_campaign = campaign_manifest_path.exists()
        has_manifest = manifest_path.exists()

        if not is_campaign and not has_manifest:
            continue

        # Read manifest
        if is_campaign:
            manifest = _read_json(campaign_manifest_path) or {}
        else:
            manifest = _read_json(manifest_path) or {}

        sut = manifest.get("sut", {})
        config = manifest.get("config", {})

        # Build games list
        games = []
        if is_campaign:
            # Campaign: each subdirectory is a game
            for game_dir in sorted(folder.iterdir()):
                if game_dir.is_dir() and (game_dir / "manifest.json").exists():
                    games.append(_parse_game_from_manifest(game_dir))
        else:
            # Single run: the folder itself is the game
            games.append(_parse_game_from_manifest(folder, manifest))

        # Check ingestion marker
        marker = _read_ingestion_marker(folder)
        if marker:
            ingestion_state = "ingested"
            ingested_build_id = marker.get("build_id")
        else:
            ingestion_state = "new"
            ingested_build_id = None

        # Parse date from folder name or manifest
        created_at = manifest.get("created_at", "")
        if not created_at and len(folder.name) >= 10:
            try:
                created_at = folder.name[:10]  # YYYY-MM-DD prefix
            except Exception:
                created_at = ""

        run = {
            "id": _make_run_id(str(folder)),
            "folder_name": folder.name,
            "folder_path": str(folder),
            "source_id": source_id,
            "source_type": "raptor-x",
            "run_type": "campaign" if is_campaign else "single",
            "created_at": created_at,
            "status": manifest.get("status", "unknown"),
            "sut": {
                "hostname": sut.get("hostname", ""),
                "ip": sut.get("ip", ""),
                "cpu_brand": sut.get("cpu_brand", ""),
                "gpu_short": sut.get("gpu_short", ""),
                "bios_version": sut.get("bios_name", sut.get("bios_version", "")),
            },
            "config": {
                "preset_level": config.get("preset_level", ""),
                "iterations": config.get("iterations", 0),
            },
            "games": games,
            "game_count": len(games),
            "ingestion_state": ingestion_state,
            "ingested_build_id": ingested_build_id,
            "health": _run_health(manifest, games),
        }
        runs.append(run)

    return runs


def _scan_gametraces(gametraces_path: Path, source_id: str) -> list[dict]:
    """
    Scan a Gametraces/ directory structure.
    Expected: Gametraces/<Program>/<SKU>/<Build>/PTAT_logs/*.csv
    """
    runs = []

    for program_dir in sorted(gametraces_path.iterdir()):
        if not program_dir.is_dir():
            continue
        for sku_dir in sorted(program_dir.iterdir()):
            if not sku_dir.is_dir():
                continue
            for build_dir in sorted(sku_dir.iterdir()):
                if not build_dir.is_dir():
                    continue

                # Check if this folder has trace files
                traces = _detect_traces(build_dir)
                if not any(traces.values()):
                    continue

                # Each PTAT/CapFrameX file is potentially a different game
                games = _discover_games_from_traces(build_dir)
                if not games:
                    continue

                # Check for system scope
                sys_scope_files = list(build_dir.glob("*SystemScope*.json")) + list(build_dir.glob("*systemscope*.json"))

                marker = _read_ingestion_marker(build_dir)

                run = {
                    "id": _make_run_id(str(build_dir)),
                    "folder_name": build_dir.name,
                    "folder_path": str(build_dir),
                    "source_id": source_id,
                    "source_type": "gametraces",
                    "run_type": "build",
                    "created_at": "",
                    "status": "completed",
                    "sut": {
                        "hostname": "",
                        "ip": "",
                        "cpu_brand": sku_dir.name,
                        "gpu_short": "",
                        "bios_version": "",
                    },
                    "config": {
                        "program": program_dir.name,
                        "sku": sku_dir.name,
                    },
                    "games": games,
                    "game_count": len(games),
                    "ingestion_state": "ingested" if marker else "new",
                    "ingested_build_id": marker.get("build_id") if marker else None,
                    "health": "green" if games else "gray",
                    "has_system_scope": len(sys_scope_files) > 0,
                }
                runs.append(run)

    return runs


def _discover_games_from_traces(build_dir: Path) -> list[dict]:
    """Discover individual games from trace files in a build folder."""
    games_by_slug: dict[str, dict] = {}

    # PTAT files
    ptat_dir = build_dir / "PTAT_logs"
    if ptat_dir.exists():
        for csv_file in ptat_dir.glob("*.csv"):
            slug = ptat_filename_to_slug(csv_file.name)
            if slug and slug not in games_by_slug:
                games_by_slug[slug] = {
                    "game_name": slug,
                    "game_slug": slug,
                    "game_path": str(build_dir),
                    "status": "completed",
                    "iterations": 1,
                    "has_scores": False,
                    "scores": None,
                    "traces": {"ptat": True, "presentmon": False, "capframex": False, "emon": False, "socwatch": False},
                }

    # CapFrameX JSON files
    pm_dir = build_dir / "Presentmon_logs"
    if pm_dir.exists():
        for json_file in pm_dir.glob("*.json"):
            if "SystemScope" in json_file.name:
                continue
            # Try to detect game from CapFrameX JSON
            try:
                data = json.loads(json_file.read_text(encoding="utf-8"))
                from backend.parsers.game_map import capframex_to_slug
                game_name = data.get("Info", {}).get("GameName", "")
                process = data.get("Info", {}).get("ProcessName", "")
                slug = capframex_to_slug(game_name, process)
                if slug:
                    if slug in games_by_slug:
                        games_by_slug[slug]["traces"]["capframex"] = True
                    else:
                        games_by_slug[slug] = {
                            "game_name": game_name or slug,
                            "game_slug": slug,
                            "game_path": str(build_dir),
                            "status": "completed",
                            "iterations": 1,
                            "has_scores": False,
                            "scores": None,
                            "traces": {"ptat": False, "presentmon": False, "capframex": True, "emon": False, "socwatch": False},
                        }
            except Exception:
                continue

    return list(games_by_slug.values())


def _scan_custom(custom_path: Path, source_id: str) -> list[dict]:
    """Scan a custom folder with mixed trace files."""
    traces = _detect_traces(custom_path)
    if not any(traces.values()):
        return []

    games = _discover_games_from_traces(custom_path)

    return [{
        "id": _make_run_id(str(custom_path)),
        "folder_name": custom_path.name,
        "folder_path": str(custom_path),
        "source_id": source_id,
        "source_type": "custom",
        "run_type": "custom",
        "created_at": "",
        "status": "completed",
        "sut": {"hostname": "", "ip": "", "cpu_brand": "", "gpu_short": "", "bios_version": ""},
        "config": {},
        "games": games,
        "game_count": len(games),
        "ingestion_state": "new",
        "ingested_build_id": None,
        "health": "green" if games else "gray",
    }]


def get_run_files(run_path: str) -> list[dict]:
    """List all files in a run folder as a flat list with relative paths."""
    root = Path(run_path)
    if not root.exists():
        return []

    files = []
    for f in sorted(root.rglob("*")):
        if f.is_file():
            rel = f.relative_to(root)
            size = f.stat().st_size
            ext = f.suffix.lower()
            files.append({
                "name": f.name,
                "relative_path": str(rel),
                "absolute_path": str(f),
                "size": size,
                "extension": ext,
                "type": _file_type(ext),
            })

    return files


def _file_type(ext: str) -> str:
    """Classify file extension into viewer type."""
    if ext in (".json",):
        return "json"
    elif ext in (".csv",):
        return "csv"
    elif ext in (".png", ".jpg", ".jpeg", ".bmp"):
        return "image"
    else:
        return "text"


def read_file_content(file_path: str, max_csv_rows: int = 500) -> dict:
    """Read a file and return its content in the appropriate format."""
    path = Path(file_path)
    if not path.exists():
        return {"error": "File not found", "type": "error"}

    ext = path.suffix.lower()

    if ext == ".json":
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return {"type": "json", "content": data}
        except Exception as e:
            return {"type": "error", "error": str(e)}

    elif ext == ".csv":
        try:
            import csv as csv_mod
            rows = []
            headers = []
            total_rows = 0
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv_mod.reader(f)
                for i, row in enumerate(reader):
                    if i == 0:
                        headers = row
                    else:
                        total_rows += 1
                        if len(rows) < max_csv_rows:
                            rows.append(row)
            return {
                "type": "csv",
                "headers": headers,
                "rows": rows,
                "total_rows": total_rows,
                "truncated": total_rows > max_csv_rows,
            }
        except Exception as e:
            return {"type": "error", "error": str(e)}

    elif ext in (".png", ".jpg", ".jpeg", ".bmp"):
        import base64
        try:
            data = base64.b64encode(path.read_bytes()).decode("ascii")
            mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "bmp": "image/bmp"}
            return {"type": "image", "content": data, "mime": mime.get(ext.lstrip("."), "image/png")}
        except Exception as e:
            return {"type": "error", "error": str(e)}

    else:
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
            if len(text) > 100_000:
                text = text[:100_000] + "\n... (truncated)"
            return {"type": "text", "content": text}
        except Exception as e:
            return {"type": "error", "error": str(e)}
```

**Step 3: Verify scanner works**

Run: `cd D:\code\gaming-dashboard && python -c "
from backend.ingestion.scanner import scan_source
result = scan_source({'id': 'test', 'label': 'Test', 'path': r'C:\Users\Local_Admin\Documents\Raptor-X\rpx-core\logs\runs', 'source_type': 'raptor-x'})
print(f'Found {len(result)} runs')
if result:
    r = result[0]
    print(f'First: {r[\"folder_name\"]} — {r[\"game_count\"]} games — {r[\"health\"]}')
"`

Expected: Should find runs and print their names.

**Step 4: Commit**

```bash
git add backend/ingestion/__init__.py backend/ingestion/scanner.py
git commit -m "feat(ingestion): add run scanner for raptor-x, gametraces, and custom sources"
```

---

### Task 5: Ingestion Push & History Module

**Files:**
- Create: `backend/ingestion/push.py`

This module handles the parse-preview and push-to-DB logic.

**Step 1: Create the push module**

Create `backend/ingestion/push.py`:

```python
"""
Parse preview and push-to-database logic for the ingestion pipeline.

Handles:
- parse_preview: Run parsers without writing to DB, return metrics summary
- push: Parse and write to DB, log the ingestion, write marker files
- rollback: Delete data from a past ingestion batch
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

import duckdb

from backend import db
from backend.parsers.registry import get_all_parsers, match_files

log = logging.getLogger(__name__)

MARKER_FILE = "dashboard_ingestion.json"


def _collect_trace_files(game: dict) -> list[str]:
    """Collect all trace file paths from a game entry."""
    source_path = Path(game["source_path"])
    files = []

    # Raptor-X structure
    for subdir in ["traces/ptat", "traces/presentmon"]:
        d = source_path / subdir
        if d.exists():
            files.extend(str(f) for f in d.glob("*") if f.is_file())

    # Gametraces structure
    for subdir in ["PTAT_logs", "Presentmon_logs"]:
        d = source_path / subdir
        if d.exists():
            files.extend(str(f) for f in d.glob("*") if f.is_file())

    # Direct files in source path (custom)
    if not files:
        files.extend(
            str(f) for f in source_path.glob("*")
            if f.is_file() and f.suffix.lower() in (".csv", ".json")
        )

    return files


def _find_system_scope(game: dict) -> Path | None:
    """Find SystemScope JSON near the game folder."""
    source = Path(game["source_path"])

    # Check in game folder
    for f in source.glob("*SystemScope*.json"):
        return f
    for f in source.glob("*systemscope*.json"):
        return f

    # Check parent (campaign root or build root)
    parent = source.parent
    for f in parent.glob("*SystemScope*.json"):
        return f
    for f in parent.glob("*systemscope*.json"):
        return f

    return None


def _read_manifest(game: dict) -> dict | None:
    """Read Raptor-X manifest.json for a game."""
    source = Path(game["source_path"])
    manifest_path = source / "manifest.json"
    if manifest_path.exists():
        try:
            return json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return None


def parse_preview(games: list[dict]) -> list[dict]:
    """
    Run parsers on game files without writing to DB.

    Args:
        games: List of {"game_slug", "source_path", "source_type"}

    Returns:
        List of results per game with parsed summary, chart types, warnings.
    """
    all_parsers = get_all_parsers()
    results = []

    for game in games:
        slug = game["game_slug"]
        trace_files = _collect_trace_files(game)
        matched = match_files(trace_files)

        summary = {}
        chart_types_found = []
        warnings = []
        errors = []
        total_points = 0

        for parser_key, files in matched.items():
            parser = all_parsers.get(parser_key)
            if not parser:
                continue

            try:
                manifest = _read_manifest(game)
                result = parser.parse(files, slug, manifest=manifest)
                if result is None:
                    warnings.append(f"{parser.name}: returned no data")
                    continue

                # Merge summary
                if result.get("summary"):
                    summary.update(result["summary"])

                # Count chart types and data points
                for ct, data in result.get("timeseries", {}).items():
                    chart_types_found.append(ct)
                    total_points += len(data) if isinstance(data, list) else 0

            except Exception as e:
                errors.append(f"{parser.name}: {str(e)}")

        # Validation checks
        if not summary.get("avg_fps") and not summary.get("avg_ia_power"):
            warnings.append("No FPS or power data extracted")
        if summary.get("avg_fps") is not None and summary["avg_fps"] == 0:
            errors.append("FPS is zero — benchmark may not have run")
        if summary.get("max_pkg_temp") and summary["max_pkg_temp"] > 100:
            warnings.append(f"Package temp {summary['max_pkg_temp']:.0f}C exceeds 100C")

        results.append({
            "game_slug": slug,
            "status": "error" if errors else ("warning" if warnings else "ok"),
            "summary": summary,
            "chart_types_found": chart_types_found,
            "total_data_points": total_points,
            "warnings": warnings,
            "errors": errors,
            "parsers_matched": list(matched.keys()),
        })

    return results


def check_conflicts(con: duckdb.DuckDBPyConnection, build_id: str, sku_id: str, game_slugs: list[str]) -> list[dict]:
    """Check which games already exist in the DB."""
    conflicts = []
    for slug in game_slugs:
        row = con.execute(
            "SELECT avg_fps, one_pct_low, avg_ia_power, max_pkg_temp "
            "FROM game_summary WHERE build_id = ? AND sku_id = ? AND game_slug = ?",
            [build_id, sku_id, slug],
        ).fetchone()
        if row:
            conflicts.append({
                "game_slug": slug,
                "existing": {
                    "avg_fps": row[0], "one_pct_low": row[1],
                    "avg_ia_power": row[2], "max_pkg_temp": row[3],
                },
            })
    return conflicts


def push_games(
    con: duckdb.DuckDBPyConnection,
    build_id: str,
    sku_id: str,
    build_type: str,
    parent_bkc: str | None,
    experiment_label: str | None,
    games: list[dict],
    on_progress=None,
) -> dict:
    """
    Parse and write games to the database.

    Args:
        con: DuckDB connection (writable)
        build_id, sku_id, build_type, parent_bkc, experiment_label: Build metadata
        games: List of {"game_slug", "source_path", "source_type", "conflict_resolution"}
        on_progress: Optional callback(game_slug, step, progress_pct)

    Returns:
        {"ingestion_id", "games_written", "games_skipped", "errors"}
    """
    all_parsers = get_all_parsers()
    ingestion_id = f"ing-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"

    games_written = []
    games_skipped = []
    game_errors = []
    all_chart_types = set()
    source_paths = set()

    for i, game in enumerate(games):
        slug = game["game_slug"]
        resolution = game.get("conflict_resolution", "overwrite")

        if on_progress:
            on_progress(slug, "starting", i / len(games))

        # Check conflict resolution
        if resolution == "skip":
            existing = con.execute(
                "SELECT 1 FROM game_summary WHERE build_id = ? AND sku_id = ? AND game_slug = ?",
                [build_id, sku_id, slug],
            ).fetchone()
            if existing:
                games_skipped.append(slug)
                continue

        try:
            trace_files = _collect_trace_files(game)
            matched = match_files(trace_files)

            merged_summary = {
                "build_id": build_id,
                "sku_id": sku_id,
                "game_slug": slug,
                "build_type": build_type,
                "parent_bkc": parent_bkc,
                "experiment_label": experiment_label,
            }

            if on_progress:
                on_progress(slug, "parsing", (i + 0.3) / len(games))

            for parser_key, files in matched.items():
                parser = all_parsers.get(parser_key)
                if not parser:
                    continue

                manifest = _read_manifest(game)
                result = parser.parse(files, slug, manifest=manifest)
                if result is None:
                    continue

                # Merge summary fields
                if result.get("summary"):
                    merged_summary.update(result["summary"])

                # Merge system_info fields
                sys_info = result.get("system_info", {})
                if sys_info:
                    for field in ["cpu_brand", "firmware", "gpu", "os", "motherboard"]:
                        if field in sys_info and field not in merged_summary:
                            merged_summary[field] = sys_info[field]

                # Write timeseries
                for chart_type, data in result.get("timeseries", {}).items():
                    if data:
                        db.upsert_timeseries(con, build_id, sku_id, slug, chart_type, data)
                        all_chart_types.add(chart_type)

            if on_progress:
                on_progress(slug, "writing_summary", (i + 0.7) / len(games))

            # Write summary
            db.upsert_summary(con, merged_summary)

            # Handle SystemScope
            sys_scope_path = _find_system_scope(game)
            if sys_scope_path:
                from backend.parsers.system_scope import parse_system_scope
                scope_data = parse_system_scope(sys_scope_path)
                if scope_data:
                    db.upsert_system_scope(con, build_id, sku_id, scope_data)

            games_written.append(slug)
            source_paths.add(game["source_path"])

            if on_progress:
                on_progress(slug, "done", (i + 1) / len(games))

        except Exception as e:
            log.error("Failed to ingest %s: %s", slug, e, exc_info=True)
            game_errors.append({"game_slug": slug, "error": str(e)})

    # Write ingestion log
    log_entry = {
        "id": ingestion_id,
        "pushed_at": datetime.now(timezone.utc).isoformat(),
        "build_id": build_id,
        "sku_id": sku_id,
        "build_type": build_type,
        "parent_bkc": parent_bkc,
        "experiment_label": experiment_label,
        "games": json.dumps(games_written),
        "game_count": len(games_written),
        "source_paths": json.dumps(list(source_paths)),
        "chart_types": json.dumps(sorted(all_chart_types)),
        "status": "completed" if not game_errors else "partial",
    }
    db.insert_ingestion_log(con, log_entry)

    return {
        "ingestion_id": ingestion_id,
        "games_written": games_written,
        "games_skipped": games_skipped,
        "errors": game_errors,
        "chart_types": sorted(all_chart_types),
    }


def write_marker(source_path: str, build_id: str, sku_id: str, ingestion_id: str, game_slugs: list[str]) -> None:
    """Write dashboard_ingestion.json marker to the source run folder."""
    marker_path = Path(source_path) / MARKER_FILE
    marker = {
        "ingestion_id": ingestion_id,
        "build_id": build_id,
        "sku_id": sku_id,
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "games_ingested": game_slugs,
    }
    try:
        marker_path.write_text(json.dumps(marker, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning("Failed to write marker to %s: %s", marker_path, e)
```

**Step 2: Commit**

```bash
git add backend/ingestion/push.py
git commit -m "feat(ingestion): add parse-preview and push-to-db logic"
```

---

### Task 6: Ingestion API Routes

**Files:**
- Create: `backend/ingestion/routes.py`
- Modify: `backend/main.py` (mount ingestion routes)

**Step 1: Create the routes module**

Create `backend/ingestion/routes.py`:

```python
"""FastAPI routes for the ingestion pipeline — /api/ingestion/*"""

import json
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from backend import db
from backend.ingestion import scanner
from backend.ingestion.push import parse_preview, check_conflicts, push_games, write_marker
from backend.parsers.registry import get_all_parsers, get_all_chart_types, get_all_parser_keys

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


# ── Pydantic models ──────────────────────────────────────────────

class SourceCreate(BaseModel):
    label: str
    path: str
    source_type: str  # raptor-x | gametraces | custom


class ScanRequest(BaseModel):
    source_ids: list[str] | None = None  # None = scan all


class GameEntry(BaseModel):
    game_slug: str
    source_path: str
    source_type: str = "raptor-x"


class PreviewRequest(BaseModel):
    games: list[GameEntry]


class PushRequest(BaseModel):
    build_id: str
    sku_id: str
    build_type: str = "bkc"
    parent_bkc: str | None = None
    experiment_label: str | None = None
    games: list[dict]  # Each has game_slug, source_path, source_type, conflict_resolution


# ── Source management ─────────────────────────────────────────────

@router.get("/sources")
def list_sources(request: Request):
    """List all saved ingestion source paths."""
    con = request.app.state.db
    return db.list_sources(con)


@router.post("/sources")
def add_source(body: SourceCreate, request: Request):
    """Add a new ingestion source path."""
    con = request.app.state.db_write
    source_id = f"src-{uuid.uuid4().hex[:8]}"

    # Validate path exists
    if not Path(body.path).exists():
        raise HTTPException(400, f"Path does not exist: {body.path}")

    db.add_source(con, source_id, body.label, body.path, body.source_type)
    return {"id": source_id, "label": body.label, "path": body.path, "source_type": body.source_type}


@router.delete("/sources/{source_id}")
def delete_source(source_id: str, request: Request):
    """Remove a saved source path."""
    con = request.app.state.db_write
    db.delete_source(con, source_id)
    return {"deleted": source_id}


# ── Scanning ──────────────────────────────────────────────────────

@router.post("/scan")
def scan_sources(body: ScanRequest, request: Request):
    """Scan source paths and discover runs."""
    con = request.app.state.db
    sources = db.list_sources(con)

    if body.source_ids:
        sources = [s for s in sources if s["id"] in body.source_ids]

    import time
    start = time.time()

    all_runs = []
    for source in sources:
        try:
            runs = scanner.scan_source(source)
            all_runs.extend(runs)
        except Exception as e:
            log.error("Failed to scan source %s: %s", source["label"], e)

    # Sort by date descending
    all_runs.sort(key=lambda r: r.get("created_at", ""), reverse=True)

    elapsed = int((time.time() - start) * 1000)
    total_games = sum(r["game_count"] for r in all_runs)

    return {
        "runs": all_runs,
        "scan_duration_ms": elapsed,
        "total_runs": len(all_runs),
        "total_games": total_games,
    }


# ── Run details & file browsing ──────────────────────────────────

@router.get("/runs/files")
def get_run_files(path: str):
    """List all files in a run folder."""
    if not Path(path).exists():
        raise HTTPException(404, "Run path not found")
    return scanner.get_run_files(path)


@router.get("/runs/file")
def read_run_file(path: str):
    """Read a specific file from a run folder."""
    if not Path(path).exists():
        raise HTTPException(404, "File not found")
    return scanner.read_file_content(path)


# ── Parse preview ─────────────────────────────────────────────────

@router.post("/parse-preview")
def do_parse_preview(body: PreviewRequest):
    """Run parsers on game files without writing to DB — returns metrics preview."""
    games = [g.model_dump() for g in body.games]
    results = parse_preview(games)
    return {"results": results}


# ── Conflict check ────────────────────────────────────────────────

@router.get("/conflicts")
def get_conflicts(build_id: str, sku_id: str, game_slugs: str, request: Request):
    """Check if games already exist in DB. game_slugs is comma-separated."""
    con = request.app.state.db
    slugs = [s.strip() for s in game_slugs.split(",") if s.strip()]
    conflicts = check_conflicts(con, build_id, sku_id, slugs)
    return {"conflicts": conflicts}


# ── Push to database ──────────────────────────────────────────────

@router.post("/push")
def do_push(body: PushRequest, request: Request):
    """Parse and write games to the dashboard database."""
    # Use a writable connection
    con = request.app.state.db_write

    result = push_games(
        con=con,
        build_id=body.build_id,
        sku_id=body.sku_id,
        build_type=body.build_type,
        parent_bkc=body.parent_bkc,
        experiment_label=body.experiment_label,
        games=body.games,
    )

    # Write marker files to source folders
    source_paths_seen = set()
    for game in body.games:
        sp = game.get("source_path", "")
        if sp and sp not in source_paths_seen:
            write_marker(sp, body.build_id, body.sku_id, result["ingestion_id"], result["games_written"])
            source_paths_seen.add(sp)

    # Clear dashboard cache
    if hasattr(request.app.state, "cache"):
        request.app.state.cache.clear()

    return result


# ── Ingestion history ─────────────────────────────────────────────

@router.get("/history")
def get_history(request: Request):
    """List all past ingestion log entries."""
    con = request.app.state.db
    return db.list_ingestion_log(con)


@router.delete("/history/{ingestion_id}/rollback")
def do_rollback(ingestion_id: str, request: Request):
    """Roll back an ingestion — delete all data from that batch."""
    con = request.app.state.db_write
    result = db.rollback_ingestion(con, ingestion_id)
    # Clear cache after rollback
    if hasattr(request.app.state, "cache"):
        request.app.state.cache.clear()
    return result


# ── Parser info ───────────────────────────────────────────────────

@router.get("/parsers")
def list_parsers():
    """List all registered parser plugins and their capabilities."""
    parsers = get_all_parsers()
    return [
        {
            "key": p.key,
            "name": p.name,
            "file_patterns": p.file_patterns,
            "chart_types": p.chart_types,
            "summary_fields": p.summary_fields,
        }
        for p in parsers.values()
    ]
```

**Step 2: Mount routes in main.py**

In `backend/main.py`, add after imports (around line 15):

```python
from backend.ingestion.routes import router as ingestion_router
```

After the `app` object is created and CORS is set up (around line 46), add:

```python
app.include_router(ingestion_router)
```

Also, we need a writable DB connection for ingestion. After the read-only connection setup (around line 114), add:

```python
# Writable connection for ingestion operations
import duckdb as _duckdb
app.state.db_write = _duckdb.connect(str(DB_PATH), read_only=False)
```

And expose the cache dict on app.state (find where `_cache` is defined around line 126):

```python
app.state.cache = _cache
```

**Step 3: Verify server starts with ingestion routes**

Run: `cd D:\code\gaming-dashboard && python -c "from backend.ingestion.routes import router; print(f'{len(router.routes)} ingestion routes registered')"`

Expected: Should print route count (e.g., `12 ingestion routes registered`)

**Step 4: Commit**

```bash
git add backend/ingestion/routes.py backend/main.py
git commit -m "feat(ingestion): add /api/ingestion/* FastAPI routes and mount on app"
```

---

## Phase 2: Frontend Foundation

### Task 7: Add Ingestion Route and Sidebar Link

**Files:**
- Create: `src/components/ingestion/IngestionPage.jsx`
- Modify: `src/App.jsx` (add route, ~line 118-123)
- Modify: `src/components/layout/Sidebar.jsx` (add link, ~line 235-237)

**Step 1: Create the IngestionPage shell**

Create `src/components/ingestion/IngestionPage.jsx`:

```jsx
import { useState } from 'react';
import SourceManager from './SourceManager';
import RunExplorer from './RunExplorer';
import RunDetailPanel from './RunDetailPanel';
import Workbench from './Workbench';

export default function IngestionPage() {
    const [runs, setRuns] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [selectedRun, setSelectedRun] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Workbench state managed in Workbench component via localStorage

    return (
        <div className="flex flex-col h-full gap-3 p-4 overflow-hidden">
            {/* Source bar */}
            <SourceManager
                onScanComplete={(discoveredRuns) => {
                    setRuns(discoveredRuns);
                    setScanning(false);
                }}
                onScanStart={() => setScanning(true)}
            />

            {/* Main content: explorer + detail split */}
            <div className="flex gap-3 flex-1 min-h-0">
                {/* Left: Run explorer */}
                <div className="flex-1 min-w-0 overflow-auto rounded-xl bg-[#140f2d]/60 border border-primary/15 p-3">
                    <RunExplorer
                        runs={runs}
                        scanning={scanning}
                        onSelectRun={setSelectedRun}
                        onSelectFile={setSelectedFile}
                        selectedRunId={selectedRun?.id}
                    />
                </div>

                {/* Right: Detail panel */}
                <div className="w-[420px] shrink-0 overflow-auto rounded-xl bg-[#140f2d]/60 border border-primary/15 p-3">
                    <RunDetailPanel
                        run={selectedRun}
                        selectedFile={selectedFile}
                        onSelectFile={setSelectedFile}
                    />
                </div>
            </div>

            {/* Bottom: Workbench */}
            <div className="h-[340px] shrink-0 overflow-auto rounded-xl bg-[#140f2d]/60 border border-amber-500/20 p-3">
                <Workbench runs={runs} />
            </div>
        </div>
    );
}
```

**Step 2: Create placeholder child components**

These will be filled in subsequent tasks. Create minimal placeholders so the page renders:

Create `src/components/ingestion/SourceManager.jsx`:
```jsx
import { useState, useEffect } from 'react';

export default function SourceManager({ onScanComplete, onScanStart }) {
    const [sources, setSources] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newPath, setNewPath] = useState('');
    const [newType, setNewType] = useState('raptor-x');

    useEffect(() => {
        fetch('/api/ingestion/sources').then(r => r.json()).then(setSources).catch(() => {});
    }, []);

    const addSource = async () => {
        if (!newLabel || !newPath) return;
        try {
            const res = await fetch('/api/ingestion/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: newLabel, path: newPath, source_type: newType }),
            });
            if (res.ok) {
                const src = await res.json();
                setSources(prev => [...prev, src]);
                setShowAdd(false);
                setNewLabel('');
                setNewPath('');
            }
        } catch (e) { console.error(e); }
    };

    const removeSource = async (id) => {
        await fetch(`/api/ingestion/sources/${id}`, { method: 'DELETE' });
        setSources(prev => prev.filter(s => s.id !== id));
    };

    const scanAll = async () => {
        onScanStart?.();
        try {
            const res = await fetch('/api/ingestion/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_ids: null }),
            });
            const data = await res.json();
            onScanComplete?.(data.runs || []);
        } catch (e) {
            console.error(e);
            onScanComplete?.([]);
        }
    };

    return (
        <div className="flex items-center gap-2 rounded-xl bg-[#140f2d]/60 border border-primary/15 px-3 py-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Sources</span>

            {sources.map(s => (
                <div key={s.id} className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 text-xs text-slate-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.source_type === 'raptor-x' ? 'bg-cyan-400' : s.source_type === 'gametraces' ? 'bg-purple-400' : 'bg-amber-400'}`} />
                    <span>{s.label}</span>
                    <button onClick={() => removeSource(s.id)} className="text-slate-500 hover:text-red-400 ml-1">&times;</button>
                </div>
            ))}

            {showAdd ? (
                <div className="flex items-center gap-1">
                    <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label" className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white w-24" />
                    <input value={newPath} onChange={e => setNewPath(e.target.value)} placeholder="Path" className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white w-64" />
                    <select value={newType} onChange={e => setNewType(e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
                        <option value="raptor-x">Raptor-X</option>
                        <option value="gametraces">Gametraces</option>
                        <option value="custom">Custom</option>
                    </select>
                    <button onClick={addSource} className="bg-amber-500/20 text-amber-400 rounded px-2 py-1 text-xs hover:bg-amber-500/30">Add</button>
                    <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-300 text-xs">Cancel</button>
                </div>
            ) : (
                <button onClick={() => setShowAdd(true)} className="text-amber-400 hover:text-amber-300 text-xs bg-amber-500/10 rounded-lg px-2 py-1">+ Add</button>
            )}

            <div className="ml-auto">
                <button onClick={scanAll} className="bg-amber-500/20 text-amber-400 rounded-lg px-3 py-1 text-xs font-semibold hover:bg-amber-500/30 transition-colors">
                    Scan All
                </button>
            </div>
        </div>
    );
}
```

Create `src/components/ingestion/RunExplorer.jsx`:
```jsx
import { useState, useMemo } from 'react';

export default function RunExplorer({ runs, scanning, onSelectRun, onSelectFile, selectedRunId }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ingestionFilter, setIngestionFilter] = useState('all');
    const [expandedRuns, setExpandedRuns] = useState(new Set());

    const filtered = useMemo(() => {
        let r = runs;
        if (search) {
            const q = search.toLowerCase();
            r = r.filter(run =>
                run.folder_name.toLowerCase().includes(q) ||
                run.games.some(g => (g.game_name || '').toLowerCase().includes(q)) ||
                (run.sut?.hostname || '').toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'all') r = r.filter(run => run.status === statusFilter);
        if (ingestionFilter !== 'all') r = r.filter(run => run.ingestion_state === ingestionFilter);
        return r;
    }, [runs, search, statusFilter, ingestionFilter]);

    const toggleExpand = (id) => {
        setExpandedRuns(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const healthColor = { green: 'bg-emerald-400', yellow: 'bg-amber-400', red: 'bg-red-400', gray: 'bg-slate-500' };
    const stateColor = { new: 'text-cyan-400', ingested: 'text-emerald-400', stale: 'text-amber-400' };

    if (scanning) {
        return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Scanning sources...</div>;
    }

    if (runs.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 text-sm">No runs discovered. Add sources and scan.</div>;
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-1">
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search runs, games, SUTs..."
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white flex-1"
                />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
                <select value={ingestionFilter} onChange={e => setIngestionFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
                    <option value="all">All Ingestion</option>
                    <option value="new">New</option>
                    <option value="ingested">Ingested</option>
                </select>
                <span className="text-xs text-slate-500">{filtered.length} runs</span>
            </div>

            {/* Run list */}
            <div className="flex flex-col gap-1">
                {filtered.map(run => (
                    <div key={run.id}>
                        <div
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${selectedRunId === run.id ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-white/5'}`}
                            onClick={() => { onSelectRun(run); toggleExpand(run.id); }}
                        >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${healthColor[run.health] || 'bg-slate-500'}`} />
                            <span className="text-slate-500 w-16 shrink-0">{(run.created_at || '').slice(0, 10)}</span>
                            <span className="text-white truncate flex-1 font-medium">{run.folder_name}</span>
                            <span className="text-slate-500">{run.run_type}</span>
                            <span className="text-slate-400">{run.game_count}g</span>
                            <span className={`text-xs ${stateColor[run.ingestion_state] || 'text-slate-500'}`}>{run.ingestion_state}</span>
                            <span className="text-slate-600">{expandedRuns.has(run.id) ? '▾' : '▸'}</span>
                        </div>

                        {expandedRuns.has(run.id) && (
                            <div className="ml-6 flex flex-col gap-0.5 mt-0.5">
                                {run.games.map((game, gi) => (
                                    <div key={gi} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-400 hover:bg-white/5 rounded">
                                        <span className={`w-1.5 h-1.5 rounded-full ${game.status === 'completed' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                        <span className="text-slate-300 flex-1 truncate">{game.game_name}</span>
                                        <span className="text-slate-500">{game.game_slug || '?'}</span>
                                        <div className="flex gap-0.5">
                                            {game.traces.ptat && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1 rounded">PTAT</span>}
                                            {game.traces.presentmon && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">PM</span>}
                                            {game.traces.capframex && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">CFX</span>}
                                            {game.traces.emon && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1 rounded">EMON</span>}
                                        </div>
                                        {game.scores && <span className="text-emerald-400">{game.scores.avg_fps?.toFixed(1)} fps</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

Create `src/components/ingestion/RunDetailPanel.jsx`:
```jsx
import { useState, useEffect } from 'react';

export default function RunDetailPanel({ run, selectedFile, onSelectFile }) {
    const [files, setFiles] = useState([]);
    const [fileContent, setFileContent] = useState(null);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        if (run?.folder_path) {
            fetch(`/api/ingestion/runs/files?path=${encodeURIComponent(run.folder_path)}`)
                .then(r => r.json())
                .then(setFiles)
                .catch(() => setFiles([]));
        }
    }, [run?.id]);

    useEffect(() => {
        if (selectedFile) {
            fetch(`/api/ingestion/runs/file?path=${encodeURIComponent(selectedFile)}`)
                .then(r => r.json())
                .then(setFileContent)
                .catch(() => setFileContent(null));
        } else {
            setFileContent(null);
        }
    }, [selectedFile]);

    if (!run) {
        return <div className="flex items-center justify-center h-full text-slate-500 text-sm">Select a run to view details</div>;
    }

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Header */}
            <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-semibold text-white truncate">{run.folder_name}</h3>
                <div className="flex gap-2 mt-1 text-xs text-slate-400">
                    <span>{run.sut?.hostname}</span>
                    <span>{run.sut?.gpu_short}</span>
                    <span>{run.created_at?.slice(0, 10)}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
                {['info', 'files', 'viewer'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${activeTab === tab ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'info' && (
                    <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-1">
                            <span className="text-slate-500">Status</span><span className="text-white">{run.status}</span>
                            <span className="text-slate-500">Type</span><span className="text-white">{run.run_type}</span>
                            <span className="text-slate-500">Games</span><span className="text-white">{run.game_count}</span>
                            <span className="text-slate-500">SUT</span><span className="text-white">{run.sut?.hostname} ({run.sut?.ip})</span>
                            <span className="text-slate-500">CPU</span><span className="text-white">{run.sut?.cpu_brand}</span>
                            <span className="text-slate-500">GPU</span><span className="text-white">{run.sut?.gpu_short}</span>
                            <span className="text-slate-500">BIOS</span><span className="text-white truncate">{run.sut?.bios_version}</span>
                            <span className="text-slate-500">Ingestion</span><span className={`${run.ingestion_state === 'new' ? 'text-cyan-400' : 'text-emerald-400'}`}>{run.ingestion_state}</span>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="space-y-0.5">
                        {files.map((f, i) => (
                            <div key={i}
                                onClick={() => { onSelectFile(f.absolute_path); setActiveTab('viewer'); }}
                                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-white/5 text-xs">
                                <span className={`${f.type === 'json' ? 'text-amber-400' : f.type === 'csv' ? 'text-cyan-400' : f.type === 'image' ? 'text-pink-400' : 'text-slate-500'}`}>
                                    {f.type === 'json' ? '{}' : f.type === 'csv' ? '⊞' : f.type === 'image' ? '🖼' : '📄'}
                                </span>
                                <span className="text-slate-300 truncate flex-1">{f.relative_path}</span>
                                <span className="text-slate-600">{(f.size / 1024).toFixed(0)}k</span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'viewer' && fileContent && (
                    <div className="text-xs">
                        {fileContent.type === 'json' && (
                            <pre className="text-slate-300 whitespace-pre-wrap break-words bg-black/20 rounded p-2 overflow-auto max-h-[500px]">
                                {JSON.stringify(fileContent.content, null, 2)}
                            </pre>
                        )}
                        {fileContent.type === 'csv' && (
                            <div className="overflow-auto max-h-[500px]">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            {fileContent.headers?.slice(0, 20).map((h, i) => (
                                                <th key={i} className="px-1 py-0.5 text-slate-500 font-medium truncate max-w-[120px]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fileContent.rows?.slice(0, 100).map((row, ri) => (
                                            <tr key={ri} className="border-b border-white/5">
                                                {row.slice(0, 20).map((cell, ci) => (
                                                    <td key={ci} className="px-1 py-0.5 text-slate-400 truncate max-w-[120px]">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {fileContent.truncated && <div className="text-slate-500 mt-1">Showing {fileContent.rows?.length} of {fileContent.total_rows} rows</div>}
                            </div>
                        )}
                        {fileContent.type === 'image' && (
                            <img src={`data:${fileContent.mime};base64,${fileContent.content}`} alt="Preview" className="max-w-full rounded" />
                        )}
                        {fileContent.type === 'text' && (
                            <pre className="text-slate-300 whitespace-pre-wrap bg-black/20 rounded p-2 overflow-auto max-h-[500px]">{fileContent.content}</pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
```

Create `src/components/ingestion/Workbench.jsx`:
```jsx
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ingestion-workbenches';

function loadWorkbenches() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
}

function saveWorkbenches(wbs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wbs));
}

export default function Workbench({ runs }) {
    const [workbenches, setWorkbenches] = useState(loadWorkbenches);
    const [activeIdx, setActiveIdx] = useState(0);
    const [reviewResults, setReviewResults] = useState(null);
    const [pushResult, setPushResult] = useState(null);
    const [pushing, setPushing] = useState(false);

    useEffect(() => { saveWorkbenches(workbenches); }, [workbenches]);

    const activeWb = workbenches[activeIdx] || null;

    const createWorkbench = () => {
        const wb = {
            id: `wb-${Date.now()}`,
            name: 'New Build',
            build_id: '',
            sku_id: '',
            build_type: 'bkc',
            parent_bkc: null,
            experiment_label: null,
            games: [],
        };
        setWorkbenches(prev => [...prev, wb]);
        setActiveIdx(workbenches.length);
    };

    const updateWb = (field, value) => {
        setWorkbenches(prev => prev.map((wb, i) => i === activeIdx ? { ...wb, [field]: value } : wb));
    };

    const addGame = useCallback((game, run) => {
        if (!activeWb) return;
        const existing = activeWb.games.findIndex(g => g.game_slug === game.game_slug);
        const entry = {
            game_slug: game.game_slug,
            game_name: game.game_name,
            source_run_id: run.id,
            source_run_name: run.folder_name,
            source_path: game.game_path,
            source_type: run.source_type,
            traces: game.traces,
            scores: game.scores,
            added_at: new Date().toISOString(),
        };

        setWorkbenches(prev => prev.map((wb, i) => {
            if (i !== activeIdx) return wb;
            const games = [...wb.games];
            if (existing >= 0) {
                games[existing] = entry;
            } else {
                games.push(entry);
            }
            return { ...wb, games };
        }));
    }, [activeWb, activeIdx]);

    const removeGame = (slugToRemove) => {
        setWorkbenches(prev => prev.map((wb, i) =>
            i === activeIdx ? { ...wb, games: wb.games.filter(g => g.game_slug !== slugToRemove) } : wb
        ));
    };

    const addAllFromRun = (run) => {
        run.games.forEach(game => addGame(game, run));
    };

    const doReview = async () => {
        if (!activeWb || activeWb.games.length === 0) return;
        const payload = activeWb.games.map(g => ({ game_slug: g.game_slug, source_path: g.source_path, source_type: g.source_type }));
        try {
            const res = await fetch('/api/ingestion/parse-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ games: payload }),
            });
            const data = await res.json();
            setReviewResults(data.results);
        } catch (e) { console.error(e); }
    };

    const doPush = async () => {
        if (!activeWb || activeWb.games.length === 0) return;
        setPushing(true);
        setPushResult(null);
        try {
            const res = await fetch('/api/ingestion/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    build_id: activeWb.build_id,
                    sku_id: activeWb.sku_id,
                    build_type: activeWb.build_type,
                    parent_bkc: activeWb.parent_bkc,
                    experiment_label: activeWb.experiment_label,
                    games: activeWb.games.map(g => ({
                        game_slug: g.game_slug,
                        source_path: g.source_path,
                        source_type: g.source_type,
                        conflict_resolution: 'overwrite',
                    })),
                }),
            });
            const data = await res.json();
            setPushResult(data);
            // Clear cache
            await fetch('/api/cache/clear', { method: 'POST' });
        } catch (e) {
            console.error(e);
        } finally {
            setPushing(false);
        }
    };

    // Expose addGame and addAllFromRun globally for RunExplorer to call
    useEffect(() => {
        window.__workbench = { addGame, addAllFromRun };
        return () => { delete window.__workbench; };
    }, [addGame]);

    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-2 border-b border-white/10 pb-1">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider mr-2">Workbench</span>
                {workbenches.map((wb, i) => (
                    <button key={wb.id} onClick={() => { setActiveIdx(i); setReviewResults(null); setPushResult(null); }}
                        className={`px-2 py-1 rounded text-xs transition-colors ${i === activeIdx ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                        {wb.name || 'Untitled'}
                    </button>
                ))}
                <button onClick={createWorkbench} className="text-amber-400/50 hover:text-amber-400 text-xs px-2 py-1">+ New</button>
            </div>

            {!activeWb ? (
                <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">Create a workbench to start assembling a build</div>
            ) : (
                <div className="flex gap-3 flex-1 min-h-0">
                    {/* Metadata */}
                    <div className="w-56 shrink-0 space-y-2">
                        <input value={activeWb.name} onChange={e => updateWb('name', e.target.value)} placeholder="Build Name" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                        <input value={activeWb.build_id} onChange={e => updateWb('build_id', e.target.value)} placeholder="Build ID" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                        <input value={activeWb.sku_id} onChange={e => updateWb('sku_id', e.target.value)} placeholder="SKU ID (e.g. nvl-sk-28c)" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                        <div className="flex gap-2">
                            <label className="flex items-center gap-1 text-xs text-slate-400">
                                <input type="radio" checked={activeWb.build_type === 'bkc'} onChange={() => updateWb('build_type', 'bkc')} /> BKC
                            </label>
                            <label className="flex items-center gap-1 text-xs text-slate-400">
                                <input type="radio" checked={activeWb.build_type === 'experiment'} onChange={() => updateWb('build_type', 'experiment')} /> Experiment
                            </label>
                        </div>
                        {activeWb.build_type === 'experiment' && (
                            <>
                                <input value={activeWb.parent_bkc || ''} onChange={e => updateWb('parent_bkc', e.target.value)} placeholder="Parent BKC" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                                <input value={activeWb.experiment_label || ''} onChange={e => updateWb('experiment_label', e.target.value)} placeholder="Experiment Label" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                            </>
                        )}
                        <div className="flex flex-col gap-1 pt-2">
                            <button onClick={doReview} disabled={activeWb.games.length === 0}
                                className="bg-amber-500/20 text-amber-400 rounded px-2 py-1.5 text-xs font-semibold hover:bg-amber-500/30 disabled:opacity-30 transition-colors">
                                Review ({activeWb.games.length})
                            </button>
                            <button onClick={doPush} disabled={!activeWb.build_id || !activeWb.sku_id || activeWb.games.length === 0 || pushing}
                                className="bg-emerald-500/20 text-emerald-400 rounded px-2 py-1.5 text-xs font-semibold hover:bg-emerald-500/30 disabled:opacity-30 transition-colors">
                                {pushing ? 'Pushing...' : 'Push to Dashboard'}
                            </button>
                        </div>
                    </div>

                    {/* Game list */}
                    <div className="flex-1 overflow-auto">
                        {activeWb.games.length === 0 ? (
                            <div className="text-slate-500 text-xs text-center py-8">Add games from the explorer above. Expand a run and use the context to add.</div>
                        ) : (
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-slate-500 border-b border-white/10">
                                        <th className="text-left py-1 px-1">Game</th>
                                        <th className="text-left py-1 px-1">Source</th>
                                        <th className="text-left py-1 px-1">Traces</th>
                                        <th className="text-right py-1 px-1">FPS</th>
                                        <th className="text-right py-1 px-1"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeWb.games.map(g => (
                                        <tr key={g.game_slug} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-1 px-1 text-white">{g.game_name}</td>
                                            <td className="py-1 px-1 text-slate-400 truncate max-w-[200px]">{g.source_run_name}</td>
                                            <td className="py-1 px-1">
                                                <div className="flex gap-0.5">
                                                    {g.traces?.ptat && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1 rounded">PTAT</span>}
                                                    {g.traces?.presentmon && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">PM</span>}
                                                    {g.traces?.capframex && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">CFX</span>}
                                                </div>
                                            </td>
                                            <td className="py-1 px-1 text-right text-emerald-400">{g.scores?.avg_fps?.toFixed(1) || '—'}</td>
                                            <td className="py-1 px-1 text-right">
                                                <button onClick={() => removeGame(g.game_slug)} className="text-slate-600 hover:text-red-400">&times;</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Review results */}
                        {reviewResults && (
                            <div className="mt-3 border-t border-white/10 pt-2">
                                <h4 className="text-xs font-semibold text-amber-400 mb-1">Parse Preview</h4>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-slate-500 border-b border-white/10">
                                            <th className="text-left py-1">Game</th>
                                            <th className="text-right py-1">Avg FPS</th>
                                            <th className="text-right py-1">1% Low</th>
                                            <th className="text-right py-1">Power</th>
                                            <th className="text-right py-1">Temp</th>
                                            <th className="text-right py-1">Charts</th>
                                            <th className="text-center py-1">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviewResults.map(r => (
                                            <tr key={r.game_slug} className="border-b border-white/5">
                                                <td className="py-1 text-white">{r.game_slug}</td>
                                                <td className="py-1 text-right text-emerald-400">{r.summary.avg_fps?.toFixed(1) || '—'}</td>
                                                <td className="py-1 text-right text-cyan-400">{r.summary.one_pct_low?.toFixed(1) || '—'}</td>
                                                <td className="py-1 text-right text-blue-400">{r.summary.avg_ia_power?.toFixed(1) || '—'}W</td>
                                                <td className="py-1 text-right text-amber-400">{r.summary.max_pkg_temp?.toFixed(0) || '—'}C</td>
                                                <td className="py-1 text-right text-slate-400">{r.chart_types_found.length}</td>
                                                <td className="py-1 text-center">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${r.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400' : r.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Push result */}
                        {pushResult && (
                            <div className="mt-3 border-t border-white/10 pt-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-emerald-400 font-semibold">Pushed {pushResult.games_written?.length} games</span>
                                    {pushResult.games_skipped?.length > 0 && <span className="text-amber-400">({pushResult.games_skipped.length} skipped)</span>}
                                    {pushResult.errors?.length > 0 && <span className="text-red-400">({pushResult.errors.length} errors)</span>}
                                    <span className="text-slate-500">ID: {pushResult.ingestion_id}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
```

**Step 3: Add route to App.jsx**

In `src/App.jsx`, add the lazy import (around line 11):
```jsx
const IngestionPage = lazy(() => import('./components/ingestion/IngestionPage'));
```

Add the route (before the closing `</Routes>` around line 123):
```jsx
<Route path="/ingestion" element={<Suspense fallback={<div />}><IngestionPage /></Suspense>} />
```

**Step 4: Add Sidebar link**

In `src/components/layout/Sidebar.jsx`, add an import for the icon at the top (line 2):
```jsx
import { Gauge, ArrowLeftRight, Layers, ChevronLeft, ChevronRight, Cpu, GitBranch, UploadCloud } from 'lucide-react';
```

Add the Ingestion button between Compare and Demo buttons (around line 236):
```jsx
{/* Ingestion */}
<button
    onClick={() => navigate('/ingestion')}
    className={`
        flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200
        ${collapsed ? 'justify-center px-1 py-2' : 'px-2 py-1.5'}
        ${location.pathname === '/ingestion'
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-slate-50'
            : 'bg-transparent hover:bg-white/5 text-slate-400'}
    `}
    style={{
        borderLeft: !collapsed && location.pathname === '/ingestion' ? '3px solid #f59e0b' : '3px solid transparent'
    }}
    title={collapsed ? 'Data Ingestion' : undefined}
>
    <UploadCloud size={16} className={location.pathname === '/ingestion' ? 'text-amber-500' : 'text-slate-500'} />
    {!collapsed && <span className="text-xs font-medium">Ingest</span>}
</button>
```

**Step 5: Verify the page loads**

Run: `cd D:\code\gaming-dashboard && npm run dev`

Navigate to `http://localhost:5173/ingestion` — should see the full page layout with source bar, explorer, detail panel, and workbench sections.

**Step 6: Commit**

```bash
git add src/components/ingestion/ src/App.jsx src/components/layout/Sidebar.jsx
git commit -m "feat(ingestion): add IngestionPage with all panels, route, and sidebar link"
```

---

## Phase 3: Integration & Polish

### Task 8: Wire Up Add-to-Workbench from Explorer

**Files:**
- Modify: `src/components/ingestion/RunExplorer.jsx`
- Modify: `src/components/ingestion/IngestionPage.jsx`

**Step 1: Add "Add to Workbench" buttons in RunExplorer**

Replace the window.__workbench pattern with proper prop callbacks. In `IngestionPage.jsx`, pass a ref or callback down:

In `IngestionPage.jsx`, add a ref for the workbench:
```jsx
const workbenchRef = useRef(null);
```

Pass it to Workbench and RunExplorer:
```jsx
<RunExplorer
    ...existing props...
    onAddGame={(game, run) => workbenchRef.current?.addGame(game, run)}
    onAddRun={(run) => workbenchRef.current?.addAllFromRun(run)}
/>

<Workbench ref={workbenchRef} runs={runs} />
```

In `RunExplorer.jsx`, add buttons next to each game row and run row:
- Per game: "+" button that calls `onAddGame(game, run)`
- Per run: "Add All" button that calls `onAddRun(run)`

In `Workbench.jsx`, use `forwardRef` + `useImperativeHandle` to expose `addGame` and `addAllFromRun`.

**Step 2: Commit**

```bash
git add src/components/ingestion/
git commit -m "feat(ingestion): wire add-to-workbench buttons in run explorer"
```

---

### Task 9: Ingestion History Panel

**Files:**
- Create: `src/components/ingestion/IngestionHistory.jsx`
- Modify: `src/components/ingestion/IngestionPage.jsx` (add history tab)

**Step 1: Create IngestionHistory component**

```jsx
import { useState, useEffect } from 'react';

export default function IngestionHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ingestion/history');
            const data = await res.json();
            setHistory(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchHistory(); }, []);

    const rollback = async (id) => {
        if (!confirm('Roll back this ingestion? All data from this batch will be deleted.')) return;
        await fetch(`/api/ingestion/history/${id}/rollback`, { method: 'DELETE' });
        await fetch('/api/cache/clear', { method: 'POST' });
        fetchHistory();
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Ingestion History</h3>
            {loading ? <div className="text-slate-500 text-xs">Loading...</div> : (
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-slate-500 border-b border-white/10">
                            <th className="text-left py-1">Date</th>
                            <th className="text-left py-1">Build</th>
                            <th className="text-left py-1">SKU</th>
                            <th className="text-left py-1">Type</th>
                            <th className="text-right py-1">Games</th>
                            <th className="text-center py-1">Status</th>
                            <th className="text-right py-1">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-1 text-slate-400">{h.pushed_at?.slice(0, 16)}</td>
                                <td className="py-1 text-white">{h.build_id}</td>
                                <td className="py-1 text-slate-300">{h.sku_id}</td>
                                <td className="py-1 text-slate-400">{h.build_type}</td>
                                <td className="py-1 text-right text-slate-300">{h.game_count}</td>
                                <td className="py-1 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${h.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : h.status === 'rolled_back' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {h.status}
                                    </span>
                                </td>
                                <td className="py-1 text-right">
                                    {h.status !== 'rolled_back' && (
                                        <button onClick={() => rollback(h.id)} className="text-red-400/50 hover:text-red-400 text-[10px]">Rollback</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
```

**Step 2: Add a history toggle to the workbench area**

In `IngestionPage.jsx`, add a toggle button that switches the bottom panel between Workbench and History views.

**Step 3: Commit**

```bash
git add src/components/ingestion/IngestionHistory.jsx src/components/ingestion/IngestionPage.jsx
git commit -m "feat(ingestion): add ingestion history panel with rollback"
```

---

### Task 10: Backend Writable DB Connection & Final Wiring

**Files:**
- Modify: `backend/main.py`

**Step 1: Add writable DB connection**

The existing backend opens DuckDB in `read_only=True` mode. Ingestion needs write access. Add a second connection for write operations.

In `backend/main.py`, after the read-only connection setup (around line 114), add:

```python
# Writable connection for ingestion operations
try:
    _db_write = duckdb.connect(str(DB_PATH), read_only=False)
    db.init_schema(_db_write)  # Ensure new tables exist
    app.state.db_write = _db_write
except Exception as e:
    print(f"Warning: Could not open writable DB connection: {e}")
    app.state.db_write = None
```

Add the router import and mount:

```python
from backend.ingestion.routes import router as ingestion_router
app.include_router(ingestion_router)
```

Expose the cache:
```python
app.state.cache = _cache
```

**Step 2: Handle the case where db_write is used in routes**

In `backend/ingestion/routes.py`, the routes that write should check `request.app.state.db_write` is not None:

```python
@router.post("/sources")
def add_source(body: SourceCreate, request: Request):
    con = request.app.state.db_write
    if con is None:
        raise HTTPException(503, "Database is in read-only mode")
    ...
```

**Step 3: Verify end-to-end**

1. Start backend: `cd D:\code\gaming-dashboard && python -m uvicorn backend.main:app --port 9001`
2. Start frontend: `npm run dev`
3. Navigate to `http://localhost:5173/ingestion`
4. Add a source path, scan, browse runs, add games to workbench, review, push

**Step 4: Commit**

```bash
git add backend/main.py backend/ingestion/routes.py
git commit -m "feat(ingestion): add writable DB connection and final backend wiring"
```

---

## Task Dependency Summary

```
Task 1  (base + registry)
Task 2  (parser wrappers)  ← depends on Task 1
Task 3  (DB schema)
Task 4  (scanner)          ← depends on Task 1
Task 5  (push logic)       ← depends on Task 1, 3
Task 6  (API routes)       ← depends on Task 3, 4, 5
Task 7  (frontend all)     ← depends on Task 6
Task 8  (wire explorer)    ← depends on Task 7
Task 9  (history panel)    ← depends on Task 7
Task 10 (final wiring)     ← depends on Task 6
```

**Parallelizable groups:**
- Tasks 1, 3 can run in parallel
- Tasks 2, 4 can run in parallel (both depend on 1)
- Tasks 7, 10 can run in parallel (both depend on 6)
- Tasks 8, 9 can run in parallel (both depend on 7)

---

## File Summary

| File | Action | Task |
|------|--------|------|
| `backend/parsers/base.py` | Create | 1 |
| `backend/parsers/registry.py` | Create | 1 |
| `backend/parsers/ptat_parser.py` | Create | 2 |
| `backend/parsers/presentmon_parser.py` | Create | 2 |
| `backend/parsers/capframex_parser.py` | Create | 2 |
| `backend/parsers/system_scope_parser.py` | Create | 2 |
| `backend/db.py` | Modify | 3 |
| `backend/ingestion/__init__.py` | Create | 4 |
| `backend/ingestion/scanner.py` | Create | 4 |
| `backend/ingestion/push.py` | Create | 5 |
| `backend/ingestion/routes.py` | Create | 6 |
| `backend/main.py` | Modify | 6, 10 |
| `src/components/ingestion/IngestionPage.jsx` | Create | 7 |
| `src/components/ingestion/SourceManager.jsx` | Create | 7 |
| `src/components/ingestion/RunExplorer.jsx` | Create | 7 |
| `src/components/ingestion/RunDetailPanel.jsx` | Create | 7 |
| `src/components/ingestion/Workbench.jsx` | Create | 7 |
| `src/components/ingestion/IngestionHistory.jsx` | Create | 9 |
| `src/App.jsx` | Modify | 7 |
| `src/components/layout/Sidebar.jsx` | Modify | 7 |
