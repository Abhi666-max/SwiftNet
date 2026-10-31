'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Wrench, XCircle } from 'lucide-react';
import { TroubleshootingInsight } from '@/types/speedtest';

interface TroubleshootingCardProps {
  insights: TroubleshootingInsight[];
}

export function TroubleshootingCard({ insights }: TroubleshootingCardProps) {
  if (insights.length === 0) return null;

  const getTypeStyle = (type: TroubleshootingInsight['type']) => {
    switch (type) {
      case 'critical':
        return {
          icon: XCircle,
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          border: 'border-rose-500/30',
          titleColor: 'text-rose-300',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          border: 'border-amber-500/30',
          titleColor: 'text-amber-300',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          border: 'border-emerald-500/25',
          titleColor: 'text-emerald-300',
        };
      case 'info':
      default:
        return {
          icon: Info,
          badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          border: 'border-cyan-500/25',
          titleColor: 'text-cyan-300',
        };
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-surface-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-brand-cyan" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Smart Network Diagnostics & Troubleshooting
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Rule-Based Recommendations
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const style = getTypeStyle(insight.type);
          const Icon = style.icon;

          return (
            <div
              key={insight.id}
              className={`rounded-xl border ${style.border} bg-surface-subtle/70 p-4 transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <Icon className={`h-4 w-4 ${style.titleColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs font-bold ${style.titleColor}`}>
                      {insight.title}
                    </h4>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${style.badge}`}>
                      {insight.type}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-300">
                    {insight.description}
                  </p>

                  <div className="mt-2.5 rounded-lg border border-white/5 bg-slate-900/80 p-2.5 text-xs text-slate-300">
                    <span className="font-semibold text-brand-cyan">Actionable Step: </span>
                    <span>{insight.recommendation}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
