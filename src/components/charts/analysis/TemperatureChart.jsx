import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Thermometer } from 'lucide-react';
import { tempCoreColors } from '../../../utils';

const TemperatureChart = ({ data, tempCoreCount }) => {
    const [selectedTempCores, setSelectedTempCores] = useState([0, 1, 2, 3]);

    const toggleTempCore = (index) => setSelectedTempCores(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );

    return (
        <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <Thermometer size={20} className="text-rose-500" />
                <span className="text-xl font-semibold text-slate-50">Per-Core Temperature</span>
            </div>
            <div className="flex gap-1.5 flex-wrap mb-4">
                {Array.from({ length: Math.min(tempCoreCount, 16) }, (_, i) => (
                    <button
                        key={`temp${i}`}
                        onClick={() => toggleTempCore(i)}
                        className={`
              px-2.5 py-1 rounded-md border-none cursor-pointer text-[11px] font-medium transition-colors
              ${selectedTempCores.includes(i) ? 'text-white' : 'bg-[#1e143c]/50 text-slate-500'}
            `}
                        style={{ background: selectedTempCores.includes(i) ? tempCoreColors[i % tempCoreColors.length] : undefined }}
                    >
                        C{i}
                    </button>
                ))}
                <button
                    onClick={() => toggleTempCore('package')}
                    className={`
            px-2.5 py-1 rounded-md border-none cursor-pointer text-[11px] font-semibold transition-colors
            ${selectedTempCores.includes('package') ? 'bg-rose-500 text-white' : 'bg-[#1e143c]/50 text-slate-500'}
          `}
                >
                    Package
                </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[55, 100]} />
                    <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                        <div className="bg-[#0f0a28]/95 border border-rose-500/30 rounded-lg p-3 px-4 max-h-[200px] overflow-y-auto">
                            <p className="text-xs text-slate-500 mb-2">Time: {label}s</p>
                            {payload.map((entry, i) => <p key={i} className="text-xs font-medium my-0.5" style={{ color: entry.color }}>{entry.name}: {entry.value}°C</p>)}
                        </div>
                    ) : null} />
                    {selectedTempCores.filter(c => c !== 'package').map(i => <Line key={`core${i}`} type="monotone" dataKey={`core${i}`} name={`Core ${i}`} stroke={tempCoreColors[i % tempCoreColors.length]} strokeWidth={1.5} dot={false} />)}
                    {selectedTempCores.includes('package') && <Line type="monotone" dataKey="package" name="Package" stroke="#f43f5e" strokeWidth={3} dot={false} />}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TemperatureChart;
