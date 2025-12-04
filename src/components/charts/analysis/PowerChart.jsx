import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Zap } from 'lucide-react';
import { PowerAnalysisTooltip } from '../tooltips';

const PowerChart = ({ data }) => {
    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Zap size={20} className="text-amber-500" />
                <span className="text-xl font-semibold text-slate-50">Power Analysis</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 120]} />
                    <Tooltip content={<PowerAnalysisTooltip />} />
                    <Scatter dataKey="iaPower" name="IA Power" fill="#3b82f6" />
                    <Scatter dataKey="packagePower" name="Package Power" fill="#7c3aed" />
                    <Line type="monotone" dataKey="iaTrendLine" name="IA Trend" stroke="#1e40af" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pkgTrendLine" name="Pkg Trend" stroke="#4c1d95" strokeWidth={2} dot={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PowerChart;
