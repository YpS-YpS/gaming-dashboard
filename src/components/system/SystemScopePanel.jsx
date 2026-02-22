import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Server, Check } from 'lucide-react';

/**
 * Full System Scope panel with collapsible module groups and checkboxes.
 * Props:
 *   - scopeData: { bkc_name, program_name, creation_date, log_info, sections[] }
 *   - fallbackConfig: { cpu, gpu, firmware, os, motherboard } from useSystemConfig (basic)
 */

// Category colors for quick specs
const CATEGORY_COLORS = {
    System: '#a855f7',
    Processor: '#3b82f6',
    Platform: '#f59e0b',
    Memory: '#06b6d4',
    OS: '#10b981',
    Graphics: '#ec4899',
    Power: '#f97316',
    Security: '#ef4444',
};

const QuickSpecsTable = ({ specs }) => {
    // Group by category
    const grouped = {};
    for (const spec of specs) {
        if (!grouped[spec.category]) grouped[spec.category] = [];
        grouped[spec.category].push(spec);
    }

    return (
        <div className="mb-5 bg-[#0f0a23]/60 rounded-2xl border border-primary/15 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary/10 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">Quick Specs</span>
                <span className="text-[10px] text-slate-500">{specs.length} fields</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-x divide-primary/5">
                {Object.entries(grouped).map(([category, items]) => {
                    const color = CATEGORY_COLORS[category] || '#a855f7';
                    return (
                        <div key={category} className="p-4">
                            <div className="flex items-center gap-2 mb-2.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                                    {category}
                                </span>
                            </div>
                            <table className="w-full text-xs border-collapse">
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} className="border-b border-primary/5 last:border-b-0">
                                            <td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap align-top">
                                                {item.label}
                                            </td>
                                            <td className="py-1.5 text-slate-200 font-medium text-right">
                                                {item.value}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Priority sections shown expanded by default
const DEFAULT_EXPANDED = new Set([
    'Bkcmeta Information',
    'Processor Information',
    'Graphics Information',
    'OS Information',
    'Firmware Version',
    'Memory',
]);

const ScopeGroup = ({ group, isExpanded, onToggle }) => {
    return (
        <div className="border-b border-primary/5 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-3 py-2 bg-transparent border-none cursor-pointer hover:bg-white/3 transition-colors"
            >
                {isExpanded
                    ? <ChevronDown size={14} className="text-primary flex-shrink-0" />
                    : <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
                }
                <span className={`text-xs font-medium ${isExpanded ? 'text-slate-300' : 'text-slate-500'}`}>
                    {group.name}
                </span>
                <span className="text-[10px] text-slate-600 ml-auto">{group.items.length}</span>
            </button>
            {isExpanded && (
                <div className="px-3 pb-2">
                    <table className="w-full text-xs border-collapse">
                        <tbody>
                            {group.items.map((item, i) => (
                                <tr key={i} className="border-b border-primary/5 last:border-b-0">
                                    <td className="py-1.5 pr-4 text-slate-500 whitespace-nowrap align-top w-[40%]">
                                        {item.name}
                                    </td>
                                    <td className="py-1.5 text-slate-300 font-mono break-all">
                                        {item.value}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const ScopeModule = ({ section, isChecked, onCheckToggle, defaultExpanded }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [expandedGroups, setExpandedGroups] = useState(() => {
        // Expand first group by default
        const set = new Set();
        if (section.groups.length > 0) set.add(0);
        return set;
    });

    const totalItems = section.groups.reduce((sum, g) => sum + g.items.length, 0);

    const toggleGroup = (idx) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <div className={`rounded-xl border transition-all duration-200 ${isChecked
            ? 'bg-[#0f0a23]/70 border-primary/20'
            : 'bg-[#0f0a23]/30 border-primary/5 opacity-50'
            }`}>
            {/* Module header */}
            <div className="flex items-center gap-2 px-4 py-3">
                <button
                    onClick={onCheckToggle}
                    className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border cursor-pointer transition-colors ${isChecked
                        ? 'bg-primary border-primary'
                        : 'bg-transparent border-slate-600 hover:border-slate-400'
                        }`}
                >
                    {isChecked && <Check size={10} className="text-white" />}
                </button>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex-1 flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
                >
                    {expanded
                        ? <ChevronDown size={16} className="text-primary" />
                        : <ChevronRight size={16} className="text-slate-500" />
                    }
                    <span className="text-sm font-semibold text-slate-200">{section.module}</span>
                    <span className="text-[10px] text-slate-600 bg-primary/10 px-1.5 py-0.5 rounded-md ml-1">
                        {section.groups.length} group{section.groups.length !== 1 ? 's' : ''} · {totalItems} items
                    </span>
                </button>
            </div>

            {/* Groups */}
            {expanded && isChecked && (
                <div className="px-2 pb-2">
                    {section.groups.map((group, gIdx) => (
                        <ScopeGroup
                            key={gIdx}
                            group={group}
                            isExpanded={expandedGroups.has(gIdx)}
                            onToggle={() => toggleGroup(gIdx)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function SystemScopePanel({ scopeData, fallbackConfig }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [checkedModules, setCheckedModules] = useState(() => {
        // All checked by default
        if (!scopeData?.sections) return new Set();
        return new Set(scopeData.sections.map(s => s.module));
    });

    // If no system scope data, show the basic fallback config
    if (!scopeData || !scopeData.sections || scopeData.sections.length === 0) {
        if (!fallbackConfig) return null;
        return (
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Server size={20} className="text-primary" />
                    <span className="text-xl font-semibold text-slate-50">System Configuration</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'CPU', value: fallbackConfig.cpu },
                        { label: 'GPU', value: fallbackConfig.gpu },
                        { label: 'Firmware', value: fallbackConfig.firmware },
                        { label: 'OS', value: fallbackConfig.os },
                        { label: 'Motherboard', value: fallbackConfig.motherboard },
                    ].filter(r => r.value && r.value !== 'Unknown').map(r => (
                        <div key={r.label} className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/15">
                            <div className="text-[11px] text-slate-500 mb-1">{r.label}</div>
                            <div className="text-sm font-medium text-slate-200">{r.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const toggleModule = (moduleName) => {
        setCheckedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleName)) next.delete(moduleName);
            else next.add(moduleName);
            return next;
        });
    };

    const selectAll = () => setCheckedModules(new Set(scopeData.sections.map(s => s.module)));
    const selectNone = () => setCheckedModules(new Set());

    // Filter sections by search
    const filteredSections = scopeData.sections.filter(section => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (section.module.toLowerCase().includes(q)) return true;
        return section.groups.some(g =>
            g.name.toLowerCase().includes(q) ||
            g.items.some(item =>
                item.name.toLowerCase().includes(q) ||
                item.value.toLowerCase().includes(q)
            )
        );
    });

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Server size={20} className="text-primary" />
                    <div>
                        <span className="text-xl font-semibold text-slate-50">System Scope</span>
                        {scopeData.bkc_name && (
                            <span className="ml-3 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md font-mono">
                                {scopeData.bkc_name}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search fields..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-52 bg-surface/60 border border-primary/20 rounded-lg py-2 pl-3 pr-9 text-xs text-slate-50 outline-none focus:border-primary/50 transition-colors"
                        />
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>
                    <button
                        onClick={selectAll}
                        className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary border-none cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                        All
                    </button>
                    <button
                        onClick={selectNone}
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 border-none cursor-pointer hover:bg-slate-700 transition-colors"
                    >
                        None
                    </button>
                </div>
            </div>

            {/* BKC Summary Bar */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-[#0f0a23]/50 rounded-xl border border-primary/10 text-xs">
                {scopeData.program_name && (
                    <span><span className="text-slate-500">Program:</span> <span className="text-slate-300 font-medium">{scopeData.program_name}</span></span>
                )}
                {scopeData.creation_date && (
                    <span><span className="text-slate-500">BKC Date:</span> <span className="text-slate-300 font-medium">{scopeData.creation_date}</span></span>
                )}
                {scopeData.log_info?.capture_time && (
                    <span><span className="text-slate-500">Captured:</span> <span className="text-slate-300 font-medium">{scopeData.log_info.capture_time}</span></span>
                )}
                {scopeData.log_info?.tool_version && (
                    <span><span className="text-slate-500">Tool:</span> <span className="text-slate-300 font-mono">{scopeData.log_info.tool_version}</span></span>
                )}
                <span className="ml-auto text-slate-600">
                    {scopeData.sections.length} modules · {checkedModules.size} shown
                </span>
            </div>

            {/* Quick Specs Table */}
            {scopeData.quick_specs && scopeData.quick_specs.length > 0 && (
                <QuickSpecsTable specs={scopeData.quick_specs} />
            )}

            {/* Modules Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredSections.map((section) => (
                    <ScopeModule
                        key={section.module}
                        section={section}
                        isChecked={checkedModules.has(section.module)}
                        onCheckToggle={() => toggleModule(section.module)}
                        defaultExpanded={DEFAULT_EXPANDED.has(section.module)}
                    />
                ))}
            </div>

            {filteredSections.length === 0 && searchQuery && (
                <div className="text-center py-8 text-sm text-slate-500">
                    No results for "{searchQuery}"
                </div>
            )}
        </div>
    );
}
