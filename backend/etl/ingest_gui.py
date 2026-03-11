# -*- coding: utf-8 -*-
"""
Tkinter GUI for the Raptor-X ingestion wizard.

Cherry-pick games from campaigns + single reruns, configure build metadata,
ingest to DuckDB, and tag official runs with marker files.

Campaigns show as collapsible groups (+/- to expand).

Usage:
    python -m backend.etl.ingest_gui
    python -m backend.etl.ingest_gui --logs-path "C:/custom/path"
"""

import argparse
import json
import sys
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
from pathlib import Path

# Allow running as module
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.db import DEFAULT_DB_PATH, init_schema, get_connection, upsert_summary, upsert_timeseries
from backend.parsers.presentmon_csv import parse_presentmon_csv
from backend.parsers.ptat import parse_ptat
from backend.parsers.sku_map import PTAT_SKU_TO_DASHBOARD_SKU
from backend.etl.ingest_run import (
    DEFAULT_LOGS_PATH,
    scan_runs,
    find_traces,
    detect_sku_from_ptat,
    ingest_single_run,
    load_ingestion_log,
    save_ingestion_log,
    RunInfo,
)

MARKER_FILENAME = "dashboard_ingestion.json"


# ── Game row ─────────────────────────────────────────────────────────────────

class GameRow:
    """One game trace = one checkable row in the table."""

    def __init__(self, run: RunInfo, game_name: str, game_folder: Path | None = None):
        self.run = run
        self.game_name = game_name
        self.game_folder = game_folder or run.path

    @property
    def date(self) -> str:
        return self.run.date_str

    @property
    def ip(self) -> str:
        ip = self.run.sut_ip
        parts = ip.split(".")
        return f".{parts[-1]}" if len(parts) == 4 else ip[:8]

    @property
    def is_tagged(self) -> bool:
        marker = self.game_folder / MARKER_FILENAME
        if not marker.exists():
            return False
        try:
            data = json.loads(marker.read_text(encoding="utf-8"))
            return data.get("replaced_by") is None
        except Exception:
            return False

    @property
    def run_id(self) -> str:
        return self.run.run_id


# ── Structured run data ──────────────────────────────────────────────────────

class TreeEntry:
    """Either a campaign group or a single run, with child game rows."""

    def __init__(self, run: RunInfo, game_rows: list[GameRow], is_campaign: bool):
        self.run = run
        self.game_rows = game_rows
        self.is_campaign = is_campaign

    @property
    def label(self) -> str:
        if self.is_campaign:
            return f"{self.run.display_name} ({len(self.game_rows)} games)"
        return self.game_rows[0].game_name if self.game_rows else self.run.display_name


def build_tree_entries(runs: list[RunInfo]) -> list[TreeEntry]:
    """Convert raw runs into tree entries."""
    entries = []
    for run in runs:
        if run.run_type == "campaign" and run.game_subfolders:
            rows = [GameRow(run, sf.name, sf) for sf in run.game_subfolders]
            entries.append(TreeEntry(run, rows, is_campaign=True))
        else:
            games = run.games_list
            game_name = games[0] if games else run.display_name
            row = GameRow(run, game_name, run.path)
            entries.append(TreeEntry(run, [row], is_campaign=False))
    return entries


# ── Marker file management ───────────────────────────────────────────────────

def write_marker(game_folder: Path, build_id: str, sku_id: str,
                 build_type: str, games_ingested: list[str]) -> None:
    marker_path = game_folder / MARKER_FILENAME
    data = {
        "build_id": build_id,
        "sku_id": sku_id,
        "build_type": build_type,
        "ingested_at": datetime.now().isoformat(),
        "games_ingested": games_ingested,
        "replaced_by": None,
    }
    marker_path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def mark_replaced(game_folder: Path, replaced_by_run_id: str) -> None:
    marker_path = game_folder / MARKER_FILENAME
    if not marker_path.exists():
        return
    try:
        data = json.loads(marker_path.read_text(encoding="utf-8"))
        data["replaced_by"] = replaced_by_run_id
        marker_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        pass


def find_tagged_rows_for_slug(all_entries: list[TreeEntry], game_slug: str,
                              build_id: str, sku_id: str) -> list[GameRow]:
    results = []
    for entry in all_entries:
        for row in entry.game_rows:
            marker_path = row.game_folder / MARKER_FILENAME
            if not marker_path.exists():
                continue
            try:
                data = json.loads(marker_path.read_text(encoding="utf-8"))
                if (data.get("replaced_by") is None
                        and data.get("build_id") == build_id
                        and data.get("sku_id") == sku_id
                        and game_slug in data.get("games_ingested", [])):
                    results.append(row)
            except Exception:
                pass
    return results


# ── GUI Application ──────────────────────────────────────────────────────────

