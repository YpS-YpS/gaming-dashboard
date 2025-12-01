import { seededRandom } from './random';
import { games } from '../data/games';
import { builds } from '../data/builds';

// Generate game performance metrics for a specific build
export const generateGameMetricsForBuild = (gameId, skuId, buildId) => {
  const buildNum = parseInt(buildId.replace('2025.', ''));
  const seed = gameId * 1000 + skuId.charCodeAt(0) * 100 + buildNum;
  const baseFps = 80 + seededRandom(seed) * 100;
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
