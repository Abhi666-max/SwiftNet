'use client';

import React, { useMemo } from 'react';
import { Play, Square, RotateCcw, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { TestPhase } from '@/types/speedtest';

interface SpeedometerProps {
  phase: TestPhase;
  currentSpeed: number; // in Mbps
  finalDownloadSpeed?: number;
  progressPercent: number; // 0 - 100
  onStart: () => void;
  onStop: () => void;
}

export function Speedometer({
  phase,
  currentSpeed,
  finalDownloadSpeed,
  progressPercent,
  onStart,
  onStop,
}: SpeedometerProps) {
  // Active speed to show on gauge: during complete, show final measured speed
  const displaySpeed = useMemo(() => {
    if (phase === 'complete') {
      return finalDownloadSpeed && finalDownloadSpeed > 0 ? finalDownloadSpeed : currentSpeed;
    }
    return currentSpeed;
  }, [phase, finalDownloadSpeed, currentSpeed]);

  // Logarithmic needle angle from -120 to +120
  const needleAngle = useMemo(() => {
    if (phase === 'idle' || phase === 'ping') {
      return -120;
    }
    const speed = Math.max(0, displaySpeed);
    if (speed <= 0) return -120;
    
    // Log scale from 1 Mbps to 1000 Mbps
    const minAngle = -120;
    const maxAngle = 120;
    const logVal = Math.log10(Math.max(1, speed)) / Math.log10(1000);
    const clampedLog = Math.min(1, Math.max(0, logVal));
    return minAngle + clampedLog * (maxAngle - minAngle);
  }, [displaySpeed, phase]);

  const arcLength = 544.5;
  const strokeOffset = useMemo(() => {
    if (phase === 'idle' || phase === 'ping') return arcLength;
    const progress = Math.min(1, Math.max(0, (needleAngle + 120) / 240));
    return arcLength - (arcLength * progress);
  }, [needleAngle, phase, arcLength]);

  const isTesting = phase === 'ping' || phase === 'download' || phase === 'upload';

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case 'ping':
        return 'Analyzing Ping & Jitter';
      case 'download':
        return 'Measuring Real Download';
      case 'upload':
        return 'Measuring Real Upload';
      case 'complete':
        return 'Diagnostic Complete';
      case 'error':
        return 'Test Interrupted';
      default:
        return 'Ready for Diagnostic';
    }
  }, [phase]);

  const phaseColor = useMemo(() => {
    switch (phase) {
      case 'ping':
        return 'text-amber-400';
      case 'download':
        return 'text-brand-cyan';
      case 'upload':
        return 'text-brand-purple';
      case 'complete':
        return 'text-brand-emerald';
      case 'error':
        return 'text-brand-rose';
      default:
        return 'text-slate-400';
    }
  }, [phase]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Glow aura */}
      <div 
        className={`absolute h-72 w-72 rounded-full transition-all duration-700 pointer-events-none -z-10 ${
          isTesting ? 'bg-brand-cyan/15 blur-3xl animate-glow-pulse' : 'bg-brand-cyan/5 blur-2xl'
        }`} 
      />

      {/* SVG Speedometer Gauge */}
      <div className="relative h-72 w-80 sm:h-80 sm:w-96 flex items-center justify-center">
        <svg 
          viewBox="0 0 320 260" 
          className="h-full w-full overflow-visible select-none"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="50%" stopColor="#00F2FE" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00F2FE" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 47.3 222.5 A 130 130 0 1 1 272.7 222.5"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Filled Active Value Arc */}
          <path
            d="M 47.3 222.5 A 130 130 0 1 1 272.7 222.5"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeOffset}
            filter="url(#gaugeGlow)"
            className="transition-all duration-150 ease-out"
          />

          {/* Tick marks */}
          {[
            { val: '0', angle: -120 },
            { val: '10', angle: -70 },
            { val: '50', angle: -20 },
            { val: '100', angle: 20 },
            { val: '300', angle: 70 },
            { val: '1G', angle: 120 },
          ].map((tick) => {
            const rad = ((tick.angle - 90) * Math.PI) / 180;
            const xInner = 160 + 105 * Math.cos(rad);
            const yInner = 160 + 105 * Math.sin(rad);
            const xText = 160 + 90 * Math.cos(rad);
            const yText = 160 + 90 * Math.sin(rad);

            return (
              <g key={tick.val}>
                <circle cx={xInner} cy={yInner} r="2" fill="rgba(255, 255, 255, 0.25)" />
                <text
                  x={xText}
                  y={yText}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-slate-500 text-[10px] font-mono font-medium"
                >
                  {tick.val}
                </text>
              </g>
            );
          })}

          {/* Needle Pointer */}
          <g
            transform={`rotate(${needleAngle} 160 160)`}
            className="transition-transform duration-150 ease-out origin-[160px_160px]"
          >
            <line
              x1="160"
              y1="160"
              x2="160"
              y2="52"
              stroke="#00F2FE"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
            />
            <circle cx="160" cy="50" r="4.5" fill="#FFFFFF" />
          </g>

          {/* Center Hub */}
          <circle cx="160" cy="160" r="12" fill="#0B1120" stroke="#00F2FE" strokeWidth="3" />
          <circle cx="160" cy="160" r="5" fill="#00F2FE" />
        </svg>

        {/* Center Digital Display */}
        <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-tabular text-5xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
              {phase === 'idle' ? '0.0' : displaySpeed.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">Mbps</span>
          </div>

          {/* Current Phase Sub-label */}
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`text-xs font-medium tracking-wide uppercase ${phaseColor}`}>
              {phaseLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Phase Timeline Badges */}
      <div className="mt-2 flex items-center justify-center gap-2 sm:gap-4">
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          phase === 'ping' 
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
            : phase === 'download' || phase === 'upload' || phase === 'complete'
            ? 'bg-slate-800/80 text-slate-400'
            : 'bg-slate-900/40 text-slate-500'
        }`}>
          <Clock className="h-3 w-3" />
          <span>Latency</span>
        </div>

        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          phase === 'download' 
            ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30' 
            : phase === 'upload' || phase === 'complete'
            ? 'bg-slate-800/80 text-slate-400'
            : 'bg-slate-900/40 text-slate-500'
        }`}>
          <ArrowDown className="h-3 w-3" />
          <span>Download</span>
        </div>

        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          phase === 'upload' 
            ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' 
            : phase === 'complete'
            ? 'bg-slate-800/80 text-slate-400'
            : 'bg-slate-900/40 text-slate-500'
        }`}>
          <ArrowUp className="h-3 w-3" />
          <span>Upload</span>
        </div>
      </div>

      {/* Progress Bar (Visible while testing) */}
      {isTesting && (
        <div className="mt-4 w-64 max-w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
            <div 
              className="h-full bg-gradient-to-r from-brand-electric via-brand-cyan to-brand-purple transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Main Start / Stop Button */}
      <div className="mt-6 flex items-center justify-center gap-3">
        {!isTesting ? (
          <button
            onClick={onStart}
            className="group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-electric px-8 py-3.5 text-base font-bold text-slate-950 shadow-glow transition-all duration-200 hover:scale-[1.03] hover:shadow-glow-lg active:scale-[0.98]"
          >
            {phase === 'complete' ? (
              <>
                <RotateCcw className="h-5 w-5 transition-transform group-hover:-rotate-90 duration-300" />
                <span>Test Again</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-slate-950" />
                <span>Start Speed Test</span>
              </>
            )}
            <div className="absolute -inset-1 -z-10 rounded-2xl bg-brand-cyan opacity-30 blur-md transition-opacity group-hover:opacity-70" />
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-6 py-3.5 text-sm font-semibold text-rose-300 backdrop-blur-md transition-all hover:bg-rose-500/25 active:scale-[0.98]"
          >
            <Square className="h-4 w-4 fill-rose-300" />
            <span>Stop Test</span>
          </button>
        )}
      </div>
    </div>
  );
}
