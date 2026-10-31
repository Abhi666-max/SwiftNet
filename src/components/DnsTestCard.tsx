'use client';

import React from 'react';
import { Globe2, CheckCircle2, XCircle } from 'lucide-react';
import { DnsTestResult } from '@/types/speedtest';

interface DnsTestCardProps {
  dnsResults: DnsTestResult[];
}

export function DnsTestCard({ dnsResults }: DnsTestCardProps) {
  if (dnsResults.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl border border-surface-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-brand-cyan" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Encrypted DNS-Over-HTTPS (DoH) Benchmarks
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 rounded bg-slate-800/80 px-2 py-0.5 border border-white/5">
          RFC 8484 DoH
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dnsResults.map((result, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-surface-border bg-surface-subtle/50 p-4 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">
                {result.provider}
              </span>
              {result.status === 'success' ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  ACTIVE
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                  <XCircle className="h-3 w-3" />
                  UNAVAILABLE
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xs text-slate-400">Resolution Round-Trip:</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold text-brand-cyan">
                  {result.latencyMs !== null ? `${result.latencyMs}` : '—'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">ms</span>
              </div>
            </div>

            <div className="mt-2 text-[10.5px] text-slate-400 border-t border-white/5 pt-2 flex items-center justify-between">
              <span className="truncate max-w-[200px]">Endpoint: {result.endpoint}</span>
              {result.ipResolved && (
                <span className="font-mono text-slate-300">A: {result.ipResolved}</span>
              )}
            </div>

            {result.error && (
              <p className="mt-1 text-[10.5px] text-rose-400">
                {result.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
