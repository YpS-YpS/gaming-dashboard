"""Registry wrapper for the Intel System Scope JSON parser."""

from pathlib import Path
from typing import Any

from .base import BaseParser
from .system_scope import parse_system_scope


class SystemScopeParser(BaseParser):
    """Intel System Scope — system configuration and hardware inventory."""

    @property
    def name(self) -> str:
        return "Intel System Scope"

    @property
    def key(self) -> str:
        return "system_scope"

    @property
    def file_patterns(self) -> list[str]:
        return ["*SystemScope*.json", "*systemscope*.json"]

    @property
    def chart_types(self) -> list[str]:
        return []

    @property
    def summary_fields(self) -> list[str]:
        return ["cpu_brand", "firmware", "gpu", "os", "motherboard"]

    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        for fp in file_paths:
            result = parse_system_scope(Path(fp))
            if result is not None:
                return {
                    "summary": {},
                    "timeseries": {},
                    "system_info": result,
                }
        return None
