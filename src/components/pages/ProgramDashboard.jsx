import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, ArrowUpAZ, ArrowDownAZ, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { programs, builds, games } from '../../data';
import { generateGameMetricsForBuild, getBuildTrend } from '../../utils';
import { GameCard, SKUCard } from '../cards';
import GameOverlay from '../overlay/GameOverlay';

export default function ProgramDashboard({ sidebarCollapsed }) {
    const { programId, skuId, gameSlug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedProgram = programs.find(p => p.id === programId) || programs[0];

    // Derived state from URL or defaults
    const selectedSku = useMemo(() => {
        if (skuId) {
            return selectedProgram.skus.find(s => s.id === skuId) || selectedProgram.skus[0];
        }
        return selectedProgram.skus[0];
    }, [selectedProgram, skuId]);

    const overlayGame = useMemo(() => {
        if (gameSlug) {
            return games.find(g => g.slug === gameSlug) || null;
        }
        return null;
    }, [gameSlug]);

    // Derived expanded state from query params
    const expandedSlug = searchParams.get('expanded');
    const expandedGameId = useMemo(() => {
        if (!expandedSlug) return null;
        const game = games.find(g => g.slug === expandedSlug);
        return game ? game.id : null;
    }, [expandedSlug]);

    // Derived build state from query params
    const selectedBuild = searchParams.get('build') || builds[0];
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');

    // Ensure URL reflects valid state if params are missing
    useEffect(() => {
        if (!skuId && selectedProgram) {
            navigate(`/program/${selectedProgram.id}/sku/${selectedProgram.skus[0].id}`, { replace: true });
        }
    }, [programId, skuId, selectedProgram, navigate]);

    const filteredGames = useMemo(() => {
        return games
            .filter(game =>
                game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                game.genre.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                const metricsA = generateGameMetricsForBuild(a.id, selectedSku.id, selectedBuild);
                const metricsB = generateGameMetricsForBuild(b.id, selectedSku.id, selectedBuild);
                const { delta: deltaA } = getBuildTrend(a.id, selectedSku.id, selectedBuild);
                const { delta: deltaB } = getBuildTrend(b.id, selectedSku.id, selectedBuild);
                switch (sortBy) {
                    case 'name-asc': return a.name.localeCompare(b.name);
                    case 'name-desc': return b.name.localeCompare(a.name);
                    case 'fps-desc': return metricsB.avgFps - metricsA.avgFps;
                    case 'fps-asc': return metricsA.avgFps - metricsB.avgFps;
                    case '1low-desc': return metricsB.onePercentLow - metricsA.onePercentLow;
                    case '1low-asc': return metricsA.onePercentLow - metricsB.onePercentLow;
                    case 'delta-desc': return deltaB - deltaA;
                    case 'delta-asc': return deltaA - deltaB;
                    default: return 0;
                }
            });
    }, [searchQuery, selectedSku, selectedBuild, sortBy]);

    // Refs for scrolling
    const gameRefs = React.useRef({});

    // Scroll to expanded game when it changes
    useEffect(() => {
        if (expandedGameId && gameRefs.current[expandedGameId]) {
            gameRefs.current[expandedGameId].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [expandedGameId]);

    const handleSkuSelect = (sku) => {
        setSearchParams({}); // Clear expanded state on SKU change
        navigate(`/program/${selectedProgram.id}/sku/${sku.id}`);
    };

    const handleToggleGame = (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        if (expandedGameId === gameId) {
            setSearchParams(prev => {
                prev.delete('expanded');
                return prev;
            }, { replace: true });
        } else {
            setSearchParams(prev => {
                prev.set('expanded', game.slug);
                return prev;
            }, { replace: true });
        }
    };

    const handleOpenDetail = (game) => {
        navigate(`/program/${selectedProgram.id}/sku/${selectedSku.id}/game/${game.slug}`);
    };

    const handleCloseOverlay = () => {
        navigate(`/program/${selectedProgram.id}/sku/${selectedSku.id}`);
    };

    const handleSwitchGame = (game) => {
        navigate(`/program/${selectedProgram.id}/sku/${selectedSku.id}/game/${game.slug}`);
    };

    if (!selectedProgram) return <div className="p-8 text-white">Program not found</div>;

    return (
        <div className="p-8">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link
                            to="/"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-none bg-primary/15 text-primary cursor-pointer text-sm font-medium hover:bg-primary/25 transition-colors"
                        >
                            <ArrowLeft size={16} />Overview
                        </Link>
                        <span className="text-3xl">{selectedProgram.icon}</span>
                        <h1 className="m-0 text-3xl font-bold text-slate-50">
                            {selectedProgram.name}
                        </h1>
                        <span
                            className="text-sm px-2.5 py-1 rounded-md font-semibold"
                            style={{ background: `${selectedProgram.color}20`, color: selectedProgram.color }}
                        >
                            {selectedProgram.codename}
                        </span>
                    </div>
                    <p className="m-0 text-base text-slate-400">
                        Gaming performance analysis · Build <span className="text-primary">{selectedBuild}</span>
                    </p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 bg-surface/60 border border-primary/20 rounded-xl py-3 pl-4 pr-11 text-sm text-slate-50 outline-none focus:border-primary/50 transition-colors"
                    />
                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
            </header>

            {/* SKU Selection */}
            <section className="mb-8">
                <h2 className="text-sm font-medium text-slate-400 mb-4">
                    Select SKU
                </h2>
                <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${Math.min(selectedProgram.skus.length, 5)}, 1fr)` }}
                >
                    {selectedProgram.skus.map((sku) => (
                        <SKUCard
                            key={sku.id}
                            sku={sku}
                            program={selectedProgram}
                            isSelected={selectedSku.id === sku.id}
                            onClick={() => handleSkuSelect(sku)}
                        />
                    ))}
                </div>
            </section>

            {/* Game Results */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-slate-400 m-0">
                        Performance Results · <span className="text-slate-50">{selectedSku.fullName}</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Sort:</span>
                        <div className="flex gap-1 bg-surface/60 p-1 rounded-xl border border-primary/15">
                            {[
                                { key: 'name', label: 'Name', icon: sortBy === 'name-desc' ? ArrowDownAZ : ArrowUpAZ, activeColor: '#a855f7' },
                                { key: 'fps', label: 'FPS', icon: sortBy === 'fps-asc' ? TrendingUp : TrendingDown, activeColor: '#10b981' },
                                { key: '1low', label: '1%', icon: sortBy === '1low-asc' ? TrendingUp : TrendingDown, activeColor: '#06b6d4' },
                                { key: 'delta', label: 'Δ', icon: sortBy === 'delta-asc' ? TrendingUp : TrendingDown, activeColor: '#f59e0b' }
                            ].map(({ key, label, icon: Icon, activeColor }) => (
                                <button
                                    key={key}
                                    onClick={() => setSortBy(sortBy === `${key}-asc` ? `${key}-desc` : sortBy === `${key}-desc` ? `${key}-asc` : `${key}-desc`)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border-none cursor-pointer text-xs font-medium transition-colors"
                                    style={{
                                        background: sortBy.startsWith(key) ? `${activeColor}30` : 'transparent',
                                        color: sortBy.startsWith(key) ? activeColor : '#64748b'
                                    }}
                                >
                                    <Icon size={14} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-slate-400">{filteredGames.length} games</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    {filteredGames.map((game) => {
                        const metrics = generateGameMetricsForBuild(game.id, selectedSku.id, selectedBuild);
                        return (
                            <div key={game.id} ref={el => gameRefs.current[game.id] = el}>
                                <GameCard
                                    game={game}
                                    metrics={metrics}
                                    isExpanded={expandedGameId === game.id}
                                    onToggle={() => handleToggleGame(game.id)}
                                    skuId={selectedSku.id}
                                    currentBuild={selectedBuild}
                                    onOpenDetail={handleOpenDetail}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Game Detail Overlay */}
            {overlayGame && (
                <GameOverlay
                    game={overlayGame}
                    skuId={selectedSku.id}
                    buildId={selectedBuild}
                    onClose={handleCloseOverlay}
                    allGames={filteredGames}
                    onSwitchGame={handleSwitchGame}
                    selectedSku={selectedSku}
                    selectedBuild={selectedBuild}
                />
            )}
        </div>
    );
}
