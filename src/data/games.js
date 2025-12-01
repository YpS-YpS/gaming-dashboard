// Steam CDN URLs:
// Header (460x215): https://steamcdn-a.akamaihd.net/steam/apps/{appid}/header.jpg
// Capsule (231x87): https://steamcdn-a.akamaihd.net/steam/apps/{appid}/capsule_231x87.jpg
// Library (600x900): https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/library_600x900.jpg

export const games = [
  { id: 1, name: 'Cyberpunk 2077', genre: 'RPG', steamId: 1091500 },
  { id: 2, name: 'Red Dead Redemption 2', genre: 'Action', steamId: 1174180 },
  { id: 3, name: 'Hogwarts Legacy', genre: 'RPG', steamId: 990080 },
  { id: 4, name: 'Spider-Man Remastered', genre: 'Action', steamId: 1817070 },
  { id: 5, name: 'Elden Ring', genre: 'RPG', steamId: 1245620 },
  { id: 6, name: 'Forza Horizon 5', genre: 'Racing', steamId: 1551360 },
  { id: 7, name: 'Call of Duty: MW3', genre: 'FPS', steamId: 2519060 },
  { id: 8, name: "Baldur's Gate 3", genre: 'RPG', steamId: 1086940 },
  { id: 9, name: 'Starfield', genre: 'RPG', steamId: 1716740 },
  { id: 10, name: 'Alan Wake 2', genre: 'Horror', steamId: null, fallback: '🔦' }, // Epic exclusive
  { id: 11, name: 'Resident Evil 4', genre: 'Horror', steamId: 2050650 },
  { id: 12, name: 'Diablo IV', genre: 'ARPG', steamId: 2344520 },
  { id: 13, name: 'Counter-Strike 2', genre: 'FPS', steamId: 730 },
  { id: 14, name: 'Valorant', genre: 'FPS', steamId: null, fallback: '🎮' }, // Riot exclusive
  { id: 15, name: 'League of Legends', genre: 'MOBA', steamId: null, fallback: '⚡' }, // Riot exclusive
  { id: 16, name: 'Apex Legends', genre: 'BR', steamId: 1172470 },
  { id: 17, name: 'Overwatch 2', genre: 'FPS', steamId: null, fallback: '🦸' }, // Battle.net exclusive
  { id: 18, name: 'Horizon Forbidden West', genre: 'Action', steamId: 2420110 },
  { id: 19, name: 'God of War Ragnarok', genre: 'Action', steamId: 2322010 },
  { id: 20, name: 'The Last of Us Part I', genre: 'Action', steamId: 1888930 },
  { id: 21, name: 'Hitman 3', genre: 'Stealth', steamId: 1659040 },
  { id: 22, name: 'Death Stranding', genre: 'Action', steamId: 1850570 }, // Director's Cut
  { id: 23, name: 'Metro Exodus', genre: 'FPS', steamId: 412020 },
  { id: 24, name: 'Shadow of the Tomb Raider', genre: 'Action', steamId: 750920 },
  { id: 25, name: 'F1 24', genre: 'Racing', steamId: 2488620 },
  { id: 26, name: 'Total War: Warhammer 3', genre: 'Strategy', steamId: 1142710 },
  { id: 27, name: 'Age of Empires IV', genre: 'Strategy', steamId: 1466860 },
  { id: 28, name: 'Civilization VI', genre: 'Strategy', steamId: 289070 },
  { id: 29, name: 'Flight Simulator 2024', genre: 'Sim', steamId: 2537590 },
  { id: 30, name: 'Avatar: Frontiers', genre: 'Action', steamId: null, fallback: '🌿' }, // Ubisoft exclusive
  { id: 31, name: 'A Plague Tale: Requiem', genre: 'Adventure', steamId: 1182900 },
  { id: 32, name: 'Dead Space', genre: 'Horror', steamId: 1693980 },
  { id: 33, name: 'Returnal', genre: 'Roguelike', steamId: 1649240 },
  { id: 34, name: 'Black Myth: Wukong', genre: 'Action', steamId: 2358720 },
  { id: 35, name: 'Palworld', genre: 'Survival', steamId: 1623730 },
  { id: 36, name: 'Enshrouded', genre: 'Survival', steamId: 1203620 },
  { id: 37, name: 'Helldivers 2', genre: 'TPS', steamId: 553850 },
  { id: 38, name: 'Hades II', genre: 'Roguelike', steamId: 1145350 }
];

// Helper to get Steam image URL
export const getSteamImageUrl = (steamId, type = 'header') => {
  if (!steamId) return null;
  
  switch (type) {
    case 'header':
      return `https://steamcdn-a.akamaihd.net/steam/apps/${steamId}/header.jpg`;
    case 'capsule':
      return `https://steamcdn-a.akamaihd.net/steam/apps/${steamId}/capsule_231x87.jpg`;
    case 'library':
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/library_600x900.jpg`;
    case 'logo':
      return `https://steamcdn-a.akamaihd.net/steam/apps/${steamId}/logo.png`;
    default:
      return `https://steamcdn-a.akamaihd.net/steam/apps/${steamId}/header.jpg`;
  }
};