class IngestionApp:
    def __init__(self, root: tk.Tk, logs_path: Path, db_path: Path):
        self.root = root
        self.logs_path = logs_path
        self.db_path = db_path
        self.all_entries: list[TreeEntry] = []
        self.filtered_entries: list[TreeEntry] = []
        # Maps tree item iid -> GameRow (only for leaf game rows, not campaign parents)
        self.iid_to_row: dict[str, GameRow] = {}
        # Maps tree item iid -> checked state
        self.check_vars: dict[str, tk.BooleanVar] = {}
        # Maps campaign parent iid -> list of child iids
        self.campaign_children: dict[str, list[str]] = {}
        self.ingesting = False

        self.root.title("Intel Gaming Dashboard — Ingestion Wizard")
        self.root.geometry("1100x750")
        self.root.configure(bg="#1a1a2e")
        self.root.minsize(900, 600)

        self._build_ui()
        self.root.after(300, self.do_scan)

    def _build_ui(self):
        style = ttk.Style()
        style.theme_use("clam")

        bg = "#1a1a2e"
        fg = "#e0e0e0"
        sel_bg = "#3a3a5e"
        btn_bg = "#2a2a4e"
        entry_bg = "#252545"

        style.configure(".", background=bg, foreground=fg, fieldbackground=entry_bg)
        style.configure("Treeview", background="#1e1e38", foreground=fg,
                         fieldbackground="#1e1e38", rowheight=24)
        style.configure("Treeview.Heading", background="#2a2a4e", foreground="#c0c0ff",
                         font=("Segoe UI", 9, "bold"))
        style.map("Treeview", background=[("selected", sel_bg)])
        style.configure("TButton", background=btn_bg, foreground=fg, padding=6)
        style.map("TButton", background=[("active", "#4a4a6e")])
        style.configure("TLabel", background=bg, foreground=fg)
        style.configure("TFrame", background=bg)
        style.configure("TLabelframe", background=bg, foreground="#a0a0ff")
        style.configure("TLabelframe.Label", background=bg, foreground="#a0a0ff")
        style.configure("TRadiobutton", background=bg, foreground=fg)
        style.configure("TCombobox", fieldbackground=entry_bg, foreground=fg)
        style.configure("TEntry", fieldbackground=entry_bg, foreground=fg)
        style.configure("TNotebook", background=bg)
        style.configure("TNotebook.Tab", background=btn_bg, foreground=fg, padding=(12, 4))
        style.map("TNotebook.Tab", background=[("selected", "#3a3a5e")])

        # ── Notebook (tabs) ──────────────────────────────────────────────
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        ingest_tab = ttk.Frame(self.notebook)
        self.notebook.add(ingest_tab, text="  Ingest  ")

        manage_tab = ttk.Frame(self.notebook)
        self.notebook.add(manage_tab, text="  Manage Builds  ")

        self._build_ingest_tab(ingest_tab)
        self._build_manage_tab(manage_tab)

    def _build_ingest_tab(self, parent):
        # ── Top bar ──────────────────────────────────────────────────────
        top = ttk.Frame(parent)
        top.pack(fill=tk.X, padx=10, pady=(10, 5))

        ttk.Label(top, text="Logs:").pack(side=tk.LEFT)
        self.path_var = tk.StringVar(value=str(self.logs_path))
        ttk.Entry(top, textvariable=self.path_var, width=55).pack(side=tk.LEFT, padx=(5, 5))
        ttk.Button(top, text="Browse", command=self._browse_path).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(top, text="Scan Runs", command=self.do_scan).pack(side=tk.LEFT, padx=(0, 10))

        ttk.Label(top, text="Filter:").pack(side=tk.LEFT, padx=(10, 5))
        self.filter_var = tk.StringVar(value="All")
        filter_cb = ttk.Combobox(top, textvariable=self.filter_var,
                                  values=["All", "Uningested", "Tagged Official"],
                                  state="readonly", width=16)
        filter_cb.pack(side=tk.LEFT)
        filter_cb.bind("<<ComboboxSelected>>", lambda e: self._apply_filter())

        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(top, textvariable=self.status_var, foreground="#888").pack(side=tk.RIGHT)

        # ── Table ────────────────────────────────────────────────────────
        table_frame = ttk.Frame(parent)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        columns = ("check", "date", "game", "ip", "tagged")
        # show="tree headings" enables the tree column with +/- expand
        self.tree = ttk.Treeview(table_frame, columns=columns, show="tree headings",
                                  selectmode="extended")

        # Tree column (shows expand +/- and indent)
        self.tree.heading("#0", text="Source")
        self.tree.column("#0", width=260, stretch=False)

        self.tree.heading("check", text="☑")
        self.tree.heading("date", text="Date")
        self.tree.heading("game", text="Game")
        self.tree.heading("ip", text="IP")
        self.tree.heading("tagged", text="Tag")

        self.tree.column("check", width=40, anchor="center", stretch=False)
        self.tree.column("date", width=100, stretch=False)
        self.tree.column("game", width=250)
        self.tree.column("ip", width=60, stretch=False)
        self.tree.column("tagged", width=50, anchor="center", stretch=False)

        scrollbar = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)

        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.tree.bind("<ButtonRelease-1>", self._on_tree_click)

        # ── Config panel ─────────────────────────────────────────────────
        config_frame = ttk.LabelFrame(parent, text="Build Configuration", padding=8)
        config_frame.pack(fill=tk.X, padx=10, pady=5)

        row1 = ttk.Frame(config_frame)
        row1.pack(fill=tk.X, pady=2)

        ttk.Label(row1, text="SKU:").pack(side=tk.LEFT, padx=(0, 5))
        all_skus = sorted(set(s for sl in PTAT_SKU_TO_DASHBOARD_SKU.values() for s in sl))
        self.sku_var = tk.StringVar(value=all_skus[0] if all_skus else "")
        self.sku_combo = ttk.Combobox(row1, textvariable=self.sku_var,
                                       values=all_skus, width=25)
        self.sku_combo.pack(side=tk.LEFT, padx=(0, 20))

        ttk.Label(row1, text="Build ID:").pack(side=tk.LEFT, padx=(0, 5))
        self.build_id_var = tk.StringVar()
        ttk.Entry(row1, textvariable=self.build_id_var, width=35).pack(side=tk.LEFT, padx=(0, 20))

        ttk.Button(row1, text="Auto-detect", command=self._auto_detect).pack(side=tk.LEFT)

        row2 = ttk.Frame(config_frame)
        row2.pack(fill=tk.X, pady=2)

        ttk.Label(row2, text="Type:").pack(side=tk.LEFT, padx=(0, 5))
        self.build_type_var = tk.StringVar(value="bkc")
        ttk.Radiobutton(row2, text="BKC", variable=self.build_type_var,
                         value="bkc").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Radiobutton(row2, text="Experiment", variable=self.build_type_var,
                         value="experiment").pack(side=tk.LEFT, padx=(0, 20))

        ttk.Label(row2, text="Parent BKC:").pack(side=tk.LEFT, padx=(0, 5))
        self.parent_bkc_var = tk.StringVar()
        ttk.Entry(row2, textvariable=self.parent_bkc_var, width=30).pack(side=tk.LEFT, padx=(0, 15))

        ttk.Label(row2, text="Label:").pack(side=tk.LEFT, padx=(0, 5))
        self.experiment_label_var = tk.StringVar()
        ttk.Entry(row2, textvariable=self.experiment_label_var, width=25).pack(side=tk.LEFT)

        # ── Buttons ──────────────────────────────────────────────────────
        btn_frame = ttk.Frame(parent)
        btn_frame.pack(fill=tk.X, padx=10, pady=5)

        self.ingest_btn = ttk.Button(btn_frame, text="Ingest Selected",
                                      command=self.do_ingest)
        self.ingest_btn.pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(btn_frame, text="Select All", command=self._select_all).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(btn_frame, text="Clear All", command=self._clear_all).pack(side=tk.LEFT, padx=(0, 20))
        ttk.Button(btn_frame, text="Clear API Cache", command=self._clear_cache).pack(side=tk.RIGHT)

        # ── Log output ───────────────────────────────────────────────────
        log_frame = ttk.LabelFrame(parent, text="Log Output", padding=4)
        log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(5, 10))

        self.log_text = tk.Text(log_frame, height=10, bg="#0f0f1e", fg="#a0ffa0",
                                 font=("Consolas", 9), wrap=tk.WORD,
                                 insertbackground="#a0ffa0")
        log_scroll = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scroll.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        log_scroll.pack(side=tk.RIGHT, fill=tk.Y)

    # ── Logging ──────────────────────────────────────────────────────────

    def log(self, msg: str):
        def _append():
            self.log_text.insert(tk.END, msg + "\n")
            self.log_text.see(tk.END)
        self.root.after(0, _append)

    # ── Browse ───────────────────────────────────────────────────────────

    def _browse_path(self):
        path = filedialog.askdirectory(initialdir=str(self.logs_path))
        if path:
            self.path_var.set(path)
            self.logs_path = Path(path)

    # ── Scan ─────────────────────────────────────────────────────────────

    def do_scan(self):
        self.logs_path = Path(self.path_var.get())
        self.log(f"> Scanning {self.logs_path} ...")
        self.status_var.set("Scanning...")

        def _scan():
            runs = scan_runs(self.logs_path)
            self.all_entries = build_tree_entries(runs)
            singles = sum(1 for e in self.all_entries if not e.is_campaign)
            campaigns = sum(1 for e in self.all_entries if e.is_campaign)
            total = sum(len(e.game_rows) for e in self.all_entries)
            self.root.after(0, lambda: self._after_scan(singles, campaigns, total))

        threading.Thread(target=_scan, daemon=True).start()

    def _after_scan(self, singles: int, campaigns: int, total: int):
        self.log(f"> Found {total} game traces ({singles} single runs, {campaigns} campaigns)")
        self.status_var.set(f"{total} games")
        self._apply_filter()

    # ── Filter ───────────────────────────────────────────────────────────

    def _apply_filter(self):
        ingestion_log = load_ingestion_log()
        filt = self.filter_var.get()

        if filt == "Uningested":
            filtered = []
            for entry in self.all_entries:
                kept = [r for r in entry.game_rows
                        if r.run_id not in ingestion_log and not r.is_tagged]
                if kept:
                    filtered.append(TreeEntry(entry.run, kept, entry.is_campaign))
            self.filtered_entries = filtered
        elif filt == "Tagged Official":
            filtered = []
            for entry in self.all_entries:
                kept = [r for r in entry.game_rows if r.is_tagged]
                if kept:
                    filtered.append(TreeEntry(entry.run, kept, entry.is_campaign))
            self.filtered_entries = filtered
        else:
            self.filtered_entries = list(self.all_entries)

        self._populate_table()

    def _populate_table(self):
        self.tree.delete(*self.tree.get_children())
        self.iid_to_row.clear()
        self.check_vars.clear()
        self.campaign_children.clear()

        for i, entry in enumerate(self.filtered_entries):
            if entry.is_campaign:
                # Campaign parent row (not checkable itself — check toggles children)
                parent_iid = f"c{i}"
                tagged_count = sum(1 for r in entry.game_rows if r.is_tagged)
                tag_display = f"{tagged_count}/{len(entry.game_rows)}" if tagged_count else ""
                self.tree.insert("", tk.END, iid=parent_iid,
                                 text=f"Campaign: {entry.run.display_name}",
                                 values=("", entry.run.date_str,
                                         f"{len(entry.game_rows)} games",
                                         entry.game_rows[0].ip if entry.game_rows else "",
                                         tag_display),
                                 open=False)

                child_iids = []
                for j, row in enumerate(entry.game_rows):
                    child_iid = f"c{i}_g{j}"
                    var = tk.BooleanVar(value=False)
                    self.check_vars[child_iid] = var
                    self.iid_to_row[child_iid] = row
                    tagged = "●" if row.is_tagged else ""
                    self.tree.insert(parent_iid, tk.END, iid=child_iid,
                                     text="",
                                     values=("☐", row.date, row.game_name, row.ip, tagged))
                    child_iids.append(child_iid)

                self.campaign_children[parent_iid] = child_iids
            else:
                # Single run — top-level row
                row = entry.game_rows[0]
                iid = f"s{i}"
                var = tk.BooleanVar(value=False)
                self.check_vars[iid] = var
                self.iid_to_row[iid] = row
                tagged = "●" if row.is_tagged else ""
                self.tree.insert("", tk.END, iid=iid,
                                 text="Single run",
                                 values=("☐", row.date, row.game_name, row.ip, tagged))

    # ── Table click ──────────────────────────────────────────────────────

    def _on_tree_click(self, event):
        region = self.tree.identify_region(event.x, event.y)
        item = self.tree.identify_row(event.y)
        if not item:
            return

        # Click on tree expand/collapse arrow — let treeview handle it
        if region == "tree":
            return

        # Campaign parent row — toggle all children
        if item in self.campaign_children:
            child_iids = self.campaign_children[item]
            # Determine: if any unchecked, check all. If all checked, uncheck all.
            all_checked = all(self.check_vars[c].get() for c in child_iids)
            new_state = not all_checked
            for c in child_iids:
                self.check_vars[c].set(new_state)
                vals = list(self.tree.item(c, "values"))
                vals[0] = "☑" if new_state else "☐"
                self.tree.item(c, values=vals)
            # Also expand the campaign so user sees the toggled state
            self.tree.item(item, open=True)
            return

        # Leaf game row — toggle check
        var = self.check_vars.get(item)
        if var is None:
            return

        var.set(not var.get())
        vals = list(self.tree.item(item, "values"))
        vals[0] = "☑" if var.get() else "☐"
        self.tree.item(item, values=vals)

    # ── Select/Clear ─────────────────────────────────────────────────────

    def _select_all(self):
        for iid, var in self.check_vars.items():
            var.set(True)
            vals = list(self.tree.item(iid, "values"))
            vals[0] = "☑"
            self.tree.item(iid, values=vals)

    def _clear_all(self):
        for iid, var in self.check_vars.items():
            var.set(False)
            vals = list(self.tree.item(iid, "values"))
            vals[0] = "☐"
            self.tree.item(iid, values=vals)

    # ── Auto-detect ──────────────────────────────────────────────────────

    def _auto_detect(self):
        selected = self._get_selected_rows()
        if not selected:
            self.log("> Select at least one game row first")
            return

        row = selected[0]
        self.log(f"> Auto-detecting from: {row.game_name}")

        ptat_files, _ = find_traces(row.game_folder)
        ptat_sku = detect_sku_from_ptat(ptat_files)
        if ptat_sku:
            candidates = PTAT_SKU_TO_DASHBOARD_SKU.get(ptat_sku, [])
            if candidates:
                self.sku_var.set(candidates[0])
                self.log(f"> SKU detected: {ptat_sku} -> {candidates[0]}")
            else:
                self.log(f"> SKU detected: {ptat_sku} (no dashboard mapping)")
        else:
            self.log("> Could not detect SKU from PTAT")

        bios = row.run.bios_version
        if bios:
            self.build_id_var.set(bios)
            self.log(f"> Build ID from BIOS: {bios}")
        else:
            self.log("> No BIOS version found for build ID")

    # ── Get selected rows ────────────────────────────────────────────────

    def _get_selected_rows(self) -> list[GameRow]:
        selected = []
        for iid, var in self.check_vars.items():
            if var.get() and iid in self.iid_to_row:
                selected.append(self.iid_to_row[iid])
        return selected

    # ── Ingest ───────────────────────────────────────────────────────────

    def do_ingest(self):
        if self.ingesting:
            self.log("> Ingestion already in progress")
            return

        selected = self._get_selected_rows()
        if not selected:
            messagebox.showwarning("No Selection", "Select at least one game to ingest.")
            return

        build_id = self.build_id_var.get().strip()
        sku_id = self.sku_var.get().strip()
        build_type = self.build_type_var.get()
        parent_bkc = self.parent_bkc_var.get().strip() or None
        experiment_label = self.experiment_label_var.get().strip() or None

        if not build_id:
            messagebox.showwarning("Missing Build ID", "Enter a build ID or click Auto-detect.")
            return
        if not sku_id:
            messagebox.showwarning("Missing SKU", "Select a SKU.")
            return

        if build_type == "experiment" and not parent_bkc:
            if not messagebox.askyesno("No Parent BKC",
                                        "Experiment with no parent BKC. Continue anyway?"):
                return

        self.ingesting = True
        self.ingest_btn.configure(state="disabled")
        self.status_var.set("Ingesting...")
        self.log(f"\n> Starting ingestion: {len(selected)} games")
        self.log(f"> Build: {build_id} | SKU: {sku_id} | Type: {build_type}")
        if parent_bkc:
            self.log(f"> Parent BKC: {parent_bkc}")
        if experiment_label:
            self.log(f"> Label: {experiment_label}")

        def _ingest_thread():
            try:
                self._release_backend_db()
                self._run_ingestion(selected, build_id, sku_id, build_type, parent_bkc, experiment_label)
            except Exception as e:
                self.log(f"> ERROR: {e}")
            finally:
                self._reacquire_backend_db()
                self.root.after(0, self._after_ingest)

        threading.Thread(target=_ingest_thread, daemon=True).start()

    def _run_ingestion(self, selected: list[GameRow], build_id: str, sku_id: str,
                       build_type: str, parent_bkc: str | None,
                       experiment_label: str | None = None):
        init_schema(self.db_path)
        con = get_connection(self.db_path)
        ingestion_log = load_ingestion_log()

        success_total = 0
        fail_total = 0

        try:
            for row in selected:
                source = "campaign" if row.run.run_type == "campaign" else "single"
                self.log(f"\n> --- {row.game_name} ({source}) ---")

                manifest_path = row.game_folder / "manifest.json"
                try:
                    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                except Exception:
                    manifest = row.run.manifest

                s, f = ingest_single_run(
                    row.game_folder, manifest, build_id, sku_id,
                    build_type, parent_bkc, con,
                    experiment_label=experiment_label
                )
                success_total += s
                fail_total += f

                if s > 0:
                    ptat_files, pm_files = find_traces(row.game_folder)
                    slugs_ingested = []

                    for fp in pm_files:
                        try:
                            result = parse_presentmon_csv(fp)
                            if result:
                                slugs_ingested.append(result["game_slug"])
                        except Exception:
                            pass
                    if not slugs_ingested:
                        for fp in ptat_files:
                            try:
                                result = parse_ptat(fp)
                                if result:
                                    slugs_ingested.append(result["game_slug"])
                            except Exception:
                                pass

                    # Mark old tags as replaced
                    for slug in slugs_ingested:
                        old_tagged = find_tagged_rows_for_slug(
                            self.all_entries, slug, build_id, sku_id
                        )
                        for old_row in old_tagged:
                            if old_row.game_folder != row.game_folder:
                                mark_replaced(old_row.game_folder, row.run_id)
                                self.log(f"> Marked previous {slug} run as replaced")

                    write_marker(row.game_folder, build_id, sku_id,
                                 build_type, slugs_ingested)
                    self.log(f"> Tagged: {row.game_folder.name}")

                    log_key = f"{row.run_id}_{row.game_name}"
                    ingestion_log[log_key] = {
                        "folder": row.run.folder_name,
                        "game_folder": str(row.game_folder),
                        "game": row.game_name,
                        "ingested_at": datetime.now().isoformat(),
                        "build_id": build_id,
                        "sku_id": sku_id,
                        "build_type": build_type,
                        "games_success": s,
                        "game_slugs": slugs_ingested,
                    }
        finally:
            con.close()
            save_ingestion_log(ingestion_log)

        self.log(f"\n> Done: {success_total} games ingested, {fail_total} failed")

    def _after_ingest(self):
        self.ingesting = False
        self.ingest_btn.configure(state="normal")
        self.status_var.set("Ingestion complete")
        self._apply_filter()

    # ── Backend DB coordination ───────────────────────────────────────────

    def _release_backend_db(self):
        """Ask the running backend to release its DB connection so we can write."""
        try:
            import urllib.request
            req = urllib.request.Request("http://localhost:9001/api/db/release", method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                self.log("> Backend DB released for ingestion")
        except Exception:
            self.log("> Backend not running or unreachable (proceeding anyway)")

    def _reacquire_backend_db(self):
        """Ask the running backend to reopen its DB connection after ingestion."""
        try:
            import urllib.request
            req = urllib.request.Request("http://localhost:9001/api/db/reacquire", method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                self.log("> Backend DB reacquired + cache cleared")
        except Exception:
            self.log("> Backend not running (restart it to pick up new data)")

    # ── Clear cache ──────────────────────────────────────────────────────

    def _clear_cache(self):
        self.log("> Clearing API cache...")
        try:
            import urllib.request
            req = urllib.request.Request("http://localhost:9001/api/cache/clear", method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                self.log(f"> Cache cleared: {resp.read().decode()}")
        except Exception as e:
            self.log(f"> Could not clear cache: {e}")
            self.log("> (Is the backend running on port 9001?)")


    # ══════════════════════════════════════════════════════════════════════
    # Manage Builds tab
    # ══════════════════════════════════════════════════════════════════════

    def _build_manage_tab(self, parent):
        # ── Two-column layout ──────────────────────────────────────────
        columns = ttk.PanedWindow(parent, orient=tk.HORIZONTAL)
        columns.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        left_col = ttk.Frame(columns)
        right_col = ttk.Frame(columns)
        columns.add(left_col, weight=3)
        columns.add(right_col, weight=2)

        # ══════════════════════════════════════════════════════════════
        # LEFT COLUMN: Build list + Edit panel
        # ══════════════════════════════════════════════════════════════

        # ── Build list ─────────────────────────────────────────────────
        list_frame = ttk.LabelFrame(left_col, text="Builds", padding=4)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=(5, 2))

        cols = ("build_id", "sku", "type", "label", "parent", "games", "ingested")
        self.mgr_tree = ttk.Treeview(list_frame, columns=cols, show="headings",
                                      selectmode="browse", height=10)

        self.mgr_tree.heading("build_id", text="Build ID")
        self.mgr_tree.heading("sku", text="SKU")
        self.mgr_tree.heading("type", text="Type")
        self.mgr_tree.heading("label", text="Label")
        self.mgr_tree.heading("parent", text="Parent BKC")
        self.mgr_tree.heading("games", text="#")
        self.mgr_tree.heading("ingested", text="Ingested")

        self.mgr_tree.column("build_id", width=180)
        self.mgr_tree.column("sku", width=90, stretch=False)
        self.mgr_tree.column("type", width=55, stretch=False)
        self.mgr_tree.column("label", width=100)
        self.mgr_tree.column("parent", width=140)
        self.mgr_tree.column("games", width=30, anchor="center", stretch=False)
        self.mgr_tree.column("ingested", width=120, stretch=False)

        mgr_scroll = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.mgr_tree.yview)
        self.mgr_tree.configure(yscrollcommand=mgr_scroll.set)
        self.mgr_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        mgr_scroll.pack(side=tk.RIGHT, fill=tk.Y)

        self.mgr_tree.bind("<<TreeviewSelect>>", self._on_mgr_select)

        # ── Buttons row ────────────────────────────────────────────────
        btn_row = ttk.Frame(left_col)
        btn_row.pack(fill=tk.X, padx=5, pady=3)

        ttk.Button(btn_row, text="Refresh", command=self._mgr_refresh).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(btn_row, text="Delete Build", command=self._mgr_delete).pack(side=tk.RIGHT)

        # ── Edit panel ─────────────────────────────────────────────────
        edit_frame = ttk.LabelFrame(left_col, text="Edit Selected Build", padding=6)
        edit_frame.pack(fill=tk.X, padx=5, pady=(2, 5))

        r1 = ttk.Frame(edit_frame)
        r1.pack(fill=tk.X, pady=2)

        ttk.Label(r1, text="Build ID:").pack(side=tk.LEFT, padx=(0, 5))
        self.mgr_build_id_var = tk.StringVar()
        ttk.Label(r1, textvariable=self.mgr_build_id_var, foreground="#c0c0ff",
                  font=("Consolas", 10)).pack(side=tk.LEFT, padx=(0, 20))

        ttk.Label(r1, text="SKU:").pack(side=tk.LEFT, padx=(0, 5))
        self.mgr_sku_var = tk.StringVar()
        ttk.Label(r1, textvariable=self.mgr_sku_var, foreground="#c0c0ff",
                  font=("Consolas", 10)).pack(side=tk.LEFT)

        r2 = ttk.Frame(edit_frame)
        r2.pack(fill=tk.X, pady=2)

        ttk.Label(r2, text="Type:").pack(side=tk.LEFT, padx=(0, 5))
        self.mgr_type_var = tk.StringVar(value="bkc")
        ttk.Radiobutton(r2, text="BKC", variable=self.mgr_type_var,
                         value="bkc").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Radiobutton(r2, text="Experiment", variable=self.mgr_type_var,
                         value="experiment").pack(side=tk.LEFT, padx=(0, 20))

        ttk.Label(r2, text="Parent BKC:").pack(side=tk.LEFT, padx=(0, 5))
        self.mgr_parent_var = tk.StringVar()
        ttk.Entry(r2, textvariable=self.mgr_parent_var, width=25).pack(side=tk.LEFT)

        r2b = ttk.Frame(edit_frame)
        r2b.pack(fill=tk.X, pady=2)

        ttk.Label(r2b, text="Label:").pack(side=tk.LEFT, padx=(0, 5))
        self.mgr_label_var = tk.StringVar()
        ttk.Entry(r2b, textvariable=self.mgr_label_var, width=30).pack(side=tk.LEFT, padx=(0, 15))

        ttk.Button(r2b, text="Save Changes", command=self._mgr_save).pack(side=tk.LEFT, padx=(10, 5))
        self.mgr_status_var = tk.StringVar()
        ttk.Label(r2b, textvariable=self.mgr_status_var, foreground="#a0ffa0").pack(side=tk.LEFT)

        # ══════════════════════════════════════════════════════════════
        # RIGHT COLUMN: Games & Source Folders
        # ══════════════════════════════════════════════════════════════

        games_frame = ttk.LabelFrame(right_col, text="Games & Source Folders", padding=4)
        games_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        games_top = ttk.Frame(games_frame)
        games_top.pack(fill=tk.X, pady=(0, 4))
        ttk.Button(games_top, text="Open Selected Folder",
                   command=self._mgr_open_folder).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(games_top, text="Open All Folders",
                   command=self._mgr_open_all_folders).pack(side=tk.LEFT)
        self.mgr_folder_count_var = tk.StringVar()
        ttk.Label(games_top, textvariable=self.mgr_folder_count_var,
                  foreground="#888").pack(side=tk.RIGHT)

        games_tree_frame = ttk.Frame(games_frame)
        games_tree_frame.pack(fill=tk.BOTH, expand=True)

        self.mgr_games_tree = ttk.Treeview(games_tree_frame, height=12,
            columns=("slug", "fps", "temp", "power", "folder"),
            show="headings", selectmode="browse")
        self.mgr_games_tree.heading("slug", text="Game")
        self.mgr_games_tree.heading("fps", text="FPS")
        self.mgr_games_tree.heading("temp", text="Temp")
        self.mgr_games_tree.heading("power", text="Power")
        self.mgr_games_tree.heading("folder", text="Source Folder")
        self.mgr_games_tree.column("slug", width=130)
        self.mgr_games_tree.column("fps", width=55, anchor=tk.E)
        self.mgr_games_tree.column("temp", width=45, anchor=tk.E)
        self.mgr_games_tree.column("power", width=45, anchor=tk.E)
        self.mgr_games_tree.column("folder", width=180)

        games_scroll = ttk.Scrollbar(games_tree_frame, orient=tk.VERTICAL,
                                      command=self.mgr_games_tree.yview)
        self.mgr_games_tree.configure(yscrollcommand=games_scroll.set)
        self.mgr_games_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        games_scroll.pack(side=tk.RIGHT, fill=tk.Y)

        # Track folders for the currently selected build
        self.mgr_current_folders: list[Path] = []
        self.mgr_slug_to_folder: dict[str, str] = {}

        # Load on tab switch
        self.notebook.bind("<<NotebookTabChanged>>", self._on_tab_changed)

    def _on_tab_changed(self, event=None):
        tab_name = self.notebook.tab(self.notebook.select(), "text").strip()
        if tab_name == "Manage Builds":
            self._mgr_refresh()

    def _mgr_refresh(self):
        """Load all builds from DB into the manage tree."""
        for item in self.mgr_tree.get_children():
            self.mgr_tree.delete(item)

        if not self.db_path.exists():
            return

        try:
            con = get_connection(self.db_path, read_only=True)
            rows = con.execute("""
                SELECT build_id, sku_id,
                       COALESCE(build_type, 'bkc') as build_type,
                       experiment_label,
                       parent_bkc,
                       COUNT(DISTINCT game_slug) as game_count,
                       MAX(created_at) as last_ingested
                FROM game_summary
                GROUP BY build_id, sku_id, build_type, experiment_label, parent_bkc
                ORDER BY last_ingested DESC
            """).fetchall()
            con.close()

            for r in rows:
                build_id, sku, btype, label, parent, games, ingested = r
                ts = str(ingested)[:19] if ingested else ""
                self.mgr_tree.insert("", tk.END, iid=f"{build_id}|{sku}",
                    values=(build_id, sku, btype, label or "", parent or "", games, ts))
        except Exception as e:
            self.mgr_status_var.set(f"Error: {e}")

    def _on_mgr_select(self, event=None):
        """Populate edit fields from selected build row."""
        sel = self.mgr_tree.selection()
        if not sel:
            return

        vals = self.mgr_tree.item(sel[0], "values")
        build_id, sku, btype, label, parent, games, ingested = vals

        self.mgr_build_id_var.set(build_id)
        self.mgr_sku_var.set(sku)
        self.mgr_type_var.set(btype)
        self.mgr_label_var.set(label)
        self.mgr_parent_var.set(parent)
        self.mgr_status_var.set("")

        # Load game list from DB
        try:
            con = get_connection(self.db_path, read_only=True)
            game_rows = con.execute("""
                SELECT game_slug, avg_fps, avg_pkg_temp, avg_ia_power
                FROM game_summary
                WHERE build_id = ? AND sku_id = ?
                ORDER BY game_slug
            """, [build_id, sku]).fetchall()
            con.close()
        except Exception as e:
            self.mgr_status_var.set(f"Error loading games: {e}")
            return

        # Look up source folders from ingestion_log
        slug_to_folder: dict[str, str] = {}
        self.mgr_current_folders = []
        try:
            from backend.parsers.game_map import CAPFRAMEX_GAME_NAME_TO_SLUG
            # Build reverse: normalize game folder names to slugs
            # Build lookup: normalized folder name -> slug
            _name_to_slug = {}
            for name, slug in CAPFRAMEX_GAME_NAME_TO_SLUG.items():
                # "Assassin's Creed Mirage" -> "assassin's-creed-mirage"
                norm = name.lower().replace(" ", "-")
                _name_to_slug[norm] = slug
                # Also without special chars
                norm2 = norm.replace(":", "").replace("\u2019", "'")
                _name_to_slug[norm2] = slug
            # Folder names that don't match game_map conventions
            _folder_overrides = {
                "hitman-3--dubai": "hitman3",
                "tiny-tina-wonderlands": "tiny-tina",
                "final-fantasy-xiv-dawntrail": "ffxiv",
                "final fantasy xiv: dawntrail": "ffxiv",
            }

            ilog = load_ingestion_log()
            for entry in ilog.values():
                if entry.get("build_id") == build_id and entry.get("sku_id") == sku:
                    gf = entry.get("game_folder")
                    if gf:
                        p = Path(gf)
                        if p not in self.mgr_current_folders:
                            self.mgr_current_folders.append(p)
                        for slug in entry.get("game_slugs", []):
                            slug_to_folder[slug] = gf
                    else:
                        # Old format: reconstruct path from folder + game
                        folder_name = entry.get("folder", "")
                        game_name = entry.get("game", "")
                        if folder_name:
                            candidate = Path(self.logs_path) / folder_name
                            if game_name:
                                sub = candidate / game_name
                                if sub.exists():
                                    candidate = sub
                                # Try to map game folder name to slug
                                norm = game_name.lower().replace("\u2019", "'")
                                matched_slug = (
                                    _folder_overrides.get(norm)
                                    or _name_to_slug.get(norm)
                                )
                                if matched_slug:
                                    slug_to_folder[matched_slug] = str(candidate)
                            if candidate.exists() and candidate not in self.mgr_current_folders:
                                self.mgr_current_folders.append(candidate)
        except Exception:
            pass

        self.mgr_slug_to_folder = slug_to_folder
        self.mgr_folder_count_var.set(f"{len(self.mgr_current_folders)} folder(s)")

        # Populate games treeview
        for item in self.mgr_games_tree.get_children():
            self.mgr_games_tree.delete(item)

        for g in game_rows:
            slug, fps, temp, power = g
            fps_str = f"{fps:.1f}" if fps else "N/A"
            temp_str = f"{temp:.0f} C" if temp else ""
            power_str = f"{power:.0f}W" if power else ""
            folder_path = slug_to_folder.get(slug, "")
            self.mgr_games_tree.insert("", tk.END, iid=slug,
                values=(slug, fps_str, temp_str, power_str, folder_path))

    def _release_backend_db_silent(self):
        """Release backend DB without logging (for manage tab)."""
        try:
            import urllib.request
            req = urllib.request.Request("http://localhost:9001/api/db/release", method="POST")
            urllib.request.urlopen(req, timeout=5)
        except Exception:
            pass

    def _reacquire_backend_db_silent(self):
        """Reacquire backend DB without logging (for manage tab)."""
        try:
            import urllib.request
            req = urllib.request.Request("http://localhost:9001/api/db/reacquire", method="POST")
            urllib.request.urlopen(req, timeout=5)
        except Exception:
            pass

    def _mgr_save(self):
        """Save edited fields to DB."""
        build_id = self.mgr_build_id_var.get()
        sku = self.mgr_sku_var.get()
        if not build_id or not sku:
            messagebox.showwarning("No Selection", "Select a build first.")
            return

        new_type = self.mgr_type_var.get()
        new_parent = self.mgr_parent_var.get().strip() or None
        new_label = self.mgr_label_var.get().strip() or None

        try:
            self._release_backend_db_silent()
            con = get_connection(self.db_path)
            con.execute("""
                UPDATE game_summary
                SET build_type = ?,
                    parent_bkc = ?,
                    experiment_label = ?
                WHERE build_id = ? AND sku_id = ?
            """, [new_type, new_parent, new_label, build_id, sku])
            con.close()
            self._reacquire_backend_db_silent()

            self.mgr_status_var.set(f"Saved ({datetime.now().strftime('%H:%M:%S')})")
            self._mgr_refresh()
            # Re-select the same row
            iid = f"{build_id}|{sku}"
            if self.mgr_tree.exists(iid):
                self.mgr_tree.selection_set(iid)
        except Exception as e:
            self.mgr_status_var.set(f"Error: {e}")

    def _mgr_delete(self):
        """Delete all data for selected build+SKU."""
        sel = self.mgr_tree.selection()
        if not sel:
            messagebox.showwarning("No Selection", "Select a build to delete.")
            return

        vals = self.mgr_tree.item(sel[0], "values")
        build_id, sku = vals[0], vals[1]
        games = vals[5]

        if not messagebox.askyesno("Confirm Delete",
                f"Delete {build_id} ({sku})?\n"
                f"This will remove {games} games + all timeseries data.\n\n"
                f"This cannot be undone."):
            return

        try:
            self._release_backend_db_silent()
            con = get_connection(self.db_path)
            con.execute("DELETE FROM game_summary WHERE build_id = ? AND sku_id = ?",
                        [build_id, sku])
            con.execute("DELETE FROM timeseries WHERE build_id = ? AND sku_id = ?",
                        [build_id, sku])
            con.execute("DELETE FROM system_scope WHERE build_id = ? AND sku_id = ?",
                        [build_id, sku])
            con.close()
            self._reacquire_backend_db_silent()

            self.mgr_status_var.set(f"Deleted {build_id}")
            self._mgr_refresh()

            # Clear edit fields
            self.mgr_build_id_var.set("")
            self.mgr_sku_var.set("")
            self.mgr_label_var.set("")
            self.mgr_parent_var.set("")
            self.mgr_games_text.configure(state=tk.NORMAL)
            self.mgr_games_text.delete("1.0", tk.END)
            self.mgr_games_text.configure(state=tk.DISABLED)
        except Exception as e:
            self.mgr_status_var.set(f"Error: {e}")

    def _mgr_open_folder(self):
        """Open the source folder for the selected game in Windows Explorer."""
        sel = self.mgr_games_tree.selection()
        if not sel:
            messagebox.showinfo("No Selection", "Select a game row first.")
            return
        slug = sel[0]
        folder = self.mgr_slug_to_folder.get(slug)
        if not folder:
            messagebox.showinfo("No Folder", f"No source folder tracked for '{slug}'.")
            return
        import os
        os.startfile(folder)

    def _mgr_open_all_folders(self):
        """Open all source folders in Windows Explorer."""
        if not self.mgr_current_folders:
            messagebox.showinfo("No Folders", "No source folders found for this build.")
            return
        import os
        for folder in self.mgr_current_folders:
            os.startfile(str(folder))


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Ingestion GUI for Raptor-X automation runs")
    parser.add_argument("--logs-path", default=str(DEFAULT_LOGS_PATH),
                        help="Path to Raptor-X logs/runs directory")
    parser.add_argument("--db", default=None,
                        help="Path to DuckDB file")
    args = parser.parse_args()

    logs_path = Path(args.logs_path)
    db_path = Path(args.db) if args.db else DEFAULT_DB_PATH

    root = tk.Tk()
    IngestionApp(root, logs_path, db_path)
    root.mainloop()


if __name__ == "__main__":
    main()
