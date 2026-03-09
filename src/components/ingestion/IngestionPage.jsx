import React, { useState, useRef } from 'react';
import SourceManager from './SourceManager';
import RunExplorer from './RunExplorer';
import RunDetailPanel from './RunDetailPanel';
import Workbench from './Workbench';
import IngestionHistory from './IngestionHistory';

export default function IngestionPage() {
  const [runs, setRuns] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [bottomView, setBottomView] = useState('workbench');
  const workbenchRef = useRef(null);

  const handleScanComplete = (discoveredRuns) => {
    setRuns(discoveredRuns);
  };

  const handleAddGame = (game, run) => {
    workbenchRef.current?.addGame(game, run);
  };

  const handleAddRun = (run) => {
    workbenchRef.current?.addAllFromRun(run);
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
            onAddGame={handleAddGame}
            onAddRun={handleAddRun}
          />
        </div>

        {/* Right: RunDetailPanel (420px fixed) */}
        <div className="w-[420px] flex-shrink-0">
          <RunDetailPanel
            run={selectedRun}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>
      </div>

      {/* Bottom: Workbench / History area (340px fixed height) */}
      <div className="h-[340px] flex-shrink-0 px-3 pb-3 flex flex-col">
        <div className="flex items-center justify-end gap-1 mb-1">
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
    </div>
  );
}
