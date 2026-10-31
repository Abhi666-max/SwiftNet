'use client';

import React from 'react';
import { Shield, Activity, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-surface-border bg-slate-950/80 pt-10 pb-8 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Methodology */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-bold mb-2">
              <Activity className="h-4 w-4 text-brand-cyan" />
              <span>Measurement Methodology</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              SwiftNet executes real multi-stream data transfers utilizing progressive chunk sizes with cache-busting headers. Latency is measured via high-resolution HTTP response round-trips. Browser security sandboxes do not permit native raw socket ICMP echo packets or hardware Wi-Fi signal inspection.
            </p>
          </div>

          {/* Privacy */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-bold mb-2">
              <Shield className="h-4 w-4 text-brand-emerald" />
              <span>Privacy & Data Sovereignty</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              No mandatory login or account creation. Your test history is retained exclusively in your local browser <code className="text-slate-300 font-mono">localStorage</code>. By default, your public IP address is never persisted into history unless you explicitly opt in.
            </p>
          </div>

          {/* Real Measurements Guarantee */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-bold mb-2">
              <Globe className="h-4 w-4 text-brand-purple" />
              <span>Integrity Guarantee</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              SwiftNet never uses random or simulated measurements. If a service or metric cannot be established, it is honestly labeled as unavailable rather than simulated. Throughput is influenced by physical distance, Wi-Fi interference, ISP transit peering, and active device background processes.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-6 text-[11px] text-slate-500 gap-3">
          <div>
            <span>© {new Date().getFullYear()} SwiftNet Platform. Speed. Stability. Connection.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Next.js • React 19 • Tailwind CSS • TypeScript</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
