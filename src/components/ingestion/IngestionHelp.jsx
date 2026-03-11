import React from 'react';
import { X } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Source Manager (Top Bar)',
    rows: [
      ['+ Add', 'Opens form to register a new source folder (label, path, type)'],
      ['Add (in form)', 'Saves the source — validates the path exists on disk'],
      ['Cancel', 'Closes the add-source form without saving'],
      ['X on pill', 'Removes that source folder'],
      ['Scan All', 'Refreshes run data — only rescans folders that changed since last scan. Cached results load automatically on page open.'],
    ],
  },
  {
    title: 'Run Explorer (Middle Left)',
    rows: [
      ['Search box', 'Filters runs and games by name'],
      ['Status dropdown', 'Filter by run status: All / Completed / Failed'],
      ['States dropdown', 'Filter by ingestion state: All / New / Ingested'],
      ['Column headers', 'Click to sort by Date, Folder, or Games (click again toggles direction)'],
      ['Chevron (arrow)', 'Expands/collapses a run to show individual game rows'],
      ['Click run row', 'Selects the run and loads its details in the right panel'],
      ['Trace badges (run)', 'Shows which trace types exist across all games in the run (PTAT, PM, CFX, etc.)'],
      ['Add All', 'Adds every game from that run to the active Workbench'],
      ['Score column', 'In-game benchmark FPS — median across all available perf-runs'],
      ['PM Avg / 1% / 0.1%', 'PresentMon frame capture stats — avg FPS, 1% low, 0.1% low'],
      ['Manual input', 'Type FPS manually for games without parseable scores (e.g. Wukong)'],
      ['+ (on game row)', 'Adds that single game to the active Workbench (includes manual FPS if entered)'],
    ],
  },
  {
    title: 'Run Detail Panel (Middle Right)',
    rows: [
      ['Info tab', 'SUT metadata: status, type, date, hostname, CPU, GPU, BIOS'],
      ['Files tab', 'Lists all files in the run folder — click one to view it'],
      ['Viewer tab', 'Renders selected file inline (JSON highlighted, CSV as table, images)'],
      ['File row click', 'Selects a file and auto-switches to Viewer tab'],
    ],
  },
  {
    title: 'Workbench (Bottom)',
    rows: [
      ['Workbench tabs', 'Switch between independent staging areas'],
      ['+ New', 'Creates a new empty workbench tab'],
      ['X on tab', 'Deletes that workbench tab'],
      ['Name', 'Label this workbench for your reference'],
      ['Build ID', 'Target build identifier (e.g. WW0826)'],
      ['SKU ID', 'Target SKU (e.g. nvl-sk-28c)'],
      ['BKC / Experiment', 'Build type — Experiment reveals Parent BKC and Label fields'],
      ['Notes', 'Description of what this build is and why — shown on the dashboard for any build with notes'],
      ['X on game row', 'Removes that game from the workbench'],
      ['Review', 'Dry-run parse: shows metrics table (FPS, Power, Temp) without writing to DB'],
      ['Push to Dashboard', 'Parses and writes all staged games to DB (must Review first)'],
    ],
  },
  {
    title: 'History (Bottom)',
    rows: [
      ['Refresh', 'Re-fetches the ingestion history'],
      ['Rollback', 'Deletes all data from that ingestion batch (with confirmation)'],
    ],
  },
];

const WORKFLOW = [
  'Add source folder(s), then click Scan All',
  'Expand a run, click + on individual games or Add All',
  'Fill in Build ID, SKU ID, and BKC/Experiment in workbench sidebar',
  'Click Review to check metrics for sanity',
  'Click Push to Dashboard to write data',
];

export default function IngestionHelp({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[720px] max-h-[80vh] bg-[#1a1438] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-amber-500/5 flex-shrink-0">
          <h2 className="text-sm font-semibold text-amber-400 tracking-wide uppercase">Ingestion Guide</h2>
          <button
            onClick={onClose}
            className="p-1 border-none bg-transparent text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Workflow summary */}
          <div>
            <h3 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">Typical Workflow</h3>
            <ol className="list-decimal list-inside space-y-1">
              {WORKFLOW.map((step, i) => (
                <li key={i} className="text-xs text-slate-300">{step}</li>
              ))}
            </ol>
          </div>

          {/* Sections */}
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">{section.title}</h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-white/10">
                    <th className="text-left py-1.5 px-2 w-40">Button</th>
                    <th className="text-left py-1.5 px-2">What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map(([button, desc], i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                      <td className="py-1.5 px-2 text-white font-medium whitespace-nowrap">{button}</td>
                      <td className="py-1.5 px-2 text-slate-400">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
