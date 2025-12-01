import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DeltaBadge = ({ delta, deltaPercent }) => {
  const isNeutral = Math.abs(deltaPercent) < 1;
  
  let bgColor, textColor, Icon;
  
  if (isNeutral) {
    bgColor = 'rgba(100, 116, 139, 0.2)';
    textColor = '#94a3b8';
    Icon = Minus;
  } else if (delta >= 0) {
    bgColor = 'rgba(16, 185, 129, 0.15)';
    textColor = '#10b981';
    Icon = TrendingUp;
  } else {
    bgColor = 'rgba(239, 68, 68, 0.15)';
    textColor = '#ef4444';
    Icon = TrendingDown;
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '6px',
      background: bgColor
    }}>
      <Icon size={14} style={{ color: textColor }} />
      <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
        {delta >= 0 && !isNeutral ? '+' : ''}{deltaPercent.toFixed(1)}%
      </span>
    </div>
  );
};

export default DeltaBadge;
