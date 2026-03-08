"""
Interactive ingestion wizard for Raptor-X automation runs.

Scans the Raptor-X logs directory, presents discovered runs in a table,
lets the user select and classify them (BKC vs experiment), then ingests
PTAT + PresentMon traces into DuckDB.

Usage:
    python -m backend.etl.ingest_run
    python -m backend.etl.ingest_run --logs-path "C:/custom/path"
    python -m backend.etl.ingest_run --db backend/data/custom.duckdb
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Allow running as: python -m backend.etl.ingest_run
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.db import DEFAULT_DB_PATH, init_schema, get_connection, upsert_summary, upsert_timeseries
from backend.parsers.presentmon_csv import parse_presentmon_csv
from backend.parsers.ptat import parse_ptat
from backend.parsers.sku_map import PTAT_SKU_TO_DASHBOARD_SKU

# ── Constants ────────────────────────────────────────────────────────────────

DEFAULT_LOGS_PATH = Path(r"C:\Users\Local_Admin\Documents\Raptor-X\rpx-core\logs\runs")
INGESTION_LOG_PATH = Path(__file__).parent / "ingestion_log.json"

# Folders/files to skip when scanning for runs
SKIP_NAMES = {"build", ".claude", "node_modules", "__pycache__"}
SKIP_EXTENSIONS = {".json"}


# ── Data structures ─────────────────────────────────────────────────────────

class RunInfo:
    """Represents a discovered Raptor-X run (single or campaign)."""

    def __init__(self, path: Path, run_type: str, manifest: dict,
                 campaign_manifest: dict | None = None,
                 game_subfolders: list[Path] | None = None):
        self.path = path
        self.run_type = run_type  # "single" or "campaign"
        self.manifest = manifest
        self.campaign_manifest = campaign_manifest
        self.game_subfolders = game_subfolders or []

    @property
    def folder_name(self) -> str:
        return self.path.name

    @property
    def date_str(self) -> str:
        # Extract date from folder name (first 10 chars: YYYY-MM-DD)
        name = self.folder_name
        if len(name) >= 10 and name[4] == "-" and name[7] == "-":
            return name[:10]
        return "unknown"

    @property
    def created_at(self) -> str:
        if self.run_type == "campaign" and self.campaign_manifest:
            return self.campaign_manifest.get("created_at", "")[:19]
        return self.manifest.get("created_at", "")[:19]

    @property
    def display_name(self) -> str:
        if self.run_type == "campaign" and self.campaign_manifest:
            return self.campaign_manifest.get("campaign_name", self.folder_name)
        # Single run: extract game name from config
        games = self.manifest.get("config", {}).get("games", [])
        if games:
            return games[0]
        return self.folder_name

    @property
    def sut_ip(self) -> str:
        if self.run_type == "campaign" and self.campaign_manifest:
            return self.campaign_manifest.get("sut_ip", "")
        return self.manifest.get("sut", {}).get("ip", "")

    @property
    def hostname(self) -> str:
        return self.manifest.get("sut", {}).get("hostname", "")

    @property
    def status(self) -> str:
        if self.run_type == "campaign" and self.campaign_manifest:
            return self.campaign_manifest.get("status", "unknown")
        return self.manifest.get("status", "unknown")

    @property
    def games_list(self) -> list[str]:
        if self.run_type == "campaign":
            return [sf.name for sf in self.game_subfolders]
        return self.manifest.get("config", {}).get("games", [])

    @property
    def game_count(self) -> int:
        if self.run_type == "campaign":
            return len(self.game_subfolders)
        return len(self.manifest.get("config", {}).get("games", []))

    @property
    def run_id(self) -> str:
        if self.run_type == "campaign" and self.campaign_manifest:
            return self.campaign_manifest.get("campaign_id", "")
        return self.manifest.get("run_id", "")

    @property
    def bios_version(self) -> str:
        return self.manifest.get("sut", {}).get("bios_version", "")

    @property
    def gpu_short(self) -> str:
        return self.manifest.get("sut", {}).get("gpu_short", "")

    @property
    def preset(self) -> str:
        return self.manifest.get("config", {}).get("preset_level", "")


# ── Scanning ─────────────────────────────────────────────────────────────────

def scan_runs(logs_path: Path) -> list[RunInfo]:
    """Scan the Raptor-X logs directory for run folders."""
    if not logs_path.exists():
        print(f"  [ERROR] Logs directory not found: {logs_path}")
        return []

    runs: list[RunInfo] = []

    for entry in sorted(logs_path.iterdir()):
        if not entry.is_dir():
            continue
        if entry.name in SKIP_NAMES:
            continue
        if entry.suffix in SKIP_EXTENSIONS:
            continue

        # Campaign run: has campaign_manifest.json
        campaign_manifest_path = entry / "campaign_manifest.json"
        if campaign_manifest_path.exists():
            try:
                campaign_manifest = json.loads(campaign_manifest_path.read_text(encoding="utf-8"))
            except Exception as e:
                print(f"  [WARN] Failed to read {campaign_manifest_path}: {e}")
                continue

            # Find game subfolders (each with its own manifest.json)
            game_subfolders = []
            first_manifest = None
            for sub in sorted(entry.iterdir()):
                if not sub.is_dir():
                    continue
                sub_manifest = sub / "manifest.json"
                if sub_manifest.exists():
                    game_subfolders.append(sub)
                    if first_manifest is None:
                        try:
                            first_manifest = json.loads(sub_manifest.read_text(encoding="utf-8"))
                        except Exception:
                            pass

            if first_manifest is None:
                # No game subfolders with manifests found, skip
                continue

            runs.append(RunInfo(
                path=entry,
                run_type="campaign",
                manifest=first_manifest,
                campaign_manifest=campaign_manifest,
                game_subfolders=game_subfolders,
            ))
            continue

        # Single run: has manifest.json at root
        manifest_path = entry / "manifest.json"
        if manifest_path.exists():
            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            except Exception as e:
                print(f"  [WARN] Failed to read {manifest_path}: {e}")
                continue

            runs.append(RunInfo(
                path=entry,
                run_type="single",
                manifest=manifest,
            ))

    return runs


# ── Ingestion log ────────────────────────────────────────────────────────────

def load_ingestion_log() -> dict:
    """Load the ingestion log (tracks which runs have been ingested)."""
    if INGESTION_LOG_PATH.exists():
        try:
            return json.loads(INGESTION_LOG_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_ingestion_log(log: dict) -> None:
    """Save the ingestion log."""
    INGESTION_LOG_PATH.write_text(json.dumps(log, indent=2), encoding="utf-8")


# ── Display ──────────────────────────────────────────────────────────────────

def display_runs_table(runs: list[RunInfo], ingestion_log: dict) -> None:
    """Display runs in a formatted table."""
    if not runs:
        print("\n  No runs found.\n")
        return

    header = f"  {'#':>3}  {'Date':10}  {'Type':8}  {'Name':35}  {'IP':16}  {'Games':6}  {'Status':20}  {'Ingested':8}"
    sep = f"  {'---':3}  {'----------':10}  {'--------':8}  {'-----------------------------------':35}  {'----------------':16}  {'------':6}  {'--------------------':20}  {'--------':8}"
    print(header)
    print(sep)

    for i, run in enumerate(runs):
        ingested = "Yes" if run.run_id in ingestion_log else ""
        name = run.display_name[:35]
        status = run.status[:20]
        print(f"  {i+1:>3}  {run.date_str:10}  {run.run_type:8}  {name:35}  {run.sut_ip:16}  {run.game_count:>6}  {status:20}  {ingested:8}")

    print()


# ── Trace discovery ──────────────────────────────────────────────────────────

def find_traces(run_path: Path) -> tuple[list[Path], list[Path]]:
    """
    Find PTAT and PresentMon trace files in a run folder.
    Checks traces/ptat/ and traces/presentmon/ subfolders.
    """
    ptat_files: list[Path] = []
    pm_files: list[Path] = []

    traces_dir = run_path / "traces"
    if not traces_dir.exists():
        return ptat_files, pm_files

    ptat_dir = traces_dir / "ptat"
    pm_dir = traces_dir / "presentmon"

    if ptat_dir.exists():
        ptat_files = sorted(ptat_dir.glob("*.csv"))

    if pm_dir.exists():
        pm_files = sorted(pm_dir.glob("*.csv"))

    return ptat_files, pm_files


# ── SKU detection ────────────────────────────────────────────────────────────

def detect_sku_from_ptat(ptat_files: list[Path]) -> str | None:
    """
    Read the first PTAT file to detect the CPU Name, then map to short SKU.
    Returns the short PTAT SKU (e.g. "nvl-s"), not the full dashboard SKU.
    """
    if not ptat_files:
        return None

    try:
        import polars as pl
        df = pl.read_csv(
            ptat_files[0],
            encoding="utf8-lossy",
            ignore_errors=True,
            infer_schema_length=10,
            null_values=["Invalid", "N/A", ""],
            n_rows=2,
        )
        cpu_name = str(df["CPU Name"][0]) if "CPU Name" in df.columns else ""
        if cpu_name:
            from backend.parsers.sku_map import cpu_name_to_sku_id
            return cpu_name_to_sku_id(cpu_name)
    except Exception:
        pass

    return None


def resolve_dashboard_sku(ptat_sku: str | None, run: RunInfo) -> str | None:
    """
    Resolve a PTAT short SKU to a full dashboard SKU ID.
    If multiple candidates exist, prompt the user to choose.
    """
    if not ptat_sku:
        return prompt_sku_manual(run)

    candidates = PTAT_SKU_TO_DASHBOARD_SKU.get(ptat_sku, [])

    if not candidates:
        print(f"  [WARN] No dashboard SKU mapping for PTAT SKU '{ptat_sku}'")
        return prompt_sku_manual(run)

    if len(candidates) == 1:
        print(f"  [SKU] Auto-detected: {candidates[0]}")
        return candidates[0]

    # Multiple candidates — prompt user
    print(f"\n  Multiple dashboard SKUs match PTAT SKU '{ptat_sku}':")
    for i, sku in enumerate(candidates):
        print(f"    {i+1}. {sku}")

    while True:
        choice = input(f"  Select SKU [1-{len(candidates)}]: ").strip()
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(candidates):
                return candidates[idx]
        except ValueError:
            pass
        print("  Invalid choice, try again.")


def prompt_sku_manual(run: RunInfo) -> str | None:
    """Prompt user to manually enter a SKU ID."""
    print(f"\n  Could not auto-detect SKU for run: {run.display_name}")
    print(f"  SUT: {run.hostname} ({run.sut_ip}), BIOS: {run.bios_version}")
    print(f"  Available dashboard SKUs:")

    all_skus = []
    for sku_list in PTAT_SKU_TO_DASHBOARD_SKU.values():
        all_skus.extend(sku_list)
    all_skus = sorted(set(all_skus))

    for i, sku in enumerate(all_skus):
        print(f"    {i+1}. {sku}")

    while True:
        choice = input(f"  Select SKU [1-{len(all_skus)}] or type SKU ID, or 's' to skip: ").strip()
        if choice.lower() == "s":
            return None
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(all_skus):
                return all_skus[idx]
        except ValueError:
            # Treat as direct SKU ID input
            if choice:
                return choice
        print("  Invalid choice, try again.")


# ── Build ID detection ───────────────────────────────────────────────────────

def detect_build_id(run: RunInfo) -> str | None:
    """
    Try to determine a build ID for the run.
    Priority: BIOS version from manifest -> prompt user.
    """
    bios = run.bios_version
    if bios:
        return bios
    return None


def prompt_build_id(run: RunInfo, default: str | None = None) -> str:
    """Prompt user for a build ID."""
    prompt = f"  Enter build ID for '{run.display_name}'"
    if default:
        prompt += f" [{default}]"
    prompt += ": "

    while True:
        choice = input(prompt).strip()
        if not choice and default:
            return default
        if choice:
            return choice
        print("  Build ID cannot be empty.")


# ── Build classification ─────────────────────────────────────────────────────

def prompt_build_type() -> tuple[str, str | None]:
    """
    Prompt: is this a BKC build or an experiment?
    Returns (build_type, parent_bkc).
    """
    while True:
        choice = input("  Build type — [b]kc or [e]xperiment? ").strip().lower()
        if choice in ("b", "bkc"):
            return "bkc", None
        if choice in ("e", "experiment", "exp"):
            parent = input("  Parent BKC build ID (or Enter to skip): ").strip() or None
            return "experiment", parent
        print("  Enter 'b' for BKC or 'e' for experiment.")


# ── Ingestion ────────────────────────────────────────────────────────────────

def ingest_single_run(run_path: Path, manifest: dict, build_id: str,
                      sku_id: str, build_type: str, parent_bkc: str | None,
                      con) -> tuple[int, int]:
    """
    Ingest traces from a single run folder (or a campaign game subfolder).
    Returns (success_count, fail_count).
    """
    ptat_files, pm_files = find_traces(run_path)

    if not ptat_files and not pm_files:
        print(f"    [WARN] No trace files found in {run_path.name}")
        return 0, 0

    success = 0
    fail = 0

    # Build SUT info dict for presentmon parser
    sut = manifest.get("sut", {})
    sut_info = {
        "gpu_name": sut.get("gpu_name", ""),
        "os_name": sut.get("os_name", ""),
        "motherboard_name": "",
        "creation_date": manifest.get("created_at", ""),
    }

    # Parse PresentMon files
    pm_by_slug: dict[str, dict] = {}
    for fp in pm_files:
        try:
            result = parse_presentmon_csv(fp, manifest=sut_info)
            if result:
                slug = result["game_slug"]
                pm_by_slug[slug] = result
                print(f"    [PresentMon] {slug}: avg={result['summary']['avg_fps']} fps, "
                      f"frames={result['info']['total_frames']}")
            else:
                print(f"    [PresentMon] {fp.name}: skipped (no game mapping)")
        except Exception as e:
            print(f"    [PresentMon] {fp.name}: ERROR - {e}")

    # Parse PTAT files
    ptat_by_slug: dict[str, dict] = {}
    for fp in ptat_files:
        try:
            result = parse_ptat(fp)
            if result:
                slug = result["game_slug"]
                ptat_by_slug[slug] = result
                print(f"    [PTAT] {slug}: IA Power avg={result['summary']['avg_ia_power']}W, "
                      f"Temp max={result['summary']['max_pkg_temp']}C")
            else:
                print(f"    [PTAT] {fp.name}: skipped (no game mapping)")
        except Exception as e:
            print(f"    [PTAT] {fp.name}: ERROR - {e}")

    # Merge and write to DB
    all_slugs = set(pm_by_slug.keys()) | set(ptat_by_slug.keys())

    for slug in sorted(all_slugs):
        fps = pm_by_slug.get(slug)
        ptat = ptat_by_slug.get(slug)

        row = {
            "build_id": build_id,
            "sku_id": sku_id,
            "game_slug": slug,
            "build_type": build_type,
            "parent_bkc": parent_bkc,
        }

        if fps:
            row.update(fps["summary"])
            row["gpu"] = fps["info"].get("gpu", "")
            row["os"] = fps["info"].get("os", "")
            row["motherboard"] = fps["info"].get("motherboard", "")

        if ptat:
            row.update(ptat["summary"])
            row["cpu_brand"] = ptat["system_info"].get("cpu_brand", "")
            row["firmware"] = ptat.get("firmware", "")

        try:
            upsert_summary(con, row)

            # Write timeseries
            if fps:
                upsert_timeseries(con, build_id, sku_id, slug, "frametimes", fps["frametimes"])
            if ptat:
                for chart_type, data in ptat["timeseries"].items():
                    upsert_timeseries(con, build_id, sku_id, slug, chart_type, data)

            print(f"    [OK] {slug} written to DB")
            success += 1
        except Exception as e:
            print(f"    [ERROR] {slug}: {e}")
            fail += 1

    return success, fail


def ingest_run(run: RunInfo, db_path: Path, ingestion_log: dict) -> bool:
    """
    Full ingestion flow for one run (single or campaign).
    Returns True if ingestion was successful.
    """
    print(f"\n{'='*70}")
    print(f"  Run: {run.folder_name}")
    print(f"  Type: {run.run_type} | Status: {run.status}")
    print(f"  SUT: {run.hostname} ({run.sut_ip}) | GPU: {run.gpu_short}")
    print(f"  BIOS: {run.bios_version}")
    if run.run_type == "campaign":
        print(f"  Games: {', '.join(run.games_list)}")
    else:
        print(f"  Game: {run.display_name}")
    print(f"{'='*70}")

    # Detect SKU from PTAT
    if run.run_type == "campaign" and run.game_subfolders:
        # Use first game subfolder's traces for SKU detection
        first_ptat, _ = find_traces(run.game_subfolders[0])
        ptat_sku = detect_sku_from_ptat(first_ptat)
    else:
        ptat_files, _ = find_traces(run.path)
        ptat_sku = detect_sku_from_ptat(ptat_files)

    print(f"  [SKU] PTAT short SKU: {ptat_sku or 'not detected'}")
    sku_id = resolve_dashboard_sku(ptat_sku, run)

    if not sku_id:
        print("  [SKIP] No SKU selected, skipping run.")
        return False

    # Detect build ID
    auto_build_id = detect_build_id(run)
    build_id = prompt_build_id(run, default=auto_build_id)

    # Build classification
    build_type, parent_bkc = prompt_build_type()
    print(f"  [BUILD] ID={build_id}, type={build_type}, parent={parent_bkc or 'none'}")

    # Initialize DB
    init_schema(db_path)
    con = get_connection(db_path)

    total_success = 0
    total_fail = 0

    try:
        if run.run_type == "campaign":
            # Process each game subfolder
            for game_folder in run.game_subfolders:
                game_name = game_folder.name
                print(f"\n  --- Processing: {game_name} ---")

                # Read this game's manifest for SUT info
                game_manifest_path = game_folder / "manifest.json"
                try:
                    game_manifest = json.loads(game_manifest_path.read_text(encoding="utf-8"))
                except Exception:
                    game_manifest = run.manifest

                s, f = ingest_single_run(
                    game_folder, game_manifest, build_id, sku_id,
                    build_type, parent_bkc, con
                )
                total_success += s
                total_fail += f
        else:
            # Single run
            s, f = ingest_single_run(
                run.path, run.manifest, build_id, sku_id,
                build_type, parent_bkc, con
            )
            total_success += s
            total_fail += f

    finally:
        con.close()

    print(f"\n  Result: {total_success} games ingested, {total_fail} failed")

    # Update ingestion log
    ingestion_log[run.run_id] = {
        "folder": run.folder_name,
        "ingested_at": datetime.now().isoformat(),
        "build_id": build_id,
        "sku_id": sku_id,
        "build_type": build_type,
        "games_success": total_success,
        "games_failed": total_fail,
    }
    save_ingestion_log(ingestion_log)

    return total_success > 0


# ── Selection parsing ────────────────────────────────────────────────────────

def parse_selection(text: str, max_val: int) -> list[int]:
    """
    Parse user selection string into a list of 0-based indices.
    Supports: 'all', comma-separated numbers, ranges (e.g. '3-7').
    """
    text = text.strip().lower()
    if text == "all":
        return list(range(max_val))

    indices = set()
    for part in text.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            try:
                start, end = part.split("-", 1)
                start_i = int(start.strip()) - 1
                end_i = int(end.strip()) - 1
                for i in range(start_i, end_i + 1):
                    if 0 <= i < max_val:
                        indices.add(i)
            except ValueError:
                pass
        else:
            try:
                idx = int(part) - 1
                if 0 <= idx < max_val:
                    indices.add(idx)
            except ValueError:
                pass

    return sorted(indices)


# ── Filter ───────────────────────────────────────────────────────────────────

def filter_runs(runs: list[RunInfo], ingestion_log: dict) -> list[RunInfo]:
    """Prompt user for filter options and return filtered list."""
    print("  Filter options:")
    print("    1. Show all runs")
    print("    2. Show uningested only")
    print("    3. Filter by date range")

    choice = input("  Select filter [1-3, default=2]: ").strip()

    if choice == "1":
        return runs
    elif choice == "3":
        start = input("  Start date (YYYY-MM-DD, or Enter for beginning): ").strip()
        end = input("  End date (YYYY-MM-DD, or Enter for today): ").strip()

        filtered = []
        for run in runs:
            d = run.date_str
            if start and d < start:
                continue
            if end and d > end:
                continue
            filtered.append(run)

        # Also ask whether to exclude already-ingested
        exclude = input("  Exclude already-ingested? [Y/n]: ").strip().lower()
        if exclude != "n":
            filtered = [r for r in filtered if r.run_id not in ingestion_log]

        return filtered
    else:
        # Default: uningested only
        return [r for r in runs if r.run_id not in ingestion_log]


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Interactive ingestion wizard for Raptor-X automation runs"
    )
    parser.add_argument(
        "--logs-path",
        default=str(DEFAULT_LOGS_PATH),
        help=f"Path to Raptor-X logs/runs directory (default: {DEFAULT_LOGS_PATH})"
    )
    parser.add_argument(
        "--db",
        default=None,
        help="Path to DuckDB file (default: backend/data/gaming_dashboard.duckdb)"
    )
    args = parser.parse_args()

    logs_path = Path(args.logs_path)
    db_path = Path(args.db) if args.db else DEFAULT_DB_PATH

    print("\n" + "=" * 70)
    print("  Intel Gaming Dashboard -- Raptor-X Ingestion Wizard")
    print("=" * 70)
    print(f"  Logs path: {logs_path}")
    print(f"  Database:  {db_path}")

    # Scan for runs
    print(f"\n  Scanning for runs...")
    all_runs = scan_runs(logs_path)
    print(f"  Found {len(all_runs)} runs ({sum(1 for r in all_runs if r.run_type == 'single')} single, "
          f"{sum(1 for r in all_runs if r.run_type == 'campaign')} campaign)")

    if not all_runs:
        print("  No runs found. Check your logs path.")
        return

    # Load ingestion log
    ingestion_log = load_ingestion_log()
    ingested_count = sum(1 for r in all_runs if r.run_id in ingestion_log)
    print(f"  Already ingested: {ingested_count}")

    # Filter
    filtered_runs = filter_runs(all_runs, ingestion_log)

    if not filtered_runs:
        print("\n  No runs match the filter criteria.")
        return

    # Display table
    display_runs_table(filtered_runs, ingestion_log)

    # Selection
    selection_text = input(f"  Select runs to ingest [1-{len(filtered_runs)}, 'all', ranges like '1-5,8,10']: ").strip()
    if not selection_text:
        print("  No selection made. Exiting.")
        return

    selected_indices = parse_selection(selection_text, len(filtered_runs))
    if not selected_indices:
        print("  No valid runs selected. Exiting.")
        return

    selected_runs = [filtered_runs[i] for i in selected_indices]
    print(f"\n  Selected {len(selected_runs)} run(s) for ingestion.\n")

    # Ingest each selected run
    success_count = 0
    for run in selected_runs:
        try:
            if ingest_run(run, db_path, ingestion_log):
                success_count += 1
        except KeyboardInterrupt:
            print("\n\n  Interrupted by user. Progress saved.")
            break
        except Exception as e:
            print(f"\n  [ERROR] Failed to ingest {run.folder_name}: {e}")

    # Summary
    print(f"\n{'='*70}")
    print(f"  Ingestion complete: {success_count}/{len(selected_runs)} runs successful")
    print(f"{'='*70}")

    # Offer to clear API cache
    if success_count > 0:
        clear = input("\n  Clear API cache? (requires backend running on port 9001) [y/N]: ").strip().lower()
        if clear == "y":
            try:
                import urllib.request
                req = urllib.request.Request("http://localhost:9001/api/cache/clear", method="POST")
                with urllib.request.urlopen(req, timeout=5) as resp:
                    print(f"  Cache cleared: {resp.read().decode()}")
            except Exception as e:
                print(f"  Could not clear cache: {e}")
                print("  You can manually POST to http://localhost:9001/api/cache/clear")

    print()


if __name__ == "__main__":
    main()
