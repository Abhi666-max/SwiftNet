'use client';

import React from 'react';
import { History, Server, Zap } from 'lucide-react';
import { TestServerEndpoint } from '@/types/speedtest';
import { TEST_ENDPOINTS } from '@/lib/speedtestEngine';

interface HeaderProps {
  selectedEndpoint: TestServerEndpoint;
  onSelectEndpoint: (endpoint: TestServerEndpoint) => void;
  isTesting: boolean;
  onOpenHistory: () => void;
  historyCount: number;
}

export function Header({
  selectedEndpoint,
  onSelectEndpoint,
  isTesting,
  onOpenHistory,
  historyCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-electric to-brand-cyan shadow-glow">
            <Zap className="h-5 w-5 text-slate-950 fill-slate-950" />
            <div className="absolute -inset-0.5 rounded-xl bg-brand-cyan opacity-40 blur-sm -z-10 animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Swift<span className="text-brand-cyan">Net</span>
              </span>
              <span className="rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-brand-cyan border border-brand-cyan/20">
                PRO DIAGNOSTICS
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Speed. Stability. Connection.
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Server Selector */}
          <div className="relative flex items-center">
            <label htmlFor="endpoint-select" className="sr-only">Test Server Endpoint</label>
            <div className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface/80 px-2.5 py-1.5 text-xs text-slate-300">
              <Server className="h-3.5 w-3.5 text-brand-cyan" />
              <select
                id="endpoint-select"
                disabled={isTesting}
                value={selectedEndpoint.id}
                onChange={(e) => {
                  const target = TEST_ENDPOINTS.find((ep) => ep.id === e.target.value);
                  if (target) onSelectEndpoint(target);
                }}
                className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {TEST_ENDPOINTS.map((ep) => (
                  <option key={ep.id} value={ep.id} className="bg-surface text-slate-200">
                    {ep.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-brand-cyan/40 hover:bg-surface-elevated hover:text-white"
            title="View Previous Test History"
          >
            <History className="h-3.5 w-3.5 text-brand-cyan" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-cyan/20 px-1.5 py-0.2 text-[10px] font-bold text-brand-cyan">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
