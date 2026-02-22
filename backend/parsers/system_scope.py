"""
Parser for Intel System Scope Tool JSON logs.

Extracts:
  - Build ID from BKC Meta → InternalBkcName
  - All module groups with their key-value items, organized by plugin/module/group

JSON structure:
  SystemScopeLog → Plugins[] → Modules[] → groups[] → items[] → {Name, Value}
"""

import json
from pathlib import Path

# Sections relevant for the gaming dashboard (ordered by importance)
DASHBOARD_SECTIONS = [
    "Bkcmeta Information",
    "Processor Information",
    "Graphics Information",
    "OS Information",
    "Firmware Version",
    "Memory",
    "HW Information",
    "Generic System Information",
    "BIOS Options",
    "DG Information",
    "ME Information",
    "PCH",
    "Storage",
    "Sensor Information",
    "SMBIOS",
    "Thunderbolt Information",
    "TPM Information",
    "USB",
    "NetworkAdapter Information",
    "Bluetooth",
    "ACPI",
    "Multimedia",
    "Components Information",
    "Battery Information",
    "WWAN",
]


def _extract_groups(mod: dict) -> list[dict]:
    """Extract groups with key-value items from a module, skipping non-dict items (e.g. ACPI raw strings)."""
    groups = []
    for group in mod.get("groups", []):
        group_name = group.get("GroupName", "")
        items = []
        for item in group.get("items", []):
            if not isinstance(item, dict):
                continue  # Skip raw strings (e.g. ACPI ASL source)
            name = item.get("Name", "")
            value = item.get("Value", item.get("Version", ""))
            if name:
                items.append({"name": name, "value": str(value) if value is not None else ""})
        if items:
            groups.append({"name": group_name, "items": items})
    return groups


def parse_system_scope(file_path: Path) -> dict | None:
    """
    Parse a System Scope JSON file.

    Returns:
        {
            "build_id": "NVL-S-CONS-26.03.5.139",
            "bkc_name": "NVL-S-CONS-NVL-S-CONS-26.03.5.139",
            "program_name": "NVL-S-CONS",
            "creation_date": "20260115",
            "log_info": { "ip": ..., "capture_time": ..., "tool_version": ... },
            "sections": [
                {
                    "module": "Bkcmeta Information",
                    "plugin": "Software",
                    "groups": [
                        {
                            "name": "Bkcmeta Information",
                            "items": [ {"name": "InternalBkcName", "value": "..."}, ... ]
                        }
                    ]
                },
                ...
            ]
        }
    """
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    log = data.get("SystemScopeLog", {})

    # Log metadata
    log_info_raw = log.get("LogInformation", {})
    log_info = {
        "ip": log_info_raw.get("IPAddress", ""),
        "capture_time": log_info_raw.get("LogCaptureTime", ""),
        "capture_end_time": log_info_raw.get("LogCaptureEndTime", ""),
        "tool_version": log_info_raw.get("ToolVersion", ""),
        "system_name": log_info_raw.get("SystemName", ""),
    }

    # Build index of all modules across all plugins
    module_index: dict[str, tuple[str, dict]] = {}  # module_name -> (plugin_name, module_dict)
    for plugin in log.get("Plugins", []):
        plugin_name = plugin.get("PluginName", "Unknown")
        for mod in plugin.get("Modules", []):
            mod_name = mod.get("ModuleName", "")
            if mod_name:
                module_index[mod_name] = (plugin_name, mod)

    # Extract BKC meta for build ID
    build_id = None
    bkc_name = None
    program_name = None
    creation_date = None

    if "Bkcmeta Information" in module_index:
        _, bkc_mod = module_index["Bkcmeta Information"]
        for group in bkc_mod.get("groups", []):
            for item in group.get("items", []):
                name = item.get("Name", "")
                value = item.get("Value", "")
                if name == "InternalBkcName":
                    bkc_name = value
                elif name == "Version":
                    build_id = value
                elif name == "ProgramName":
                    program_name = value
                elif name == "CreationDate":
                    creation_date = value

    if not build_id and bkc_name:
        # Fallback: use the full InternalBkcName
        build_id = bkc_name

    # Extract all sections
    sections = []
    for mod_name in DASHBOARD_SECTIONS:
        if mod_name not in module_index:
            continue
        plugin_name, mod = module_index[mod_name]
        groups = _extract_groups(mod)
        if groups:
            sections.append({
                "module": mod_name,
                "plugin": plugin_name,
                "groups": groups,
            })

    # Also capture any modules NOT in DASHBOARD_SECTIONS
    known = set(DASHBOARD_SECTIONS)
    for mod_name, (plugin_name, mod) in module_index.items():
        if mod_name in known:
            continue
        groups = _extract_groups(mod)
        if groups:
            sections.append({
                "module": mod_name,
                "plugin": plugin_name,
                "groups": groups,
            })

    # Extract quick specs summary
    quick_specs = _extract_quick_specs(sections)

    return {
        "build_id": build_id,
        "bkc_name": bkc_name,
        "program_name": program_name,
        "creation_date": creation_date,
        "log_info": log_info,
        "quick_specs": quick_specs,
        "sections": sections,
    }


