// Steam CDN URLs:
// Header: https://steamcdn-a.akamaihd.net/steam/apps/{appid}/header.jpg
// Hero: https://steamcdn-a.akamaihd.net/steam/apps/{appid}/library_hero.jpg

export const games = [
  { 
    id: 1, name: 'Cyberpunk 2077', genre: 'RPG', steamId: 1091500,
    developer: 'CD Projekt Red', releaseDate: 'Dec 10, 2020',
    engine: 'REDengine 4', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Night City Drive - Corpo Plaza to Japantown',
    description: 'An open-world action-adventure RPG set in Night City, a megalopolis obsessed with power, glamour and body modification.',
    faqs: [
      { q: 'What is the Phantom Liberty expansion?', a: 'A spy-thriller expansion featuring Idris Elba as Solomon Reed, adding new district Dogtown.' },
      { q: 'Does it support Ray Tracing Overdrive?', a: 'Yes! Full path tracing with RT Overdrive mode delivers cinema-quality lighting.' },
      { q: 'What is the maximum level cap?', a: 'Level 60 with Phantom Liberty, with a revamped skill tree and cyberware system.' }
    ]
  },
  { 
    id: 2, name: 'Red Dead Redemption 2', genre: 'Action', steamId: 1174180,
    developer: 'Rockstar Games', releaseDate: 'Nov 5, 2019',
    engine: 'RAGE (Rockstar Advanced Game Engine)', graphicsAPI: 'Vulkan / DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Valentine Town - Market Street to Stables',
    description: 'Winner of over 175 Game of the Year Awards, experience the epic tale of Arthur Morgan.',
    faqs: [
      { q: 'How long is the main story?', a: 'Around 50-60 hours for the main story, 150+ hours for 100% completion.' },
      { q: 'Does it support DLSS/FSR?', a: 'Yes, both DLSS and FSR 2.0 are supported with the latest patches.' },
      { q: 'Is Red Dead Online included?', a: 'Yes, Red Dead Online is included with its own progression system.' }
    ]
  },
  { 
    id: 3, name: 'Hogwarts Legacy', genre: 'RPG', steamId: 990080,
    developer: 'Avalanche Software', releaseDate: 'Feb 10, 2023',
    engine: 'Unreal Engine 4', graphicsAPI: 'DirectX 12', benchmarkDuration: '75s',
    benchmarkScene: 'Hogsmeade Village - Main Street Walk',
    description: 'Experience Hogwarts in the 1800s. Your character holds the key to an ancient secret.',
    faqs: [
      { q: 'Can I be sorted into any house?', a: 'Yes! Choose Gryffindor, Slytherin, Ravenclaw, or Hufflepuff.' },
      { q: 'Are there Quidditch matches?', a: 'Quidditch was added in 2024 with full season mode and house cups.' },
      { q: 'How does the morality system work?', a: 'Choices affect relationships and unlock different spells.' }
    ]
  },
  { 
    id: 4, name: 'Spider-Man Remastered', genre: 'Action', steamId: 1817070,
    developer: 'Insomniac Games', releaseDate: 'Aug 12, 2022',
    engine: 'Insomniac Engine 4.0', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Manhattan Swing - Times Square to Central Park',
    description: 'Be Greater. Be Yourself. Experience the rise of Spider-Man in this blockbuster adventure.',
    faqs: [
      { q: 'Does it include all DLC?', a: 'Yes! The City That Never Sleeps DLC trilogy is included.' },
      { q: 'What are the PC exclusive features?', a: 'Ultra-wide support, ray-traced reflections, DLSS/FSR.' },
      { q: 'Can I transfer my PS save?', a: 'No direct transfer, but NG+ is available from the start.' }
    ]
  },
  { 
    id: 5, name: 'Elden Ring', genre: 'RPG', steamId: 1245620,
    developer: 'FromSoftware', releaseDate: 'Feb 25, 2022',
    engine: 'FromSoftware Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '120s',
    benchmarkScene: 'Limgrave - Gatefront Ruins Combat Sequence',
    description: 'Rise, Tarnished, and be guided by grace. The Golden Order has been broken.',
    faqs: [
      { q: 'What is Shadow of the Erdtree?', a: 'The massive 2024 DLC adds Land of Shadow and 10+ new bosses.' },
      { q: 'How hard is the game?', a: 'Challenging but fair. Spirit Ashes and co-op make it accessible.' },
      { q: 'Is the open world truly open?', a: 'Yes! Explore freely from the start with minimal restrictions.' }
    ]
  },
  { 
    id: 6, name: 'Forza Horizon 5', genre: 'Racing', steamId: 1551360,
    developer: 'Playground Games', releaseDate: 'Nov 9, 2021',
    engine: 'ForzaTech Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Mexico Circuit - Jungle to Desert Transition',
    description: 'Your Ultimate Horizon Adventure awaits! Explore Mexico\'s vibrant open world.',
    faqs: [
      { q: 'How many cars are in the game?', a: 'Over 800 cars from 100+ manufacturers, with weekly additions.' },
      { q: 'What is the Festival Playlist?', a: 'Weekly challenges with exclusive rewards and seasonal events.' },
      { q: 'Does it support wheel/pedals?', a: 'Full support for most racing wheels with advanced force feedback.' }
    ]
  },
  { 
    id: 7, name: 'Call of Duty: MW3', genre: 'FPS', steamId: 2519060,
    developer: 'Sledgehammer Games', releaseDate: 'Nov 10, 2023',
    engine: 'IW Engine 9.0', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Multiplayer - Highrise TDM Simulation',
    description: 'Captain Price and Task Force 141 face off against the ultimate threat.',
    faqs: [
      { q: 'Are MW2 weapons usable in MW3?', a: 'Yes! Full weapon carry-over with continued progression.' },
      { q: 'What is the new Zombies mode?', a: 'Open-world extraction-style Zombies with PvE focus.' },
      { q: 'How big are the Warzone updates?', a: 'Integration brings new Urzikstan map with 100+ POIs.' }
    ]
  },
  { 
    id: 8, name: "Baldur's Gate 3", genre: 'RPG', steamId: 1086940,
    developer: 'Larian Studios', releaseDate: 'Aug 3, 2023',
    engine: 'Divinity 4.0 Engine', graphicsAPI: 'Vulkan / DirectX 11', benchmarkDuration: '90s',
    benchmarkScene: 'Act 1 - Emerald Grove Combat Encounter',
    description: 'Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal.',
    faqs: [
      { q: 'How long is a full playthrough?', a: '75-100 hours for one playthrough, with 17 unique endings.' },
      { q: 'Can I play solo?', a: 'Yes! Full solo experience with companion AI, or co-op up to 4 players.' },
      { q: 'What D&D edition is used?', a: 'D&D 5th Edition rules with Larian\'s combat adaptations.' }
    ]
  },
  { 
    id: 9, name: 'Starfield', genre: 'RPG', steamId: 1716740,
    developer: 'Bethesda Game Studios', releaseDate: 'Sep 6, 2023',
    engine: 'Creation Engine 2', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'New Atlantis - Commercial District Exploration',
    description: 'Create any character and explore with unparalleled freedom across 1000+ planets.',
    faqs: [
      { q: 'How many planets are there?', a: 'Over 1000 planets across 100+ star systems.' },
      { q: 'What is Shattered Space?', a: 'First story DLC focusing on House Va\'ruun with 10+ hours.' },
      { q: 'Can I build outposts?', a: 'Yes! Build and manage outposts for resource extraction.' }
    ]
  },
  { 
    id: 10, name: 'Alan Wake 2', genre: 'Horror', steamId: null,
    imageUrl: 'https://cdn1.epicgames.com/offer/c4763f236d08423eb47b4c3008779c84/EGS_AlanWake2_RemedyEntertainment_S2_1200x1600-c7c5fa0278fd5b204b4a77d0c481bce5',
    developer: 'Remedy Entertainment', releaseDate: 'Oct 27, 2023',
    engine: 'Northlight Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Bright Falls - Sheriff Station to Dark Place',
    description: 'A survival horror game featuring two playable protagonists trapped in a nightmare.',
    faqs: [
      { q: 'Do I need to play Alan Wake 1?', a: 'Helpful but not required. The game recaps key events.' },
      { q: 'How does the dual protagonist work?', a: 'Switch freely between Alan and Saga Anderson.' },
      { q: 'Is Control connected?', a: 'Yes! Part of the Remedy Connected Universe.' }
    ]
  },
  { 
    id: 11, name: 'Resident Evil 4', genre: 'Horror', steamId: 2050650,
    developer: 'Capcom', releaseDate: 'Mar 24, 2023',
    engine: 'RE Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Village - Opening Combat Sequence',
    description: 'Survival horror at its finest. Rescue the president\'s daughter from a mysterious cult.',
    faqs: [
      { q: 'Is this a faithful remake?', a: 'Faithful but expanded with new areas and mechanics.' },
      { q: 'What are the VR features?', a: 'Full VR mode included with motion controls.' },
      { q: 'How does Mercenaries work?', a: 'Free arcade mode with unlockable characters.' }
    ]
  },
  { 
    id: 12, name: 'Diablo IV', genre: 'ARPG', steamId: 2344520,
    developer: 'Blizzard Entertainment', releaseDate: 'Oct 17, 2023',
    engine: 'Diablo IV Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Fractured Peaks - Dungeon Crawl',
    description: 'Join the fight for Sanctuary. Endless demons. Endless ways to play.',
    faqs: [
      { q: 'What is the Vessel of Hatred?', a: 'First expansion featuring new Spiritborn class.' },
      { q: 'How does seasonal content work?', a: 'Quarterly seasons with new mechanics and battle passes.' },
      { q: 'Is it always online?', a: 'Yes, constant internet required for both solo and multiplayer.' }
    ]
  },
  { 
    id: 13, name: 'Counter-Strike 2', genre: 'FPS', steamId: 730,
    developer: 'Valve', releaseDate: 'Sep 27, 2023',
    engine: 'Source 2', graphicsAPI: 'Vulkan / DirectX 11', benchmarkDuration: '60s',
    benchmarkScene: 'Dust 2 - Full Match Simulation',
    description: 'The next generation of CS with upgraded graphics and responsive smoke grenades.',
    faqs: [
      { q: 'What are the new smoke mechanics?', a: 'Volumetric smokes react to bullets and explosions.' },
      { q: 'Did my skins transfer?', a: 'Yes! All CS:GO skins transfer to CS2.' },
      { q: 'What happened to classic maps?', a: 'All maps rebuilt in Source 2 with visual upgrades.' }
    ]
  },
  { 
    id: 14, name: 'Valorant', genre: 'FPS', steamId: null,
    imageUrl: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt0ab24b862c6d24ff/65a3e2d9f4e61a0a2a3f16b0/Valorant_2024_E8A2_PlayVALORANT_contentstack.png',
    developer: 'Riot Games', releaseDate: 'Jun 2, 2020',
    engine: 'Unreal Engine 4', graphicsAPI: 'DirectX 11', benchmarkDuration: '60s',
    benchmarkScene: 'Ascent - Competitive Match Simulation',
    description: 'A 5v5 tactical shooter with unique agent abilities and precise gunplay.',
    faqs: [
      { q: 'How many agents are there?', a: '25+ agents across 4 roles: Duelists, Initiators, Controllers, Sentinels.' },
      { q: 'What is the competitive system?', a: 'Ranked from Iron to Radiant with seasonal resets.' },
      { q: 'Is Vanguard anti-cheat required?', a: 'Yes, kernel-level anti-cheat runs at startup.' }
    ]
  },
  { 
    id: 15, name: 'League of Legends', genre: 'MOBA', steamId: null,
    imageUrl: 'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt5b1dc3dc3ca6a2b3/634f94c5c20f5a33082bc8e7/LOL_PROMOART_12.jpg',
    developer: 'Riot Games', releaseDate: 'Oct 27, 2009',
    engine: 'Riot Games Engine', graphicsAPI: 'DirectX 11 / DirectX 9', benchmarkDuration: '120s',
    benchmarkScene: 'Summoner\'s Rift - 5v5 Teamfight',
    description: 'The world\'s most-played MOBA. Choose from 160+ champions in 5v5 battles.',
    faqs: [
      { q: 'How many champions are there?', a: '168 champions as of 2025, with new releases every 2-3 months.' },
      { q: 'What are the different modes?', a: 'Summoner\'s Rift (5v5), ARAM, Arena, and rotating modes.' },
      { q: 'Is it free to play?', a: 'Yes! All champions earnable, only cosmetics are paid.' }
    ]
  },
  { 
    id: 16, name: 'Apex Legends', genre: 'BR', steamId: 1172470,
    developer: 'Respawn Entertainment', releaseDate: 'Feb 4, 2019',
    engine: 'Source Engine (Modified)', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'World\'s Edge - Fragment East Hot Drop',
    description: 'A free-to-play battle royale with legendary characters and innovative combat.',
    faqs: [
      { q: 'How does the Legend system work?', a: '25+ Legends with unique abilities. Pick one per match.' },
      { q: 'What is Ranked Reloaded?', a: 'Complete ranked overhaul with LP system and splits.' },
      { q: 'Are there solo modes?', a: 'Limited time solos rotate. Main modes are trios and duos.' }
    ]
  },
  { 
    id: 17, name: 'Overwatch 2', genre: 'FPS', steamId: null,
    imageUrl: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt8d85eb1f8b7c7031/6571f9a9c1bb0d0a03bf40ba/ow2-share-img.jpg',
    developer: 'Blizzard Entertainment', releaseDate: 'Oct 4, 2022',
    engine: 'Overwatch Engine 2.0', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'King\'s Row - Push Mode Full Match',
    description: 'Team-based hero shooter where legends face off in 5v5 battles.',
    faqs: [
      { q: 'How many heroes are available?', a: '40+ heroes across Tank, Damage, and Support roles.' },
      { q: 'What happened to 6v6?', a: '5v5 is standard. 6v6 returns as limited time arcade mode.' },
      { q: 'Is PvE still coming?', a: 'Story missions available seasonally with Hero Mastery modes.' }
    ]
  },
  { 
    id: 18, name: 'Horizon Forbidden West', genre: 'Action', steamId: 2420110,
    developer: 'Guerrilla Games', releaseDate: 'Mar 21, 2024',
    engine: 'Decima Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'San Francisco Ruins - Machine Combat',
    description: 'Join Aloy as she braves the Forbidden West to find answers and allies.',
    faqs: [
      { q: 'What is Burning Shores?', a: 'DLC expansion in post-apocalyptic LA with flying mounts.' },
      { q: 'Can I import my PS5 save?', a: 'No cross-platform saves, but NG+ available on PC.' },
      { q: 'How does the skill tree work?', a: 'Six skill trees with 200+ abilities.' }
    ]
  },
  { 
    id: 19, name: 'God of War Ragnarok', genre: 'Action', steamId: 2322010,
    developer: 'Santa Monica Studio', releaseDate: 'Sep 19, 2024',
    engine: 'Santa Monica Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Svartalfheim - Boss Battle Sequence',
    description: 'Embark on an epic journey as Kratos and Atreus venture to the Nine Realms.',
    faqs: [
      { q: 'Do I need to play the 2018 game?', a: 'Recommended. Ragnarok is a direct sequel.' },
      { q: 'How long is the game?', a: '25-30 hours main story, 50+ hours for completionist.' },
      { q: 'What is Valhalla mode?', a: 'Free roguelike DLC with Kratos facing his past.' }
    ]
  },
  { 
    id: 20, name: 'The Last of Us Part I', genre: 'Action', steamId: 1888930,
    developer: 'Naughty Dog', releaseDate: 'Mar 28, 2023',
    engine: 'Naughty Dog Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Boston - Capitol Building Infiltration',
    description: 'Experience the emotional journey of Joel and Ellie in this post-apocalyptic tale.',
    faqs: [
      { q: 'What\'s new in the PC version?', a: 'Rebuilt graphics, DualSense features, Left Behind DLC included.' },
      { q: 'How does accessibility work?', a: '60+ accessibility options including full audio descriptions.' },
      { q: 'Is multiplayer included?', a: 'No Factions mode. Standalone multiplayer was cancelled.' }
    ]
  },
  { 
    id: 21, name: 'Hitman 3', genre: 'Stealth', steamId: 1659040,
    developer: 'IO Interactive', releaseDate: 'Jan 20, 2022',
    engine: 'Glacier 2 Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Dubai - Burj Al-Ghazali Infiltration',
    description: 'Agent 47 returns in the dramatic conclusion to the World of Assassination trilogy.',
    faqs: [
      { q: 'Can I import previous game content?', a: 'Yes! Import Hitman 1 & 2 levels and progress.' },
      { q: 'What is Freelancer mode?', a: 'Roguelike mode with persistent safehouse.' },
      { q: 'How many locations are there?', a: '20+ locations total with trilogy import.' }
    ]
  },
  { 
    id: 22, name: 'Death Stranding', genre: 'Action', steamId: 1850570,
    developer: 'Kojima Productions', releaseDate: 'Mar 30, 2022',
    engine: 'Decima Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Central Region - Timefall Delivery',
    description: "Director's Cut of Kojima's masterpiece. Reconnect a fractured society.",
    faqs: [
      { q: "What's new in Director's Cut?", a: 'New missions, items, combat mechanics, race track.' },
      { q: 'How long is the game?', a: 'Main story 40 hours. Standard orders extend to 100+ hours.' },
      { q: 'What is the strand system?', a: 'Asynchronous multiplayer where player structures help others.' }
    ]
  },
  { 
    id: 23, name: 'Metro Exodus', genre: 'FPS', steamId: 412020,
    developer: '4A Games', releaseDate: 'Feb 15, 2019',
    engine: '4A Engine', graphicsAPI: 'DirectX 12 / Vulkan', benchmarkDuration: '60s',
    benchmarkScene: 'Volga - Church Combat Sequence',
    description: 'Flee the shattered ruins of Moscow and embark on an epic journey across Russia.',
    faqs: [
      { q: 'What is the Enhanced Edition?', a: 'Free upgrade with ray tracing, DLSS, and next-gen visuals.' },
      { q: 'Is it open world?', a: 'Semi-open. Large hub areas with story-driven exploration.' },
      { q: 'How does the morality system work?', a: 'Actions determine ending. Stealth/mercy matters.' }
    ]
  },
  { 
    id: 24, name: 'Shadow of the Tomb Raider', genre: 'Action', steamId: 750920,
    developer: 'Eidos-Montréal', releaseDate: 'Sep 14, 2018',
    engine: 'Foundation Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Paititi - Hidden City Exploration',
    description: 'Experience Lara Croft\'s defining moment as she becomes the Tomb Raider.',
    faqs: [
      { q: 'Is DLC included?', a: 'Definitive Edition includes all 7 DLC tombs, outfits, weapons.' },
      { q: 'How does difficulty work?', a: 'Separate sliders for combat, exploration, and puzzles.' },
      { q: 'Are there multiple endings?', a: 'One main ending with optional post-credits.' }
    ]
  },
  { 
    id: 25, name: 'F1 24', genre: 'Racing', steamId: 2488620,
    developer: 'Codemasters', releaseDate: 'May 31, 2024',
    engine: 'Ego Engine 4.0', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Monaco - Full Lap Time Trial',
    description: 'Race alongside current F1 stars or create your legend in the most authentic F1 game.',
    faqs: [
      { q: 'What circuits are included?', a: 'All 24 official 2024 circuits including Las Vegas and Qatar.' },
      { q: 'How does career mode work?', a: 'Driver or My Team career with regulation changes through seasons.' },
      { q: 'Is VR supported?', a: 'Yes! Full VR support on PC with all major headsets.' }
    ]
  },
  { 
    id: 26, name: 'Total War: Warhammer 3', genre: 'Strategy', steamId: 1142710,
    developer: 'Creative Assembly', releaseDate: 'Feb 17, 2022',
    engine: 'TW Engine 3', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '120s',
    benchmarkScene: 'Battle Benchmark - Chaos vs Kislev',
    description: 'Command legendary heroes in the ultimate Warhammer fantasy strategy experience.',
    faqs: [
      { q: 'What is Immortal Empires?', a: 'Combined map with all 3 games. 86 legendary lords.' },
      { q: 'Do I need all three games?', a: 'Only WH3 needed, but owning 1 & 2 unlocks more content.' },
      { q: 'How does DLC work?', a: 'DLC from all games works in Immortal Empires if owned.' }
    ]
  },
  { 
    id: 27, name: 'Age of Empires IV', genre: 'Strategy', steamId: 1466860,
    developer: 'Relic Entertainment', releaseDate: 'Oct 28, 2021',
    engine: 'Essence Engine 5.0', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: '4v4 Skirmish - Large Scale Battle',
    description: 'One of the most beloved RTS games returns with evolved gameplay and historic warfare.',
    faqs: [
      { q: 'How many civilizations?', a: '15 civilizations with unique units, landmarks, playstyles.' },
      { q: 'Is there a campaign?', a: 'Four campaigns with documentary-style history videos.' },
      { q: 'What is the ranked system?', a: 'ELO-based ranked with 1v1, 2v2, and team games.' }
    ]
  },
  { 
    id: 28, name: 'Civilization VI', genre: 'Strategy', steamId: 289070,
    developer: 'Firaxis Games', releaseDate: 'Oct 21, 2016',
    engine: 'Firaxis LORE Engine', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '120s',
    benchmarkScene: 'AI Turn Processing - Industrial Era (8 Players)',
    description: 'Build an empire to stand the test of time in the greatest strategy franchise.',
    faqs: [
      { q: 'What DLC is essential?', a: 'Gathering Storm and Rise & Fall transform the base game.' },
      { q: 'How many leaders are there?', a: '50+ leaders representing 40+ civilizations.' },
      { q: 'Is multiplayer active?', a: 'Yes! Async cloud saves, live games, and crossplay.' }
    ]
  },
  { 
    id: 29, name: 'Flight Simulator 2024', genre: 'Sim', steamId: 2537590,
    developer: 'Asobo Studio', releaseDate: 'Nov 19, 2024',
    engine: 'Asobo Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '120s',
    benchmarkScene: 'New York City - Manhattan Low Altitude Flight',
    description: 'The next generation of flight simulation. Fly anywhere on the planet.',
    faqs: [
      { q: 'What are the career modes?', a: 'Bush pilot, cargo pilot, search & rescue, agricultural, more.' },
      { q: 'How accurate is the world?', a: '3D photogrammetry for major cities, 4 trillion trees.' },
      { q: 'Can I use my MSFS 2020 content?', a: 'Most marketplace add-ons compatible.' }
    ]
  },
  { 
    id: 30, name: 'Avatar: Frontiers', genre: 'Action', steamId: null,
    imageUrl: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/5HQeLMcrQ5hGyXQJwpNKTL/ed8c35dd06e5b61e60df3de03e376df9/AFOP_Keyart_Wide.jpg',
    developer: 'Massive Entertainment', releaseDate: 'Dec 7, 2023',
    engine: 'Snowdrop Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Kinglor Forest - Ikran Flight Sequence',
    description: 'Explore Pandora in this first-person action adventure. Become Na\'vi and save the Western Frontier.',
    faqs: [
      { q: 'Is it open world?', a: 'Yes! Explore the Western Frontier with multiple biomes.' },
      { q: 'Can I fly an Ikran?', a: 'Yes! Bond with an Ikran for aerial exploration.' },
      { q: 'How does the story connect to the movies?', a: 'Set between Avatar 1 and 2 with original story.' }
    ]
  },
  { 
    id: 31, name: 'A Plague Tale: Requiem', genre: 'Adventure', steamId: 1182900,
    developer: 'Asobo Studio', releaseDate: 'Oct 18, 2022',
    engine: 'Asobo Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Chapter 9 - The Swarm Escape',
    description: 'Embark on a heart-wrenching journey as Amicia and Hugo uncover the cost of saving those you love.',
    faqs: [
      { q: 'Do I need to play Innocence first?', a: 'Highly recommended. Direct sequel with returning characters.' },
      { q: 'How many chapters?', a: '17 chapters, approximately 15-20 hours of gameplay.' },
      { q: 'What is the rat limit?', a: '300,000 rats on screen simultaneously.' }
    ]
  },
  { 
    id: 32, name: 'Dead Space', genre: 'Horror', steamId: 1693980,
    developer: 'Motive Studio', releaseDate: 'Jan 27, 2023',
    engine: 'Frostbite Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'USG Ishimura - Medical Deck Horror',
    description: 'A remake of the sci-fi survival horror classic. Isaac Clarke becomes a reluctant hero.',
    faqs: [
      { q: 'Is it a faithful remake?', a: 'Rebuilt from ground up with expanded story and new areas.' },
      { q: 'Can I still remove limbs?', a: 'Yes! Strategic dismemberment is core gameplay.' },
      { q: 'What is the Intensity Director?', a: 'AI system that adjusts scares and enemy spawns.' }
    ]
  },
  { 
    id: 33, name: 'Returnal', genre: 'Roguelike', steamId: 1649240,
    developer: 'Housemarque', releaseDate: 'Feb 15, 2023',
    engine: 'Housemarque Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Overgrown Ruins - Boss Fight Phrike',
    description: 'Break the cycle of chaos on a hostile alien planet. Third-person roguelike with bullet-hell.',
    faqs: [
      { q: 'Is there co-op?', a: 'Yes! Online co-op added post-launch. Drop-in/drop-out.' },
      { q: 'How hard is it?', a: 'Challenging but learnable. Each death makes you stronger.' },
      { q: 'What is the Tower of Sisyphus?', a: 'Endless mode with ascending difficulty and leaderboards.' }
    ]
  },
  { 
    id: 34, name: 'Black Myth: Wukong', genre: 'Action', steamId: 2358720,
    developer: 'Game Science', releaseDate: 'Aug 20, 2024',
    engine: 'Unreal Engine 5', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Black Wind Mountain - Tiger Boss Battle',
    description: 'An action RPG rooted in Chinese mythology. Inspired by Journey to the West.',
    faqs: [
      { q: 'How long is the game?', a: '25-35 hours main story, 50+ hours for true ending.' },
      { q: 'What are the 72 transformations?', a: 'Transform into defeated bosses with unique movesets.' },
      { q: 'Is there New Game+?', a: 'Yes! NG+ with higher difficulty and carried-over gear.' }
    ]
  },
  { 
    id: 35, name: 'Palworld', genre: 'Survival', steamId: 1623730,
    developer: 'Pocketpair', releaseDate: 'Jan 19, 2024',
    engine: 'Unreal Engine 5', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Windswept Hills - Base Building & Combat',
    description: 'Catch, raise, and fight Pals in this creature-collection survival game.',
    faqs: [
      { q: 'How does Pal catching work?', a: 'Weaken Pals then throw Pal Spheres. Rarer need better spheres.' },
      { q: 'Is there multiplayer?', a: 'Up to 32 players on dedicated servers or 4 in co-op.' },
      { q: 'What is the Sakurajima update?', a: 'New island, raid battles, and Pals. Free content.' }
    ]
  },
  { 
    id: 36, name: 'Enshrouded', genre: 'Survival', steamId: 1203620,
    developer: 'Keen Games', releaseDate: 'Jan 24, 2024',
    engine: 'Keen Engine', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Revelwood - Shroud Exploration',
    description: 'A survival action RPG. As a Flameborn, explore the voxel-based continent of Embervale.',
    faqs: [
      { q: 'What is the Shroud?', a: 'Corrupted mist that consumes the world. Enter with time limits.' },
      { q: 'Is it like Valheim?', a: 'Similar vibes but more RPG. Class system, skill trees, dungeons.' },
      { q: 'How many players in co-op?', a: 'Up to 16 players on dedicated servers.' }
    ]
  },
  { 
    id: 37, name: 'Helldivers 2', genre: 'TPS', steamId: 553850,
    developer: 'Arrowhead Game Studios', releaseDate: 'Feb 8, 2024',
    engine: 'Arrowhead Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Malevelon Creek - Difficulty 7 Extraction',
    description: 'Spread managed democracy across the galaxy. Co-op shooter with friendly fire.',
    faqs: [
      { q: 'How does galactic war work?', a: 'Server-wide campaigns where all players contribute.' },
      { q: 'Is friendly fire always on?', a: 'Yes! Coordinate stratagems carefully or vaporize your team.' },
      { q: 'What are Super Earth credits?', a: 'Currency for Warbonds and cosmetics. Earnable in-game.' }
    ]
  },
  { 
    id: 38, name: 'Hades II', genre: 'Roguelike', steamId: 1145350,
    developer: 'Supergiant Games', releaseDate: 'May 6, 2024',
    engine: 'Supergiant Engine', graphicsAPI: 'DirectX 11 / Vulkan', benchmarkDuration: '60s',
    benchmarkScene: 'Erebus - Full Run to Surface',
    description: 'Battle out of the Underworld in this early access sequel. Play as Melinoë.',
    faqs: [
      { q: 'How is it different from Hades 1?', a: 'New protagonist, surface world, crafting, deeper builds.' },
      { q: 'When is 1.0 release?', a: 'Planned for 2025 with additional story and weapons.' },
      { q: 'Can I romance characters?', a: 'Yes! Relationship system returns with new characters.' }
    ]
  }
];

// Helper to get game image URL
// Using Steam's Cloudflare CDN which is more reliable
export const getGameImageUrl = (game, type = 'header') => {
  // For non-Steam games, always use imageUrl (works for both header and hero)
  if (!game.steamId) {
    return game.imageUrl || null;
  }
  
  const steamId = game.steamId;
  switch (type) {
    case 'header': 
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/header.jpg`;
    case 'capsule': 
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/capsule_231x87.jpg`;
    case 'capsule_lg': 
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/capsule_616x353.jpg`;
    case 'library': 
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/library_600x900.jpg`;
    case 'hero': 
      // Use the large capsule as hero - more reliable than library_hero
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/capsule_616x353.jpg`;
    default: 
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/header.jpg`;
  }
};

export const getSteamImageUrl = (steamId, type = 'header') => {
  if (!steamId) return null;
  switch (type) {
    case 'header': 
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/header.jpg`;
    case 'hero': 
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/capsule_616x353.jpg`;
    default: 
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/header.jpg`;
  }
};

export const formatPlayerCount = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
};
