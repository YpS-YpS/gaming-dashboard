import React from 'react';

// CPU Residency Tooltip
export const CpuResidencyTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const time = payload[0].payload.time;
  const residency = payload[0].payload.residency;
  const trendLine = payload[0].payload.trendLine;
  
  return (
    <div style={{
      background: 'rgba(15, 10, 40, 0.95)',
      border: '1px solid rgba(59, 130, 246, 0.5)',
      borderRadius: '8px',
      padding: '12px 16px'
    }}>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
        Time: {(time / 1000).toFixed(1)}s ({time.toLocaleString()} ms)
      </p>
      <p style={{ fontSize: '13px', color: '#3b82f6', margin: '2px 0', fontWeight: 500 }}>
        Residency: {residency?.toFixed(1)}%
      </p>
      <p style={{ fontSize: '13px', color: '#1e40af', margin: '2px 0', fontWeight: 500 }}>
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
    <div style={{
      background: 'rgba(15, 10, 40, 0.95)',
      border: '1px solid rgba(16, 185, 129, 0.5)',
      borderRadius: '8px',
      padding: '12px 16px'
    }}>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
        Time: {(time / 1000).toFixed(1)}s ({time.toLocaleString()} ms)
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{
          fontSize: '13px',
          color: colorMap[entry.name] || '#94a3b8',
          margin: '2px 0',
          fontWeight: 500
        }}>
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
    <div style={{
      background: 'rgba(15, 10, 40, 0.95)',
      border: '1px solid rgba(245, 158, 11, 0.5)',
      borderRadius: '8px',
      padding: '12px 16px'
    }}>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
        Time: {label}s
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{
          fontSize: '13px',
          color: colorMap[entry.name] || '#94a3b8',
          margin: '2px 0',
          fontWeight: 500
        }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value} W
        </p>
      ))}
    </div>
  );
};