def _extract_quick_specs(sections: list[dict]) -> list[dict]:
    """
    Extract a flat quick-specs table from parsed sections.
    Returns a list of {category, label, value} dicts.
    """
    # Build a lookup: (module, group?) -> {item_name: value}
    lookup: dict[str, dict[str, str]] = {}  # "module|group" -> {name: value}
    for section in sections:
        mod = section["module"]
        for group in section["groups"]:
            key = f"{mod}|{group['name']}"
            for item in group["items"]:
                lookup.setdefault(key, {})[item["name"]] = item["value"]

    def _get(module: str, group: str, name: str) -> str:
        return lookup.get(f"{module}|{group}", {}).get(name, "")

    def _get_any(module: str, name: str) -> str:
        """Search all groups in a module for a field."""
        for section in sections:
            if section["module"] != module:
                continue
            for group in section["groups"]:
                for item in group["items"]:
                    if item["name"] == name:
                        return item["value"]
        return ""

    def _get_first(module: str, group_prefix: str, name: str) -> str:
        """Get from first group matching prefix."""
        for section in sections:
            if section["module"] != module:
                continue
            for group in section["groups"]:
                if group["name"].startswith(group_prefix):
                    for item in group["items"]:
                        if item["name"] == name:
                            return item["value"]
        return ""

    # Count P-cores and E-cores from topology
    p_cores = 0
    e_cores = 0
    for section in sections:
        if section["module"] != "Processor Information":
            continue
        for group in section["groups"]:
            if group["name"] == "Topology Details":
                for item in group["items"]:
                    if item["name"].endswith(" Type"):
                        if item["value"] == "Core":
                            p_cores += 1
                        elif item["value"] == "Atom":
                            e_cores += 1

    total_cores = p_cores + e_cores
    logical_cores = _get("Processor Information", "Topology Details", "Number of Logical Processor Cores")

    # Storage: combine drives
    storage_parts = []
    for section in sections:
        if section["module"] != "Storage":
            continue
        for group in section["groups"]:
            cap = ""
            name = ""
            for item in group["items"]:
                if item["name"] == "Disk Drive name":
                    name = item["value"]
                elif item["name"] == "Caption":
                    if not name:
                        name = item["value"]
                elif item["name"] == "Size":
                    try:
                        bytes_val = int(item["value"].split()[0])
                        gb = bytes_val / (1024**3)
                        cap = f"{gb:.0f}GB"
                    except Exception:
                        cap = item["value"]
            if name:
                storage_parts.append(f"{cap} {name}".strip())

    # Memory info from first DIMM
    mem_mfr = _get_first("Memory", "Controller", "Manufacturer")
    mem_type = _get_first("Memory", "Controller", "MemoryType")
    mem_freq = _get_first("Memory", "Controller", "Configured Memory Clock Speed")
    mem_part = _get_first("Memory", "Controller", "Part Number")
    mem_capacity = _get_first("Memory", "Controller", "Capacity")
    # Count DIMMs
    dimm_count = 0
    for section in sections:
        if section["module"] == "Memory":
            for group in section["groups"]:
                if "Controller" in group["name"] and "DIMM" in group["name"]:
                    dimm_count += 1

    # Power policy
    power_policy = _get("Generic System Information", "SystemPowerCapabilities", "PowerPolicy")
    ac_status = _get("Generic System Information", "SystemPowerCapabilities", "AC Link Status")
    battery_flag = _get("Generic System Information", "SystemPowerCapabilities", "BatteryFlag")

    # Build the specs list
    specs = []

    def add(cat, label, value):
        if value and value not in ("Unknown", "Not Available", "NA", ""):
            specs.append({"category": cat, "label": label, "value": value})

    # System
    add("System", "System Name", _get("Generic System Information", "System Information", "System Model"))
    add("System", "Brand", _get("Processor Information", "Basic Information", "Manufacturer"))
    add("System", "Architecture", _get("Processor Information", "Basic Information", "Architecture"))
    add("System", "Model Number/SKU", _get("Generic System Information", "System Information", "SystemSKU"))

    # Processor
    add("Processor", "CPU Name", _get("Processor Information", "Basic Information", "Name"))
    add("Processor", "Total Cores", str(total_cores) if total_cores else "")
    add("Processor", "Total Threads", logical_cores)
    add("Processor", "# of Performance Cores", str(p_cores) if p_cores else "")
    add("Processor", "# of Efficient Cores", str(e_cores) if e_cores else "")
    add("Processor", "Max Clock Speed", _get("Processor Information", "Basic Information", "Maximum Clock Speed"))
    add("Processor", "Microcode Version", _get("Processor Information", "Basic Information", "Microcode Version"))

    # Board
    add("Platform", "Motherboard Name", _get("Graphics Information", "GENERAL INFORMATION", "BaseBoard Product"))
    add("Platform", "BIOS Version", _get_any("Firmware Version", "BIOS Version"))

    # Storage
    add("Platform", "Storage", " + ".join(storage_parts) if storage_parts else "")

    # Memory
    mem_summary = f"{mem_type} {mem_freq}".strip() if mem_type else mem_freq
    if dimm_count > 1:
        mem_summary += f" ({dimm_count}x DIMMs)"
    add("Memory", "Memory Type & Speed", mem_summary)
    add("Memory", "Memory Manufacturer", mem_mfr)
    add("Memory", "Memory Part Number", mem_part)

    # OS
    add("OS", "Operating System", _get("OS Information", "OS Details", "Caption"))
    add("OS", "OS Build Number", _get("OS Information", "OS Details", "Build Number"))
    add("OS", "OS Version", _get("OS Information", "OS Details", "Version"))

    # Graphics
    gfx_mode = _get("Graphics Information", "GENERAL INFORMATION", "Current Gfx Mode")
    igfx_card = ""
    dgfx_card = ""
    dgfx_driver = ""
    igfx_driver = _get("Graphics Information", "GENERAL INFORMATION", "Graphics Driver Version")
    resolution = ""
    for section in sections:
        if section["module"] != "Graphics Information":
            continue
        for group in section["groups"]:
            if group["name"].startswith("DISPLAY DEVICE"):
                for item in group["items"]:
                    if item["name"] == "Card Name":
                        card = item["value"]
                        if "NVIDIA" in card or "AMD" in card or "Radeon" in card:
                            dgfx_card = card
                        elif "Intel" in card:
                            igfx_card = card
                    elif item["name"] == "Resolution" and not resolution:
                        resolution = item["value"]

    add("Graphics", "Integrated Graphics", igfx_card if igfx_card else "")
    add("Graphics", "iGFX Driver Version", igfx_driver if igfx_card else "")
    add("Graphics", "Discrete Graphics", dgfx_card)
    add("Graphics", "dGFX Driver Version", dgfx_driver)
    add("Graphics", "Graphics Mode", gfx_mode)
    add("Graphics", "Resolution", resolution)

    # Power
    add("Power", "Power Plan", power_policy)
    add("Power", "AC/DC", ac_status)
    add("Power", "Battery", battery_flag)

    # Security
    add("Security", "Secure Boot", _get("Generic System Information", "System Information", "Secure Boot State"))
    add("Security", "VBS", _get("Generic System Information", "System Information", "HyperV VM Monitor Mode Extensions"))

    return specs
