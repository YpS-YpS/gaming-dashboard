import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Loader2 } from 'lucide-react';

const TYPE_COLORS = {
  'raptor-x': 'bg-cyan-500',
  'gametraces': 'bg-purple-500',
  'custom': 'bg-amber-500',
};

const TRACE_KEY_TO_BADGE = {
  ptat: 'PTAT',
  presentmon: 'PM',
  capframex: 'CFX',
  emon: 'EMON',
  socwatch: 'SW',
};

function formatTimeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
}

/** Normalize backend run shape to the shape frontend components expect. */
function normalizeRuns(rawRuns) {
  if (!Array.isArray(rawRuns)) return [];
  return rawRuns.map(r => {
    const games = (r.games || []).map(g => {
      const traceBadges = Array.isArray(g.traces)
        ? g.traces
        : Object.entries(g.traces || {})
            .filter(([, v]) => v)
            .map(([k]) => TRACE_KEY_TO_BADGE[k] || k.toUpperCase());
      return {
        ...g,
        name: g.name || g.game_name,
        slug: g.slug || g.game_slug,
        traces: traceBadges,
        // In-game benchmark score (median across runs)
        fps: g.fps ?? g.scores?.avg_fps ?? null,
        fps_runs: g.scores?.avg_fps_runs ?? null,
        fps_all: g.fps_all ?? g.scores?.avg_fps_all ?? null,
        // PresentMon stats
        pm_avg: g.pm_stats?.avg_fps ?? null,
        pm_p1: g.pm_stats?.p1_low ?? null,
        pm_p01: g.pm_stats?.p01_low ?? null,
        pm_frames: g.pm_stats?.frame_count ?? null,
      };
    });

    // Aggregate run-level trace badges from all games
    const runTraces = new Set();
    games.forEach(g => (g.traces || []).forEach(t => runTraces.add(t)));

    return {
      ...r,
      folder: r.folder || r.folder_name,
      name: r.name || r.folder_name,
      path: r.path || r.folder_path,
      date: r.date || (r.created_at ? r.created_at.slice(0, 10) : '—'),
      type: r.type || r.run_type || 'bkc',
      runTraces: [...runTraces],
      games,
    };
  });
}

export default function SourceManager({ onScanComplete, onScanning }) {
  const [sources, setSources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({ label: '', path: '', type: 'raptor-x' });
  const [lastScanned, setLastScanned] = useState(null);
  const [scanStats, setScanStats] = useState(null);  // {new_runs, updated_runs} — shown briefly after scan

  useEffect(() => {
    fetch('/api/ingestion/sources')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : data.sources || [];
        // Normalize: backend returns source_type, pills use type
        setSources(list.map(s => ({ ...s, type: s.type || s.source_type })));
      })
      .catch(() => {});
  }, []);

  // Auto-load cached runs on mount
  useEffect(() => {
    fetch('/api/ingestion/runs')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.runs)) {
          onScanComplete?.(normalizeRuns(data.runs));
          setLastScanned(data.last_scanned || null);
        }
      })
      .catch(() => {});
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = () => {
    if (!form.label.trim() || !form.path.trim()) return;
    const payload = { label: form.label, path: form.path, source_type: form.type };

    fetch('/api/ingestion/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(saved => {
        setSources(prev => [...prev, { id: saved.id, label: saved.label, path: saved.path, type: saved.source_type }]);
      })
      .catch(() => {
        // Optimistic fallback
        setSources(prev => [...prev, { ...form, id: Date.now().toString() }]);
      });

    setForm({ label: '', path: '', type: 'raptor-x' });
    setShowForm(false);
  };

  const handleRemove = (id) => {
    setSources(prev => prev.filter(s => s.id !== id));
    fetch(`/api/ingestion/sources/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleScanAll = async () => {
    setScanning(true);
    onScanning?.(true);
    try {
      const res = await fetch('/api/ingestion/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Scan failed:', res.status, err.detail || err);
        onScanComplete?.([]);
        return;
      }
      const data = await res.json();
      const raw = Array.isArray(data.runs) ? data.runs : Array.isArray(data) ? data : [];
      onScanComplete?.(normalizeRuns(raw));
      setLastScanned(data.last_scanned || new Date().toISOString());
      if (data.new_runs > 0 || data.updated_runs > 0) {
        setScanStats({ new_runs: data.new_runs || 0, updated_runs: data.updated_runs || 0 });
        setTimeout(() => setScanStats(null), 5000);  // auto-clear after 5s
      }
    } catch (e) {
      console.error('Scan error:', e);
      onScanComplete?.([]);
    } finally {
      setScanning(false);
      onScanning?.(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#140f2d]/60 border-b border-primary/15 min-h-[44px] flex-shrink-0">
      {/* Source Pills */}
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto min-w-0">
        {sources.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 whitespace-nowrap flex-shrink-0"
          >
            <span className={`w-2 h-2 rounded-full ${TYPE_COLORS[s.type] || 'bg-amber-500'}`} />
            <span>{s.label}</span>
            <button
              onClick={() => handleRemove(s.id)}
              className="p-0 border-none bg-transparent text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Add Form / Button */}
        {showForm ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input
              type="text"
              placeholder="Label"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              className="w-24 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
            />
            <input
              type="text"
              placeholder="Path"
              value={form.path}
              onChange={e => setForm(f => ({ ...f, path: e.target.value }))}
              className="w-40 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white outline-none cursor-pointer"
            >
              <option value="raptor-x">Raptor-X</option>
              <option value="gametraces">GameTraces</option>
              <option value="custom">Custom</option>
            </select>
            <button
              onClick={handleAdd}
              className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-2 py-1 rounded bg-white/5 text-slate-400 text-xs border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-dashed border-white/15 text-xs text-slate-400 hover:text-amber-400 hover:border-amber-500/30 cursor-pointer transition-colors"
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>

      {/* Scan All Button */}
      <button
        onClick={handleScanAll}
        disabled={scanning}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all flex-shrink-0 ${
          scanning
            ? 'bg-amber-500/10 text-amber-400/60 border-amber-500/20 cursor-not-allowed'
            : 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
        }`}
      >
        {scanning ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        {scanning ? 'Scanning...' : 'Scan All'}
      </button>

      {/* Last scanned indicator */}
      {lastScanned && (
        <span className="text-[10px] text-slate-600 flex-shrink-0" title={lastScanned}>
          {formatTimeAgo(lastScanned)}
        </span>
      )}

      {/* Scan stats flash */}
      {scanStats && (
        <span className="text-[10px] text-emerald-400 flex-shrink-0 animate-pulse">
          +{scanStats.new_runs} new{scanStats.updated_runs > 0 ? `, ${scanStats.updated_runs} updated` : ''}
        </span>
      )}
    </div>
  );
}
