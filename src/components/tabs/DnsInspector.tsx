'use client';

import React, { useState } from 'react';
import { Search, Globe, CheckCircle2, XCircle, Clock, RefreshCw, Copy, Check } from 'lucide-react';

interface DnsRecord {
  name: string;
  type: string;
  TTL: number;
  data: string;
}

interface DnsResponse {
  status: 'success' | 'error';
  provider: string;
  latencyMs: number;
  records: DnsRecord[];
  error?: string;
}

const DOH_PROVIDERS = [
  { name: 'Cloudflare (1.1.1.1)', url: 'https://cloudflare-dns.com/dns-query' },
  { name: 'Google Public DNS (8.8.8.8)', url: 'https://dns.google/resolve' },
];

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'];

const TYPE_COLORS: Record<string, string> = {
  A: 'badge-blue',
  AAAA: 'badge-green',
  MX: 'badge-amber',
  TXT: 'badge-gray',
  CNAME: 'badge-red',
  NS: 'badge-violet',
};

const POPULAR_DOMAINS = ['google.com', 'github.com', 'cloudflare.com', 'amazon.com', 'wikipedia.org'];

function numberToType(n: number): string {
  const map: Record<number, string> = { 1: 'A', 2: 'NS', 5: 'CNAME', 15: 'MX', 16: 'TXT', 28: 'AAAA' };
  return map[n] || `TYPE${n}`;
}

