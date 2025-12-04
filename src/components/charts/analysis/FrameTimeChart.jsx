import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Clock } from 'lucide-react';

const FrameTimeChart = ({ data }) => {
    const [frameTimeMode, setFrameTimeMode] = useState('frameTime');

    const frameTimeModes = [
        { id: 'frameTime', label: 'Frame Time', color: '#a855f7' },
        { id: 'fps', label: 'FPS', color: '#10b981' },
        { id: 'percentile95', label: '95th %', color: '#f59e0b' },
        { id: 'percentile99', label: '99th %', color: '#ef4444' },
        { id: 'onePercentLow', label: '1% Low', color: '#06b6d4' },
        { id: 'movingAvg', label: 'Moving Avg', color: '#8b5cf6' }
    ];

    const currentFrameTimeMode = frameTimeModes.find(m => m.id === frameTimeMode);

    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <Clock size={20} className="text-primary" />
                    <span className="text-xl font-semibold text-slate-50">Frame Time Analysis</span>
                </div>
                <div className="flex gap-2">
                    {frameTimeModes.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setFrameTimeMode(mode.id)}
                            className={`
                px-3.5 py-1.5 rounded-lg border-none cursor-pointer text-xs font-medium transition-all duration-200
                ${frameTimeMode === mode.id
                                    ? 'bg-transparent text-[color:var(--mode-color)]'
                                    : 'bg-[#1e143c]/50 text-slate-500 hover:text-slate-300'}
              `}
                            style={{
                                backgroundColor: frameTimeMode === mode.id ? `${mode.color}30` : undefined,
                                color: frameTimeMode === mode.id ? mode.color : undefined,
                                '--mode-color': mode.color
                            }}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="frameTimeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={currentFrameTimeMode.color} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={currentFrameTimeMode.color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-[#0f0a28]/95 border rounded-lg p-3 px-4" style={{ borderColor: `${currentFrameTimeMode.color}50` }}>
                            <p className="text-xs text-slate-500 mb-1">Frame {payload[0].payload.frame}</p>
                            <p className="text-base font-semibold m-0" style={{ color: currentFrameTimeMode.color }}>
                                {payload[0].value.toFixed(2)} {frameTimeMode === 'fps' || frameTimeMode.includes('percent') || frameTimeMode.includes('Low') ? 'FPS' : 'ms'}
                            </p>
                        </div>
                    ) : null} />
                    <Area type="monotone" dataKey={frameTimeMode} stroke={currentFrameTimeMode.color} strokeWidth={2} fill="url(#frameTimeGrad)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FrameTimeChart;
