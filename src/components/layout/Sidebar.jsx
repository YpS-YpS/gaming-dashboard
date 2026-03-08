import React from 'react';
import { Gauge, ArrowLeftRight, Layers } from 'lucide-react';
import { usePrograms, games } from '../../data';

export default function Sidebar({
    navigate,
    location,
    currentBuild,
    handleBuildSelect,
    handleProgramSelect,
    handleNavigateToLanding,
    isProgramActive,
    onStartDemo,
    displayBuilds = []
}) {
    const { programs } = usePrograms();
    return (
        <nav
            className="
                flex items-center gap-2 flex-shrink-0 w-full
                bg-gradient-to-r from-[#140f2d]/95 to-[#0f0a23]/98
                border-b border-primary/15
                px-5 py-2.5
            "
        >
            {/* Logo */}
            <div
                onClick={handleNavigateToLanding}
                className="flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded-xl transition-colors hover:bg-primary/10 group mr-4 flex-shrink-0"
            >
                <div
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0"
                    style={{ animation: 'logoSequence 43s ease-in-out infinite' }}
                >
                    <style>{`
                        @keyframes logoSequence {
                            /* Pulse 1: 0-11.6% (0-5s) */
                            0%     { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            5.8%   { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            11.6%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            /* Pulse 2: 11.6-23.3% (5-10s) */
                            17.4%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            23.3%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            /* Pulse 3: 23.3-34.9% (10-15s) */
                            29.1%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            34.9%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            /* Pulse 4: 34.9-46.5% (15-20s) */
                            40.7%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            46.5%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            /* Pulse 5: 46.5-58.1% (20-25s) */
                            52.3%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            58.1%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            /* Pulse 6: 58.1-69.8% (25-30s) */
                            64%    { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            69.8%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            /* Pulse 7: 69.8-81.4% (30-35s) */
                            75.6%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            81.4%  { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            /* Pulse 8: 81.4-93% (35-40s) */
                            87.2%  { box-shadow: 0 0 18px rgba(168,85,247,0.7), 0 0 40px rgba(6,182,212,0.4); transform: scale(1.08); filter: brightness(1); }
                            93%    { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                            /* Electrify — 3s rapid burst (93-100%) */
                            94.4%  { box-shadow: 0 0 30px rgba(0,199,253,0.9), 0 0 60px rgba(0,199,253,0.5); transform: scale(1.15); filter: brightness(1.8); }
                            95.3%  { box-shadow: 0 0 5px rgba(168,85,247,0.3); transform: scale(0.98); filter: brightness(0.9); }
                            96.2%  { box-shadow: 0 0 35px rgba(0,199,253,1), 0 0 70px rgba(217,70,239,0.6); transform: scale(1.18); filter: brightness(2); }
                            97.1%  { box-shadow: 0 0 8px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(0.8); }
                            98%    { box-shadow: 0 0 40px rgba(0,199,253,1), 0 0 80px rgba(0,199,253,0.7), 0 0 120px rgba(217,70,239,0.4); transform: scale(1.22); filter: brightness(2.5); }
                            99%    { box-shadow: 0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(6,182,212,0.3); transform: scale(1.05); filter: brightness(1.2); }
                            100%   { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.2); transform: scale(1); filter: brightness(1); }
                        }
                    `}</style>
                    <Gauge size={22} className="text-white" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))' }} />
                </div>
                <div>
                    <h1 className="m-0 text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap leading-tight">
                        Intel SIV Gaming
                    </h1>
                    <p className="m-0 text-[11px] text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        Performance Lab
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-primary/15 mr-2 flex-shrink-0" />

            {/* Programs */}
            <div className="flex items-center gap-1">
                {programs.map((program) => {
                    const isActive = isProgramActive(program.id);
                    return (
                        <button
                            key={program.id}
                            onClick={() => handleProgramSelect(program)}
                            className={`
                                flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200 px-3 py-2
                                ${isActive
                                    ? 'bg-primary/15'
                                    : 'bg-transparent hover:bg-white/5'}
                            `}
                            style={{
                                borderBottom: isActive ? `2px solid ${program.color}` : '2px solid transparent'
                            }}
                        >
                            <span className="text-base">{program.icon}</span>
                            <span className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-slate-50' : 'text-slate-400'}`}>
                                {program.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-primary/15 mx-2 flex-shrink-0" />

            {/* Tools */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => navigate('/compare')}
                    className={`
                        flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200 px-3 py-2
                        ${location.pathname === '/compare'
                            ? 'bg-gradient-to-br from-secondary/20 to-pink-500/20'
                            : 'bg-transparent hover:bg-white/5'}
                    `}
                    style={{
                        borderBottom: location.pathname === '/compare' ? '2px solid #ec4899' : '2px solid transparent'
                    }}
                >
                    <ArrowLeftRight size={16} className={location.pathname === '/compare' ? 'text-pink-500' : 'text-slate-500'} />
                    <span className={`text-sm font-medium whitespace-nowrap ${location.pathname === '/compare' ? 'text-slate-50' : 'text-slate-400'}`}>
                        Compare
                    </span>
                </button>

                <button
                    onClick={onStartDemo}
                    className="flex items-center gap-2 rounded-lg border-none cursor-pointer transition-all duration-200 px-3 py-2 bg-transparent hover:bg-white/5 group active:scale-95"
                    style={{ borderBottom: '2px solid transparent' }}
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                        <Layers size={16} className="text-red-500 relative z-10" />
                    </div>
                    <span className="text-sm font-medium text-slate-400 group-hover:text-red-400 transition-colors whitespace-nowrap">
                        Demo
                    </span>
                </button>
            </div>

            {/* Build Selection - Only show when in a program view */}
            {location.pathname.includes('/program/') && displayBuilds.length > 0 && (
                <>
                    <div className="w-px h-8 bg-primary/15 mx-2 flex-shrink-0" />
                    <div className="flex items-center gap-1 animate-fadeIn">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1 flex-shrink-0">Build</span>
                        {displayBuilds.map((build) => (
                            <button
                                key={build}
                                onClick={() => handleBuildSelect(build)}
                                className={`
                                    flex items-center gap-1.5 rounded-lg border cursor-pointer transition-all duration-200 px-2.5 py-1.5 text-sm font-medium
                                    ${currentBuild === build
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'}
                                `}
                            >
                                <Layers size={14} />
                                <span>{build}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Stats */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="bg-[#1e143c]/50 rounded-lg px-3 py-1.5 text-center">
                    <span className="font-bold text-primary text-sm">{games.length}</span>
                    <span className="text-[10px] text-slate-500 uppercase ml-1.5">Games</span>
                </div>
                <div className="bg-[#1e143c]/50 rounded-lg px-3 py-1.5 text-center">
                    <span className="font-bold text-secondary text-sm">{displayBuilds.length}</span>
                    <span className="text-[10px] text-slate-500 uppercase ml-1.5">Builds</span>
                </div>
            </div>
        </nav>
    );
}
