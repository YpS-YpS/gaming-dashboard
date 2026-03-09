import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Loader2 } from 'lucide-react';

const TYPE_COLORS = {
  'raptor-x': 'bg-cyan-500',
  'gametraces': 'bg-purple-500',
  'custom': 'bg-amber-500',
};

export default function SourceManager({ onScanComplete, onScanning }) {
  const [sources, setSources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({ label: '', path: '', type: 'raptor-x' });

  useEffect(() => {
    fetch('/api/ingestion/sources')
      .then(r => r.json())
      .then(data => setSources(Array.isArray(data) ? data : data.sources || []))
      .catch(() => {});
  }, []);

  const handleAdd = () => {
    if (!form.label.trim() || !form.path.trim()) return;
    const newSource = { ...form, id: Date.now().toString() };
    setSources(prev => [...prev, newSource]);
    setForm({ label: '', path: '', type: 'raptor-x' });
    setShowForm(false);

    fetch('/api/ingestion/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSource),
    }).catch(() => {});
  };

  const handleRemove = (id) => {
    setSources(prev => prev.filter(s => s.id !== id));
    fetch(`/api/ingestion/sources/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleScanAll = async () => {
    setScanning(true);
    onScanning?.(true);
    try {
      const res = await fetch('/api/ingestion/scan', { method: 'POST' });
      const data = await res.json();
      onScanComplete?.(data.runs || data || []);
    } catch {
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
    </div>
  );
}
