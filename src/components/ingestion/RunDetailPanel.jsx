import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Info, FolderOpen, Eye, FileText, Loader2, ChevronRight, ChevronDown, Folder, ExternalLink, Maximize2, X } from 'lucide-react';

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

/** Build a nested tree from flat file list with relative_path */
function buildFileTree(files) {
  const root = { __files: [] };
  for (const file of files) {
    const rel = typeof file === 'string' ? file : file.relative_path || file.name || '';
    const parts = rel.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = { __files: [] };
      node = node[parts[i]];
    }
    node.__files.push(file);
  }
  return root;
}

const EXT_COLORS = {
  '.json': 'text-emerald-400',
  '.csv': 'text-purple-400',
  '.png': 'text-pink-400', '.jpg': 'text-pink-400', '.jpeg': 'text-pink-400',
  '.log': 'text-slate-500', '.txt': 'text-slate-500',
};

function FileTreeNode({ name, node, depth, onSelectFile, expandedDirs, toggleDir, dirPath }) {
  const isExpanded = expandedDirs.has(dirPath);
  const subDirs = Object.keys(node).filter(k => k !== '__files').sort();
  const files = (node.__files || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <>
      {/* Folder row */}
      <button
        onClick={() => toggleDir(dirPath)}
        className="flex items-center gap-1.5 w-full text-left bg-transparent border-none hover:bg-white/5 cursor-pointer transition-colors py-1 pr-2"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isExpanded ? <ChevronDown size={10} className="text-slate-500 flex-shrink-0" /> : <ChevronRight size={10} className="text-slate-500 flex-shrink-0" />}
        <Folder size={12} className="text-amber-500/70 flex-shrink-0" />
        <span className="text-[11px] text-slate-300 truncate">{name}</span>
        <span className="text-[9px] text-slate-600 ml-auto flex-shrink-0">{files.length > 0 ? files.length : ''}</span>
      </button>
      {isExpanded && (
        <>
          {subDirs.map(dir => (
            <FileTreeNode
              key={dirPath + '/' + dir}
              name={dir}
              node={node[dir]}
              depth={depth + 1}
              onSelectFile={onSelectFile}
              expandedDirs={expandedDirs}
              toggleDir={toggleDir}
              dirPath={dirPath + '/' + dir}
            />
          ))}
          {files.map((file, i) => {
            const absPath = typeof file === 'string' ? file : file.absolute_path || file.path || file.name;
            const fileName = typeof file === 'string' ? file.split('/').pop() : file.name;
            const ext = (typeof file === 'object' ? file.extension : '') || ('.' + (fileName || '').split('.').pop()?.toLowerCase());
            const size = typeof file === 'object' && file.size != null
              ? file.size < 1024 ? `${file.size} B`
                : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / 1048576).toFixed(1)} MB`
              : null;
            return (
              <button
                key={i}
                onClick={() => onSelectFile?.(absPath)}
                className="flex items-center gap-1.5 w-full text-left bg-transparent border-none hover:bg-white/5 cursor-pointer transition-colors py-1 pr-2"
                style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
              >
                <FileText size={11} className={`flex-shrink-0 ${EXT_COLORS[ext] || 'text-slate-500'}`} />
                <span className="text-[11px] text-slate-300 truncate flex-1 min-w-0">{fileName}</span>
                {size && <span className="text-[9px] text-slate-600 flex-shrink-0 ml-1">{size}</span>}
              </button>
            );
          })}
        </>
      )}
    </>
  );
}

function FilesTab({ run, onSelectFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState(new Set());

  useEffect(() => {
    if (!run?.path && !run?.folder) return;
    setLoading(true);
    setExpandedDirs(new Set());
    const runPath = run.path || run.folder;
    fetch(`/api/ingestion/runs/files?path=${encodeURIComponent(runPath)}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : data.files || [];
        setFiles(list);
        // Auto-expand root-level dirs
        const rootDirs = new Set();
        list.forEach(f => {
          const rel = f.relative_path || f.name || '';
          const first = rel.split('/')[0];
          if (rel.includes('/')) rootDirs.add('/' + first);
        });
        setExpandedDirs(rootDirs);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [run?.path, run?.folder]);

  const tree = useMemo(() => buildFileTree(files), [files]);

  const toggleDir = useCallback((dirPath) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={16} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  const subDirs = Object.keys(tree).filter(k => k !== '__files').sort();
  const rootFiles = tree.__files || [];

  return (
    <div className="flex flex-col overflow-y-auto">
      {files.length === 0 && (
        <div className="text-xs text-slate-500 p-3">No files found.</div>
      )}
      {subDirs.map(dir => (
        <FileTreeNode
          key={'/' + dir}
          name={dir}
          node={tree[dir]}
          depth={0}
          onSelectFile={onSelectFile}
          expandedDirs={expandedDirs}
          toggleDir={toggleDir}
          dirPath={'/' + dir}
        />
      ))}
      {rootFiles.map((file, i) => {
        const absPath = typeof file === 'string' ? file : file.absolute_path || file.path || file.name;
        const fileName = typeof file === 'string' ? file.split('/').pop() : file.name;
        const ext = (typeof file === 'object' ? file.extension : '') || ('.' + (fileName || '').split('.').pop()?.toLowerCase());
        const size = typeof file === 'object' && file.size != null
          ? file.size < 1024 ? `${file.size} B`
            : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / 1048576).toFixed(1)} MB`
          : null;
        return (
          <button
            key={i}
            onClick={() => onSelectFile?.(absPath)}
            className="flex items-center gap-1.5 w-full text-left bg-transparent border-none hover:bg-white/5 cursor-pointer transition-colors py-1 px-2"
          >
            <FileText size={11} className={`flex-shrink-0 ${EXT_COLORS[ext] || 'text-slate-500'}`} />
            <span className="text-[11px] text-slate-300 truncate flex-1 min-w-0">{fileName}</span>
            {size && <span className="text-[9px] text-slate-600 flex-shrink-0 ml-1">{size}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Resolve image content from backend response to a data URL */
function resolveImageSrc(content) {
  if (!content) return null;
  if (typeof content === 'string') {
    if (content.startsWith('data:')) return content;
    return `data:image/png;base64,${content}`;
  }
  if (content.base64) {
    const mime = content.mime_type || 'image/png';
    return `data:${mime};base64,${content.base64}`;
  }
  return null;
}

/** Build the HTML for the pop-out tab window */
function buildPopoutHtml(filePath, type, content) {
  const fileName = filePath?.split(/[/\\]/).pop() || 'file';
  const bg = '#0f0a1e';

  if (type === 'image') {
    const src = resolveImageSrc(content);
    return `<!DOCTYPE html><html><head><title>${fileName}</title><style>body{margin:0;background:${bg};display:flex;align-items:center;justify-content:center;min-height:100vh;}img{max-width:95vw;max-height:95vh;border-radius:8px;}</style></head><body><img src="${src}" /></body></html>`;
  }

  let text = '';
  let color = '#cbd5e1';
  if (type === 'json') {
    text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    color = '#6ee7b7';
  } else if (type === 'csv') {
    text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    color = '#c4b5fd';
  } else {
    text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  }

  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html><html><head><title>${fileName}</title><style>body{margin:0;padding:16px;background:${bg};font-family:'Consolas','Courier New',monospace;}pre{color:${color};font-size:12px;white-space:pre-wrap;word-break:break-word;line-height:1.5;}</style></head><body><pre>${escaped}</pre></body></html>`;
}

function ViewerTab({ filePath, onPopout }) {
  const [content, setContent] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [type, setType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setContent(null);
    setRawData(null);

    fetch(`/api/ingestion/runs/file?path=${encodeURIComponent(filePath)}`)
      .then(r => r.json())
      .then(data => {
        const t = data.type || guessType(filePath);
        setType(t);
        setRawData(data);
        setContent(data.content || data.data || data);
      })
      .catch(() => setContent('Error loading file'))
      .finally(() => setLoading(false));
  }, [filePath]);

  const handlePopoutTab = () => {
    const html = buildPopoutHtml(filePath, type, content);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handlePopoutModal = () => {
    onPopout?.({ filePath, type, content });
  };

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

  const fileName = filePath.split(/[/\\]/).pop() || 'file';

  // Toolbar
  const toolbar = (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/5 bg-black/20">
      <span className="text-[10px] text-slate-500 truncate flex-1 min-w-0" title={filePath}>{fileName}</span>
      <button onClick={handlePopoutModal} title="Pop out to modal" className="p-1 bg-transparent border-none text-slate-500 hover:text-amber-400 cursor-pointer transition-colors">
        <Maximize2 size={12} />
      </button>
      <button onClick={handlePopoutTab} title="Open in new tab" className="p-1 bg-transparent border-none text-slate-500 hover:text-amber-400 cursor-pointer transition-colors">
        <ExternalLink size={12} />
      </button>
    </div>
  );

  if (type === 'image') {
    const src = resolveImageSrc(content);
    return (
      <div>
        {toolbar}
        <div className="p-3">
          {src ? <img src={src} alt="preview" className="max-w-full rounded border border-white/10" /> : <span className="text-xs text-red-400">Could not render image</span>}
        </div>
      </div>
    );
  }

  if (type === 'csv') {
    return (
      <div>
        {toolbar}
        <CsvViewer content={content} />
      </div>
    );
  }

  if (type === 'json') {
    const formatted = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    return (
      <div>
        {toolbar}
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
      </div>
    );
  }

  // Default: plain text
  return (
    <div>
      {toolbar}
      <div className="p-3">
        <pre className="text-[11px] text-slate-300 bg-black/30 rounded p-2 overflow-auto max-h-[500px] whitespace-pre-wrap break-words border border-white/5">
          {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}

/** Resizable pop-out modal for file viewing */
function ViewerPopout({ filePath, type, content, onClose }) {
  const [size, setSize] = useState({ w: 700, h: 500 });
  const [pos, setPos] = useState({ x: Math.max(60, (window.innerWidth - 700) / 2), y: Math.max(40, (window.innerHeight - 500) / 2) });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragRef = React.useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('[data-resize]')) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX - pos.x, startY: e.clientY - pos.y };
  };

  const handleResizeDown = (e) => {
    e.stopPropagation();
    setResizing(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
  };

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e) => {
      if (dragging && dragRef.current) {
        setPos({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY });
      }
      if (resizing && dragRef.current) {
        setSize({
          w: Math.max(400, dragRef.current.startW + (e.clientX - dragRef.current.startX)),
          h: Math.max(300, dragRef.current.startH + (e.clientY - dragRef.current.startY)),
        });
      }
    };
    const handleUp = () => { setDragging(false); setResizing(false); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging, resizing]);

  const handleOpenTab = () => {
    const html = buildPopoutHtml(filePath, type, content);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const fileName = filePath?.split(/[/\\]/).pop() || 'file';

  const renderContent = () => {
    if (type === 'image') {
      const src = resolveImageSrc(content);
      return src ? <img src={src} alt="preview" className="max-w-full max-h-full object-contain rounded" /> : <span className="text-xs text-red-400">Could not render image</span>;
    }
    if (type === 'csv') {
      return <CsvViewer content={content} />;
    }
    const text = type === 'json'
      ? (typeof content === 'string' ? content : JSON.stringify(content, null, 2))
      : (typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    const color = type === 'json' ? 'text-emerald-300' : 'text-slate-300';
    return (
      <pre className={`text-[12px] ${color} bg-black/30 rounded p-3 overflow-auto h-full whitespace-pre-wrap break-words border border-white/5 m-0`}>
        {text}
      </pre>
    );
  };

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>
      <div
        className="absolute bg-[#1a1438] border border-amber-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, pointerEvents: 'auto' }}
      >
        {/* Title bar — draggable */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-amber-500/5 cursor-move select-none flex-shrink-0"
        >
          <span className="text-xs text-amber-400 font-medium truncate flex-1">{fileName}</span>
          <button onClick={handleOpenTab} title="Open in new browser tab" className="p-1 bg-transparent border-none text-slate-400 hover:text-amber-400 cursor-pointer transition-colors">
            <ExternalLink size={13} />
          </button>
          <button onClick={onClose} className="p-1 bg-transparent border-none text-slate-400 hover:text-white cursor-pointer transition-colors">
            <X size={14} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-3">
          {renderContent()}
        </div>
        {/* Resize handle */}
        <div
          data-resize
          onMouseDown={handleResizeDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(245,158,11,0.4) 50%)' }}
        />
      </div>
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
  const [popout, setPopout] = useState(null);

  // Reset tab when run changes — show Files tab when drilling into a game subfolder
  useEffect(() => {
    setActiveTab(run?._isGame ? 'files' : 'info');
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
    <>
      <div className="flex flex-col h-full bg-[#140f2d]/60 border border-primary/15 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/5">
          <div className="text-sm text-white font-medium truncate">{run.folder || run.name || 'Run Details'}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {run._isGame && run._parentRun
              ? <span><span className="text-slate-600">{run._parentRun}</span> / game</span>
              : (run.date || '')}
          </div>
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
          {activeTab === 'viewer' && <ViewerTab filePath={selectedFile} onPopout={setPopout} />}
        </div>
      </div>
      {popout && (
        <ViewerPopout
          filePath={popout.filePath}
          type={popout.type}
          content={popout.content}
          onClose={() => setPopout(null)}
        />
      )}
    </>
  );
}
