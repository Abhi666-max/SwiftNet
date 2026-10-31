'use client';

import React from 'react';
import { Gauge, Info } from 'lucide-react';
import { LoadedLatencyResult } from '@/types/speedtest';

interface LoadedLatencyCardProps {
  loadedLatency: LoadedLatencyResult;
}

export function LoadedLatencyCard({ loadedLatency }: LoadedLatencyCardProps) {
  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    'A+': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'A': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'B': { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    'C': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    'D': { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    'F': { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  const style = gradeColors[loadedLatency.rating] || gradeColors['B'];

  return (
    <div className="glass-panel rounded-2xl border border-surface-border p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-brand-cyan" />
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300">
              Loaded Latency & Bufferbloat Check
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Measures latency variation when the connection is simultaneously handling heavy download & upload traffic.
          </p>
        </div>

        {/* Grade Badge */}
        <div className="flex items-center gap-2.5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border font-mono text-2xl font-black ${style.bg} ${style.text} ${style.border}`}>
            {loadedLatency.rating}
          </div>
          <div className="text-left">
            <span className="block text-[10px] font-bold uppercase text-slate-400">Bufferbloat Grade</span>
            <span className="text-xs font-semibold text-slate-200">
              +{loadedLatency.bufferbloatDelta} ms Under Load
            </span>
          </div>
        </div>
      </div>

      {/* Latency Comparison Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="rounded-xl border border-surface-border bg-surface-subtle/60 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Idle Latency (Base)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-white">
              {loadedLatency.idleAvg}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1">Normal response time with zero network congestion.</p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-subtle/60 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan block mb-1">
            Download Loaded Latency
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-brand-cyan">
              {loadedLatency.downloadLoadedAvg}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1">Response time while multi-stream downloads saturate bandwidth.</p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-subtle/60 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-purple block mb-1">
            Upload Loaded Latency
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-brand-purple">
              {loadedLatency.uploadLoadedAvg}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1">Response time while upstream POST transfers saturate link.</p>
        </div>
      </div>

      {/* Explanation Box */}
      <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-slate-900/60 p-3 text-xs text-slate-300">
        <Info className="h-4 w-4 shrink-0 text-brand-cyan mt-0.5" />
        <div>
          <span className="font-semibold text-white">Impact on Real-time Applications: </span>
          <span>{loadedLatency.explanation} </span>
          <span className="text-slate-400">
            When bufferbloat is high, interactive tasks like Discord voice channels, Zoom meetings, and competitive multiplayer gaming will suffer lag spikes if another device on your network starts downloading a file or streaming video.
          </span>
        </div>
      </div>
    </div>
  );
}
