import React, { useMemo } from 'react';
import { Gauge, ArrowLeftRight, Layers, ChevronLeft, ChevronRight, Cpu, GitBranch, UploadCloud } from 'lucide-react';
import { usePrograms, games } from '../../data';
import BuildTree from './BuildTree';

export default function Sidebar({
    navigate,
    location,
    currentBuild,
    handleBuildSelect,
    handleProgramSelect,
    handleNavigateToLanding,
    isProgramActive,
    onStartDemo,
    displayBuilds = [],
    collapsed = false,
    onToggleCollapse,
    buildTree = [],
    currentProgram: currentProgramProp,
}) {
    const { programs } = usePrograms();

    // Derive current program and SKU from URL
    const currentProgram = useMemo(() => {
        if (currentProgramProp) return currentProgramProp;
        const match = location.pathname.match(/\/program\/([^/]+)/);
        if (!match) return null;
        return programs.find(p => p.id === match[1]) || null;
    }, [currentProgramProp, location.pathname, programs]);

    const currentSkuId = useMemo(() => {
        const match = location.pathname.match(/\/sku\/([^/]+)/);
        return match ? match[1] : null;
    }, [location.pathname]);

    const skus = currentProgram?.skus || [];

    return (
        <nav
            className="flex flex-col h-screen flex-shrink-0 bg-gradient-to-b from-[#140f2d]/95 to-[#0f0a23]/98 border-r border-primary/15 select-none"
            style={{
                width: collapsed ? 48 : 260,
                transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: collapsed ? 48 : 260,
            }}
        >
            {/* Toggle Button */}
            <div className="flex items-center justify-end px-1.5 pt-2 pb-0">
                <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors border-none cursor-pointer"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Logo */}
            <div
                onClick={handleNavigateToLanding}
                className={`flex items-center cursor-pointer rounded-xl transition-colors hover:bg-primary/10 group mx-2 my-2 ${collapsed ? 'justify-center px-1 py-2' : 'gap-3 px-2 py-2'}`}
            >
                <div
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0"
                    style={{ animation: 'logoSequence 43s ease-in-out infinite' }}
                >
                    <style>{`
                        @keyframes logoSequence {
                            0%     { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            5.8%   { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            11.6%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            17.4%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            23.3%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            29.1%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            34.9%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            40.7%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            46.5%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            52.3%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            58.1%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            64%    { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            69.8%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            75.6%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            81.4%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            87.2%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            93%    { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            94.4%  { box-shadow: 0 0 30px rgba(0,199,253,0.9), 0 0 60px rgba(0,199,253,0.5); transform: scale(1.15); filter: brightness(1.8); }
                            95.3%  { box-shadow: 0 0 5px rgba(168,85,247,0.3); transform: scale(0.98); filter: brightness(0.9); }
                            96.2%  { box-shadow: 0 0 35px rgba(0,199,253,1), 0 0 70px rgba(217,70,239,0.6); transform: scale(1.18); filter: brightness(2); }
                            97.1%  { box-shadow: 0 0 8px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(0.8); }
                            98%    { box-shadow: 0 0 40px rgba(0,199,253,1), 0 0 80px rgba(0,199,253,0.7), 0 0 120px rgba(217,70,239,0.4); transform: scale(1.22); filter: brightness(2.5); }
                            99%    { box-shadow: 0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(6,182,212,0.3); transform: scale(1.05); filter: brightness(1.2); }
                            100%   { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                        }
                    `}</style>
                    <Gauge size={18} className="text-white" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))' }} />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="m-0 text-sm font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap leading-tight">
                            Intel SIV Gaming
                        </h1>
                        <p className="m-0 text-[10px] text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            Performance Lab
                        </p>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 my-1 mx-2" />

            {/* Scrollable middle content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-2">

                {/* Programs Section */}
                {!collapsed && (
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider px-2 mb-1 mt-2">Programs</div>
                )}
                <div className="flex flex-col gap-0.5">
                    {programs.map((program) => {
                        const isActive = isProgramActive(program.id);
                        return (
                            <button
                                key={program.id}
                                onClick={() => handleProgramSelect(program)}
                                className={`
                                    flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200 text-left
                                    ${collapsed ? 'justify-center px-1 py-2' : 'px-2 py-1.5'}
                                    ${isActive ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}
                                `}
                                style={{
                                    borderLeft: !collapsed && isActive ? `3px solid ${program.color}` : '3px solid transparent'
                                }}
                                title={collapsed ? program.name : undefined}
                            >
                                <span className="text-base flex-shrink-0">{program.icon}</span>
                                {!collapsed && (
                                    <span className={`text-xs font-medium truncate ${isActive ? 'text-slate-50' : 'text-slate-400'}`}>
                                        {program.name}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* SKU Section — shown when a program is active */}
                {currentProgram && skus.length > 0 && (
                    <>
                        <div className="border-t border-white/5 my-2" />
                        {!collapsed && (
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                                <Cpu size={10} />
                                SKUs
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            {skus.map((sku) => {
                                const isActive = currentSkuId === sku.id;
                                return (
                                    <button
                                        key={sku.id}
                                        onClick={() => navigate(`/program/${currentProgram.id}/sku/${sku.id}`)}
                                        className={`
                                            flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200 text-left
                                            ${collapsed ? 'justify-center px-1 py-1.5' : 'px-2 py-1.5'}
                                            ${isActive ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}
                                        `}
                                        style={{
                                            borderLeft: !collapsed && isActive ? `3px solid ${currentProgram.color}` : '3px solid transparent'
                                        }}
                                        title={collapsed ? sku.name : sku.fullName}
                                    >
                                        {!collapsed ? (
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-xs font-medium truncate ${isActive ? 'text-slate-50' : 'text-slate-400'}`}>
                                                    {sku.name}
                                                </div>
                                                <div className="text-[10px] text-slate-600 truncate">{sku.cores} / {sku.tdp}</div>
                                            </div>
                                        ) : (
                                            <span className={`text-[10px] font-medium ${isActive ? 'text-slate-50' : 'text-slate-500'}`}>
                                                {sku.name.split(' ').pop()}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Build Tree Section — shown when a SKU is selected */}
                {currentSkuId && !collapsed && (
                    <>
                        <div className="border-t border-white/5 my-2" />
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider px-2 mb-1 flex items-center gap-1.5">
                            <GitBranch size={10} />
                            Builds
                        </div>
                        <BuildTree
                            tree={buildTree}
                            currentBuild={currentBuild}
                            onSelectBuild={handleBuildSelect}
                            programColor={currentProgram?.color || '#a855f7'}
                        />
                    </>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 mx-2" />

            {/* Tools Section */}
            <div className={`flex flex-col gap-0.5 px-2 py-2 ${collapsed ? 'items-center' : ''}`}>
                {!collapsed && (
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider px-2 mb-1">Tools</div>
                )}
                <button
                    onClick={() => navigate('/compare')}
                    className={`
                        flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200
                        ${collapsed ? 'justify-center px-1 py-2' : 'px-2 py-1.5'}
                        ${location.pathname === '/compare'
                            ? 'bg-gradient-to-r from-secondary/20 to-pink-500/20 text-slate-50'
                            : 'bg-transparent hover:bg-white/5 text-slate-400'}
                    `}
                    style={{
                        borderLeft: !collapsed && location.pathname === '/compare' ? '3px solid #ec4899' : '3px solid transparent'
                    }}
                    title={collapsed ? 'Compare' : undefined}
                >
                    <ArrowLeftRight size={16} className={location.pathname === '/compare' ? 'text-pink-500' : 'text-slate-500'} />
                    {!collapsed && <span className="text-xs font-medium">Compare</span>}
                </button>

                <button
                    onClick={() => navigate('/ingestion')}
                    className={`
                        flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200
                        ${collapsed ? 'justify-center px-1 py-2' : 'px-2 py-1.5'}
                        ${location.pathname === '/ingestion'
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-slate-50'
                            : 'bg-transparent hover:bg-white/5 text-slate-400'}
                    `}
                    style={{
                        borderLeft: !collapsed && location.pathname === '/ingestion' ? '3px solid #f59e0b' : '3px solid transparent'
                    }}
                    title={collapsed ? 'Ingest' : undefined}
                >
                    <UploadCloud size={16} className={location.pathname === '/ingestion' ? 'text-amber-500' : 'text-slate-500'} />
                    {!collapsed && <span className="text-xs font-medium">Ingest</span>}
                </button>

                <button
                    onClick={onStartDemo}
                    className={`
                        flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200 group active:scale-95
                        ${collapsed ? 'justify-center px-1 py-2' : 'px-2 py-1.5'}
                        bg-transparent hover:bg-white/5
                    `}
                    style={{ borderLeft: '3px solid transparent' }}
                    title={collapsed ? 'Demo Mode' : undefined}
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                        <Layers size={16} className="text-red-500 relative z-10" />
                    </div>
                    {!collapsed && (
                        <span className="text-xs font-medium text-slate-400 group-hover:text-red-400 transition-colors">
                            Demo
                        </span>
                    )}
                </button>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 mx-2" />

            {/* Stats */}
            <div className={`flex px-2 py-2 gap-2 ${collapsed ? 'flex-col items-center' : 'items-center'}`}>
                <div className={`bg-[#1e143c]/50 rounded-lg text-center ${collapsed ? 'px-1.5 py-1' : 'px-2.5 py-1 flex-1'}`}>
                    <span className="font-bold text-primary text-xs">{games.length}</span>
                    {!collapsed && <span className="text-[9px] text-slate-500 uppercase ml-1">Games</span>}
                </div>
                <div className={`bg-[#1e143c]/50 rounded-lg text-center ${collapsed ? 'px-1.5 py-1' : 'px-2.5 py-1 flex-1'}`}>
                    <span className="font-bold text-secondary text-xs">{displayBuilds.length}</span>
                    {!collapsed && <span className="text-[9px] text-slate-500 uppercase ml-1">Builds</span>}
                </div>
            </div>
        </nav>
    );
}
