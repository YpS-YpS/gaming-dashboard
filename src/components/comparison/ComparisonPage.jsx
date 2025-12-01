import React, { useState } from 'react';
import { ArrowLeftRight, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { programs, builds, games } from '../../data';
import { generateGameMetricsForBuild } from '../../utils';
import ComparisonSelector from './ComparisonSelector';
import ComparisonMetrics from './ComparisonMetrics';
import ComparisonCharts from './ComparisonCharts';

const ComparisonPage = () => {
  const [leftSelection, setLeftSelection] = useState({
    program: programs[0],
    sku: programs[0].skus[0],
    build: builds[0],
    game: games[0]
  });

  const [rightSelection, setRightSelection] = useState({
    program: programs[1],
    sku: programs[1].skus[0],
    build: builds[0],
    game: games[0]
  });

  const [activeTab, setActiveTab] = useState('metrics');

  const leftMetrics = generateGameMetricsForBuild(
    leftSelection.game.id,
    leftSelection.sku.id,
    leftSelection.build
  );

  const rightMetrics = generateGameMetricsForBuild(
    rightSelection.game.id,
    rightSelection.sku.id,
    rightSelection.build
  );

  const swapSelections = () => {
    const temp = { ...leftSelection };
    setLeftSelection({ ...rightSelection });
    setRightSelection(temp);
  };

  const copyToRight = () => {
    setRightSelection({ ...leftSelection });
  };

  const leftLabel = `${leftSelection.game.name} (${leftSelection.sku.name} · ${leftSelection.build})`;
  const rightLabel = `${rightSelection.game.name} (${rightSelection.sku.name} · ${rightSelection.build})`;

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <ArrowLeftRight size={28} style={{ color: '#a855f7' }} />
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #06b6d4, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Compare Configurations
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
          Compare any game, SKU, and build combination side-by-side
        </p>
      </div>

      {/* Selection Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '20px',
        marginBottom: '32px',
        alignItems: 'start'
      }}>
        {/* Left Selector */}
        <ComparisonSelector
          side="Left"
          selection={leftSelection}
          onChange={setLeftSelection}
          color="#06b6d4"
        />

        {/* Center Controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingTop: '60px'
        }}>
          <button
            onClick={swapSelections}
            title="Swap left and right"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(139, 92, 246, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <RefreshCw size={20} style={{ color: '#a855f7' }} />
          </button>

          <button
            onClick={copyToRight}
            title="Copy left to right"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(6, 182, 212, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Copy size={20} style={{ color: '#06b6d4' }} />
          </button>
        </div>

        {/* Right Selector */}
        <ComparisonSelector
          side="Right"
          selection={rightSelection}
          onChange={setRightSelection}
          color="#ec4899"
        />
      </div>

      {/* Quick Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Left Summary */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(15, 10, 35, 0.9))',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(6, 182, 212, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '48px' }}>{leftSelection.game.image}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f1f5f9' }}>
                {leftSelection.game.name}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#94a3b8' }}>
                {leftSelection.sku.fullName} · Build {leftSelection.build}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#06b6d4' }}>
                {leftMetrics.avgFps}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
                Avg FPS
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(15, 10, 35, 0.9))',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(236, 72, 153, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '48px' }}>{rightSelection.game.image}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f1f5f9' }}>
                {rightSelection.game.name}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#94a3b8' }}>
                {rightSelection.sku.fullName} · Build {rightSelection.build}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#ec4899' }}>
                {rightMetrics.avgFps}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
                Avg FPS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FPS Difference Banner */}
      {(() => {
        const diff = rightMetrics.avgFps - leftMetrics.avgFps;
        const diffPercent = ((rightMetrics.avgFps - leftMetrics.avgFps) / leftMetrics.avgFps) * 100;
        const isPositive = diff > 0;
        const isNeutral = Math.abs(diffPercent) < 1;

        return (
          <div style={{
            background: isNeutral
              ? 'rgba(100, 116, 139, 0.15)'
              : isPositive
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            border: `1px solid ${isNeutral ? 'rgba(100, 116, 139, 0.3)' : isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            <span style={{ fontSize: '15px', color: '#94a3b8' }}>
              Right configuration is
            </span>
            <span style={{
              fontSize: '24px',
              fontWeight: 700,
              color: isNeutral ? '#94a3b8' : isPositive ? '#10b981' : '#ef4444'
            }}>
              {isNeutral ? 'equivalent' : `${Math.abs(diff)} FPS ${isPositive ? 'faster' : 'slower'}`}
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 600,
              color: isNeutral ? '#64748b' : isPositive ? '#10b981' : '#ef4444',
              padding: '4px 12px',
              borderRadius: '8px',
              background: isNeutral ? 'rgba(100, 116, 139, 0.2)' : isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
            }}>
              {isPositive && !isNeutral ? '+' : ''}{diffPercent.toFixed(1)}%
            </span>
          </div>
        );
      })()}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: 'rgba(20, 15, 45, 0.6)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        width: 'fit-content'
      }}>
        {[
          { id: 'metrics', label: 'Metrics' },
          { id: 'charts', label: 'Charts' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              color: activeTab === tab.id ? '#f1f5f9' : '#64748b'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'metrics' && (
        <ComparisonMetrics
          leftMetrics={leftMetrics}
          rightMetrics={rightMetrics}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
        />
      )}

      {activeTab === 'charts' && (
        <ComparisonCharts
          leftSelection={leftSelection}
          rightSelection={rightSelection}
        />
      )}
    </div>
  );
};

export default ComparisonPage;
