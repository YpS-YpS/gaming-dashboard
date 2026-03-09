import React, { useState, useRef } from 'react';
import SourceManager from './SourceManager';
import RunExplorer from './RunExplorer';
import RunDetailPanel from './RunDetailPanel';
import Workbench from './Workbench';

export default function IngestionPage() {
  const [runs, setRuns] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
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

      {/* Bottom: Workbench area (340px fixed height) */}
      <div className="h-[340px] flex-shrink-0 px-3 pb-3">
        <Workbench ref={workbenchRef} />
      </div>
    </div>
  );
}
