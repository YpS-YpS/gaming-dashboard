import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, Plus } from 'lucide-react';

const STATUS_COLORS = { completed: 'bg-emerald-500', failed: 'bg-red-500', running: 'bg-amber-500' };
const TYPE_BADGES = {
  bkc: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  experiment: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  campaign: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  single: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  validation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};
const INGESTION_BADGES = {
  new: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ingested: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  partial: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};
const TRACE_BADGE_COLORS = {
  PTAT: 'bg-cyan-500/20 text-cyan-400',
  PM: 'bg-purple-500/20 text-purple-400',
  CFX: 'bg-blue-500/20 text-blue-400',
  EMON: 'bg-orange-500/20 text-orange-400',
  SW: 'bg-pink-500/20 text-pink-400',
};

function fmtFps(v) {
  if (v == null) return '—';
  return typeof v === 'number' ? v.toFixed(1) : v;
}

function ScoreCell({ game, manualFps }) {
  const all = game.fps_all;
  const hasMultiple = all?.length > 1;
  const manual = manualFps ? parseFloat(manualFps) : null;
  const isManualOverride = manual != null && !isNaN(manual);
  // Show manual value if entered, otherwise show parsed score
  const displayFps = isManualOverride ? manual : game.fps;

  if (!hasMultiple && !isManualOverride) {
    return (
      <div className="w-[100px] text-right">
        <span className="text-[11px] text-white tabular-nums">{fmtFps(displayFps)}</span>
      </div>
    );
  }

  return (
    <div className="w-[100px] text-right flex flex-col items-end leading-tight">
      <span className={`text-[11px] tabular-nums font-medium ${isManualOverride ? 'text-cyan-400' : 'text-amber-400'}`}>
        {fmtFps(displayFps)}
      </span>
      {hasMultiple && !isManualOverride && (
        <span className="text-[9px] text-slate-500 tabular-nums">
          {all.map((v, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-slate-600 mx-0.5">·</span>}
              <span>{fmtFps(v)}</span>
            </React.Fragment>
          ))}
        </span>
      )}
      {isManualOverride && game.fps != null && (
        <span className="text-[9px] text-slate-500 tabular-nums">auto: {fmtFps(game.fps)}</span>
      )}
    </div>
  );
}

