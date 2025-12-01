import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, CartesianGrid, ScatterChart, Scatter, ReferenceLine, ComposedChart } from 'recharts';
import { ChevronRight, Cpu, Thermometer, Zap, Clock, TrendingUp, TrendingDown, Activity, Gauge, AlertTriangle, ChevronDown, Monitor, Search, Minus, ArrowLeft, X, Settings, HardDrive, MemoryStick, Layers, ArrowUpAZ, ArrowDownAZ, Gamepad2 } from 'lucide-react';

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateFrameTimeData = () => Array.from({ length: 100 }, (_, i) => ({ frame: i, frameTime: 8 + Math.random() * 8 + (Math.random() > 0.95 ? 15 : 0) }));

const generateDetailedFrameTimeData = (seed) => {
  const data = [];
  for (let i = 0; i < 500; i++) {
    const baseFrameTime = 10 + seededRandom(seed + i) * 6;
    const spike = seededRandom(seed + i + 1000) > 0.97 ? 20 + seededRandom(seed + i + 2000) * 15 : 0;
    const frameTime = baseFrameTime + spike;
    data.push({ frame: i, frameTime: parseFloat(frameTime.toFixed(2)), fps: parseFloat((1000 / frameTime).toFixed(1)), percentile95: parseFloat((baseFrameTime * 1.3).toFixed(2)), percentile99: parseFloat((baseFrameTime * 1.5).toFixed(2)), onePercentLow: parseFloat((baseFrameTime * 1.4).toFixed(2)), pointOnePercentLow: parseFloat((baseFrameTime * 1.6).toFixed(2)) });
  }
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - 19);
    data[i].movingAvg = parseFloat((data.slice(start, i + 1).reduce((sum, d) => sum + d.frameTime, 0) / (i - start + 1)).toFixed(2));
  }
  return data;
};

const generateCpuResidencyData = (seed) => {
  const data = [];
  for (let t = 0; t < 600; t += 10) {
    const baseResidency = 12 + seededRandom(seed + t) * 6;
    const spike = seededRandom(seed + t + 500) > 0.92 ? seededRandom(seed + t + 600) * 10 : 0;
    data.push({ time: t * 100, residency: parseFloat((baseResidency + spike + (seededRandom(seed + t + 100) - 0.5) * 4).toFixed(1)), trendLine: parseFloat((13 + Math.sin(t / 100) * 2).toFixed(1)) });
  }
  return data;
};

const generatePerformanceCapabilityData = (seed) => {
  const data = [];
  for (let t = 0; t < 600; t += 10) {
    const base = 100 + seededRandom(seed + t) * 10;
    data.push({ time: t * 100, capability: Math.round(base + (seededRandom(seed + t + 200) - 0.5) * 15), c0Active: Math.round(85 + seededRandom(seed + t + 300) * 25), c1: Math.round(60 + seededRandom(seed + t + 400) * 10), c6: Math.round(55 + seededRandom(seed + t + 500) * 15) });
  }
  return data;
};

const generateClipReasonData = (seed) => {
  const data = [];
  for (let t = 0; t < 600; t += 10) {
    const time = t * 100, rand = seededRandom(seed + t);
    if (rand < 0.6) data.push({ time, reason: 'MAX_TURBO_LIMIT', y: 1 });
    if (rand > 0.3 && rand < 0.5 && seededRandom(seed + t + 100) > 0.7) data.push({ time, reason: 'PBM_PL1', y: 2 });
    if (rand > 0.7 && rand < 0.85) data.push({ time, reason: 'PBM_PL1;MAX_TURBO_LIMIT', y: 3 });
    if (rand > 0.85 && rand < 0.92) data.push({ time, reason: 'PBM_PL2', y: 4 });
    if (rand > 0.92 && rand < 0.97) data.push({ time, reason: 'PBM_PL2;MAX_TURBO_LIMIT', y: 5 });
    if (rand > 0.97) data.push({ time, reason: 'THERMAL', y: 6 });
  }
  return { data, reasons: ['MAX_TURBO_LIMIT', 'PBM_PL1', 'PBM_PL1;MAX_TURBO_LIMIT', 'PBM_PL2', 'PBM_PL2;MAX_TURBO_LIMIT', 'THERMAL'] };
};

const generatePerCoreTemperatureData = (skuId, seed) => {
  const sku = programs.flatMap(p => p.skus).find(s => s.id === skuId);
  const totalCores = Math.min(parseInt(sku?.cores.match(/(\d+)C/)?.[1] || 8), 24);
  const data = [];
  for (let t = 0; t < 120; t++) {
    const point = { time: t };
    const baseTemp = 72 + seededRandom(seed + t * 50) * 8;
    for (let c = 0; c < totalCores; c++) point[`core${c}`] = Math.round(baseTemp + (seededRandom(seed + t * 100 + c) - 0.5) * 12 + (seededRandom(seed + t * 200 + c) > 0.95 ? 8 : 0) + c * 0.3);
    point.package = Math.max(...Object.keys(point).filter(k => k.startsWith('core')).map(k => point[k])) + 2;
    data.push(point);
  }
  return { data, coreCount: totalCores };
};

const generatePowerData = (seed) => {
  const data = [];
  for (let t = 0; t < 120; t++) {
    const baseIa = 65 + seededRandom(seed + t) * 25, basePkg = baseIa + 15 + seededRandom(seed + t + 100) * 10;
    const loadVar = Math.sin(t / 15) * 10, spike = seededRandom(seed + t + 200) > 0.9 ? 15 : 0;
    data.push({ time: t, iaPower: parseFloat((baseIa + loadVar + spike).toFixed(1)), packagePower: parseFloat((basePkg + loadVar + spike * 1.2).toFixed(1)), iaTrendLine: parseFloat((70 + Math.sin(t / 20) * 8).toFixed(1)), pkgTrendLine: parseFloat((85 + Math.sin(t / 20) * 10).toFixed(1)) });
  }
  return data;
};

const generatePerCoreFrequencyData = (skuId, seed) => {
  const sku = programs.flatMap(p => p.skus).find(s => s.id === skuId);
  const totalCores = parseInt(sku?.cores.match(/(\d+)C/)?.[1] || 8);
  const pCores = Math.ceil(totalCores * 0.4), eCores = totalCores - pCores;
  const data = [];
  for (let t = 0; t < 120; t++) {
    const point = { time: t };
    for (let p = 0; p < pCores; p++) point[`pCore${p}`] = Math.round(5000 + seededRandom(seed + t * 100 + p) * 800 + (seededRandom(seed + t * 200 + p) - 0.5) * 400);
    for (let e = 0; e < eCores; e++) point[`eCore${e}`] = Math.round(3800 + seededRandom(seed + t * 300 + e) * 500 + (seededRandom(seed + t * 400 + e) - 0.5) * 300);
    data.push(point);
  }
  return { data, pCores, eCores };
};

