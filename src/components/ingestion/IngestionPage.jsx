import React, { useState, useRef, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import SourceManager from './SourceManager';
import RunExplorer from './RunExplorer';
import RunDetailPanel from './RunDetailPanel';
import Workbench from './Workbench';
import IngestionHistory from './IngestionHistory';
import IngestionHelp from './IngestionHelp';

export default function IngestionPage() {
  const [runs, setRuns] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [bottomView, setBottomView] = useState('workbench');
  const [showHelp, setShowHelp] = useState(false);
  const workbenchRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(520);
  const [bottomHeight, setBottomHeight] = useState(480);
  const draggingCol = useRef(false);
  const draggingRow = useRef(false);

  const handleColResize = useCallback((e) => {
    e.preventDefault();
    draggingCol.current = true;
    const startX = e.clientX;
    const startW = panelWidth;

    const onMove = (ev) => {
      if (!draggingCol.current) return;
      const delta = startX - ev.clientX;
      setPanelWidth(Math.max(320, Math.min(800, startW + delta)));
    };
    const onUp = () => {
      draggingCol.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  const handleRowResize = useCallback((e) => {
    e.preventDefault();
    draggingRow.current = true;
    const startY = e.clientY;
    const startH = bottomHeight;

    const onMove = (ev) => {
      if (!draggingRow.current) return;
      const delta = startY - ev.clientY;
      setBottomHeight(Math.max(200, Math.min(700, startH + delta)));
    };
    const onUp = () => {
      draggingRow.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [bottomHeight]);

  const handleScanComplete = (discoveredRuns) => {
    setRuns(discoveredRuns);
  };

  const handleAddGame = (game, run) => {
    workbenchRef.current?.addGame(game, run);
  };

  const handleAddRun = (run) => {
    workbenchRef.current?.addAllFromRun(run);
  };

  const handleSelectGame = (game, run) => {
    // Show game's subfolder in the detail panel
    setSelectedRun({
      ...run,
      folder: game.name || game.game_name || run.folder,
      name: game.name || game.game_name,
      path: game.game_path || run.path,
      _isGame: true,
      _parentRun: run.folder,
    });
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top: Source Manager bar */}
      <SourceManager
        onScanComplete={handleScanComplete}
        onScanning={setScanning}
      />

      {/* Middle: Split pane — RunExplorer + RunDetailPanel */}
      <div className="flex flex-1 min-h-0 gap-3 p-3">
        {/* Left: RunExplorer (flexible) */}
        <div className="flex-1 min-w-0">
          <RunExplorer
            runs={runs}
            scanning={scanning}
            onSelectRun={setSelectedRun}
            onSelectGame={handleSelectGame}
            onAddGame={handleAddGame}
            onAddRun={handleAddRun}
          />
        </div>

        {/* Resize handle (vertical divider) */}
        <div
          onMouseDown={handleColResize}
          className="w-1.5 flex-shrink-0 cursor-col-resize group flex items-center justify-center"
        >
          <div className="w-0.5 h-12 rounded-full bg-white/10 group-hover:bg-amber-500/50 transition-colors" />
        </div>

        {/* Right: RunDetailPanel (resizable) */}
        <div className="flex-shrink-0 h-full" style={{ width: panelWidth }}>
          <RunDetailPanel
            run={selectedRun}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>
      </div>

      {/* Resize handle (horizontal divider) */}
      <div
        onMouseDown={handleRowResize}
        className="h-1.5 flex-shrink-0 cursor-row-resize group flex items-center justify-center px-3"
      >
        <div className="h-0.5 w-16 rounded-full bg-white/10 group-hover:bg-amber-500/50 transition-colors" />
      </div>

      {/* Bottom: Workbench / History area (resizable) */}
      <div className="flex-shrink-0 px-3 pb-3 flex flex-col" style={{ height: bottomHeight }}>
        <div className="flex items-center justify-end gap-1 mb-1">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 border border-transparent hover:text-amber-400 hover:border-amber-500/30 bg-transparent cursor-pointer transition-colors mr-auto"
            title="Show ingestion guide"
          >
            <HelpCircle size={13} />
            Help
          </button>
          <button
            onClick={() => setBottomView('workbench')}
            className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer transition-colors ${
              bottomView === 'workbench'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
            }`}
          >
            Workbench
          </button>
          <button
            onClick={() => setBottomView('history')}
            className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer transition-colors ${
              bottomView === 'history'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
            }`}
          >
            History
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {bottomView === 'workbench' ? (
            <Workbench ref={workbenchRef} />
          ) : (
            <div className="h-full bg-[#140f2d]/60 border border-amber-500/25 rounded-xl overflow-y-auto">
              <IngestionHistory />
            </div>
          )}
        </div>
      </div>
      {showHelp && <IngestionHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}
