import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Gamepad2 } from 'lucide-react';
import { programs } from '../../data';
import { getFpsColor, generateGameMetricsForBuild, getBuildTrend } from '../../utils';
import GameImage from '../common/GameImage';
import DetailedAnalysisPage from '../pages/DetailedAnalysisPage';

const GameOverlay = ({ game, skuId, buildId, onClose, allGames, onSwitchGame, selectedSku, selectedBuild }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const scrollRef = useRef(null);
  const program = programs.find(p => p.skus.some(s => s.id === skuId));

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setShowStickyHeader(scrollRef.current.scrollTop > 400);
      }
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const filteredGames = allGames.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1000] flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[4px]"
      />

      {/* Game Sidebar */}
      <div className="relative w-[300px] h-full bg-gradient-to-b from-[#140f2d]/98 to-[#0f0a23]/98 border-r border-primary/20 flex flex-col animate-slideInLeft">
        {/* Header */}
        <div className="p-5 border-b border-primary/15">
          <div className="flex items-center gap-2.5 mb-3">
            <Gamepad2 size={20} className="text-primary" />
            <span className="text-base font-semibold text-slate-50">All Games</span>
            <span className="text-xs px-2 py-0.5 rounded-[10px] bg-primary/20 text-primary">
              {allGames.length}
            </span>
          </div>

          {/* Current Selection Info */}
          <div className="bg-primary/10 rounded-lg p-2.5 px-3 mb-3">
            <div className="text-[11px] text-slate-500 uppercase mb-1">
              Current Config
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[13px] px-2 py-0.5 rounded-md font-medium"
                style={{ background: `${program?.color || '#a855f7'}30`, color: program?.color || '#a855f7' }}
              >
                {selectedSku?.name}
              </span>
              <span className="text-[13px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 font-medium">
                {selectedBuild}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e143c]/60 border border-primary/20 rounded-lg py-2.5 pl-3 pr-9 text-sm text-slate-50 outline-none focus:border-primary/40 transition-colors"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        {/* Game List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredGames.map(g => {
            const metrics = generateGameMetricsForBuild(g.id, skuId, buildId);
            const isActive = g.id === game.id;
            const { delta } = getBuildTrend(g.id, skuId, buildId);

            return (
              <div
                key={g.id}
                onClick={() => onSwitchGame(g)}
                className={`
                  flex items-center gap-3 p-2.5 rounded-xl cursor-pointer mb-1 transition-all duration-150
                  ${isActive
                    ? 'bg-primary/20 border border-primary/40'
                    : 'bg-transparent border border-transparent hover:bg-primary/10'}
                `}
              >
                <GameImage game={g} size={36} borderRadius={8} />
                <div className="flex-1 min-w-0">
                  <div className={`
                    text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis
                    ${isActive ? 'text-slate-50' : 'text-slate-400'}
                  `}>
                    {g.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{g.genre}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold" style={{ color: getFpsColor(metrics.avgFps) }}>
                    {metrics.avgFps}
                  </div>
                  <div className={`text-[10px] ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="p-3 px-5 border-t border-primary/15 flex items-center justify-center gap-1.5">
          <span className="text-[11px] text-slate-500 px-1.5 py-0.5 bg-slate-500/20 rounded">
            ESC
          </span>
          <span className="text-xs text-slate-500">to close</span>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={scrollRef}
        className="relative flex-1 h-full overflow-y-auto bg-gradient-to-br from-[#0f0a1e] via-[#1a0f2e] to-[#0d0a18] animate-slideInRight"
      >
        {/* Sticky Header */}
        <div
          className={`
            fixed top-0 left-[300px] right-0 z-[1002] px-8 py-3
            bg-[#0f0a1e]/90 backdrop-blur-md border-b border-white/10
            flex items-center justify-between transition-all duration-300 transform
            ${showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
          `}
        >
          <div className="flex items-center gap-4">
            <GameImage game={game} size={40} borderRadius={8} />
            <div>
              <h2 className="text-lg font-bold text-slate-50 leading-none mb-1">{game.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wider font-bold">
                  {game.genre}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">SKU</span>
              <span
                className="text-xs font-bold px-2 py-1 rounded"
                style={{ background: `${program?.color || '#a855f7'}20`, color: program?.color || '#a855f7' }}
              >
                {selectedSku?.name}
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Build</span>
              <span className="text-xs font-bold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10">{buildId}</span>
            </div>
            <button
              onClick={onClose}
              className="ml-4 w-10 h-10 rounded-full border-none bg-red-500 shadow-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-red-600 hover:scale-110 active:scale-90 group"
            >
              <span className="sr-only">Close</span>
              <X size={20} className="text-white transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>
        </div>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="fixed top-6 right-6 z-[1001] w-12 h-12 rounded-full border-none bg-red-500 shadow-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-red-600 hover:scale-110 active:scale-90 group"
        >
          <X size={24} className="text-white transition-transform duration-200 group-hover:rotate-90" />
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