const generateSystemConfig = (skuId, buildId) => {
  const sku = programs.flatMap(p => p.skus).find(s => s.id === skuId);
  const program = programs.find(p => p.skus.some(s => s.id === skuId));
  return {
    cpu: { name: sku?.fullName || 'Intel Core Ultra', architecture: program?.codename || 'ARL', cores: sku?.cores || '24C/32T', baseClock: '3.4 GHz', boostClock: '5.8 GHz', cache: '36 MB Intel Smart Cache', tdp: sku?.tdp || '125W' },
    bios: { vendor: 'American Megatrends Inc.', version: `1.${buildId.replace('2025.', '')}.0`, date: `11/${buildId.replace('2025.', '')}/2025`, mode: 'UEFI' },
    memory: { type: 'DDR5-6400', capacity: '64 GB (2x32 GB)', channels: 'Dual Channel', timings: 'CL32-39-39-102', xmpProfile: 'XMP 3.0 Profile 1' },
    gpu: { name: 'NVIDIA GeForce RTX 4090', driver: '566.14', vram: '24 GB GDDR6X', driverDate: '11/15/2025' },
    os: { name: 'Windows 11 Pro', version: '24H2', build: '26100.2454', directX: '12 Ultimate' },
    software: { intel: { xtu: '7.14.2.45', dtt: '9.1.11502.47', gfx: '31.0.101.6253' }, runtime: { vcRedist: '14.42.34433.0', dotNet: '8.0.11', directX: 'June 2010' }, gaming: { steam: '1732147200', gameBar: '6.124.11292.0', geforceExp: '3.28.0.417' } },
    storage: { name: 'Samsung 990 PRO 2TB', interface: 'NVMe PCIe 4.0 x4', firmware: '4B2QJXD7' },
    testSettings: { resolution: '3840x2160', preset: 'Ultra', rayTracing: 'On', dlss: 'Quality', vSync: 'Off', frameLimit: 'None' }
  };
};

const generateFrequencyData = () => Array.from({ length: 60 }, (_, i) => ({ time: i, pCore0: 5200 + Math.random() * 600 - 300, pCore1: 5100 + Math.random() * 600 - 300, eCore0: 4100 + Math.random() * 400 - 200 }));
const generateTempData = () => Array.from({ length: 60 }, (_, i) => ({ time: i, package: 65 + Math.random() * 20, pCoreMax: 70 + Math.random() * 18 }));

const programs = [
  { id: 'arrow-lake', name: 'Arrow Lake', codename: 'ARL', icon: '🏹', color: '#a855f7', skus: [{ id: 'arl-s', name: 'ARL S', fullName: 'Arrow Lake S Desktop', cores: '24C/32T', tdp: '125W' }, { id: 'arl-hx', name: 'ARL HX', fullName: 'Arrow Lake HX Mobile', cores: '24C/32T', tdp: '55W' }, { id: 'arl-h', name: 'ARL H', fullName: 'Arrow Lake H Mobile', cores: '16C/20T', tdp: '45W' }] },
  { id: 'nova-lake', name: 'Nova Lake', codename: 'NVL', icon: '✨', color: '#22d3ee', skus: [{ id: 'nvl-s', name: 'NVL S', fullName: 'Nova Lake S Desktop', cores: '32C/40T', tdp: '150W' }, { id: 'nvl-s-bllc', name: 'NVL S BLLC', fullName: 'Nova Lake S BLLC', cores: '24C/32T', tdp: '125W' }] },
  { id: 'panther-lake', name: 'Panther Lake', codename: 'PTL', icon: '🐆', color: '#f472b6', skus: [{ id: 'ptl-u', name: 'PTL U', fullName: 'Panther Lake U Ultra-Mobile', cores: '12C/16T', tdp: '15W' }, { id: 'ptl-h', name: 'PTL H', fullName: 'Panther Lake H Mobile', cores: '20C/24T', tdp: '45W' }] }
];

const builds = ['2025.48', '2025.46', '2025.44', '2025.42', '2025.40'];

const games = [
  { id: 1, name: 'Cyberpunk 2077', genre: 'RPG', image: '🌆' }, { id: 2, name: 'Red Dead Redemption 2', genre: 'Action', image: '🤠' }, { id: 3, name: 'Hogwarts Legacy', genre: 'RPG', image: '🧙' }, { id: 4, name: 'Spider-Man Remastered', genre: 'Action', image: '🕷️' }, { id: 5, name: 'Elden Ring', genre: 'RPG', image: '⚔️' }, { id: 6, name: 'Forza Horizon 5', genre: 'Racing', image: '🏎️' }, { id: 7, name: 'Call of Duty: MW3', genre: 'FPS', image: '🎯' }, { id: 8, name: "Baldur's Gate 3", genre: 'RPG', image: '🐉' }, { id: 9, name: 'Starfield', genre: 'RPG', image: '🚀' }, { id: 10, name: 'Alan Wake 2', genre: 'Horror', image: '🔦' },
  { id: 11, name: 'Resident Evil 4', genre: 'Horror', image: '🧟' }, { id: 12, name: 'Diablo IV', genre: 'ARPG', image: '😈' }, { id: 13, name: 'Counter-Strike 2', genre: 'FPS', image: '💣' }, { id: 14, name: 'Valorant', genre: 'FPS', image: '🎮' }, { id: 15, name: 'League of Legends', genre: 'MOBA', image: '⚡' }, { id: 16, name: 'Apex Legends', genre: 'BR', image: '🏆' }, { id: 17, name: 'Overwatch 2', genre: 'FPS', image: '🦸' }, { id: 18, name: 'Horizon Forbidden West', genre: 'Action', image: '🦖' }, { id: 19, name: 'God of War Ragnarok', genre: 'Action', image: '🪓' }, { id: 20, name: 'The Last of Us Part I', genre: 'Action', image: '🍄' },
  { id: 21, name: 'Hitman 3', genre: 'Stealth', image: '🎯' }, { id: 22, name: 'Death Stranding', genre: 'Action', image: '📦' }, { id: 23, name: 'Metro Exodus', genre: 'FPS', image: '☢️' }, { id: 24, name: 'Shadow of the Tomb Raider', genre: 'Action', image: '🏺' }, { id: 25, name: 'F1 2024', genre: 'Racing', image: '🏁' }, { id: 26, name: 'Total War: Warhammer 3', genre: 'Strategy', image: '🗡️' }, { id: 27, name: 'Age of Empires IV', genre: 'Strategy', image: '🏰' }, { id: 28, name: 'Civilization VI', genre: 'Strategy', image: '🌍' }, { id: 29, name: 'Flight Simulator 2024', genre: 'Sim', image: '✈️' }, { id: 30, name: 'Avatar: Frontiers', genre: 'Action', image: '🌿' },
  { id: 31, name: 'A Plague Tale: Requiem', genre: 'Adventure', image: '🐀' }, { id: 32, name: 'Dead Space', genre: 'Horror', image: '👽' }, { id: 33, name: 'Returnal', genre: 'Roguelike', image: '🔄' }, { id: 34, name: 'Black Myth: Wukong', genre: 'Action', image: '🐵' }, { id: 35, name: 'Palworld', genre: 'Survival', image: '🦊' }, { id: 36, name: 'Enshrouded', genre: 'Survival', image: '🌫️' }, { id: 37, name: 'Helldivers 2', genre: 'TPS', image: '🪖' }, { id: 38, name: 'Hades II', genre: 'Roguelike', image: '🔥' }
];

