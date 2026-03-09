"""Registry wrapper for the Intel PTAT Monitor parser."""

from pathlib import Path
from typing import Any

from .base import BaseParser
from .ptat import parse_ptat
from .game_map import ptat_filename_to_slug
from .sku_map import cpu_name_to_sku_id


class PTATParser(BaseParser):
    """Intel PTAT Monitor — CPU telemetry (freq, temp, power, clip, C-state)."""

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
            "avg_ia_power", "max_ia_power",
            "avg_pkg_power", "max_pkg_power",
            "avg_pkg_temp", "max_pkg_temp",
            "avg_p_core_mhz", "max_p_core_mhz", "min_p_core_mhz",
            "avg_e_core_mhz", "max_e_core_mhz", "min_e_core_mhz",
            "throttling", "p_core_count", "e_core_count",
        ]

    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        for fp in file_paths:
            result = parse_ptat(fp)
            if result is not None:
                return {
                    "summary": result["summary"],
                    "timeseries": result["timeseries"],
                    "system_info": result.get("system_info", {}),
                }
        return None

    def detect_game_slug(self, file_path: str | Path) -> str | None:
        return ptat_filename_to_slug(Path(file_path).name)

    def detect_sku(self, file_path: str | Path) -> str | None:
        result = parse_ptat(file_path)
        if result is not None:
            sku_id = result.get("sku_id", "")
            if sku_id:
                return sku_id
        return None
