import { useState, useEffect } from 'react';

const buildTreeCache = new Map();

export function useBuildTree(skuId) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!skuId) { setTree([]); return; }

        const cacheKey = skuId;
        if (buildTreeCache.has(cacheKey)) {
            setTree(buildTreeCache.get(cacheKey));
            return;
        }

        setLoading(true);
        fetch(`/api/build-tree?sku_id=${encodeURIComponent(skuId)}`)
            .then(r => r.json())
            .then(data => {
                buildTreeCache.set(cacheKey, data);
                setTree(data);
            })
            .catch(() => setTree([]))
            .finally(() => setLoading(false));
    }, [skuId]);

    return { tree, loading };
}
