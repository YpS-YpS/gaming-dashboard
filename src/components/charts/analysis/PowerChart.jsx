import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Zap } from 'lucide-react';
import { PowerAnalysisTooltip } from '../tooltips';

const PowerChart = ({ data }) => {
    const maxTime = data.length > 0 ? Math.max(...data.map(d => d.time)) : 60000;
    const domainMax = Math.ceil(maxTime / 5000) * 5000;
    const tickStep = domainMax <= 30000 ? 5000 : 10000;
    const timeTicks = [];
    for (let t = 0; t <= domainMax; t += tickStep) timeTicks.push(t);

    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Zap size={20} className="text-amber-500" />
                <span className="text-xl font-semibold text-slate-50">Power Analysis</span>
                <div className="flex gap-4 ml-auto">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[11px] text-slate-500">IA Power</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-violet-600" />
                        <span className="text-[11px] text-slate-500">Pkg Power</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-0.5 bg-blue-800 rounded-sm" />
                        <span className="text-[11px] text-slate-500">IA Trend</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-0.5 bg-violet-900 rounded-sm" />
                        <span className="text-[11px] text-slate-500">Pkg Trend</span>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="time" type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, domainMax]} ticks={timeTicks} tickFormatter={(v) => `${Math.round(v / 1000)}s`} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 'dataMax + 10']} />
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
