import { useState, useEffect } from 'react';

export default function IngestionHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ingestion/history');
            const data = await res.json();
            setHistory(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchHistory(); }, []);

    const rollback = async (id) => {
        if (!confirm('Roll back this ingestion? All data from this batch will be deleted.')) return;
        await fetch(`/api/ingestion/history/${id}/rollback`, { method: 'DELETE' });
        await fetch('/api/cache/clear', { method: 'POST' });
        fetchHistory();
    };

    if (loading) return <div className="text-slate-500 text-xs p-4">Loading history...</div>;

    return (
        <div className="space-y-2 p-1">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Ingestion History</h3>
                <button onClick={fetchHistory} className="text-slate-500 hover:text-slate-300 text-xs">Refresh</button>
            </div>
            {history.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-4">No ingestion history yet</div>
            ) : (
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-slate-500 border-b border-white/10">
                            <th className="text-left py-1 px-1">Date</th>
                            <th className="text-left py-1 px-1">Build</th>
                            <th className="text-left py-1 px-1">SKU</th>
                            <th className="text-left py-1 px-1">Type</th>
                            <th className="text-right py-1 px-1">Games</th>
                            <th className="text-center py-1 px-1">Status</th>
                            <th className="text-right py-1 px-1">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-1.5 px-1 text-slate-400">{(h.pushed_at || '').slice(0, 16).replace('T', ' ')}</td>
                                <td className="py-1.5 px-1 text-white font-medium">{h.build_id}</td>
                                <td className="py-1.5 px-1 text-slate-300">{h.sku_id}</td>
                                <td className="py-1.5 px-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${h.build_type === 'bkc' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                        {h.build_type}
                                    </span>
                                </td>
                                <td className="py-1.5 px-1 text-right text-slate-300">{h.game_count}</td>
                                <td className="py-1.5 px-1 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        h.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                        h.status === 'rolled_back' ? 'bg-red-500/20 text-red-400' :
                                        'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {h.status}
                                    </span>
                                </td>
                                <td className="py-1.5 px-1 text-right">
                                    {h.status !== 'rolled_back' && (
                                        <button onClick={() => rollback(h.id)} className="text-red-400/50 hover:text-red-400 text-[10px] bg-red-500/10 hover:bg-red-500/20 px-1.5 py-0.5 rounded transition-colors">
                                            Rollback
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
