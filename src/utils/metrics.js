import { seededRandom } from './random';
import { games } from '../data/games';
import { builds } from '../data/builds';

// SKU performance multipliers - reflects hardware capability hierarchy
// Higher values = better performance
const SKU_PERFORMANCE_MODIFIERS = {
  // Arrow Lake - Desktop is king, HX is high-end mobile, H is mainstream mobile
  'arl-s': 1.15,     // ARL S Desktop - highest performance (flagship)
  'arl-hx': 0.88,    // ARL HX Mobile - mid-tier
  'arl-h': 0.80,     // ARL H Mobile - lower mid

  // Nova Lake - Next gen, S is slightly below ARL S, BLLC variant
  'nvl-s': 0.95,     // NVL S Desktop - better than ARL HX, below ARL S
  'nvl-s-bllc': 0.90, // NVL S BLLC - between NVL S and ARL HX

  // Panther Lake - Ultra-mobile focused
  'ptl-u': 0.72,     // PTL U Ultra-Mobile - lowest (power constrained)
  'ptl-h': 0.82,     // PTL H Mobile - somewhat better than ARL H
};

// Games with negative trend (driver issues, game patches, etc.)
// These will show slight regression instead of improvement for ARL S/HX
const NEGATIVE_TREND_GAMES = [
  'cb2077',      // Cyberpunk 2077 - recent game patch caused regression
  'starfield',   // Starfield - Bethesda update issues
  'bg3',         // Baldur's Gate 3 - driver compatibility
  'alanwake2',   // Alan Wake 2 - RT performance regression
  'msfs2024',    // Flight Simulator - complex sim with variable perf
];

// Build order index (higher = newer build = better performance for ARL S/HX)
const getBuildIndex = (buildId) => {
  const idx = builds.indexOf(buildId);
  return idx === -1 ? 0 : builds.length - 1 - idx; // Reverse: 48 is newest (index 4), 40 is oldest (index 0)
};

// Get build progression multiplier for ARL S and HX
// Newer builds get higher FPS (simulating driver optimizations)
const getBuildProgressionBonus = (gameId, skuId, buildId) => {
  // Only apply to ARL S and ARL HX
  if (skuId !== 'arl-s' && skuId !== 'arl-hx') {
    return 1.0;
  }

  const game = games.find(g => g.id === gameId);
  const gameSlug = game?.slug || '';
  const buildIndex = getBuildIndex(buildId);

  // Check if this game has negative trend
  const isNegativeTrend = NEGATIVE_TREND_GAMES.includes(gameSlug);

  if (isNegativeTrend) {
    // Negative trend: newer builds are WORSE (1-2% regression per build)
    return 1.0 - (buildIndex * 0.015); // -1.5% per build step for problem games
  } else {
    // Positive trend: newer builds are BETTER (2-4% improvement per build)
    return 1.0 + (buildIndex * 0.03); // +3% per build step
  }
};

// Get SKU multiplier with fallback
const getSkuMultiplier = (skuId) => {
  return SKU_PERFORMANCE_MODIFIERS[skuId] || 0.85;
};

// Generate game performance metrics for a specific build
export const generateGameMetricsForBuild = (gameId, skuId, buildId) => {
  const buildNum = parseInt(buildId.replace('2025.', ''));
  const seed = gameId * 1000 + skuId.charCodeAt(0) * 100 + buildNum;

  // Apply SKU multiplier to performance
  const skuMultiplier = getSkuMultiplier(skuId);

  // Apply build progression bonus for ARL S/HX
  const buildBonus = getBuildProgressionBonus(gameId, skuId, buildId);

  // Base FPS range: 80-180, then apply SKU multiplier and build bonus
  const baseFps = (80 + seededRandom(seed) * 100) * skuMultiplier * buildBonus;
  const fps = baseFps + (seededRandom(seed + buildNum) - 0.5) * 10;

  return {
    avgFps: Math.round(fps),
    onePercentLow: Math.round(fps * 0.7 + (seededRandom(seed + 1) - 0.5) * 6),
    pointOnePercentLow: Math.round(fps * 0.55 + (seededRandom(seed + 2) - 0.5) * 4),
    maxFps: Math.round(fps * 1.3 + seededRandom(seed + 3) * 15),
    minFps: Math.round(fps * 0.4 + seededRandom(seed + 4) * 10),
    avgCpuUsage: Math.round(45 + seededRandom(seed + 5) * 40),
    avgGpuUsage: Math.round(85 + seededRandom(seed + 6) * 14),
    avgPCoreMhz: Math.round(5000 + seededRandom(seed + 7) * 800),
    maxPCoreMhz: Math.round(5600 + seededRandom(seed + 8) * 200),
    minPCoreMhz: Math.round(4200 + seededRandom(seed + 9) * 500),
    avgECoreMhz: Math.round(4000 + seededRandom(seed + 10) * 400),
    maxECoreMhz: Math.round(4400 + seededRandom(seed + 11) * 200),
    minECoreMhz: Math.round(3400 + seededRandom(seed + 12) * 300),
    avgPackageTemp: Math.round(68 + seededRandom(seed + 13) * 18),
    maxPackageTemp: Math.round(82 + seededRandom(seed + 14) * 12),
    avgPower: Math.round(95 + seededRandom(seed + 15) * 50),
    maxPower: Math.round(140 + seededRandom(seed + 16) * 35),
    throttling: seededRandom(seed + 17) > 0.7
      ? ['Thermal', 'Power Limit']
      : seededRandom(seed + 18) > 0.5
        ? ['Power Limit']
        : []
  };
};

// Calculate overall performance index for a SKU/build combination
export const calculatePerformanceIndex = (skuId, buildId) => {
  return Math.round(
    games.reduce((sum, g) => sum + generateGameMetricsForBuild(g.id, skuId, buildId).avgFps, 0) / games.length
  );
};

// Get build-over-build trend data for a game
export const getBuildTrend = (gameId, skuId, currentBuild) => {
  const idx = builds.indexOf(currentBuild);
  const trendData = builds
    .slice(idx, Math.min(idx + 4, builds.length))
    .reverse()
    .map(build => ({
      build,
      avgFps: generateGameMetricsForBuild(gameId, skuId, build).avgFps
    }));

  const delta = trendData.length >= 2
    ? trendData[trendData.length - 1].avgFps - trendData[trendData.length - 2].avgFps
    : 0;

  const deltaPercent = trendData.length >= 2
    ? (delta / trendData[trendData.length - 2].avgFps) * 100
    : 0;

  return { trendData, delta, deltaPercent };
};
