import React from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Clock, Cpu, Thermometer, Zap, Activity } from 'lucide-react';
import { pCoreColors, eCoreColors } from '../../utils';
import { useTimeseries } from '../../hooks/useGameData';

const ChartSection = ({ title, icon: Icon, children, color = '#a855f7' }) => (
  <div className="bg-[#0f0a23]/70 rounded-2xl p-5 border border-primary/15">
    <div className="flex items-center gap-2.5 mb-4">
      <Icon size={18} style={{ color }} />
      <span className="text-base font-semibold text-slate-50">{title}</span>
    </div>
    {children}
  </div>
);

const LoadingSkeleton = ({ height = 200 }) => (
  <div className="w-full animate-pulse rounded-lg bg-white/5" style={{ height }} />
);

const ComparisonCharts = ({ leftSelection, rightSelection }) => {
  // Fetch timeseries from API for both sides
  const { data: leftTs, loading: leftLoading } = useTimeseries(
    leftSelection.game.slug, leftSelection.sku.id, leftSelection.build,
    ['frametimes', 'frequency', 'temperature', 'power']
  );
  const { data: rightTs, loading: rightLoading } = useTimeseries(
    rightSelection.game.slug, rightSelection.sku.id, rightSelection.build,
    ['frametimes', 'frequency', 'temperature', 'power']
  );

  const loading = leftLoading || rightLoading;
  const leftFrameTimeData = leftTs?.frametimes || [];
  const rightFrameTimeData = rightTs?.frametimes || [];
  const leftPowerData = leftTs?.power || [];
  const rightPowerData = rightTs?.power || [];
  const leftTempData = leftTs?.temperature || [];
  const rightTempData = rightTs?.temperature || [];
  const leftFreqData = leftTs?.frequency || [];
  const rightFreqData = rightTs?.frequency || [];

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

  // Merge temp data
  const mergedTempData = leftTempData.map((d, i) => ({
    time: d.time,
    leftPackage: d.package,
    rightPackage: rightTempData[i]?.package || 0
  }));

  // Count frequency cores
  const leftPCores = leftFreqData.length > 0 ? Object.keys(leftFreqData[0]).filter(k => k.startsWith('pCore')).length : 0;
  const leftECores = leftFreqData.length > 0 ? Object.keys(leftFreqData[0]).filter(k => k.startsWith('eCore')).length : 0;
  const rightPCores = rightFreqData.length > 0 ? Object.keys(rightFreqData[0]).filter(k => k.startsWith('pCore')).length : 0;
  const rightECores = rightFreqData.length > 0 ? Object.keys(rightFreqData[0]).filter(k => k.startsWith('eCore')).length : 0;

  const leftLabel = `${leftSelection.game.name} (${leftSelection.sku.name})`;
  const rightLabel = `${rightSelection.game.name} (${rightSelection.sku.name})`;

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <ChartSection title="Frame Time Comparison" icon={Clock} color="#a855f7">
          <LoadingSkeleton />
        </ChartSection>
        <div className="grid grid-cols-2 gap-4">
          <ChartSection title="FPS - Left" icon={Activity} color="#06b6d4"><LoadingSkeleton height={150} /></ChartSection>
          <ChartSection title="FPS - Right" icon={Activity} color="#ec4899"><LoadingSkeleton height={150} /></ChartSection>
        </div>
        <ChartSection title="Power Comparison" icon={Zap} color="#f59e0b"><LoadingSkeleton /></ChartSection>
      </div>
    );
  }

  const noData = mergedFrameTimeData.length === 0 && mergedPowerData.length === 0;
  if (noData) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <div>
          <div className="text-lg font-medium text-slate-400 mb-2">No chart data available</div>
          <div className="text-sm text-slate-500">Timeseries data is not available for these configurations.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Frame Time Overlay */}
      {mergedFrameTimeData.length > 0 && (
        <ChartSection title="Frame Time Comparison" icon={Clock} color="#a855f7">
          <div className="flex gap-4 mb-3 text-[13px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#06b6d4] rounded-full" />
              <span className="text-slate-400">{leftLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#ec4899] rounded-full" />
              <span className="text-slate-400">{rightLabel}</span>
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
                  <div className="bg-[#0f0a28]/95 border border-primary/30 rounded-lg p-3 px-4">
                    <p className="text-xs text-slate-500 mb-2">Frame {label}</p>
                    <p className="text-[13px] text-[#06b6d4] font-medium my-0.5">
                      Left: {payload[0]?.value?.toFixed(2)} ms
                    </p>
                    <p className="text-[13px] text-[#ec4899] font-medium my-0.5">
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
      )}

      {/* Side by Side FPS */}
      {(leftFrameTimeData.length > 0 || rightFrameTimeData.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <ChartSection title={`FPS - ${leftLabel}`} icon={Activity} color="#06b6d4">
            {leftFrameTimeData.length > 0 ? (
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
                    <div className="bg-[#0f0a28]/95 border border-[#06b6d4] rounded-md p-2 px-3">
                      <span className="text-[#06b6d4] font-semibold">{payload[0]?.value?.toFixed(1)} FPS</span>
                    </div>
                  ) : null} />
                  <Area type="monotone" dataKey="fps" stroke="#06b6d4" strokeWidth={2} fill="url(#leftFpsGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-[150px] flex items-center justify-center text-sm text-slate-600">No data</div>}
          </ChartSection>

          <ChartSection title={`FPS - ${rightLabel}`} icon={Activity} color="#ec4899">
            {rightFrameTimeData.length > 0 ? (
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
                    <div className="bg-[#0f0a28]/95 border border-[#ec4899] rounded-md p-2 px-3">
                      <span className="text-[#ec4899] font-semibold">{payload[0]?.value?.toFixed(1)} FPS</span>
                    </div>
                  ) : null} />
                  <Area type="monotone" dataKey="fps" stroke="#ec4899" strokeWidth={2} fill="url(#rightFpsGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-[150px] flex items-center justify-center text-sm text-slate-600">No data</div>}
          </ChartSection>
        </div>
      )}

      {/* Power Comparison */}
      {mergedPowerData.length > 0 && (
        <ChartSection title="Power Comparison" icon={Zap} color="#f59e0b">
          <div className="flex flex-wrap gap-4 mb-3 text-[13px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#06b6d4] rounded-full" />
              <span className="text-slate-400">Left IA Power</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#0891b2] rounded-full" />
              <span className="text-slate-400">Left Package</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#ec4899] rounded-full" />
              <span className="text-slate-400">Right IA Power</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#be185d] rounded-full" />
              <span className="text-slate-400">Right Package</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mergedPowerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 'auto']} />
              <Tooltip
                content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="bg-[#0f0a28]/95 border border-amber-500/50 rounded-lg p-3 px-4">
                    <p className="text-xs text-slate-500 mb-2">Time: {label}s</p>
                    {payload.map((entry, i) => (
                      <p key={i} className="text-xs my-0.5" style={{ color: entry.color }}>
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
      )}

      {/* Temperature Comparison */}
      {mergedTempData.length > 0 && (
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
                  <div className="bg-[#0f0a28]/95 border border-rose-500/50 rounded-lg p-3 px-4">
                    <p className="text-xs text-slate-500 mb-2">Time: {label}s</p>
                    <p className="text-[13px] text-[#06b6d4] my-0.5">Left: {payload[0]?.value}°C</p>
                    <p className="text-[13px] text-[#ec4899] my-0.5">Right: {payload[1]?.value}°C</p>
                  </div>
                ) : null}
              />
              <Area type="monotone" dataKey="leftPackage" stroke="#06b6d4" strokeWidth={2} fill="url(#leftTempGrad)" dot={false} />
              <Area type="monotone" dataKey="rightPackage" stroke="#ec4899" strokeWidth={2} fill="url(#rightTempGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {/* Side by Side Frequency */}
      {(leftFreqData.length > 0 || rightFreqData.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <ChartSection title={`CPU Frequency - ${leftLabel}`} icon={Cpu} color="#06b6d4">
            {leftFreqData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={leftFreqData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                  <XAxis dataKey="time" hide />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[2500, 6000]} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div className="bg-[#0f0a28]/95 border border-[#06b6d4] rounded-md p-2 px-3">
                      <p className="text-[11px] text-slate-500 mb-1">Time: {label}s</p>
                      {payload.slice(0, 3).map((entry, i) => (
                        <p key={i} className="text-xs my-0.5" style={{ color: entry.color }}>{entry.name}: {Math.round(entry.value)} MHz</p>
                      ))}
                    </div>
                  ) : null} />
                  {Array.from({ length: Math.min(leftPCores, 2) }, (_, i) => (
                    <Line key={`p${i}`} type="monotone" dataKey={`pCore${i}`} name={`P${i}`} stroke={pCoreColors[i]} strokeWidth={1.5} dot={false} />
                  ))}
                  {Array.from({ length: Math.min(leftECores, 1) }, (_, i) => (
                    <Line key={`e${i}`} type="monotone" dataKey={`eCore${i}`} name={`E${i}`} stroke={eCoreColors[i]} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-[150px] flex items-center justify-center text-sm text-slate-600">No data</div>}
          </ChartSection>

          <ChartSection title={`CPU Frequency - ${rightLabel}`} icon={Cpu} color="#ec4899">
            {rightFreqData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={rightFreqData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                  <XAxis dataKey="time" hide />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[2500, 6000]} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div className="bg-[#0f0a28]/95 border border-[#ec4899] rounded-md p-2 px-3">
                      <p className="text-[11px] text-slate-500 mb-1">Time: {label}s</p>
                      {payload.slice(0, 3).map((entry, i) => (
                        <p key={i} className="text-xs my-0.5" style={{ color: entry.color }}>{entry.name}: {Math.round(entry.value)} MHz</p>
                      ))}
                    </div>
                  ) : null} />
                  {Array.from({ length: Math.min(rightPCores, 2) }, (_, i) => (
                    <Line key={`p${i}`} type="monotone" dataKey={`pCore${i}`} name={`P${i}`} stroke={pCoreColors[i]} strokeWidth={1.5} dot={false} />
                  ))}
                  {Array.from({ length: Math.min(rightECores, 1) }, (_, i) => (
                    <Line key={`e${i}`} type="monotone" dataKey={`eCore${i}`} name={`E${i}`} stroke={eCoreColors[i]} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-[150px] flex items-center justify-center text-sm text-slate-600">No data</div>}
          </ChartSection>
        </div>
      )}
    </div>
  );
};

export default ComparisonCharts;
