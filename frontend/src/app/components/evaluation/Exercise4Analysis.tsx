"use client";
import React from 'react';
import { EVALUATION_DATA } from './evaluationData';

interface Exercise4AnalysisProps {
  onNavigateTab?: (tabIndex: number) => void;
}

export function Exercise4Analysis({ onNavigateTab }: Exercise4AnalysisProps) {
  const ex4 = EVALUATION_DATA.exercise_4;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Exercise Briefing Header */}
      <div className="p-6 rounded-2xl bg-[#0d111a] border border-[#1d2436] space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#60a5fa] text-xs font-mono font-bold">
              EXERCISE 4
            </span>
            <h2 className="text-lg font-bold text-[#f1f5f9] font-mono">
              Cross-Model Analysis, Trade-Offs &amp; Routing Strategy
            </h2>
          </div>
          <span className="text-xs font-mono text-[#f59e0b] bg-[#f59e0b]/15 px-3 py-1 rounded-full border border-[#f59e0b]/30">
            Pareto Frontier &amp; Dispatcher Architecture
          </span>
        </div>

        <blockquote className="border-l-2 border-[#3b82f6] pl-3 py-1.5 bg-[#080a0f] rounded-r text-xs text-[#94a3b8] font-mono leading-relaxed">
          &ldquo;Do not stop at preparing a comparison table. Analyse questions such as: <strong>Which model provides better accuracy? Fewer hallucinations? Higher code test-pass rate? Lower response latency? Is there a quality–latency–resource trade-off?</strong>&rdquo;
          <span className="text-[#64748b] block mt-1">— Lab 4 Exercise 4 Specification</span>
        </blockquote>
      </div>

      {/* Category Winners & Champions Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#cbd5e1] font-mono uppercase tracking-wider">
          Category Champions &amp; Empirical Winners
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Best Accuracy */}
          <div className="p-5 rounded-2xl bg-[#0b0f17] border-2 border-[#10b981]/40 space-y-3 shadow-lg hover:border-[#10b981] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🎯</span>
              <span className="text-[10px] font-mono font-bold bg-[#10b981]/15 text-[#10b981] px-2 py-0.5 rounded border border-[#10b981]/30">
                QUALITY WINNER
              </span>
            </div>
            <div>
              <div className="text-xs font-mono text-[#64748b]">Best Accuracy / Correctness</div>
              <div className="text-base font-bold text-[#f1f5f9] font-mono mt-0.5">
                {ex4.best_accuracy.model}
              </div>
              <div className="text-xl font-bold font-mono text-[#34d399] mt-1">
                {(ex4.best_accuracy.avg_score * 100).toFixed(1)}%
              </div>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed pt-2 border-t border-[#141d2c]">
              Superior instruction adherence and exact factual keyword matching across 26 API tasks.
            </p>
          </div>

          {/* Fewest Hallucinations */}
          <div className="p-5 rounded-2xl bg-[#0b0f17] border-2 border-[#3b82f6]/40 space-y-3 shadow-lg hover:border-[#3b82f6] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🛡️</span>
              <span className="text-[10px] font-mono font-bold bg-[#3b82f6]/15 text-[#60a5fa] px-2 py-0.5 rounded border border-[#3b82f6]/30">
                FIDELITY WINNER
              </span>
            </div>
            <div>
              <div className="text-xs font-mono text-[#64748b]">Fewest Hallucinations</div>
              <div className="text-base font-bold text-[#f1f5f9] font-mono mt-0.5">
                {ex4.fewest_hallucinations.model} / gemma
              </div>
              <div className="text-xl font-bold font-mono text-[#60a5fa] mt-1">
                {ex4.fewest_hallucinations.count} flagged
              </div>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed pt-2 border-t border-[#141d2c]">
              Strictly refrained from fabricating non-existent OpenAPI endpoints or imaginary routes.
            </p>
          </div>

          {/* Highest Code Pass */}
          <div className="p-5 rounded-2xl bg-[#0b0f17] border-2 border-[#0284c7]/40 space-y-3 shadow-lg hover:border-[#0284c7] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">💻</span>
              <span className="text-[10px] font-mono font-bold bg-[#0284c7]/15 text-[#38bdf8] px-2 py-0.5 rounded border border-[#0284c7]/30">
                SYNTHESIS WINNER
              </span>
            </div>
            <div>
              <div className="text-xs font-mono text-[#64748b]">Highest Code Test-Pass</div>
              <div className="text-base font-bold text-[#f1f5f9] font-mono mt-0.5">
                {ex4.highest_code_pass.model}
              </div>
              <div className="text-xl font-bold font-mono text-[#38bdf8] mt-1">
                {(ex4.highest_code_pass.rate * 100).toFixed(1)}% (3/3)
              </div>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed pt-2 border-t border-[#141d2c]">
              100% Python syntax and functional assertion passes across Q24, Q25, and Q26.
            </p>
          </div>

          {/* Lowest Latency */}
          <div className="p-5 rounded-2xl bg-[#0b0f17] border-2 border-[#fbbf24]/40 space-y-3 shadow-lg hover:border-[#fbbf24] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⚡</span>
              <span className="text-[10px] font-mono font-bold bg-[#fbbf24]/15 text-[#fbbf24] px-2 py-0.5 rounded border border-[#fbbf24]/30">
                SPEED WINNER
              </span>
            </div>
            <div>
              <div className="text-xs font-mono text-[#64748b]">Lowest Response Latency</div>
              <div className="text-base font-bold text-[#f1f5f9] font-mono mt-0.5">
                {ex4.lowest_latency.model}
              </div>
              <div className="text-xl font-bold font-mono text-[#fbbf24] mt-1">
                {ex4.lowest_latency.avg_latency_seconds.toFixed(2)}s
              </div>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed pt-2 border-t border-[#141d2c]">
              37% faster than CodeLlama 7B and 75% faster than StarCoder2 3B without losing quality.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Pareto Frontier Diagram */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#cbd5e1] font-mono uppercase tracking-wider">
          Pareto Efficiency Frontier (Accuracy vs Latency Trade-Off)
        </h3>

        <div className="p-6 rounded-2xl bg-[#0a0d14] border border-[#1a2233] space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
            <span className="text-[#94a3b8]">
              Optimal Models reside in the top-left quadrant (<strong className="text-[#34d399]">High Accuracy</strong> + <strong className="text-[#60a5fa]">Low Latency</strong>):
            </span>
            <span className="text-[#fbbf24] bg-[#fbbf24]/10 px-3 py-1 rounded-lg border border-[#fbbf24]/30">
              Pareto Frontier: gemma3:4b (Fast Q&amp;A) &amp; codellama:7b (Code Synth)
            </span>
          </div>

          {/* Pareto Visual 2D Plane */}
          <div className="relative h-64 w-full bg-[#06080c] border border-[#161c28] rounded-xl p-4 flex flex-col justify-between select-none">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
            </div>

            {/* Optimal Zone Callout */}
            <div className="absolute top-3 left-4 text-[10px] font-mono text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded border border-[#10b981]/25">
              ★ Pareto Optimal Region (High Accuracy, Low Latency)
            </div>

            {/* Gemma 3 4B Plot Point */}
            <div
              className="absolute group cursor-pointer"
              style={{ left: '25%', top: '22%' }}
            >
              <div className="w-5 h-5 rounded-full bg-[#10b981] border-2 border-white shadow-lg animate-pulse" />
              <div className="absolute left-6 -top-2 bg-[#0c1018] border border-[#10b981]/60 px-2.5 py-1 rounded-lg text-xs font-mono text-[#e2e5ea] whitespace-nowrap shadow-xl">
                <span className="text-[#10b981] font-bold">gemma3:4b</span> (82.6%, 15.7s) 🏆
              </div>
            </div>

            {/* CodeLlama 7B Plot Point */}
            <div
              className="absolute group cursor-pointer"
              style={{ left: '42%', top: '25%' }}
            >
              <div className="w-5 h-5 rounded-full bg-[#38bdf8] border-2 border-white shadow-lg" />
              <div className="absolute left-6 -top-2 bg-[#0c1018] border border-[#38bdf8]/60 px-2.5 py-1 rounded-lg text-xs font-mono text-[#e2e5ea] whitespace-nowrap shadow-xl">
                <span className="text-[#38bdf8] font-bold">codellama:7b</span> (81.8%, 25.1s, 100% Code)
              </div>
            </div>

            {/* StarCoder2 3B Plot Point */}
            <div
              className="absolute group cursor-pointer"
              style={{ left: '82%', top: '65%' }}
            >
              <div className="w-5 h-5 rounded-full bg-[#ef4444] border-2 border-white shadow-lg" />
              <div className="absolute right-6 -top-2 bg-[#0c1018] border border-[#ef4444]/60 px-2.5 py-1 rounded-lg text-xs font-mono text-[#e2e5ea] whitespace-nowrap shadow-xl">
                <span className="text-[#f87171] font-bold">starcoder2:3b</span> (50.6%, 63.2s) ⚠️
              </div>
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between text-[10.5px] font-mono text-[#64748b] pt-2 border-t border-[#1a2233] mt-auto">
              <span>← Fast (0s Latency)</span>
              <span>Response Latency (Seconds)</span>
              <span>Slow (70s+ Latency) →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Architectural Trade-Offs & Production Router */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Architectural Trade-Offs */}
        <div className="p-6 rounded-2xl bg-[#0a0d14] border border-[#1a2233] space-y-4">
          <div className="text-sm font-bold font-mono text-[#60a5fa] flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Architectural Trade-Off Synthesis</span>
          </div>

          <div className="space-y-3 text-xs text-[#94a3b8] leading-relaxed">
            <div className="p-3.5 bg-[#07090e] rounded-xl border border-[#141a26] space-y-1">
              <strong className="text-[#f1f5f9] block">1. Instruction-Tuned vs Completion Architecture:</strong>
              <p>
                Instruction fine-tuning (<code className="text-[#60a5fa]">gemma3:4b</code>, <code className="text-[#38bdf8]">codellama:7b</code>) is mandatory for enterprise RAG. Raw completion models (<code className="text-[#fbbf24]">starcoder2:3b</code>) fail because they treat prompts as document continuations rather than instructions to be executed.
              </p>
            </div>

            <div className="p-3.5 bg-[#07090e] rounded-xl border border-[#141a26] space-y-1">
              <strong className="text-[#f1f5f9] block">2. Parameter Scaling vs Latency Overhead:</strong>
              <p>
                Scaling from 4B (<code className="text-[#60a5fa]">gemma3:4b</code>) to 7B (<code className="text-[#38bdf8]">codellama:7b</code>) adds <strong className="text-white">+9.34 seconds</strong> (59% latency increase) per query, but is indispensable when strict syntactic code compilation is required.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise Dispatcher Routing Plan */}
        <div className="p-6 rounded-2xl bg-[#0a0d14] border border-[#1a2233] space-y-4">
          <div className="text-sm font-bold font-mono text-[#10b981] flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>Archon Enterprise Dynamic Router</span>
          </div>

          <div className="p-3.5 bg-[#07090e] rounded-xl border border-[#141a26] space-y-3 text-xs">
            <p className="text-[#94a3b8] leading-relaxed">
              Instead of standardizing on a single model across all tasks, the production deployment employs a dynamic query dispatcher:
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-[#0e1420] border border-[#1e2a40] flex items-center justify-between">
                <div>
                  <span className="text-[#60a5fa] font-bold block">Developer Q&amp;A / Workflow Queries</span>
                  <span className="text-[11px] text-[#64748b]">Route to <strong>gemma3:4b</strong></span>
                </div>
                <span className="text-[10px] bg-[#3b82f6]/20 text-[#60a5fa] px-2 py-0.5 rounded font-bold">
                  15.7s • 82.6% Correct
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1815] border border-[#143026] flex items-center justify-between">
                <div>
                  <span className="text-[#34d399] font-bold block">Code Synthesis &amp; Test Writing (Q24-26)</span>
                  <span className="text-[11px] text-[#64748b]">Route to <strong>codellama:7b</strong></span>
                </div>
                <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded font-bold">
                  100% Code Pass
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
