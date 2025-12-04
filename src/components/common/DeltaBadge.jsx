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
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${isNeutral ? 'bg-slate-500/20' : delta >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'
      }`}>
      <Icon size={14} className={isNeutral ? 'text-slate-400' : delta >= 0 ? 'text-emerald-500' : 'text-red-500'} />
      <span className={`text-[13px] font-semibold ${isNeutral ? 'text-slate-400' : delta >= 0 ? 'text-emerald-500' : 'text-red-500'
        }`}>
        {delta >= 0 && !isNeutral ? '+' : ''}{deltaPercent.toFixed(1)}%
      </span>
    </div>
  );
};

export default DeltaBadge;
