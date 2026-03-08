import React from 'react';
import { GitCommit, FlaskConical } from 'lucide-react';

export default function BuildTree({ tree, currentBuild, onSelectBuild, programColor = '#a855f7' }) {
    if (!tree || tree.length === 0) {
        return (
            <div className="px-2 py-3 text-[11px] text-slate-600 italic">
                No builds available
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0.5">
            {tree.map((bkc) => (
                <div key={bkc.build_id}>
                    {/* BKC Node */}
                    <button
                        onClick={() => onSelectBuild(bkc.build_id)}
                        className={`
                            w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150
                            ${currentBuild === bkc.build_id
                                ? 'bg-white/10 text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                        `}
                        style={currentBuild === bkc.build_id
                            ? { borderLeft: `2px solid ${programColor}` }
                            : { borderLeft: '2px solid transparent' }
                        }
                        title={bkc.build_id}
                    >
                        <GitCommit size={14} className="flex-shrink-0" style={{ color: programColor }} />
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{bkc.build_id}</div>
                        </div>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">{bkc.game_count}g</span>
                    </button>

                    {/* Experiment Branches */}
                    {bkc.experiments && bkc.experiments.map((exp) => (
                        <button
                            key={exp.build_id}
                            onClick={() => onSelectBuild(exp.build_id)}
                            className={`
                                w-full flex items-center gap-2 pl-5 pr-2 py-1 rounded-lg text-left transition-all duration-150
                                ${currentBuild === exp.build_id
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}
                            `}
                            style={currentBuild === exp.build_id
                                ? { borderLeft: `2px solid ${programColor}` }
                                : { borderLeft: '2px solid transparent' }
                            }
                            title={exp.build_id}
                        >
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="w-px h-3 bg-slate-600 ml-0.5" />
                                <FlaskConical size={12} className="text-amber-500/70" />
                            </div>
                            <span className="text-[11px] truncate flex-1">{exp.build_id}</span>
                            <span className="text-[10px] text-slate-600 flex-shrink-0">{exp.game_count}g</span>
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
}
