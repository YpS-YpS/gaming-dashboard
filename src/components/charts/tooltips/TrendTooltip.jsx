import React from 'react';

const TrendTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div style={{
      background: 'rgba(15, 10, 40, 0.95)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '6px',
      padding: '8px 12px'
    }}>
      <p style={{ fontSize: '12px', color: '#a855f7', marginBottom: '2px', fontWeight: 600 }}>
        Build {payload[0].payload.build}
      </p>
      <p style={{ fontSize: '14px', color: '#f1f5f9', margin: 0 }}>
        {payload[0].value} FPS
      </p>
    </div>
  );
};

export default TrendTooltip;
