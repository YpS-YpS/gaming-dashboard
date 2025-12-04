import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Cpu } from 'lucide-react';
import { pCoreColors, eCoreColors } from '../../../utils';

const FrequencyChart = ({ data, pCores, eCores }) => {
    const [selectedCores, setSelectedCores] = useState({ pCores: [0, 1], eCores: [0] });

    const toggleCore = (type, index) => setSelectedCores(prev => {
        const key = type === 'p' ? 'pCores' : 'eCores';
        return { ...prev, [key]: prev[key].includes(index) ? prev[key].filter(i => i !== index) : [...prev[key], index] };
    });

    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Cpu size={20} className="text-pink-500" />
                <span className="text-xl font-semibold text-slate-50">Per-Core Frequency</span>
            </div>
            <div className="flex gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">P-Cores:</span>
                    {pCores.map((_, i) => (
                        <button
                            key={`p${i}`}
                            onClick={() => toggleCore('p', i)}
                            className={`
                px-2.5 py-1 rounded-md border-none cursor-pointer text-[11px] font-medium transition-colors
                ${selectedCores.pCores.includes(i) ? 'text-white' : 'bg-[#1e143c]/50 text-slate-500'}
              `}
                            style={{ background: selectedCores.pCores.includes(i) ? pCoreColors[i % pCoreColors.length] : undefined }}
                        >
                            P{i}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">E-Cores:</span>
                    {eCores.map((_, i) => (
                        <button
                            key={`e${i}`}
                            onClick={() => toggleCore('e', i)}
                            className={`
                px-2.5 py-1 rounded-md border-none cursor-pointer text-[11px] font-medium transition-colors
                ${selectedCores.eCores.includes(i) ? 'text-white' : 'bg-[#1e143c]/50 text-slate-500'}
              `}
                            style={{ background: selectedCores.eCores.includes(i) ? eCoreColors[i % eCoreColors.length] : undefined }}
                        >
                            E{i}
                        </button>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[3000, 5800]} />
                    <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                        <div className="bg-[#0f0a28]/95 border border-pink-500/30 rounded-lg p-3 px-4 max-h-[200px] overflow-y-auto">
                            <p className="text-xs text-slate-500 mb-2">Time: {label}s</p>
                            {payload.map((entry, i) => <p key={i} className="text-xs font-medium my-0.5" style={{ color: entry.color }}>{entry.name}: {entry.value} MHz</p>)}
                        </div>
                    ) : null} />
                    {selectedCores.pCores.map(i => <Line key={`pCore${i}`} type="monotone" dataKey={`pCore${i}`} name={`P-Core ${i}`} stroke={pCoreColors[i % pCoreColors.length]} strokeWidth={2} dot={false} />)}
                    {selectedCores.eCores.map(i => <Line key={`eCore${i}`} type="monotone" dataKey={`eCore${i}`} name={`E-Core ${i}`} stroke={eCoreColors[i % eCoreColors.length]} strokeWidth={2} dot={false} strokeDasharray="4 2" />)}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FrequencyChart;
