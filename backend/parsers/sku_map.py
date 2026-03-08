"""
Maps raw CPU Name values (from PTAT CSV col 10) to dashboard SKU IDs.
To add a new SKU: add an entry here + add the SKU to src/data/programs.js
"""

# PTAT CPU Name → dashboard SKU ID
PTAT_CPU_NAME_TO_SKU: dict[str, str] = {
    # Nova Lake
    "NVL S":              "nvl-s",
    "NVL S IGFX":         "nvl-s-igfx",
    "NVL S BLLC":         "nvl-s-bllc",
    # Arrow Lake
    "ARL S":              "arl-s",
    "ARL HX (SBGA)":      "arl-hx",
    "ARL HX":             "arl-hx",
    "ARL H":              "arl-h",
    # Panther Lake
    "PTL U":              "ptl-u",
    "PTL H":              "ptl-h",
    # Raptor Lake
    "RPL S":              "rpl-s",
    "RPL HX":             "rpl-hx",
}

# Short PTAT SKU -> full dashboard SKU IDs (used by ingestion wizard)
PTAT_SKU_TO_DASHBOARD_SKU: dict[str, list[str]] = {
    "nvl-s":        ["nvl-sk-28c", "nvl-sk-28c-bllc", "nvl-sk-52c", "nvl-sk-52c-bllc"],
    "nvl-s-bllc":   ["nvl-sk-28c-bllc", "nvl-sk-52c-bllc"],
    "nvl-s-igfx":   ["nvl-s-igfx"],
    "arl-s":        ["arl-s"],
    "arl-hx":       ["arl-hx"],
    "arl-h":        ["arl-h"],
    "ptl-u":        ["ptl-u"],
    "ptl-h":        ["ptl-h"],
    "rpl-s":        ["rpl-s"],
    "rpl-hx":       ["rpl-hx"],
}

# Folder name fragment → SKU ID (fallback when multiple SKUs share a folder)
FOLDER_FRAGMENT_TO_SKU: dict[str, str] = {
    "nvl-s":     "nvl-s",
    "nvl_s":     "nvl-s",
    "arl-s":     "arl-s",
    "arl_s":     "arl-s",
    "arl-hx":    "arl-hx",
    "arl_hx":    "arl-hx",
    "arl-h":     "arl-h",
    "arl_h":     "arl-h",
    "ptl-u":     "ptl-u",
    "ptl_u":     "ptl-u",
    "ptl-h":     "ptl-h",
    "ptl_h":     "ptl-h",
}


def cpu_name_to_sku_id(cpu_name: str) -> str | None:
    """Resolve PTAT CPU Name field to a dashboard SKU ID."""
    if not cpu_name:
        return None
    normalized = cpu_name.strip().upper()
    for key, sku_id in PTAT_CPU_NAME_TO_SKU.items():
        if key.upper() == normalized:
            return sku_id
    # Partial match fallback
    for key, sku_id in PTAT_CPU_NAME_TO_SKU.items():
        if key.upper() in normalized:
            return sku_id
    return None


def folder_to_sku_id(folder_name: str) -> str | None:
    """Resolve a folder name fragment to a dashboard SKU ID."""
    lower = folder_name.lower()
    for fragment, sku_id in FOLDER_FRAGMENT_TO_SKU.items():
        if fragment in lower:
            return sku_id
    return None
