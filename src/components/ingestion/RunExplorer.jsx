import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Plus, PlusCircle } from 'lucide-react';

const STATUS_COLORS = { completed: 'bg-emerald-500', failed: 'bg-red-500', running: 'bg-amber-500' };
const TYPE_BADGES = {
  bkc: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  experiment: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
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
};

export default function RunExplorer({ runs = [], onSelectRun, onAddGame, onAddRun }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ingestionFilter, setIngestionFilter] = useState('all');
  const [expandedRuns, setExpandedRuns] = useState(new Set());
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

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
      <div className="flex items-center px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5 gap-2">
        <span className="w-4" />
        <button onClick={() => handleSort('date')} className="w-20 text-left bg-transparent border-none text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 p-0">
          Date {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSort('name')} className="flex-1 text-left bg-transparent border-none text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 p-0">
          Folder {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
        <span className="w-16 text-center">Type</span>
        <button onClick={() => handleSort('games')} className="w-12 text-center bg-transparent border-none text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 p-0">
          Games {sortField === 'games' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
        <span className="w-16 text-center">State</span>
        <span className="w-16" />
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
                className="flex items-center px-3 py-2 gap-2 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/[0.03]"
                onClick={() => { onSelectRun?.(run); }}
              >
                <button
                  onClick={e => { e.stopPropagation(); toggleExpand(runId); }}
                  className="w-4 p-0 border-none bg-transparent text-slate-500 hover:text-slate-300 cursor-pointer flex items-center justify-center"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[run.status] || 'bg-slate-500'}`} />
                <span className="w-20 text-xs text-slate-400 flex-shrink-0 truncate">{run.date || '—'}</span>
                <span className="flex-1 text-xs text-white truncate min-w-0" title={run.folder || run.name}>
                  {run.folder || run.name || '—'}
                </span>
                <span className={`w-16 text-center text-[10px] px-1.5 py-0.5 rounded border ${TYPE_BADGES[run.type] || TYPE_BADGES.bkc}`}>
                  {run.type || 'bkc'}
                </span>
                <span className="w-12 text-center text-xs text-slate-300">{run.games?.length || 0}</span>
                <span className={`w-16 text-center text-[10px] px-1.5 py-0.5 rounded border ${INGESTION_BADGES[run.ingestion_state || 'new']}`}>
                  {run.ingestion_state || 'new'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onAddRun?.(run); }}
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 cursor-pointer transition-colors"
                  title="Add all games to workbench"
                >
                  Add All
                </button>
              </div>

              {/* Expanded Game Rows */}
              {isExpanded && (run.games || []).map((game, gi) => (
                <div
                  key={`${runId}-game-${gi}`}
                  className="flex items-center px-3 py-1.5 pl-10 gap-2 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-b border-white/[0.02]"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${game.status === 'completed' ? 'bg-emerald-500' : game.status === 'failed' ? 'bg-red-500' : 'bg-slate-500'}`} />
                  <span className="flex-1 text-xs text-slate-300 truncate">{game.name || '—'}</span>
                  <span className="text-[10px] text-slate-500 w-20 truncate">{game.slug || '—'}</span>
                  <div className="flex items-center gap-1">
                    {(game.traces || []).map(t => (
                      <span key={t} className={`text-[9px] px-1 py-0.5 rounded ${TRACE_BADGE_COLORS[t] || 'bg-slate-500/20 text-slate-400'}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="w-12 text-right text-xs text-slate-300">{game.fps != null ? `${game.fps}` : '—'}</span>
                  <button
                    onClick={() => onAddGame?.(game, run)}
                    className="p-0.5 border-none bg-transparent text-slate-500 hover:text-amber-400 cursor-pointer transition-colors"
                    title="Add to workbench"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
