import React, { useState, useEffect, useCallback } from 'react';
import { programs, builds, games } from '../../data';
import SplashPage from '../pages/SplashPage';
import DemoGameCardView from './DemoGameCardView';

const DemoMode = ({ isActive, onClose }) => {
    const [splashOpen, setSplashOpen] = useState(true); // Controls Splash Curtain (true = covering, false = revealed)
    const [gameExiting, setGameExiting] = useState(false); // Controls Game Fade Out
    const [config, setConfig] = useState(null);
    const [key, setKey] = useState(0); // Force re-render of Splash

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

    // Random Config Generator
    const pickRandomConfig = useCallback(() => {
        const randomProgram = programs[Math.floor(Math.random() * programs.length)];
        const randomSku = randomProgram.skus[Math.floor(Math.random() * randomProgram.skus.length)];
        const randomGame = games[Math.floor(Math.random() * games.length)];
        const randomBuild = builds[0]; // Use latest build for best visuals

        return {
            game: randomGame,
            sku: randomSku, // Pass full SKU object
            buildId: randomBuild,
            programId: randomProgram.id
        };
    }, []);

    // Initial Config
    useEffect(() => {
        if (isActive && !config) {
            setConfig(pickRandomConfig());
        }
    }, [isActive, config, pickRandomConfig]);

    // Main Loop Logic
    useEffect(() => {
        if (!isActive) return;

        let timeout;

        if (!splashOpen) {
            // Game is revealed. Wait for X seconds, then trigger exit.

            // 1. Wait for 14s (Game Display Time)
            timeout = setTimeout(() => {
                setGameExiting(true); // Trigger Game Fade Out

                // 2. Wait 1s for Fade Out, then Drop Curtain
                setTimeout(() => {
                    setSplashOpen(true); // Slide Splash Down
                    setKey(k => k + 1); // Reset Splash Animation
                }, 1000);

            }, 14000);
        }

        return () => clearTimeout(timeout);
    }, [isActive, splashOpen]);

    const handleSplashComplete = useCallback(() => {
        // Splash animation finished.
        // 1. Pick NEW config for the NEXT game (while curtain is down)
        setConfig(pickRandomConfig());
        setGameExiting(false); // Reset exit state for new game

        // 2. Lift Curtain (Slide Up)
        setSplashOpen(false);
    }, [pickRandomConfig]);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black overflow-hidden">

            {/* Layer 1: Game View (Underneath) */}
            {config && (
                <div className="absolute inset-0 z-0">
                    <DemoGameCardView
                        key={`${config.game.id}-${key}`} // Force remount every cycle
                        game={config.game}
                        sku={config.sku}
                        buildId={config.buildId}
                        isExiting={gameExiting}
                    />
                </div>
            )}

            {/* Layer 2: Splash Curtain (On Top) */}
            <div
                className={`
            absolute inset-0 z-10 transition-transform duration-[1500ms] ease-in-out
            ${splashOpen ? 'translate-y-0' : '-translate-y-full'}
        `}
            >
                <SplashPage key={`splash-${key}`} onComplete={handleSplashComplete} />
            </div>

            {/* Overlay to indicate Demo Mode */}
            <div className="fixed bottom-8 right-8 z-[10001] bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/80 text-xs font-mono uppercase tracking-wider">Demo Mode • Press ESC to Exit</span>
            </div>
        </div>
    );
};

export default DemoMode;
