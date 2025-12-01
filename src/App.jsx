import React, { useState, useEffect } from 'react';
import { ChevronRight, Gauge, Search, ArrowLeft, ArrowUpAZ, ArrowDownAZ, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { programs, builds, games } from './data';
import { generateGameMetricsForBuild, getBuildTrend } from './utils';
import { GameCard, SKUCard } from './components/cards';
import LandingPage from './components/pages/LandingPage';
import GameOverlay from './components/overlay/GameOverlay';
import { ComparisonPage } from './components/comparison';

export default function GamingDashboard() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedProgram, setSelectedProgram] = useState(programs[0]);
  const [selectedSku, setSelectedSku] = useState(programs[0].skus[0]);
  const [selectedBuild, setSelectedBuild] = useState(builds[0]);
  const [expandedGame, setExpandedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc');
  const [overlayGame, setOverlayGame] = useState(null);

  // Close overlay on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && overlayGame) setOverlayGame(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overlayGame]);

  const filteredGames = games
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

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setSelectedSku(program.skus[0]);
    setExpandedGame(null);
  };

  const handleNavigateToDetail = (program, sku) => {
    setSelectedProgram(program);
    setSelectedSku(sku);
    setCurrentView('detail');
  };

  const handleNavigateToLanding = () => {
    setCurrentView('landing');
    setExpandedGame(null);
  };

  const handleOpenDetail = (game) => {
    setOverlayGame({ game, skuId: selectedSku.id, buildId: selectedBuild });
  };

  const handleCloseOverlay = () => setOverlayGame(null);
  
  const handleSwitchGame = (game) => {
    setOverlayGame({ game, skuId: selectedSku.id, buildId: selectedBuild });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)',
      color: 'white',
      fontFamily: "'Space Grotesk', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
      </div>

      <div style={{ position: 'relative', display: 'flex', zIndex: 1, height: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: sidebarCollapsed ? '72px' : '260px',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, rgba(20, 15, 45, 0.95) 0%, rgba(15, 10, 35, 0.98) 100%)',
          borderRight: '1px solid rgba(139, 92, 246, 0.15)',
          padding: sidebarCollapsed ? '24px 12px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {/* Logo */}
          <div
            onClick={handleNavigateToLanding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '32px',
              cursor: 'pointer',
              padding: '8px',
              marginLeft: '-8px',
              marginRight: '-8px',
              borderRadius: '12px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
              flexShrink: 0
            }}>
              <Gauge size={22} style={{ color: 'white' }} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  whiteSpace: 'nowrap'
                }}>
                  Intel SIV Gaming
                </h1>
                <p style={{
                  margin: 0,
                  fontSize: '11px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  whiteSpace: 'nowrap'
                }}>
                  Performance Lab
                </p>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              position: 'absolute',
              top: '32px',
              right: sidebarCollapsed ? '50%' : '-12px',
              transform: sidebarCollapsed ? 'translateX(50%)' : 'none',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              zIndex: 10
            }}
          >
            <ChevronRight
              size={14}
              style={{
                color: '#a855f7',
                transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s ease'
              }}
            />
          </button>

          {/* Programs */}
          <div style={{ marginBottom: '24px' }}>
            {!sidebarCollapsed && (
              <h2 style={{
                fontSize: '12px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                paddingLeft: '8px'
              }}>
                Programs
              </h2>
            )}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {programs.map((program) => (
                <button
                  key={program.id}
                  onClick={() => { handleProgramSelect(program); setCurrentView('detail'); }}
                  title={sidebarCollapsed ? program.name : ''}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: sidebarCollapsed ? '12px 8px' : '12px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: selectedProgram.id === program.id && currentView === 'detail'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'transparent',
                    borderLeft: selectedProgram.id === program.id && currentView === 'detail'
                      ? `3px solid ${program.color}`
                      : '3px solid transparent',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{program.icon}</span>
                  {!sidebarCollapsed && (
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 500,
                        color: selectedProgram.id === program.id && currentView === 'detail' ? '#f1f5f9' : '#94a3b8'
                      }}>
                        {program.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{program.skus.length} SKUs</div>
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Compare Mode */}
          <div style={{ marginBottom: '24px' }}>
            {!sidebarCollapsed && (
              <h2 style={{
                fontSize: '12px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                paddingLeft: '8px'
              }}>
                Tools
              </h2>
            )}
            <button
              onClick={() => setCurrentView('compare')}
              title={sidebarCollapsed ? 'Compare Configurations' : ''}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: sidebarCollapsed ? '12px 8px' : '12px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: currentView === 'compare'
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(236, 72, 153, 0.2))'
                  : 'transparent',
                borderLeft: currentView === 'compare'
                  ? '3px solid #ec4899'
                  : '3px solid transparent',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
              }}
            >
              <ArrowLeftRight size={20} style={{ color: currentView === 'compare' ? '#ec4899' : '#64748b' }} />
              {!sidebarCollapsed && (
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: currentView === 'compare' ? '#f1f5f9' : '#94a3b8'
                  }}>
                    Compare
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Any vs Any</div>
                </div>
              )}
            </button>
          </div>

          {/* Build Version */}
          {currentView === 'detail' && !sidebarCollapsed && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '12px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                paddingLeft: '8px'
              }}>
                Build Version
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {builds.map((build) => (
                  <button
                    key={build}
                    onClick={() => setSelectedBuild(build)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: selectedBuild === build ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      borderLeft: selectedBuild === build ? '3px solid #a855f7' : '3px solid transparent'
                    }}
                  >
                    <span style={{
                      fontSize: '15px',
                      fontWeight: selectedBuild === build ? 600 : 400,
                      color: selectedBuild === build ? '#f1f5f9' : '#94a3b8'
                    }}>
                      {build}
                    </span>
                    {selectedBuild === build && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: sidebarCollapsed ? '1fr' : '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{
                background: 'rgba(30, 20, 60, 0.5)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: sidebarCollapsed ? '18px' : '24px', fontWeight: 700, color: '#a855f7' }}>
                  {games.length}
                </div>
                {!sidebarCollapsed && (
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Games</div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div style={{
                  background: 'rgba(30, 20, 60, 0.5)',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#06b6d4' }}>{builds.length}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Builds</div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, height: '100vh', overflowY: 'auto', overflowX: 'hidden', scrollBehavior: 'smooth' }}>
          {currentView === 'landing' ? (
            <LandingPage onNavigate={handleNavigateToDetail} />
          ) : currentView === 'compare' ? (
            <ComparisonPage />
          ) : (
            <div style={{ padding: '32px' }}>
              {/* Header */}
              <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <button
                      onClick={handleNavigateToLanding}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#a855f7',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      <ArrowLeft size={16} />Overview
                    </button>
                    <span style={{ fontSize: '28px' }}>{selectedProgram.icon}</span>
                    <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#f1f5f9' }}>
                      {selectedProgram.name}
                    </h1>
                    <span style={{
                      fontSize: '14px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      background: `${selectedProgram.color}20`,
                      color: selectedProgram.color
                    }}>
                      {selectedProgram.codename}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
                    Gaming performance analysis · Build <span style={{ color: '#a855f7' }}>{selectedBuild}</span>
                  </p>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '260px',
                      background: 'rgba(30, 20, 60, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '10px',
                      padding: '12px 44px 12px 16px',
                      fontSize: '15px',
                      color: '#f1f5f9',
                      outline: 'none'
                    }}
                  />
                  <Search size={18} style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b'
                  }} />
                </div>
              </header>

              {/* SKU Selection */}
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#94a3b8', marginBottom: '16px' }}>
                  Select SKU
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(selectedProgram.skus.length, 5)}, 1fr)`,
                  gap: '12px'
                }}>
                  {selectedProgram.skus.map((sku) => (
                    <SKUCard
                      key={sku.id}
                      sku={sku}
                      program={selectedProgram}
                      isSelected={selectedSku.id === sku.id}
                      onClick={() => { setSelectedSku(sku); setExpandedGame(null); }}
                    />
                  ))}
                </div>
              </section>

              {/* Game Results */}
              <section>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#94a3b8', margin: 0 }}>
                    Performance Results · <span style={{ color: '#f1f5f9' }}>{selectedSku.fullName}</span>
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Sort:</span>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      background: 'rgba(20, 15, 45, 0.6)',
                      padding: '4px',
                      borderRadius: '10px',
                      border: '1px solid rgba(139, 92, 246, 0.15)'
                    }}>
                      {[
                        { key: 'name', label: 'Name', icon: sortBy === 'name-desc' ? ArrowDownAZ : ArrowUpAZ, activeColor: '#a855f7' },
                        { key: 'fps', label: 'FPS', icon: sortBy === 'fps-asc' ? TrendingUp : TrendingDown, activeColor: '#10b981' },
                        { key: '1low', label: '1%', icon: sortBy === '1low-asc' ? TrendingUp : TrendingDown, activeColor: '#06b6d4' },
                        { key: 'delta', label: 'Δ', icon: sortBy === 'delta-asc' ? TrendingUp : TrendingDown, activeColor: '#f59e0b' }
                      ].map(({ key, label, icon: Icon, activeColor }) => (
                        <button
                          key={key}
                          onClick={() => setSortBy(sortBy === `${key}-asc` ? `${key}-desc` : sortBy === `${key}-desc` ? `${key}-asc` : `${key}-desc`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: sortBy.startsWith(key) ? `${activeColor}30` : 'transparent',
                            color: sortBy.startsWith(key) ? activeColor : '#64748b'
                          }}
                        >
                          <Icon size={14} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{filteredGames.length} games</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredGames.map((game) => {
                    const metrics = generateGameMetricsForBuild(game.id, selectedSku.id, selectedBuild);
                    return (
                      <GameCard
                        key={game.id}
                        game={game}
                        metrics={metrics}
                        isExpanded={expandedGame === game.id}
                        onToggle={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                        skuId={selectedSku.id}
                        currentBuild={selectedBuild}
                        onOpenDetail={handleOpenDetail}
                      />
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Game Detail Overlay */}
      {overlayGame && (
        <GameOverlay
          game={overlayGame.game}
          skuId={overlayGame.skuId}
          buildId={overlayGame.buildId}
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
