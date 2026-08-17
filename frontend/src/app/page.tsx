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

/* ── Code Block with Copy Button ───────────────────────────── */
function CodeBlock({ children, className }: { children: any; className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'code';
  const text = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 bg-[#0a0c10] border border-[#1a1e26] rounded-lg overflow-hidden group shadow-md">
      <div className="flex justify-between items-center px-4 py-2 bg-[#0e1015] border-b border-[#1a1e26] text-[11px] font-mono text-[#4a5060]">
        <span className="uppercase tracking-wider text-[#6b7280] font-semibold">{lang}</span>
        <button
          onClick={handleCopy}
          className="text-[#6b7280] hover:text-[#c8ccd0] px-2 py-0.5 rounded transition-colors text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? (
            <span className="text-[#10b981] flex items-center gap-1">✓ Copied</span>
          ) : (
            <span className="flex items-center gap-1">⎘ Copy</span>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="text-[12.5px] font-mono leading-[1.7] text-[#93c5fd]">
          <code>{text}</code>
        </pre>
      </div>
    </div>
  );
}

/* ── Rich Markdown Renderer ────────────────────────────────── */
function FormattedMarkdown({ content }: { content: string }) {
  return (
    <div className="markdown-body space-y-3 font-sans leading-relaxed text-[#a0a6b5] text-[13.5px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
          p: ({ children }) => (
            <p className="leading-[1.8] my-2 text-[#9da5b4]">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="text-[#e2e5ea] font-semibold">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-[#cbd5e1] italic">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 space-y-1.5 my-3 text-[#9da5b4]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 space-y-1.5 my-3 text-[#9da5b4] font-mono text-[13px]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.7]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#3b82f6]/50 pl-4 py-1 my-3 bg-[#3b82f6]/5 rounded-r text-[#94a3b8] italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#60a5fa] hover:text-[#93c5fd] underline decoration-[#3b82f6]/40 underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline || !className) {
              return (
                <code className="bg-[#13161c] px-1.5 py-0.5 rounded border border-[#1a1e26] text-[#38bdf8] text-[12px] font-mono font-medium">
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 border border-[#1a1e26] rounded-lg">
              <table className="w-full text-left border-collapse text-[12.5px] font-mono">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#0e1015] border-b border-[#1a1e26] text-[#6b7280]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#1a1e26] bg-[#08090a]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#0e1015]/60 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 font-semibold text-[#8b92a0]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-[#9da5b4]">
              {children}
            </td>
          ),
          hr: () => <hr className="border-[#1a1e26] my-6" />
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
    <div className="border border-[#1a1e26] bg-[#090b0e] rounded-xl p-5 mb-6 relative overflow-hidden transition-all duration-300">
      <div className="flex justify-between items-center mb-5">
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

      {/* Nodes row */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 custom-scrollbar">
        {PIPELINE_STAGES.map((s, i) => {
          const isActive = currentStage === s.id;
          const isDone = currentStage > s.id;
          const isHovered = hoveredNode === s.id;

          return (
            <React.Fragment key={s.id}>
              {/* Interactive Node Button */}
              <button
                type="button"
                onClick={() => onNavigateStage(s)}
                onMouseEnter={() => setHoveredNode(s.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`group flex-1 min-w-[130px] p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#3b82f6]/10 border-[#3b82f6]/40 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                    : isDone
                      ? 'bg-[#10b981]/5 border-[#10b981]/25 hover:border-[#10b981]/40'
                      : isHovered
                        ? 'bg-[#0e1015] border-[#282e3a] shadow-md'
                        : 'bg-[#08090a] border-[#1a1e26] hover:border-[#282e3a]'
                }`}
              >
                {/* Stage Badge & Status Indicator */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${
                    isActive ? 'text-[#60a5fa]' : isDone ? 'text-[#10b981]' : 'text-[#4a5060]'
                  }`}>
                    0{s.id + 1}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-[#3b82f6] animate-ping'
                      : isDone
                        ? 'bg-[#10b981]'
                        : 'bg-[#1a1e26] group-hover:bg-[#4a5060]'
                  }`} />
                </div>

                {/* Node Title */}
                <div className={`text-[12px] font-mono font-semibold truncate transition-colors ${
                  isActive ? 'text-[#e2e5ea]' : isDone ? 'text-[#cbd5e1]' : 'text-[#8b92a0] group-hover:text-[#e2e5ea]'
                }`}>
                  {s.label}
                </div>

                {/* Subtext */}
                <div className="text-[10px] font-mono text-[#4a5060] truncate mt-0.5">
                  {s.sub}
                </div>
              </button>

              {/* Connector */}
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="w-4 h-px relative flex-shrink-0">
                  <div className="absolute inset-0 bg-[#1a1e26]" />
                  <div 
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                      currentStage > s.id ? 'w-full bg-[#10b981]/40' : 'w-0 bg-[#3b82f6]/40'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Dynamic Hover/Active Info Bar */}
      <div className="mt-3 pt-3 border-t border-[#1a1e26]/60 flex items-start gap-2 text-[11px] font-mono text-[#6b7280]">
        <span className="text-[#3b82f6] font-bold">INFO:</span>
        <span className="text-[#8b92a0] leading-normal">
          {hoveredNode !== null 
            ? PIPELINE_STAGES[hoveredNode].description 
            : currentStage >= 0 && currentStage < PIPELINE_STAGES.length 
              ? PIPELINE_STAGES[currentStage].description 
              : "Click any strategy above to jump directly into its inspection panel."}
        </span>
      </div>
    </div>
  );
}

/* ── Main Application ──────────────────────────────────────── */
export default function Home() {
  const [activeTab, setActiveTab] = useState('terminal');
  const [query, setQuery] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [dbData, setDbData] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [generation, setGeneration] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(-1);
  const [highlightStrategy, setHighlightStrategy] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadChunks, setUploadChunks] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8003/api/models')
      .then(res => res.json())
      .then(data => {
        setModels(data.models || []);
        if (data.models && data.models.length > 0) setSelectedModel(data.models[0]);
      })
      .catch(err => console.error("Could not load models"));

    fetch('http://127.0.0.1:8003/api/database')
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
      const searchRes = await fetch('http://127.0.0.1:8003/api/search', {
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

      const genRes = await fetch('http://127.0.0.1:8003/api/generate', {
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
                if (data.done) {
                  break;
                }
                if (data.error) {
                  setGeneration(`\n\n> ⚠️ **Error:** ${data.error}`);
                  break;
                }
              } catch (e) {
                // skip malformed lines
              }
            }
          }
        }
      }

      setPipelineStage(-1);
    } catch (e) {
      console.error(e);
      setGeneration("❌ **Connection error:** Could not reach the backend server on `127.0.0.1:8003`.");
      setPipelineStage(-1);
    }
    setLoading(false);
  };

  const handleNavigateStage = (stage: typeof PIPELINE_STAGES[0]) => {
    setActiveTab(stage.targetTab);
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
      const res = await fetch('http://127.0.0.1:8003/api/upload', {
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
    <div className="min-h-screen bg-[#08090a] text-[#c8ccd0] p-6 md:p-10">
      
      {/* Upload Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in-slow"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-[#0e1015] border border-[#1a1e26] rounded-xl max-w-3xl w-full max-h-[75vh] flex flex-col animate-slide-up"
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
            <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar stagger-children">
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
        <header className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse-slow" />
                <span className="text-[10px] font-mono font-medium text-[#4a5060] tracking-[0.2em] uppercase">RAG Engine Live</span>
              </div>
              <h1 className="text-[28px] font-semibold text-[#e2e5ea] tracking-[-0.02em] leading-tight">
                API Copilot
              </h1>
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
                  className="bg-[#0e1015] border border-[#1a1e26] hover:border-[#282e3a] text-[#c8ccd0] py-2 px-4 rounded-lg text-sm font-mono outline-none focus:border-[#282e3a] transition-all duration-300 appearance-none cursor-pointer pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5060' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                >
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
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
        <div className={`mb-6 animate-fade-in transition-all duration-500 ${inputFocused ? 'scale-[1.003]' : ''}`}>
          <div className={`bg-[#0e1015] border rounded-xl p-1.5 pl-5 flex items-center transition-all duration-500 ${inputFocused ? 'border-[#282e3a] shadow-[0_0_30px_rgba(59,130,246,0.05)]' : 'border-[#1a1e26]'}`}>
            <span className="text-[#282e3a] mr-3 font-mono text-sm select-none">▸</span>
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleProcess()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="E.g. How to use Azure APIM API to create a new API with authentication..."
              className="flex-1 bg-transparent text-[14.5px] text-[#e2e5ea] placeholder-[#303848] outline-none w-full font-mono tracking-tight"
            />
            <button 
              onClick={handleProcess}
              disabled={loading || !query}
              className="bg-[#1a1e26] hover:bg-[#282e3a] text-[#c8ccd0] font-medium px-6 py-3 ml-2 rounded-lg transition-all duration-300 text-sm font-mono disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Executing
                </span>
              ) : 'Execute Query'}
            </button>
          </div>
        </div>

        {/* Workspace Container */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
          {/* Tab Navigation */}
          <div className="flex gap-0.5 mb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-[12px] font-mono font-medium tracking-wide rounded-t-lg transition-all duration-300 cursor-pointer relative ${
                  activeTab === tab.id 
                    ? 'text-[#c8ccd0] bg-[#0e1015] border-t border-l border-r border-[#1a1e26]' 
                    : 'text-[#4a5060] hover:text-[#6b7280] bg-transparent'
                }`}
              >
                <span className="mr-2 opacity-40">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Body */}
          <div className="bg-[#0e1015] rounded-b-xl rounded-tr-xl border border-[#1a1e26] min-h-[520px] transition-all duration-500">
            
            {/* Tab 1: Code Synthesis (Terminal + Markdown) */}
            {activeTab === 'terminal' && (
              <div className="p-6 animate-fade-in">
                <div className="bg-[#08090a] border border-[#1a1e26] rounded-lg min-h-[460px] relative overflow-hidden flex flex-col">
                  {/* Chrome header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1e26] bg-[#0a0c10]">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1a1e26]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1a1e26]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1a1e26]" />
                      </div>
                      <span className="text-[11px] font-mono text-[#4a5060] tracking-wider">
                        {loading ? `${selectedModel} — generating response` : 'synthesis.markdown'}
                      </span>
                    </div>

                    {loading && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#3b82f6] tracking-wider uppercase animate-pulse">Streaming</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" style={{ animationDelay: '0s' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Body */}
                  <div ref={outputRef} className="p-6 overflow-y-auto max-h-[600px] custom-scrollbar flex-1">
                    {generation ? (
                      <div className="animate-fade-in">
                        <FormattedMarkdown content={generation} />
                        {loading && (
                          <span className="inline-block w-[2px] h-[14px] bg-[#3b82f6] animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </div>
                    ) : loading ? (
                      <div className="flex flex-col items-center justify-center h-[350px] text-center space-y-4">
                        <div className="w-8 h-8 rounded-full border-2 border-[#1a1e26] border-t-[#3b82f6] animate-spin" />
                        <p className="text-[12px] font-mono text-[#6b7280]">
                          Retrieving documentation chunks & preparing stream...
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[350px]">
                        <div className="text-center">
                          <div className="text-[#1a1e26] text-3xl mb-3">▸</div>
                          <p className="text-[12px] font-mono text-[#4a5060] tracking-wider">Awaiting query input</p>
                          <p className="text-[10px] font-mono text-[#282e3a] mt-1">Output will render as formatted Markdown with interactive code blocks</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Search Diagnostics */}
            {activeTab === 'search' && (
              <div className="p-6 animate-fade-in">
                {!searchData ? (
                  <div className="flex flex-col items-center justify-center h-[420px] text-[#282e3a]">
                    <div className="w-12 h-12 border border-[#1a1e26] rounded-xl flex items-center justify-center mb-4">
                      <span className="text-lg opacity-30">◇</span>
                    </div>
                    <p className="font-mono text-xs text-[#4a5060]">Execute a query to inspect BM25, Dense Vector, and Cross-Encoder outputs</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
                    
                    {/* BM25 Column */}
                    <div className={`bg-[#08090a] rounded-lg flex flex-col overflow-hidden transition-all duration-500 border ${
                      highlightStrategy === 'bm25'
                        ? 'border-[#3b82f6] shadow-[0_0_25px_rgba(59,130,246,0.15)] ring-1 ring-[#3b82f6]/50'
                        : 'border-[#1a1e26] hover:border-[#282e3a]'
                    }`}>
                      <div className="border-b border-[#1a1e26] px-4 py-3.5 flex justify-between items-center bg-[#0e1015]/60">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-[#3b82f6] font-bold">01</span>
                            <h3 className="text-[12px] font-mono font-semibold text-[#c8ccd0] tracking-wide">BM25 (Lexical)</h3>
                          </div>
                          <p className="text-[10px] text-[#4a5060] mt-0.5 font-mono">Exact keyword frequency</p>
                        </div>
                        <span className="text-[9px] font-mono font-medium tracking-[0.15em] text-[#4a5060] bg-[#13161c] px-2 py-0.5 rounded border border-[#1a1e26]">TOP 5</span>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto h-[440px] space-y-2.5 custom-scrollbar">
                        {Array.isArray(searchData.bm25) ? searchData.bm25.map((item: any, i: number) => (
                          <div key={i} className="bg-[#0e1015] border border-[#1a1e26] rounded-md p-3.5 hover:border-[#282e3a] transition-colors duration-300">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[9px] font-mono font-bold text-[#6b7280] bg-[#08090a] px-1.5 py-0.5 rounded">#{item.rank}</span>
                              <span className="text-[10px] font-mono font-medium text-[#3b82f6]/80">{item.score}</span>
                            </div>
                            <pre className="text-[11.5px] text-[#6b7280] font-mono whitespace-pre-wrap leading-[1.6]">{item.text}</pre>
                          </div>
                        )) : <div className="text-[#4a5060] text-xs font-mono p-3">{typeof searchData.bm25 === 'string' ? searchData.bm25 : 'No results'}</div>}
                      </div>
                    </div>
                    
                    {/* Dense Vector Column */}
                    <div className={`bg-[#08090a] rounded-lg flex flex-col overflow-hidden transition-all duration-500 border ${
                      highlightStrategy === 'dense'
                        ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50'
                        : 'border-[#1a1e26] hover:border-[#282e3a]'
                    }`}>
                      <div className="border-b border-[#1a1e26] px-4 py-3.5 flex justify-between items-center bg-[#0e1015]/60">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-purple-400 font-bold">02</span>
                            <h3 className="text-[12px] font-mono font-semibold text-[#c8ccd0] tracking-wide">Dense Vector</h3>
                          </div>
                          <p className="text-[10px] text-[#4a5060] mt-0.5 font-mono">BGE-small semantic proximity</p>
                        </div>
                        <span className="text-[9px] font-mono font-medium tracking-[0.15em] text-[#4a5060] bg-[#13161c] px-2 py-0.5 rounded border border-[#1a1e26]">TOP 5</span>
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
              <div className="p-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Legacy Fixed Chunks */}
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
                  
                  {/* Intelligent Semantic Chunks */}
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
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center animate-fade-in text-[10px] font-mono text-[#282e3a]">
          <span>v0.9.0-hybrid-rag</span>
          <span>Enterprise API Copilot • Multi-Strategy Diagnostic Portal</span>
        </div>
      </div>
    </div>
  );
}
