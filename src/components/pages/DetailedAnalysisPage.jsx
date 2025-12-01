import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter, ComposedChart } from 'recharts';
import { Clock, Cpu, Activity, Gauge, AlertTriangle, Thermometer, Zap, Settings, Monitor, HardDrive, MemoryStick, Layers } from 'lucide-react';
import { programs } from '../../data';
import {
  getFpsColor,
  pCoreColors,
  eCoreColors,
  tempCoreColors,
  clipReasonColors,
  generateDetailedFrameTimeData,
  generatePerCoreFrequencyData,
  generateCpuResidencyData,
  generatePerformanceCapabilityData,
  generateClipReasonData,
  generatePerCoreTemperatureData,
  generatePowerData,
  generateSystemConfig,
  generateGameMetricsForBuild,
  getBuildTrend
} from '../../utils';
import { TrendTooltip, CpuResidencyTooltip, PerformanceCapabilityTooltip, PowerAnalysisTooltip } from '../charts/tooltips';
import DeltaBadge from '../common/DeltaBadge';
import GameImage from '../common/GameImage';

// Config Section Component
const ConfigSection = ({ title, icon: Icon, children }) => (
  <div style={{
    background: 'rgba(15, 10, 35, 0.7)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(139, 92, 246, 0.15)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <Icon size={18} style={{ color: '#a855f7' }} />
      <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
    </div>
    {children}
  </div>
);

// Config Row Component
const ConfigRow = ({ label, value, highlight }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(139, 92, 246, 0.08)'
  }}>
    <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: 500, color: highlight || '#e2e8f0' }}>{value}</span>
  </div>
);

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
    { id: 'frameTime', label: 'Frame Time', color: '#a855f7' },
    { id: 'fps', label: 'FPS', color: '#10b981' },
    { id: 'percentile95', label: '95th %', color: '#f59e0b' },
    { id: 'percentile99', label: '99th %', color: '#ef4444' },
    { id: 'onePercentLow', label: '1% Low', color: '#06b6d4' },
    { id: 'movingAvg', label: 'Moving Avg', color: '#8b5cf6' }
  ];

  const currentFrameTimeMode = frameTimeModes.find(m => m.id === frameTimeMode);

  const toggleCore = (type, index) => setSelectedCores(prev => {
    const key = type === 'p' ? 'pCores' : 'eCores';
    return { ...prev, [key]: prev[key].includes(index) ? prev[key].filter(i => i !== index) : [...prev[key], index] };
  });

  const toggleTempCore = (index) => setSelectedTempCores(prev =>
    prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)',
      color: 'white',
      fontFamily: "'Space Grotesk', sans-serif"
    }}>
      {/* Header */}
      <div style={{ position: 'relative', padding: '40px', paddingBottom: '60px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${program?.color || '#a855f7'}15, transparent 60%)`,
          zIndex: 0
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <GameImage 
              game={game} 
              size={80} 
              borderRadius={16}
              style={{ border: `2px solid ${program?.color || '#a855f7'}50` }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
                {game.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#a855f7' }}>
                  {game.genre}
                </span>
                <span style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px', background: `${program?.color || '#a855f7'}20`, color: program?.color || '#a855f7' }}>
                  {sku?.fullName}
                </span>
                <span style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                  Build {buildId}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
            {[
              { v: metrics.avgFps, l: 'Avg FPS', c: getFpsColor(metrics.avgFps) },
              { v: metrics.onePercentLow, l: '1% Low', c: getFpsColor(metrics.onePercentLow) },
              { v: metrics.pointOnePercentLow, l: '0.1% Low', c: getFpsColor(metrics.pointOnePercentLow) },
              { v: `${metrics.avgCpuUsage}%`, l: 'CPU Usage', c: '#06b6d4' },
              { v: `${metrics.avgPackageTemp}°C`, l: 'Avg Temp', c: '#f59e0b' },
              { v: `${metrics.avgPower}W`, l: 'Avg Power', c: '#ec4899' }
            ].map(({ v, l, c }) => (
              <div key={l} style={{
                background: 'rgba(20, 15, 45, 0.7)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 40px 40px' }}>
        {/* Frame Time Analysis */}
        <div style={{
          background: 'rgba(15, 10, 35, 0.7)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} style={{ color: '#a855f7' }} />
              <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Frame Time Analysis</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {frameTimeModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setFrameTimeMode(mode.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    background: frameTimeMode === mode.id ? `${mode.color}30` : 'rgba(30, 20, 60, 0.5)',
                    color: frameTimeMode === mode.id ? mode.color : '#94a3b8',
                    border: frameTimeMode === mode.id ? `1px solid ${mode.color}50` : '1px solid transparent'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={detailedFrameTimeData}>
              <defs>
                <linearGradient id="detailFtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentFrameTimeMode.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={currentFrameTimeMode.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={frameTimeMode === 'fps' ? ['auto', 'auto'] : [0, 'auto']} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: `1px solid ${currentFrameTimeMode.color}50`, borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '12px', color: currentFrameTimeMode.color, marginBottom: '4px', fontWeight: 600 }}>Frame {payload[0].payload.frame}</p>
                  <p style={{ fontSize: '16px', color: '#f1f5f9', margin: 0, fontWeight: 700 }}>{payload[0].value.toFixed(2)} {frameTimeMode === 'fps' ? 'FPS' : 'ms'}</p>
                </div>
              ) : null} />
              <Area type="monotone" dataKey={frameTimeMode} stroke={currentFrameTimeMode.color} strokeWidth={2} fill="url(#detailFtGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Core Frequency */}
        <div style={{
          background: 'rgba(15, 10, 35, 0.7)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Cpu size={20} style={{ color: '#06b6d4' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Per-Core Frequency Analysis</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#a855f7', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', display: 'block' }}>P-Cores ({pCores})</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Array.from({ length: pCores }, (_, i) => (
                  <button
                    key={`p${i}`}
                    onClick={() => toggleCore('p', i)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: selectedCores.pCores.includes(i) ? pCoreColors[i % pCoreColors.length] : 'rgba(30, 20, 60, 0.5)',
                      color: selectedCores.pCores.includes(i) ? '#fff' : '#64748b'
                    }}
                  >
                    P{i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#10b981', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', display: 'block' }}>E-Cores ({eCores})</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Array.from({ length: eCores }, (_, i) => (
                  <button
                    key={`e${i}`}
                    onClick={() => toggleCore('e', i)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: selectedCores.eCores.includes(i) ? eCoreColors[i % eCoreColors.length] : 'rgba(30, 20, 60, 0.5)',
                      color: selectedCores.eCores.includes(i) ? '#fff' : '#64748b'
                    }}
                  >
                    E{i}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={perCoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[2500, 6000]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Time: {label}s</p>
                  {payload.map((entry, i) => <p key={i} style={{ fontSize: '13px', color: entry.color, margin: '4px 0', fontWeight: 500 }}>{entry.name}: {Math.round(entry.value)} MHz</p>)}
                </div>
              ) : null} />
              {selectedCores.pCores.map(i => <Line key={`pCore${i}`} type="monotone" dataKey={`pCore${i}`} name={`P-Core ${i}`} stroke={pCoreColors[i % pCoreColors.length]} strokeWidth={2} dot={false} />)}
              {selectedCores.eCores.map(i => <Line key={`eCore${i}`} type="monotone" dataKey={`eCore${i}`} name={`E-Core ${i}`} stroke={eCoreColors[i % eCoreColors.length]} strokeWidth={2} dot={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CPU Residency */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Activity size={20} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>CPU Residency vs. Relative Time</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={cpuResidencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 25]} />
              <Tooltip content={<CpuResidencyTooltip />} />
              <Scatter dataKey="residency" fill="#3b82f6" />
              <Line type="monotone" dataKey="trendLine" stroke="#1e40af" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Capability */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Gauge size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Performance Capability & C-State</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={performanceCapabilityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[40, 120]} />
              <Tooltip content={<PerformanceCapabilityTooltip />} />
              <Line type="monotone" dataKey="capability" name="Capability" stroke="#10b981" strokeWidth={2} dot={false} />
              <Scatter dataKey="c0Active" name="C0 Active" fill="#06b6d4" />
              <Scatter dataKey="c1" name="C1" fill="#8b5cf6" />
              <Scatter dataKey="c6" name="C6" fill="#f59e0b" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Clip Reason */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <AlertTriangle size={20} style={{ color: '#ec4899' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>IA Clip Reason</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 60000]} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0.5, 6.5]} ticks={[1, 2, 3, 4, 5, 6]} tickFormatter={(v) => ({ 1: 'MAX_TURBO', 2: 'PBM_PL1', 3: 'PL1;MAX_TURBO', 4: 'PBM_PL2', 5: 'PL2;MAX_TURBO', 6: 'THERMAL' }[v] || '')} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(236, 72, 153, 0.5)', borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Time: {payload[0].payload.time} ms</p>
                  <p style={{ fontSize: '14px', color: clipReasonColors[payload[0].payload.reason], margin: 0, fontWeight: 600 }}>{payload[0].payload.reason}</p>
                </div>
              ) : null} />
              <Scatter data={clipReasonData} shape={(props) => props.cx && props.cy ? <circle cx={props.cx} cy={props.cy} r={4} fill={clipReasonColors[props.payload.reason] || '#ec4899'} fillOpacity={0.8} /> : null} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Core Temperature */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Thermometer size={20} style={{ color: '#f43f5e' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Per-Core Temperature</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {Array.from({ length: Math.min(tempCoreCount, 16) }, (_, i) => (
              <button key={`temp${i}`} onClick={() => toggleTempCore(i)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500, background: selectedTempCores.includes(i) ? tempCoreColors[i % tempCoreColors.length] : 'rgba(30, 20, 60, 0.5)', color: selectedTempCores.includes(i) ? '#fff' : '#64748b' }}>C{i}</button>
            ))}
            <button onClick={() => toggleTempCore('package')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: selectedTempCores.includes('package') ? '#f43f5e' : 'rgba(30, 20, 60, 0.5)', color: selectedTempCores.includes('package') ? '#fff' : '#64748b' }}>Package</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={perCoreTemperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[55, 100]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '12px 16px', maxHeight: '200px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Time: {label}s</p>
                  {payload.map((entry, i) => <p key={i} style={{ fontSize: '12px', color: entry.color, margin: '2px 0', fontWeight: 500 }}>{entry.name}: {entry.value}°C</p>)}
                </div>
              ) : null} />
              {selectedTempCores.filter(c => c !== 'package').map(i => <Line key={`core${i}`} type="monotone" dataKey={`core${i}`} name={`Core ${i}`} stroke={tempCoreColors[i % tempCoreColors.length]} strokeWidth={1.5} dot={false} />)}
              {selectedTempCores.includes('package') && <Line type="monotone" dataKey="package" name="Package" stroke="#f43f5e" strokeWidth={3} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Power */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Zap size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Power Analysis</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={powerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 120]} />
              <Tooltip content={<PowerAnalysisTooltip />} />
              <Scatter dataKey="iaPower" name="IA Power" fill="#3b82f6" />
              <Scatter dataKey="packagePower" name="Package Power" fill="#7c3aed" />
              <Line type="monotone" dataKey="iaTrendLine" name="IA Trend" stroke="#1e40af" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pkgTrendLine" name="Pkg Trend" stroke="#4c1d95" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Build Trend */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Activity size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Build-over-Build Trend</span>
            <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="detailTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Settings size={20} style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>System Configuration</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <ConfigSection title="CPU" icon={Cpu}>
              <ConfigRow label="Processor" value={systemConfig.cpu.name} highlight="#a855f7" />
              <ConfigRow label="Cores" value={systemConfig.cpu.cores} />
              <ConfigRow label="Boost" value={systemConfig.cpu.boostClock} highlight="#10b981" />
              <ConfigRow label="TDP" value={systemConfig.cpu.tdp} />
            </ConfigSection>
            <ConfigSection title="Memory" icon={MemoryStick}>
              <ConfigRow label="Type" value={systemConfig.memory.type} highlight="#ec4899" />
              <ConfigRow label="Capacity" value={systemConfig.memory.capacity} />
              <ConfigRow label="Timings" value={systemConfig.memory.timings} />
            </ConfigSection>
            <ConfigSection title="GPU" icon={Monitor}>
              <ConfigRow label="Model" value={systemConfig.gpu.name} highlight="#10b981" />
              <ConfigRow label="Driver" value={systemConfig.gpu.driver} highlight="#f59e0b" />
              <ConfigRow label="VRAM" value={systemConfig.gpu.vram} />
            </ConfigSection>
            <ConfigSection title="BIOS" icon={Layers}>
              <ConfigRow label="Version" value={systemConfig.bios.version} highlight="#06b6d4" />
              <ConfigRow label="Date" value={systemConfig.bios.date} />
              <ConfigRow label="Mode" value={systemConfig.bios.mode} />
            </ConfigSection>
            <ConfigSection title="OS" icon={HardDrive}>
              <ConfigRow label="Name" value={systemConfig.os.name} highlight="#06b6d4" />
              <ConfigRow label="Build" value={systemConfig.os.build} />
              <ConfigRow label="DirectX" value={systemConfig.os.directX} />
            </ConfigSection>
            <ConfigSection title="Test Settings" icon={Settings}>
              <ConfigRow label="Resolution" value={systemConfig.testSettings.resolution} highlight="#a855f7" />
              <ConfigRow label="Preset" value={systemConfig.testSettings.preset} />
              <ConfigRow label="DLSS" value={systemConfig.testSettings.dlss} />
            </ConfigSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalysisPage;
