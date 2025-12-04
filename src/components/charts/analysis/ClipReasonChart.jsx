import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { clipReasonColors } from '../../../utils';

const ClipReasonChart = ({ data }) => {
    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <AlertTriangle size={20} className="text-pink-500" />
                <span className="text-xl font-semibold text-slate-50">IA Clip Reason</span>
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
                        domain={[0, 60000]}
                        ticks={[0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 21000, 22000, 23000, 24000, 25000, 26000, 27000, 28000, 29000, 30000, 31000, 32000, 33000, 34000, 35000, 36000, 37000, 38000, 39000, 40000, 41000, 42000, 43000, 44000, 45000, 46000, 47000, 48000, 49000, 50000, 51000, 52000, 53000, 54000, 55000, 56000, 57000, 58000, 59000, 60000]}
                        tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                        interval={0}
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
