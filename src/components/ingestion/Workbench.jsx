import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { usePrograms } from '../../data';

const STORAGE_KEY = 'ingestion-workbenches';

const TRACE_BADGE_COLORS = {
  PTAT: 'bg-cyan-500/20 text-cyan-400',
  PM: 'bg-purple-500/20 text-purple-400',
  CFX: 'bg-blue-500/20 text-blue-400',
  EMON: 'bg-orange-500/20 text-orange-400',
};

function loadWorkbenches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [createWorkbench()];
}

function createWorkbench() {
  return {
    id: Date.now().toString(),
    name: 'Workbench',
    build_id: '',
    sku_id: '',
    build_type: 'BKC',
    parent_bkc: '',
    experiment_label: '',
    notes: '',
    games: [],
  };
}

const Workbench = forwardRef(function Workbench(props, ref) {
  const { programs } = usePrograms();
  const [workbenches, setWorkbenches] = useState(loadWorkbenches);
  const [activeIdx, setActiveIdx] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [reviewResults, setReviewResults] = useState(null);
  const [pushResult, setPushResult] = useState(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workbenches));
  }, [workbenches]);

  const active = workbenches[activeIdx] || workbenches[0];

  const updateActive = useCallback((updater) => {
    setWorkbenches(prev => prev.map((wb, i) => i === activeIdx ? (typeof updater === 'function' ? updater(wb) : { ...wb, ...updater }) : wb));
  }, [activeIdx]);

  const addGame = useCallback((game, run) => {
    setWorkbenches(prev => {
      const idx = activeIdx < prev.length ? activeIdx : 0;
      return prev.map((wb, i) => {
        if (i !== idx) return wb;
        // Avoid duplicates
        const key = `${game.name}-${run?.folder || run?.name || ''}`;
        if (wb.games.some(g => `${g.name}-${g.source_run}` === key)) return wb;
        return {
          ...wb,
          games: [...wb.games, {
            ...game,
            source_run: run?.folder || run?.name || '',
            source_path: game.game_path || run?.path || '',
          }],
        };
      });
    });
  }, [activeIdx]);

  const addAllFromRun = useCallback((run) => {
    if (!run?.games?.length) return;
    run.games.forEach(game => addGame(game, run));
  }, [addGame]);

  useImperativeHandle(ref, () => ({ addGame, addAllFromRun }), [addGame, addAllFromRun]);

  const removeGame = (gameIdx) => {
    updateActive(wb => ({ ...wb, games: wb.games.filter((_, i) => i !== gameIdx) }));
  };

  const addNewWorkbench = () => {
    const wb = createWorkbench();
    setWorkbenches(prev => [...prev, wb]);
    setActiveIdx(workbenches.length);
  };

  const removeWorkbench = (idx) => {
    if (workbenches.length <= 1) return;
    setWorkbenches(prev => prev.filter((_, i) => i !== idx));
    if (activeIdx >= idx && activeIdx > 0) setActiveIdx(activeIdx - 1);
  };

  /** Map workbench games to the shape the backend API expects. */
  const gamesToApi = (games) =>
    games.map(g => ({
      game_slug: g.game_slug || g.slug || g.name || '',
      source_path: g.source_path || g.game_path || '',
      source_type: g.source_type || 'raptor-x',
      conflict_resolution: g.conflict_resolution || 'overwrite',
      ...(g.manual_fps != null ? { manual_fps: g.manual_fps } : {}),
    }));

  const handleReview = async () => {
    setReviewing(true);
    setReviewResults(null);
    setPushResult(null);
    try {
      const res = await fetch('/api/ingestion/parse-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games: gamesToApi(active.games) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setReviewResults([{ game: 'Error', status: 'error', avg_fps: '—', power: '—', temp: '—', charts_count: '—', p1_low: err.detail || 'Review failed' }]);
        return;
      }
      const data = await res.json();
      setReviewResults(data.results || data.games || data);
    } catch {
      setReviewResults(null);
    } finally {
      setReviewing(false);
    }
  };

  const handlePush = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/ingestion/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build_id: active.build_id,
          sku_id: active.sku_id,
          build_type: active.build_type.toLowerCase(),
          parent_bkc: active.parent_bkc || null,
          experiment_label: active.experiment_label || null,
          notes: active.notes || null,
          games: gamesToApi(active.games),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPushResult({ error: data.detail || 'Push failed' });
      } else {
        setPushResult(data);
      }
    } catch (err) {
      setPushResult({ error: err.message || 'Push failed' });
    } finally {
      setPushing(false);
    }
  };

  const STATUS_BADGE = {
    ok: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
  };

  return (
    <div className="flex flex-col h-full bg-[#140f2d]/60 border border-amber-500/25 rounded-xl overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-white/5 px-1 bg-black/20">
        {workbenches.map((wb, idx) => (
          <div
            key={wb.id}
            onClick={() => { setActiveIdx(idx); setReviewResults(null); setPushResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer transition-colors border-b-2 ${
              idx === activeIdx
                ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <span className="truncate max-w-[100px]">{wb.name || 'Workbench'}</span>
            {workbenches.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); removeWorkbench(idx); }}
                className="p-0 border-none bg-transparent text-slate-600 hover:text-red-400 cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addNewWorkbench}
          className="flex items-center gap-1 px-2 py-2 text-xs text-slate-500 hover:text-amber-400 bg-transparent border-none cursor-pointer transition-colors"
        >
          <Plus size={12} />
          New
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Metadata Sidebar */}
        <div className="w-[360px] flex-shrink-0 border-r border-white/5 p-3 flex flex-col gap-2 overflow-y-auto">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={active.name}
            onChange={e => updateActive({ name: e.target.value })}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-amber-500/50 w-full"
          />
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Build ID</label>
          <input
            type="text"
            value={active.build_id}
            onChange={e => updateActive({ build_id: e.target.value })}
            placeholder="e.g. WW0826"
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500/50 w-full"
          />
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">SKU</label>
          <div className="max-h-[140px] overflow-y-auto rounded bg-white/[0.03] border border-white/10 px-2 py-1.5 flex flex-col gap-1.5">
            {programs.map(prog => (
              <div key={prog.id}>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">{prog.codename || prog.name}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {prog.skus.map(sku => (
                    <label key={sku.id} className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer hover:text-white transition-colors">
                      <input
                        type="radio"
                        name={`sku-${active.id}`}
                        checked={active.sku_id === sku.id}
                        onChange={() => updateActive({ sku_id: sku.id })}
                        className="accent-amber-500 w-3 h-3"
                      />
                      <span title={`${sku.fullName} — ${sku.cores}, ${sku.tdp}`}>{sku.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Build Type</label>
          <div className="flex gap-3">
            {['BKC', 'Experiment'].map(t => (
              <label key={t} className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name={`buildtype-${active.id}`}
                  checked={active.build_type === t}
                  onChange={() => updateActive({ build_type: t })}
                  className="accent-amber-500"
                />
                {t}
              </label>
            ))}
          </div>
          {active.build_type === 'Experiment' && (
            <>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Parent BKC</label>
              <input
                type="text"
                value={active.parent_bkc}
                onChange={e => updateActive({ parent_bkc: e.target.value })}
                placeholder="e.g. WW0826"
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500/50 w-full"
              />
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Experiment Label</label>
              <input
                type="text"
                value={active.experiment_label}
                onChange={e => updateActive({ experiment_label: e.target.value })}
                placeholder="e.g. OC-test-1"
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500/50 w-full"
              />
            </>
          )}
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Notes</label>
          <textarea
            value={active.notes || ''}
            onChange={e => updateActive({ notes: e.target.value })}
            placeholder="Why this build? What changed?"
            rows={3}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500/50 w-full resize-none"
          />

          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleReview}
              disabled={reviewing || active.games.length === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                reviewing || active.games.length === 0
                  ? 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
              }`}
            >
              {reviewing ? <Loader2 size={12} className="animate-spin" /> : null}
              {reviewing ? 'Reviewing...' : 'Review'}
            </button>
            <button
              onClick={handlePush}
              disabled={pushing || !reviewResults}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                pushing || !reviewResults
                  ? 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              {pushing ? <Loader2 size={12} className="animate-spin" /> : null}
              {pushing ? 'Pushing...' : 'Push'}
            </button>
          </div>
        </div>

        {/* Main Game Table + Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Game Table */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5 gap-2 sticky top-0 bg-[#140f2d]/95">
              <span className="flex-1">Game</span>
              <span className="w-28">Source Run</span>
              <span className="w-28 text-center">Traces</span>
              <span className="w-12 text-right">FPS</span>
              <span className="w-8" />
            </div>
            {active.games.length === 0 && (
              <div className="flex items-center justify-center h-20 text-xs text-slate-500">
                Add games from the Run Explorer above
              </div>
            )}
            {active.games.map((game, gi) => (
              <div key={gi} className="flex items-center px-3 py-1.5 gap-2 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03]">
                <span className="flex-1 text-xs text-white truncate">{game.name || '—'}</span>
                <span className="w-28 text-xs text-slate-500 truncate">{game.source_run || '—'}</span>
                <div className="w-28 flex items-center justify-center gap-1">
                  {(game.traces || []).map(t => (
                    <span key={t} className={`text-[9px] px-1 py-0.5 rounded ${TRACE_BADGE_COLORS[t] || 'bg-slate-500/20 text-slate-400'}`}>
                      {t}
                    </span>
                  ))}
                </div>
                <span className={`w-12 text-right text-xs tabular-nums ${game.manual_fps != null ? 'text-cyan-400' : 'text-slate-300'}`}>
                  {game.manual_fps != null ? game.manual_fps : (game.fps != null ? game.fps : '—')}
                </span>
                <button
                  onClick={() => removeGame(gi)}
                  className="w-8 p-0.5 border-none bg-transparent text-slate-600 hover:text-red-400 cursor-pointer transition-colors flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Review Results */}
          {reviewResults && Array.isArray(reviewResults) && (
            <div className="border-t border-amber-500/20 bg-amber-500/[0.03] overflow-y-auto max-h-[160px]">
              <div className="px-3 py-1.5 text-[10px] text-amber-400 uppercase tracking-wider border-b border-amber-500/10 sticky top-0 bg-[#140f2d]/95">
                Review Results
              </div>
              <div className="flex items-center px-3 py-1 text-[10px] text-slate-500 uppercase tracking-wider gap-3 border-b border-white/5">
                <span className="flex-1">Game</span>
                <span className="w-16 text-right">Avg FPS</span>
                <span className="w-16 text-right">1% Low</span>
                <span className="w-14 text-right">Power</span>
                <span className="w-14 text-right">Temp</span>
                <span className="w-14 text-right">Charts</span>
                <span className="w-14 text-center">Status</span>
              </div>
              {reviewResults.map((r, i) => {
                const s = r.summary || {};
                const isManual = s._manual_fps;
                return (
                  <div key={i} className="flex items-center px-3 py-1 gap-3 border-b border-white/[0.02] text-xs">
                    <span className="flex-1 text-slate-300 truncate">{r.game_slug || r.game || r.name || '—'}</span>
                    <span className={`w-16 text-right ${isManual ? 'text-cyan-400' : 'text-white'}`}>{s.avg_fps ?? r.avg_fps ?? '—'}</span>
                    <span className="w-16 text-right text-white">{s.one_pct_low ?? r.p1_low ?? '—'}</span>
                    <span className="w-14 text-right text-white">{s.avg_ia_power ?? r.power ?? '—'}</span>
                    <span className="w-14 text-right text-white">{s.max_pkg_temp ?? r.temp ?? '—'}</span>
                    <span className="w-14 text-right text-white">{r.chart_types_found?.length ?? r.charts_count ?? '—'}</span>
                    <span className={`w-14 text-center ${STATUS_BADGE[r.status] || 'text-slate-400'}`}>
                      {r.status === 'ok' ? <CheckCircle size={12} className="inline" /> :
                       r.status === 'error' ? <AlertCircle size={12} className="inline" /> :
                       r.status || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Push Result */}
          {pushResult && (
            <div className={`px-3 py-2 border-t text-xs flex items-center gap-2 ${
              pushResult.error
                ? 'border-red-500/20 bg-red-500/[0.05] text-red-400'
                : 'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400'
            }`}>
              {pushResult.error ? (
                <>
                  <AlertCircle size={14} />
                  <span>Error: {pushResult.error}</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>
                    Successfully pushed {pushResult.games_written?.length ?? '?'} games.
                    {pushResult.ingestion_id && ` Ingestion ID: ${pushResult.ingestion_id}`}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Workbench;
