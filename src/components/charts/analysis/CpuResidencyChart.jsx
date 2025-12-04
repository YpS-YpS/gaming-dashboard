import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';
import { CpuResidencyTooltip } from '../tooltips';

const CpuResidencyChart = ({ data }) => {
    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Activity size={20} className="text-blue-500" />
                <span className="text-xl font-semibold text-slate-50">CPU Residency vs. Relative Time</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip content={<CpuResidencyTooltip />} />
                    <Line type="monotone" dataKey="trendLine" name="Trend" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Scatter dataKey="residency" name="Residency" fill="#3b82f6" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CpuResidencyChart;
