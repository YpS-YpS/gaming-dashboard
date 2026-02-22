/**
 * useSystemConfig — fetches system configuration for a build+sku.
 * Powers the DetailedAnalysisPage system info display.
 */
import { useState, useEffect } from 'react';

const API_BASE = '/api';
const cache = new Map();

export function useSystemConfig(buildId, skuId) {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!buildId || !skuId) return;
        const key = `${buildId}_${skuId}`;

        if (cache.has(key)) {
            setConfig(cache.get(key));
            return;
        }

        setLoading(true);
        fetch(`${API_BASE}/system-config?build_id=${buildId}&sku_id=${skuId}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                cache.set(key, d);
                setConfig(d);
            })
            .catch(() => setConfig(null))
            .finally(() => setLoading(false));
    }, [buildId, skuId]);

    return { config, loading };
}
