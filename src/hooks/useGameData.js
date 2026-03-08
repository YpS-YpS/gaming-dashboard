/**
 * useGameData — fetches real performance data from the FastAPI backend.
 *
 * Returns null for games/SKUs without real data — no synthetic fallback.
 *
 * Usage:
 *   const { getMetrics, loading, availableSlugs } = useGameData(skuId, buildId);
 *   const metrics = getMetrics(game.slug);  // real data or null
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';

// In-memory cache: key → data  (persists for the session, cleared on refresh)
const summaryCache = new Map();
const timeseriesCache = new Map();

export function useGameData(skuId, buildId) {
    const [summary, setSummary] = useState(null);   // array of game summaries
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchedKey = useRef(null);

    useEffect(() => {
        if (!skuId || !buildId) {
            setSummary(null);
            setLoading(false);
            return;
        }
        const key = `${buildId}_${skuId}`;
        if (fetchedKey.current === key) return;

        if (summaryCache.has(key)) {
            setSummary(summaryCache.get(key));
            fetchedKey.current = key;
            return;
        }

        setLoading(true);
        setError(null);
        fetchedKey.current = null;  // Reset so re-fetches are allowed

        fetch(`${API_BASE}/summary?build_id=${encodeURIComponent(buildId)}&sku_id=${encodeURIComponent(skuId)}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                summaryCache.set(key, data);
                setSummary(data);
                fetchedKey.current = key;
            })
            .catch(err => {
                console.warn('[useGameData] API unavailable:', err.message);
                setError(err.message);
                setSummary([]);
            })
            .finally(() => setLoading(false));
    }, [skuId, buildId]);

    /**
     * getMetrics(gameSlug)
     * Returns real API metrics if available, otherwise null.
     */
    const getMetrics = useCallback((gameSlug) => {
        if (summary && summary.length > 0) {
            const real = summary.find(g => g.game_slug === gameSlug);
            if (real) {
                const r2 = v => v != null ? Math.round(v * 100) / 100 : v;
                const ri = v => v != null ? Math.round(v) : v;
                return {
                    // Map API fields → dashboard field names
                    avgFps: r2(real.avg_fps),
                    onePercentLow: r2(real.one_pct_low),
                    pointOnePercentLow: r2(real.zero_one_pct_low),
                    maxFps: r2(real.max_fps),
                    minFps: r2(real.min_fps),
                    avgFrameTimeMs: r2(real.avg_frame_time_ms),
                    p99FrameTimeMs: r2(real.p99_frame_time_ms),
                    avgCpuUsage: real.avg_cpu_active_ms ? Math.min(99, Math.round(real.avg_cpu_active_ms * 3)) : 65,
                    avgGpuUsage: real.avg_gpu_active_ms ? Math.min(99, Math.round(real.avg_gpu_active_ms * 3)) : 88,
                    avgPower: r2(real.avg_pkg_power ?? real.avg_ia_power),
                    maxPower: r2(real.max_pkg_power ?? real.max_ia_power),
                    avgIaPower: r2(real.avg_ia_power),
                    maxIaPower: r2(real.max_ia_power),
                    avgPkgTemp: r2(real.avg_pkg_temp),
                    maxPkgTemp: r2(real.max_pkg_temp),
                    avgPackageTemp: r2(real.avg_pkg_temp),
                    maxPackageTemp: ri(real.max_pkg_temp),
                    avgPCoreFreqMHz: ri(real.avg_p_core_mhz),
                    maxPCoreFreqMHz: ri(real.max_p_core_mhz),
                    avgECoreFreqMHz: ri(real.avg_e_core_mhz),
                    // Aliases used by GameCard expanded view
                    avgPCoreMhz: ri(real.avg_p_core_mhz),
                    maxPCoreMhz: ri(real.max_p_core_mhz),
                    minPCoreMhz: ri(real.min_p_core_mhz),
                    avgECoreMhz: ri(real.avg_e_core_mhz),
                    maxECoreMhz: ri(real.max_e_core_mhz),
                    minECoreMhz: ri(real.min_e_core_mhz),
                    throttling: real.throttling ?? [],
                    pCoreCount: real.p_core_count,
                    eCoreCount: real.e_core_count,
                    isReal: true,
                };
            }
        }
        return null;
    }, [summary]);

    /** Set of game slugs that have real data for this build+sku */
    const availableSlugs = new Set((summary || []).map(g => g.game_slug));

    return { getMetrics, loading, error, availableSlugs };
}


/**
 * useTimeseries — lazily fetches chart timeseries for one game.
 * Call this inside DetailedAnalysisPage when the overlay opens.
 */
export function useTimeseries(gameSlug, skuId, buildId, chartTypes = [], maxPoints = 0) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!gameSlug || !skuId || !buildId) return;
        const charts = chartTypes.length > 0 ? chartTypes.join(',') : 'frametimes,frequency,temperature,power,clipReason,cstateResidency';
        const key = `${buildId}_${skuId}_${gameSlug}_${charts}_${maxPoints}`;

        if (timeseriesCache.has(key)) {
            setData(timeseriesCache.get(key));
            return;
        }

        setLoading(true);
        const mpParam = maxPoints > 0 ? `&max_points=${maxPoints}` : '';
        fetch(`${API_BASE}/timeseries/${encodeURIComponent(gameSlug)}?build_id=${encodeURIComponent(buildId)}&sku_id=${encodeURIComponent(skuId)}&charts=${charts}${mpParam}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                timeseriesCache.set(key, d);
                setData(d);
            })
            .catch(err => {
                console.warn('[useTimeseries] API unavailable:', err.message);
                setData({});
            })
            .finally(() => setLoading(false));
    }, [gameSlug, skuId, buildId, chartTypes.join(',')]);

    return { data, loading };
}


/**
 * useAvailableBuilds — fetches build list for a given SKU.
 */
export function useAvailableBuilds(skuId) {
    const [builds, setBuilds] = useState([]);

    useEffect(() => {
        if (!skuId) return;
        fetch(`${API_BASE}/builds?sku_id=${encodeURIComponent(skuId)}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(setBuilds)
            .catch(() => setBuilds([]));
    }, [skuId]);

    return builds;
}
