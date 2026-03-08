import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Thermometer } from 'lucide-react';
import { pCoreColors, eCoreColors } from '../../../utils';

const TemperatureChart = ({ data, tempCoreCount, pCoreCount = 0, eCoreCount = 0 }) => {
    // Build core index arrays based on P/E split
    // Temperature keys are core0..coreN — first pCoreCount are P-cores, next eCoreCount are E-cores
    const pCores = Array.from({ length: pCoreCount }, (_, i) => i);
    const eCores = Array.from({ length: eCoreCount }, (_, i) => i);

    const [selectedCores, setSelectedCores] = useState(() => ({
        pCores: pCores.map((_, i) => i),
        eCores: eCores.map((_, i) => i),
        package: true,
    }));

    const toggleCore = (type, index) => setSelectedCores(prev => {
        if (type === 'package') return { ...prev, package: !prev.package };
        const key = type === 'p' ? 'pCores' : 'eCores';
        return { ...prev, [key]: prev[key].includes(index) ? prev[key].filter(i => i !== index) : [...prev[key], index] };
    });

    const maxTime = data.length > 0 ? Math.max(...data.map(d => d.time)) : 60000;
    const domainMax = Math.ceil(maxTime / 5000) * 5000;
    const tickStep = domainMax <= 30000 ? 5000 : 10000;
    const timeTicks = [];
    for (let t = 0; t <= domainMax; t += tickStep) timeTicks.push(t);

    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Thermometer size={20} className="text-rose-500" />
                <span className="text-xl font-semibold text-slate-50">Per-Core Temperature</span>
            </div>
            <div className="flex gap-4 mb-4 flex-wrap">
                {pCoreCount > 0 && (
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
                )}
                {eCoreCount > 0 && (
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
                )}
                <button
                    onClick={() => toggleCore('package')}
                    className={`
                        px-2.5 py-1 rounded-md border-none cursor-pointer text-[11px] font-semibold transition-colors
                        ${selectedCores.package ? 'bg-rose-500 text-white' : 'bg-[#1e143c]/50 text-slate-500'}
                    `}
                >
                    Package
                </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="time" type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, domainMax]} ticks={timeTicks} tickFormatter={(v) => `${Math.round(v / 1000)}s`} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                        <div className="bg-[#0f0a28]/95 border border-rose-500/30 rounded-lg p-3 px-4 max-h-[200px] overflow-y-auto">
                            <p className="text-xs text-slate-500 mb-2">Time: {label}s</p>
                            {payload.map((entry, i) => <p key={i} className="text-xs font-medium my-0.5" style={{ color: entry.color }}>{entry.name}: {entry.value}°C</p>)}
                        </div>
                    ) : null} />
                    {selectedCores.pCores.map(i => (
                        <Line key={`core${i}`} type="monotone" dataKey={`core${i}`} name={`P-Core ${i}`} stroke={pCoreColors[i % pCoreColors.length]} strokeWidth={1.5} dot={false} />
                    ))}
                    {selectedCores.eCores.map(i => (
                        <Line key={`core${pCoreCount + i}`} type="monotone" dataKey={`core${pCoreCount + i}`} name={`E-Core ${i}`} stroke={eCoreColors[i % eCoreColors.length]} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    ))}
                    {selectedCores.package && <Line type="monotone" dataKey="package" name="Package" stroke="#f43f5e" strokeWidth={3} dot={false} />}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TemperatureChart;
