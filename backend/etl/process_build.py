"""
ETL entry point. Run once per build folder to ingest PTAT + CapFrameX data.

Usage:
    python -m backend.etl.process_build --input "C:/path/to/WW0826_folder" --sku nvl-s
    python -m backend.etl.process_build --input "C:/path/to/WW0826_folder" --build WW0826 --sku nvl-s

If --build is omitted, the build ID is auto-extracted from the System Scope JSON
(InternalBkcName / Version from BKC Meta section).

The script:
  1. Discovers System Scope JSON in <input>/ (auto-extracts build ID)
  2. Discovers all PTAT CSVs in <input>/PTAT_logs/
  3. Discovers all CapFrameX JSONs in <input>/Presentmon_logs/
  4. Pairs them by game slug
  5. Parses each pair and writes to DuckDB
"""

import argparse
import sys
from pathlib import Path

# Allow running as: python -m backend.etl.process_build
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.db import DEFAULT_DB_PATH, init_schema, get_connection, upsert_summary, upsert_timeseries, upsert_system_scope
from backend.parsers.capframex import parse_capframex
from backend.parsers.ptat import parse_ptat
from backend.parsers.system_scope import parse_system_scope


def discover_system_scope(input_dir: Path) -> Path | None:
    """Find a System Scope JSON file in the build directory."""
    candidates = sorted(input_dir.glob("*SystemScope*.json"))
    if candidates:
        return candidates[0]
    # Also check for .html (fallback, not parsed yet)
    return None


def discover_files(input_dir: Path) -> tuple[list[Path], list[Path]]:
    """Return (ptat_files, capframex_files) from the build directory."""
    ptat_dir = input_dir / "PTAT_logs"
    fps_dir  = input_dir / "Presentmon_logs"

    ptat_files = sorted(ptat_dir.glob("*.csv")) if ptat_dir.exists() else []
    fps_files  = sorted(fps_dir.glob("*.json")) if fps_dir.exists() else []

    # Also check for CSV PresentMon files
    fps_files += sorted(fps_dir.glob("*.csv")) if fps_dir.exists() else []

    return ptat_files, fps_files


