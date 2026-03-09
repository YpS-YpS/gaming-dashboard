"""Auto-discovery registry for parser plugins."""

import fnmatch
import importlib
import pkgutil
from pathlib import Path

from .base import BaseParser

_parsers: dict[str, BaseParser] = {}
_discovered = False


def discover_parsers() -> None:
    """Auto-discover all BaseParser subclasses in the parsers package."""
    global _discovered
    if _discovered:
        return

    package_dir = Path(__file__).parent
    skip = {"registry", "base", "__init__", "game_map", "sku_map"}

    for _, module_name, _ in pkgutil.iter_modules([str(package_dir)]):
        if module_name in skip:
            continue
        try:
            module = importlib.import_module(f".{module_name}", package=__package__)
        except Exception:
            continue
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if (
                isinstance(attr, type)
                and issubclass(attr, BaseParser)
                and attr is not BaseParser
            ):
                instance = attr()
                _parsers[instance.key] = instance

    _discovered = True


def get_parser(key: str) -> BaseParser | None:
    """Get a parser by its key."""
    discover_parsers()
    return _parsers.get(key)


def get_all_parsers() -> dict[str, BaseParser]:
    """Get all registered parsers."""
    discover_parsers()
    return dict(_parsers)


def match_files(file_paths: list[str]) -> dict[str, list[str]]:
    """
    Match a list of file paths to parsers by their glob patterns.

    Returns {parser_key: [matched_file_paths]}.
    """
    discover_parsers()
    result: dict[str, list[str]] = {}

    for key, parser in _parsers.items():
        matched = []
        for fp in file_paths:
            name = Path(fp).name
            for pattern in parser.file_patterns:
                if fnmatch.fnmatch(name, pattern):
                    matched.append(fp)
                    break
        if matched:
            result[key] = matched

    return result


def get_all_chart_types() -> list[str]:
    """Get union of all chart types across all parsers."""
    discover_parsers()
    types = set()
    for parser in _parsers.values():
        types.update(parser.chart_types)
    return sorted(types)


def get_all_parser_keys() -> list[str]:
    """Get all registered parser keys."""
    discover_parsers()
    return sorted(_parsers.keys())