const generateGameMetricsForBuild = (gameId, skuId, buildId) => {
  const buildNum = parseInt(buildId.replace('2025.', '')), seed = gameId * 1000 + skuId.charCodeAt(0) * 100 + buildNum;
  const baseFps = 80 + seededRandom(seed) * 100, fps = baseFps + (seededRandom(seed + buildNum) - 0.5) * 10;
  return { avgFps: Math.round(fps), onePercentLow: Math.round(fps * 0.7 + (seededRandom(seed + 1) - 0.5) * 6), pointOnePercentLow: Math.round(fps * 0.55 + (seededRandom(seed + 2) - 0.5) * 4), maxFps: Math.round(fps * 1.3 + seededRandom(seed + 3) * 15), minFps: Math.round(fps * 0.4 + seededRandom(seed + 4) * 10), avgCpuUsage: Math.round(45 + seededRandom(seed + 5) * 40), avgGpuUsage: Math.round(85 + seededRandom(seed + 6) * 14), avgPCoreMhz: Math.round(5000 + seededRandom(seed + 7) * 800), maxPCoreMhz: Math.round(5600 + seededRandom(seed + 8) * 200), minPCoreMhz: Math.round(4200 + seededRandom(seed + 9) * 500), avgECoreMhz: Math.round(4000 + seededRandom(seed + 10) * 400), maxECoreMhz: Math.round(4400 + seededRandom(seed + 11) * 200), minECoreMhz: Math.round(3400 + seededRandom(seed + 12) * 300), avgPackageTemp: Math.round(68 + seededRandom(seed + 13) * 18), maxPackageTemp: Math.round(82 + seededRandom(seed + 14) * 12), avgPower: Math.round(95 + seededRandom(seed + 15) * 50), maxPower: Math.round(140 + seededRandom(seed + 16) * 35), throttling: seededRandom(seed + 17) > 0.7 ? ['Thermal', 'Power Limit'] : seededRandom(seed + 18) > 0.5 ? ['Power Limit'] : [] };
};

const calculatePerformanceIndex = (skuId, buildId) => Math.round(games.reduce((sum, g) => sum + generateGameMetricsForBuild(g.id, skuId, buildId).avgFps, 0) / games.length);

const getBuildTrend = (gameId, skuId, currentBuild) => {
  const idx = builds.indexOf(currentBuild);
  const trendData = builds.slice(idx, Math.min(idx + 4, builds.length)).reverse().map(build => ({ build, avgFps: generateGameMetricsForBuild(gameId, skuId, build).avgFps }));
  const delta = trendData.length >= 2 ? trendData[trendData.length - 1].avgFps - trendData[trendData.length - 2].avgFps : 0;
  return { trendData, delta, deltaPercent: trendData.length >= 2 ? (delta / trendData[trendData.length - 2].avgFps) * 100 : 0 };
};

const getFpsColor = (fps) => fps >= 120 ? '#10b981' : fps >= 60 ? '#06b6d4' : fps >= 30 ? '#f59e0b' : '#ef4444';

const CustomTooltip = ({ active, payload, label, unit }) => active && payload?.length ? (
  <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '10px 14px' }}>
    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{label}</p>
    {payload.map((entry, i) => <p key={i} style={{ fontSize: '14px', fontWeight: 500, color: entry.color, margin: 0 }}>{entry.name}: {entry.value.toFixed(1)}{unit}</p>)}
  </div>
) : null;

const TrendTooltip = ({ active, payload }) => active && payload?.length ? (
  <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '6px', padding: '8px 12px' }}>
    <p style={{ fontSize: '12px', color: '#a855f7', marginBottom: '2px', fontWeight: 600 }}>Build {payload[0].payload.build}</p>
    <p style={{ fontSize: '14px', color: '#f1f5f9', margin: 0 }}>{payload[0].value} FPS</p>
  </div>
) : null;

const TrendSparkline = ({ data, delta }) => (
  <div style={{ width: '80px', height: '32px' }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}><YAxis domain={[Math.min(...data.map(d => d.avgFps)) - 5, Math.max(...data.map(d => d.avgFps)) + 5]} hide /><Tooltip content={<TrendTooltip />} /><Line type="monotone" dataKey="avgFps" stroke={delta >= 0 ? '#10b981' : '#ef4444'} strokeWidth={2} dot={{ r: 2, fill: delta >= 0 ? '#10b981' : '#ef4444' }} /></LineChart>
    </ResponsiveContainer>
  </div>
);

const DeltaBadge = ({ delta, deltaPercent }) => {
  const isNeutral = Math.abs(deltaPercent) < 1;
  const [bgColor, textColor, Icon] = isNeutral ? ['rgba(100, 116, 139, 0.2)', '#94a3b8', Minus] : delta >= 0 ? ['rgba(16, 185, 129, 0.15)', '#10b981', TrendingUp] : ['rgba(239, 68, 68, 0.15)', '#ef4444', TrendingDown];
  return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: bgColor }}><Icon size={14} style={{ color: textColor }} /><span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>{delta >= 0 && !isNeutral ? '+' : ''}{deltaPercent.toFixed(1)}%</span></div>;
};

