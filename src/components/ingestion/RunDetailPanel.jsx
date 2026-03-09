import React, { useState, useEffect } from 'react';
import { Info, FolderOpen, Eye, FileText, Loader2 } from 'lucide-react';

const TABS = [
  { id: 'info', label: 'Info', icon: Info },
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'viewer', label: 'Viewer', icon: Eye },
];

function InfoTab({ run }) {
  if (!run) return null;
  const sut = run.sut || {};
  const fields = [
    ['Status', run.status],
    ['Type', run.type],
    ['Games', run.games?.length],
    ['Date', run.date],
    ['Folder', run.folder || run.name],
    ['Ingestion', run.ingestion_state || 'new'],
    ['Hostname', sut.hostname],
    ['IP', sut.ip],
    ['CPU', sut.cpu],
    ['GPU', sut.gpu],
    ['BIOS', sut.bios],
  ];

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-3">
      {fields.map(([label, value]) => (
        <React.Fragment key={label}>
          <span className="text-xs text-slate-500 whitespace-nowrap">{label}</span>
          <span className="text-xs text-white truncate" title={String(value ?? '—')}>{value ?? '—'}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function FilesTab({ run, onSelectFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!run?.path && !run?.folder) return;
    setLoading(true);
    const runPath = run.path || run.folder;
    fetch(`/api/ingestion/runs/files?path=${encodeURIComponent(runPath)}`)
      .then(r => r.json())
      .then(data => setFiles(Array.isArray(data) ? data : data.files || []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [run?.path, run?.folder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={16} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {files.length === 0 && (
        <div className="text-xs text-slate-500 p-3">No files found.</div>
      )}
      {files.map((file, i) => {
        const name = typeof file === 'string' ? file : file.name || file.path;
        const path = typeof file === 'string' ? file : file.path || file.name;
        return (
          <button
            key={i}
            onClick={() => onSelectFile?.(path)}
            className="flex items-center gap-2 px-3 py-1.5 text-left bg-transparent border-none hover:bg-white/5 cursor-pointer transition-colors border-b border-white/[0.03]"
          >
            <FileText size={12} className="text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-300 truncate">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

function ViewerTab({ filePath }) {
  const [content, setContent] = useState(null);
  const [type, setType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setContent(null);

    fetch(`/api/ingestion/runs/file?path=${encodeURIComponent(filePath)}`)
      .then(r => r.json())
      .then(data => {
        setContent(data.content || data.data || data);
        setType(data.type || guessType(filePath));
      })
      .catch(() => setContent('Error loading file'))
      .finally(() => setLoading(false));
  }, [filePath]);

  if (!filePath) {
    return <div className="text-xs text-slate-500 p-3">Select a file to view.</div>;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={16} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (type === 'image') {
    const src = typeof content === 'string' && content.startsWith('data:')
      ? content
      : `data:image/png;base64,${content}`;
    return (
      <div className="p-3">
        <img src={src} alt="preview" className="max-w-full rounded border border-white/10" />
      </div>
    );
  }

  if (type === 'csv') {
    return <CsvViewer content={content} />;
  }

  if (type === 'json') {
    const formatted = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    return (
      <div className="p-3">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-[10px] text-amber-400 bg-transparent border-none cursor-pointer hover:underline mb-1 p-0"
        >
          {collapsed ? '▶ Expand' : '▼ Collapse'}
        </button>
        {!collapsed && (
          <pre className="text-[11px] text-emerald-300 bg-black/30 rounded p-2 overflow-auto max-h-[500px] whitespace-pre-wrap break-words border border-white/5">
            {formatted}
          </pre>
        )}
      </div>
    );
  }

  // Default: plain text
  return (
    <div className="p-3">
      <pre className="text-[11px] text-slate-300 bg-black/30 rounded p-2 overflow-auto max-h-[500px] whitespace-pre-wrap break-words border border-white/5">
        {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
}

function CsvViewer({ content }) {
  if (!content) return null;
  const lines = typeof content === 'string' ? content.split('\n').filter(Boolean) : [];
  if (lines.length === 0) return <div className="text-xs text-slate-500 p-3">Empty CSV</div>;

  const headers = lines[0].split(',').slice(0, 20);
  const rows = lines.slice(1, 101).map(l => l.split(',').slice(0, 20));

  return (
    <div className="p-3 overflow-auto max-h-[500px]">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-2 py-1 text-slate-400 border-b border-white/10 whitespace-nowrap font-medium">
                {h.trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-white/[0.03]">
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1 text-slate-300 border-b border-white/[0.03] whitespace-nowrap">
                  {cell.trim()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {lines.length > 101 && (
        <div className="text-[10px] text-slate-500 mt-2">Showing first 100 of {lines.length - 1} rows</div>
      )}
    </div>
  );
}

function guessType(path) {
  if (!path) return 'text';
  const ext = path.split('.').pop()?.toLowerCase();
  if (['json'].includes(ext)) return 'json';
  if (['csv', 'tsv'].includes(ext)) return 'csv';
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
  return 'text';
}

export default function RunDetailPanel({ run }) {
  const [activeTab, setActiveTab] = useState('info');
  const [selectedFile, setSelectedFile] = useState(null);

  // Reset tab when run changes
  useEffect(() => {
    setActiveTab('info');
    setSelectedFile(null);
  }, [run?.path, run?.folder]);

  const handleSelectFile = (path) => {
    setSelectedFile(path);
    setActiveTab('viewer');
  };

  if (!run) {
    return (
      <div className="flex items-center justify-center h-full bg-[#140f2d]/60 border border-primary/15 rounded-xl">
        <div className="text-center">
          <Info size={24} className="text-slate-600 mx-auto mb-2" />
          <div className="text-xs text-slate-500">Select a run to view details</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#140f2d]/60 border border-primary/15 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="text-sm text-white font-medium truncate">{run.folder || run.name || 'Run Details'}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{run.date || ''}</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs border-none cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'text-amber-400 bg-amber-500/10 border-b-2 border-amber-500'
                  : 'text-slate-500 bg-transparent hover:text-slate-300 hover:bg-white/5'
              }`}
              style={{ borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent' }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && <InfoTab run={run} />}
        {activeTab === 'files' && <FilesTab run={run} onSelectFile={handleSelectFile} />}
        {activeTab === 'viewer' && <ViewerTab filePath={selectedFile} />}
      </div>
    </div>
  );
}