def process_build(build_id: str | None, input_dir: Path, sku_override: str | None = None,
                  db_path: Path = DEFAULT_DB_PATH) -> None:

    init_schema(db_path)

    # ── System Scope ────────────────────────────────────────────────────────
    scope_file = discover_system_scope(input_dir)
    scope_data = None

    if scope_file:
        print(f"  [SystemScope] Found: {scope_file.name}")
        try:
            scope_data = parse_system_scope(scope_file)
            if scope_data:
                print(f"    -> BKC Name:     {scope_data['bkc_name']}")
                print(f"    -> Build ID:     {scope_data['build_id']}")
                print(f"    -> Program:      {scope_data['program_name']}")
                print(f"    -> Created:      {scope_data['creation_date']}")
                print(f"    -> Sections:     {len(scope_data['sections'])} modules")

                # Auto-extract build ID if not provided via CLI
                if not build_id and scope_data["build_id"]:
                    build_id = scope_data["build_id"]
                    print(f"    -> Using build ID from SystemScope: {build_id}")
        except Exception as e:
            print(f"    -> ERROR parsing SystemScope: {e}")
    else:
        print("  [SystemScope] No SystemScope JSON found in build folder")

    if not build_id:
        print("\n  ERROR: No build ID available. Provide --build or include a SystemScope JSON.\n")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  Processing build: {build_id}")
    print(f"  Input directory: {input_dir}")
    print(f"{'='*60}\n")

    ptat_files, fps_files = discover_files(input_dir)
    print(f"  Found {len(ptat_files)} PTAT files, {len(fps_files)} FPS files\n")

    # ── Parse all CapFrameX files ─────────────────────────────────────────────
    fps_by_slug: dict[str, dict] = {}
    for fp in fps_files:
        print(f"  [CapFrameX] Parsing {fp.name} ...")
        try:
            result = parse_capframex(fp)
            if result:
                slug = result["game_slug"]
                fps_by_slug[slug] = result
                print(f"    -> {slug}: avg={result['summary']['avg_fps']} fps, "
                      f"1%low={result['summary']['one_pct_low']} fps, "
                      f"frames={result['info']['total_frames']}")
            else:
                print(f"    -> SKIPPED (no game mapping)")
        except Exception as e:
            print(f"    -> ERROR: {e}")

    # ── Parse all PTAT files ──────────────────────────────────────────────────
    ptat_by_slug: dict[str, dict] = {}
    for fp in ptat_files:
        print(f"\n  [PTAT] Parsing {fp.name} ...")
        try:
            result = parse_ptat(fp)
            if result:
                slug = result["game_slug"]
                sku  = result["sku_id"]
                print(f"    -> {slug} | SKU: {sku} | "
                      f"IA Power avg={result['summary']['avg_ia_power']}W max={result['summary']['max_ia_power']}W | "
                      f"Temp max={result['summary']['max_pkg_temp']}°C")
                ptat_by_slug[slug] = result
            else:
                print(f"    -> SKIPPED (no game mapping or parse error)")
        except Exception as e:
            print(f"    -> ERROR: {e}")

    # ── Merge and write to DB ─────────────────────────────────────────────────
    all_slugs = set(fps_by_slug.keys()) | set(ptat_by_slug.keys())
    print(f"\n  Merging {len(all_slugs)} game(s) into DB...")

    con = get_connection(db_path)
    written = 0

    for slug in sorted(all_slugs):
        fps  = fps_by_slug.get(slug)
        ptat = ptat_by_slug.get(slug)

        # Determine SKU: override > PTAT > "unknown"
        if sku_override:
            sku_id = sku_override
        elif ptat and ptat.get("sku_id"):
            sku_id = ptat["sku_id"]
        else:
            print(f"  [WARN] No SKU for {slug}, skipping")
            continue

        # Build merged summary row
        row = {"build_id": build_id, "sku_id": sku_id, "game_slug": slug}

        if fps:
            row.update(fps["summary"])
            row["gpu"]          = fps["info"].get("gpu", "")
            row["os"]           = fps["info"].get("os", "")
            row["motherboard"]  = fps["info"].get("motherboard", "")

        if ptat:
            row.update(ptat["summary"])
            row["cpu_brand"] = ptat["system_info"].get("cpu_brand", "")
            row["firmware"]  = ptat.get("firmware", "")

        try:
            upsert_summary(con, row)
        except Exception as e:
            print(f"  [ERROR] DB write for {slug}: {e}")
            continue

        # Write timeseries
        if fps:
            upsert_timeseries(con, build_id, sku_id, slug, "frametimes", fps["frametimes"])

        if ptat:
            for chart_type, data in ptat["timeseries"].items():
                upsert_timeseries(con, build_id, sku_id, slug, chart_type, data)

        written += 1
        print(f"  [OK] {slug} [{sku_id}] written to DB")

    # ── Write System Scope data ───────────────────────────────────────────────
    if scope_data:
        # Determine SKU for system scope: override > first PTAT sku > program name inference
        scope_sku = sku_override
        if not scope_sku and ptat_by_slug:
            first_ptat = next(iter(ptat_by_slug.values()))
            scope_sku = first_ptat.get("sku_id")
        if not scope_sku and scope_data.get("program_name"):
            # Infer from program name, e.g. "NVL-S-CONS" -> "nvl-s"
            prog = scope_data["program_name"].lower()
            if "nvl-s" in prog:
                scope_sku = "nvl-s"
            elif "arl-s" in prog:
                scope_sku = "arl-s"
            elif "ptl-h" in prog:
                scope_sku = "ptl-h"

        if scope_sku:
            try:
                upsert_system_scope(con, build_id, scope_sku, scope_data)
                print(f"\n  [OK] SystemScope data written for [{scope_sku}]")
            except Exception as e:
                print(f"\n  [ERROR] SystemScope DB write: {e}")
        else:
            print("\n  [WARN] Could not determine SKU for SystemScope data, skipping")

    con.close()
    print(f"\n  Done — {written}/{len(all_slugs)} games written to {db_path}\n")


def main():
    parser = argparse.ArgumentParser(description="Intel Gaming Dashboard ETL pipeline")
    parser.add_argument("--build",  default=None, help="Build ID (e.g. WW0826). If omitted, auto-extracted from SystemScope JSON.")
    parser.add_argument("--input",  required=True, help="Path to build folder containing PTAT_logs/ and Presentmon_logs/")
    parser.add_argument("--sku",    default=None,  help="Override SKU ID (e.g. nvl-s). If omitted, reads from PTAT CPU Name field")
    parser.add_argument("--db",     default=None,  help="Path to DuckDB file (default: backend/data/gaming_dashboard.duckdb)")
    args = parser.parse_args()

    db_path = Path(args.db) if args.db else DEFAULT_DB_PATH
    process_build(args.build, Path(args.input), sku_override=args.sku, db_path=db_path)


if __name__ == "__main__":
    main()
