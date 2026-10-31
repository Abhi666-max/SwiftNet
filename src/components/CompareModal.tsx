'use client';

import React from 'react';
import { X, GitCompare, ArrowDown, ArrowUp, Clock, Activity, Award } from 'lucide-react';
import { SpeedTestResult } from '@/types/speedtest';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  testA: SpeedTestResult | null;
  testB: SpeedTestResult | null;
}

export function CompareModal({ isOpen, onClose, testA, testB }: CompareModalProps) {
  if (!isOpen || !testA || !testB) return null;

  const getDiff = (valA: number, valB: number, higherIsBetter = true) => {
    const diff = valB - valA;
    if (Math.abs(diff) < 0.01) return { text: 'Identical', color: 'text-slate-400' };
    const pct = valA > 0 ? ((diff / valA) * 100).toFixed(0) : '0';
    const isPositive = diff > 0;
    const isGood = higherIsBetter ? isPositive : !isPositive;
    return {
      text: `${isPositive ? '+' : ''}${diff.toFixed(1)} (${isPositive ? '+' : ''}${pct}%)`,
      color: isGood ? 'text-emerald-400' : 'text-rose-400',
    };
  };

  const rows = [
    {
      label: 'Download Speed',
      unit: 'Mbps',
      valA: testA.downloadSpeedMbps,
      valB: testB.downloadSpeedMbps,
      higherIsBetter: true,
      icon: ArrowDown,
    },
    {
      label: 'Upload Speed',
      unit: 'Mbps',
      valA: testA.uploadSpeedMbps,
      valB: testB.uploadSpeedMbps,
      higherIsBetter: true,
      icon: ArrowUp,
    },
    {
      label: 'HTTP Latency (Avg)',
      unit: 'ms',
      valA: testA.latency?.avg ?? 0,
      valB: testB.latency?.avg ?? 0,
      higherIsBetter: false,
      icon: Clock,
    },
    {
      label: 'Connection Jitter',
      unit: 'ms',
      valA: testA.latency?.jitter ?? 0,
      valB: testB.latency?.jitter ?? 0,
      higherIsBetter: false,
      icon: Activity,
    },
    {
      label: 'Loaded Latency Delta',
      unit: 'ms',
      valA: testA.loadedLatency?.bufferbloatDelta ?? 0,
      valB: testB.loadedLatency?.bufferbloatDelta ?? 0,
      higherIsBetter: false,
      icon: Clock,
    },
    {
      label: 'Network Quality Score',
      unit: '/100',
      valA: testA.score?.totalScore ?? 0,
      valB: testB.score?.totalScore ?? 0,
      higherIsBetter: true,
      icon: Award,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-surface-border bg-surface p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-brand-cyan" />
            <h3 className="text-base font-bold text-white">Compare Test Diagnostics</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-400 border-b border-white/5 pb-2">
          <span>Metric</span>
          <span className="text-brand-cyan">Test A ({testA.dateFormatted.split(',')[0]})</span>
          <span className="text-brand-purple">Test B ({testB.dateFormatted.split(',')[0]})</span>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto space-y-2">
          {rows.map((r, i) => {
            const diff = getDiff(r.valA, r.valB, r.higherIsBetter);
            return (
              <div
                key={i}
                className="grid grid-cols-3 items-center gap-2 rounded-xl border border-surface-border bg-surface-subtle/50 p-3 text-xs"
              >
                <div className="text-left font-medium text-slate-300">
                  {r.label}
                </div>
                <div className="font-mono font-bold text-white text-center">
                  {r.valA} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span>
                </div>
                <div className="font-mono font-bold text-white text-center">
                  <div>
                    {r.valB} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${diff.color}`}>
                    {diff.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
