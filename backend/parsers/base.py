"""Abstract base class for all data parsers."""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class BaseParser(ABC):
    """
    Interface for data parsers in the ingestion pipeline.

    Each parser declares what files it handles and what data it produces.
    The registry auto-discovers all parsers in the parsers/ package.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name, e.g. 'Intel PTAT Monitor'."""

    @property
    @abstractmethod
    def key(self) -> str:
        """Short key for DB and API, e.g. 'ptat'."""

    @property
    @abstractmethod
    def file_patterns(self) -> list[str]:
        """Glob patterns this parser handles, e.g. ['ptat_*.csv']."""

    @property
    @abstractmethod
    def chart_types(self) -> list[str]:
        """Timeseries chart types produced, e.g. ['frequency', 'temperature']."""

    @property
    @abstractmethod
    def summary_fields(self) -> list[str]:
        """KPI fields contributed to game_summary, e.g. ['avg_ia_power']."""

    @abstractmethod
    def parse(self, file_paths: list[str | Path], game_slug: str, **kwargs) -> dict[str, Any] | None:
        """
        Parse given files and return extracted data.

        Returns:
            {
                "summary": { ...KPI fields... },
                "timeseries": { "chart_type": [...data points...] },
                "system_info": { ...optional metadata... }
            }
            or None if parsing fails.
        """

    def detect_game_slug(self, file_path: str | Path) -> str | None:
        """Optional: detect game slug from filename. Return None if unknown."""
        return None

    def detect_sku(self, file_path: str | Path) -> str | None:
        """Optional: detect SKU from file contents. Return None if unknown."""
        return None
