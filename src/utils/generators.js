import { seededRandom } from './random';
import { programs } from '../data/programs';

// Basic frame time data for mini charts
export const generateFrameTimeData = () => 
  Array.from({ length: 100 }, (_, i) => ({
    frame: i,
    frameTime: 8 + Math.random() * 8 + (Math.random() > 0.95 ? 15 : 0)
  }));

// Detailed frame time data with multiple metrics
export const generateDetailedFrameTimeData = (seed) => {
  const data = [];
  for (let i = 0; i < 500; i++) {
    const baseFrameTime = 10 + seededRandom(seed + i) * 6;
    const spike = seededRandom(seed + i + 1000) > 0.97 ? 20 + seededRandom(seed + i + 2000) * 15 : 0;
    const frameTime = baseFrameTime + spike;
    data.push({
      frame: i,
      frameTime: parseFloat(frameTime.toFixed(2)),
      fps: parseFloat((1000 / frameTime).toFixed(1)),
      percentile95: parseFloat((baseFrameTime * 1.3).toFixed(2)),
      percentile99: parseFloat((baseFrameTime * 1.5).toFixed(2)),
      onePercentLow: parseFloat((baseFrameTime * 1.4).toFixed(2)),
      pointOnePercentLow: parseFloat((baseFrameTime * 1.6).toFixed(2))
    });
  }
  // Calculate moving average
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - 19);
    data[i].movingAvg = parseFloat(
      (data.slice(start, i + 1).reduce((sum, d) => sum + d.frameTime, 0) / (i - start + 1)).toFixed(2)
    );
  }
  return data;
};

// CPU Residency data (C-state residency over time)
export const generateCpuResidencyData = (seed) => {
  const data = [];
  for (let t = 0; t < 600; t += 10) {
    const baseResidency = 12 + seededRandom(seed + t) * 6;
    const spike = seededRandom(seed + t + 500) > 0.92 ? seededRandom(seed + t + 600) * 10 : 0;
    data.push({
      time: t * 100,
      residency: parseFloat((baseResidency + spike + (seededRandom(seed + t + 100) - 0.5) * 4).toFixed(1)),
      trendLine: parseFloat((13 + Math.sin(t / 100) * 2).toFixed(1))
    });
  }
  return data;
};

// Performance Capability / P-state data
export const generatePerformanceCapabilityData = (seed) => {
  const data = [];
  for (let t = 0; t < 600; t += 10) {
    const base = 100 + seededRandom(seed + t) * 10;
    data.push({
      time: t * 100,
      capability: Math.round(base + (seededRandom(seed + t + 200) - 0.5) * 15),
      c0Active: Math.round(85 + seededRandom(seed + t + 300) * 25),
      c1: Math.round(60 + seededRandom(seed + t + 400) * 10),
      c6: Math.round(55 + seededRandom(seed + t + 500) * 15)
    });
  }
  return data;
};

// IA Clip Reason data
export const generateClipReasonData = (seed) => {
  const data = [];
  for (let t = 0; t < 600; t += 10) {
    const time = t * 100;
    const rand = seededRandom(seed + t);
    if (rand < 0.6) data.push({ time, reason: 'MAX_TURBO_LIMIT', y: 1 });
    if (rand > 0.3 && rand < 0.5 && seededRandom(seed + t + 100) > 0.7) data.push({ time, reason: 'PBM_PL1', y: 2 });
    if (rand > 0.7 && rand < 0.85) data.push({ time, reason: 'PBM_PL1;MAX_TURBO_LIMIT', y: 3 });
    if (rand > 0.85 && rand < 0.92) data.push({ time, reason: 'PBM_PL2', y: 4 });
    if (rand > 0.92 && rand < 0.97) data.push({ time, reason: 'PBM_PL2;MAX_TURBO_LIMIT', y: 5 });
    if (rand > 0.97) data.push({ time, reason: 'THERMAL', y: 6 });
  }
  return {
    data,
    reasons: ['MAX_TURBO_LIMIT', 'PBM_PL1', 'PBM_PL1;MAX_TURBO_LIMIT', 'PBM_PL2', 'PBM_PL2;MAX_TURBO_LIMIT', 'THERMAL']
  };
};

// Per-Core Temperature data
export const generatePerCoreTemperatureData = (skuId, seed) => {
  const sku = programs.flatMap(p => p.skus).find(s => s.id === skuId);
  const totalCores = Math.min(parseInt(sku?.cores.match(/(\d+)C/)?.[1] || 8), 24);
  const data = [];
  
  for (let t = 0; t < 120; t++) {
    const point = { time: t };
    const baseTemp = 72 + seededRandom(seed + t * 50) * 8;
    
    for (let c = 0; c < totalCores; c++) {
      point[`core${c}`] = Math.round(
        baseTemp + 
        (seededRandom(seed + t * 100 + c) - 0.5) * 12 + 
        (seededRandom(seed + t * 200 + c) > 0.95 ? 8 : 0) + 
        c * 0.3
      );
    }
    point.package = Math.max(...Object.keys(point).filter(k => k.startsWith('core')).map(k => point[k])) + 2;
    data.push(point);
  }
  return { data, coreCount: totalCores };
};

