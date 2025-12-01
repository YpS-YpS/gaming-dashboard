import React from 'react';

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div style={{
      background: 'rgba(15, 10, 40, 0.95)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '8px',
      padding: '10px 14px'
    }}>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: '14px', fontWeight: 500, color: entry.color, margin: 0 }}>
          {entry.name}: {entry.value.toFixed(1)}{unit}
        </p>
      ))}
    </div>
  );
};

export default CustomTooltip;
