"""
Maps CapFrameX GameName field + exe process name to dashboard game slugs.
Also maps PTAT log filename prefixes for PTAT↔CapFrameX pairing.
To add a new game: add entries here + add to src/data/games.js
"""

# CapFrameX Info.GameName → dashboard slug
CAPFRAMEX_GAME_NAME_TO_SLUG: dict[str, str] = {
    "Cyberpunk 2077":                       "cb2077",
    "Red Dead Redemption 2":                "rdr2",
    "Final Fantasy XIV: Dawntrail":         "ffxiv",
    "Final Fantasy XIV Online":             "ffxiv",
    "FFXIV":                                "ffxiv",
    "F1 24":                                "f1-24",
    "F1® 24":                               "f1-24",
    "Horizon Zero Dawn Remastered":         "hzd",
    "Horizon Zero Dawn":                    "hzd",
    "HITMAN 3":                             "hitman3",
    "Hitman 3":                             "hitman3",
    "Shadow of the Tomb Raider":            "sotr",
    "Assassin's Creed Mirage":              "ac-mirage",
    "Black Myth: Wukong":                   "wukong",
    "Far Cry 6":                            "far-cry-6",
    "Civilization VI":                      "civ6",
    "Sid Meier's Civilization VI":          "civ6",
    "Tiny Tina's Wonderlands":              "tiny-tina",
    "Hogwarts Legacy":                      "hogwarts",
    "Spider-Man Remastered":                "spiderman",
    "Elden Ring":                           "eldenring",
    "Forza Horizon 5":                      "fh5",
    "Call of Duty: Modern Warfare III":     "mw3",
    "Baldur's Gate 3":                      "bg3",
    "Starfield":                            "starfield",
    "Alan Wake 2":                          "alanwake2",
    "Resident Evil 4":                      "re4",
    "Diablo IV":                            "diablo4",
    "Counter-Strike 2":                     "cs2",
    "Valorant":                             "val",
    "League of Legends":                    "lol",
    "Apex Legends":                         "apex",
    "Overwatch 2":                          "owatch2",
    "God of War Ragnarök":                  "gowr",
    "The Last of Us Part I":                "tlou",
    "Death Stranding: Director's Cut":      "deathstranding",
    "Metro Exodus":                         "metro",
    "A Plague Tale: Requiem":               "plaguetale",
    "Dead Space":                           "deadspace",
    "Returnal":                             "returnal",
    "Palworld":                             "palworld",
    "Enshrouded":                           "enshrouded",
    "Helldivers 2":                         "helldivers2",
    "Hades II":                             "hades2",
    "Age of Empires IV":                    "aoe4",
    "Total War: WARHAMMER III":             "tww3",
    "Microsoft Flight Simulator 2024":      "msfs2024",
    "Avatar: Frontiers of Pandora":         "avatar",
    "Hitman World of Assassination":        "hitman3",
}

# CapFrameX process name (exe without .exe) → slug (fallback)
CAPFRAMEX_PROCESS_TO_SLUG: dict[str, str] = {
    "Cyberpunk2077":                "cb2077",
    "RDR2":                         "rdr2",
    "ffxiv_dx11":                   "ffxiv",
    "F1_24":                        "f1-24",
    "HorizonZeroDawnRemastered":    "hzd",
    "HITMAN3":                      "hitman3",
    "SOTTR":                        "sotr",
    "ACMirage":                     "ac-mirage",
    "b1-Win64-Shipping":            "wukong",   # Black Myth: Wukong
    "FarCry6":                      "far-cry-6",
    "CivilizationVI_DX12":          "civ6",
    "CivilizationVI":               "civ6",
    "Wonderlands":                  "tiny-tina",
    "HogwartsLegacy":               "hogwarts",
    "Spider-Man Remastered":        "spiderman",
    "eldenring":                    "eldenring",
    "ForzaHorizon5":                "fh5",
    "ModernWarfareIII":             "mw3",
    "Baldur":                       "bg3",
    "Starfield":                    "starfield",
    "AlanWake2":                    "alanwake2",
    "re4":                          "re4",
    "Diablo IV":                    "diablo4",
    "cs2":                          "cs2",
    "VALORANT-Win64-Shipping":      "val",
    "League of Legends":            "lol",
    "r5apex":                       "apex",
    "Overwatch":                    "owatch2",
    "GodOfWar":                     "gowr",
    "tlou-pc":                      "tlou",
    "DS":                           "deathstranding",
    "MetroExodusEnhancedEdition":   "metro",
    "Requiem":                      "plaguetale",
    "DeadSpace":                    "deadspace",
    "Returnal":                     "returnal",
    "Palworld":                     "palworld",
    "Enshrouded":                   "enshrouded",
    "helldivers2":                  "helldivers2",
    "HadesII":                      "hades2",
}

