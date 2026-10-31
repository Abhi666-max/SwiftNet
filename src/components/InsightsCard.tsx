'use client';

import React from 'react';
import { Gamepad2, Video, Tv, CloudLightning, Globe, AlertCircle } from 'lucide-react';
import { SuitabilityMetric } from '@/types/speedtest';

interface InsightsCardProps {
  suitability: SuitabilityMetric[];
}

export function InsightsCard({ suitability }: InsightsCardProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 className="h-5 w-5" />;
      case 'Video':
        return <Video className="h-5 w-5" />;
      case 'Tv':
        return <Tv className="h-5 w-5" />;
      case 'CloudLightning':
        return <CloudLightning className="h-5 w-5" />;
      case 'Globe':
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getBadgeStyle = (status: SuitabilityMetric['status']) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'good':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'fair':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'poor':
      default:
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-surface-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Gaming & Streaming Suitability
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical suitability estimates based on measured bandwidth, latency, jitter, and loaded queue delay.
          </p>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 rounded bg-slate-800/80 px-2 py-0.5 border border-white/5">
          Indicative Estimates
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suitability.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-xl border border-surface-border bg-surface-subtle/50 p-4 transition-all hover:border-brand-cyan/25 hover:bg-surface-elevated/60"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-brand-cyan">
                  {getIcon(item.icon)}
                  <span className="text-xs font-bold text-white tracking-wide">
                    {item.title}
                  </span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.summary}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 italic">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>
          Note: These performance classifications represent estimates calculated from browser HTTP transfer measurements and do not account for external game server or CDN outages.
        </span>
      </div>
    </div>
  );
}
