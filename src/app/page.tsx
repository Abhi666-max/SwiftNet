'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Zap, Globe, Calculator, Layers,
  GitMerge, Shield, ChevronRight, Activity, Cpu, CheckCircle2
} from 'lucide-react';

const PETALS = [
  { left: '6%',  delay: '0s',   dur: '10s' },
  { left: '19%', delay: '2.2s', dur: '12s' },
  { left: '32%', delay: '0.8s', dur: '9s'  },
  { left: '46%', delay: '3.6s', dur: '13s' },
  { left: '62%', delay: '1.4s', dur: '10s' },
  { left: '74%', delay: '2.8s', dur: '11s' },
  { left: '88%', delay: '0.5s', dur: '9.5s'},
];

const PLATFORM_TOOLS = [
  {
    id: 'speed',
    name: 'Real-Time Speed Lab',
    desc: 'Measure your actual download speed, upload speed, ping latency, and connection jitter using multi-stream TCP tests against Cloudflare global edge servers.',
    layer: 'Transport Layer · TCP/IP',
    icon: Zap,
    tag: 'Live Edge Stream',
    color: '#C1121F',
  },
  {
    id: 'dns',
    name: 'DNS-over-HTTPS Inspector',
    desc: 'Look up live DNS records (A, AAAA, MX, TXT, CNAME) over an encrypted connection. Compare results from Cloudflare 1.1.1.1 and Google 8.8.8.8 side by side.',
    layer: 'Application Layer · DoH',
    icon: Globe,
    tag: 'Encrypted Anycast',
    color: '#2563EB',
  },
  {
    id: 'subnet',
    name: 'CIDR Subnet Calculator',
    desc: 'Enter any IPv4 address with a subnet mask to instantly calculate the network range, broadcast address, usable hosts, and binary notation.',
    layer: 'Network Layer · IPv4 CIDR',
    icon: Calculator,
    tag: 'Pure Binary Math',
    color: '#059669',
  },
  {
    id: 'packet',
    name: 'Packet Journey Visualizer',
    desc: 'Watch how data travels through all 7 OSI layers — from your application down to raw bits on the wire — with headers being added at each step.',
    layer: 'OSI 7-Layer Architecture',
    icon: Layers,
    tag: 'Interactive Stack',
    color: '#7C3AED',
  },
  {
    id: 'protocol',
    name: 'Protocol Playground',
    desc: 'Visualize animated packet exchanges for TCP 3-Way Handshake, DHCP IP assignment (DORA), and connectionless UDP communication.',
    layer: 'Stateful Protocol Machine',
    icon: GitMerge,
    tag: 'Animated Flow',
    color: '#D97706',
  },
  {
    id: 'firewall',
    name: 'Firewall ACL Simulator',
    desc: 'Build and test ordered firewall rules. Choose packets by IP, port, and protocol and see instantly whether they would be allowed or blocked.',
    layer: 'Network Defense & Filtering',
    icon: Shield,
    tag: 'Security Engine',
    color: '#EA580C',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#0D0D0D]">

      {/* Floating Sakura Petals */}
      {PETALS.map((p, i) => (
        <div
          key={i}
          className="sakura"
          style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur }}
        />
      ))}

      {/* ── Fixed Navigation Bar (Never Disappears on Scroll) ──── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#E2DDD5]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-15 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#C1121F] flex items-center justify-center shadow-xs">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-serif font-bold text-xl text-[#0D0D0D] tracking-tight">
              Swift<span className="text-[#C1121F]">Net</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#5C5650]">
            <a href="#suite" className="hover:text-[#C1121F] transition-colors">Diagnostic Suite</a>
            <a href="#preview" className="hover:text-[#C1121F] transition-colors">Platform Telemetry</a>
            <a href="#architecture" className="hover:text-[#C1121F] transition-colors">Architecture</a>
          </nav>

          {/* Launch App CTA */}
          <Link href="/app">
            <button className="btn-primary text-xs py-2 px-4 shadow-sm">
              <span>Launch Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────── */}
      <section className="pt-32 pb-16 px-5 sm:px-6 max-w-5xl mx-auto text-center">
        
        {/* Sleek Enterprise SaaS Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C1121F]/25 bg-[rgba(193,18,31,0.06)] px-4 py-1.5 text-xs font-bold text-[#C1121F] uppercase tracking-wider mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C1121F] anim-pulse-red inline-block" />
          <span>SwiftNet Enterprise · Next-Gen Network Diagnostics</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif font-extrabold text-[clamp(2.5rem,5.5vw,4.5rem)] text-[#0D0D0D] leading-[1.08] mb-6 tracking-tight">
          Inspect, simulate, and verify<br />
          <span className="text-[#C1121F]">your network in real time.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-[#5C5650] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          A professional network diagnostics suite — test your internet speed, inspect DNS records,
          visualize packet flow through OSI layers, simulate protocol handshakes, and build firewall rules.
          All in real time, no login required.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/app">
            <button className="btn-primary text-sm px-8 py-3.5 shadow-md">
              <Zap className="w-4 h-4 fill-white" />
              <span>Start Live Diagnostics</span>
            </button>
          </Link>
          <a href="#suite">
            <button className="btn-ghost text-sm px-6 py-3.5">
              <span>Explore All 6 Tools</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </a>
        </div>
      </section>

      {/* ── High-End Interactive SaaS Live Telemetry Card (Replaces 6 7 0 stats) ── */}
      <section id="preview" className="max-w-5xl mx-auto px-5 sm:px-6 pb-20">
        <div className="card overflow-hidden shadow-xl border-[#CDC7BC]">
          
          {/* Console Header Bar */}
          <div className="px-5 py-3 bg-[#0D0D0D] text-[#FAFAF7] flex items-center justify-between border-b border-[#2D2D2D]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-mono text-xs text-[#8C8680] ml-2">swiftnet-telemetry-engine v1.0</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Anycast Edge Online</span>
            </div>
          </div>

          {/* Console Interior Mockup */}
          <div className="p-6 bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] text-[#FAFAF7] grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Live Throughput Gauge Preview */}
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8C8680]">
                <span>TCP EDGE THROUGHPUT</span>
                <Activity className="w-3.5 h-3.5 text-[#C1121F]" />
              </div>
              <div className="font-mono font-extrabold text-3xl text-white">
                348.6 <span className="text-xs text-[#8C8680] font-normal">Mbps</span>
              </div>
              <div className="w-full bg-[#333333] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#C1121F] h-full w-[72%]" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#8C8680] pt-1">
                <span>Latency: 18ms</span>
                <span>Jitter: 1.2ms</span>
              </div>
            </div>

            {/* DoH Security Resolution */}
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8C8680]">
                <span>DOH ANYCAST RESOLVER</span>
                <Globe className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="font-mono font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                TLS 1.3 DNS-over-HTTPS
              </div>
              <div className="font-mono text-xs text-[#CDC7BC] bg-[#1A1A1A] p-2 rounded border border-[#333333] truncate">
                104.16.12.5 (Cloudflare 1.1.1.1)
              </div>
              <div className="text-[10px] text-[#8C8680]">Response Time: 12ms · Zero Inspection Leaks</div>
            </div>

            {/* Protocol Inspection Engine */}
            <div className="bg-[#242424] border border-[#333333] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8C8680]">
                <span>ACTIVE STATE MACHINE</span>
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="font-mono font-bold text-sm text-white">
                TCP Handshake · L4
              </div>
              <div className="font-mono text-xs text-[#8C8680] bg-[#1A1A1A] p-2 rounded border border-[#333333]">
                SYN → SYN-ACK → ACK [ESTABLISHED]
              </div>
              <div className="text-[10px] text-[#8C8680]">Full Duplex Bidirectional Stream</div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Diagnostic Suite Grid ───────────────────── */}
      <section id="suite" className="max-w-6xl mx-auto px-5 sm:px-6 py-16 border-t border-[#E2DDD5]">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#C1121F] mb-1">
            Engineered Tools
          </div>
          <h2 className="font-serif font-bold text-3xl text-[#0D0D0D]">
            Precision Network Utilities
          </h2>
          <p className="text-xs text-[#5C5650] mt-1.5">
            Real measurements, pure RFC-compliant arithmetic, and zero synthetic estimates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_TOOLS.map(t => {
            const Icon = t.icon;
            return (
              <Link href={`/app?tab=${t.id}`} key={t.id} className="group">
                <div className="card card-hover p-6 h-full flex flex-col justify-between border-[#E2DDD5] hover:border-[#C1121F] transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F4F0E8] flex items-center justify-center text-[#C1121F] group-hover:bg-[#C1121F] group-hover:text-white transition-all shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C8680] bg-[#F4F0E8] px-2 py-0.5 rounded">
                        {t.tag}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-[#0D0D0D] mb-1 group-hover:text-[#C1121F] transition-colors">
                      {t.name}
                    </h3>
                    <div className="font-mono text-[10px] text-[#8C8680] mb-2.5">
                      {t.layer}
                    </div>
                    <p className="text-xs text-[#5C5650] leading-relaxed">
                      {t.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs font-semibold text-[#0D0D0D] group-hover:text-[#C1121F] transition-colors">
                    <span>Open Diagnostic Tool</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Architecture Section ────────────────────── */}
      <section id="architecture" className="border-t border-[#E2DDD5] bg-white py-16 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#C1121F] mb-1">
              Zero Accounts · Zero Tracking
            </div>
            <h2 className="font-serif font-bold text-3xl text-[#0D0D0D] mb-4">
              Real telemetry. Ephemeral execution.
            </h2>
            <p className="text-xs text-[#5C5650] leading-relaxed mb-4">
              SwiftNet runs all measurements directly against live public servers.
              No accounts, no cookies, no data stored. Every test result is computed fresh,
              in your browser, in real time.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0D0D0D]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-stream download testing (up to 20MB chunks) for accurate ISP throughput</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0D0D0D]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Encrypted DNS queries sent directly to Cloudflare and Google resolvers</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0D0D0D]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pure binary subnet math with full IPv4 CIDR calculation</span>
              </div>
            </div>
          </div>

        <div className="bg-[#FAF8F4] border border-[#E2DDD5] rounded-2xl p-6 space-y-3 font-mono text-xs text-[#5C5650]">
            <div className="text-[#0D0D0D] font-bold pb-2 border-b border-[#E2DDD5]">
              How SwiftNet Works
            </div>
            <div>[Your Browser] → Next.js 15 App Router</div>
            <div>[Speed Test] → Cloudflare Global Edge Network</div>
            <div>[DNS Lookup] → Encrypted TLS 1.3 DoH Resolver</div>
            <div>[Firewall ACL] → Stateless First-Match Rule Engine</div>
            <div className="pt-2 text-[11px] text-[#C1121F] font-semibold">
              Status: 100% Operational · No Accounts · No Tracking
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-[#E2DDD5] bg-[#FAFAF7] py-6 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8C8680]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#C1121F] flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white fill-white" />
            </div>
            <span className="font-serif font-bold text-sm text-[#0D0D0D]">
              Swift<span className="text-[#C1121F]">Net</span>
            </span>
            <span>— Advanced Network Telemetry Platform</span>
          </div>

          <div className="font-mono text-[11px]">
            100% Real HTTP/TCP Telemetry · Zero Mock Data
          </div>
        </div>
      </footer>

    </div>
  );
}