async function queryDoh(domain: string, type: string, provider: typeof DOH_PROVIDERS[0]): Promise<DnsResponse> {
  const start = performance.now();
  try {
    const url = `${provider.url}?name=${encodeURIComponent(domain)}&type=${type}&t=${Date.now()}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(6000),
    });
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const records: DnsRecord[] = (data.Answer || []).map((r: { name: string; type: number; TTL: number; data: string }) => ({
      name: r.name,
      type: numberToType(r.type),
      TTL: r.TTL,
      data: r.data,
    }));
    return { status: 'success', provider: provider.name, latencyMs, records };
  } catch (e) {
    return {
      status: 'error',
      provider: provider.name,
      latencyMs: Math.round(performance.now() - start),
      records: [],
      error: (e as Error).message,
    };
  }
}

export function DnsInspector() {
  const [domain, setDomain] = useState('cloudflare.com');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['A', 'AAAA', 'MX']);
  const [results, setResults] = useState<DnsResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queried, setQueried] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleQuery = async (targetDomain?: string) => {
    const d = (targetDomain || domain).trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!d) return;
    setIsLoading(true);
    setResults([]);
    setQueried(d);

    const allResults: DnsResponse[] = [];
    for (const type of selectedTypes) {
      for (const provider of DOH_PROVIDERS) {
        const r = await queryDoh(d, type, provider);
        allResults.push({ ...r, provider: `${provider.name} · ${type}` });
      }
    }
    setResults(allResults);
    setIsLoading(false);
  };

  const toggleType = (t: string) => {
    setSelectedTypes(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  // Group records by type
  const byType: Record<string, DnsRecord[]> = {};
  results.forEach(r =>
    r.records.forEach(rec => {
      if (!byType[rec.type]) byType[rec.type] = [];
      if (!byType[rec.type].some(existing => existing.data === rec.data)) {
        byType[rec.type].push(rec);
      }
    })
  );

  const successResults = results.filter(r => r.status === 'success');
  const avgLatency = successResults.length > 0
    ? Math.round(successResults.reduce((acc, r) => acc + r.latencyMs, 0) / successResults.length)
    : null;

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────── */}
      <div>
        <h2 className="font-serif font-bold text-2xl text-[#0D0D0D]">DNS-over-HTTPS Inspector</h2>
        <p className="text-xs text-[#8C8680] mt-0.5">
          Live encrypted DNS resolution (RFC 8484) comparing Cloudflare 1.1.1.1 and Google 8.8.8.8 in real time.
        </p>
      </div>

      {/* ── Query Bar ─────────────────────────── */}
      <div className="card p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-[#8C8680] uppercase tracking-wider mb-2">
            Target Hostname / Domain
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Input Group with cleanly separated Icon and Input */}
            <div className="flex-1 flex items-center gap-3 bg-white border border-[#E2DDD5] rounded-xl px-3.5 py-2.5 focus-within:border-[#C1121F] focus-within:ring-2 focus-within:ring-[#C1121F]/15 transition-all">
              <Globe className="w-4 h-4 text-[#8C8680] shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent border-none outline-none font-mono text-sm text-[#0D0D0D] placeholder:text-[#8C8680]"
                placeholder="e.g. cloudflare.com, github.com"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuery()}
              />
            </div>

            <button
              onClick={() => handleQuery()}
              disabled={!domain.trim() || isLoading}
              className="btn-primary sm:w-auto w-full py-2.5 px-6 text-sm"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 anim-spin" /> : <Search className="w-4 h-4" />}
              {isLoading ? 'Resolving…' : 'Inspect Records'}
            </button>
          </div>

          {/* Quick Preset Domains */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-xs text-[#8C8680] font-medium">Quick inspect:</span>
            {POPULAR_DOMAINS.map(d => (
              <button
                key={d}
                onClick={() => {
                  setDomain(d);
                  handleQuery(d);
                }}
                className="text-xs text-[#5C5650] hover:text-[#C1121F] hover:bg-[#F4F0E8] font-mono px-2 py-0.5 rounded-md transition-colors"
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Record Type Filters */}
        <div className="pt-2 border-t border-[#F0ECE4]">
          <label className="block text-[11px] font-bold text-[#8C8680] uppercase tracking-wider mb-2">
            Record Query Types
          </label>
          <div className="flex flex-wrap gap-2">
            {RECORD_TYPES.map(t => {
              const isSelected = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    isSelected
                      ? 'bg-[#C1121F] text-white border-[#C1121F] shadow-xs'
                      : 'bg-white text-[#5C5650] border-[#E2DDD5] hover:border-[#CDC7BC]'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Loading State ─────────────────────── */}
      {isLoading && (
        <div className="card p-10 text-center">
          <div className="w-8 h-8 border-3 border-[#C1121F] border-t-transparent rounded-full anim-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0D0D0D]">Traversing Anycast DoH Resolvers…</p>
          <p className="text-xs text-[#8C8680] mt-1 font-mono">Querying Cloudflare 1.1.1.1 & Google 8.8.8.8 over TLS 1.3</p>
        </div>
      )}

      {/* ── Query Results ─────────────────────── */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-4 anim-slideup">

          {/* Telemetry Header */}
          <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#C1121F]" />
              <span className="font-mono font-bold text-base text-[#0D0D0D]">{queried}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#8C8680]">
              <span>{Object.keys(byType).length} record types returned</span>
              <span className="w-px h-3.5 bg-[#E2DDD5]" />
              {avgLatency !== null && (
                <span>
                  Avg DoH Round-Trip: <strong className="font-mono text-[#0D0D0D]">{avgLatency}ms</strong>
                </span>
              )}
            </div>
          </div>

          {/* Resolved Records Groups */}
          {Object.keys(byType).length === 0 ? (
            <div className="card p-8 text-center text-sm text-[#8C8680]">
              No DNS records of requested types found for {queried}.
            </div>
          ) : (
            Object.entries(byType).map(([type, records]) => (
              <div key={type} className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-[#F8F6F0] border-b border-[#E8E3DA]">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${TYPE_COLORS[type] || 'badge-gray'}`}>{type} RECORD</span>
                    <span className="text-xs text-[#8C8680]">
                      {records.length} result{records.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[#F0ECE4]">
                  {records.map((rec, i) => (
                    <div key={i} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FDFDFB] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm font-semibold text-[#0D0D0D] break-all">{rec.data}</div>
                        <div className="text-xs text-[#8C8680] mt-0.5">{rec.name}</div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-mono text-[#8C8680] bg-[#F4F0E8] px-2 py-0.5 rounded">
                          TTL: {rec.TTL}s
                        </span>
                        <button
                          onClick={() => copyToClipboard(rec.data, i)}
                          className="btn-ghost text-xs py-1 px-2.5 flex items-center gap-1"
                          title="Copy record data"
                        >
                          {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[11px]">{copiedIdx === i ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Provider Benchmark Comparison */}
          <div className="card p-5">
            <h3 className="font-serif font-bold text-sm text-[#0D0D0D] mb-3">DoH Resolver Benchmark Comparison</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOH_PROVIDERS.map(p => {
                const pResults = results.filter(r => r.provider.startsWith(p.name));
                const successCount = pResults.filter(r => r.status === 'success').length;
                const avgMs = pResults.length > 0
                  ? Math.round(pResults.reduce((a, r) => a + r.latencyMs, 0) / pResults.length)
                  : 0;

                return (
                  <div key={p.name} className="flex items-center justify-between bg-[#F8F6F0] border border-[#E8E3DA] rounded-xl p-3.5">
                    <div className="flex items-center gap-2.5">
                      {successCount > 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span className="text-xs font-bold text-[#0D0D0D]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#0D0D0D]">
                      <Clock className="w-3.5 h-3.5 text-[#8C8680]" />
                      {avgMs} ms
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
