import { useState, useEffect } from 'react';

const API_BASE = '/api';

/**
 * Fetches full System Scope data for a build+sku.
 * Returns { data, loading } where data is:
 *   { bkc_name, program_name, creation_date, log_info, sections[] }
 * Each section: { module, plugin, groups[] }
 * Each group: { name, items[] }
 * Each item: { name, value }
 */
export function useSystemScope(buildId, skuId) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!buildId || !skuId) return;

        setLoading(true);
        fetch(`${API_BASE}/system-scope-details?build_id=${encodeURIComponent(buildId)}&sku_id=${encodeURIComponent(skuId)}`)
            .then(r => r.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(() => {
                setData(null);
                setLoading(false);
            });
    }, [buildId, skuId]);

    return { data, loading };
}
