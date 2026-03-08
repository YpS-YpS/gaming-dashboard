import React, { useState, useEffect, useRef } from 'react';

export const ChartSkeleton = ({ height = 180 }) => (
    <div className="bg-[#0f0a23]/70 rounded-2xl p-6 border border-primary/15 mb-6">
        <div className="flex items-center gap-3 mb-5">
            <div className="w-5 h-5 rounded bg-primary/20 animate-pulse" />
            <div className="h-5 w-48 rounded bg-primary/10 animate-pulse" />
        </div>
        <div
            className="rounded-xl bg-primary/5 animate-pulse"
            style={{ height }}
        />
    </div>
);

/**
 * Wraps a chart with staggered mounting and fade-in.
 * Props:
 *   - loading: true while API data is still in flight
 *   - hasData: whether this chart has data to render
 *   - delay: ms after data arrives before this chart mounts
 *   - height: skeleton placeholder height
 */
const LazyChart = ({ children, loading = false, hasData = false, delay = 0, height = 180 }) => {
    const [ready, setReady] = useState(false);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        // Reset if still loading or no data
        if (loading || !hasData) {
            setReady(false);
            setVisible(false);
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        // Data arrived — start stagger delay
        timerRef.current = setTimeout(() => {
            setReady(true);
        }, delay);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [loading, hasData, delay]);

    // Fade in after DOM mounts
    useEffect(() => {
        if (!ready) return;
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, [ready]);

    // Done loading but no data — this chart doesn't apply, render nothing
    if (!loading && !hasData) return null;

    // Show skeleton while loading OR waiting for stagger delay
    if (!ready) return <ChartSkeleton height={height} />;

    return (
        <div
            className="transition-opacity duration-500 ease-out"
            style={{ opacity: visible ? 1 : 0 }}
        >
            {children}
        </div>
    );
};

export default LazyChart;
