"use client";
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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

/* -- File Icon Helper ----------------------------------------- */
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
      setTimeout(() => setApplied(false), 2000);
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

/* -- VS Code Style Copilot Agent IDE Workspace --------------- */
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
      content: "👋 **Hello! I am your Copilot Agent.**\n\nI have full context of your workspace, active editor files, and integrated Hybrid RAG API documentation. Click any file on the left to inspect and code, or ask me any programming question."
    }
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [includeFileContext, setIncludeFileContext] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load Projects and Workspace Tree
  const fetchProjectsAndTree = async () => {
    setLoadingTree(true);
    try {
      const projRes = await fetch(`${apiBase}/api/workspace/projects`);
      if (projRes.ok) {
        const projData = await projRes.json();
        setCurrentProjectName(projData.current_project || 'AIDeV');
        setCurrentProjectPath(projData.project_path || 'D:/AIDeV');
        setRecentProjects(projData.recent_projects || ['D:/AIDeV']);
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

  // Open Any Custom Folder / Project
  const handleOpenProject = async (targetPath: string) => {
    if (!targetPath.trim()) return;
    try {
      const res = await fetch(`${apiBase}/api/workspace/open-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentProjectName(data.current_project);
        setCurrentProjectPath(data.project_path);
        setRecentProjects(data.recent_projects || []);
        setShowOpenProjectModal(false);
        setOpenTabs([]);
        setActiveTabPath('');
        setEditorContent('');
        setTerminalLogs(prev => [...prev, `[Project Switch] Opened project folder: ${data.project_path}`]);
        // Refresh Tree
        const treeRes = await fetch(`${apiBase}/api/workspace/tree`);
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          setWorkspaceTree(treeData.tree || []);
        }
      } else {
        const err = await res.json();
        alert(`Could not open folder: ${err.detail || 'Directory not found'}`);
      }
    } catch (e) {
      alert("Failed to connect to workspace service.");
    }
  };

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
        setTerminalLogs(prev => [...prev, `[File Save] Successfully saved ${activeTabPath} (${editorContent.length} bytes)`]);
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
    setTerminalLogs(prev => [...prev, `[Copilot Apply] Applied AI code block to ${activeTabPath || 'active editor'}`]);
  };

  // Send Copilot Agent Message (Multi-turn SSE Stream with Hybrid RAG)
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
    <div className="flex flex-col h-full w-full bg-[#08090a] text-[#c9d1d9] overflow-hidden select-none border-0">
      
      {/* Main Workspace Row */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── 1. Activity Bar (Left, 46px) ────────────────────────── */}
        <div className="w-[46px] bg-[#060708] border-r border-[#161922] flex flex-col items-center py-2.5 justify-between z-10 flex-shrink-0">
          <div className="flex flex-col items-center gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-1 shadow-sm" title="AionLabs Workspace">
              <img src="/aionlabs.svg" alt="AionLabs" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => setActiveActivity('explorer')}
              title="File Explorer (Ctrl+Shift+E)"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[15px] transition-all cursor-pointer ${
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
        <div className="w-[260px] bg-[#0c0e12] border-r border-[#161922] flex flex-col flex-shrink-0 overflow-hidden">
          
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
                title="Open Any Folder / Project..."
                className="text-[#60a5fa] hover:text-[#93c5fd] text-[11px] font-mono px-2 py-0.5 rounded bg-[#12151c] hover:bg-[#1a1e26] border border-[#1e232e] cursor-pointer flex items-center gap-1"
              >
                <span>📂</span>
                <span>Open</span>
              </button>
              <button
                onClick={fetchProjectsAndTree}
                title="Refresh Workspace"
                className="text-[#64748b] hover:text-[#cbd5e1] text-[12px] p-1 rounded hover:bg-[#161922] cursor-pointer"
              >
                🔄
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
                No files found in workspace.
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
              <div className="w-[48px] bg-[#07080a] border-r border-[#161922] text-right py-3 px-2 text-[12px] font-mono text-[#475569] select-none overflow-hidden leading-[1.6]">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} className={cursorPos.line === i + 1 ? 'text-[#60a5fa] font-bold' : ''}>
                    {i + 1}
                  </div>
                ))}
              </div>

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
              <div className="w-16 h-16 rounded-2xl bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-3 mb-4 shadow-xl">
                <img src="/aionlabs.svg" alt="AionLabs" className="w-full h-full object-contain" />
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
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg text-[12px] font-mono transition-all cursor-pointer font-medium flex items-center gap-1.5"
                >
                  <span>📂</span>
                  <span>Open Any Folder...</span>
                </button>
                <button
                  onClick={() => handleOpenFile('README.md')}
                  className="bg-[#12151c] hover:bg-[#1a1e26] text-[#cbd5e1] border border-[#1e232e] px-4 py-2 rounded-lg text-[12px] font-mono transition-all cursor-pointer"
                >
                  📄 Open README.md
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Bottom Panel */}
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
                    <span>$ Enterprise Copilot Agent v1.0.0 --active-project={currentProjectName}</span><br />
                    <span className="text-[#10b981]">✓ Ingestion Service (8002): Online</span><br />
                    <span className="text-[#10b981]">✓ RAG Hybrid Engine (8001): Online (20 indexed chunks)</span><br />
                    <span className="text-[#10b981]">✓ Orchestrator Gateway (8000): Ready</span><br />
                    <span className="text-[#10b981]">✓ Local GPU Ollama (11434): {selectedModel} Active</span>
                  </div>
                )}
                {bottomTab === 'diagnostics' && (
                  <div className="text-[#cbd5e1]">
                    <span>Project: {currentProjectPath}</span><br />
                    <span>Active File: {activeTabPath || 'None'}</span><br />
                    <span>Line Count: {lineCount} | Characters: {editorContent.length}</span><br />
                    <span>Unsaved Buffer: {isDirty ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Copilot Agent Chat Panel (Right, 380px) ──────────── */}
        <div className="w-[380px] bg-[#0c0e12] border-l border-[#161922] flex flex-col flex-shrink-0 overflow-hidden">
          
          <div className="px-3.5 py-2.5 border-b border-[#161922] bg-[#090b0e] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-0.5 shadow-sm">
                <img src="/aionlabs.svg" alt="AionLabs" className="w-full h-full object-contain" />
              </div>
              <span className="text-[12px] font-mono font-bold text-[#e2e5ea] tracking-tight">
                Copilot Agent
              </span>
              <span className="text-[10px] font-mono text-[#60a5fa] px-1.5 py-0.2 bg-[#3b82f6]/10 rounded border border-[#3b82f6]/20">
                {selectedModel}
              </span>
            </div>
            <button
              onClick={() => setAgentMessages([{ role: 'assistant', content: "Chat history cleared. How can I help you?" }])}
              title="Clear Chat History"
              className="text-[#64748b] hover:text-[#cbd5e1] text-[11px] font-mono p-1 rounded hover:bg-[#161922] cursor-pointer"
            >
              🗑️ Clear
            </button>
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
              <span className="text-[#60a5fa] truncate max-w-[130px] font-medium" title={activeTab.path}>
                📄 {activeTab.name}
              </span>
            )}
          </div>

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

          {activeTab && (
            <div className="p-2 border-t border-[#161922]/60 bg-[#08090a] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => handleSendAgentMessage(`Explain what ${activeTab.path} does and summarize its core logic.`)}
                className="whitespace-nowrap px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#12151c] hover:bg-[#1a1e26] text-[#8b949e] hover:text-[#60a5fa] border border-[#1a1e26] transition-colors cursor-pointer"
              >
                🔍 Explain file
              </button>
              <button
                onClick={() => handleSendAgentMessage(`Review ${activeTab.path} for performance optimizations and clean code.`)}
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
            ⎇ main ({currentProjectName})
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

      {/* ── Open Project / Folder Dialog Modal ───────────────────── */}
      {showOpenProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0e12] border border-[#1a1e26] rounded-xl max-w-[550px] w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1a1e26] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-0.5 shadow-sm">
                  <img src="/aionlabs.svg" alt="AionLabs" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-[14px] font-mono font-bold text-[#e2e5ea]">
                  Open Folder / Project Workspace
                </h3>
              </div>
              <button
                onClick={() => setShowOpenProjectModal(false)}
                className="text-[#64748b] hover:text-[#cbd5e1] text-[14px] p-1 cursor-pointer"
              >
                ✕
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
                  placeholder="e.g. D:/AIDeV or C:/Users/gaura/projects/my-app"
                  className="flex-1 bg-[#08090a] border border-[#1a1e26] rounded-lg px-3 py-2 text-[12px] font-mono text-[#e2e5ea] focus:outline-none focus:border-[#3b82f6]"
                />
                <button
                  onClick={() => handleOpenProject(projectPathInput)}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg text-[12px] font-mono font-semibold transition-all cursor-pointer"
                >
                  Open
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
                      onClick={() => handleOpenProject(p)}
                      className="w-full text-left p-2 rounded bg-[#08090a] hover:bg-[#12151c] border border-[#1a1e26] hover:border-[#3b82f6]/40 text-[11.5px] font-mono text-[#8b949e] hover:text-[#60a5fa] transition-colors truncate flex items-center gap-2 cursor-pointer"
                    >
                      <span>📁</span>
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
      <header className="border-b border-[#161922] bg-[#07080a]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-[56px] flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#12151c] border border-[#1e232e] flex items-center justify-center p-1.5 shadow-sm">
              <img src="/aionlabs.svg" alt="AionLabs" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#e2e5ea] tracking-tight">
                  AionLabs API Copilot
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
                    ✕
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
                      <img src="/aionlabs.svg" alt="AionLabs" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-[28px] font-semibold text-[#e2e5ea] tracking-[-0.02em] leading-tight">
                      API Copilot
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
                        <span className="text-[11px] font-mono text-[#333a48] ml-2">api-copilot ~ output</span>
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
              <span>v0.9.0-hybrid-rag</span>
              <span>Enterprise API Copilot • Multi-Strategy Diagnostic Portal</span>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
