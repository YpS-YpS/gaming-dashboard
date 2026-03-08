"""
PTAT Monitor CSV parser.
Extracts CPU telemetry: per-core freq/temp, IA power, package power,
IA Clip Reason, C-State residency, throttling — all raw rows, no downsampling.
"""

from pathlib import Path

import numpy as np
import polars as pl

from .sku_map import cpu_name_to_sku_id
from .game_map import ptat_filename_to_slug


# ── Column name constants ────────────────────────────────────────────────────
COL_RELATIVE_TIME   = "Relative Time(mS)"
COL_CPU_NAME        = "CPU Name"
COL_CPU_BRAND       = "CPU Brand String"
COL_FIRMWARE        = "Firmware Version"
COL_TJMAX           = "TjMax"
COL_TSC_FREQ        = "TSC Freq"
COL_BASE_CLOCK      = "Base Clock Frequency"
COL_IA_POWER        = "Power-IA Power(Watts)"
COL_GT_POWER        = "Power-GT Power(Watts)"
COL_PKG_POWER       = "Power-Package Power(Watts)"
COL_IA_CLIP         = "Turbo Parameters-IA Clip Reason"
COL_GT_CLIP         = "Turbo Parameters-Gt Clip Reason"
COL_DDR_POWER       = "DDR Info-DDR Power(Watts)"
COL_CORE_TYPE_FMT   = "CPU{n}-Core Type"
COL_FREQ_FMT        = "CPU{n}-Frequency(MHz)"
COL_TEMP_FMT        = "CPU{n}-Temperature(Degree C)"
COL_THROTTLE_FMT    = "CPU{n}-Throttling Reason"
COL_PKG_C0          = "Pkg CState Residency-C2(percent)"   # NVL S uses C2 as C0-active proxy
COL_PKG_C6          = "Pkg CState Residency-C6(percent)"
COL_PKG_C8          = "Pkg CState Residency-C8(percent)"
COL_PKG_C10         = "Pkg CState Residency-C10(percent)"


def _col(fmt: str, n: int) -> str:
    return fmt.replace("{n}", str(n))


def _safe_float(series: pl.Series) -> np.ndarray:
    """Cast a Polars series to float numpy array, replacing nulls/errors with NaN."""
    try:
        return series.cast(pl.Float64, strict=False).fill_null(float("nan")).to_numpy()
    except Exception:
        return np.full(len(series), float("nan"))


def _round_or_zero(v: float) -> float:
    """Round to 2 decimal places, return 0 if NaN."""
    return round(float(v), 2) if not np.isnan(v) else 0


def _rolling_mean(arr: np.ndarray, window: int = 20) -> list[float]:
    """Simple centered rolling mean for trend lines."""
    half = window // 2
    out = []
    for i in range(len(arr)):
        segment = arr[max(0, i - half):i + half]
        out.append(round(float(np.nanmean(segment)), 2))
    return out


