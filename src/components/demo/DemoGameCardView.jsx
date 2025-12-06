import React, { useState, useEffect } from 'react';
import { getGameImageUrl } from '../../data';
import { generateGameMetricsForBuild } from '../../utils';
import GameCard from '../cards/GameCard';
import { Code2, Monitor, Timer, Gamepad2, Info, Cpu, Layers, Zap } from 'lucide-react';

const TechBadge = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center gap-3 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
        <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${color}20` }}
        >
            <Icon size={20} style={{ color }} />
        </div>
        <div>
            <div className="text-xs text-slate-400 mb-0.5 uppercase tracking-wider">{label}</div>
            <div className="text-base font-semibold text-slate-50">{value}</div>
        </div>
    </div>
);

const DemoGameCardView = ({ game, sku, buildId, isExiting }) => {
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const metrics = generateGameMetricsForBuild(game.id, sku.id, buildId);
    const heroUrl = getGameImageUrl(game, 'hero');

    useEffect(() => {
        // Trigger entry animation after mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Combine entry visibility with exit state
    const showContent = isVisible && !isExiting;

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden font-space">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src={heroUrl}
                    alt=""
                    onLoad={() => setHeroLoaded(true)}
                    className={`
            w-full h-full object-cover transition-opacity duration-700 ease-in-out
            ${heroLoaded && !isExiting ? 'opacity-60' : 'opacity-0'}
            animate-kenburns
          `}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000814] via-[#000814]/70 to-[#000814]/30" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000814_100%)] opacity-80" />
            </div>

            {/* Content Container - Full Width & Scaled Up */}
            <div className={`
                relative z-10 w-full h-full px-20 flex items-center transition-all duration-1000 ease-out transform
                ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
            `}>
                <div className="w-full grid grid-cols-12 gap-24 items-center">

                    {/* Left Side: Game Card */}
                    <div className="col-span-6">
                        <div className="pointer-events-none transform scale-110 origin-center"> {/* Slight scale up for the card itself */}
                            <GameCard
                                game={game}
                                metrics={metrics}
                                isExpanded={true}
                                skuId={sku.id}
                                currentBuild={buildId}
                                onToggle={() => { }}
                                onOpenDetail={() => { }}
                                iconSize={140} // Even larger icon
                                animationDelay={1600} // Start AFTER curtain lift (1500ms)
                            />
                        </div>
                    </div>

                    {/* Right Side: Details & Specs */}
                    <div className="col-span-6 flex flex-col gap-10">

                        {/* Header Info */}
                        <div>
                            <h1 className="text-8xl font-black text-white mb-6 leading-tight drop-shadow-2xl">
                                {game.name}
                            </h1>
                            <p className="text-3xl text-slate-300 leading-relaxed max-w-4xl">
                                {game.description}
                            </p>
                        </div>

                        {/* Tech Specs Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <TechBadge icon={Code2} label="Engine" value={game.engine} color="#a855f7" />
                            <TechBadge icon={Monitor} label="API" value={game.graphicsAPI} color="#3b82f6" />
                            <TechBadge icon={Timer} label="Benchmark" value={game.benchmarkDuration} color="#10b981" />
                            <TechBadge icon={Gamepad2} label="Scene" value={game.benchmarkScene} color="#f59e0b" />
                        </div>

                        {/* System Context */}
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
                            <h3 className="text-lg font-semibold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <Cpu size={24} /> System Context
                            </h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-xl text-slate-400">SKU</span>
                                    <span className="font-bold text-3xl text-primary">{sku.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-xl text-slate-400">Cores / TDP</span>
                                    <span className="font-mono text-2xl text-white">{sku.cores} • {sku.tdp}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl text-slate-400">Build Version</span>
                                    <span className="font-mono text-2xl text-emerald-400">{buildId}</span>
                                </div>
                            </div>
                        </div>

                        {/* Fun Fact */}
                        {game.funFacts && game.funFacts.length > 0 && (
                            <div className="bg-gradient-to-r from-primary/20 to-transparent rounded-2xl p-8 border-l-8 border-primary">
                                <div className="flex items-center gap-3 text-primary font-bold mb-3 text-xl">
                                    <Info size={24} />
                                    DID YOU KNOW?
                                </div>
                                <p className="text-slate-200 text-2xl italic leading-relaxed">
                                    "{game.funFacts[0]}"
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoGameCardView;
