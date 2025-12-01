import React, { useState } from 'react';
import { Search, X, Gamepad2 } from 'lucide-react';
import { programs } from '../../data';
import { getFpsColor, generateGameMetricsForBuild, getBuildTrend } from '../../utils';
import GameImage from '../common/GameImage';
import DetailedAnalysisPage from '../pages/DetailedAnalysisPage';

const GameOverlay = ({ game, skuId, buildId, onClose, allGames, onSwitchGame, selectedSku, selectedBuild }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const program = programs.find(p => p.skus.some(s => s.id === skuId));

  const filteredGames = allGames.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* Game Sidebar */}
      <div style={{
        position: 'relative',
        width: '300px',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(20, 15, 45, 0.98) 0%, rgba(15, 10, 35, 0.98) 100%)',
        borderRight: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInLeft 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(139, 92, 246, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Gamepad2 size={20} style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>All Games</span>
            <span style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#a855f7'
            }}>
              {allGames.length}
            </span>
          </div>

          {/* Current Selection Info */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Current Config
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '13px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: `${program?.color || '#a855f7'}30`,
                color: program?.color || '#a855f7',
                fontWeight: 500
              }}>
                {selectedSku?.name}
              </span>
              <span style={{
                fontSize: '13px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                fontWeight: 500
              }}>
                {selectedBuild}
              </span>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(30, 20, 60, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                padding: '10px 36px 10px 12px',
                fontSize: '14px',
                color: '#f1f5f9',
                outline: 'none'
              }}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          </div>
        </div>

        {/* Game List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {filteredGames.map(g => {
            const metrics = generateGameMetricsForBuild(g.id, skuId, buildId);
            const isActive = g.id === game.id;
            const { delta } = getBuildTrend(g.id, skuId, buildId);

            return (
              <div
                key={g.id}
                onClick={() => onSwitchGame(g)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <GameImage game={g} size={36} borderRadius={8} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#f1f5f9' : '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {g.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{g.genre}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: getFpsColor(metrics.avgFps) }}>
                    {metrics.avgFps}
                  </div>
                  <div style={{ fontSize: '10px', color: delta >= 0 ? '#10b981' : '#ef4444' }}>
                    {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(139, 92, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <span style={{
            fontSize: '11px',
            color: '#64748b',
            padding: '2px 6px',
            background: 'rgba(100, 116, 139, 0.2)',
            borderRadius: '4px'
          }}>
            ESC
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>to close</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        position: 'relative',
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)',
        animation: 'slideInRight 0.3s ease-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1001,
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(239, 68, 68, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
        >
          <X size={22} style={{ color: '#ef4444' }} />
        </button>

        <DetailedAnalysisPage game={game} skuId={skuId} buildId={buildId} />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default GameOverlay;