const MetricCard = ({ label, value, unit, icon: Icon, color }) => (
  <div style={{ background: 'rgba(30, 20, 60, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {Icon && <Icon size={16} style={{ color, opacity: 0.7 }} />}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}><span style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</span><span style={{ fontSize: '14px', color: '#4b5563' }}>{unit}</span></div>
  </div>
);
// GameCard Component
const GameCard = ({ game, metrics, isExpanded, onToggle, skuId, currentBuild, onOpenDetail }) => {
  const frameTimeData = useMemo(() => generateFrameTimeData(), []);
  const frequencyData = useMemo(() => generateFrequencyData(), []);
  const tempData = useMemo(() => generateTempData(), []);
  const { trendData, delta, deltaPercent } = useMemo(() => getBuildTrend(game.id, skuId, currentBuild), [game.id, skuId, currentBuild]);

  return (
    <div style={{ background: isExpanded ? 'rgba(30, 20, 60, 0.8)' : 'rgba(20, 15, 45, 0.6)', borderRadius: '16px', border: isExpanded ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(139, 92, 246, 0.1)', overflow: 'hidden', transition: 'all 0.3s ease' }}>
      <div onClick={onToggle} style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(30, 20, 60, 0.8))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '1px solid rgba(139, 92, 246, 0.2)', flexShrink: 0 }}>{game.image}</div>
          <div style={{ minWidth: '200px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#f1f5f9' }}>{game.name}</h3>
            <span style={{ fontSize: '14px', color: '#64748b' }}>{game.genre}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Last 4 Builds</div>
              <TrendSparkline data={trendData} delta={delta} />
            </div>
            <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
          </div>
          
          <div style={{ width: '1px', height: '40px', background: 'rgba(139, 92, 246, 0.2)' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ textAlign: 'center', minWidth: '50px' }}><div style={{ fontSize: '28px', fontWeight: 700, color: getFpsColor(metrics.avgFps) }}>{metrics.avgFps}</div><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Avg</div></div>
            <div style={{ textAlign: 'center', minWidth: '50px' }}><div style={{ fontSize: '24px', fontWeight: 600, color: getFpsColor(metrics.onePercentLow) }}>{metrics.onePercentLow}</div><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>1% Low</div></div>
            <div style={{ textAlign: 'center', minWidth: '50px' }}><div style={{ fontSize: '24px', fontWeight: 600, color: getFpsColor(metrics.pointOnePercentLow) }}>{metrics.pointOnePercentLow}</div><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>0.1% Low</div></div>
          </div>
          
          <button onClick={(e) => { e.stopPropagation(); onOpenDetail(game); }} title="Open detailed analysis" style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(139, 92, 246, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <Activity size={18} style={{ color: '#a855f7' }} />
          </button>
          
          <ChevronDown size={20} style={{ color: '#64748b', transition: 'transform 0.3s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)', marginBottom: '20px' }} />
          
          <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.1)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={14} style={{ color: '#a855f7' }} /><span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Build-over-Build Trend</span></div>
              <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ flex: 1, height: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs><linearGradient id={`trendGrad-${game.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3}/><stop offset="95%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="build" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip content={<TrendTooltip />} />
                    <Area type="monotone" dataKey="avgFps" stroke={delta >= 0 ? '#10b981' : '#ef4444'} strokeWidth={2} fill={`url(#trendGrad-${game.id})`} dot={{ r: 4, fill: delta >= 0 ? '#10b981' : '#ef4444', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {trendData.map((d, i) => (
                  <div key={d.build} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: i === trendData.length - 1 ? (delta >= 0 ? '#10b981' : '#ef4444') : '#94a3b8' }}>{d.avgFps}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{d.build}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <MetricCard label="Max FPS" value={metrics.maxFps} unit="fps" icon={TrendingUp} color="#10b981" />
            <MetricCard label="Min FPS" value={metrics.minFps} unit="fps" icon={TrendingDown} color="#ef4444" />
            <MetricCard label="CPU Usage" value={metrics.avgCpuUsage} unit="%" icon={Cpu} color="#06b6d4" />
            <MetricCard label="GPU Usage" value={metrics.avgGpuUsage} unit="%" icon={Monitor} color="#a855f7" />
            <MetricCard label="Avg Power" value={metrics.avgPower} unit="W" icon={Zap} color="#f59e0b" />
            <MetricCard label="Max Power" value={metrics.maxPower} unit="W" icon={Zap} color="#f97316" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Clock size={14} style={{ color: '#a855f7' }} /><span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Frame Time</span></div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={frameTimeData}>
                  <defs><linearGradient id="ftGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="frame" hide /><YAxis domain={[0, 30]} hide /><Tooltip content={<CustomTooltip unit="ms" />} />
                  <Area type="monotone" dataKey="frameTime" stroke="#a855f7" strokeWidth={1.5} fill="url(#ftGrad)" name="Frame Time" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Activity size={14} style={{ color: '#06b6d4' }} /><span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>CPU Frequency</span></div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={frequencyData}>
                  <XAxis dataKey="time" hide /><YAxis domain={[3000, 6000]} hide /><Tooltip content={<CustomTooltip unit=" MHz" />} />
                  <Line type="monotone" dataKey="pCore0" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="P-Core 0" />
                  <Line type="monotone" dataKey="pCore1" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="P-Core 1" />
                  <Line type="monotone" dataKey="eCore0" stroke="#a855f7" strokeWidth={1.5} dot={false} name="E-Core 0" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Thermometer size={14} style={{ color: '#f43f5e' }} /><span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Temperature</span></div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={tempData}>
                  <defs><linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="time" hide /><YAxis domain={[40, 100]} hide /><Tooltip content={<CustomTooltip unit="°C" />} />
                  <Area type="monotone" dataKey="package" stroke="#f43f5e" strokeWidth={1.5} fill="url(#tempGrad)" name="Package" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} /><span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>P-Core Frequency</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Average</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#06b6d4' }}>{metrics.avgPCoreMhz} MHz</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Maximum</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#10b981' }}>{metrics.maxPCoreMhz} MHz</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Minimum</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#ef4444' }}>{metrics.minPCoreMhz} MHz</span></div>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }} /><span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>E-Core Frequency</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Average</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#a855f7' }}>{metrics.avgECoreMhz} MHz</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Maximum</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#10b981' }}>{metrics.maxECoreMhz} MHz</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Minimum</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#ef4444' }}>{metrics.minECoreMhz} MHz</span></div>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} /><span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Thermal</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Avg Package</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#f59e0b' }}>{metrics.avgPackageTemp}°C</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Max Package</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#f43f5e' }}>{metrics.maxPackageTemp}°C</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '14px', color: '#64748b' }}>Headroom</span><span style={{ fontSize: '15px', fontWeight: 500, color: '#10b981' }}>{100 - metrics.maxPackageTemp}°C</span></div>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><AlertTriangle size={14} style={{ color: '#f59e0b' }} /><span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Throttling</span></div>
              {metrics.throttling.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {metrics.throttling.map((reason, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ fontSize: '14px', color: '#f59e0b' }}>{reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#10b981' }}>No throttling detected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SKU Card Component
const SKUCard = ({ sku, program, isSelected, onClick }) => (
  <div onClick={onClick} style={{ padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', background: isSelected ? `linear-gradient(135deg, ${program.color}20, rgba(20, 15, 45, 0.8))` : 'rgba(20, 15, 45, 0.4)', border: isSelected ? `1px solid ${program.color}50` : '1px solid rgba(139, 92, 246, 0.1)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '18px', fontWeight: 700, color: isSelected ? program.color : '#94a3b8' }}>{sku.name}</span>
      {isSelected && <ChevronRight size={16} style={{ color: program.color }} />}
    </div>
    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>{sku.fullName}</p>
    <div style={{ display: 'flex', gap: '8px' }}>
      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#94a3b8' }}>{sku.cores}</span>
      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#94a3b8' }}>{sku.tdp}</span>
    </div>
  </div>
);
// Detailed Analysis Page Component
const DetailedAnalysisPage = ({ game, skuId, buildId }) => {
  const [frameTimeMode, setFrameTimeMode] = useState('frameTime');
  const [selectedCores, setSelectedCores] = useState({ pCores: [0, 1], eCores: [0] });
  const [selectedTempCores, setSelectedTempCores] = useState([0, 1, 2, 3]);
  
  const program = programs.find(p => p.skus.some(s => s.id === skuId));
  const sku = program?.skus.find(s => s.id === skuId);
  const metrics = generateGameMetricsForBuild(game.id, skuId, buildId);
  const systemConfig = generateSystemConfig(skuId, buildId);
  const seed = game.id * 1000 + skuId.charCodeAt(0);
  
  const detailedFrameTimeData = useMemo(() => generateDetailedFrameTimeData(seed), [seed]);
  const { data: perCoreData, pCores, eCores } = useMemo(() => generatePerCoreFrequencyData(skuId, seed), [skuId, seed]);
  const { trendData, delta, deltaPercent } = useMemo(() => getBuildTrend(game.id, skuId, buildId), [game.id, skuId, buildId]);
  const cpuResidencyData = useMemo(() => generateCpuResidencyData(seed), [seed]);
  const performanceCapabilityData = useMemo(() => generatePerformanceCapabilityData(seed), [seed]);
  const { data: clipReasonData } = useMemo(() => generateClipReasonData(seed), [seed]);
  const { data: perCoreTemperatureData, coreCount: tempCoreCount } = useMemo(() => generatePerCoreTemperatureData(skuId, seed), [skuId, seed]);
  const powerData = useMemo(() => generatePowerData(seed), [seed]);
  
  const frameTimeModes = [
    { id: 'frameTime', label: 'Frame Time', color: '#a855f7' }, { id: 'fps', label: 'FPS', color: '#10b981' },
    { id: 'percentile95', label: '95th %', color: '#f59e0b' }, { id: 'percentile99', label: '99th %', color: '#ef4444' },
    { id: 'onePercentLow', label: '1% Low', color: '#06b6d4' }, { id: 'movingAvg', label: 'Moving Avg', color: '#8b5cf6' }
  ];
  
  const currentFrameTimeMode = frameTimeModes.find(m => m.id === frameTimeMode);
  const pCoreColors = ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#4338ca', '#3730a3'];
  const eCoreColors = ['#10b981', '#059669', '#047857', '#065f46', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'];
  const tempCoreColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];
  const clipReasonColors = { 'MAX_TURBO_LIMIT': '#06b6d4', 'PBM_PL1': '#f59e0b', 'PBM_PL1;MAX_TURBO_LIMIT': '#ec4899', 'PBM_PL2': '#ef4444', 'PBM_PL2;MAX_TURBO_LIMIT': '#dc2626', 'THERMAL': '#7c3aed' };
  
  const toggleCore = (type, index) => setSelectedCores(prev => {
    const key = type === 'p' ? 'pCores' : 'eCores';
    return { ...prev, [key]: prev[key].includes(index) ? prev[key].filter(i => i !== index) : [...prev[key], index] };
  });
  
  const toggleTempCore = (index) => setSelectedTempCores(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  
  const ConfigSection = ({ title, icon: Icon, children }) => (
    <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}><Icon size={18} style={{ color: '#a855f7' }} /><span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>{title}</span></div>
      {children}
    </div>
  );
  
  const ConfigRow = ({ label, value, highlight }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(139, 92, 246, 0.08)' }}>
      <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: highlight || '#e2e8f0' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)', color: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div style={{ position: 'relative', padding: '40px', paddingBottom: '60px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${program?.color || '#a855f7'}15, transparent 60%)`, zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: `linear-gradient(135deg, ${program?.color || '#a855f7'}40, rgba(30, 20, 60, 0.9))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', border: `2px solid ${program?.color || '#a855f7'}50` }}>{game.image}</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>{game.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#a855f7' }}>{game.genre}</span>
                <span style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px', background: `${program?.color || '#a855f7'}20`, color: program?.color || '#a855f7' }}>{sku?.fullName}</span>
                <span style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Build {buildId}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
            {[{ v: metrics.avgFps, l: 'Avg FPS', c: getFpsColor(metrics.avgFps) }, { v: metrics.onePercentLow, l: '1% Low', c: getFpsColor(metrics.onePercentLow) }, { v: metrics.pointOnePercentLow, l: '0.1% Low', c: getFpsColor(metrics.pointOnePercentLow) }, { v: `${metrics.avgCpuUsage}%`, l: 'CPU Usage', c: '#06b6d4' }, { v: `${metrics.avgPackageTemp}°C`, l: 'Avg Temp', c: '#f59e0b' }, { v: `${metrics.avgPower}W`, l: 'Avg Power', c: '#ec4899' }].map(({ v, l, c }) => (
              <div key={l} style={{ background: 'rgba(20, 15, 45, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(139, 92, 246, 0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0 40px 40px' }}>
        {/* Frame Time Analysis */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Clock size={20} style={{ color: '#a855f7' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Frame Time Analysis</span></div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {frameTimeModes.map(mode => (
                <button key={mode.id} onClick={() => setFrameTimeMode(mode.id)} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s', background: frameTimeMode === mode.id ? `${mode.color}30` : 'rgba(30, 20, 60, 0.5)', color: frameTimeMode === mode.id ? mode.color : '#94a3b8', border: frameTimeMode === mode.id ? `1px solid ${mode.color}50` : '1px solid transparent' }}>{mode.label}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={detailedFrameTimeData}>
              <defs><linearGradient id="detailFtGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={currentFrameTimeMode.color} stopOpacity={0.4}/><stop offset="95%" stopColor={currentFrameTimeMode.color} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={frameTimeMode === 'fps' ? ['auto', 'auto'] : [0, 'auto']} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: `1px solid ${currentFrameTimeMode.color}50`, borderRadius: '8px', padding: '12px 16px' }}><p style={{ fontSize: '12px', color: currentFrameTimeMode.color, marginBottom: '4px', fontWeight: 600 }}>Frame {payload[0].payload.frame}</p><p style={{ fontSize: '16px', color: '#f1f5f9', margin: 0, fontWeight: 700 }}>{payload[0].value.toFixed(2)} {frameTimeMode === 'fps' ? 'FPS' : 'ms'}</p></div> : null} />
              <Area type="monotone" dataKey={frameTimeMode} stroke={currentFrameTimeMode.color} strokeWidth={2} fill="url(#detailFtGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Per-Core Frequency */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><Cpu size={20} style={{ color: '#06b6d4' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Per-Core Frequency Analysis</span></div>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <div><span style={{ fontSize: '12px', color: '#a855f7', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', display: 'block' }}>P-Cores ({pCores})</span><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{Array.from({ length: pCores }, (_, i) => <button key={`p${i}`} onClick={() => toggleCore('p', i)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: selectedCores.pCores.includes(i) ? pCoreColors[i % pCoreColors.length] : 'rgba(30, 20, 60, 0.5)', color: selectedCores.pCores.includes(i) ? '#fff' : '#64748b' }}>P{i}</button>)}</div></div>
            <div><span style={{ fontSize: '12px', color: '#10b981', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', display: 'block' }}>E-Cores ({eCores})</span><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{Array.from({ length: eCores }, (_, i) => <button key={`e${i}`} onClick={() => toggleCore('e', i)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: selectedCores.eCores.includes(i) ? eCoreColors[i % eCoreColors.length] : 'rgba(30, 20, 60, 0.5)', color: selectedCores.eCores.includes(i) ? '#fff' : '#64748b' }}>E{i}</button>)}</div></div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={perCoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[2500, 6000]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '12px 16px' }}><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Time: {label}s</p>{payload.map((entry, i) => <p key={i} style={{ fontSize: '13px', color: entry.color, margin: '4px 0', fontWeight: 500 }}>{entry.name}: {Math.round(entry.value)} MHz</p>)}</div> : null} />
              {selectedCores.pCores.map(i => <Line key={`pCore${i}`} type="monotone" dataKey={`pCore${i}`} name={`P-Core ${i}`} stroke={pCoreColors[i % pCoreColors.length]} strokeWidth={2} dot={false} />)}
              {selectedCores.eCores.map(i => <Line key={`eCore${i}`} type="monotone" dataKey={`eCore${i}`} name={`E-Core ${i}`} stroke={eCoreColors[i % eCoreColors.length]} strokeWidth={2} dot={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* CPU Residency */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><Activity size={20} style={{ color: '#3b82f6' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>CPU Residency vs. Relative Time</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={cpuResidencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 25]} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(59, 130, 246, 0.5)', borderRadius: '8px', padding: '12px 16px' }}><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Time: {payload[0].payload.time} ms</p><p style={{ fontSize: '14px', color: '#3b82f6', margin: 0, fontWeight: 600 }}>Residency: {payload[0].payload.residency}</p></div> : null} />
              <Scatter dataKey="residency" fill="#3b82f6" />
              <Line type="monotone" dataKey="trendLine" stroke="#1e40af" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Performance Capability */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><Gauge size={20} style={{ color: '#10b981' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Performance Capability & C-State</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={performanceCapabilityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[40, 120]} />
              <Tooltip />
              <Line type="monotone" dataKey="capability" name="Capability" stroke="#10b981" strokeWidth={2} dot={false} />
              <Scatter dataKey="c0Active" name="C0 Active" fill="#06b6d4" />
              <Scatter dataKey="c1" name="C1" fill="#8b5cf6" />
              <Scatter dataKey="c6" name="C6" fill="#f59e0b" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Clip Reason */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><AlertTriangle size={20} style={{ color: '#ec4899' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>IA Clip Reason</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 60000]} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0.5, 6.5]} ticks={[1, 2, 3, 4, 5, 6]} tickFormatter={(v) => ({ 1: 'MAX_TURBO', 2: 'PBM_PL1', 3: 'PL1;MAX_TURBO', 4: 'PBM_PL2', 5: 'PL2;MAX_TURBO', 6: 'THERMAL' }[v] || '')} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(236, 72, 153, 0.5)', borderRadius: '8px', padding: '12px 16px' }}><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Time: {payload[0].payload.time} ms</p><p style={{ fontSize: '14px', color: clipReasonColors[payload[0].payload.reason], margin: 0, fontWeight: 600 }}>{payload[0].payload.reason}</p></div> : null} />
              <Scatter data={clipReasonData} shape={(props) => props.cx && props.cy ? <circle cx={props.cx} cy={props.cy} r={4} fill={clipReasonColors[props.payload.reason] || '#ec4899'} fillOpacity={0.8} /> : null} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Per-Core Temperature */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><Thermometer size={20} style={{ color: '#f43f5e' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Per-Core Temperature</span></div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {Array.from({ length: Math.min(tempCoreCount, 16) }, (_, i) => <button key={`temp${i}`} onClick={() => toggleTempCore(i)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500, background: selectedTempCores.includes(i) ? tempCoreColors[i % tempCoreColors.length] : 'rgba(30, 20, 60, 0.5)', color: selectedTempCores.includes(i) ? '#fff' : '#64748b' }}>C{i}</button>)}
            <button onClick={() => toggleTempCore('package')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: selectedTempCores.includes('package') ? '#f43f5e' : 'rgba(30, 20, 60, 0.5)', color: selectedTempCores.includes('package') ? '#fff' : '#64748b' }}>Package</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={perCoreTemperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[55, 100]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '12px 16px', maxHeight: '200px', overflowY: 'auto' }}><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Time: {label}s</p>{payload.map((entry, i) => <p key={i} style={{ fontSize: '12px', color: entry.color, margin: '2px 0', fontWeight: 500 }}>{entry.name}: {entry.value}°C</p>)}</div> : null} />
              {selectedTempCores.filter(c => c !== 'package').map(i => <Line key={`core${i}`} type="monotone" dataKey={`core${i}`} name={`Core ${i}`} stroke={tempCoreColors[i % tempCoreColors.length]} strokeWidth={1.5} dot={false} />)}
              {selectedTempCores.includes('package') && <Line type="monotone" dataKey="package" name="Package" stroke="#f43f5e" strokeWidth={3} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Power */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><Zap size={20} style={{ color: '#f59e0b' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Power Analysis</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={powerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 120]} />
              <Tooltip />
              <Scatter dataKey="iaPower" name="IA Power" fill="#3b82f6" />
              <Scatter dataKey="packagePower" name="Package Power" fill="#7c3aed" />
              <Line type="monotone" dataKey="iaTrendLine" name="IA Trend" stroke="#1e40af" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pkgTrendLine" name="Pkg Trend" stroke="#4c1d95" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Build Trend */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}><Activity size={20} style={{ color: '#10b981' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Build-over-Build Trend</span><DeltaBadge delta={delta} deltaPercent={deltaPercent} /></div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={trendData}>
              <defs><linearGradient id="detailTrendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.4}/><stop offset="95%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="build" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip content={<TrendTooltip />} />
              <Area type="monotone" dataKey="avgFps" stroke={delta >= 0 ? '#10b981' : '#ef4444'} strokeWidth={3} fill="url(#detailTrendGrad)" dot={{ r: 6, fill: delta >= 0 ? '#10b981' : '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* System Configuration */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><Settings size={20} style={{ color: '#a855f7' }} /><span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>System Configuration</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <ConfigSection title="CPU" icon={Cpu}><ConfigRow label="Processor" value={systemConfig.cpu.name} highlight="#a855f7" /><ConfigRow label="Cores" value={systemConfig.cpu.cores} /><ConfigRow label="Boost" value={systemConfig.cpu.boostClock} highlight="#10b981" /><ConfigRow label="TDP" value={systemConfig.cpu.tdp} /></ConfigSection>
            <ConfigSection title="Memory" icon={MemoryStick}><ConfigRow label="Type" value={systemConfig.memory.type} highlight="#ec4899" /><ConfigRow label="Capacity" value={systemConfig.memory.capacity} /><ConfigRow label="Timings" value={systemConfig.memory.timings} /></ConfigSection>
            <ConfigSection title="GPU" icon={Monitor}><ConfigRow label="Model" value={systemConfig.gpu.name} highlight="#10b981" /><ConfigRow label="Driver" value={systemConfig.gpu.driver} highlight="#f59e0b" /><ConfigRow label="VRAM" value={systemConfig.gpu.vram} /></ConfigSection>
            <ConfigSection title="BIOS" icon={Layers}><ConfigRow label="Version" value={systemConfig.bios.version} highlight="#06b6d4" /><ConfigRow label="Date" value={systemConfig.bios.date} /><ConfigRow label="Mode" value={systemConfig.bios.mode} /></ConfigSection>
            <ConfigSection title="OS" icon={HardDrive}><ConfigRow label="Name" value={systemConfig.os.name} highlight="#06b6d4" /><ConfigRow label="Build" value={systemConfig.os.build} /><ConfigRow label="DirectX" value={systemConfig.os.directX} /></ConfigSection>
            <ConfigSection title="Test Settings" icon={Settings}><ConfigRow label="Resolution" value={systemConfig.testSettings.resolution} highlight="#a855f7" /><ConfigRow label="Preset" value={systemConfig.testSettings.preset} /><ConfigRow label="DLSS" value={systemConfig.testSettings.dlss} /></ConfigSection>
          </div>
        </div>
      </div>
    </div>
  );
};
// Game Overlay Component - Slides in with game sidebar
const GameOverlay = ({ game, skuId, buildId, onClose, allGames, onSwitchGame, selectedSku, selectedBuild }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const program = programs.find(p => p.skus.some(s => s.id === skuId));
  
  const filteredGames = allGames.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }} />
      
      {/* Game Sidebar */}
      <div style={{ position: 'relative', width: '300px', height: '100%', background: 'linear-gradient(180deg, rgba(20, 15, 45, 0.98) 0%, rgba(15, 10, 35, 0.98) 100%)', borderRight: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', flexDirection: 'column', animation: 'slideInLeft 0.3s ease-out' }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(139, 92, 246, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Gamepad2 size={20} style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>All Games</span>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', color: '#a855f7' }}>{allGames.length}</span>
          </div>
          
          {/* Current Selection Info */}
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Current Config</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', padding: '2px 8px', borderRadius: '6px', background: `${program?.color || '#a855f7'}30`, color: program?.color || '#a855f7', fontWeight: 500 }}>{selectedSku?.name}</span>
              <span style={{ fontSize: '13px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 500 }}>{selectedBuild}</span>
            </div>
          </div>
          
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Search games..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'rgba(30, 20, 60, 0.6)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', padding: '10px 36px 10px 12px', fontSize: '14px', color: '#f1f5f9', outline: 'none' }} />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          </div>
        </div>
        
        {/* Game List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {filteredGames.map(g => {
            const metrics = generateGameMetricsForBuild(g.id, skuId, buildId);
            const isActive = g.id === game.id;
            const { delta } = getBuildTrend(g.id, skuId, buildId);
            
            return (
              <div key={g.id} onClick={() => onSwitchGame(g)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '4px', background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent', border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent', transition: 'all 0.15s ease' }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{g.image}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500, color: isActive ? '#f1f5f9' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{g.genre}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: getFpsColor(metrics.avgFps) }}>{metrics.avgFps}</div>
                  <div style={{ fontSize: '10px', color: delta >= 0 ? '#10b981' : '#ef4444' }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer hint */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', padding: '2px 6px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '4px' }}>ESC</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>to close</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ position: 'relative', flex: 1, height: '100%', overflowY: 'auto', background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)', animation: 'slideInRight 0.3s ease-out' }}>
        {/* Close Button */}
        <button onClick={onClose} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1001, width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: 'rgba(239, 68, 68, 0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}>
          <X size={22} style={{ color: '#ef4444' }} />
        </button>
        
        <DetailedAnalysisPage game={game} skuId={skuId} buildId={buildId} />
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};
// Landing Page Component
const LandingPage = ({ onNavigate }) => {
  const getAllSkuData = () => {
    const data = [];
    programs.forEach(program => {
      program.skus.forEach(sku => {
        const buildData = builds.map(build => ({ build, index: calculatePerformanceIndex(sku.id, build) }));
        const latest = buildData[0].index, previous = buildData[1]?.index || latest;
        data.push({ program, sku, buildData: buildData.slice().reverse(), latestIndex: latest, delta: latest - previous, deltaPercent: ((latest - previous) / previous) * 100 });
      });
    });
    return data;
  };
  const skuData = getAllSkuData();

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '40px', fontWeight: 700, background: 'linear-gradient(90deg, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>Performance Index Trends Across SKUs</h1>
        <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>Aggregate gaming performance index across all {games.length} games</p>
      </div>

      {programs.map(program => (
        <div key={program.id} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '28px' }}>{program.icon}</span>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 600, color: '#f1f5f9' }}>{program.name}</h2>
            <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: `${program.color}20`, color: program.color }}>{program.codename}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(program.skus.length, 4)}, 1fr)`, gap: '16px' }}>
            {skuData.filter(d => d.program.id === program.id).map(({ sku, buildData, latestIndex, delta, deltaPercent }) => (
              <div key={sku.id} onClick={() => onNavigate(program, sku)} style={{ background: 'rgba(20, 15, 45, 0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(139, 92, 246, 0.15)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${program.color}50`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div><h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: program.color }}>{sku.name}</h3><p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{sku.fullName}</p></div>
                  <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Performance Index</div>
                  <div style={{ fontSize: '42px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{latestIndex}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>avg FPS across {games.length} games</div>
                </div>
                <div style={{ height: '60px', marginBottom: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={buildData}>
                      <defs><linearGradient id={`landingGrad-${sku.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={program.color} stopOpacity={0.3}/><stop offset="95%" stopColor={program.color} stopOpacity={0}/></linearGradient></defs>
                      <XAxis dataKey="build" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip content={({ active, payload }) => active && payload?.length ? <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: `1px solid ${program.color}50`, borderRadius: '8px', padding: '8px 12px' }}><p style={{ fontSize: '10px', color: program.color, marginBottom: '4px', fontWeight: 600 }}>Build {payload[0].payload.build}</p><p style={{ fontSize: '14px', color: '#f1f5f9', margin: 0, fontWeight: 700 }}>{payload[0].value} avg FPS</p></div> : null} />
                      <Area type="monotone" dataKey="index" stroke={program.color} strokeWidth={2} fill={`url(#landingGrad-${sku.id})`} dot={{ r: 3, fill: program.color, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#94a3b8' }}>{sku.cores}</span>
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#94a3b8' }}>{sku.tdp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Dashboard Component
export default function GamingDashboard() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedProgram, setSelectedProgram] = useState(programs[0]);
  const [selectedSku, setSelectedSku] = useState(programs[0].skus[0]);
  const [selectedBuild, setSelectedBuild] = useState(builds[0]);
  const [expandedGame, setExpandedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc');
  const [overlayGame, setOverlayGame] = useState(null);

  // Close overlay on Escape
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && overlayGame) setOverlayGame(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overlayGame]);

  const filteredGames = games
    .filter(game => game.name.toLowerCase().includes(searchQuery.toLowerCase()) || game.genre.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const metricsA = generateGameMetricsForBuild(a.id, selectedSku.id, selectedBuild);
      const metricsB = generateGameMetricsForBuild(b.id, selectedSku.id, selectedBuild);
      const { delta: deltaA } = getBuildTrend(a.id, selectedSku.id, selectedBuild);
      const { delta: deltaB } = getBuildTrend(b.id, selectedSku.id, selectedBuild);
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'fps-desc': return metricsB.avgFps - metricsA.avgFps;
        case 'fps-asc': return metricsA.avgFps - metricsB.avgFps;
        case '1low-desc': return metricsB.onePercentLow - metricsA.onePercentLow;
        case '1low-asc': return metricsA.onePercentLow - metricsB.onePercentLow;
        case 'delta-desc': return deltaB - deltaA;
        case 'delta-asc': return deltaA - deltaB;
        default: return 0;
      }
    });

  const handleProgramSelect = (program) => { setSelectedProgram(program); setSelectedSku(program.skus[0]); setExpandedGame(null); };
  const handleNavigateToDetail = (program, sku) => { setSelectedProgram(program); setSelectedSku(sku); setCurrentView('detail'); };
  const handleNavigateToLanding = () => { setCurrentView('landing'); setExpandedGame(null); };
  const handleOpenDetail = (game) => setOverlayGame({ game, skuId: selectedSku.id, buildId: selectedBuild });
  const handleCloseOverlay = () => setOverlayGame(null);
  const handleSwitchGame = (game) => setOverlayGame({ game, skuId: selectedSku.id, buildId: selectedBuild });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)', color: 'white', fontFamily: "'Space Grotesk', sans-serif", overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{ position: 'relative', display: 'flex', zIndex: 1, height: '100vh' }}>
        {/* Sidebar */}
        <aside style={{ width: sidebarCollapsed ? '72px' : '260px', minHeight: '100vh', background: 'linear-gradient(180deg, rgba(20, 15, 45, 0.95) 0%, rgba(15, 10, 35, 0.98) 100%)', borderRight: '1px solid rgba(139, 92, 246, 0.15)', padding: sidebarCollapsed ? '24px 12px' : '24px', display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden', flexShrink: 0 }}>
          {/* Logo */}
          <div onClick={handleNavigateToLanding} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', cursor: 'pointer', padding: '8px', marginLeft: '-8px', marginRight: '-8px', borderRadius: '12px', transition: 'background 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #a855f7, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)', flexShrink: 0 }}><Gauge size={22} style={{ color: 'white' }} /></div>
            {!sidebarCollapsed && <div><h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, background: 'linear-gradient(90deg, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap' }}>Intel SIV Gaming</h1><p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>Performance Lab</p></div>}
          </div>

          {/* Collapse Toggle */}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ position: 'absolute', top: '32px', right: sidebarCollapsed ? '50%' : '-12px', transform: sidebarCollapsed ? 'translateX(50%)' : 'none', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.3)', border: '1px solid rgba(139, 92, 246, 0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', zIndex: 10 }}>
            <ChevronRight size={14} style={{ color: '#a855f7', transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease' }} />
          </button>

          {/* Programs */}
          <div style={{ marginBottom: '24px' }}>
            {!sidebarCollapsed && <h2 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '8px' }}>Programs</h2>}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {programs.map((program) => (
                <button key={program.id} onClick={() => { handleProgramSelect(program); setCurrentView('detail'); }} title={sidebarCollapsed ? program.name : ''}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: sidebarCollapsed ? '12px 8px' : '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', background: selectedProgram.id === program.id && currentView === 'detail' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', borderLeft: selectedProgram.id === program.id && currentView === 'detail' ? `3px solid ${program.color}` : '3px solid transparent', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>{program.icon}</span>
                  {!sidebarCollapsed && <div style={{ textAlign: 'left', flex: 1 }}><div style={{ fontSize: '16px', fontWeight: 500, color: selectedProgram.id === program.id && currentView === 'detail' ? '#f1f5f9' : '#94a3b8' }}>{program.name}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{program.skus.length} SKUs</div></div>}
                </button>
              ))}
            </nav>
          </div>

          {/* Build Version */}
          {currentView === 'detail' && !sidebarCollapsed && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '8px' }}>Build Version</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {builds.map((build) => (
                  <button key={build} onClick={() => setSelectedBuild(build)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', background: selectedBuild === build ? 'rgba(139, 92, 246, 0.2)' : 'transparent', borderLeft: selectedBuild === build ? '3px solid #a855f7' : '3px solid transparent' }}>
                    <span style={{ fontSize: '15px', fontWeight: selectedBuild === build ? 600 : 400, color: selectedBuild === build ? '#f1f5f9' : '#94a3b8' }}>{build}</span>
                    {selectedBuild === build && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7' }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: sidebarCollapsed ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(30, 20, 60, 0.5)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}><div style={{ fontSize: sidebarCollapsed ? '18px' : '24px', fontWeight: 700, color: '#a855f7' }}>{games.length}</div>{!sidebarCollapsed && <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Games</div>}</div>
              {!sidebarCollapsed && <div style={{ background: 'rgba(30, 20, 60, 0.5)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#06b6d4' }}>{builds.length}</div><div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Builds</div></div>}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, height: '100vh', overflowY: 'auto', overflowX: 'hidden', scrollBehavior: 'smooth' }}>
          {currentView === 'landing' ? (
            <LandingPage onNavigate={handleNavigateToDetail} />
          ) : (
            <div style={{ padding: '32px' }}>
              {/* Header */}
              <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <button onClick={handleNavigateToLanding} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}><ArrowLeft size={16} />Overview</button>
                    <span style={{ fontSize: '28px' }}>{selectedProgram.icon}</span>
                    <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#f1f5f9' }}>{selectedProgram.name}</h1>
                    <span style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, background: `${selectedProgram.color}20`, color: selectedProgram.color }}>{selectedProgram.codename}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>Gaming performance analysis · Build <span style={{ color: '#a855f7' }}>{selectedBuild}</span></p>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="Search games..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '260px', background: 'rgba(30, 20, 60, 0.6)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '10px', padding: '12px 44px 12px 16px', fontSize: '15px', color: '#f1f5f9', outline: 'none' }} />
                  <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                </div>
              </header>

              {/* SKU Selection */}
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#94a3b8', marginBottom: '16px' }}>Select SKU</h2>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedProgram.skus.length, 5)}, 1fr)`, gap: '12px' }}>
                  {selectedProgram.skus.map((sku) => <SKUCard key={sku.id} sku={sku} program={selectedProgram} isSelected={selectedSku.id === sku.id} onClick={() => { setSelectedSku(sku); setExpandedGame(null); }} />)}
                </div>
              </section>

              {/* Game Results */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#94a3b8', margin: 0 }}>Performance Results · <span style={{ color: '#f1f5f9' }}>{selectedSku.fullName}</span></h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Sort:</span>
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(20, 15, 45, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                      <button onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: sortBy.startsWith('name') ? 'rgba(139, 92, 246, 0.3)' : 'transparent', color: sortBy.startsWith('name') ? '#a855f7' : '#64748b' }}>{sortBy === 'name-desc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />}<span>Name</span></button>
                      <button onClick={() => setSortBy(sortBy === 'fps-desc' ? 'fps-asc' : 'fps-desc')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: sortBy.startsWith('fps') ? 'rgba(16, 185, 129, 0.3)' : 'transparent', color: sortBy.startsWith('fps') ? '#10b981' : '#64748b' }}>{sortBy === 'fps-asc' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}<span>FPS</span></button>
                      <button onClick={() => setSortBy(sortBy === '1low-desc' ? '1low-asc' : '1low-desc')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: sortBy.startsWith('1low') ? 'rgba(6, 182, 212, 0.3)' : 'transparent', color: sortBy.startsWith('1low') ? '#06b6d4' : '#64748b' }}>{sortBy === '1low-asc' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}<span>1%</span></button>
                      <button onClick={() => setSortBy(sortBy === 'delta-desc' ? 'delta-asc' : 'delta-desc')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: sortBy.startsWith('delta') ? 'rgba(245, 158, 11, 0.3)' : 'transparent', color: sortBy.startsWith('delta') ? '#f59e0b' : '#64748b' }}>{sortBy === 'delta-asc' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}<span>Δ</span></button>
                    </div>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{filteredGames.length} games</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredGames.map((game) => {
                    const metrics = generateGameMetricsForBuild(game.id, selectedSku.id, selectedBuild);
                    return <GameCard key={game.id} game={game} metrics={metrics} isExpanded={expandedGame === game.id} onToggle={() => setExpandedGame(expandedGame === game.id ? null : game.id)} skuId={selectedSku.id} currentBuild={selectedBuild} onOpenDetail={handleOpenDetail} />;
                  })}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Game Detail Overlay */}
      {overlayGame && (
        <GameOverlay
          game={overlayGame.game}
          skuId={overlayGame.skuId}
          buildId={overlayGame.buildId}
          onClose={handleCloseOverlay}
          allGames={filteredGames}
          onSwitchGame={handleSwitchGame}
          selectedSku={selectedSku}
          selectedBuild={selectedBuild}
        />
      )}
    </div>
  );
}
