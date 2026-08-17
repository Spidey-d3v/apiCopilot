"use client";
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ── Strategy Info Definitions ─────────────────────────────── */
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

/* ── File Icon Helper ───────────────────────────────────────── */
function getFileIcon(filename: string, isDirectory: boolean = false, isOpen: boolean = false) {
  if (isDirectory) {
    return (
      <span className="text-[#e2b86b] text-[13px] font-mono select-none">
        {isOpen ? '📂' : '📁'}
      </span>
    );
  }
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (filename === 'Dockerfile' || filename.startsWith('docker-compose')) {
    return <span className="text-[#38bdf8] text-[11px] font-bold font-mono">🐳</span>;
  }
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <span className="text-[#38bdf8] text-[10px] font-bold font-mono px-1 py-0.2 bg-[#0284c7]/15 rounded border border-[#0284c7]/30">TS</span>;
    case 'js':
    case 'jsx':
    case 'mjs':
      return <span className="text-[#facc15] text-[10px] font-bold font-mono px-1 py-0.2 bg-[#eab308]/15 rounded border border-[#eab308]/30">JS</span>;
    case 'py':
      return <span className="text-[#60a5fa] text-[10px] font-bold font-mono px-1 py-0.2 bg-[#2563eb]/15 rounded border border-[#2563eb]/30">PY</span>;
    case 'json':
      return <span className="text-[#fbbf24] text-[11px] font-bold font-mono">{"{}"}</span>;
    case 'yaml':
    case 'yml':
      return <span className="text-[#f87171] text-[10px] font-bold font-mono px-0.5 bg-[#dc2626]/15 rounded">YML</span>;
    case 'md':
      return <span className="text-[#c084fc] text-[10px] font-bold font-mono px-0.5 bg-[#9333ea]/15 rounded">MD</span>;
    case 'css':
      return <span className="text-[#38bdf8] text-[11px] font-bold font-mono">#</span>;
    case 'sh':
      return <span className="text-[#4ade80] text-[11px] font-bold font-mono">$</span>;
    default:
      return <span className="text-[#9ca3af] text-[11px] font-mono">📄</span>;
  }
}

/* ── Code Block with Copy & Apply Actions ──────────────────── */
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
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div className="my-3 bg-[#0a0c10] border border-[#1a1e26] rounded-lg overflow-hidden group shadow-md">
      <div className="flex justify-between items-center px-3 py-1.5 bg-[#0e1015] border-b border-[#1a1e26] text-[11px] font-mono text-[#4a5060]">
        <span className="uppercase tracking-wider text-[#6b7280] font-semibold text-[10px]">{lang}</span>
        <div className="flex items-center gap-1.5">
          {onApplyCode && (
            <button
              onClick={handleApply}
              className="text-[#60a5fa] hover:text-[#93c5fd] bg-[#1e293b]/60 hover:bg-[#1e293b] px-2 py-0.5 rounded transition-colors text-[10.5px] font-mono flex items-center gap-1 cursor-pointer border border-[#3b82f6]/20"
            >
              {applied ? <span className="text-[#10b981]">✓ Applied</span> : <span>⚡ Apply to File</span>}
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
      <div className="p-3.5 overflow-x-auto custom-scrollbar">
        <pre className="text-[12px] font-mono leading-[1.65] text-[#93c5fd]">
          <code>{text}</code>
        </pre>
      </div>
    </div>
  );
}

