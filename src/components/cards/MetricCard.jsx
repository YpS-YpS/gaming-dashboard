import React from 'react';

const MetricCard = ({ label, value, unit, icon: Icon, color }) => {
  return (
    <div style={{
      background: 'rgba(30, 20, 60, 0.6)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(139, 92, 246, 0.15)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '12px',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {label}
        </span>
        {Icon && <Icon size={16} style={{ color, opacity: 0.7 }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</span>
        <span style={{ fontSize: '14px', color: '#4b5563' }}>{unit}</span>
      </div>
    </div>
  );
};

export default MetricCard;
