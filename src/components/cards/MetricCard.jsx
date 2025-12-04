import React from 'react';

const MetricCard = ({ label, value, unit, icon: Icon, color }) => {
  return (
    <div className="bg-[#1e143c]/60 rounded-xl p-4 border border-primary/15">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon size={16} style={{ color, opacity: 0.7 }} />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        <span className="text-sm text-slate-600">{unit}</span>
      </div>
    </div>
  );
};

export default MetricCard;
