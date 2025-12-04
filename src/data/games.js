// Steam CDN URLs:
// Header: https://steamcdn-a.akamaihd.net/steam/apps/{appid}/header.jpg
// Hero: https://steamcdn-a.akamaihd.net/steam/apps/{appid}/library_hero.jpg

export const games = [
  {
    id: 1, slug: 'cb2077', name: 'Cyberpunk 2077', genre: 'RPG', steamId: 1091500,
    developer: 'CD Projekt Red', releaseDate: 'Dec 10, 2020',
    engine: 'REDengine 4', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Night City Drive - Corpo Plaza to Japantown',
    description: 'An open-world action-adventure RPG set in Night City, a megalopolis obsessed with power, glamour and body modification.',
    funFacts: [
      "Night City was designed by real urban planners to ensure a realistic, functional city layout.",
      "The game features over 70 hours of main story content and hundreds of side quests.",
      "Keanu Reeves spent 15 days recording his lines for Johnny Silverhand."
    ]
  },
  {
    id: 2, slug: 'rdr2', name: 'Red Dead Redemption 2', genre: 'Action', steamId: 1174180,
    developer: 'Rockstar Games', releaseDate: 'Nov 5, 2019',
    engine: 'RAGE (Rockstar Advanced Game Engine)', graphicsAPI: 'Vulkan / DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Valentine Town - Market Street to Stables',
    description: 'Winner of over 175 Game of the Year Awards, experience the epic tale of Arthur Morgan.',
    funFacts: [
      "The game's script was over 2,000 pages long, making it one of the largest scripts in entertainment history.",
      "There are over 200 species of animals in the game, each with unique behaviors.",
      "Arthur's hair and beard grow in real-time and must be cut or styled."
    ]
  },
  {
    id: 3, slug: 'hogwarts', name: 'Hogwarts Legacy', genre: 'RPG', steamId: 990080,
    developer: 'Avalanche Software', releaseDate: 'Feb 10, 2023',
    engine: 'Unreal Engine 4', graphicsAPI: 'DirectX 12', benchmarkDuration: '75s',
    benchmarkScene: 'Hogsmeade Village - Main Street Walk',
    description: 'Experience Hogwarts in the 1800s. Your character holds the key to an ancient secret.',
    funFacts: [
      "The castle features over 100 distinct staircases, many of which move or change direction.",
      "Developers hid a tribute to Robbie Coltrane (Hagrid) near the hut on the grounds.",
      "The Revelio spell was cast over 100 billion times by players in the first month."
    ]
  },
  {
    id: 4, slug: 'spiderman', name: 'Spider-Man Remastered', genre: 'Action', steamId: 1817070,
    developer: 'Insomniac Games', releaseDate: 'Aug 12, 2022',
    engine: 'Insomniac Engine 4.0', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Manhattan Swing - Times Square to Central Park',
    description: 'Be Greater. Be Yourself. Experience the rise of Spider-Man in this blockbuster adventure.',
    funFacts: [
      "The map of Manhattan is approximately 800 square blocks, recreated with stunning accuracy.",
      "Insomniac scanned real New Yorkers to create the diverse crowd NPCs.",
      "There are over 28 unlockable suits, including ones from the MCU and classic comics."
    ]
  },
  {
    id: 5, slug: 'eldenring', name: 'Elden Ring', genre: 'RPG', steamId: 1245620,
    developer: 'FromSoftware', releaseDate: 'Feb 25, 2022',
    engine: 'FromSoftware Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '120s',
    benchmarkScene: 'Limgrave - Gatefront Ruins Combat Sequence',
    description: 'Rise, Tarnished, and be guided by grace. The Golden Order has been broken.',
    funFacts: [
      "George R.R. Martin wrote the lore and history of the world, but not the actual in-game dialogue.",
      "The map is roughly 79 square kilometers, packed with hidden dungeons and secrets.",
      "Malenia, Blade of Miquella, is widely considered the hardest boss in FromSoftware history."
    ]
  },
  {
    id: 6, slug: 'fh5', name: 'Forza Horizon 5', genre: 'Racing', steamId: 1551360,
    developer: 'Playground Games', releaseDate: 'Nov 9, 2021',
    engine: 'ForzaTech Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Mexico Circuit - Jungle to Desert Transition',
    description: 'Your Ultimate Horizon Adventure awaits! Explore Mexico\'s vibrant open world.',
    funFacts: [
      "The audio team recorded over 320 cars using 8 microphones on each vehicle.",
      "The skybox was captured using 12K HDR cameras over 24-hour cycles in Mexico.",
      "It features the largest map in the series, 50% larger than Forza Horizon 4."
    ]
  },
  {
    id: 7, slug: 'mw3', name: 'Call of Duty: MW3', genre: 'FPS', steamId: 2519060,
    developer: 'Sledgehammer Games', releaseDate: 'Nov 10, 2023',
    engine: 'IW Engine 9.0', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Multiplayer - Highrise TDM Simulation',
    description: 'Captain Price and Task Force 141 face off against the ultimate threat.',
    funFacts: [
      "Features the return of the classic 'red dot' minimap behavior requested by fans.",
      "The campaign introduces 'Open Combat Missions' allowing for player choice in approach.",
      "Includes all 16 launch maps from the original Modern Warfare 2 (2009), remastered."
    ]
  },
  {
    id: 8, slug: 'bg3', name: "Baldur's Gate 3", genre: 'RPG', steamId: 1086940,
    developer: 'Larian Studios', releaseDate: 'Aug 3, 2023',
    engine: 'Divinity 4.0 Engine', graphicsAPI: 'Vulkan / DirectX 11', benchmarkDuration: '90s',
    benchmarkScene: 'Act 1 - Emerald Grove Combat Encounter',
    description: 'Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal.',
    funFacts: [
      "The script contains over 2 million words, more than all three Lord of the Rings books combined.",
      "There are 17,000 endings variations based on your choices throughout the game.",
      "The game won Game of the Year at The Game Awards, Golden Joysticks, and DICE Awards."
    ]
  },
  {
    id: 9, slug: 'starfield', name: 'Starfield', genre: 'RPG', steamId: 1716740,
    developer: 'Bethesda Game Studios', releaseDate: 'Sep 6, 2023',
    engine: 'Creation Engine 2', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'New Atlantis - Commercial District Exploration',
    description: 'Create any character and explore with unparalleled freedom across 1000+ planets.',
    funFacts: [
      "NASA was consulted during development to ensure the 'NASA-punk' aesthetic was grounded.",
      "The game features over 250,000 lines of dialogue, the most in any Bethesda game.",
      "Sandwich physics became a viral sensation before launch due to a developer deep dive."
    ]
  },
  {
    id: 10, slug: 'alanwake2', name: 'Alan Wake 2', genre: 'Horror', steamId: null,
    imageUrl: 'https://cdn1.epicgames.com/offer/c4763f236d08423eb47b4c3008779c84/EGS_AlanWake2_RemedyEntertainment_S2_1200x1600-c7c5fa0278fd5b204b4a77d0c481bce5',
    developer: 'Remedy Entertainment', releaseDate: 'Oct 27, 2023',
    engine: 'Northlight Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Bright Falls - Sheriff Station to Dark Place',
    description: 'A survival horror game featuring two playable protagonists trapped in a nightmare.',
    funFacts: [
      "The game features live-action sequences seamlessly blended with gameplay.",
      "The 'Herald of Darkness' musical sequence was performed by the real band Poets of the Fall.",
      "It took 13 years for Remedy to finally realize their vision for this sequel."
    ]
  },
  {
    id: 11, slug: 're4', name: 'Resident Evil 4', genre: 'Horror', steamId: 2050650,
    developer: 'Capcom', releaseDate: 'Mar 24, 2023',
    engine: 'RE Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Village - Opening Combat Sequence',
    description: 'Survival horror at its finest. Rescue the president\'s daughter from a mysterious cult.',
    funFacts: [
      "The famous village opening fight can be skipped by shooting the church bell from a distance.",
      "The developers analyzed the original game frame-by-frame to capture its essence.",
      "The knife parry mechanic was added to give players a fighting chance against chainsaws."
    ]
  },
  {
    id: 12, slug: 'diablo4', name: 'Diablo IV', genre: 'ARPG', steamId: 2344520,
    developer: 'Blizzard Entertainment', releaseDate: 'Oct 17, 2023',
    engine: 'Diablo IV Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Fractured Peaks - Dungeon Crawl',
    description: 'Join the fight for Sanctuary. Endless demons. Endless ways to play.',
    funFacts: [
      "The map of Sanctuary is a contiguous open world for the first time in the series.",
      "Lilith's design was inspired by the 'Dark Lily' from the 1985 film Legend.",
      "The game features over 120 dungeons, each procedurally generated for replayability."
    ]
  },
  {
    id: 13, slug: 'cs2', name: 'Counter-Strike 2', genre: 'FPS', steamId: 730,
    developer: 'Valve', releaseDate: 'Sep 27, 2023',
    engine: 'Source 2', graphicsAPI: 'Vulkan / DirectX 11', benchmarkDuration: '60s',
    benchmarkScene: 'Dust 2 - Full Match Simulation',
    description: 'The next generation of CS with upgraded graphics and responsive smoke grenades.',
    funFacts: [
      "Smoke grenades are now volumetric objects that interact with the environment and lighting.",
      "The sub-tick update architecture ensures that moving and shooting are equally responsive regardless of tick rate.",
      "All classic maps have been rebuilt or upgraded with Source 2 lighting and materials."
    ]
  },
  {
    id: 14, slug: 'val', name: 'Valorant', genre: 'FPS', steamId: null,
    imageUrl: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt0ab24b862c6d24ff/65a3e2d9f4e61a0a2a3f16b0/Valorant_2024_E8A2_PlayVALORANT_contentstack.png',
    developer: 'Riot Games', releaseDate: 'Jun 2, 2020',
    engine: 'Unreal Engine 4', graphicsAPI: 'DirectX 11', benchmarkDuration: '60s',
    benchmarkScene: 'Ascent - Competitive Match Simulation',
    description: 'A 5v5 tactical shooter with unique agent abilities and precise gunplay.',
    funFacts: [
      "Valorant was originally codenamed 'Project A' during its development.",
      "The game uses a unique 'Fog of War' system to prevent wallhacks by not rendering enemies until they are in line of sight.",
      "Each agent's abilities are designed to create tactical opportunities rather than just deal damage."
    ]
  },
  {
    id: 15, slug: 'lol', name: 'League of Legends', genre: 'MOBA', steamId: null,
    imageUrl: 'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt5b1dc3dc3ca6a2b3/634f94c5c20f5a33082bc8e7/LOL_PROMOART_12.jpg',
    developer: 'Riot Games', releaseDate: 'Oct 27, 2009',
    engine: 'Riot Games Engine', graphicsAPI: 'DirectX 11 / DirectX 9', benchmarkDuration: '120s',
    benchmarkScene: 'Summoner\'s Rift - 5v5 Teamfight',
    description: 'The world\'s most-played MOBA. Choose from 160+ champions in 5v5 battles.',
    funFacts: [
      "Teemo is the most played champion but also the most hated, dying 6.5 million times a day.",
      "The game started with only 40 champions in 2009 and now has over 160.",
      "The World Championship trophy, the Summoner's Cup, weighs over 44 pounds."
    ]
  },
  {
    id: 16, slug: 'apex', name: 'Apex Legends', genre: 'BR', steamId: 1172470,
    developer: 'Respawn Entertainment', releaseDate: 'Feb 4, 2019',
    engine: 'Source Engine (Modified)', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'World\'s Edge - Fragment East Hot Drop',
    description: 'A free-to-play battle royale with legendary characters and innovative combat.',
    funFacts: [
      "The game is set in the Titanfall universe, 30 years after the events of Titanfall 2.",
      "The 'ping' system was revolutionary and patented by Respawn Entertainment.",
      "Octane was inspired by a real player who used grenades to boost himself in Titanfall 2."
    ]
  },
  {
    id: 17, slug: 'owatch2', name: 'Overwatch 2', genre: 'FPS', steamId: null,
    imageUrl: 'https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt8d85eb1f8b7c7031/6571f9a9c1bb0d0a03bf40ba/ow2-share-img.jpg',
    developer: 'Blizzard Entertainment', releaseDate: 'Oct 4, 2022',
    engine: 'Overwatch Engine 2.0', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'King\'s Row - Push Mode Full Match',
    description: 'Team-based hero shooter where legends face off in 5v5 battles.',
    funFacts: [
      "Tracer was the first hero created and was used to test the game's core mechanics.",
      "The maps are filled with references to Blizzard's other games like WoW and Diablo.",
      "Junker Queen's magnetic axe was prototyped using a gravity gun mechanic."
    ]
  },
  {
    id: 18, slug: 'hzd', name: 'Horizon Forbidden West', genre: 'Action', steamId: 2420110,
    developer: 'Guerrilla Games', releaseDate: 'Mar 21, 2024',
    engine: 'Decima Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'San Francisco Ruins - Machine Combat',
    description: 'Join Aloy as she braves the Forbidden West to find answers and allies.',
    funFacts: [
      "The underwater exploration required a completely new water rendering system.",
      "Aloy's hair is made of over 100,000 individual polygons for realistic movement.",
      "The game features real-world landmarks like the Golden Gate Bridge and Transamerica Pyramid."
    ]
  },
  {
    id: 19, slug: 'gowr', name: 'God of War Ragnarok', genre: 'Action', steamId: 2322010,
    developer: 'Santa Monica Studio', releaseDate: 'Sep 19, 2024',
    engine: 'Santa Monica Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Svartalfheim - Boss Battle Sequence',
    description: 'Embark on an epic journey as Kratos and Atreus venture to the Nine Realms.',
    funFacts: [
      "Christopher Judge (Kratos) holds the world record for the longest acceptance speech at The Game Awards.",
      "The game was originally planned as two separate games but was condensed into one epic finale.",
      "Kratos's axe, Leviathan, was designed to feel as satisfying as Thor's Mjolnir."
    ]
  },
  {
    id: 20, slug: 'tlou', name: 'The Last of Us Part I', genre: 'Action', steamId: 1888930,
    developer: 'Naughty Dog', releaseDate: 'Mar 28, 2023',
    engine: 'Naughty Dog Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Boston - Capitol Building Infiltration',
    description: 'Experience the emotional journey of Joel and Ellie in this post-apocalyptic tale.',
    funFacts: [
      "The giraffe scene is often cited as one of the most emotional moments in gaming history.",
      "The Cordyceps fungus is based on a real-world fungus that affects insects.",
      "Gustavo Santaolalla composed the iconic score using a ronroco, a vintage string instrument."
    ]
  },
  {
    id: 21, slug: 'hitman3', name: 'Hitman 3', genre: 'Stealth', steamId: 1659040,
    developer: 'IO Interactive', releaseDate: 'Jan 20, 2022',
    engine: 'Glacier 2 Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Dubai - Burj Al-Ghazali Infiltration',
    description: 'Agent 47 returns in the dramatic conclusion to the World of Assassination trilogy.',
    funFacts: [
      "The Dubai level features the tallest building in the world, the Burj Khalifa (renamed).",
      "You can complete the entire game without firing a single bullet.",
      "The 'Dartmoor' level is a tribute to the movie Knives Out, featuring a murder mystery."
    ]
  },
  {
    id: 22, slug: 'deathstranding', name: 'Death Stranding', genre: 'Action', steamId: 1850570,
    developer: 'Kojima Productions', releaseDate: 'Mar 30, 2022',
    engine: 'Decima Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Central Region - Timefall Delivery',
    description: "Director's Cut of Kojima's masterpiece. Reconnect a fractured society.",
    funFacts: [
      "Hideo Kojima created the 'Strand' genre to encourage positive connection between players.",
      "Norman Reedus (Sam) and Mads Mikkelsen provided full motion capture for their roles.",
      "The game features a 'Very Easy' mode designed for movie fans who don't play games."
    ]
  },
  {
    id: 23, slug: 'metro', name: 'Metro Exodus', genre: 'FPS', steamId: 412020,
    developer: '4A Games', releaseDate: 'Feb 15, 2019',
    engine: '4A Engine', graphicsAPI: 'DirectX 12 / Vulkan', benchmarkDuration: '60s',
    benchmarkScene: 'Volga - Church Combat Sequence',
    description: 'Flee the shattered ruins of Moscow and embark on an epic journey across Russia.',
    funFacts: [
      "The game spans an entire year, showing the changing seasons across post-apocalyptic Russia.",
      "The Aurora train serves as your mobile base and changes as you recruit more crew.",
      "It was the first major game to utilize Ray Traced Global Illumination fully."
    ]
  },
  {
    id: 24, slug: 'sotr', name: 'Shadow of the Tomb Raider', genre: 'Action', steamId: 750920,
    developer: 'Eidos-Montréal', releaseDate: 'Sep 14, 2018',
    engine: 'Foundation Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Paititi - Hidden City Exploration',
    description: 'Experience Lara Croft\'s defining moment as she becomes the Tomb Raider.',
    funFacts: [
      "Camilla Luddington performed the voice and motion capture for Lara Croft.",
      "The game features the largest hub area in the franchise, the hidden city of Paititi.",
      "Difficulty settings can be adjusted independently for combat, puzzles, and exploration."
    ]
  },
  {
    id: 25, slug: 'f1-24', name: 'F1 24', genre: 'Racing', steamId: 2488620,
    developer: 'Codemasters', releaseDate: 'May 31, 2024',
    engine: 'Ego Engine 4.0', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Monaco - Full Lap Time Trial',
    description: 'Race alongside current F1 stars or create your legend in the most authentic F1 game.',
    funFacts: [
      "Features 'Dynamic Handling' developed with input from Max Verstappen.",
      "The tracks are laser-scanned to millimeter precision for ultimate realism.",
      "Career mode allows you to play as a real F1 driver for the first time."
    ]
  },
  {
    id: 26, slug: 'tww3', name: 'Total War: Warhammer 3', genre: 'Strategy', steamId: 1142710,
    developer: 'Creative Assembly', releaseDate: 'Feb 17, 2022',
    engine: 'TW Engine 3', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '120s',
    benchmarkScene: 'Battle Benchmark - Chaos vs Kislev',
    description: 'Command legendary heroes in the ultimate Warhammer fantasy strategy experience.',
    funFacts: [
      "The map is twice the size of the previous game's campaign map.",
      "It features the Chaos Realms, where the laws of physics and magic are twisted.",
      "The 'Immortal Empires' campaign combines maps from all three games into one massive world."
    ]
  },
  {
    id: 27, slug: 'aoe4', name: 'Age of Empires IV', genre: 'Strategy', steamId: 1466860,
    developer: 'Relic Entertainment', releaseDate: 'Oct 28, 2021',
    engine: 'Essence Engine 5.0', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: '4v4 Skirmish - Large Scale Battle',
    description: 'One of the most beloved RTS games returns with evolved gameplay and historic warfare.',
    funFacts: [
      "The campaigns feature documentary-style videos filmed at real historical locations.",
      "The sound design includes period-accurate languages that evolve as you advance ages.",
      "Trebuchets were recorded firing real projectiles to capture the authentic sound."
    ]
  },
  {
    id: 28, slug: 'civ6', name: 'Civilization VI', genre: 'Strategy', steamId: 289070,
    developer: 'Firaxis Games', releaseDate: 'Oct 21, 2016',
    engine: 'Firaxis LORE Engine', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '120s',
    benchmarkScene: 'AI Turn Processing - Industrial Era (8 Players)',
    description: 'Build an empire to stand the test of time in the greatest strategy franchise.',
    funFacts: [
      "Sean Bean narrates the tech tree quotes and game introduction.",
      "The unstacking of cities (Districts) was the biggest gameplay change in the series' history.",
      "Gandhi's tendency to use nukes is a tribute to a famous bug in the original Civilization."
    ]
  },
  {
    id: 29, slug: 'msfs2024', name: 'Flight Simulator 2024', genre: 'Sim', steamId: 2537590,
    developer: 'Asobo Studio', releaseDate: 'Nov 19, 2024',
    engine: 'Asobo Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '120s',
    benchmarkScene: 'New York City - Manhattan Low Altitude Flight',
    description: 'The next generation of flight simulation. Fly anywhere on the planet.',
    funFacts: [
      "It streams over 2 petabytes of world data from the cloud to your PC.",
      "Includes a digital twin of Earth with 37,000 airports and 1.5 billion buildings.",
      "You can exit the plane and walk around the world in first-person mode."
    ]
  },
  {
    id: 30, slug: 'avatar', name: 'Avatar: Frontiers', genre: 'Action', steamId: null,
    imageUrl: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/5HQeLMcrQ5hGyXQJwpNKTL/ed8c35dd06e5b61e60df3de03e376df9/AFOP_Keyart_Wide.jpg',
    developer: 'Massive Entertainment', releaseDate: 'Dec 7, 2023',
    engine: 'Snowdrop Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Kinglor Forest - Ikran Flight Sequence',
    description: 'Explore Pandora in this first-person action adventure. Become Na\'vi and save the Western Frontier.',
    funFacts: [
      "The game was developed in collaboration with James Cameron's Lightstorm Entertainment.",
      "The Snowdrop engine handles thousands of interactive plants that react to your presence.",
      "You can bond with and name your own Ikran (banshee) for flight."
    ]
  },
  {
    id: 31, slug: 'plaguetale', name: 'A Plague Tale: Requiem', genre: 'Adventure', steamId: 1182900,
    developer: 'Asobo Studio', releaseDate: 'Oct 18, 2022',
    engine: 'Asobo Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'Chapter 9 - The Swarm Escape',
    description: 'Embark on a heart-wrenching journey as Amicia and Hugo uncover the cost of saving those you love.',
    funFacts: [
      "The game can render up to 300,000 rats on screen at once, creating fluid 'rat waves'.",
      "The soundtrack features medieval instruments like the viola da gamba and nyckelharpa.",
      "Amicia's sling mechanics were refined based on feedback from real sling experts."
    ]
  },
  {
    id: 32, slug: 'deadspace', name: 'Dead Space', genre: 'Horror', steamId: 1693980,
    developer: 'Motive Studio', releaseDate: 'Jan 27, 2023',
    engine: 'Frostbite Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '60s',
    benchmarkScene: 'USG Ishimura - Medical Deck Horror',
    description: 'A remake of the sci-fi survival horror classic. Isaac Clarke becomes a reluctant hero.',
    funFacts: [
      "The 'Peeling System' allows players to blast off layers of flesh and bone from enemies.",
      "There are no camera cuts or loading screens in the entire game (unless you die).",
      "Isaac Clarke speaks in the remake, unlike the silent protagonist of the original."
    ]
  },
  {
    id: 33, slug: 'returnal', name: 'Returnal', genre: 'Roguelike', steamId: 1649240,
    developer: 'Housemarque', releaseDate: 'Feb 15, 2023',
    engine: 'Housemarque Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Overgrown Ruins - Boss Fight Phrike',
    description: 'Break the cycle of chaos on a hostile alien planet. Third-person roguelike with bullet-hell.',
    funFacts: [
      "The game uses 3D audio to let you hear enemies behind you or above you.",
      "The haptic feedback mimics the feeling of raindrops falling on your suit.",
      "The story is inspired by psychological horror and Greek mythology."
    ]
  },
  {
    id: 34, slug: 'wukong', name: 'Black Myth: Wukong', genre: 'Action', steamId: 2358720,
    developer: 'Game Science', releaseDate: 'Aug 20, 2024',
    engine: 'Unreal Engine 5', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Black Wind Mountain - Tiger Boss Battle',
    description: 'An action RPG rooted in Chinese mythology. Inspired by Journey to the West.',
    funFacts: [
      "The game is based on the 16th-century Chinese novel 'Journey to the West'.",
      "It became the most-played single-player game on Steam within hours of launch.",
      "Many locations in the game are 1:1 scans of real historical temples in China."
    ]
  },
  {
    id: 35, slug: 'palworld', name: 'Palworld', genre: 'Survival', steamId: 1623730,
    developer: 'Pocketpair', releaseDate: 'Jan 19, 2024',
    engine: 'Unreal Engine 5', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Windswept Hills - Base Building & Combat',
    description: 'Catch, raise, and fight Pals in this creature-collection survival game.',
    funFacts: [
      "Sold over 8 million copies in its first 6 days of Early Access.",
      "Pals can be put to work in factories to craft weapons and items for you.",
      "The game combines creature collecting with survival mechanics and third-person shooting."
    ]
  },
  {
    id: 36, slug: 'enshrouded', name: 'Enshrouded', genre: 'Survival', steamId: 1203620,
    developer: 'Keen Games', releaseDate: 'Jan 24, 2024',
    engine: 'Keen Engine', graphicsAPI: 'DirectX 11 / DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Revelwood - Shroud Exploration',
    description: 'A survival action RPG. As a Flameborn, explore the voxel-based continent of Embervale.',
    funFacts: [
      "The entire world is voxel-based, allowing you to dig tunnels or reshape terrain anywhere.",
      "You can build a base inside a mountain or floating in the sky.",
      "The 'Shroud' is a dangerous fog that mutates creatures and limits your exploration time."
    ]
  },
  {
    id: 37, slug: 'helldivers2', name: 'Helldivers 2', genre: 'TPS', steamId: 553850,
    developer: 'Arrowhead Game Studios', releaseDate: 'Feb 8, 2024',
    engine: 'Arrowhead Engine', graphicsAPI: 'DirectX 12', benchmarkDuration: '90s',
    benchmarkScene: 'Malevelon Creek - Difficulty 7 Extraction',
    description: 'Spread managed democracy across the galaxy. Co-op shooter with friendly fire.',
    funFacts: [
      "The 'Game Master' (Joel) manually influences the galactic war in real-time.",
      "Friendly fire is always on to encourage tactical play and chaotic moments.",
      "The cape physics are simulated to flutter realistically in the wind and explosions."
    ]
  },
  {
    id: 38, slug: 'hades2', name: 'Hades II', genre: 'Roguelike', steamId: 1145350,
    developer: 'Supergiant Games', releaseDate: 'May 6, 2024',
    engine: 'Supergiant Engine', graphicsAPI: 'DirectX 11 / Vulkan', benchmarkDuration: '60s',
    benchmarkScene: 'Erebus - Full Run to Surface',
    description: 'Battle out of the Underworld in this early access sequel. Play as Melinoë.',
    funFacts: [
      "Melinoë is a real figure from Greek mythology, known as a bringer of nightmares.",
      "The game introduces a witchcraft system, allowing you to craft spells and potions.",
      "It is the first direct sequel Supergiant Games has ever made."
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
      // Use library_hero for better resolution (1920x620 usually)
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/library_hero.jpg`;
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
