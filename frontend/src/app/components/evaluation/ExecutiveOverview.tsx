"use client";
import React from 'react';
import { EVALUATION_DATA } from './evaluationData';

interface ExecutiveOverviewProps {
  onNavigateTab: (tabIndex: number) => void;
  onOpenJson: () => void;
}

export function ExecutiveOverview({ onNavigateTab, onOpenJson }: ExecutiveOverviewProps) {
  const gemma = EVALUATION_DATA.exercise_3.per_model_aggregates["gemma3:4b"];
  const codellama = EVALUATION_DATA.exercise_3.per_model_aggregates["codellama:7b"];
  const starcoder = EVALUATION_DATA.exercise_3.per_model_aggregates["starcoder2:3b"];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e131f] via-[#090b10] to-[#07080b] border border-[#1e2638] p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3b82f6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[#10b981]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-[#60a5fa] text-[11px] font-mono font-semibold tracking-wide">
                LAB 4 COMPREHENSIVE BENCHMARK
              </span>
              <span className="text-[11px] font-mono text-[#64748b]">
                • Run ID: {EVALUATION_DATA.run_id.slice(0, 8)}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-[#f1f5f9] tracking-tight font-sans">
              LLM Performance &amp; RAG Architecture Evaluation
            </h1>
            
            <p className="text-sm md:text-[14.5px] text-[#94a3b8] leading-relaxed">
              Standardized comparative evaluation of <span className="text-[#60a5fa] font-semibold">3 local open-weights LLMs</span> across a representative <span className="text-[#e2e5ea] font-semibold">26-question enterprise dataset</span>. Benchmarking factual correctness, retrieval fidelity, hallucination frequency, code test pass rates, token throughput, and system resource overhead under identical Hybrid RAG conditions.
            </p>
          </div>

          <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0">
            <button
              onClick={onOpenJson}
              className="px-4 py-2.5 rounded-xl bg-[#161c2b] hover:bg-[#1e273d] text-[#60a5fa] border border-[#2b3956] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-blue-900/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Inspect Raw JSON</span>
            </button>
            <button
              onClick={() => onNavigateTab(3)}
              className="px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <span>View All Benchmarks</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Global Key Figures Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-[#1a2336]/80 text-center">
          <div className="p-3 rounded-xl bg-[#090d14] border border-[#161d2c]">
            <div className="text-[10.5px] font-mono text-[#64748b] uppercase tracking-wider">Total Evaluated Runs</div>
            <div className="text-xl font-bold font-mono text-[#60a5fa] mt-1">78</div>
            <div className="text-[10px] text-[#475569] mt-0.5">3 models × 26 tasks</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090d14] border border-[#161d2c]">
            <div className="text-[10.5px] font-mono text-[#64748b] uppercase tracking-wider">Models Compared</div>
            <div className="text-xl font-bold font-mono text-[#38bdf8] mt-1">3</div>
            <div className="text-[10px] text-[#475569] mt-0.5">Gemma, CodeLlama, StarCoder</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090d14] border border-[#161d2c]">
            <div className="text-[10.5px] font-mono text-[#64748b] uppercase tracking-wider">Question Dataset</div>
            <div className="text-xl font-bold font-mono text-[#a78bfa] mt-1">26</div>
            <div className="text-[10px] text-[#475569] mt-0.5">5 functional categories</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090d14] border border-[#161d2c]">
            <div className="text-[10.5px] font-mono text-[#64748b] uppercase tracking-wider">Corpus Chunks</div>
            <div className="text-xl font-bold font-mono text-[#34d399] mt-1">103</div>
            <div className="text-[10px] text-[#475569] mt-0.5">Across 21 spec files</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090d14] border border-[#161d2c]">
            <div className="text-[10.5px] font-mono text-[#64748b] uppercase tracking-wider">Ground Truth Endpoints</div>
            <div className="text-xl font-bold font-mono text-[#fbbf24] mt-1">74</div>
            <div className="text-[10px] text-[#475569] mt-0.5">OpenAPI 3.0 Specs</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090d14] border border-[#161d2c]">
            <div className="text-[10.5px] font-mono text-[#64748b] uppercase tracking-wider">Code Pass Peak</div>
            <div className="text-xl font-bold font-mono text-[#10b981] mt-1">100.0%</div>
            <div className="text-[10px] text-[#475569] mt-0.5">CodeLlama 7B (Q24-Q26)</div>
          </div>
        </div>
      </div>

      {/* Model Leaderboard Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#e2e5ea] tracking-tight font-mono flex items-center gap-2">
              <span>🏆 Model Benchmark Scorecards</span>
            </h2>
            <p className="text-xs text-[#64748b] font-mono mt-0.5">
              Head-to-head performance metrics across the 26 standardized evaluation queries
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#60a5fa] bg-[#3b82f6]/10 px-2.5 py-1 rounded-lg border border-[#3b82f6]/25">
            Identical Temperature (0.2) &amp; Hybrid Top-5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Gemma 3 4B Card */}
          <div className="rounded-2xl bg-[#0c0f17] border-2 border-[#3b82f6]/40 p-5 relative overflow-hidden shadow-xl hover:border-[#3b82f6] transition-all flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-[#2563eb] text-white text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow">
              🏆 Best Overall &amp; Fastest
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center text-[#60a5fa] font-mono font-bold text-sm">
                  G3
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#f1f5f9] font-mono">gemma3:4b</h3>
                  <p className="text-[11px] text-[#64748b] font-mono">Google • 4 Billion Parameters</p>
                </div>
              </div>

              <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                Instruction-tuned multimodal architecture exhibiting highest factual precision, concise synthesis, and minimal latency overhead.
              </p>

              <div className="space-y-2.5 bg-[#07090e] p-3.5 rounded-xl border border-[#161a26] font-mono text-xs mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Accuracy / Correctness:</span>
                  <span className="text-[#34d399] font-bold text-sm">82.56%</span>
                </div>
                <div className="w-full bg-[#161b26] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#10b981] h-full rounded-full" style={{ width: '82.56%' }} />
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-[#121620]">
                  <span className="text-[#64748b]">Avg Latency:</span>
                  <span className="text-[#60a5fa] font-bold">15.75s (Lowest)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Avg Token Count:</span>
                  <span className="text-[#cbd5e1] font-semibold">1,042.4 tok</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Code Pass Rate:</span>
                  <span className="text-[#fbbf24] font-semibold">66.7% (2/3)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Hallucinations:</span>
                  <span className="text-[#94a3b8] font-semibold">{gemma?.total_hallucinations || 5} flagged</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#161a26] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#38bdf8] font-semibold">Best for: General API Q&amp;A</span>
              <button
                onClick={() => onNavigateTab(4)}
                className="text-[#60a5fa] hover:text-[#93c5fd] cursor-pointer flex items-center gap-1"
              >
                <span>Analysis</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* CodeLlama 7B Card */}
          <div className="rounded-2xl bg-[#0c0f17] border border-[#2b354c] p-5 relative overflow-hidden shadow-xl hover:border-[#60a5fa]/60 transition-all flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-[#0284c7] text-white text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow">
              ⚡ Code Champion
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8] font-mono font-bold text-sm">
                  CL
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#f1f5f9] font-mono">codellama:7b</h3>
                  <p className="text-[11px] text-[#64748b] font-mono">Meta • 7 Billion Parameters</p>
                </div>
              </div>

              <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                Code-specialized instruction model delivering flawless executable Python scripts, assertions, and strict parameter handling.
              </p>

              <div className="space-y-2.5 bg-[#07090e] p-3.5 rounded-xl border border-[#161a26] font-mono text-xs mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Accuracy / Correctness:</span>
                  <span className="text-[#38bdf8] font-bold text-sm">81.79%</span>
                </div>
                <div className="w-full bg-[#161b26] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#38bdf8] h-full rounded-full" style={{ width: '81.79%' }} />
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-[#121620]">
                  <span className="text-[#64748b]">Avg Latency:</span>
                  <span className="text-[#cbd5e1] font-semibold">25.09s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Avg Token Count:</span>
                  <span className="text-[#cbd5e1] font-semibold">1,016.2 tok</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Code Pass Rate:</span>
                  <span className="text-[#10b981] font-bold text-sm">100.0% (3/3)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Hallucinations:</span>
                  <span className="text-[#94a3b8] font-semibold">{codellama?.total_hallucinations || 6} flagged</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#161a26] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#10b981] font-semibold">Best for: Code Synthesis</span>
              <button
                onClick={() => onNavigateTab(4)}
                className="text-[#60a5fa] hover:text-[#93c5fd] cursor-pointer flex items-center gap-1"
              >
                <span>Analysis</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* StarCoder2 3B Card */}
          <div className="rounded-2xl bg-[#0c0f17] border border-[#2b354c] p-5 relative overflow-hidden shadow-xl hover:border-[#f59e0b]/50 transition-all flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-[#d97706] text-white text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow">
              ⚠️ Completion Model
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#d97706]/20 border border-[#d97706]/40 flex items-center justify-center text-[#fbbf24] font-mono font-bold text-sm">
                  SC
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#f1f5f9] font-mono">starcoder2:3b</h3>
                  <p className="text-[11px] text-[#64748b] font-mono">BigCode • 3 Billion Parameters</p>
                </div>
              </div>

              <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                Raw code-completion model without instruction-tuning; frequently loops or hallucinates multi-choice quiz formats on open Q&amp;A.
              </p>

              <div className="space-y-2.5 bg-[#07090e] p-3.5 rounded-xl border border-[#161a26] font-mono text-xs mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Accuracy / Correctness:</span>
                  <span className="text-[#f87171] font-bold text-sm">50.58%</span>
                </div>
                <div className="w-full bg-[#161b26] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#f87171] h-full rounded-full" style={{ width: '50.58%' }} />
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-[#121620]">
                  <span className="text-[#64748b]">Avg Latency:</span>
                  <span className="text-[#f87171] font-semibold">63.25s (High)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Avg Token Count:</span>
                  <span className="text-[#fca5a5] font-semibold">1,753.8 tok</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Code Pass Rate:</span>
                  <span className="text-[#f87171] font-semibold">33.3% (1/3)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">Hallucinations:</span>
                  <span className="text-[#94a3b8] font-semibold">{starcoder?.total_hallucinations || 4} flagged</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#161a26] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#f59e0b] font-semibold">Limitation: Lacks Chat Fine-Tuning</span>
              <button
                onClick={() => onNavigateTab(4)}
                className="text-[#60a5fa] hover:text-[#93c5fd] cursor-pointer flex items-center gap-1"
              >
                <span>Analysis</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Core Architectural Insights & Pareto Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-[#0b0e14] border border-[#1b2230] space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold font-mono text-[#60a5fa]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Pareto Efficiency &amp; Scaling Findings</span>
          </div>

          <div className="space-y-3 text-xs text-[#94a3b8] leading-relaxed">
            <div className="p-3 bg-[#080a0f] rounded-xl border border-[#141a24]">
              <span className="text-[#f1f5f9] font-semibold block mb-1">
                1. Instruction-Tuning Dominates Raw Parameter Size
              </span>
              <p>
                <code className="text-[#60a5fa]">gemma3:4b</code> (4B parameters) outperformed <code className="text-[#38bdf8]">codellama:7b</code> (7B parameters) in general factual correctness (82.56% vs 81.79%) while responding <strong className="text-white">37% faster</strong> (15.75s vs 25.09s). Chat alignment enables models to directly answer developer questions rather than repeating prompts.
              </p>
            </div>

            <div className="p-3 bg-[#080a0f] rounded-xl border border-[#141a24]">
              <span className="text-[#f1f5f9] font-semibold block mb-1">
                2. Base Code-Completion Models Struggle with Open Q&amp;A
              </span>
              <p>
                <code className="text-[#fbbf24]">starcoder2:3b</code> suffers from severe token runaways (averaging 1,753 tokens and 63.25s) because it treats instructions as code comments, generating hypothetical multiple-choice questions instead of direct solutions.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b0e14] border border-[#1b2230] space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold font-mono text-[#10b981]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>Production Multi-Model Hybrid Routing</span>
          </div>

          <div className="space-y-3 text-xs text-[#94a3b8] leading-relaxed">
            <div className="p-3 bg-[#080a0f] rounded-xl border border-[#141a24]">
              <span className="text-[#f1f5f9] font-semibold block mb-1">
                3. Enterprise Query Classification Router
              </span>
              <p>
                The empirical evaluation demonstrates that no single model wins across all categories. Archon implements a <strong>Task-Aware Router</strong>:
              </p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside text-[#cbd5e1]">
                <li><strong className="text-[#60a5fa]">General API Inquiries &amp; Architecture Guides:</strong> Route to <code className="text-[#60a5fa]">gemma3:4b</code> for low-latency factual synthesis.</li>
                <li><strong className="text-[#38bdf8]">Code Generation &amp; Unit Tests (Q24–Q26):</strong> Route to <code className="text-[#38bdf8]">codellama:7b</code> for 100% test-passing code generation.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Exercise Quick Navigation Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#cbd5e1] font-mono uppercase tracking-wider">
          Explore Lab 4 Exercises (1 through 6)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              id: 1,
              title: "Exercise 1: Model Profiles & Controls",
              desc: "3 evaluated LLMs, parameter counts, quantization formats, and experimental invariants.",
              tag: "3 Models",
              color: "border-blue-500/30 hover:border-blue-500"
            },
            {
              id: 2,
              title: "Exercise 2: Evaluation Dataset",
              desc: "Filterable 26-question bank across single-file, 2-file, multi-hop, decoys, and code gen.",
              tag: "26 Questions",
              color: "border-purple-500/30 hover:border-purple-500"
            },
            {
              id: 3,
              title: "Exercise 3: Quantitative Metrics",
              desc: "Precision formulas, comparative benchmark table, latency, tokens, and resource charts.",
              tag: "Full Matrix",
              color: "border-emerald-500/30 hover:border-emerald-500"
            },
            {
              id: 4,
              title: "Exercise 4: Cross-Model Trade-Offs",
              desc: "Category champions, Pareto frontier visualization, and model routing strategy.",
              tag: "Trade-Offs",
              color: "border-amber-500/30 hover:border-amber-500"
            },
            {
              id: 5,
              title: "Exercise 5: RAG Pipeline Impact",
              desc: "Deep-dive 4-stage traces (Query → Retriever → Injected Context → Multi-Model Outputs).",
              tag: "15 Traces",
              color: "border-cyan-500/30 hover:border-cyan-500"
            },
            {
              id: 6,
              title: "Exercise 6: Multi-Hop Reasoning",
              desc: "Multi-file dependency graph, chain completeness matrix, and repo code intelligence.",
              tag: "Multi-Hop",
              color: "border-rose-500/30 hover:border-rose-500"
            }
          ].map(ex => (
            <button
              key={ex.id}
              onClick={() => onNavigateTab(ex.id)}
              className={`p-4 rounded-xl bg-[#090c12] border ${ex.color} text-left transition-all hover:bg-[#0e131d] cursor-pointer flex flex-col justify-between group shadow-sm`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161c28] text-[#8b949e] border border-[#222b3d]">
                    {ex.tag}
                  </span>
                  <span className="text-xs text-[#64748b] group-hover:text-[#60a5fa] transition-colors">
                    View →
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#e2e5ea] font-mono group-hover:text-white transition-colors">
                  {ex.title}
                </h4>
                <p className="text-[11.5px] text-[#64748b] mt-1.5 leading-relaxed">
                  {ex.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
