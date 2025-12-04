import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Gauge } from 'lucide-react';
import { PerformanceCapabilityTooltip } from '../tooltips';

const PerformanceCapabilityChart = ({ data }) => {
    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Gauge size={20} className="text-emerald-500" />
                <span className="text-xl font-semibold text-slate-50">Performance Capability & C-State</span>
                {/* Legends */}
                <div className="flex gap-4 ml-auto">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-0.5 bg-emerald-500 rounded-sm" />
                        <span className="text-[11px] text-slate-500">Capability</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                        <span className="text-[11px] text-slate-500">C0 Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[11px] text-slate-500">C1</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-[11px] text-slate-500">C6</span>
                    </div>
                </div>
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
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 120]} />
                    <Tooltip content={<PerformanceCapabilityTooltip />} />
                    <Line type="monotone" dataKey="capability" name="Capability" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Scatter dataKey="c0Active" name="C0 Active" fill="#06b6d4" />
                    <Scatter dataKey="c1" name="C1" fill="#f59e0b" />
                    <Scatter dataKey="c6" name="C6" fill="#8b5cf6" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PerformanceCapabilityChart;
