import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ComposedChart, Scatter } from 'recharts';
import { Clock, Cpu, Thermometer, Zap, Activity } from 'lucide-react';
import {
  generateDetailedFrameTimeData,
  generatePerCoreFrequencyData,
  generatePerCoreTemperatureData,
  generatePowerData,
  pCoreColors,
  eCoreColors
} from '../../utils';

const ChartSection = ({ title, icon: Icon, children, color = '#a855f7' }) => (
  <div style={{
    background: 'rgba(15, 10, 35, 0.7)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(139, 92, 246, 0.15)'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px'
    }}>
      <Icon size={18} style={{ color }} />
      <span style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
    </div>
    {children}
  </div>
);

const ComparisonCharts = ({ leftSelection, rightSelection }) => {
  const leftSeed = leftSelection.game.id * 1000 + leftSelection.sku.id.charCodeAt(0);
  const rightSeed = rightSelection.game.id * 1000 + rightSelection.sku.id.charCodeAt(0);

  // Generate data for both sides
  const leftFrameTimeData = useMemo(() => generateDetailedFrameTimeData(leftSeed), [leftSeed]);
  const rightFrameTimeData = useMemo(() => generateDetailedFrameTimeData(rightSeed), [rightSeed]);

  const leftFreqData = useMemo(() => generatePerCoreFrequencyData(leftSelection.sku.id, leftSeed), [leftSelection.sku.id, leftSeed]);
  const rightFreqData = useMemo(() => generatePerCoreFrequencyData(rightSelection.sku.id, rightSeed), [rightSelection.sku.id, rightSeed]);

  const leftTempData = useMemo(() => generatePerCoreTemperatureData(leftSelection.sku.id, leftSeed), [leftSelection.sku.id, leftSeed]);
  const rightTempData = useMemo(() => generatePerCoreTemperatureData(rightSelection.sku.id, rightSeed), [rightSelection.sku.id, rightSeed]);

  const leftPowerData = useMemo(() => generatePowerData(leftSeed), [leftSeed]);
  const rightPowerData = useMemo(() => generatePowerData(rightSeed), [rightSeed]);

  // Merge frame time data for overlay comparison
  const mergedFrameTimeData = leftFrameTimeData.map((d, i) => ({
    frame: d.frame,
    leftFrameTime: d.frameTime,
    rightFrameTime: rightFrameTimeData[i]?.frameTime || 0,
    leftFps: d.fps,
    rightFps: rightFrameTimeData[i]?.fps || 0
  }));

  // Merge power data
  const mergedPowerData = leftPowerData.map((d, i) => ({
    time: d.time,
    leftIaPower: d.iaPower,
    rightIaPower: rightPowerData[i]?.iaPower || 0,
    leftPkgPower: d.packagePower,
    rightPkgPower: rightPowerData[i]?.packagePower || 0
  }));

  // Merge temp data (just package for simplicity)
  const mergedTempData = leftTempData.data.map((d, i) => ({
    time: d.time,
    leftPackage: d.package,
    rightPackage: rightTempData.data[i]?.package || 0
  }));

  const leftLabel = `${leftSelection.game.image} ${leftSelection.sku.name}`;
  const rightLabel = `${rightSelection.game.image} ${rightSelection.sku.name}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Frame Time Overlay */}
      <ChartSection title="Frame Time Comparison" icon={Clock} color="#a855f7">
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '12px',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', background: '#06b6d4', borderRadius: '2px' }} />
            <span style={{ color: '#94a3b8' }}>{leftLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', background: '#ec4899', borderRadius: '2px' }} />
            <span style={{ color: '#94a3b8' }}>{rightLabel}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={mergedFrameTimeData}>
            <defs>
              <linearGradient id="leftFtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rightFtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
            <XAxis dataKey="frame" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 'auto']} />
            <Tooltip
              content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{
                  background: 'rgba(15, 10, 40, 0.95)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Frame {label}</p>
                  <p style={{ fontSize: '13px', color: '#06b6d4', margin: '2px 0', fontWeight: 500 }}>
                    Left: {payload[0]?.value?.toFixed(2)} ms
                  </p>
                  <p style={{ fontSize: '13px', color: '#ec4899', margin: '2px 0', fontWeight: 500 }}>
                    Right: {payload[1]?.value?.toFixed(2)} ms
                  </p>
                </div>
              ) : null}
            />
            <Area type="monotone" dataKey="leftFrameTime" stroke="#06b6d4" strokeWidth={1.5} fill="url(#leftFtGrad)" dot={false} />
            <Area type="monotone" dataKey="rightFrameTime" stroke="#ec4899" strokeWidth={1.5} fill="url(#rightFtGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Side by Side FPS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <ChartSection title={`FPS - ${leftLabel}`} icon={Activity} color="#06b6d4">
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={leftFrameTimeData}>
              <defs>
                <linearGradient id="leftFpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="frame" hide />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid #06b6d4', borderRadius: '6px', padding: '8px 12px' }}>
                  <span style={{ color: '#06b6d4', fontWeight: 600 }}>{payload[0]?.value?.toFixed(1)} FPS</span>
                </div>
              ) : null} />
              <Area type="monotone" dataKey="fps" stroke="#06b6d4" strokeWidth={2} fill="url(#leftFpsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection title={`FPS - ${rightLabel}`} icon={Activity} color="#ec4899">
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={rightFrameTimeData}>
              <defs>
                <linearGradient id="rightFpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="frame" hide />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid #ec4899', borderRadius: '6px', padding: '8px 12px' }}>
                  <span style={{ color: '#ec4899', fontWeight: 600 }}>{payload[0]?.value?.toFixed(1)} FPS</span>
                </div>
              ) : null} />
              <Area type="monotone" dataKey="fps" stroke="#ec4899" strokeWidth={2} fill="url(#rightFpsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* Power Comparison */}
      <ChartSection title="Power Comparison" icon={Zap} color="#f59e0b">
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '12px',
          fontSize: '13px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', background: '#06b6d4', borderRadius: '2px' }} />
            <span style={{ color: '#94a3b8' }}>Left IA Power</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', background: '#0891b2', borderRadius: '2px' }} />
            <span style={{ color: '#94a3b8' }}>Left Package</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', background: '#ec4899', borderRadius: '2px' }} />
            <span style={{ color: '#94a3b8' }}>Right IA Power</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', background: '#be185d', borderRadius: '2px' }} />
            <span style={{ color: '#94a3b8' }}>Right Package</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mergedPowerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 'auto']} />
            <Tooltip
              content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{
                  background: 'rgba(15, 10, 40, 0.95)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Time: {label}s</p>
                  {payload.map((entry, i) => (
                    <p key={i} style={{ fontSize: '12px', color: entry.color, margin: '2px 0' }}>
                      {entry.name}: {entry.value?.toFixed(1)} W
                    </p>
                  ))}
                </div>
              ) : null}
            />
            <Line type="monotone" dataKey="leftIaPower" name="Left IA" stroke="#06b6d4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="leftPkgPower" name="Left Pkg" stroke="#0891b2" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="rightIaPower" name="Right IA" stroke="#ec4899" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="rightPkgPower" name="Right Pkg" stroke="#be185d" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Temperature Comparison */}
      <ChartSection title="Package Temperature Comparison" icon={Thermometer} color="#f43f5e">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={mergedTempData}>
            <defs>
              <linearGradient id="leftTempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rightTempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[50, 100]} />
            <Tooltip
              content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{
                  background: 'rgba(15, 10, 40, 0.95)',
                  border: '1px solid rgba(244, 63, 94, 0.5)',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Time: {label}s</p>
                  <p style={{ fontSize: '13px', color: '#06b6d4', margin: '2px 0' }}>Left: {payload[0]?.value}°C</p>
                  <p style={{ fontSize: '13px', color: '#ec4899', margin: '2px 0' }}>Right: {payload[1]?.value}°C</p>
                </div>
              ) : null}
            />
            <Area type="monotone" dataKey="leftPackage" stroke="#06b6d4" strokeWidth={2} fill="url(#leftTempGrad)" dot={false} />
            <Area type="monotone" dataKey="rightPackage" stroke="#ec4899" strokeWidth={2} fill="url(#rightTempGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Side by Side Frequency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <ChartSection title={`CPU Frequency - ${leftLabel}`} icon={Cpu} color="#06b6d4">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={leftFreqData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" hide />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[2500, 6000]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid #06b6d4', borderRadius: '6px', padding: '8px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Time: {label}s</p>
                  {payload.slice(0, 3).map((entry, i) => (
                    <p key={i} style={{ fontSize: '12px', color: entry.color, margin: '2px 0' }}>{entry.name}: {Math.round(entry.value)} MHz</p>
                  ))}
                </div>
              ) : null} />
              {Array.from({ length: Math.min(leftFreqData.pCores, 2) }, (_, i) => (
                <Line key={`p${i}`} type="monotone" dataKey={`pCore${i}`} name={`P${i}`} stroke={pCoreColors[i]} strokeWidth={1.5} dot={false} />
              ))}
              {Array.from({ length: Math.min(leftFreqData.eCores, 1) }, (_, i) => (
                <Line key={`e${i}`} type="monotone" dataKey={`eCore${i}`} name={`E${i}`} stroke={eCoreColors[i]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection title={`CPU Frequency - ${rightLabel}`} icon={Cpu} color="#ec4899">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={rightFreqData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" hide />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[2500, 6000]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid #ec4899', borderRadius: '6px', padding: '8px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Time: {label}s</p>
                  {payload.slice(0, 3).map((entry, i) => (
                    <p key={i} style={{ fontSize: '12px', color: entry.color, margin: '2px 0' }}>{entry.name}: {Math.round(entry.value)} MHz</p>
                  ))}
                </div>
              ) : null} />
              {Array.from({ length: Math.min(rightFreqData.pCores, 2) }, (_, i) => (
                <Line key={`p${i}`} type="monotone" dataKey={`pCore${i}`} name={`P${i}`} stroke={pCoreColors[i]} strokeWidth={1.5} dot={false} />
              ))}
              {Array.from({ length: Math.min(rightFreqData.eCores, 1) }, (_, i) => (
                <Line key={`e${i}`} type="monotone" dataKey={`eCore${i}`} name={`E${i}`} stroke={eCoreColors[i]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>
    </div>
  );
};

export default ComparisonCharts;
