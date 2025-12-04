import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';
import { TrendTooltip } from '../tooltips';
import DeltaBadge from '../../common/DeltaBadge';

const TrendChart = ({ data, delta, deltaPercent }) => {
    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Activity size={20} className="text-emerald-500" />
                <span className="text-xl font-semibold text-slate-50">Build-over-Build Trend</span>
                <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="detailTrendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="build" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip content={<TrendTooltip />} />
                    <Area type="monotone" dataKey="avgFps" stroke={delta >= 0 ? '#10b981' : '#ef4444'} strokeWidth={3} fill="url(#detailTrendGrad)" dot={{ r: 6, fill: delta >= 0 ? '#10b981' : '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TrendChart;
