"""
CapFrameX JSON parser.
Extracts FPS metrics and frame time timeseries from a CapFrameX session file.
"""

import json
import math
from pathlib import Path

import numpy as np

from .game_map import capframex_to_slug


def _percentile_fps(frame_times_ms: list[float], p: float) -> float:
    """Convert Nth percentile frame time to FPS (higher frame time = lower FPS)."""
    if not frame_times_ms:
        return 0.0
    # pth percentile frame time → (100-p)th FPS percentile
    pct_ft = float(np.percentile(frame_times_ms, p))
    return round(1000.0 / pct_ft, 1) if pct_ft > 0 else 0.0


def _build_frametimes(frame_times_ms: list[float]) -> list[dict]:
    """
    Build frame time chart data from ALL raw frames — no downsampling.
    Each point gets frame time, instantaneous FPS, and reference stat lines.
    """
    if not frame_times_ms:
        return []

    arr = np.array(frame_times_ms, dtype=float)

    # Compute stat lines once (reference lines in FrameTimeChart)
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


def parse_capframex(filepath: str | Path) -> dict | None:
    """
    Parse a CapFrameX JSON session file.

    Returns a dict with:
        game_slug     : str
        summary       : dict  (KPI metrics — feeds game cards)
        frametimes    : list  (downsampled chart data — feeds FrameTimeChart)
        info          : dict  (session metadata)
    Returns None if the file cannot be mapped to a known game.
    """
    filepath = Path(filepath)

    with open(filepath, "r", encoding="utf-8-sig") as f:
        data = json.load(f)

    info = data.get("Info", {})
    runs = data.get("Runs", [])

    if not runs:
        return None

    game_name = info.get("GameName", "")
    process_name = info.get("ProcessName", "")
    game_slug = capframex_to_slug(game_name, process_name)

    if not game_slug:
        print(f"  [WARN] Could not map game: GameName={game_name!r}, Process={process_name!r}")
        return None

    # Aggregate across all runs (most sessions have 1, but handle multiple)
    all_frame_times: list[float] = []
    all_times_sec: list[float] = []
    all_gpu_active: list[float] = []
    all_cpu_active: list[float] = []

    for run in runs:
        capture = run.get("CaptureData", {})
        ft = capture.get("MsBetweenPresents", [])
        ts = capture.get("TimeInSeconds", [])
        gpu = capture.get("GpuActive", [])
        cpu = capture.get("CpuActive", [])

        all_frame_times.extend([x for x in ft if isinstance(x, (int, float)) and x > 0])
        all_times_sec.extend(ts[:len(ft)])
        all_gpu_active.extend([x for x in gpu if isinstance(x, (int, float))])
        all_cpu_active.extend([x for x in cpu if isinstance(x, (int, float))])

    if not all_frame_times:
        return None

    arr = np.array(all_frame_times, dtype=float)

    avg_fps = round(1000.0 / float(arr.mean()), 1)
    one_pct_low = _percentile_fps(all_frame_times, 99)       # 99th pct frame time
    zero_one_pct_low = _percentile_fps(all_frame_times, 99.9)  # 99.9th pct frame time
    max_fps = round(1000.0 / float(arr.min()), 1) if arr.min() > 0 else 0
    min_fps = round(1000.0 / float(arr.max()), 1) if arr.max() > 0 else 0

    # GPU / CPU active (ms → utilisation proxy, capped at 100)
    avg_gpu_active_ms = round(float(np.mean(all_gpu_active)), 2) if all_gpu_active else 0.0
    avg_cpu_active_ms = round(float(np.mean(all_cpu_active)), 2) if all_cpu_active else 0.0

    return {
        "game_slug": game_slug,
        "info": {
            "game_name": game_name,
            "process_name": process_name,
            "gpu": info.get("GPU", ""),
            "motherboard": info.get("Motherboard", ""),
            "os": info.get("OS", ""),
            "creation_date": info.get("CreationDate", ""),
            "app_version": info.get("AppVersion", ""),
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
