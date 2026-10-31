'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SpeedTestScoreBreakdown } from '@/types/speedtest';

interface QualityScoreCardProps {
  score: SpeedTestScoreBreakdown;
}

export function QualityScoreCard({ score }: QualityScoreCardProps) {
  const subMetrics = [
    { label: 'Download Bandwidth', value: score.downloadSubscore, weight: '30%' },
    { label: 'Upload Bandwidth', value: score.uploadSubscore, weight: '20%' },
    { label: 'Base Latency', value: score.latencySubscore, weight: '25%' },
    { label: 'Connection Jitter', value: score.jitterSubscore, weight: '15%' },
    { label: 'Loaded Latency (Bufferbloat)', value: score.bufferbloatSubscore, weight: '10%' },
  ];

  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-surface-border p-5 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Big Score Dial & Tier */}
        <div className="flex items-center gap-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-surface-elevated/70 shadow-glow">
            {/* Circular Progress Ring */}
            <svg className="absolute h-full w-full -rotate-90 p-1" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={score.color}
                strokeWidth="7"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * score.totalScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="font-tabular text-3xl font-extrabold text-white">
                {score.totalScore}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${score.color}20`, color: score.color, border: `1px solid ${score.color}40` }}
              >
                {score.tier} Rating
              </span>
              <span className="text-xs text-slate-400 font-medium">Network Quality Score</span>
            </div>
            <p className="mt-1 text-sm text-slate-200 font-medium max-w-md">
              {score.summary}
            </p>
          </div>
        </div>

        {/* Right: Subscores Breakdown Bars */}
        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {subMetrics.map((sub, i) => (
            <div key={i} className="rounded-xl border border-surface-border bg-surface-subtle/50 p-2.5">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-medium">{sub.label}</span>
                <span className="font-mono text-slate-400">{sub.value}/100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-electric to-brand-cyan transition-all duration-500"
                  style={{ width: `${sub.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rationale Bullet Points */}
      {score.reasons.length > 0 && (
        <div className="mt-5 border-t border-white/5 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            Scoring Analysis Rationale
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {score.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-cyan mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
