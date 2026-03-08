import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';
import { CpuResidencyTooltip } from '../tooltips';

const CpuResidencyChart = ({ data }) => {
    const maxTime = data.length > 0 ? Math.max(...data.map(d => d.time)) : 60000;
    const domainMax = Math.ceil(maxTime / 5000) * 5000;
    const tickStep = domainMax <= 30000 ? 5000 : 10000;
    const timeTicks = [];
    for (let t = 0; t <= domainMax; t += tickStep) timeTicks.push(t);

    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Activity size={20} className="text-blue-500" />
                <span className="text-xl font-semibold text-slate-50">CPU Residency vs. Relative Time</span>
                <div className="flex gap-4 ml-auto">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-0.5 bg-blue-500 rounded-sm" />
                        <span className="text-[11px] text-slate-500">Trend</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[11px] text-slate-500">Residency</span>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="time" type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, domainMax]} ticks={timeTicks} tickFormatter={(v) => `${Math.round(v / 1000)}s`} />
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