export default function RunExplorer({ runs = [], onSelectRun, onSelectGame, onAddGame, onAddRun }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ingestionFilter, setIngestionFilter] = useState('all');
  const [expandedRuns, setExpandedRuns] = useState(new Set());
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [manualFps, setManualFps] = useState({});  // key: `${runId}-${gameIdx}` → value

  const filtered = useMemo(() => {
    let result = [...runs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        (r.folder || r.name || '').toLowerCase().includes(q) ||
        (r.games || []).some(g => (g.name || '').toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (ingestionFilter !== 'all') {
      result = result.filter(r => (r.ingestion_state || 'new') === ingestionFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date || 0) - new Date(b.date || 0);
      else if (sortField === 'name') cmp = (a.folder || a.name || '').localeCompare(b.folder || b.name || '');
      else if (sortField === 'games') cmp = (a.games?.length || 0) - (b.games?.length || 0);
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [runs, search, statusFilter, ingestionFilter, sortField, sortDir]);

  const toggleExpand = (runId) => {
    setExpandedRuns(prev => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleManualFps = useCallback((key, value) => {
    setManualFps(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAddGameWithManual = useCallback((game, run, manualKey) => {
    const mfps = manualFps[manualKey];
    const enriched = mfps ? { ...game, manual_fps: parseFloat(mfps) } : game;
    onAddGame?.(enriched, run);
  }, [onAddGame, manualFps]);

  return (
    <div className="flex flex-col h-full bg-[#140f2d]/60 border border-primary/15 rounded-xl overflow-hidden">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 px-2 py-1 rounded bg-white/5 border border-white/10">
          <Search size={12} className="text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search runs or games..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs text-white placeholder-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-300 outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={ingestionFilter}
          onChange={e => setIngestionFilter(e.target.value)}
          className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-300 outline-none cursor-pointer"
        >
          <option value="all">All States</option>
          <option value="new">New</option>
          <option value="ingested">Ingested</option>
        </select>
      </div>

      {/* Column Headers */}
      <div className="flex items-center px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5 gap-1.5">
        <span className="w-4" />
        <button onClick={() => handleSort('date')} className="w-[72px] text-left bg-transparent border-none text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 p-0">
          Date {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSort('name')} className="flex-1 text-left bg-transparent border-none text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 p-0">
          Folder {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
        <span className="w-12 text-center">Traces</span>
        <span className="w-14 text-center">Type</span>
        <button onClick={() => handleSort('games')} className="w-8 text-center bg-transparent border-none text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 p-0">
          # {sortField === 'games' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
        <span className="w-14 text-center">State</span>
        <span className="w-14" />
      </div>

      {/* Run List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-xs text-slate-500">
            {runs.length === 0 ? 'No runs discovered. Click "Scan All" to begin.' : 'No runs match filters.'}
          </div>
        )}
        {filtered.map(run => {
          const runId = run.id || run.path || run.folder;
          const isExpanded = expandedRuns.has(runId);
          return (
            <div key={runId}>
              {/* Run Row */}
              <div
                className="flex items-center px-3 py-1.5 gap-1.5 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/[0.03]"
                onClick={() => { onSelectRun?.(run); }}
              >
                <button
                  onClick={e => { e.stopPropagation(); toggleExpand(runId); }}
                  className="w-4 p-0 border-none bg-transparent text-slate-500 hover:text-slate-300 cursor-pointer flex items-center justify-center"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[run.status] || 'bg-slate-500'}`} />
                <span className="w-[72px] text-[11px] text-slate-400 flex-shrink-0 truncate">{run.date || '—'}</span>
                <span className="flex-1 text-[11px] text-white truncate min-w-0 flex items-center gap-1" title={run.folder || run.name}>
                  {run.folder || run.name || '—'}
                  {run._is_new && (
                    <span className="text-[8px] px-1 py-0 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 uppercase tracking-wider font-medium">
                      new
                    </span>
                  )}
                </span>
                {/* Run-level trace badges */}
                <div className="w-12 flex items-center justify-center gap-0.5 flex-shrink-0">
                  {(run.runTraces || []).map(t => (
                    <span key={t} className={`text-[8px] px-1 py-0 rounded ${TRACE_BADGE_COLORS[t] || 'bg-slate-500/20 text-slate-400'}`}>
                      {t}
                    </span>
                  ))}
                </div>
                <span className={`w-14 text-center text-[10px] px-1 py-0.5 rounded border ${TYPE_BADGES[run.type] || TYPE_BADGES.single}`}>
                  {run.type || 'single'}
                </span>
                <span className="w-8 text-center text-[11px] text-slate-300">{run.games?.length || 0}</span>
                <span className={`w-14 text-center text-[10px] px-1 py-0.5 rounded border ${INGESTION_BADGES[run.ingestion_state || 'new']}`}>
                  {run.ingestion_state || 'new'}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const enrichedRun = {
                      ...run,
                      games: (run.games || []).map((g, gi) => {
                        const mfps = manualFps[`${runId}-${gi}`];
                        return mfps ? { ...g, manual_fps: parseFloat(mfps) } : g;
                      }),
                    };
                    onAddRun?.(enrichedRun);
                  }}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 cursor-pointer transition-colors flex-shrink-0"
                  title="Add all games to workbench"
                >
                  Add All
                </button>
              </div>

              {/* Expanded: Game column headers */}
              {isExpanded && (run.games || []).length > 0 && (
                <div className="flex items-center px-3 py-1 pl-10 gap-1.5 bg-white/[0.015] text-[9px] text-slate-600 uppercase tracking-wider border-b border-white/[0.03]">
                  <span className="w-1.5" />
                  <span className="flex-1">Game</span>
                  <span className="w-14 text-center">Traces</span>
                  <span className="w-[100px] text-right" title="In-game benchmark (median of runs)">Score</span>
                  <span className="w-14 text-right" title="PresentMon avg FPS">PM Avg</span>
                  <span className="w-12 text-right" title="PresentMon 1% low">1%</span>
                  <span className="w-12 text-right" title="PresentMon 0.1% low">0.1%</span>
                  <span className="w-[72px] text-center" title="Manual FPS (for games without parseable scores)">Manual</span>
                  <span className="w-5" />
                </div>
              )}

              {/* Expanded Game Rows */}
              {isExpanded && (run.games || []).map((game, gi) => {
                const manualKey = `${runId}-${gi}`;
                return (
                  <div
                    key={`${runId}-game-${gi}`}
                    className="flex items-center px-3 py-1 pl-10 gap-1.5 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.02]"
                    onClick={() => onSelectGame?.(game, run)}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${game.status === 'completed' ? 'bg-emerald-500' : game.status === 'failed' ? 'bg-red-500' : 'bg-slate-500'}`} />
                    <span className="flex-1 text-[11px] text-slate-300 truncate" title={game.slug || ''}>{game.name || '—'}</span>
                    {/* Trace badges */}
                    <div className="w-14 flex items-center justify-center gap-0.5">
                      {(game.traces || []).map(t => (
                        <span key={t} className={`text-[8px] px-1 py-0 rounded ${TRACE_BADGE_COLORS[t] || 'bg-slate-500/20 text-slate-400'}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                    {/* In-game score */}
                    <ScoreCell game={game} manualFps={manualFps[manualKey]} />
                    {/* PresentMon stats */}
                    <span className="w-14 text-right text-[11px] text-purple-300 tabular-nums">{fmtFps(game.pm_avg)}</span>
                    <span className="w-12 text-right text-[11px] text-slate-400 tabular-nums">{fmtFps(game.pm_p1)}</span>
                    <span className="w-12 text-right text-[11px] text-slate-500 tabular-nums">{fmtFps(game.pm_p01)}</span>
                    {/* Manual FPS input */}
                    <div className="w-[72px] flex justify-center">
                      <input
                        type="number"
                        step="0.1"
                        placeholder={game.fps != null ? 'override' : 'FPS'}
                        value={manualFps[manualKey] || ''}
                        onChange={e => handleManualFps(manualKey, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className={`w-16 px-1 py-0.5 rounded bg-white/5 border text-[10px] placeholder-slate-600 outline-none text-center tabular-nums ${
                          manualFps[manualKey]
                            ? 'border-cyan-500/40 text-cyan-400 focus:border-cyan-500/60'
                            : 'border-white/10 text-amber-400 focus:border-amber-500/50'
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => handleAddGameWithManual(game, run, manualKey)}
                      className="w-5 p-0.5 border-none bg-transparent text-slate-500 hover:text-amber-400 cursor-pointer transition-colors flex items-center justify-center"
                      title="Add to workbench"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