def parse_ptat(filepath: str | Path) -> dict | None:
    """
    Parse a PTAT Monitor CSV file — returns ALL rows, no downsampling.

    Returns a dict with:
        sku_id        : str
        game_slug     : str
        firmware      : str
        summary       : dict  (aggregated KPIs)
        timeseries    : dict  (chart arrays keyed by chart type)
        system_info   : dict
    Returns None if the file cannot be parsed.
    """
    filepath = Path(filepath)

    # Read CSV — PTAT uses UTF-8, possibly with BOM
    try:
        df = pl.read_csv(
            filepath,
            encoding="utf8-lossy",
            ignore_errors=True,
            infer_schema_length=10,
            null_values=["Invalid", "N/A", "Error retrieving EU count", ""],
        )
    except Exception as e:
        print(f"  [ERROR] Failed to read {filepath.name}: {e}")
        return None

    if df.is_empty():
        return None

    cols = set(df.columns)
    n_rows = len(df)

    # ── Identity ─────────────────────────────────────────────────────────────
    cpu_name    = df[COL_CPU_NAME][0] if COL_CPU_NAME in cols else ""
    cpu_brand   = df[COL_CPU_BRAND][0] if COL_CPU_BRAND in cols else ""
    firmware    = df[COL_FIRMWARE][0] if COL_FIRMWARE in cols else ""
    tjmax       = df[COL_TJMAX][0] if COL_TJMAX in cols else ""
    tsc_freq    = df[COL_TSC_FREQ][0] if COL_TSC_FREQ in cols else ""

    sku_id   = cpu_name_to_sku_id(str(cpu_name) if cpu_name else "")
    game_slug = ptat_filename_to_slug(filepath.name)

    if not sku_id:
        print(f"  [WARN] Unknown SKU in {filepath.name}: CPU Name={cpu_name!r}")

    # ── Timing ───────────────────────────────────────────────────────────────
    t_ms = _safe_float(df[COL_RELATIVE_TIME]) if COL_RELATIVE_TIME in cols else np.arange(n_rows, dtype=float) * 1000

    # ── Detect cores ─────────────────────────────────────────────────────────
    core_indices = []
    p_core_indices = []
    e_core_indices = []

    for n in range(128):  # scan up to 128 logical CPUs
        freq_col = _col(COL_FREQ_FMT, n)
        type_col = _col(COL_CORE_TYPE_FMT, n)
        if freq_col not in cols:
            break
        core_indices.append(n)
        if type_col in cols:
            core_type_val = str(df[type_col][0]).upper()
            if "P CORE" in core_type_val or "P-CORE" in core_type_val:
                p_core_indices.append(n)
            else:
                e_core_indices.append(n)

    if not p_core_indices and core_indices:
        # Fallback: first 40% are P-Cores
        split = max(1, len(core_indices) * 4 // 10)
        p_core_indices = core_indices[:split]
        e_core_indices = core_indices[split:]

    # ── Per-core freq — all rows ─────────────────────────────────────────────
    p_core_freq_arrays: dict[str, np.ndarray] = {}
    e_core_freq_arrays: dict[str, np.ndarray] = {}

    for n in p_core_indices:
        col = _col(COL_FREQ_FMT, n)
        if col in cols:
            p_core_freq_arrays[f"pCore{p_core_indices.index(n)}"] = _safe_float(df[col])

    for n in e_core_indices:
        col = _col(COL_FREQ_FMT, n)
        if col in cols:
            e_core_freq_arrays[f"eCore{e_core_indices.index(n)}"] = _safe_float(df[col])

    frequency_timeseries = []
    for i in range(n_rows):
        point = {"time": int(t_ms[i])}
        for key, arr in p_core_freq_arrays.items():
            point[key] = _round_or_zero(arr[i])
        for key, arr in e_core_freq_arrays.items():
            point[key] = _round_or_zero(arr[i])
        frequency_timeseries.append(point)

    # ── Per-core temp — all rows ─────────────────────────────────────────────
    temp_arrays: dict[str, np.ndarray] = {}

    for n in core_indices:
        col = _col(COL_TEMP_FMT, n)
        if col in cols:
            temp_arrays[f"core{n}"] = _safe_float(df[col])

    # Package temp = max across all cores per sample
    pkg_temp_arr = None
    if core_indices:
        temp_cols_present = [_col(COL_TEMP_FMT, n) for n in core_indices if _col(COL_TEMP_FMT, n) in cols]
        if temp_cols_present:
            pkg_temp_arr = df.select(temp_cols_present).cast(pl.Float64, strict=False).max_horizontal().to_numpy()

    temp_timeseries = []
    for i in range(n_rows):
        point = {"time": int(t_ms[i])}
        for key, arr in temp_arrays.items():
            point[key] = _round_or_zero(arr[i])
        if pkg_temp_arr is not None:
            point["package"] = _round_or_zero(pkg_temp_arr[i])
        temp_timeseries.append(point)

    # ── Power — all rows ─────────────────────────────────────────────────────
    ia_power  = _safe_float(df[COL_IA_POWER])  if COL_IA_POWER  in cols else np.zeros(n_rows)
    gt_power  = _safe_float(df[COL_GT_POWER])  if COL_GT_POWER  in cols else np.zeros(n_rows)
    pkg_power = _safe_float(df[COL_PKG_POWER]) if COL_PKG_POWER in cols else ia_power * 1.3

    ia_trend  = _rolling_mean(ia_power)
    pkg_trend = _rolling_mean(pkg_power)

    power_timeseries = []
    for i in range(n_rows):
        power_timeseries.append({
            "time":         int(t_ms[i]),
            "iaPower":      _round_or_zero(ia_power[i]),
            "packagePower": _round_or_zero(pkg_power[i]),
            "gtPower":      _round_or_zero(gt_power[i]),
            "iaTrendLine":  ia_trend[i],
            "pkgTrendLine": pkg_trend[i],
        })

    # ── IA Clip Reason (sparse events — only rows where clipping occurs) ─────
    clip_events = []
    if COL_IA_CLIP in cols:
        clip_raw = df[COL_IA_CLIP].cast(pl.Utf8, strict=False)
        for i, (t, reason) in enumerate(zip(t_ms, clip_raw)):
            if reason and reason not in ("Not Clipped", "None", ""):
                clean = str(reason).strip().rstrip(";")
                clip_events.append({"time": int(t), "reason": clean})

    # ── C-State Residency — all rows ─────────────────────────────────────────
    def _get_cstate_arr(col_name):
        if col_name in cols:
            return _safe_float(df[col_name])
        return np.zeros(n_rows)

    pkg_c0  = _get_cstate_arr(COL_PKG_C0)
    pkg_c6  = _get_cstate_arr(COL_PKG_C6)
    pkg_c8  = _get_cstate_arr(COL_PKG_C8)
    pkg_c10 = _get_cstate_arr(COL_PKG_C10)

    residency_timeseries = []
    for i in range(n_rows):
        c6  = float(pkg_c6[i])  if not np.isnan(pkg_c6[i])  else 0
        c8  = float(pkg_c8[i])  if not np.isnan(pkg_c8[i])  else 0
        c10 = float(pkg_c10[i]) if not np.isnan(pkg_c10[i]) else 0
        c0  = max(0.0, 100.0 - c6 - c8 - c10)
        residency_timeseries.append({
            "time":      int(t_ms[i]),
            "residency": round(c0, 2),
            "c6":        round(c6, 2),
            "trendLine": round(c0, 2),
        })

    # ── Summary metrics ───────────────────────────────────────────────────────
    avg_ia_power  = round(float(np.nanmean(ia_power)),  2)
    max_ia_power  = round(float(np.nanmax(ia_power)),   2)
    avg_pkg_power = round(float(np.nanmean(pkg_power)), 2)
    max_pkg_power = round(float(np.nanmax(pkg_power)),  2)

    # Temperature aggregates
    all_temp_cols = [_col(COL_TEMP_FMT, n) for n in core_indices if _col(COL_TEMP_FMT, n) in cols]
    if all_temp_cols:
        all_temps = df.select(all_temp_cols).cast(pl.Float64, strict=False)
        avg_pkg_temp = round(float(all_temps.max_horizontal().mean()), 1)
        max_pkg_temp = round(float(all_temps.max_horizontal().max()), 1)
    else:
        avg_pkg_temp = max_pkg_temp = 0.0

    # Throttling flags
    throttle_flags: list[str] = []
    if clip_events:
        reasons = {e["reason"] for e in clip_events}
        if any("THERMAL" in r for r in reasons):
            throttle_flags.append("Thermal")
        if any("PL" in r or "PBM" in r for r in reasons):
            throttle_flags.append("Power Limit")

    # P-Core / E-Core avg MHz
    p_core_avgs = []
    for n in p_core_indices:
        col = _col(COL_FREQ_FMT, n)
        if col in cols:
            p_core_avgs.append(float(np.nanmean(_safe_float(df[col]))))
    e_core_avgs = []
    for n in e_core_indices:
        col = _col(COL_FREQ_FMT, n)
        if col in cols:
            e_core_avgs.append(float(np.nanmean(_safe_float(df[col]))))

    avg_p_core_mhz = round(float(np.mean(p_core_avgs)), 0) if p_core_avgs else 0
    avg_e_core_mhz = round(float(np.mean(e_core_avgs)), 0) if e_core_avgs else 0
    max_p_core_mhz = round(float(np.max(p_core_avgs)), 0) if p_core_avgs else 0
    min_p_core_mhz = round(float(np.min(p_core_avgs)), 0) if p_core_avgs else 0
    max_e_core_mhz = round(float(np.max(e_core_avgs)), 0) if e_core_avgs else 0
    min_e_core_mhz = round(float(np.min(e_core_avgs)), 0) if e_core_avgs else 0

    return {
        "sku_id":    sku_id,
        "game_slug": game_slug,
        "firmware":  str(firmware) if firmware else "",
        "system_info": {
            "cpu_name":    str(cpu_name) if cpu_name else "",
            "cpu_brand":   str(cpu_brand) if cpu_brand else "",
            "tjmax":       str(tjmax) if tjmax else "",
            "tsc_freq":    str(tsc_freq) if tsc_freq else "",
            "core_count":  len(core_indices),
            "p_core_count": len(p_core_indices),
            "e_core_count": len(e_core_indices),
        },
        "summary": {
            "avg_ia_power":   avg_ia_power,
            "max_ia_power":   max_ia_power,
            "avg_pkg_power":  avg_pkg_power,
            "max_pkg_power":  max_pkg_power,
            "avg_pkg_temp":   avg_pkg_temp,
            "max_pkg_temp":   max_pkg_temp,
            "avg_p_core_mhz": avg_p_core_mhz,
            "max_p_core_mhz": max_p_core_mhz,
            "min_p_core_mhz": min_p_core_mhz,
            "avg_e_core_mhz": avg_e_core_mhz,
            "max_e_core_mhz": max_e_core_mhz,
            "min_e_core_mhz": min_e_core_mhz,
            "throttling":     throttle_flags,
            "p_core_count":   len(p_core_indices),
            "e_core_count":   len(e_core_indices),
        },
        "timeseries": {
            "frequency":       frequency_timeseries,
            "temperature":     temp_timeseries,
            "power":           power_timeseries,
            "clipReason":      clip_events,
            "cstateResidency": residency_timeseries,
        },
    }
