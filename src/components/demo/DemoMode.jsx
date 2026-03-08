import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePrograms, games, getGameImageUrl } from '../../data';
import { useAvailableBuilds, useGameData } from '../../hooks/useGameData';
import SplashPage from '../pages/SplashPage';
import DemoGameCardView from './DemoGameCardView';

// Demo mode only cycles through configs that have real data
const DEMO_SKU_ID = 'nvl-sk-28c';

const DemoMode = ({ isActive, onClose }) => {
    const [splashOpen, setSplashOpen] = useState(true);
    const [gameExiting, setGameExiting] = useState(false);
    const [config, setConfig] = useState(null);
    const [key, setKey] = useState(0);
    const lastSlugRef = useRef(null);

    // Fetch real builds and data for the demo SKU
    const realBuilds = useAvailableBuilds(isActive ? DEMO_SKU_ID : null);
    const demoBuild = realBuilds[0] || '';
    const { availableSlugs } = useGameData(DEMO_SKU_ID, demoBuild);

    // Stable demoGames list — only recompute when slug set actually changes
    const slugKey = useMemo(() => [...availableSlugs].sort().join(','), [availableSlugs]);
    const demoGames = useMemo(() => games.filter(g => availableSlugs.has(g.slug)), [slugKey]);

    // Find the NVL S program and SKU
    const { programs } = usePrograms();
    const demoProgram = programs.find(p => p.skus.some(s => s.id === DEMO_SKU_ID));
    const demoSku = demoProgram?.skus.find(s => s.id === DEMO_SKU_ID);

    // Use refs for values needed in callbacks to keep callbacks stable
    const demoGamesRef = useRef(demoGames);
    demoGamesRef.current = demoGames;
    const demoSkuRef = useRef(demoSku);
    demoSkuRef.current = demoSku;
    const demoBuildRef = useRef(demoBuild);
    demoBuildRef.current = demoBuild;
    const demoProgramRef = useRef(demoProgram);
    demoProgramRef.current = demoProgram;

    // Preload all hero images when demo starts
    useEffect(() => {
        if (!isActive || demoGames.length === 0) return;
        demoGames.forEach(game => {
            const img = new Image();
            img.src = getGameImageUrl(game, 'hero');
        });
    }, [isActive, demoGames.length]);

    // Handle Fullscreen
    useEffect(() => {
        if (isActive) {
            document.documentElement.requestFullscreen().catch((e) => {
                console.error('Failed to enter fullscreen:', e);
            });
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch((e) => {
                    console.error('Failed to exit fullscreen:', e);
                });
            }
        }
    }, [isActive]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isActive) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, onClose]);

    // Stable config picker — reads from refs, no reactive deps that change each render
    const pickRandomConfig = useCallback(() => {
        const currentGames = demoGamesRef.current;
        const sku = demoSkuRef.current;
        const build = demoBuildRef.current;
        const program = demoProgramRef.current;

        if (!sku || !build || currentGames.length === 0) return null;

        let candidates = currentGames.filter(g => g.slug !== lastSlugRef.current);
        if (candidates.length === 0) candidates = currentGames;

        const randomGame = candidates[Math.floor(Math.random() * candidates.length)];
        lastSlugRef.current = randomGame.slug;

        return {
            game: randomGame,
            sku: sku,
            buildId: build,
            programId: program.id
        };
    }, []); // stable — reads from refs

    // Stable splash complete handler
    const handleSplashComplete = useCallback(() => {
        setConfig(pickRandomConfig());
        setGameExiting(false);
        setSplashOpen(false);
    }, [pickRandomConfig]); // pickRandomConfig is stable (empty deps)

    // Initial Config
    useEffect(() => {
        if (isActive && !config && demoGames.length > 0) {
            setConfig(pickRandomConfig());
        }
    }, [isActive, config, pickRandomConfig, demoGames.length]);

    // Main Loop Logic
    useEffect(() => {
        if (!isActive) return;

        let timeout;

        if (!splashOpen) {
            timeout = setTimeout(() => {
                setGameExiting(true);
                setTimeout(() => {
                    setSplashOpen(true);
                    setKey(k => k + 1);
                }, 1000);
            }, 14000);
        }

        return () => clearTimeout(timeout);
    }, [isActive, splashOpen]);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black overflow-hidden">
            {/* Layer 1: Game View (Underneath) */}
            {config && (
                <div className="absolute inset-0 z-0">
                    <DemoGameCardView
                        key={`${config.game.id}-${key}`}
                        game={config.game}
                        sku={config.sku}
                        buildId={config.buildId}
                        isExiting={gameExiting}
                    />
                </div>
            )}

            {/* Layer 2: Splash — unmount when closed so it can't re-fire onComplete */}
            {splashOpen && (
                <div className="absolute inset-0 z-10">
                    <SplashPage key={`splash-${key}`} onComplete={handleSplashComplete} />
                </div>
            )}

            {/* Overlay to indicate Demo Mode */}
            <div className="fixed bottom-8 right-8 z-[10001] bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/80 text-xs font-mono uppercase tracking-wider">Demo Mode • Press ESC to Exit</span>
            </div>
        </div>
    );
};

export default DemoMode;
