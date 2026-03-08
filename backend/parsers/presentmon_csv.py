"""
PresentMon CSV parser.
Reads PresentMon CSV files from Raptor-X automation output and produces
the same output shape as capframex.py so the dashboard can consume either
format interchangeably.
"""

import csv
from pathlib import Path

import numpy as np

from .game_map import capframex_to_slug


def _percentile_fps(frame_times_ms: list[float], p: float) -> float:
    """Convert Nth percentile frame time to FPS (higher frame time = lower FPS)."""
    if not frame_times_ms:
        return 0.0
    pct_ft = float(np.percentile(frame_times_ms, p))
    return round(1000.0 / pct_ft, 1) if pct_ft > 0 else 0.0


def _build_frametimes(frame_times_ms: list[float]) -> list[dict]:
    """
    Build frame time chart data from ALL raw frames -- no downsampling.
    Each point gets frame time, instantaneous FPS, and reference stat lines.
    """
    if not frame_times_ms:
        return []

    arr = np.array(frame_times_ms, dtype=float)

    avg_ft = round(float(arr.mean()), 3)
    p95_ft = round(float(np.percentile(arr, 95)), 3)
    p99_ft = round(float(np.percentile(arr, 99)), 3)

    result = []
    for i in range(len(arr)):
        ft = float(arr[i])
        result.append({
            "frame": i,
            "frameTime": round(ft, 3),
            "fps": round(1000.0 / ft, 1) if ft > 0 else 0,
            "movingAvg": avg_ft,
            "percentile95": p95_ft,
            "percentile99": p99_ft,
        })

    return result


def parse_presentmon_csv(filepath: str | Path, manifest: dict | None = None) -> dict | None:
    """
    Parse a PresentMon CSV file from Raptor-X automation output.

    Args:
        filepath: Path to the PresentMon CSV file.
        manifest: Optional Raptor-X manifest.json dict with SUT info
                  (gpu_name, os_name, motherboard_name, etc.)

    Returns a dict matching capframex.py output shape:
        game_slug, info, summary, frametimes
    Returns None if the file cannot be mapped to a known game or has no valid frames.
    """
    filepath = Path(filepath)
    manifest = manifest or {}

    # Read CSV rows
    rows = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    if not rows:
        return None

    # Determine process name from first row's Application column
    process_name = rows[0].get("Application", "").strip()
    if not process_name:
        return None

    # Map to game slug (pass empty game name, fall back to process name matching)
    game_slug = capframex_to_slug("", process_name)
    if not game_slug:
        print(f"  [WARN] Could not map PresentMon game: Application={process_name!r}")
        return None

    # Filter for Application frames only (skip compositor/DWM frames)
    has_frame_type = "FrameType" in rows[0]
    if has_frame_type:
        rows = [r for r in rows if r.get("FrameType", "").strip() == "Application"]

    # Extract frame times and GPU/CPU active times
    all_frame_times: list[float] = []
    all_gpu_active: list[float] = []
    all_cpu_active: list[float] = []

    for row in rows:
        try:
            ft = float(row.get("MsBetweenPresents", "0"))
        except (ValueError, TypeError):
            continue

        if ft <= 0:
            continue

        all_frame_times.append(ft)

        # GPU active
        try:
            gpu_val = float(row.get("MsGPUBusy", "0"))
            all_gpu_active.append(gpu_val)
        except (ValueError, TypeError):
            pass

        # CPU active
        try:
            cpu_val = float(row.get("MsCPUBusy", "0"))
            all_cpu_active.append(cpu_val)
        except (ValueError, TypeError):
            pass

    if not all_frame_times:
        return None

    arr = np.array(all_frame_times, dtype=float)

    avg_fps = round(1000.0 / float(arr.mean()), 1)
    one_pct_low = _percentile_fps(all_frame_times, 99)
    zero_one_pct_low = _percentile_fps(all_frame_times, 99.9)
    max_fps = round(1000.0 / float(arr.min()), 1) if arr.min() > 0 else 0
    min_fps = round(1000.0 / float(arr.max()), 1) if arr.max() > 0 else 0

    avg_gpu_active_ms = round(float(np.mean(all_gpu_active)), 2) if all_gpu_active else 0.0
    avg_cpu_active_ms = round(float(np.mean(all_cpu_active)), 2) if all_cpu_active else 0.0

    return {
        "game_slug": game_slug,
        "info": {
            "game_name": "",
            "process_name": process_name,
            "gpu": manifest.get("gpu_name", ""),
            "motherboard": manifest.get("motherboard_name", ""),
            "os": manifest.get("os_name", ""),
            "creation_date": manifest.get("creation_date", ""),
            "app_version": "",
            "total_frames": len(all_frame_times),
        },
        "summary": {
            "avg_fps": avg_fps,
            "one_pct_low": one_pct_low,
            "zero_one_pct_low": zero_one_pct_low,
            "max_fps": max_fps,
            "min_fps": min_fps,
            "avg_gpu_active_ms": avg_gpu_active_ms,
            "avg_cpu_active_ms": avg_cpu_active_ms,
            "avg_frame_time_ms": round(float(arr.mean()), 3),
            "p95_frame_time_ms": round(float(np.percentile(arr, 95)), 3),
            "p99_frame_time_ms": round(float(np.percentile(arr, 99)), 3),
        },
        "frametimes": _build_frametimes(all_frame_times),
    }
