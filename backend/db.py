"""
DuckDB schema setup for the gaming dashboard backend.
Three tables:
  - game_summary   : one row per (build, sku, game) — KPI metrics
  - timeseries     : one row per (build, sku, game, chart_type) — chart arrays stored as JSON
  - system_scope   : one row per (build, sku) — full System Scope log data as JSON
"""

import json
from pathlib import Path

import duckdb

# Database file lives alongside this module
DEFAULT_DB_PATH = Path(__file__).parent / "data" / "gaming_dashboard.duckdb"


def get_connection(db_path: Path = DEFAULT_DB_PATH, read_only: bool = False) -> duckdb.DuckDBPyConnection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return duckdb.connect(str(db_path), read_only=read_only)


def init_schema(db_path: Path = DEFAULT_DB_PATH) -> None:
    """Create tables if they don't exist."""
    con = get_connection(db_path)
    con.execute("""
        CREATE TABLE IF NOT EXISTS game_summary (
            build_id            TEXT NOT NULL,
            sku_id              TEXT NOT NULL,
            game_slug           TEXT NOT NULL,
            -- FPS metrics (from CapFrameX)
            avg_fps             FLOAT,
            one_pct_low         FLOAT,
            zero_one_pct_low    FLOAT,
            max_fps             FLOAT,
            min_fps             FLOAT,
            avg_frame_time_ms   FLOAT,
            p95_frame_time_ms   FLOAT,
            p99_frame_time_ms   FLOAT,
            avg_gpu_active_ms   FLOAT,
            avg_cpu_active_ms   FLOAT,
            -- Power metrics (from PTAT)
            avg_ia_power        FLOAT,
            max_ia_power        FLOAT,
            avg_pkg_power       FLOAT,
            max_pkg_power       FLOAT,
            -- Thermal metrics (from PTAT)
            avg_pkg_temp        FLOAT,
            max_pkg_temp        FLOAT,
            -- Frequency metrics (from PTAT)
            avg_p_core_mhz      FLOAT,
            max_p_core_mhz      FLOAT,
            min_p_core_mhz      FLOAT,
            avg_e_core_mhz      FLOAT,
            max_e_core_mhz      FLOAT,
            min_e_core_mhz      FLOAT,
            -- Core topology (from PTAT)
            p_core_count        INTEGER,
            e_core_count        INTEGER,
            -- Throttling
            throttling          TEXT,       -- JSON array of strings
            -- System info
            cpu_brand           TEXT,
            firmware            TEXT,
            gpu                 TEXT,
            os                  TEXT,
            motherboard         TEXT,
            -- Build classification
            build_type          TEXT DEFAULT 'bkc',      -- 'bkc' or 'experiment'
            parent_bkc          TEXT,                     -- NULL for BKC, parent build_id for experiments
            -- Metadata
            created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (build_id, sku_id, game_slug)
        )
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS timeseries (
            build_id    TEXT NOT NULL,
            sku_id      TEXT NOT NULL,
            game_slug   TEXT NOT NULL,
            chart_type  TEXT NOT NULL,   -- 'frametimes' | 'frequency' | 'temperature' | 'power' | 'clipReason' | 'cstateResidency'
            data        TEXT NOT NULL,   -- JSON array
            PRIMARY KEY (build_id, sku_id, game_slug, chart_type)
        )
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS system_scope (
            build_id        TEXT NOT NULL,
            sku_id          TEXT NOT NULL,
            bkc_name        TEXT,
            program_name    TEXT,
            creation_date   TEXT,
            log_info        TEXT,       -- JSON object
            quick_specs     TEXT,       -- JSON array of {category, label, value}
            sections        TEXT,       -- JSON array of {module, plugin, groups[]}
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (build_id, sku_id)
        )
    """)
    con.close()
    print(f"  [DB] Schema initialised at {db_path}")


def upsert_system_scope(con: duckdb.DuckDBPyConnection, build_id: str, sku_id: str,
                         scope_data: dict) -> None:
    """Insert or replace a system_scope row."""
    con.execute("""
        INSERT OR REPLACE INTO system_scope (build_id, sku_id, bkc_name, program_name, creation_date, log_info, quick_specs, sections)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        build_id, sku_id,
        scope_data.get("bkc_name", ""),
        scope_data.get("program_name", ""),
        scope_data.get("creation_date", ""),
        json.dumps(scope_data.get("log_info", {})),
        json.dumps(scope_data.get("quick_specs", [])),
        json.dumps(scope_data.get("sections", [])),
    ])


def upsert_summary(con: duckdb.DuckDBPyConnection, row: dict) -> None:
    """Insert or replace a game_summary row."""
    con.execute("""
        INSERT OR REPLACE INTO game_summary VALUES (
            ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?,
            ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            CURRENT_TIMESTAMP
        )
    """, [
        row["build_id"], row["sku_id"], row["game_slug"],
        row.get("avg_fps"), row.get("one_pct_low"), row.get("zero_one_pct_low"),
        row.get("max_fps"), row.get("min_fps"),
        row.get("avg_frame_time_ms"), row.get("p95_frame_time_ms"), row.get("p99_frame_time_ms"),
        row.get("avg_gpu_active_ms"), row.get("avg_cpu_active_ms"),
        row.get("avg_ia_power"), row.get("max_ia_power"),
        row.get("avg_pkg_power"), row.get("max_pkg_power"),
        row.get("avg_pkg_temp"), row.get("max_pkg_temp"),
        row.get("avg_p_core_mhz"), row.get("max_p_core_mhz"), row.get("min_p_core_mhz"),
        row.get("avg_e_core_mhz"), row.get("max_e_core_mhz"), row.get("min_e_core_mhz"),
        row.get("p_core_count"), row.get("e_core_count"),
        json.dumps(row.get("throttling", [])),
        row.get("cpu_brand", ""), row.get("firmware", ""),
        row.get("gpu", ""), row.get("os", ""), row.get("motherboard", ""),
        row.get("build_type", "bkc"), row.get("parent_bkc"),
    ])


def upsert_timeseries(con: duckdb.DuckDBPyConnection, build_id: str, sku_id: str,
                      game_slug: str, chart_type: str, data: list) -> None:
    """Insert or replace a timeseries row."""
    con.execute("""
        INSERT OR REPLACE INTO timeseries (build_id, sku_id, game_slug, chart_type, data)
        VALUES (?, ?, ?, ?, ?)
    """, [build_id, sku_id, game_slug, chart_type, json.dumps(data)])
