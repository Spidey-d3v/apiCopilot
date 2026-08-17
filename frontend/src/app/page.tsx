"use client";
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/* ── Professional Sleek SVG Icon Library ───────────────────── */
const Icons = {
  Explorer: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ArchonAI: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Diagnostics: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Terminal: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  FolderOpen: () => (
    <svg className="w-3.5 h-3.5 text-[#e2b86b] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  FolderClosed: () => (
    <svg className="w-3.5 h-3.5 text-[#e2b86b] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  ),
  FileCode: () => (
    <svg className="w-3.5 h-3.5 text-[#9ca3af] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  FolderPlus: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  Save: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Bolt: () => (
    <svg className="w-3.5 h-3.5 text-[#60a5fa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Close: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  User: () => (
    <svg className="w-3.5 h-3.5 text-[#60a5fa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-3 h-3 text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-3 h-3 text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
};

/* -- Strategy Info Definitions ------------------------------- */
const PIPELINE_STAGES = [
  { 
    id: 0, 
    key: 'query',
    label: 'Query', 
    targetTab: 'terminal',
    highlightKey: null,
    sub: 'Tokenizing input',
    description: 'Prepares raw prompt tokens and dispatches dual-stream retrieval across lexical and vector indices.'
  },
  { 
    id: 1, 
    key: 'bm25',
    label: 'BM25', 
    targetTab: 'search',
    highlightKey: 'bm25',
    sub: 'Lexical index',
    description: 'Exact keyword matching via Okapi BM25 scoring over inverted document index tokens.'
  },
  { 
    id: 2, 
    key: 'dense',
    label: 'Dense Vector', 
    targetTab: 'search',
    highlightKey: 'dense',
    sub: 'Semantic embedding',
    description: 'Transforms query into 384-dimensional dense vectors (BAAI/bge-small-en-v1.5) and measures cosine/L2 proximity in ChromaDB.'
  },
  { 
    id: 3, 
    key: 'cross_encoder',
    label: 'Cross-Encoder', 
    targetTab: 'search',
    highlightKey: 'cross_encoder',
    sub: 'Deep attention re-rank',
    description: 'Performs full cross-attention over [Query, Document] pairs using ms-marco-MiniLM-L-6-v2 to score true semantic alignment.'
  },
  { 
    id: 4, 
    key: 'llm',
    label: 'LLM Synthesis', 
    targetTab: 'terminal',
    highlightKey: null,
    sub: 'Streaming tokens',
    description: 'Injects top re-ranked context into local model via Ollama with real-time token streaming.'
  },
];

/* -- File Icon Helper with Clean Badges & SVGs --------------- */
function getFileIcon(filename: string, isDirectory: boolean = false, isOpen: boolean = false) {
  if (isDirectory) {
    return isOpen ? <Icons.FolderOpen /> : <Icons.FolderClosed />;
  }
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (filename === 'Dockerfile' || filename.startsWith('docker-compose')) {
    return <span className="text-[#38bdf8] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#0284c7]/15 rounded border border-[#0284c7]/30">DOCKER</span>;
  }
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <span className="text-[#38bdf8] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#0284c7]/15 rounded border border-[#0284c7]/30">TS</span>;
    case 'js':
    case 'jsx':
    case 'mjs':
      return <span className="text-[#facc15] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#eab308]/15 rounded border border-[#eab308]/30">JS</span>;
    case 'py':
      return <span className="text-[#60a5fa] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#2563eb]/15 rounded border border-[#2563eb]/30">PY</span>;
    case 'json':
      return <span className="text-[#fbbf24] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#f59e0b]/15 rounded border border-[#f59e0b]/30">JSON</span>;
    case 'yaml':
    case 'yml':
      return <span className="text-[#f87171] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#dc2626]/15 rounded border border-[#dc2626]/30">YML</span>;
    case 'md':
      return <span className="text-[#c084fc] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#9333ea]/15 rounded border border-[#9333ea]/30">MD</span>;
    case 'css':
      return <span className="text-[#38bdf8] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#06b6d4]/15 rounded border border-[#06b6d4]/30">CSS</span>;
    case 'sh':
      return <span className="text-[#4ade80] text-[9.5px] font-bold font-mono px-1 py-0.2 bg-[#16a34a]/15 rounded border border-[#16a34a]/30">SH</span>;
    default:
      return <Icons.FileCode />;
  }
}

/* -- Code Block with Copy & Apply Actions -------------------- */
function CodeBlock({ 
  children, 
  className,
  onApplyCode
}: { 
  children: any; 
  className?: string;
  onApplyCode?: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'code';
  const text = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyCode) {
      onApplyCode(text);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  return (
    <div className="my-3 bg-[#0a0c10] border border-[#1a1e26] rounded-lg overflow-hidden group shadow-md">
      <div className="flex justify-between items-center px-3.5 py-2 bg-[#0e1015] border-b border-[#1a1e26] text-[11px] font-mono text-[#4a5060]">
        <span className="uppercase tracking-wider text-[#6b7280] font-semibold text-[10.5px]">{lang}</span>
        <div className="flex items-center gap-2">
          {onApplyCode && (
            <button
              onClick={handleApply}
              className="text-[#60a5fa] hover:text-[#93c5fd] bg-[#1e293b]/70 hover:bg-[#1e293b] px-2.5 py-1 rounded transition-colors text-[10.5px] font-mono flex items-center gap-1 cursor-pointer border border-[#3b82f6]/30 shadow-sm"
            >
              {applied ? <span className="text-[#10b981] font-bold">✓ Applied to Editor</span> : <span>⚡ Apply to File</span>}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="text-[#6b7280] hover:text-[#c8ccd0] px-2 py-0.5 rounded transition-colors text-[10.5px] font-mono flex items-center gap-1 cursor-pointer"
          >
            {copied ? <span className="text-[#10b981]">✓ Copied</span> : <span>⎘ Copy</span>}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="text-[12.5px] font-mono leading-[1.7] text-[#93c5fd]">
          <code>{text}</code>
        </pre>
      </div>
    </div>
  );
}

/* -- Rich Markdown Renderer (Hydration Safe) ----------------- */
function FormattedMarkdown({ content, onApplyCode }: { content: string; onApplyCode?: (code: string) => void }) {
  return (
    <div className="markdown-body space-y-2 font-sans leading-relaxed text-[#a0a6b5] text-[13.5px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          p: ({ children }) => (
            <div className="leading-[1.8] my-2 text-[#9da5b4]">
              {children}
            </div>
          ),
          h1: ({ children }) => (
            <h1 className="text-[20px] font-semibold text-[#e2e5ea] border-b border-[#1a1e26] pb-2 mt-6 mb-3 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[17px] font-semibold text-[#d0d5dd] border-b border-[#1a1e26]/60 pb-1.5 mt-5 mb-2.5 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[15px] font-medium text-[#c0c6d4] mt-4 mb-2 tracking-tight">
              {children}
            </h3>
          ),
          strong: ({ children }) => (
            <strong className="text-[#e2e5ea] font-semibold">
              {children}
            </strong>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const hasLang = /language-(\w+)/.test(className || '');
            if (!inline && hasLang) {
              return (
                <CodeBlock className={className} onApplyCode={onApplyCode}>
                  {children}
                </CodeBlock>
              );
            }
            return (
              <code
                className="bg-[#12151c] text-[#60a5fa] border border-[#1e232e] px-1.5 py-0.5 rounded text-[11.5px] font-mono font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-[#9da5b4]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-[#9da5b4]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#3b82f6]/40 pl-3 py-1 my-2 bg-[#0e1015] rounded-r text-[#8892a0] text-[12.5px] italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-[#1a1e26] my-4" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* -- Interactive RAG Pipeline Visualization ------------------ */
function RagPipeline({ 
  currentStage, 
  onNavigateStage 
}: { 
  currentStage: number; 
  onNavigateStage: (stage: typeof PIPELINE_STAGES[0]) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  return (
    <div className="border border-[#1a1e26] bg-[#090b0e] rounded-xl p-5 mb-8 relative overflow-hidden transition-all duration-500 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse-slow" />
          <span className="text-[10px] font-mono text-[#4a5060] tracking-[0.2em] uppercase font-semibold">
            Interactive Retrieval Pipeline
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#333a48]">
          Click any stage node to jump to diagnostic inspector
        </span>
      </div>

      <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {PIPELINE_STAGES.map((s, i) => {
          const isActive = currentStage === s.id;
          const isDone = currentStage > s.id;
          const isHovered = hoveredNode === s.id;

          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => onNavigateStage(s)}
                onMouseEnter={() => setHoveredNode(s.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`group flex-1 min-w-[130px] p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#3b82f6]/10 border-[#3b82f6]/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-[#3b82f6]/30'
                    : isDone
                      ? 'bg-[#10b981]/5 border-[#10b981]/30 hover:border-[#10b981]/50'
                      : isHovered
                        ? 'bg-[#0e1015] border-[#282e3a] shadow-lg'
                        : 'bg-[#08090a] border-[#1a1e26] hover:border-[#282e3a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${
                    isActive ? 'text-[#60a5fa]' : isDone ? 'text-[#10b981]' : 'text-[#4a5060]'
                  }`}>
                    0{s.id + 1}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-[#3b82f6] animate-ping' : isDone ? 'bg-[#10b981]' : 'bg-[#1a1e26] group-hover:bg-[#4a5060]'
                  }`} />
                </div>
                <div className={`text-[12px] font-mono font-semibold truncate transition-colors duration-300 ${
                  isActive ? 'text-[#e2e5ea]' : isDone ? 'text-[#c8ccd0]' : 'text-[#8b92a0] group-hover:text-[#e2e5ea]'
                }`}>
                  {s.label}
                </div>
                <div className="text-[10px] font-mono text-[#4a5060] truncate mt-0.5">
                  {s.sub}
                </div>
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="w-4 h-px relative flex-shrink-0">
                  <div className={`h-full transition-all duration-700 ${
                    currentStage > i ? 'bg-[#10b981]/60' : 'bg-[#1a1e26]'
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* -- File Explorer Tree Node --------------------------------- */
interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  children?: TreeNode[];
}

function FileTreeNode({
  node,
  activePath,
  onSelectFile,
  depth = 0
}: {
  node: TreeNode;
  activePath: string;
  onSelectFile: (path: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDir = node.type === 'directory';
  const isActive = node.path === activePath;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDir) {
      setExpanded(!expanded);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer text-[12px] font-mono select-none transition-colors group ${
          isActive
            ? 'bg-[#1d222e] text-[#60a5fa] font-medium'
            : 'text-[#9ca3af] hover:bg-[#12151c] hover:text-[#e2e5ea]'
        }`}
      >
        <span className="w-3.5 flex items-center justify-center">
          {isDir ? (expanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />) : null}
        </span>
        {getFileIcon(node.name, isDir, expanded)}
        <span className="truncate flex-1 ml-0.5">{node.name}</span>
      </div>

      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              activePath={activePath}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -- Syntax Highlighting Engine (Token-level) ---------------- */
function highlightCodeLine(line: string) {
  if (!line) return <span>&nbsp;</span>;
  
  const tokens: React.ReactNode[] = [];
  const regex = /(\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:def|function|const|let|var|class|import|from|export|return|if|else|elif|for|while|try|except|catch|finally|async|await|type|interface|extends|implements|new|this|self|null|undefined|true|false|None|True|False)\b|\b(?:print|console|log|require|fetch|len|range|str|int|dict|list|set|open|useState|useEffect|useRef)\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|\b\d+\.?\d*\b|[{}()\[\].,;+\-*\/=<>!&|?:%])/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(<span key={lastIndex} className="text-[#c9d1d9]">{line.substring(lastIndex, match.index)}</span>);
    }

    const token = match[0];
    if (token.startsWith('//') || token.startsWith('#')) {
      tokens.push(<span key={match.index} className="text-[#6a737d] italic">{token}</span>);
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      tokens.push(<span key={match.index} className="text-[#9ece6a]">{token}</span>);
    } else if (/^\b(?:def|function|const|let|var|class|import|from|export|return|if|else|elif|for|while|try|except|catch|finally|async|await|type|interface|extends|implements|new)\b$/.test(token)) {
      tokens.push(<span key={match.index} className="text-[#bb9af7] font-semibold">{token}</span>);
    } else if (/^\b(?:this|self|null|undefined|true|false|None|True|False)\b$/.test(token)) {
      tokens.push(<span key={match.index} className="text-[#ff9e64]">{token}</span>);
    } else if (/^\b(?:print|console|log|require|fetch|len|range|str|int|dict|list|set|open|useState|useEffect|useRef)\b$/.test(token)) {
      tokens.push(<span key={match.index} className="text-[#7dcfff]">{token}</span>);
    } else if (/^\d+\.?\d*$/.test(token)) {
      tokens.push(<span key={match.index} className="text-[#ff9e64]">{token}</span>);
    } else if (/^[{}()\[\].,;+\-*\/=<>!&|?:%]$/.test(token)) {
      tokens.push(<span key={match.index} className="text-[#89ddff]">{token}</span>);
    } else {
      tokens.push(<span key={match.index} className="text-[#7aa2f7]">{token}</span>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push(<span key={lastIndex} className="text-[#c9d1d9]">{line.substring(lastIndex)}</span>);
  }

  return tokens;
}

/* -- Interactive Multi-Tab Terminal State --------------------- */
interface TerminalTab {
  id: string;
  name: string;
  history: Array<{ type: 'input' | 'stdout' | 'stderr' | 'system'; text: string }>;
  commandHistory: string[];
  historyIndex: number;
  input: string;
  cwd: string;
}

/* -- VS Code Style Archon Agent IDE Workspace ---------------- */
function VSCodeAgentIDE({
  apiBase,
  models,
  selectedModel,
  setSelectedModel,
}: {
  apiBase: string;
  models: string[];
  selectedModel: string;
  setSelectedModel: (m: string) => void;
}) {
  // Project & Workspace State
  const [currentProjectName, setCurrentProjectName] = useState('AIDeV');
  const [currentProjectPath, setCurrentProjectPath] = useState('D:/AIDeV');
  const [gitBranch, setGitBranch] = useState('main');
  const [recentProjects, setRecentProjects] = useState<string[]>(['D:/AIDeV', 'C:/Users/gaura']);
  const [showOpenProjectModal, setShowOpenProjectModal] = useState(false);
  const [projectPathInput, setProjectPathInput] = useState('');
  
  // File Explorer State
  const [workspaceTree, setWorkspaceTree] = useState<TreeNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  
  // Tabbed Editor State
  const [openTabs, setOpenTabs] = useState<{ path: string; name: string; content: string; original: string }[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [foldedLines, setFoldedLines] = useState<Record<number, boolean>>({});
  const [lastAppliedNotice, setLastAppliedNotice] = useState<string | null>(null);
  
  // Synchronized Scroll Refs
  const gutterRef = useRef<HTMLDivElement>(null);
  const syntaxRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Layout & Activity State
  const [activeActivity, setActiveActivity] = useState<'explorer' | 'search' | 'copilot' | 'diagnostics'>('explorer');
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(true);
  const [bottomTab, setBottomTab] = useState<'terminal' | 'output' | 'diagnostics'>('terminal');

  // Interactive Multi-Terminal State
  const [terminals, setTerminals] = useState<TerminalTab[]>([
    {
      id: 'term-1',
      name: 'bash 1',
      history: [
        { type: 'system', text: 'Archon Interactive Shell initialized. Type any command (e.g. ls, git status, npm test, python)...' }
      ],
      commandHistory: [],
      historyIndex: -1,
      input: '',
      cwd: 'D:/AIDeV'
    }
  ]);
  const [activeTermId, setActiveTermId] = useState('term-1');
  const [executingCmd, setExecutingCmd] = useState(false);
  const [terminalCopied, setTerminalCopied] = useState(false);
  const termScrollRef = useRef<HTMLDivElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);

  // Archon Agent Multi-Turn Chat & Auto-Apply State
  const [autoApplyEdits, setAutoApplyEdits] = useState<boolean>(false);
  const [agentMessages, setAgentMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "👋 **Hello! I am Archon Agent.**\n\nI have full context of your workspace, active editor files, and integrated Hybrid RAG API documentation. Ask me to refactor code, fix bugs, optimize performance, or write tests — you can apply my code edits directly with **⚡ Apply to File** or turn on **⚡ Auto-Apply**."
    }
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [includeFileContext, setIncludeFileContext] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Synchronized Editor Scrolling (Textarea -> Gutter & Syntax Highlight Layer)
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
    if (syntaxRef.current) {
      syntaxRef.current.scrollTop = target.scrollTop;
      syntaxRef.current.scrollLeft = target.scrollLeft;
    }
  };

  // Load Projects, Git Branch, and Workspace Tree
  const fetchProjectsAndTree = async () => {
    setLoadingTree(true);
    try {
      const projRes = await fetch(`${apiBase}/api/workspace/projects`);
      if (projRes.ok) {
        const projData = await projRes.json();
        setCurrentProjectName(projData.current_project || 'AIDeV');
        setCurrentProjectPath(projData.project_path || 'D:/AIDeV');
        setGitBranch(projData.git_branch || 'main');
        setRecentProjects(projData.recent_projects || ['D:/AIDeV']);
        setTerminals(prev => prev.map(t => ({ ...t, cwd: projData.project_path || t.cwd })));
      }

      const treeRes = await fetch(`${apiBase}/api/workspace/tree`);
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setWorkspaceTree(treeData.tree || []);
      }
    } catch (e) {
      console.error("Failed to load workspace", e);
    }
    setLoadingTree(false);
  };

  useEffect(() => {
    fetchProjectsAndTree();
  }, [apiBase]);

  // Open Any Custom Folder / Project (with create_if_missing)
  const handleOpenProject = async (targetPath: string, shouldCreate: boolean = false) => {
    if (!targetPath.trim()) return;
    try {
      const res = await fetch(`${apiBase}/api/workspace/open-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath.trim(), create_if_missing: shouldCreate })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentProjectName(data.current_project);
        setCurrentProjectPath(data.project_path);
        setGitBranch(data.git_branch || 'main');
        setRecentProjects(data.recent_projects || []);
        setShowOpenProjectModal(false);
        setOpenTabs([]);
        setActiveTabPath('');
        setEditorContent('');
        setFoldedLines({});
        setTerminals(prev => prev.map(t => ({ ...t, cwd: data.project_path })));
        
        // Refresh File Explorer Tree immediately
        const treeRes = await fetch(`${apiBase}/api/workspace/tree`);
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          setWorkspaceTree(treeData.tree || []);
        }

        // Open README.md if present
        setTimeout(async () => {
          try {
            const readmeRes = await fetch(`${apiBase}/api/workspace/file?path=README.md`);
            if (readmeRes.ok) {
              const fileData = await readmeRes.json();
              const newTab = {
                path: fileData.path,
                name: fileData.filename,
                content: fileData.content,
                original: fileData.content
              };
              setOpenTabs([newTab]);
              setActiveTabPath(fileData.path);
              setEditorContent(fileData.content);
            }
          } catch (err) {}
        }, 150);
      } else {
        const err = await res.json();
        alert(`Could not open folder: ${err.detail || 'Directory not found'}`);
      }
    } catch (e) {
      alert("Failed to connect to workspace service.");
    }
  };

  // Terminal: Add new terminal tab
  const handleAddTerminal = () => {
    const nextNum = terminals.length + 1;
    const newId = `term-${Date.now()}`;
    const newTerm: TerminalTab = {
      id: newId,
      name: `bash ${nextNum}`,
      history: [
        { type: 'system', text: `Session bash ${nextNum} started in ${currentProjectPath}` }
      ],
      commandHistory: [],
      historyIndex: -1,
      input: '',
      cwd: currentProjectPath
    };
    setTerminals(prev => [...prev, newTerm]);
    setActiveTermId(newId);
  };

  // Terminal: Close terminal tab
  const handleCloseTerminal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (terminals.length <= 1) return;
    const remaining = terminals.filter(t => t.id !== id);
    setTerminals(remaining);
    if (activeTermId === id) {
      setActiveTermId(remaining[remaining.length - 1].id);
    }
  };

  // Terminal: Copy buffer text
  const handleCopyTerminalBuffer = () => {
    const currentTerm = terminals.find(t => t.id === activeTermId);
    if (!currentTerm) return;
    const allText = currentTerm.history.map(h => h.text).join('\n');
    navigator.clipboard.writeText(allText);
    setTerminalCopied(true);
    setTimeout(() => setTerminalCopied(false), 2000);
  };

  // Terminal: Run command
  const handleRunTerminalCommand = async () => {
    const currentTerm = terminals.find(t => t.id === activeTermId);
    if (!currentTerm) return;
    const rawCmd = currentTerm.input.trim();
    if (!rawCmd || executingCmd) return;

    // Handle clear
    if (rawCmd === 'clear') {
      setTerminals(prev => prev.map(t => t.id === activeTermId ? {
        ...t,
        history: [],
        commandHistory: [...t.commandHistory, rawCmd],
        historyIndex: -1,
        input: ''
      } : t));
      return;
    }

    const nextHistory = [
      ...currentTerm.history,
      { type: 'input' as const, text: `$ ${rawCmd}` }
    ];

    setTerminals(prev => prev.map(t => t.id === activeTermId ? {
      ...t,
      history: nextHistory,
      commandHistory: [...t.commandHistory, rawCmd],
      historyIndex: -1,
      input: ''
    } : t));

    setExecutingCmd(true);

    try {
      const res = await fetch(`${apiBase}/api/terminal/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: rawCmd,
          terminal_id: activeTermId,
          cwd: currentTerm.cwd
        })
      });

      if (res.ok) {
        const data = await res.json();
        const outputItems: Array<{ type: 'stdout' | 'stderr'; text: string }> = [];
        if (data.stdout) outputItems.push({ type: 'stdout', text: data.stdout });
        if (data.stderr) outputItems.push({ type: 'stderr', text: data.stderr });

        if (data.git_branch) {
          setGitBranch(data.git_branch);
        }

        // If directory changed via cd or command
        if (data.project_name) {
          setCurrentProjectName(data.project_name);
        }
        if (data.cwd) {
          setCurrentProjectPath(data.cwd);
        }

        // Always refresh file explorer tree so created/deleted/renamed files or branch checkouts show up immediately
        try {
          const treeRes = await fetch(`${apiBase}/api/workspace/tree`);
          if (treeRes.ok) {
            const treeData = await treeRes.json();
            setWorkspaceTree(treeData.tree || []);
            if (treeData.root) setCurrentProjectName(treeData.root);
            if (treeData.root_path) setCurrentProjectPath(treeData.root_path);
          }
        } catch (e) {}

        setTerminals(prev => prev.map(t => t.id === activeTermId ? {
          ...t,
          history: [...t.history, ...outputItems],
          cwd: data.cwd || t.cwd
        } : t));
      } else {
        setTerminals(prev => prev.map(t => t.id === activeTermId ? {
          ...t,
          history: [...t.history, { type: 'stderr', text: 'Error: Terminal subprocess failed.' }]
        } : t));
      }
    } catch (e) {
      setTerminals(prev => prev.map(t => t.id === activeTermId ? {
        ...t,
        history: [...t.history, { type: 'stderr', text: 'Connection to terminal service failed.' }]
      } : t));
    }

    setExecutingCmd(false);
  };

  // Terminal: History navigation
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentTerm = terminals.find(t => t.id === activeTermId);
    if (!currentTerm) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleRunTerminalCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentTerm.commandHistory.length === 0) return;
      const nextIdx = currentTerm.historyIndex === -1 ? currentTerm.commandHistory.length - 1 : Math.max(0, currentTerm.historyIndex - 1);
      const cmd = currentTerm.commandHistory[nextIdx];
      setTerminals(prev => prev.map(t => t.id === activeTermId ? { ...t, input: cmd, historyIndex: nextIdx } : t));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentTerm.historyIndex === -1) return;
      const nextIdx = currentTerm.historyIndex + 1;
      if (nextIdx >= currentTerm.commandHistory.length) {
        setTerminals(prev => prev.map(t => t.id === activeTermId ? { ...t, input: '', historyIndex: -1 } : t));
      } else {
        const cmd = currentTerm.commandHistory[nextIdx];
        setTerminals(prev => prev.map(t => t.id === activeTermId ? { ...t, input: cmd, historyIndex: nextIdx } : t));
      }
    }
  };

  // Auto-scroll terminal
  useEffect(() => {
    if (termScrollRef.current) {
      termScrollRef.current.scrollTop = termScrollRef.current.scrollHeight;
    }
  }, [terminals, executingCmd]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [agentMessages]);

  // Open a file from explorer
  const handleOpenFile = async (path: string) => {
    const existing = openTabs.find(t => t.path === path);
    if (existing) {
      setActiveTabPath(path);
      setEditorContent(existing.content);
      setIsDirty(existing.content !== existing.original);
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/workspace/file?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        const newTab = {
          path: data.path,
          name: data.filename,
          content: data.content,
          original: data.content
        };
        setOpenTabs(prev => [...prev, newTab]);
        setActiveTabPath(data.path);
        setEditorContent(data.content);
        setIsDirty(false);
        setFoldedLines({});
      }
    } catch (e) {
      console.error("Could not read file", e);
    }
  };

  // Close tab
  const handleCloseTab = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const filtered = openTabs.filter(t => t.path !== path);
    setOpenTabs(filtered);
    if (activeTabPath === path) {
      if (filtered.length > 0) {
        const next = filtered[filtered.length - 1];
        setActiveTabPath(next.path);
        setEditorContent(next.content);
        setIsDirty(next.content !== next.original);
      } else {
        setActiveTabPath('');
        setEditorContent('');
        setIsDirty(false);
      }
    }
  };

  // Update editor content
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditorContent(val);
    const active = openTabs.find(t => t.path === activeTabPath);
    if (active) {
      setIsDirty(val !== active.original);
      setOpenTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, content: val } : t));
    }
  };

  // Track cursor position
  const handleEditorSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const pos = target.selectionStart;
    const textBefore = target.value.substring(0, pos);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  // Save file to backend (Ctrl+S)
  const handleSaveFile = async () => {
    if (!activeTabPath) return;
    setSaveStatus('Saving...');
    try {
      const res = await fetch(`${apiBase}/api/workspace/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeTabPath, content: editorContent })
      });
      if (res.ok) {
        setOpenTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, original: editorContent } : t));
        setIsDirty(false);
        setSaveStatus('✓ Saved');
        setLastAppliedNotice(null);
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('❌ Error');
      }
    } catch (e) {
      setSaveStatus('❌ Failed');
    }
  };

  // Code Folding Toggle
  const toggleFold = (lineIndex: number) => {
    setFoldedLines(prev => ({ ...prev, [lineIndex]: !prev[lineIndex] }));
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveFile();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const nextVal = val.substring(0, start) + '  ' + val.substring(end);
      setEditorContent(nextVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Apply AI code snippet into active editor buffer
  const handleApplyCodeToEditor = (snippet: string) => {
    const active = openTabs.find(t => t.path === activeTabPath);
    if (active) {
      setEditorContent(snippet);
      setIsDirty(snippet !== active.original);
      setOpenTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, content: snippet } : t));
      setLastAppliedNotice(`Archon Agent applied edits to ${active.name} • (Ctrl+S to save)`);
      setTimeout(() => setLastAppliedNotice(null), 5000);
    } else {
      const tempPath = 'solution.py';
      const newTab = { path: tempPath, name: tempPath, content: snippet, original: '' };
      setOpenTabs([newTab]);
      setActiveTabPath(tempPath);
      setEditorContent(snippet);
      setIsDirty(true);
      setLastAppliedNotice(`Created new buffer solution.py • (Ctrl+S to save)`);
      setTimeout(() => setLastAppliedNotice(null), 5000);
    }
  };

  // Send Archon Agent Message (Multi-turn SSE Stream with Hybrid RAG)
  const handleSendAgentMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || agentInput;
    if (!textToSend.trim() || agentLoading) return;

    const newHistory = [...agentMessages, { role: 'user' as const, content: textToSend }];
    setAgentMessages(newHistory);
    setAgentInput('');
    setAgentLoading(true);

    const assistantIndex = newHistory.length;
    setAgentMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const activeTab = openTabs.find(t => t.path === activeTabPath);
      const res = await fetch(`${apiBase}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          active_file_path: includeFileContext && activeTab ? activeTab.path : null,
          active_file_content: includeFileContext && activeTab ? editorContent : null,
          model: selectedModel
        })
      });

      if (!res.ok) {
        setAgentMessages(prev => {
          const clone = [...prev];
          clone[assistantIndex] = { role: 'assistant', content: '❌ **Error:** Failed to connect to Agent service.' };
          return clone;
        });
        setAgentLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamedResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.token) {
                  streamedResponse += data.token;
                  setAgentMessages(prev => {
                    const clone = [...prev];
                    clone[assistantIndex] = { role: 'assistant', content: streamedResponse };
                    return clone;
                  });
                }
                if (data.done) {
                  // If auto-apply is turned ON, extract code block and apply automatically
                  if (autoApplyEdits) {
                    const codeMatch = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/.exec(streamedResponse);
                    if (codeMatch && codeMatch[1]) {
                      handleApplyCodeToEditor(codeMatch[1].trim());
                    }
                  }
                  break;
                }
                if (data.error) {
                  streamedResponse += `\n\n> ⚠️ **Error:** ${data.error}`;
                  setAgentMessages(prev => {
                    const clone = [...prev];
                    clone[assistantIndex] = { role: 'assistant', content: streamedResponse };
                    return clone;
                  });
                  break;
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {
      setAgentMessages(prev => {
        const clone = [...prev];
        clone[assistantIndex] = { role: 'assistant', content: '❌ **Error:** Connection lost.' };
        return clone;
      });
    }
    setAgentLoading(false);
  };

  const rawLines = editorContent.split('\n');
  const activeTab = openTabs.find(t => t.path === activeTabPath);
  const currentTerm = terminals.find(t => t.id === activeTermId) || terminals[0];

  return (
    <div className="flex flex-col h-full w-full bg-[#08090a] text-[#c9d1d9] overflow-hidden border-0">
      
      {/* Main Workspace Row */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── 1. Activity Bar (Left, 46px) ────────────────────────── */}
        <div className="w-[46px] bg-[#060708] border-r border-[#161922] flex flex-col items-center py-2.5 justify-between z-10 flex-shrink-0 select-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-1 shadow-sm" title="Archon Workspace">
              <img src="/aionlabs.svg" alt="Archon" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => setActiveActivity('explorer')}
              title="File Explorer (Ctrl+Shift+E)"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                activeActivity === 'explorer'
                  ? 'bg-[#12151c] text-[#60a5fa] border border-[#3b82f6]/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0e1015]'
              }`}
            >
              <Icons.Explorer />
            </button>
            <button
              onClick={() => setActiveActivity('search')}
              title="Search Workspace (Ctrl+Shift+F)"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                activeActivity === 'search'
                  ? 'bg-[#12151c] text-[#60a5fa] border border-[#3b82f6]/30'
                  : 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0e1015]'
              }`}
            >
              <Icons.Search />
            </button>
            <button
              onClick={() => setActiveActivity('copilot')}
              title="Archon Agent Chat"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                activeActivity === 'copilot'
                  ? 'bg-[#12151c] text-[#60a5fa] border border-[#3b82f6]/30'
                  : 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0e1015]'
              }`}
            >
              <Icons.ArchonAI />
            </button>
            <button
              onClick={() => setActiveActivity('diagnostics')}
              title="Mesh Health & Diagnostics"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                activeActivity === 'diagnostics'
                  ? 'bg-[#12151c] text-[#60a5fa] border border-[#3b82f6]/30'
                  : 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0e1015]'
              }`}
            >
              <Icons.Diagnostics />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" title="Mesh Online" />
          </div>
        </div>

        {/* ── 2. Sidebar (Explorer / Search, 250px) ────────────────── */}
        <div className="w-[260px] bg-[#0c0e12] border-r border-[#161922] flex flex-col flex-shrink-0 overflow-hidden select-none">
          
          {/* Project Title Bar & Open Folder Button */}
          <div className="px-3 py-2.5 border-b border-[#161922] flex justify-between items-center bg-[#090b0e]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[11px] font-mono font-bold tracking-wider text-[#e2e5ea] uppercase truncate max-w-[130px]" title={currentProjectPath}>
                {currentProjectName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setProjectPathInput(currentProjectPath);
                  setShowOpenProjectModal(true);
                }}
                title="Open or Create Folder / Project..."
                className="text-[#60a5fa] hover:text-[#93c5fd] text-[11px] font-mono px-2 py-0.5 rounded bg-[#12151c] hover:bg-[#1a1e26] border border-[#1e232e] cursor-pointer flex items-center gap-1"
              >
                <Icons.FolderPlus />
                <span>Open / New</span>
              </button>
              <button
                onClick={fetchProjectsAndTree}
                title="Refresh Workspace"
                className="text-[#64748b] hover:text-[#cbd5e1] p-1 rounded hover:bg-[#161922] cursor-pointer"
              >
                <Icons.Refresh />
              </button>
            </div>
          </div>

          {/* Quick Filter Input */}
          <div className="p-2 border-b border-[#161922]/60">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter files..."
              className="w-full bg-[#08090a] border border-[#1a1e26] rounded px-2.5 py-1 text-[11px] font-mono text-[#cbd5e1] focus:outline-none focus:border-[#3b82f6]/50 placeholder-[#475569]"
            />
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
            {loadingTree ? (
              <div className="p-4 text-[11px] font-mono text-[#64748b] flex items-center gap-2">
                <span className="animate-spin">⟳</span> Loading workspace...
              </div>
            ) : workspaceTree.length > 0 ? (
              workspaceTree.map(node => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  activePath={activeTabPath}
                  onSelectFile={handleOpenFile}
                />
              ))
            ) : (
              <div className="p-4 text-[11px] font-mono text-[#64748b]">
                No files found in workspace.
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Central Code Editor Panel (Flex-1) ────────────────── */}
        <div className="flex-1 flex flex-col bg-[#090b0e] overflow-hidden">
          
          {/* Tab Bar */}
          <div className="flex items-center bg-[#07080a] border-b border-[#161922] overflow-x-auto custom-scrollbar flex-shrink-0 h-[38px] select-none">
            {openTabs.map(tab => {
              const isActive = tab.path === activeTabPath;
              const dirty = tab.content !== tab.original;
              return (
                <div
                  key={tab.path}
                  onClick={() => {
                    setActiveTabPath(tab.path);
                    setEditorContent(tab.content);
                    setIsDirty(dirty);
                  }}
                  className={`flex items-center gap-2 px-3.5 h-full border-r border-[#161922] cursor-pointer text-[12px] font-mono transition-colors relative group ${
                    isActive
                      ? 'bg-[#0e1015] text-[#e2e5ea] border-t-2 border-t-[#3b82f6]'
                      : 'text-[#6b7280] hover:bg-[#0a0c10] hover:text-[#94a3b8]'
                  }`}
                >
                  {getFileIcon(tab.name)}
                  <span className="truncate max-w-[140px]">{tab.name}</span>
                  {dirty && <span className="w-2 h-2 rounded-full bg-[#3b82f6] ml-1" title="Unsaved changes" />}
                  <button
                    onClick={(e) => handleCloseTab(tab.path, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-[#ef4444] p-0.5 rounded transition-opacity ml-1"
                  >
                    <Icons.Close />
                  </button>
                </div>
              );
            })}
            {openTabs.length === 0 && (
              <div className="px-4 text-[11px] font-mono text-[#475569] italic">
                Select a file from the explorer to open in editor
              </div>
            )}
          </div>

          {/* Archon Agent Auto-Apply Notification Bar */}
          {lastAppliedNotice && (
            <div className="bg-[#10b981]/15 border-b border-[#10b981]/30 px-4 py-1.5 text-[11.5px] font-mono text-[#10b981] flex justify-between items-center animate-fade-in select-none">
              <div className="flex items-center gap-2">
                <span className="animate-pulse font-bold">⚡</span>
                <span>{lastAppliedNotice}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFile}
                  className="bg-[#10b981]/20 hover:bg-[#10b981]/35 text-[#10b981] px-2 py-0.5 rounded border border-[#10b981]/40 text-[10.5px] cursor-pointer font-semibold"
                >
                  Save (Ctrl+S)
                </button>
                <button onClick={() => setLastAppliedNotice(null)} className="hover:text-white cursor-pointer px-1">✕</button>
              </div>
            </div>
          )}

          {/* Breadcrumbs & Quick Toolbar */}
          {activeTab && (
            <div className="flex justify-between items-center px-4 py-1.5 bg-[#0a0c10] border-b border-[#161922] text-[11px] font-mono text-[#64748b] select-none">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[#3b82f6]">{currentProjectName}</span>
                {activeTab.path.split('/').map((seg, i, arr) => (
                  <React.Fragment key={i}>
                    <span>›</span>
                    <span className={i === arr.length - 1 ? 'text-[#e2e5ea] font-medium' : ''}>{seg}</span>
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {saveStatus && (
                  <span className="text-[11px] text-[#10b981] font-mono font-medium">
                    {saveStatus}
                  </span>
                )}
                {isDirty && (
                  <span className="text-[10.5px] text-[#f59e0b] font-mono flex items-center gap-1">
                    ● Unsaved
                  </span>
                )}
                <button
                  onClick={handleSaveFile}
                  title="Save (Ctrl+S)"
                  className="bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] px-2.5 py-1 rounded text-[11px] font-mono transition-colors border border-[#334155] cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.Save />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* Code Textarea & Gutter with Synchronized Scrolling */}
          {activeTab ? (
            <div className="flex-1 flex overflow-hidden relative font-mono text-[12.5px] leading-[20px]">
              {/* Line Gutter with Folding Arrows */}
              <div
                ref={gutterRef}
                className="w-[54px] bg-[#07080a] border-r border-[#161922] text-right py-3 px-1 text-[11.5px] font-mono text-[#475569] select-none overflow-hidden leading-[20px] flex-shrink-0"
              >
                {rawLines.map((lineText, i) => {
                  const isFoldable = /^(?:\s*)(?:def|class|function|async\s+function|const\s+\w+\s*=\s*(?:async\s*)?\(|if|elif|else|for|while|try|catch).*(?:\{|:)\s*$/.test(lineText);
                  const isFolded = foldedLines[i];
                  return (
                    <div key={i} className="flex items-center justify-end gap-1 px-1 h-[20px]">
                      {isFoldable ? (
                        <button
                          onClick={() => toggleFold(i)}
                          title={isFolded ? "Unfold block" : "Fold block"}
                          className="hover:text-[#60a5fa] cursor-pointer text-[9px] p-0.5"
                        >
                          {isFolded ? '▸' : '▾'}
                        </button>
                      ) : (
                        <span className="w-2.5 inline-block" />
                      )}
                      <span className={cursorPos.line === i + 1 ? 'text-[#60a5fa] font-bold' : ''}>
                        {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Code Editor Container */}
              <div className="flex-1 relative overflow-hidden bg-[#090b0e]">
                {/* Syntax Highlight Overlay (Synchronized with Textarea Scroll) */}
                <div
                  ref={syntaxRef}
                  aria-hidden="true"
                  className="absolute inset-0 p-3 pointer-events-none whitespace-pre overflow-hidden leading-[20px] select-none text-[12.5px] font-mono font-normal"
                >
                  {rawLines.map((lineText, i) => (
                    <div
                      key={i}
                      className={`h-[20px] leading-[20px] ${cursorPos.line === i + 1 ? 'bg-[#1e293b]/25 rounded-sm' : ''}`}
                    >
                      {foldedLines[i] ? (
                        <span>
                          {highlightCodeLine(lineText)}
                          <span className="text-[#3b82f6] bg-[#1e293b]/60 px-1.5 py-0.2 rounded border border-[#3b82f6]/30 ml-2 text-[10px] select-none">
                            ... folded
                          </span>
                        </span>
                      ) : (
                        highlightCodeLine(lineText)
                      )}
                    </div>
                  ))}
                </div>

                {/* Actual Typing Input Textarea */}
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={handleEditorChange}
                  onScroll={handleEditorScroll}
                  onKeyDown={handleKeyDown}
                  onSelect={handleEditorSelection}
                  onClick={handleEditorSelection}
                  onKeyUp={handleEditorSelection}
                  spellCheck={false}
                  className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-[#60a5fa] p-3 text-[12.5px] font-mono leading-[20px] resize-none focus:outline-none custom-scrollbar select-text overflow-y-auto whitespace-pre tab-4 z-10 font-normal"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#090b0e] select-none">
              <div className="w-16 h-16 rounded-2xl bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-3 mb-4 shadow-xl">
                <img src="/aionlabs.svg" alt="Archon" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#e2e5ea] mb-1">
                {currentProjectName} Workspace
              </h3>
              <p className="text-[12px] font-mono text-[#64748b] max-w-[380px] leading-relaxed mb-6">
                Folder: <span className="text-[#94a3b8]">{currentProjectPath}</span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowOpenProjectModal(true)}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg text-[12px] font-mono transition-all cursor-pointer font-medium flex items-center gap-2"
                >
                  <Icons.FolderPlus />
                  <span>Open or Create Project...</span>
                </button>
                <button
                  onClick={() => handleOpenFile('README.md')}
                  className="bg-[#12151c] hover:bg-[#1a1e26] text-[#cbd5e1] border border-[#1e232e] px-4 py-2 rounded-lg text-[12px] font-mono transition-all cursor-pointer flex items-center gap-2"
                >
                  <Icons.FileCode />
                  <span>Open README.md</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Interactive Multi-Tab Terminal & Diagnostics Panel ── */}
          {showBottomPanel && (
            <div className="h-[180px] bg-[#07080a] border-t border-[#161922] flex flex-col flex-shrink-0">
              
              {/* Bottom Tab Bar with + New Terminal & Copy Button */}
              <div className="flex justify-between items-center px-3 py-1 bg-[#090b0e] border-b border-[#161922] text-[11px] font-mono select-none">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBottomTab('terminal')}
                    className={`cursor-pointer transition-colors flex items-center gap-1.5 pb-0.5 ${bottomTab === 'terminal' ? 'text-[#60a5fa] font-bold border-b-2 border-[#3b82f6]' : 'text-[#64748b] hover:text-[#94a3b8]'}`}
                  >
                    <Icons.Terminal />
                    <span>TERMINAL</span>
                  </button>
                  <button
                    onClick={() => setBottomTab('output')}
                    className={`cursor-pointer transition-colors pb-0.5 ${bottomTab === 'output' ? 'text-[#60a5fa] font-bold border-b-2 border-[#3b82f6]' : 'text-[#64748b] hover:text-[#94a3b8]'}`}
                  >
                    OUTPUT
                  </button>
                  <button
                    onClick={() => setBottomTab('diagnostics')}
                    className={`cursor-pointer transition-colors pb-0.5 ${bottomTab === 'diagnostics' ? 'text-[#60a5fa] font-bold border-b-2 border-[#3b82f6]' : 'text-[#64748b] hover:text-[#94a3b8]'}`}
                  >
                    DIAGNOSTICS
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {bottomTab === 'terminal' && (
                    <div className="flex items-center gap-1.5 mr-3">
                      {terminals.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setActiveTermId(t.id)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer text-[10px] font-mono transition-colors ${
                            activeTermId === t.id
                              ? 'bg-[#1e293b] text-[#60a5fa] border border-[#3b82f6]/30'
                              : 'text-[#64748b] hover:bg-[#12151c] hover:text-[#cbd5e1]'
                          }`}
                        >
                          <span>{t.name}</span>
                          {terminals.length > 1 && (
                            <button
                              onClick={(e) => handleCloseTerminal(t.id, e)}
                              className="hover:text-[#ef4444] p-0.5"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleAddTerminal}
                        title="Add New Terminal"
                        className="text-[#60a5fa] hover:text-[#93c5fd] bg-[#12151c] hover:bg-[#1e293b] px-1.5 py-0.5 rounded border border-[#1e232e] cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        <Icons.Plus />
                        <span>New</span>
                      </button>
                      <button
                        onClick={handleCopyTerminalBuffer}
                        title="Copy All Terminal Output"
                        className="text-[#94a3b8] hover:text-[#cbd5e1] bg-[#12151c] hover:bg-[#1e293b] px-2 py-0.5 rounded border border-[#1e232e] cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        <Icons.Copy />
                        <span>{terminalCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setShowBottomPanel(false)}
                    className="text-[#64748b] hover:text-[#cbd5e1] cursor-pointer"
                  >
                    <Icons.Close />
                  </button>
                </div>
              </div>

              {/* Tab 1: Live Interactive Terminal (Full Selectable Text) */}
              {bottomTab === 'terminal' && (
                <div className="flex-1 flex flex-col p-2.5 overflow-hidden font-mono text-[11.5px] bg-[#07080a] select-text">
                  <div
                    ref={termScrollRef}
                    className="flex-1 overflow-y-auto space-y-1 custom-scrollbar text-[#c9d1d9] pb-1 select-text"
                  >
                    {currentTerm.history.map((item, i) => (
                      <div key={i} className="leading-relaxed select-text">
                        {item.type === 'input' && (
                          <div className="text-[#60a5fa] font-bold select-text">{item.text}</div>
                        )}
                        {item.type === 'stdout' && (
                          <pre className="text-[#a0a6b5] whitespace-pre-wrap select-text font-mono">{item.text}</pre>
                        )}
                        {item.type === 'stderr' && (
                          <pre className="text-[#f87171] whitespace-pre-wrap select-text font-mono">{item.text}</pre>
                        )}
                        {item.type === 'system' && (
                          <div className="text-[#10b981] select-text">{item.text}</div>
                        )}
                      </div>
                    ))}
                    {executingCmd && (
                      <div className="text-[#60a5fa] flex items-center gap-2 animate-pulse select-text">
                        <span className="animate-spin">⟳</span> Running command...
                      </div>
                    )}
                  </div>

                  {/* Interactive Terminal Prompt Input */}
                  <div className="flex items-center gap-2 pt-1.5 border-t border-[#161922] text-[11.5px] font-mono">
                    <span className="text-[#10b981] flex items-center gap-1 select-none font-bold">
                      archon@{currentProjectName}:~
                    </span>
                    <span className="text-[#60a5fa] select-none font-bold">$</span>
                    <input
                      ref={termInputRef}
                      type="text"
                      value={currentTerm.input}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTerminals(prev => prev.map(t => t.id === activeTermId ? { ...t, input: val } : t));
                      }}
                      onKeyDown={handleTerminalKeyDown}
                      placeholder="Type shell command (e.g. ls, git status, cd .., mkdir new-dir)..."
                      className="flex-1 bg-transparent text-[#e2e5ea] focus:outline-none placeholder-[#475569] select-text"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: System Output Logs */}
              {bottomTab === 'output' && (
                <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[11.5px] leading-[1.6] custom-scrollbar text-[#94a3b8] select-text">
                  <div>
                    <span className="text-[#475569] select-none">[{new Date().toLocaleTimeString()}]</span> Archon Agent IDE workspace initialized.
                  </div>
                  <div>
                    <span className="text-[#475569] select-none">[{new Date().toLocaleTimeString()}]</span> Microservices Mesh connected on {apiBase}
                  </div>
                  <div>
                    <span className="text-[#475569] select-none">[{new Date().toLocaleTimeString()}]</span> GPU Model loaded: {selectedModel}
                  </div>
                  {activeTabPath && (
                    <div>
                      <span className="text-[#475569] select-none">[{new Date().toLocaleTimeString()}]</span> Active Editor Buffer: {activeTabPath}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Diagnostics */}
              {bottomTab === 'diagnostics' && (
                <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[11.5px] leading-[1.6] custom-scrollbar text-[#cbd5e1] select-text">
                  <span>Project Root: {currentProjectPath}</span><br />
                  <span>Git Branch: {gitBranch}</span><br />
                  <span>Active File: {activeTabPath || 'None'}</span><br />
                  <span>Line Count: {rawLines.length} | Characters: {editorContent.length}</span><br />
                  <span>Unsaved Buffer: {isDirty ? 'Yes' : 'No'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4. Archon Agent Chat Panel (Right, 380px) ───────────── */}
        <div className="w-[380px] bg-[#0c0e12] border-l border-[#161922] flex flex-col flex-shrink-0 overflow-hidden select-none">
          
          <div className="px-3.5 py-2.5 border-b border-[#161922] bg-[#090b0e] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-0.5 shadow-sm">
                <img src="/aionlabs.svg" alt="Archon" className="w-full h-full object-contain" />
              </div>
              <span className="text-[12px] font-mono font-bold text-[#e2e5ea] tracking-tight">
                Archon Agent
              </span>
              <span className="text-[10px] font-mono text-[#60a5fa] px-1.5 py-0.2 bg-[#3b82f6]/10 rounded border border-[#3b82f6]/20">
                {selectedModel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoApplyEdits(!autoApplyEdits)}
                title="Toggle automatic application of AI code edits directly to active file"
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer border ${
                  autoApplyEdits
                    ? 'bg-[#3b82f6]/20 text-[#60a5fa] border-[#3b82f6]/40 font-bold'
                    : 'bg-[#12151c] text-[#64748b] border-[#1e232e] hover:text-[#94a3b8]'
                }`}
              >
                <span>⚡</span>
                <span>Auto-Apply: {autoApplyEdits ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setAgentMessages([{ role: 'assistant', content: "Chat history cleared. How can I help you?" }])}
                title="Clear Chat History"
                className="text-[#64748b] hover:text-[#cbd5e1] text-[11px] font-mono p-1 rounded hover:bg-[#161922] cursor-pointer"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-[#08090a] border-b border-[#161922]/60 flex items-center justify-between text-[11px] font-mono">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#8b949e]">
              <input
                type="checkbox"
                checked={includeFileContext}
                onChange={(e) => setIncludeFileContext(e.target.checked)}
                className="rounded border-[#1e232e] bg-[#12151c] text-[#3b82f6] focus:ring-0 cursor-pointer"
              />
              <span>Include active file in context</span>
            </label>
            {activeTab && includeFileContext && (
              <span className="text-[#60a5fa] truncate max-w-[130px] font-medium flex items-center gap-1" title={activeTab.path}>
                <Icons.FileCode />
                <span className="truncate">{activeTab.name}</span>
              </span>
            )}
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar select-text">
            {agentMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-[12.5px] leading-relaxed transition-all ${
                  msg.role === 'user'
                    ? 'bg-[#12151c] border-[#1e2430] text-[#e2e5ea] ml-4'
                    : 'bg-[#08090a] border-[#161922] text-[#cbd5e1] mr-1 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-[10.5px] font-mono font-bold select-none">
                  {msg.role === 'user' ? (
                    <span className="text-[#60a5fa] flex items-center gap-1.5">
                      <Icons.User />
                      <span>Developer</span>
                    </span>
                  ) : (
                    <span className="text-[#10b981] flex items-center gap-1.5">
                      <Icons.ArchonAI />
                      <span>Archon Agent</span>
                    </span>
                  )}

                  {msg.role === 'assistant' && msg.content.includes('```') && (
                    <button
                      onClick={() => {
                        const codeMatch = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/.exec(msg.content);
                        if (codeMatch && codeMatch[1]) {
                          handleApplyCodeToEditor(codeMatch[1].trim());
                        }
                      }}
                      className="text-[#60a5fa] hover:text-[#93c5fd] bg-[#1e293b]/70 hover:bg-[#1e293b] px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border border-[#3b82f6]/30 cursor-pointer"
                    >
                      <span>⚡ Apply to {activeTab ? activeTab.name : 'Editor'}</span>
                    </button>
                  )}
                </div>

                <FormattedMarkdown
                  content={msg.content}
                  onApplyCode={handleApplyCodeToEditor}
                />
              </div>
            ))}

            {agentLoading && (
              <div className="p-3 bg-[#08090a] border border-[#161922] rounded-lg text-[12px] font-mono text-[#60a5fa] flex items-center gap-2 animate-pulse">
                <span className="animate-spin">⚡</span> Archon Agent synthesizing solution...
              </div>
            )}
          </div>

          {activeTab && (
            <div className="p-2 border-t border-[#161922]/60 bg-[#08090a] flex items-center gap-1.5 overflow-x-auto custom-scrollbar select-none">
              <button
                onClick={() => handleSendAgentMessage(`Refactor ${activeTab.path} to improve code cleanliness, maintainability, and error handling. Output the updated code.`)}
                className="whitespace-nowrap px-2 py-1 rounded text-[10.5px] font-mono bg-[#12151c] hover:bg-[#1a1e26] text-[#8b949e] hover:text-[#60a5fa] border border-[#1a1e26] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Icons.Bolt />
                <span>Refactor & Apply</span>
              </button>
              <button
                onClick={() => handleSendAgentMessage(`Review ${activeTab.path} for any bugs or edge cases, fix them, and provide the updated complete implementation.`)}
                className="whitespace-nowrap px-2 py-1 rounded text-[10.5px] font-mono bg-[#12151c] hover:bg-[#1a1e26] text-[#8b949e] hover:text-[#60a5fa] border border-[#1a1e26] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Icons.Diagnostics />
                <span>Fix Bugs</span>
              </button>
              <button
                onClick={() => handleSendAgentMessage(`Explain what ${activeTab.path} does and summarize its key methods.`)}
                className="whitespace-nowrap px-2 py-1 rounded text-[10.5px] font-mono bg-[#12151c] hover:bg-[#1a1e26] text-[#8b949e] hover:text-[#60a5fa] border border-[#1a1e26] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Icons.Search />
                <span>Explain</span>
              </button>
            </div>
          )}

          <div className="p-3 border-t border-[#161922] bg-[#090b0e]">
            <div className="relative border border-[#1e232e] focus-within:border-[#3b82f6]/50 rounded-lg bg-[#08090a] transition-all">
              <textarea
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAgentMessage();
                  }
                }}
                placeholder="Ask Archon Agent (Enter to send, Shift+Enter for newline)..."
                rows={2}
                className="w-full bg-transparent text-[#cbd5e1] p-2.5 text-[12px] font-mono focus:outline-none resize-none custom-scrollbar placeholder-[#475569] select-text"
              />
              <div className="flex justify-between items-center px-2.5 pb-2 select-none">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-[#12151c] text-[#8b949e] text-[10px] font-mono rounded px-1.5 py-0.5 border border-[#1e232e] focus:outline-none cursor-pointer"
                >
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleSendAgentMessage()}
                  disabled={!agentInput.trim() || agentLoading}
                  className={`px-3 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    agentInput.trim() && !agentLoading
                      ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-md'
                      : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  Send ↵
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Status Bar (Bottom, 24px) ──────────────────────────── */}
      <div className="h-[24px] bg-[#060708] border-t border-[#161922] px-3 flex justify-between items-center text-[11px] font-mono text-[#64748b] flex-shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="text-[#60a5fa] flex items-center gap-1 font-medium">
            ⎇ {gitBranch} ({currentProjectName})
          </span>
          {activeTab && (
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
          )}
          <span>UTF-8</span>
          <span>Spaces: 2</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowBottomPanel(!showBottomPanel)}
            className="hover:text-[#cbd5e1] cursor-pointer flex items-center gap-1"
          >
            <Icons.Terminal />
            <span>{showBottomPanel ? '▾ Panel' : '▸ Panel'}</span>
          </button>
          <span className="text-[#10b981] flex items-center gap-1">
            ● Archon: {selectedModel} (GPU)
          </span>
        </div>
      </div>

      {/* ── Open / Create Project Workspace Modal ─────────────────── */}
      {showOpenProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0e12] border border-[#1a1e26] rounded-xl max-w-[550px] w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1a1e26] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-0.5 shadow-sm">
                  <img src="/aionlabs.svg" alt="Archon" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-[14px] font-mono font-bold text-[#e2e5ea]">
                  Open or Create Folder / Project Workspace
                </h3>
              </div>
              <button
                onClick={() => setShowOpenProjectModal(false)}
                className="text-[#64748b] hover:text-[#cbd5e1] p-1 cursor-pointer"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-[#8b949e]">
                Enter local folder path:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={projectPathInput}
                  onChange={(e) => setProjectPathInput(e.target.value)}
                  placeholder="e.g. D:/AIDeV/my-new-app or C:/Users/gaura/projects/demo"
                  className="flex-1 bg-[#08090a] border border-[#1a1e26] rounded-lg px-3 py-2 text-[12px] font-mono text-[#e2e5ea] focus:outline-none focus:border-[#3b82f6]"
                />
                <button
                  onClick={() => handleOpenProject(projectPathInput, false)}
                  className="bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] px-3.5 py-2 rounded-lg text-[12px] font-mono font-semibold transition-all cursor-pointer border border-[#334155]"
                >
                  Open
                </button>
                <button
                  onClick={() => handleOpenProject(projectPathInput, true)}
                  title="Create folder and initialize project if missing"
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3.5 py-2 rounded-lg text-[12px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>✨</span>
                  <span>Create & Open</span>
                </button>
              </div>
            </div>

            {recentProjects.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#161922]">
                <div className="text-[11px] font-mono text-[#64748b] uppercase tracking-wider">
                  Recent Workspaces:
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {recentProjects.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleOpenProject(p, false)}
                      className="w-full text-left p-2 rounded bg-[#08090a] hover:bg-[#12151c] border border-[#1a1e26] hover:border-[#3b82f6]/40 text-[11.5px] font-mono text-[#8b949e] hover:text-[#60a5fa] transition-colors truncate flex items-center gap-2 cursor-pointer"
                    >
                      <Icons.FolderClosed />
                      <span className="truncate">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowOpenProjectModal(false)}
                className="bg-[#12151c] hover:bg-[#1a1e26] text-[#8b949e] px-4 py-1.5 rounded-lg text-[12px] font-mono cursor-pointer border border-[#1e232e]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -- Main Application Component ------------------------------ */
export default function Home() {
  const [appMode, setAppMode] = useState<'api_copilot' | 'copilot_agent'>('api_copilot');

  // Shared Global State
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemma3:4b");
  const [dbData, setDbData] = useState<{ fixed_chunks: string[], semantic_chunks: string[] }>({ fixed_chunks: [], semantic_chunks: [] });
  
  // API Copilot Original View State
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('');
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'terminal' | 'search' | 'db'>('terminal');
  const [searchData, setSearchData] = useState<{ bm25: any[]; dense: any[]; cross_encoder: any[] } | null>(null);
  const [highlightStrategy, setHighlightStrategy] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadChunks, setUploadChunks] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/models`)
      .then(res => res.json())
      .then(data => {
        setModels(data.models || []);
        if (data.models && data.models.length > 0) setSelectedModel(data.models[0]);
      })
      .catch(err => console.error("Could not load models"));

    fetch(`${API_BASE}/api/database`)
      .then(res => res.json())
      .then(data => setDbData(data))
      .catch(err => console.error("Could not load DB data"));
  }, []);

  // Auto-scroll output when tokens stream in
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [generation]);

  const handleProcess = async () => {
    if (!query) return;
    setLoading(true);
    setSearchData(null);
    setGeneration('');
    setPipelineStage(0);
    setActiveTab('terminal');

    try {
      // Stage 1: BM25 Lexical
      setPipelineStage(1);
      const searchRes = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, model: selectedModel })
      });
      const searchDataResult = await searchRes.json();
      
      // Stage 2: Dense Vector Proximity
      setPipelineStage(2);
      await new Promise(r => setTimeout(r, 250));
      
      // Stage 3: Cross-Encoder Re-Ranking
      setPipelineStage(3);
      setSearchData(searchDataResult);
      await new Promise(r => setTimeout(r, 250));

      // Stage 4: LLM Generation
      setPipelineStage(4);

      const genRes = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, model: selectedModel })
      });

      if (!genRes.ok) {
        const errData = await genRes.json();
        setGeneration(`**Backend Error:** ${errData.detail || 'Unknown error occurred.'}`);
        setPipelineStage(-1);
        setLoading(false);
        return;
      }

      // Read SSE stream
      const reader = genRes.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.token) {
                  fullText += data.token;
                  setGeneration(fullText);
                }
                if (data.done) break;
                if (data.error) {
                  setGeneration(`\n\n> ⚠️ **Error:** ${data.error}`);
                  break;
                }
              } catch (e) {}
            }
          }
        }
      }

      setPipelineStage(-1);
    } catch (e) {
      console.error(e);
      setGeneration(`❌ **Connection error:** Could not reach the API Gateway on \`${API_BASE}\`.`);
      setPipelineStage(-1);
    }
    setLoading(false);
  };

  const handleNavigateStage = (stage: typeof PIPELINE_STAGES[0]) => {
    setActiveTab(stage.targetTab as 'terminal' | 'search' | 'db');
    if (stage.highlightKey) {
      setHighlightStrategy(stage.highlightKey);
      setTimeout(() => setHighlightStrategy(null), 3000);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploadChunks(data.chunks || []);
      setShowModal(true);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Document upload failed.");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tabs = [
    { id: 'terminal', label: 'Code Synthesis', icon: '▸' },
    { id: 'search', label: 'Search Diagnostics', icon: '◈' },
    { id: 'db', label: 'Knowledge Base', icon: '◆' },
  ];

  return (
    <div className="min-h-screen bg-[#08090a] text-[#c8ccd0] font-sans antialiased selection:bg-[#2563eb]/30 selection:text-white">
      
      {/* ── Top Universal Header & Mode Switcher ──────────────────── */}
      <header className="border-b border-[#161922] bg-[#07080a]/95 backdrop-blur-md sticky top-0 z-50 select-none">
        <div className="max-w-[1400px] mx-auto px-6 h-[56px] flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-1.5 shadow-sm">
              <img src="/aionlabs.svg" alt="Archon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#e2e5ea] tracking-tight">
                  Archon Copilot
                </span>
                <span className="text-[9.5px] font-mono font-medium px-1.5 py-0.2 bg-[#12151c] border border-[#1e232e] text-[#60a5fa] rounded">
                  v2.0
                </span>
              </div>
            </div>
          </div>

          {/* Center Mode Switcher */}
          <div className="flex items-center p-1 bg-[#0c0e12] border border-[#1a1e26] rounded-xl shadow-inner">
            <button
              onClick={() => setAppMode('api_copilot')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-mono font-semibold transition-all cursor-pointer ${
                appMode === 'api_copilot'
                  ? 'bg-[#1e293b] text-[#60a5fa] border border-[#3b82f6]/30 shadow-md'
                  : 'text-[#64748b] hover:text-[#cbd5e1]'
              }`}
            >
              <Icons.Bolt />
              <span>Archon RAG</span>
            </button>
            <button
              onClick={() => setAppMode('copilot_agent')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-mono font-semibold transition-all cursor-pointer ${
                appMode === 'copilot_agent'
                  ? 'bg-[#1e293b] text-[#60a5fa] border border-[#3b82f6]/30 shadow-md'
                  : 'text-[#64748b] hover:text-[#cbd5e1]'
              }`}
            >
              <Icons.ArchonAI />
              <span>Archon Agent (IDE)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#10b981]/10 border border-[#10b981]/25 rounded-lg text-[11px] font-mono text-[#10b981]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span>Mesh Online</span>
          </div>
        </div>
      </header>

      {/* ── VIEWPORT CONTENT SWITCHER ─────────────────────────────── */}
      {appMode === 'copilot_agent' ? (
        <main className="w-full h-[calc(100vh-56px)] overflow-hidden">
          <VSCodeAgentIDE
            apiBase={API_BASE}
            models={models}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        </main>
      ) : (
        <main className="min-h-[calc(100vh-56px)] p-6 md:p-10">
          
          {/* Upload Spec Modal */}
          {showModal && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowModal(false)}
            >
              <div 
                className="bg-[#0e1015] border border-[#1a1e26] rounded-xl max-w-3xl w-full max-h-[75vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-6 py-5 border-b border-[#1a1e26] flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-semibold text-[#e2e5ea] tracking-tight">Document Ingested</h3>
                    <p className="text-xs text-[#4a5060] mt-1 font-mono">{uploadChunks.length} semantic segments extracted</p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="text-[#4a5060] hover:text-[#c8ccd0] transition-colors duration-300 w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#1a1e26] cursor-pointer"
                  >
                    <Icons.Close />
                  </button>
                </div>
                <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                  {uploadChunks.map((chunk, i) => (
                    <div key={i} className="bg-[#08090a] border border-[#1a1e26] rounded-lg p-4 hover:border-[#282e3a] transition-colors duration-300">
                      <div className="text-[10px] font-mono font-medium text-[#4a5060] mb-2.5 tracking-wider uppercase">Segment {i + 1}</div>
                      <pre className="text-[12.5px] text-[#8b92a0] whitespace-pre-wrap font-mono leading-relaxed">{chunk}</pre>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-[#1a1e26] flex justify-end">
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="bg-[#1a1e26] hover:bg-[#282e3a] text-[#c8ccd0] px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-[1200px] mx-auto">
            
            {/* Header */}
            <header className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
                    <span className="text-[10px] font-mono font-medium text-[#4a5060] tracking-[0.2em] uppercase">RAG Engine Live</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-1.5 shadow-sm">
                      <img src="/aionlabs.svg" alt="Archon" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-[28px] font-semibold text-[#e2e5ea] tracking-[-0.02em] leading-tight">
                      Archon RAG
                    </h1>
                  </div>
                  <p className="text-[13px] text-[#4a5060] mt-1.5 font-mono">Hybrid retrieval (BM25 + Dense + Cross-Encoder) & Code Synthesis</p>
                </div>
                
                <div className="flex gap-3 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-medium text-[#4a5060] tracking-wider uppercase">Ingest Spec</label>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleUpload} 
                        className="hidden" 
                        id="file-upload"
                        accept=".json,.yaml,.yml,.md" 
                      />
                      <label 
                        htmlFor="file-upload" 
                        className="cursor-pointer flex items-center gap-2 bg-[#0e1015] border border-[#1a1e26] hover:border-[#282e3a] text-[#6b7280] hover:text-[#c8ccd0] px-4 py-2 rounded-lg text-sm font-mono transition-all duration-300"
                      >
                        {uploading ? (
                          <span className="flex items-center gap-2"><span className="animate-spin text-[#3b82f6]">⟳</span>Ingesting</span>
                        ) : (
                          <><span className="text-[#4a5060]">↑</span>Upload</>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-medium text-[#4a5060] tracking-wider uppercase">Active Model</label>
                    <select 
                      value={selectedModel} 
                      onChange={e => setSelectedModel(e.target.value)}
                      className="bg-[#0e1015] border border-[#1a1e26] hover:border-[#282e3a] text-[#c8ccd0] py-2 px-4 rounded-lg text-sm font-mono outline-none focus:border-[#282e3a] transition-all duration-300 cursor-pointer"
                    >
                      {models.length > 0 ? (
                        models.map(m => <option key={m} value={m} className="bg-[#0e1015]">{m}</option>)
                      ) : (
                        <option value="gemma3:4b" className="bg-[#0e1015]">gemma3:4b</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-gradient-to-r from-[#1a1e26] via-[#282e3a] to-[#1a1e26] mt-6" />
            </header>

            {/* Global Interactive Pipeline Visualizer */}
            <RagPipeline 
              currentStage={pipelineStage} 
              onNavigateStage={handleNavigateStage} 
            />

            {/* Command Input Bar */}
            <div className={`mb-6 transition-all duration-500 ${inputFocused ? 'scale-[1.003]' : ''}`}>
              <div className={`bg-[#0e1015] border rounded-xl p-1.5 pl-5 flex items-center transition-all duration-500 ${inputFocused ? 'border-[#282e3a] shadow-[0_0_30px_rgba(59,130,246,0.05)]' : 'border-[#1a1e26]'}`}>
                <span className="text-[#282e3a] mr-3 font-mono text-sm select-none">▸</span>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={e => e.key === 'Enter' && handleProcess()}
                  placeholder="Ask any API question… e.g. How do I create a customer charge in Stripe?"
                  className="bg-transparent border-none outline-none text-[#e2e5ea] placeholder-[#282e3a] flex-1 text-sm font-mono leading-relaxed"
                />
                <button
                  onClick={handleProcess}
                  disabled={loading || !query.trim()}
                  className={`px-5 py-2.5 rounded-lg text-xs font-mono font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                    loading || !query.trim() 
                      ? 'bg-transparent text-[#282e3a] cursor-not-allowed' 
                      : 'bg-[#1a1e26] text-[#c8ccd0] hover:bg-[#282e3a] hover:text-white border border-[#282e3a]/50 shadow-sm'
                  }`}
                >
                  {loading ? (
                    <><span className="animate-spin text-[#3b82f6]">⟳</span>Processing</>
                  ) : (
                    <>Execute<span className="text-[10px] text-[#4a5060]">↵</span></>
                  )}
                </button>
              </div>

              {/* Sample Queries */}
              <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 text-[11px] font-mono text-[#333a48] custom-scrollbar">
                <span className="text-[#282e3a] select-none py-0.5">Try:</span>
                {[
                  "How to charge a card in Stripe?",
                  "Twilio send SMS endpoint & parameters",
                  "SendGrid v3 mail send cURL",
                  "Slack chat.postMessage payload"
                ].map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(sample)}
                    className="hover:text-[#6b7280] transition-colors duration-300 whitespace-nowrap bg-[#0a0c10] hover:bg-[#0e1015] px-2.5 py-0.5 rounded border border-[#14171e] hover:border-[#1a1e26] cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy Tabs & Display Panel */}
            <div className="bg-[#0e1015] border border-[#1a1e26] rounded-xl overflow-hidden shadow-2xl">
              
              {/* Tab Bar */}
              <div className="flex border-b border-[#1a1e26] bg-[#0a0c10]">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3.5 text-xs font-mono transition-all duration-300 relative cursor-pointer ${
                      activeTab === tab.id
                        ? 'text-[#e2e5ea] bg-[#0e1015] font-medium'
                        : 'text-[#4a5060] hover:text-[#8b92a0] hover:bg-[#0c0e12]'
                    }`}
                  >
                    <span className={`text-[10px] ${activeTab === tab.id ? 'text-[#3b82f6]' : 'text-[#282e3a]'}`}>
                      {tab.icon}
                    </span>
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab 1: Terminal Code Synthesis View */}
              {activeTab === 'terminal' && (
                <div className="p-6">
                  <div className="bg-[#08090a] border border-[#1a1e26] rounded-lg overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-[#1a1e26] bg-[#0a0c10]/60">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1a1e26]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1a1e26]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1a1e26]" />
                        <span className="text-[11px] font-mono text-[#333a48] ml-2">archon-copilot ~ output</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {loading && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#3b82f6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                            Streaming…
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-[#282e3a]">{selectedModel}</span>
                      </div>
                    </div>
                    <div ref={outputRef} className="p-6 min-h-[350px] max-h-[550px] overflow-y-auto custom-scrollbar">
                      {generation ? (
                        <FormattedMarkdown content={generation} />
                      ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-[#333a48] font-mono text-xs space-y-3">
                          <div className="w-6 h-6 border-2 border-[#1a1e26] border-t-[#3b82f6] rounded-full animate-spin" />
                          <span>Generating endpoint synthesis…</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-[#282e3a] font-mono text-xs space-y-2">
                          <span>$ Enter a query above to execute hybrid search & synthesis.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 3-Column Search Diagnostics */}
              {activeTab === 'search' && (
                <div className="p-6">
                  {!searchData ? (
                    <div className="text-center py-20 text-[#282e3a] font-mono text-xs">
                      Run a query to inspect live ranking diagnostics across BM25, Dense Vectors, and Cross-Encoder.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      
                      {/* BM25 Column */}
                      <div className={`bg-[#08090a] rounded-lg flex flex-col transition-all duration-500 border ${
                        highlightStrategy === 'bm25'
                          ? 'border-[#3b82f6] shadow-[0_0_30px_rgba(59,130,246,0.2)] ring-1 ring-[#3b82f6]/50'
                          : 'border-[#1a1e26] hover:border-[#282e3a]'
                      }`}>
                        <div className="border-b border-[#1a1e26] px-4 py-3.5 flex justify-between items-center bg-[#0a0c10]">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-[#3b82f6] font-bold">01</span>
                              <h3 className="text-[12px] font-mono font-semibold text-[#c8ccd0] tracking-wide">Okapi BM25</h3>
                            </div>
                            <p className="text-[10px] text-[#4a5060] mt-0.5 font-mono">Lexical keyword matching</p>
                          </div>
                          <span className="text-[9px] font-mono font-medium tracking-[0.15em] text-[#4a5060] bg-[#12151c] px-2 py-0.5 rounded border border-[#1a1e26]">TOP 5</span>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto h-[440px] space-y-2.5 custom-scrollbar">
                          {Array.isArray(searchData.bm25) ? searchData.bm25.map((item: any, i: number) => (
                            <div key={i} className="bg-[#0e1015] border border-[#1a1e26] rounded-md p-3.5 hover:border-[#282e3a] transition-colors duration-300">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-mono font-bold text-[#6b7280] bg-[#08090a] px-1.5 py-0.5 rounded">#{item.rank}</span>
                                <span className="text-[10px] font-mono font-medium text-[#38bdf8]">{item.score}</span>
                              </div>
                              <pre className="text-[11.5px] text-[#6b7280] font-mono whitespace-pre-wrap leading-[1.6]">{item.text}</pre>
                            </div>
                          )) : <div className="text-[#4a5060] text-xs font-mono p-3">{typeof searchData.bm25 === 'string' ? searchData.bm25 : 'No results'}</div>}
                        </div>
                      </div>

                      {/* Dense Vector Column */}
                      <div className={`bg-[#08090a] rounded-lg flex flex-col transition-all duration-500 border ${
                        highlightStrategy === 'dense'
                          ? 'border-[#a78bfa] shadow-[0_0_30px_rgba(167,139,250,0.2)] ring-1 ring-[#a78bfa]/50'
                          : 'border-[#1a1e26] hover:border-[#282e3a]'
                      }`}>
                        <div className="border-b border-[#1a1e26] px-4 py-3.5 flex justify-between items-center bg-[#0a0c10]">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-[#a78bfa] font-bold">02</span>
                              <h3 className="text-[12px] font-mono font-semibold text-[#c8ccd0] tracking-wide">Dense Vectors</h3>
                            </div>
                            <p className="text-[10px] text-[#4a5060] mt-0.5 font-mono">BGE-small (ChromaDB)</p>
                          </div>
                          <span className="text-[9px] font-mono font-medium tracking-[0.15em] text-[#4a5060] bg-[#12151c] px-2 py-0.5 rounded border border-[#1a1e26]">TOP 5</span>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto h-[440px] space-y-2.5 custom-scrollbar">
                          {Array.isArray(searchData.dense) ? searchData.dense.map((item: any, i: number) => (
                            <div key={i} className="bg-[#0e1015] border border-[#1a1e26] rounded-md p-3.5 hover:border-[#282e3a] transition-colors duration-300">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-mono font-bold text-[#6b7280] bg-[#08090a] px-1.5 py-0.5 rounded">#{item.rank}</span>
                                <span className="text-[10px] font-mono font-medium text-purple-400/80">{item.score}</span>
                              </div>
                              <pre className="text-[11.5px] text-[#6b7280] font-mono whitespace-pre-wrap leading-[1.6]">{item.text}</pre>
                            </div>
                          )) : <div className="text-[#4a5060] text-xs font-mono p-3">{typeof searchData.dense === 'string' ? searchData.dense : 'No results'}</div>}
                        </div>
                      </div>

                      {/* Cross-Encoder Column */}
                      <div className={`bg-[#08090a] rounded-lg flex flex-col relative overflow-hidden transition-all duration-500 border ${
                        highlightStrategy === 'cross_encoder'
                          ? 'border-[#10b981] shadow-[0_0_30px_rgba(16,185,129,0.2)] ring-1 ring-[#10b981]/50'
                          : 'border-[#10b981]/20 hover:border-[#10b981]/35'
                      }`}>
                        <div className="absolute top-0 right-0 text-[8px] font-mono font-bold px-2.5 py-1 text-[#10b981] bg-[#10b981]/10 border-b border-l border-[#10b981]/20 rounded-bl-md tracking-[0.15em] uppercase">
                          Winner
                        </div>
                        <div className="border-b border-[#10b981]/15 px-4 py-3.5 flex justify-between items-center bg-[#10b981]/5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-[#10b981] font-bold">03</span>
                              <h3 className="text-[12px] font-mono font-semibold text-[#10b981] tracking-wide">Cross-Encoder</h3>
                            </div>
                            <p className="text-[10px] text-[#10b981]/60 mt-0.5 font-mono">MS-Marco Deep Re-Ranking</p>
                          </div>
                          <span className="text-[9px] font-mono font-medium tracking-[0.15em] text-[#10b981]/60 bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/20 mr-12">TOP 5</span>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto h-[440px] space-y-2.5 custom-scrollbar">
                          {Array.isArray(searchData.cross_encoder) ? searchData.cross_encoder.map((item: any, i: number) => (
                            <div key={i} className={`bg-[#0e1015] border rounded-md p-3.5 transition-all duration-300 ${i === 0 ? 'border-[#10b981]/30 shadow-[0_0_12px_rgba(16,185,129,0.06)]' : 'border-[#1a1e26] hover:border-[#282e3a]'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${i === 0 ? 'text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20' : 'text-[#6b7280] bg-[#08090a]'}`}>#{item.rank}</span>
                                <span className={`text-[10px] font-mono font-medium ${i === 0 ? 'text-[#10b981]' : 'text-[#10b981]/50'}`}>{item.score}</span>
                              </div>
                              <pre className="text-[11.5px] text-[#8b92a0] font-mono whitespace-pre-wrap leading-[1.6]">{item.text}</pre>
                            </div>
                          )) : <div className="text-[#4a5060] text-xs font-mono p-3">{typeof searchData.cross_encoder === 'string' ? searchData.cross_encoder : 'No results'}</div>}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Knowledge Base Viewer */}
              {activeTab === 'db' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1 h-4 bg-[#282e3a] rounded-full" />
                          <h3 className="text-[13px] font-mono font-medium text-[#6b7280] tracking-wide">Legacy Fixed Chunks</h3>
                        </div>
                        <span className="text-[9px] font-mono font-medium tracking-[0.15em] text-[#4a5060] bg-[#13161c] px-2.5 py-1 rounded uppercase border border-[#1a1e26]">Static</span>
                      </div>
                      <div className="bg-[#08090a] border border-[#1a1e26] rounded-lg p-4 h-[420px] overflow-y-auto space-y-2.5 custom-scrollbar">
                        {dbData?.fixed_chunks?.map((chunk: string, i: number) => (
                          <div key={i} className="p-3.5 bg-[#0e1015] rounded-md border border-[#1a1e26] font-mono text-[12px] text-[#6b7280] leading-[1.7] hover:border-[#282e3a] transition-colors duration-300 cursor-default">
                            {chunk}
                          </div>
                        )) || (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-[#282e3a] font-mono text-xs">Awaiting data snapshot…</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1 h-4 bg-[#3b82f6]/50 rounded-full" />
                          <h3 className="text-[13px] font-mono font-medium text-[#6b7280] tracking-wide">Semantic Vector Chunks</h3>
                        </div>
                        <span className="text-[9px] font-mono font-medium tracking-[0.15em] text-[#3b82f6]/70 bg-[#3b82f6]/10 px-2.5 py-1 rounded uppercase border border-[#3b82f6]/20">Smart Chunks</span>
                      </div>
                      <div className="bg-[#08090a] border border-[#1a1e26] rounded-lg p-4 h-[420px] overflow-y-auto space-y-2.5 custom-scrollbar">
                        {dbData?.semantic_chunks?.map((chunk: string, i: number) => (
                          <div key={i} className="p-3.5 bg-[#0e1015] rounded-md border border-[#1a1e26] font-mono text-[12px] text-[#8b92a0] leading-[1.7] hover:border-[#3b82f6]/20 transition-colors duration-300 whitespace-pre-wrap cursor-default">
                            {chunk}
                          </div>
                        )) || (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-[#282e3a] font-mono text-xs">Awaiting data snapshot…</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-between items-center text-[10px] font-mono text-[#282e3a]">
              <span>v2.0.0-archon</span>
              <span>Archon Copilot • Multi-Strategy Diagnostic Portal</span>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
