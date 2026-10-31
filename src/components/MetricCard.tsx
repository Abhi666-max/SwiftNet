'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Clock, Activity } from 'lucide-react';

interface MetricCardProps {
  type: 'download' | 'upload' | 'latency' | 'jitter';
  value: number;
  unit: string;
  isActive: boolean;
  isComplete: boolean;
  minVal?: number;
  maxVal?: number;
  subText?: string;
}

export function MetricCard({
  type,
  value,
  unit,
  isActive,
  isComplete,
  minVal,
  maxVal,
  subText,
}: MetricCardProps) {
  const meta = {
    download: {
      title: 'DOWNLOAD SPEED',
      icon: ArrowDown,
      color: 'text-brand-cyan',
      glowBorder: 'border-brand-cyan/40 shadow-glow',
      activeBg: 'bg-brand-cyan/10',
      description: 'Real data received per second',
    },
    upload: {
      title: 'UPLOAD SPEED',
      icon: ArrowUp,
      color: 'text-brand-purple',
      glowBorder: 'border-brand-purple/40 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]',
      activeBg: 'bg-brand-purple/10',
      description: 'Real data sent per second',
    },
    latency: {
      title: 'HTTP RESPONSE LATENCY',
      icon: Clock,
      color: 'text-amber-400',
      glowBorder: 'border-amber-400/40 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]',
      activeBg: 'bg-amber-400/10',
      description: 'HTTP round-trip time (not ICMP)',
    },
    jitter: {
      title: 'CONNECTION JITTER',
      icon: Activity,
      color: 'text-brand-emerald',
      glowBorder: 'border-brand-emerald/40 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]',
      activeBg: 'bg-brand-emerald/10',
      description: 'Packet delay variation / stability',
    },
  }[type];

  const Icon = meta.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
        isActive
          ? `glass-panel ${meta.glowBorder} scale-[1.02]`
          : 'glass-panel border-surface-border hover:border-slate-700'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? meta.activeBg : 'bg-surface-elevated'}`}>
            <Icon className={`h-4 w-4 ${meta.color}`} />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-slate-400">
            {meta.title}
          </span>
        </div>

        {isActive && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan" />
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-tabular text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {value > 0 ? (type === 'download' || type === 'upload' ? value.toFixed(1) : value.toFixed(0)) : '—'}
        </span>
        <span className="text-xs font-semibold text-slate-400">{unit}</span>
      </div>

      {/* Sub-metrics or helper context */}
      <div className="mt-2 min-h-[22px] flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
        {type === 'latency' && minVal !== undefined && maxVal !== undefined && isComplete ? (
          <div className="flex w-full items-center justify-between font-mono text-[10px]">
            <span>Min: <span className="text-slate-200">{minVal}ms</span></span>
            <span>Max: <span className="text-slate-200">{maxVal}ms</span></span>
          </div>
        ) : type === 'jitter' && isComplete ? (
          <div className="flex items-center justify-between w-full">
            <span>Stability:</span>
            <span className={`font-semibold ${value < 5 ? 'text-emerald-400' : value < 15 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {value < 5 ? 'Ultra Stable' : value < 15 ? 'Normal Stability' : 'High Fluctuation'}
            </span>
          </div>
        ) : (
          <span className="truncate text-slate-400 text-[10.5px]">
            {subText || meta.description}
          </span>
        )}
      </div>
    </div>
  );
}
