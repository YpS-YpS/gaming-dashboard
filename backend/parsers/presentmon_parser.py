"""Registry wrapper for the Intel PresentMon CSV parser."""

from pathlib import Path
from typing import Any

from .base import BaseParser
from .presentmon_csv import parse_presentmon_csv


class PresentMonParser(BaseParser):
    """Intel PresentMon — frame time capture from PresentMon CSV output."""

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
            "avg_fps", "one_pct_low", "zero_one_pct_low",
            "max_fps", "min_fps",
            "avg_gpu_active_ms", "avg_cpu_active_ms",
            "avg_frame_time_ms", "p95_frame_time_ms", "p99_frame_time_ms",
        ]

    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        manifest = kwargs.get("manifest")
        for fp in file_paths:
            result = parse_presentmon_csv(fp, manifest=manifest)
            if result is not None:
                return {
                    "summary": result["summary"],
                    "timeseries": {"frametimes": result["frametimes"]},
                    "system_info": result.get("info", {}),
                }
        return None
