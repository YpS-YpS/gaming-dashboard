import React from 'react';

const TrendTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#0f0a28]/95 border border-primary/30 rounded-md p-2 px-3">
      <p className="text-xs text-primary mb-0.5 font-semibold">
        Build {payload[0].payload.build}
      </p>
      <p className="text-sm text-slate-50 m-0">
        {payload[0].value} FPS
      </p>
    </div>
  );
};

export default TrendTooltip;
