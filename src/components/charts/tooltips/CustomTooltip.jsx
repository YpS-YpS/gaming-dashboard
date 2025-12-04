import React from 'react';

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#0f0a28]/95 border border-primary/30 rounded-lg p-2.5 px-3.5">
      <p className="text-[13px] text-slate-500 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium m-0" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1)}{unit}
        </p>
      ))}
    </div>
  );
};

export default CustomTooltip;