// Power data (IA Power and Package Power)
export const generatePowerData = (seed) => {
  const data = [];
  for (let t = 0; t < 120; t++) {
    const baseIa = 65 + seededRandom(seed + t) * 25;
    const basePkg = baseIa + 15 + seededRandom(seed + t + 100) * 10;
    const loadVar = Math.sin(t / 15) * 10;
    const spike = seededRandom(seed + t + 200) > 0.9 ? 15 : 0;
    
    data.push({
      time: t,
      iaPower: parseFloat((baseIa + loadVar + spike).toFixed(1)),
      packagePower: parseFloat((basePkg + loadVar + spike * 1.2).toFixed(1)),
      iaTrendLine: parseFloat((70 + Math.sin(t / 20) * 8).toFixed(1)),
      pkgTrendLine: parseFloat((85 + Math.sin(t / 20) * 10).toFixed(1))
    });
  }
  return data;
};

// Per-Core Frequency data
export const generatePerCoreFrequencyData = (skuId, seed) => {
  const sku = programs.flatMap(p => p.skus).find(s => s.id === skuId);
  const totalCores = parseInt(sku?.cores.match(/(\d+)C/)?.[1] || 8);
  const pCores = Math.ceil(totalCores * 0.4);
  const eCores = totalCores - pCores;
  const data = [];
  
  for (let t = 0; t < 120; t++) {
    const point = { time: t };
    for (let p = 0; p < pCores; p++) {
      point[`pCore${p}`] = Math.round(5000 + seededRandom(seed + t * 100 + p) * 800 + (seededRandom(seed + t * 200 + p) - 0.5) * 400);
    }
    for (let e = 0; e < eCores; e++) {
      point[`eCore${e}`] = Math.round(3800 + seededRandom(seed + t * 300 + e) * 500 + (seededRandom(seed + t * 400 + e) - 0.5) * 300);
    }
    data.push(point);
  }
  return { data, pCores, eCores };
};

// System Configuration
export const generateSystemConfig = (skuId, buildId) => {
  const sku = programs.flatMap(p => p.skus).find(s => s.id === skuId);
  const program = programs.find(p => p.skus.some(s => s.id === skuId));
  
  return {
    cpu: {
      name: sku?.fullName || 'Intel Core Ultra',
      architecture: program?.codename || 'ARL',
      cores: sku?.cores || '24C/32T',
      baseClock: '3.4 GHz',
      boostClock: '5.8 GHz',
      cache: '36 MB Intel Smart Cache',
      tdp: sku?.tdp || '125W'
    },
    bios: {
      vendor: 'American Megatrends Inc.',
      version: `1.${buildId.replace('2025.', '')}.0`,
      date: `11/${buildId.replace('2025.', '')}/2025`,
      mode: 'UEFI'
    },
    memory: {
      type: 'DDR5-6400',
      capacity: '64 GB (2x32 GB)',
      channels: 'Dual Channel',
      timings: 'CL32-39-39-102',
      xmpProfile: 'XMP 3.0 Profile 1'
    },
    gpu: {
      name: 'NVIDIA GeForce RTX 4090',
      driver: '566.14',
      vram: '24 GB GDDR6X',
      driverDate: '11/15/2025'
    },
    os: {
      name: 'Windows 11 Pro',
      version: '24H2',
      build: '26100.2454',
      directX: '12 Ultimate'
    },
    software: {
      intel: { xtu: '7.14.2.45', dtt: '9.1.11502.47', gfx: '31.0.101.6253' },
      runtime: { vcRedist: '14.42.34433.0', dotNet: '8.0.11', directX: 'June 2010' },
      gaming: { steam: '1732147200', gameBar: '6.124.11292.0', geforceExp: '3.28.0.417' }
    },
    storage: {
      name: 'Samsung 990 PRO 2TB',
      interface: 'NVMe PCIe 4.0 x4',
      firmware: '4B2QJXD7'
    },
    testSettings: {
      resolution: '3840x2160',
      preset: 'Ultra',
      rayTracing: 'On',
      dlss: 'Quality',
      vSync: 'Off',
      frameLimit: 'None'
    }
  };
};

// Simple frequency data for mini charts
export const generateFrequencyData = () => 
  Array.from({ length: 60 }, (_, i) => ({
    time: i,
    pCore0: 5200 + Math.random() * 600 - 300,
    pCore1: 5100 + Math.random() * 600 - 300,
    eCore0: 4100 + Math.random() * 400 - 200
  }));

// Simple temperature data for mini charts
export const generateTempData = () => 
  Array.from({ length: 60 }, (_, i) => ({
    time: i,
    package: 65 + Math.random() * 20,
    pCoreMax: 70 + Math.random() * 18
  }));
