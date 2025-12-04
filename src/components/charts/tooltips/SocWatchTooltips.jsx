import React from 'react';

// CPU Residency Tooltip
export const CpuResidencyTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const time = payload[0].payload.time;
  const residency = payload[0].payload.residency;
  const trendLine = payload[0].payload.trendLine;

  return (
    <div className="bg-[#0f0a28]/95 border border-blue-500/50 rounded-lg p-3 px-4">
      <p className="text-xs text-slate-500 mb-2">
        Time: {(time / 1000).toFixed(1)}s ({time.toLocaleString()} ms)
      </p>
      <p className="text-[13px] text-blue-500 my-0.5 font-medium">
        Residency: {residency?.toFixed(1)}%
      </p>
      <p className="text-[13px] text-blue-800 my-0.5 font-medium">
        Trend: {trendLine?.toFixed(1)}%
      </p>
    </div>
  );
};

// Performance Capability & C-State Tooltip
export const PerformanceCapabilityTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const colorMap = {
    'Capability': '#10b981',
    'C0 Active': '#06b6d4',
    'C1': '#f59e0b',
    'C6': '#8b5cf6'
  };
  const time = payload[0].payload.time;

  return (
    <div className="bg-[#0f0a28]/95 border border-emerald-500/50 rounded-lg p-3 px-4">
      <p className="text-xs text-slate-500 mb-2">
        Time: {(time / 1000).toFixed(1)}s ({time.toLocaleString()} ms)
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[13px] my-0.5 font-medium" style={{ color: colorMap[entry.name] || '#94a3b8' }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
};

// Power Analysis Tooltip
export const PowerAnalysisTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const colorMap = {
    'IA Power': '#3b82f6',
    'Package Power': '#7c3aed',
    'IA Trend': '#1e40af',
    'Pkg Trend': '#4c1d95'
  };

  return (
    <div className="bg-[#0f0a28]/95 border border-amber-500/50 rounded-lg p-3 px-4">
      <p className="text-xs text-slate-500 mb-2">
        Time: {label}s
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[13px] my-0.5 font-medium" style={{ color: colorMap[entry.name] || '#94a3b8' }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value} W
        </p>
      ))}
    </div>
  );
};
