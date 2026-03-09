"""Registry wrapper for the CapFrameX JSON parser."""

from pathlib import Path
from typing import Any

from .base import BaseParser
from .capframex import parse_capframex


class CapFrameXParser(BaseParser):
    """CapFrameX — frame time capture from CapFrameX JSON session files."""

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
            "avg_fps", "one_pct_low", "zero_one_pct_low",
            "max_fps", "min_fps",
            "avg_gpu_active_ms", "avg_cpu_active_ms",
            "avg_frame_time_ms", "p95_frame_time_ms", "p99_frame_time_ms",
        ]

    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        for fp in file_paths:
            result = parse_capframex(fp)
            if result is not None:
                return {
                    "summary": result["summary"],
                    "timeseries": {"frametimes": result["frametimes"]},
                    "system_info": result.get("info", {}),
                }
        return None
