import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { clipReasonColors } from '../../../utils';

const ClipReasonChart = ({ data }) => {
    // Derive domain and ticks from actual data
    const maxTime = data.length > 0
        ? Math.max(...data.map(d => d.time))
        : 60000;
    const domainMax = Math.ceil(maxTime / 5000) * 5000; // round up to nearest 5s
    const tickStep = domainMax <= 30000 ? 5000 : 10000;
    const ticks = [];
    for (let t = 0; t <= domainMax; t += tickStep) ticks.push(t);

    const reasons = [...new Set(data.map(d => d.reason))];

    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <AlertTriangle size={20} className="text-pink-500" />
                <span className="text-xl font-semibold text-slate-50">IA Clip Reason</span>
                <div className="flex gap-4 ml-auto">
                    {reasons.map(reason => (
                        <div key={reason} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: clipReasonColors[reason] || '#ec4899' }} />
                            <span className="text-[11px] text-slate-500">{reason}</span>
                        </div>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(139, 92, 246, 0.1)"
                    />
                    <XAxis
                        dataKey="time"
                        type="number"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, domainMax]}
                        ticks={ticks}
                        tickFormatter={(value) => `${Math.round(value / 1000)}s`}
                    />
                    <YAxis
                        type="category"
                        dataKey="reason"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                        allowDuplicatedCategory={false}
                    />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-[#0f0a28]/95 border border-pink-500/50 rounded-lg p-3 px-4">
                            <p className="text-xs text-slate-500 mb-1">Time: {(payload[0].payload.time / 1000).toFixed(1)}s ({payload[0].payload.time.toLocaleString()} ms)</p>
                            <p className="text-sm font-semibold m-0" style={{ color: clipReasonColors[payload[0].payload.reason] }}>{payload[0].payload.reason}</p>
                        </div>
                    ) : null} />
                    <Scatter data={data} shape={(props) => props.cx && props.cy ? <circle cx={props.cx} cy={props.cy} r={5} fill={clipReasonColors[props.payload.reason] || '#ec4899'} fillOpacity={0.9} /> : null} />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ClipReasonChart;