/* ── Rich Markdown Renderer ────────────────────────────────── */
function FormattedMarkdown({ content, onApplyCode }: { content: string; onApplyCode?: (code: string) => void }) {
  return (
    <div className="markdown-body space-y-2.5 font-sans leading-relaxed text-[#a0a6b5] text-[13px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[18px] font-semibold text-[#e2e5ea] border-b border-[#1a1e26] pb-1.5 mt-4 mb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[15px] font-semibold text-[#d0d5dd] border-b border-[#1a1e26]/60 pb-1 mt-3 mb-2 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13.5px] font-medium text-[#c0c6d4] mt-2.5 mb-1.5 tracking-tight">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-[1.75] my-1.5 text-[#9da5b4]">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="text-[#e2e5ea] font-semibold">
              {children}
            </strong>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            if (!inline) {
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

/* ── Interactive RAG Pipeline Visualization ────────────────── */
function RagPipeline({ 
  currentStage, 
  onNavigateStage 
}: { 
  currentStage: number; 
  onNavigateStage: (stage: typeof PIPELINE_STAGES[0]) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  return (
    <div className="border border-[#1a1e26] bg-[#090b0e] rounded-xl p-4 mb-5 relative overflow-hidden transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]/80 animate-pulse" />
          <span className="text-[10px] font-mono text-[#6b7280] tracking-[0.2em] uppercase font-semibold">
            RAG Pipeline Architecture
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#4a5060]">
          Click any node to inspect data & diagnostics
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 custom-scrollbar">
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
                className={`group flex-1 min-w-[125px] p-2.5 rounded-lg border text-left transition-all duration-300 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#3b82f6]/10 border-[#3b82f6]/40 shadow-[0_0_15px_rgba(59,130,246,0.12)]'
                    : isDone
                      ? 'bg-[#10b981]/5 border-[#10b981]/25 hover:border-[#10b981]/40'
                      : isHovered
                        ? 'bg-[#0e1015] border-[#282e3a] shadow-md'
                        : 'bg-[#08090a] border-[#1a1e26] hover:border-[#282e3a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${
                    isActive ? 'text-[#60a5fa]' : isDone ? 'text-[#10b981]' : 'text-[#4a5060]'
                  }`}>
                    0{s.id + 1}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isActive ? 'bg-[#3b82f6] animate-ping' : isDone ? 'bg-[#10b981]' : 'bg-[#1a1e26] group-hover:bg-[#4a5060]'
                  }`} />
                </div>
                <div className={`text-[11.5px] font-mono font-semibold truncate transition-colors ${
                  isActive ? 'text-[#e2e5ea]' : isDone ? 'text-[#cbd5e1]' : 'text-[#8b92a0] group-hover:text-[#e2e5ea]'
                }`}>
                  {s.label}
                </div>
                <div className="text-[9.5px] font-mono text-[#4a5060] truncate mt-0.5">
                  {s.sub}
                </div>
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="w-3.5 h-px relative flex-shrink-0">
                  <div className={`h-full transition-all duration-500 ${
                    currentStage > i ? 'bg-[#10b981]/50' : 'bg-[#1a1e26]'
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

/* ── Tree Node Component for File Explorer ─────────────────── */
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
        <span className="text-[#64748b] text-[10px] w-3.5 flex justify-center">
          {isDir ? (expanded ? '▾' : '▸') : ''}
        </span>
        {getFileIcon(node.name, isDir, expanded)}
        <span className="truncate flex-1">{node.name}</span>
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

/* ── VS Code Style Copilot Agent IDE Workspace ────────────── */
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
  // File Explorer & Workspace State
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
  const [activeActivity, setActiveActivity] = useState<'explorer' | 'search' | 'copilot' | 'diagnostics'>('explorer');
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(true);
  const [bottomTab, setBottomTab] = useState<'output' | 'terminal' | 'diagnostics'>('output');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[System] Copilot Agent IDE workspace initialized.",
    "[System] Microservices Mesh connected on " + apiBase,
    "[GPU] Model loaded: " + selectedModel
  ]);

  // Copilot Agent Multi-Turn Chat State
  const [agentMessages, setAgentMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "👋 **Hello! I am your Copilot Agent.**\n\nI have full context of your open workspace and active code files. Click any file on the left to edit, and ask me to write, refactor, explain, or test your code."
    }
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [includeFileContext, setIncludeFileContext] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load Workspace Tree on Mount
  const fetchTree = async () => {
    setLoadingTree(true);
    try {
      const res = await fetch(`${apiBase}/api/workspace/tree`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaceTree(data.tree || []);
      }
    } catch (e) {
      console.error("Failed to load workspace tree", e);
    }
    setLoadingTree(false);
  };

  useEffect(() => {
    fetchTree();
  }, [apiBase]);

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
        setTerminalLogs(prev => [...prev, `[File Open] Opened ${data.path} (${data.content.length} bytes)`]);
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
        setTerminalLogs(prev => [...prev, `[File Save] Successfully wrote ${activeTabPath} (${editorContent.length} bytes)`]);
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('❌ Error');
      }
    } catch (e) {
      setSaveStatus('❌ Failed');
    }
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveFile();
    }
    // Tab key indentation
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
    setEditorContent(snippet);
    const active = openTabs.find(t => t.path === activeTabPath);
    if (active) {
      setIsDirty(snippet !== active.original);
      setOpenTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, content: snippet } : t));
    }
    setTerminalLogs(prev => [...prev, `[Copilot Apply] Applied AI code snippet to ${activeTabPath || 'active editor'}`]);
  };

  // Send Copilot Agent Message (Multi-turn SSE Stream)
  const handleSendAgentMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || agentInput;
    if (!textToSend.trim() || agentLoading) return;

    const newHistory = [...agentMessages, { role: 'user' as const, content: textToSend }];
    setAgentMessages(newHistory);
    setAgentInput('');
    setAgentLoading(true);

    // Placeholder assistant message
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
                if (data.done) break;
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

  const lineCount = editorContent.split('\n').length;
  const activeTab = openTabs.find(t => t.path === activeTabPath);

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] bg-[#08090a] text-[#c9d1d9] overflow-hidden select-none border border-[#161922] rounded-xl shadow-2xl">
      {/* Main Workspace Row */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── 1. Activity Bar (Left, 46px) ────────────────────────── */}
        <div className="w-[46px] bg-[#060708] border-r border-[#161922] flex flex-col items-center py-3 justify-between z-10 flex-shrink-0">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setActiveActivity('explorer')}
              title="File Explorer (Ctrl+Shift+E)"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[16px] transition-all cursor-pointer ${
                activeActivity === 'explorer'
                  ? 'bg-[#12151c] text-[#60a5fa] border border-[#3b82f6]/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0e1015]'
              }`}
            >
              📁
            </button>
            <button
              onClick={() => setActiveActivity('search')}
              title="Search Workspace (Ctrl+Shift+F)"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[15px] transition-all cursor-pointer ${
                activeActivity === 'search'
                  ? 'bg-[#12151c] text-[#60a5fa] border border-[#3b82f6]/30'
                  : 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0e1015]'
              }`}
            >
              🔍
            </button>
            <button
              onClick={() => setActiveActivity('copilot')}
              title="Copilot Agent Chat"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[16px] transition-all cursor-pointer ${
                activeActivity === 'copilot'
                  ? 'bg-[#12151c] text-[#60a5fa] border border-[#3b82f6]/30'
                  : 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0e1015]'
              }`}
            >
              🤖
            </button>
            <button
              onClick={() => setActiveActivity('diagnostics')}
              title="Mesh Health & Diagnostics"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[15px] transition-all cursor-pointer ${
                activeActivity === 'diagnostics'
                  ? 'bg-[#12151c] text-[#60a5fa] border border-[#3b82f6]/30'
                  : 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0e1015]'
              }`}
            >
              ⚡
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" title="Mesh Online" />
          </div>
        </div>

        {/* ── 2. Sidebar (Explorer / Search, 250px) ────────────────── */}
        <div className="w-[250px] bg-[#0c0e12] border-r border-[#161922] flex flex-col flex-shrink-0 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[#161922] flex justify-between items-center bg-[#090b0e]">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#94a3b8] uppercase">
              {activeActivity === 'explorer' ? 'Workspace Explorer' : activeActivity === 'search' ? 'Search Files' : 'Mesh Diagnostics'}
            </span>
            <button
              onClick={fetchTree}
              title="Refresh Workspace"
              className="text-[#64748b] hover:text-[#cbd5e1] text-[12px] p-1 rounded hover:bg-[#161922] cursor-pointer"
            >
              🔄
            </button>
          </div>

          {/* Quick Filter */}
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
                <span className="animate-spin">⌛</span> Loading workspace...
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
                No files loaded.
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Central Code Editor Panel (Flex-1) ────────────────── */}
        <div className="flex-1 flex flex-col bg-[#090b0e] overflow-hidden">
          
          {/* Tab Bar */}
          <div className="flex items-center bg-[#07080a] border-b border-[#161922] overflow-x-auto custom-scrollbar flex-shrink-0 h-[38px]">
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
                    className="opacity-0 group-hover:opacity-100 hover:text-[#ef4444] text-[11px] p-0.5 rounded transition-opacity ml-1"
                  >
                    ✕
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

          {/* Breadcrumbs & Quick Toolbar */}
          {activeTab && (
            <div className="flex justify-between items-center px-4 py-1.5 bg-[#0a0c10] border-b border-[#161922] text-[11px] font-mono text-[#64748b]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[#3b82f6]">AIDeV</span>
                {activeTab.path.split('/').map((seg, i, arr) => (
                  <React.Fragment key={i}>
                    <span>›</span>
                    <span className={i === arr.length - 1 ? 'text-[#e2e5ea] font-medium' : ''}>{seg}</span>
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {saveStatus && (
                  <span className="text-[11px] text-[#10b981] font-mono animate-fade-in font-medium">
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
                  className="bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors border border-[#334155] cursor-pointer flex items-center gap-1"
                >
                  💾 Save
                </button>
              </div>
            </div>
          )}

          {/* Code Textarea & Gutter */}
          {activeTab ? (
            <div className="flex-1 flex overflow-hidden relative">
              {/* Line Numbers Gutter */}
              <div className="w-[48px] bg-[#07080a] border-r border-[#161922] text-right py-3 px-2 text-[12px] font-mono text-[#475569] select-none overflow-hidden leading-[1.6]">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} className={cursorPos.line === i + 1 ? 'text-[#60a5fa] font-bold' : ''}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code Textarea */}
              <textarea
                ref={textareaRef}
                value={editorContent}
                onChange={handleEditorChange}
                onKeyDown={handleKeyDown}
                onSelect={handleEditorSelection}
                onClick={handleEditorSelection}
                onKeyUp={handleEditorSelection}
                spellCheck={false}
                className="flex-1 bg-[#090b0e] text-[#cbd5e1] p-3 text-[12.5px] font-mono leading-[1.6] resize-none focus:outline-none custom-scrollbar select-text overflow-y-auto whitespace-pre tab-4"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#090b0e]">
              <div className="w-14 h-14 rounded-2xl bg-[#12151c] border border-[#1e232e] flex items-center justify-center text-[28px] mb-4 shadow-xl">
                ⚡
              </div>
              <h3 className="text-[16px] font-semibold text-[#e2e5ea] mb-1">
                Enterprise Copilot Agent Workspace
              </h3>
              <p className="text-[12.5px] font-mono text-[#64748b] max-w-[360px] leading-relaxed mb-6">
                Open any file from the workspace explorer to edit code, or interact with the Copilot Agent on the right.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenFile('README.md')}
                  className="bg-[#12151c] hover:bg-[#1a1e26] text-[#60a5fa] border border-[#1e232e] px-3.5 py-1.5 rounded-lg text-[11.5px] font-mono transition-all cursor-pointer"
                >
                  📄 Open README.md
                </button>
                <button
                  onClick={() => handleOpenFile('services/orchestrator_service/app/main.py')}
                  className="bg-[#12151c] hover:bg-[#1a1e26] text-[#cbd5e1] border border-[#1e232e] px-3.5 py-1.5 rounded-lg text-[11.5px] font-mono transition-all cursor-pointer"
                >
                  ⚡ Open main.py
                </button>
              </div>
            </div>
          )}

          {/* ── Collapsible Bottom Panel (Terminal / Logs) ─────────── */}
          {showBottomPanel && (
            <div className="h-[140px] bg-[#07080a] border-t border-[#161922] flex flex-col flex-shrink-0">
              <div className="flex justify-between items-center px-3 py-1 bg-[#090b0e] border-b border-[#161922] text-[11px] font-mono">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setBottomTab('output')}
                    className={`cursor-pointer transition-colors ${bottomTab === 'output' ? 'text-[#60a5fa] font-bold border-b border-[#3b82f6]' : 'text-[#64748b]'}`}
                  >
                    OUTPUT
                  </button>
                  <button
                    onClick={() => setBottomTab('terminal')}
                    className={`cursor-pointer transition-colors ${bottomTab === 'terminal' ? 'text-[#60a5fa] font-bold border-b border-[#3b82f6]' : 'text-[#64748b]'}`}
                  >
                    TERMINAL
                  </button>
                  <button
                    onClick={() => setBottomTab('diagnostics')}
                    className={`cursor-pointer transition-colors ${bottomTab === 'diagnostics' ? 'text-[#60a5fa] font-bold border-b border-[#3b82f6]' : 'text-[#64748b]'}`}
                  >
                    DIAGNOSTICS
                  </button>
                </div>
                <button
                  onClick={() => setShowBottomPanel(false)}
                  className="text-[#64748b] hover:text-[#cbd5e1] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[11.5px] leading-[1.6] custom-scrollbar text-[#94a3b8]">
                {bottomTab === 'output' && (
                  <div>
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="text-[#94a3b8]">
                        <span className="text-[#475569] select-none">[{new Date().toLocaleTimeString()}]</span> {log}
                      </div>
                    ))}
                  </div>
                )}
                {bottomTab === 'terminal' && (
                  <div className="text-[#38bdf8]">
                    <span>$ Enterprise Copilot Agent v1.0.0 --mesh=active</span><br />
                    <span className="text-[#10b981]">✓ Ingestion Service (8002): Online</span><br />
                    <span className="text-[#10b981]">✓ RAG Hybrid Engine (8001): Online (20 indexed chunks)</span><br />
                    <span className="text-[#10b981]">✓ Orchestrator Gateway (8000): Ready</span><br />
                    <span className="text-[#10b981]">✓ Local GPU Ollama (11434): gemma3:4b Active</span>
                  </div>
                )}
                {bottomTab === 'diagnostics' && (
                  <div className="text-[#cbd5e1]">
                    <span>Active File: {activeTabPath || 'None'}</span><br />
                    <span>Line Count: {lineCount} | Characters: {editorContent.length}</span><br />
                    <span>Unsaved Buffer: {isDirty ? 'Yes' : 'No'}</span><br />
                    <span>Ollama Model: {selectedModel} (GPU 100% VRAM)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Copilot Agent Chat Panel (Right, 380px) ──────────── */}
        <div className="w-[380px] bg-[#0c0e12] border-l border-[#161922] flex flex-col flex-shrink-0 overflow-hidden">
          
          {/* Agent Header */}
          <div className="px-3.5 py-2.5 border-b border-[#161922] bg-[#090b0e] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
              <span className="text-[12px] font-mono font-bold text-[#e2e5ea] tracking-tight">
                Copilot Agent
              </span>
              <span className="text-[10px] font-mono text-[#60a5fa] px-1.5 py-0.2 bg-[#3b82f6]/10 rounded border border-[#3b82f6]/20">
                {selectedModel}
              </span>
            </div>
            <button
              onClick={() => setAgentMessages([{ role: 'assistant', content: "Chat cleared. Ready for your next request." }])}
              title="Clear Chat History"
              className="text-[#64748b] hover:text-[#cbd5e1] text-[11px] font-mono p-1 rounded hover:bg-[#161922] cursor-pointer"
            >
              🗑️ Clear
            </button>
          </div>

          {/* Active File Context Chip */}
          <div className="px-3 py-1.5 bg-[#08090a] border-b border-[#161922]/60 flex items-center justify-between text-[11px] font-mono">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#8b949e]">
              <input
                type="checkbox"
                checked={includeFileContext}
                onChange={(e) => setIncludeFileContext(e.target.checked)}
                className="rounded border-[#1e232e] bg-[#12151c] text-[#3b82f6] focus:ring-0 cursor-pointer"
              />
              <span>Include active file context</span>
            </label>
            {activeTab && includeFileContext && (
              <span className="text-[#60a5fa] truncate max-w-[130px] font-medium" title={activeTab.path}>
                📄 {activeTab.name}
              </span>
            )}
          </div>

          {/* Chat Messages Stream */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
            {agentMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-[12.5px] leading-relaxed transition-all ${
                  msg.role === 'user'
                    ? 'bg-[#12151c] border-[#1e2430] text-[#e2e5ea] ml-4'
                    : 'bg-[#08090a] border-[#161922] text-[#cbd5e1] mr-1 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5 text-[10.5px] font-mono font-bold">
                  {msg.role === 'user' ? (
                    <span className="text-[#60a5fa]">👤 Developer</span>
                  ) : (
                    <span className="text-[#10b981] flex items-center gap-1">
                      🤖 Copilot Agent
                    </span>
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
                <span className="animate-spin">⚡</span> Copilot Agent synthesizing solution...
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {activeTab && (
            <div className="p-2 border-t border-[#161922]/60 bg-[#08090a] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => handleSendAgentMessage(`Explain the architecture and key functions of ${activeTab.path}`)}
                className="whitespace-nowrap px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#12151c] hover:bg-[#1a1e26] text-[#8b949e] hover:text-[#60a5fa] border border-[#1a1e26] transition-colors cursor-pointer"
              >
                🔍 Explain file
              </button>
              <button
                onClick={() => handleSendAgentMessage(`Review ${activeTab.path} for bugs, edge cases, and performance optimizations.`)}
                className="whitespace-nowrap px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#12151c] hover:bg-[#1a1e26] text-[#8b949e] hover:text-[#60a5fa] border border-[#1a1e26] transition-colors cursor-pointer"
              >
                ⚡ Optimize
              </button>
              <button
                onClick={() => handleSendAgentMessage(`Write comprehensive unit tests for ${activeTab.path}.`)}
                className="whitespace-nowrap px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#12151c] hover:bg-[#1a1e26] text-[#8b949e] hover:text-[#60a5fa] border border-[#1a1e26] transition-colors cursor-pointer"
              >
                🧪 Unit Tests
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
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
                placeholder="Ask Copilot Agent (Enter to send, Shift+Enter for newline)..."
                rows={2}
                className="w-full bg-transparent text-[#cbd5e1] p-2.5 text-[12px] font-mono focus:outline-none resize-none custom-scrollbar placeholder-[#475569]"
              />
              <div className="flex justify-between items-center px-2.5 pb-2">
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
      <div className="h-[24px] bg-[#060708] border-t border-[#161922] px-3 flex justify-between items-center text-[11px] font-mono text-[#64748b] flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[#60a5fa] flex items-center gap-1 font-medium">
            ⎇ main
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
            className="hover:text-[#cbd5e1] cursor-pointer"
          >
            {showBottomPanel ? '▾ Panel' : '▸ Panel'}
          </button>
          <span className="text-[#10b981] flex items-center gap-1">
            ● Copilot: {selectedModel} (GPU)
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Application Component ────────────────────────────── */
export default function Home() {
  // Top-level Mode Switcher: 'api_copilot' | 'copilot_agent'
  const [appMode, setAppMode] = useState<'api_copilot' | 'copilot_agent'>('api_copilot');

  // Shared Global State
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemma3:4b");
  const [dbData, setDbData] = useState<{ fixed_chunks: string[], semantic_chunks: string[] }>({ fixed_chunks: [], semantic_chunks: [] });
  
  // API Copilot Mode State
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('');
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'terminal' | 'search' | 'database'>('terminal');
  const [searchData, setSearchData] = useState<{ bm25: any[]; dense: any[]; cross_encoder: any[] } | null>(null);
  const [highlightStrategy, setHighlightStrategy] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadChunks, setUploadChunks] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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
  }, [API_BASE]);

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
    setActiveTab(stage.targetTab as 'terminal' | 'search' | 'database');
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

  return (
    <div className="min-h-screen bg-[#08090a] text-[#c8ccd0] font-sans antialiased selection:bg-[#2563eb]/30 selection:text-white">
      
      {/* ── Top App Header & Mode Switcher ────────────────────────── */}
      <header className="border-b border-[#161922] bg-[#07080a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-[58px] flex items-center justify-between">
          
          {/* Logo & Product Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#12151c] border border-[#1e232e] flex items-center justify-center text-[#60a5fa] text-[15px] font-bold shadow-sm">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#e2e5ea] tracking-tight">
                  Enterprise API Copilot
                </span>
                <span className="text-[9.5px] font-mono font-medium px-1.5 py-0.2 bg-[#12151c] border border-[#1e232e] text-[#60a5fa] rounded">
                  v2.0
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-[#64748b]">
                Multi-Service RAG & Pair Programming Agent
              </p>
            </div>
          </div>

          {/* ── Center: Mode Switcher (API Copilot vs Copilot Agent IDE) ── */}
          <div className="flex items-center p-1 bg-[#0c0e12] border border-[#1a1e26] rounded-xl shadow-inner">
            <button
              onClick={() => setAppMode('api_copilot')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-mono font-semibold transition-all cursor-pointer ${
                appMode === 'api_copilot'
                  ? 'bg-[#1e293b] text-[#60a5fa] border border-[#3b82f6]/30 shadow-md'
                  : 'text-[#64748b] hover:text-[#cbd5e1]'
              }`}
            >
              <span>⚡</span>
              <span>API Copilot (RAG)</span>
            </button>
            <button
              onClick={() => setAppMode('copilot_agent')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-mono font-semibold transition-all cursor-pointer ${
                appMode === 'copilot_agent'
                  ? 'bg-[#1e293b] text-[#60a5fa] border border-[#3b82f6]/30 shadow-md'
                  : 'text-[#64748b] hover:text-[#cbd5e1]'
              }`}
            >
              <span>🧑‍💻</span>
              <span>Copilot Agent (IDE)</span>
            </button>
          </div>

          {/* Header Actions (Model Selector & Status) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0c0e12] border border-[#1a1e26] rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-mono text-[#64748b]">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-[11.5px] font-mono text-[#60a5fa] focus:outline-none cursor-pointer font-medium"
              >
                {models.length > 0 ? (
                  models.map(m => <option key={m} value={m} className="bg-[#0c0e12]">{m}</option>)
                ) : (
                  <option value="gemma3:4b" className="bg-[#0c0e12]">gemma3:4b</option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#10b981]/10 border border-[#10b981]/25 rounded-lg text-[11px] font-mono text-[#10b981]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span>Mesh Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── VIEWPORT CONTENT SWITCHER ─────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto p-5">
        
        {/* MODE A: VS Code-Style Copilot Agent IDE Mode */}
        {appMode === 'copilot_agent' && (
          <VSCodeAgentIDE
            apiBase={API_BASE}
            models={models}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        )}

        {/* MODE B: Enterprise API Copilot RAG Explorer Mode */}
        {appMode === 'api_copilot' && (
          <div className="space-y-5 animate-fade-in">
            {/* Interactive RAG Pipeline Visualization */}
            <RagPipeline 
              currentStage={pipelineStage} 
              onNavigateStage={handleNavigateStage} 
            />

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Query Input & Document Actions (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className={`bg-[#0c0e12] border rounded-xl p-5 shadow-xl transition-all duration-300 ${
                  inputFocused ? 'border-[#3b82f6]/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-[#161922]'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-mono text-[#64748b] uppercase tracking-wider font-semibold">
                      API Query Input
                    </span>
                    <span className="text-[10px] font-mono text-[#475569]">
                      Enter endpoint intent
                    </span>
                  </div>

                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="e.g. How do I create a customer charge in Stripe with idempotency key?"
                    rows={3}
                    className="w-full bg-[#08090a] text-[#e2e5ea] border border-[#1a1e26] rounded-lg p-3.5 text-[13px] font-mono placeholder-[#475569] focus:outline-none focus:border-[#3b82f6]/50 resize-none transition-all leading-relaxed"
                  />

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleUpload}
                        accept=".yaml,.yml,.json,.md,.txt"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1e26] bg-[#08090a] hover:bg-[#12151c] text-[#8b949e] hover:text-[#e2e5ea] text-[11.5px] font-mono transition-all cursor-pointer"
                      >
                        <span>📁</span>
                        <span>{uploading ? 'Parsing...' : 'Upload Spec'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleProcess}
                      disabled={loading || !query.trim()}
                      className={`px-5 py-2 rounded-lg font-mono text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                        loading || !query.trim()
                          ? 'bg-[#12151c] text-[#475569] border border-[#1a1e26] cursor-not-allowed'
                          : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-[#2563eb]/20'
                      }`}
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin">⌛</span>
                          <span>Retrieving...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Execute Hybrid RAG</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Query Templates */}
                <div className="bg-[#0c0e12] border border-[#161922] rounded-xl p-4">
                  <div className="text-[11px] font-mono text-[#64748b] uppercase tracking-wider mb-2.5 font-semibold">
                    Suggested Ingestion Queries
                  </div>
                  <div className="space-y-1.5">
                    {[
                      "How do I create a card charge in Enterprise Payments API?",
                      "What is the Twilio SMS endpoint and required authentication?",
                      "How do I post a message to a Slack channel using chat.postMessage?",
                      "Show me SendGrid v3 mail send endpoint and parameters"
                    ].map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuery(sample)}
                        className="w-full text-left p-2 rounded-lg bg-[#08090a] hover:bg-[#12151c] border border-[#1a1e26] hover:border-[#282e3a] text-[11.5px] font-mono text-[#8b949e] hover:text-[#60a5fa] transition-all truncate cursor-pointer"
                      >
                        ▸ {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Terminal & Search Diagnostics (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#0c0e12] border border-[#161922] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[560px]">
                  
                  {/* Tab Navigation */}
                  <div className="flex justify-between items-center px-4 py-2 bg-[#090b0e] border-b border-[#161922]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('terminal')}
                        className={`px-3 py-1 rounded-lg text-[11.5px] font-mono font-medium transition-all cursor-pointer ${
                          activeTab === 'terminal'
                            ? 'bg-[#1e293b] text-[#60a5fa] border border-[#3b82f6]/30'
                            : 'text-[#64748b] hover:text-[#cbd5e1]'
                        }`}
                      >
                        ⚡ Live Code Synthesis
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('search')}
                        className={`px-3 py-1 rounded-lg text-[11.5px] font-mono font-medium transition-all cursor-pointer ${
                          activeTab === 'search'
                            ? 'bg-[#1e293b] text-[#60a5fa] border border-[#3b82f6]/30'
                            : 'text-[#64748b] hover:text-[#cbd5e1]'
                        }`}
                      >
                        🔍 Search Diagnostics {searchData && '●'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('database')}
                        className={`px-3 py-1 rounded-lg text-[11.5px] font-mono font-medium transition-all cursor-pointer ${
                          activeTab === 'database'
                            ? 'bg-[#1e293b] text-[#60a5fa] border border-[#3b82f6]/30'
                            : 'text-[#64748b] hover:text-[#cbd5e1]'
                        }`}
                      >
                        🗄️ Database Inspector ({dbData.fixed_chunks?.length || 0})
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-[#475569]">
                      Streaming Gateway
                    </span>
                  </div>

                  {/* Tab Content Container */}
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#08090a]">
                    
                    {/* 1. Terminal Generation Tab */}
                    {activeTab === 'terminal' && (
                      <div ref={outputRef} className="h-full overflow-y-auto custom-scrollbar">
                        {generation ? (
                          <FormattedMarkdown content={generation} />
                        ) : loading ? (
                          <div className="flex flex-col items-center justify-center h-full text-[#64748b] font-mono text-[12px] space-y-2">
                            <span className="animate-spin text-[20px] text-[#3b82f6]">⚡</span>
                            <span>Executing Dual-Stream Hybrid Search & Re-Ranking...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-[#475569] font-mono text-[12px] space-y-2">
                            <span className="text-[24px]">💬</span>
                            <span>Awaiting query execution. Enter a prompt and click execute.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Search Diagnostics Tab */}
                    {activeTab === 'search' && (
                      <div className="space-y-4">
                        {searchData ? (
                          <>
                            {/* BM25 Lexical Results */}
                            <div className={`border rounded-xl p-3.5 transition-all ${
                              highlightStrategy === 'bm25' ? 'border-[#3b82f6] bg-[#3b82f6]/5 shadow-lg' : 'border-[#1a1e26] bg-[#0c0e12]'
                            }`}>
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="text-[11.5px] font-mono font-bold text-[#60a5fa]">
                                  Stage 1: Okapi BM25 Lexical Candidates
                                </span>
                                <span className="text-[10px] font-mono text-[#64748b]">
                                  Exact keyword matches
                                </span>
                              </div>
                              <div className="space-y-2">
                                {searchData.bm25.map((item, i) => (
                                  <div key={i} className="p-2.5 rounded bg-[#08090a] border border-[#161922] text-[11.5px] font-mono text-[#94a3b8]">
                                    <div className="flex justify-between text-[#64748b] text-[10px] mb-1 font-bold">
                                      <span>Rank #{item.rank}</span>
                                      <span className="text-[#38bdf8]">{item.score}</span>
                                    </div>
                                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#cbd5e1]">{item.text}</pre>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Dense Vector Results */}
                            <div className={`border rounded-xl p-3.5 transition-all ${
                              highlightStrategy === 'dense' ? 'border-[#3b82f6] bg-[#3b82f6]/5 shadow-lg' : 'border-[#1a1e26] bg-[#0c0e12]'
                            }`}>
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="text-[11.5px] font-mono font-bold text-[#a78bfa]">
                                  Stage 2: BGE-small Dense Vector Proximity (ChromaDB)
                                </span>
                                <span className="text-[10px] font-mono text-[#64748b]">
                                  384-dimensional cosine proximity
                                </span>
                              </div>
                              <div className="space-y-2">
                                {searchData.dense.map((item, i) => (
                                  <div key={i} className="p-2.5 rounded bg-[#08090a] border border-[#161922] text-[11.5px] font-mono text-[#94a3b8]">
                                    <div className="flex justify-between text-[#64748b] text-[10px] mb-1 font-bold">
                                      <span>Rank #{item.rank}</span>
                                      <span className="text-[#a78bfa]">{item.score}</span>
                                    </div>
                                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#cbd5e1]">{item.text}</pre>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* MS-Marco Cross-Encoder Results */}
                            <div className={`border rounded-xl p-3.5 transition-all ${
                              highlightStrategy === 'cross_encoder' ? 'border-[#10b981] bg-[#10b981]/5 shadow-lg' : 'border-[#1a1e26] bg-[#0c0e12]'
                            }`}>
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="text-[11.5px] font-mono font-bold text-[#34d399]">
                                  Stage 3: MS-Marco Cross-Encoder Deep Re-Ranking
                                </span>
                                <span className="text-[10px] font-mono text-[#10b981] font-bold">
                                  Top Context Injected into LLM
                                </span>
                              </div>
                              <div className="space-y-2">
                                {searchData.cross_encoder.map((item, i) => (
                                  <div key={i} className="p-2.5 rounded bg-[#08090a] border border-[#10b981]/20 text-[11.5px] font-mono text-[#94a3b8]">
                                    <div className="flex justify-between text-[#64748b] text-[10px] mb-1 font-bold">
                                      <span className="text-[#34d399]">Top Rank #{item.rank}</span>
                                      <span className="text-[#34d399] font-bold">{item.score}</span>
                                    </div>
                                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#cbd5e1]">{item.text}</pre>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-[#475569] font-mono text-[12px] space-y-2 py-16">
                            <span>🔍 No search executed yet. Run a query to view stage diagnostics.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Database Inspector Tab */}
                    {activeTab === 'database' && (
                      <div className="space-y-3">
                        <div className="text-[11px] font-mono text-[#64748b] uppercase tracking-wider mb-2 font-semibold">
                          Total Chunks Ingested: {dbData.fixed_chunks?.length || 0}
                        </div>
                        <div className="space-y-2">
                          {(dbData.fixed_chunks || []).map((chunk, i) => (
                            <div key={i} className="p-3 rounded-lg bg-[#0c0e12] border border-[#1a1e26] text-[11.5px] font-mono text-[#94a3b8]">
                              <div className="text-[10px] text-[#60a5fa] font-bold mb-1">
                                Chunk #{i + 1}
                              </div>
                              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#cbd5e1]">{chunk}</pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Document Upload Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0e12] border border-[#1a1e26] rounded-xl max-w-[650px] w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1a1e26] pb-3">
              <h3 className="text-[14px] font-mono font-bold text-[#e2e5ea]">
                API Specification Ingestion Summary
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748b] hover:text-[#cbd5e1] text-[14px] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[12px] font-mono text-[#8b949e]">
              Parsed and indexed {uploadChunks.length} segments into ChromaDB & BM25 lexical index.
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar p-2 bg-[#08090a] rounded-lg border border-[#161922]">
              {uploadChunks.map((chunk, i) => (
                <div key={i} className="p-2 rounded bg-[#0c0e12] border border-[#1a1e26] text-[10.5px] font-mono text-[#cbd5e1] whitespace-pre-wrap">
                  {chunk}
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-1.5 rounded-lg text-[12px] font-mono font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
