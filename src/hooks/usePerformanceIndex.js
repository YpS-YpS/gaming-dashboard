/**
 * usePerformanceIndex — fetches per-build average FPS for a SKU.
 * Powers the landing page performance index display.
 */
import { useState, useEffect } from 'react';

const API_BASE = '/api';
const cache = new Map();

export function usePerformanceIndex(skuId) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!skuId) return;

        if (cache.has(skuId)) {
            setData(cache.get(skuId));
            return;
        }

        setLoading(true);
        fetch(`${API_BASE}/performance-index?sku_id=${skuId}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                cache.set(skuId, d);
                setData(d);
            })
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, [skuId]);

    return { data, loading };
}
