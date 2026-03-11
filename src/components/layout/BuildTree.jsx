import React from 'react';
import { FlaskConical } from 'lucide-react';

/*
 * Git-graph-style build tree.
 *
 * Layout per row (fixed 32px gutter):
 *
 *   BKC row:        │          ● ── label ──────── 12g
 *                   rail      dot
 *                   x=12      x=12 (centered)
 *
 *   Experiment row: │          ───● 🧪 label ───── 12g
 *                   rail      branch  dot
 *                   x=12      x=12→24
 *
 * The rail is a continuous 1px line at x=12 inside the gutter.
 * Each row draws its own segment (top-half + bottom-half) so we
 * can hide the line above the first node and below the last.
 */

const GUTTER = 32;       // fixed graph column width
const RAIL_X = 12;       // x-center of the main vertical rail
const BKC_DOT = 10;      // BKC dot diameter
const EXP_DOT = 8;       // experiment dot diameter
const BRANCH_X = 24;     // x-center of experiment dot (end of horizontal branch)
const ROW_H_BKC = 32;    // min-height for BKC rows
const ROW_H_EXP = 28;    // min-height for experiment rows

export default function BuildTree({ tree, currentBuild, onSelectBuild, programColor = '#a855f7' }) {
    if (!tree || tree.length === 0) {
        return (
            <div className="px-2 py-3 text-[11px] text-slate-600 italic">
                No builds available
            </div>
        );
    }

    const rail = `${programColor}35`;      // dim rail
    const railBright = `${programColor}70`; // brighter when near active

    return (
        <div className="flex flex-col">
            {tree.map((bkc, bkcIdx) => {
                const exps = bkc.experiments || [];
                const hasExps = exps.length > 0;
                const isLastBkc = bkcIdx === tree.length - 1;
                const isBkcActive = currentBuild === bkc.build_id;

                // Total rows in this BKC group (1 bkc + N experiments)
                // We need the rail to continue through all of them
                return (
                    <div key={bkc.build_id}>
                        {/* ── BKC row ── */}
                        <button
                            onClick={() => onSelectBuild(bkc.build_id)}
                            className={`
                                w-full flex items-center pr-2 text-left transition-all duration-150 rounded-lg cursor-pointer border-none
                                ${isBkcActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                            `}
                            style={{
                                minHeight: ROW_H_BKC,
                                borderLeft: isBkcActive ? `2px solid ${programColor}` : '2px solid transparent',
                            }}
                            title={bkc.build_id}
                        >
                            {/* Graph gutter */}
                            <div className="flex-shrink-0 relative" style={{ width: GUTTER, minHeight: ROW_H_BKC }}>
                                {/* Rail: top half */}
                                {bkcIdx > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        left: RAIL_X,
                                        top: 0,
                                        bottom: '50%',
                                        width: 1.5,
                                        backgroundColor: rail,
                                    }} />
                                )}
                                {/* Rail: bottom half */}
                                {(hasExps || !isLastBkc) && (
                                    <div style={{
                                        position: 'absolute',
                                        left: RAIL_X,
                                        top: '50%',
                                        bottom: 0,
                                        width: 1.5,
                                        backgroundColor: rail,
                                    }} />
                                )}
                                {/* BKC dot */}
                                <div style={{
                                    position: 'absolute',
                                    left: RAIL_X - BKC_DOT / 2 + 0.75,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: BKC_DOT,
                                    height: BKC_DOT,
                                    borderRadius: '50%',
                                    backgroundColor: isBkcActive ? programColor : '#0f0a1e',
                                    border: `2px solid ${programColor}`,
                                    boxShadow: isBkcActive ? `0 0 8px ${programColor}90` : 'none',
                                    transition: 'all 150ms',
                                    zIndex: 2,
                                }} />
                            </div>

                            {/* Label */}
                            <div className="flex-1 min-w-0 ml-1">
                                <div className="text-xs font-semibold truncate">{bkc.build_id}</div>
                            </div>
                            <span className="text-[10px] text-slate-500 flex-shrink-0 ml-1">{bkc.game_count}g</span>
                        </button>

                        {/* ── Experiment rows ── */}
                        {exps.map((exp, expIdx) => {
                            const isLastExp = expIdx === exps.length - 1;
                            const isExpActive = currentBuild === exp.build_id;
                            const showRailBelow = !(isLastExp && isLastBkc);

                            return (
                                <button
                                    key={exp.build_id}
                                    onClick={() => onSelectBuild(exp.build_id)}
                                    className={`
                                        w-full flex items-center pr-2 text-left transition-all duration-150 rounded-lg cursor-pointer border-none
                                        ${isExpActive
                                            ? 'bg-white/10 text-white'
                                            : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}
                                    `}
                                    style={{
                                        minHeight: ROW_H_EXP,
                                        borderLeft: isExpActive ? '2px solid #f59e0b' : '2px solid transparent',
                                    }}
                                    title={exp.build_id}
                                >
                                    {/* Graph gutter */}
                                    <div className="flex-shrink-0 relative" style={{ width: GUTTER, minHeight: ROW_H_EXP }}>
                                        {/* Rail: top half (always, connects from BKC above) */}
                                        <div style={{
                                            position: 'absolute',
                                            left: RAIL_X,
                                            top: 0,
                                            bottom: '50%',
                                            width: 1.5,
                                            backgroundColor: rail,
                                        }} />
                                        {/* Rail: bottom half (if more nodes below) */}
                                        {showRailBelow && (
                                            <div style={{
                                                position: 'absolute',
                                                left: RAIL_X,
                                                top: '50%',
                                                bottom: 0,
                                                width: 1.5,
                                                backgroundColor: rail,
                                            }} />
                                        )}
                                        {/* Horizontal branch from rail to experiment dot */}
                                        <div style={{
                                            position: 'absolute',
                                            left: RAIL_X + 1,
                                            top: '50%',
                                            width: BRANCH_X - RAIL_X - EXP_DOT / 2,
                                            height: 1.5,
                                            backgroundColor: '#f59e0b50',
                                            transform: 'translateY(-50%)',
                                        }} />
                                        {/* Experiment dot */}
                                        <div style={{
                                            position: 'absolute',
                                            left: BRANCH_X - EXP_DOT / 2,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: EXP_DOT,
                                            height: EXP_DOT,
                                            borderRadius: '50%',
                                            backgroundColor: isExpActive ? '#f59e0b' : '#0f0a1e',
                                            border: '2px solid #f59e0b',
                                            boxShadow: isExpActive ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
                                            transition: 'all 150ms',
                                            zIndex: 2,
                                        }} />
                                    </div>

                                    {/* Icon + Label */}
                                    <FlaskConical size={11} className="text-amber-500/70 flex-shrink-0 ml-0.5" />
                                    <div className="flex-1 min-w-0 ml-1.5">
                                        {exp.label ? (
                                            <>
                                                <div className="text-[11px] font-medium truncate text-amber-300/90">{exp.label}</div>
                                                <div className="text-[9px] text-slate-600 truncate">{exp.build_id}</div>
                                            </>
                                        ) : (
                                            <div className="text-[11px] truncate">{exp.build_id}</div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-600 flex-shrink-0 ml-1">{exp.game_count}g</span>
                                </button>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
