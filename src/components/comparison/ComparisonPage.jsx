import React, { useState } from 'react';
import { ArrowLeftRight, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { programs, builds, games } from '../../data';
import { generateGameMetricsForBuild } from '../../utils';
import ComparisonSelector from './ComparisonSelector';
import ComparisonMetrics from './ComparisonMetrics';
import ComparisonCharts from './ComparisonCharts';
import GameImage from '../common/GameImage';

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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ArrowLeftRight size={28} className="text-secondary" />
          <h1 className="m-0 text-[32px] font-bold bg-gradient-to-r from-[#06b6d4] to-[#ec4899] bg-clip-text text-transparent">
            Compare Configurations
          </h1>
        </div>
        <p className="m-0 text-base text-slate-500">
          Compare any game, SKU, and build combination side-by-side
        </p>
      </div>

      {/* Selection Area */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-5 mb-8 items-start">
        {/* Left Selector */}
        <ComparisonSelector
          side="Left"
          selection={leftSelection}
          onChange={setLeftSelection}
          color="#06b6d4"
        />

        {/* Center Controls */}
        <div className="flex flex-col gap-3 pt-[60px]">
          <button
            onClick={swapSelections}
            title="Swap left and right"
            className="w-12 h-12 rounded-xl border-none bg-primary/20 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-primary/40 hover:scale-105"
          >
            <RefreshCw size={20} className="text-secondary" />
          </button>

          <button
            onClick={copyToRight}
            title="Copy left to right"
            className="w-12 h-12 rounded-xl border-none bg-[#06b6d4]/20 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[#06b6d4]/40 hover:scale-105"
          >
            <Copy size={20} className="text-[#06b6d4]" />
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
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Left Summary */}
        <div className="bg-gradient-to-br from-[#06b6d4]/15 to-[#0f0a23]/90 rounded-2xl p-5 border border-[#06b6d4]/30">
          <div className="flex items-center gap-4">
            <GameImage game={leftSelection.game} size={64} borderRadius={12} />
            <div className="flex-1">
              <h3 className="m-0 text-lg font-semibold text-slate-50">
                {leftSelection.game.name}
              </h3>
              <p className="m-0 mt-1 text-sm text-slate-400">
                {leftSelection.sku.fullName} · Build {leftSelection.build}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-[#06b6d4]">
                {leftMetrics.avgFps}
              </div>
              <div className="text-xs text-slate-500 uppercase">
                Avg FPS
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="bg-gradient-to-br from-[#ec4899]/15 to-[#0f0a23]/90 rounded-2xl p-5 border border-[#ec4899]/30">
          <div className="flex items-center gap-4">
            <GameImage game={rightSelection.game} size={64} borderRadius={12} />
            <div className="flex-1">
              <h3 className="m-0 text-lg font-semibold text-slate-50">
                {rightSelection.game.name}
              </h3>
              <p className="m-0 mt-1 text-sm text-slate-400">
                {rightSelection.sku.fullName} · Build {rightSelection.build}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-[#ec4899]">
                {rightMetrics.avgFps}
              </div>
              <div className="text-xs text-slate-500 uppercase">
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
          <div className={`
            rounded-xl p-4 px-6 mb-6 flex items-center justify-center gap-4 border
            ${isNeutral
              ? 'bg-slate-500/15 border-slate-500/30'
              : isPositive
                ? 'bg-emerald-500/15 border-emerald-500/30'
                : 'bg-red-500/15 border-red-500/30'}
          `}>
            <span className="text-[15px] text-slate-400">
              Right configuration is
            </span>
            <span className={`
              text-2xl font-bold
              ${isNeutral ? 'text-slate-400' : isPositive ? 'text-emerald-500' : 'text-red-500'}
            `}>
              {isNeutral ? 'equivalent' : `${Math.abs(diff)} FPS ${isPositive ? 'faster' : 'slower'}`}
            </span>
            <span className={`
              text-base font-semibold px-3 py-1 rounded-lg
              ${isNeutral
                ? 'text-slate-500 bg-slate-500/20'
                : isPositive
                  ? 'text-emerald-500 bg-emerald-500/20'
                  : 'text-red-500 bg-red-500/20'}
            `}>
              {isPositive && !isNeutral ? '+' : ''}{diffPercent.toFixed(1)}%
            </span>
          </div>
        );
      })()}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-[#140f2d]/60 p-1 rounded-xl border border-primary/15 w-fit">
        {[
          { id: 'metrics', label: 'Metrics' },
          { id: 'charts', label: 'Charts' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-6 py-2.5 rounded-lg border-none cursor-pointer text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-primary/30 text-slate-50'
                : 'bg-transparent text-slate-500 hover:text-slate-400'}
            `}
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
