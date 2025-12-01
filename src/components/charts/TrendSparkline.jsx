import React from 'react';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import TrendTooltip from './tooltips/TrendTooltip';

const TrendSparkline = ({ data, delta }) => {
  const minFps = Math.min(...data.map(d => d.avgFps));
  const maxFps = Math.max(...data.map(d => d.avgFps));
  const color = delta >= 0 ? '#10b981' : '#ef4444';
  
  return (
    <div style={{ width: '80px', height: '32px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={[minFps - 5, maxFps + 5]} hide />
          <Tooltip content={<TrendTooltip />} />
          <Line
            type="monotone"
            dataKey="avgFps"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendSparkline;