# PTAT filename prefix → slug (for pairing PTAT with CapFrameX)
PTAT_FILENAME_PREFIX_TO_SLUG: dict[str, str] = {
    "Cyberpunk":    "cb2077",
    "RDR2":         "rdr2",
    "FFIV":         "ffxiv",
    "FFXIV":        "ffxiv",
    "F124":         "f1-24",
    "F1_24":        "f1-24",
    "HZDR":         "hzd",
    "Hitman3":      "hitman3",
    "SOTTR":        "sotr",
    "AssasinCreed": "ac-mirage",
    "BlackMyth":    "wukong",
    "FarCry6":      "far-cry-6",
    "Civ6":         "civ6",
    "TinyTina":     "tiny-tina",
    "HogwartsLegacy": "hogwarts",
    "SpiderMan":    "spiderman",
    "EldenRing":    "eldenring",
    "ForzaH5":      "fh5",
    "MW3":          "mw3",
    "BG3":          "bg3",
    "Starfield":    "starfield",
    "AlanWake2":    "alanwake2",
    "RE4":          "re4",
    "Diablo4":      "diablo4",
    "CS2":          "cs2",
    "PlagueTale":   "plaguetale",
    "DeadSpace":    "deadspace",
    "Returnal":     "returnal",
    "Palworld":     "palworld",
    "Enshrouded":   "enshrouded",
    "Helldivers2":  "helldivers2",
    "Hades2":       "hades2",
    # Automation PTAT filename slugs (ptat_<game-slug>_<ip>_<date>.csv)
    "ptat_assassins-creed-mirage":      "ac-mirage",
    "ptat_black-myth-wukong":           "wukong",
    "ptat_cyberpunk-2077":              "cb2077",
    "ptat_f1-24":                       "f1-24",
    "ptat_far-cry-6":                   "far-cry-6",
    "ptat_final-fantasy-xiv":           "ffxiv",
    "ptat_hitman-3":                    "hitman3",
    "ptat_horizon-zero-dawn":           "hzd",
    "ptat_red-dead-redemption":         "rdr2",
    "ptat_shadow-of-the-tomb-raider":   "sotr",
    "ptat_sid-meiers-civilization":      "civ6",
    "ptat_tiny-tina":                   "tiny-tina",
    "ptat_counter-strike":              "cs2",
}


def capframex_to_slug(game_name: str, process_name: str) -> str | None:
    """Resolve a CapFrameX session to a dashboard game slug."""
    # Try GameName first (most reliable)
    if game_name:
        for key, slug in CAPFRAMEX_GAME_NAME_TO_SLUG.items():
            if key.lower() == game_name.strip().lower():
                return slug
        # Partial match
        gn_lower = game_name.strip().lower()
        for key, slug in CAPFRAMEX_GAME_NAME_TO_SLUG.items():
            if key.lower() in gn_lower or gn_lower in key.lower():
                return slug

    # Fallback: process name
    if process_name:
        proc = process_name.replace(".exe", "").strip()
        for key, slug in CAPFRAMEX_PROCESS_TO_SLUG.items():
            if key.lower() == proc.lower():
                return slug
        for key, slug in CAPFRAMEX_PROCESS_TO_SLUG.items():
            if key.lower() in proc.lower():
                return slug

    return None


def ptat_filename_to_slug(filename: str) -> str | None:
    """Resolve a PTAT CSV filename to a game slug by prefix matching."""
    import re
    # Strip path, keep just the base filename
    base = filename.split("\\")[-1].split("/")[-1]
    for prefix, slug in PTAT_FILENAME_PREFIX_TO_SLUG.items():
        if base.lower().startswith(prefix.lower()):
            return slug
    return None
