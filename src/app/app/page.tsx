'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Zap, Globe, Calculator, Layers, GitMerge, Shield, ArrowLeft } from 'lucide-react';

import dynamic from 'next/dynamic';

const SpeedLab = dynamic(() => import('@/components/tabs/SpeedLab').then(m => m.SpeedLab), { ssr: false });
const DnsInspector = dynamic(() => import('@/components/tabs/DnsInspector').then(m => m.DnsInspector), { ssr: false });
const SubnetCalculator = dynamic(() => import('@/components/tabs/SubnetCalculator').then(m => m.SubnetCalculator), { ssr: false });
const PacketJourney = dynamic(() => import('@/components/tabs/PacketJourney').then(m => m.PacketJourney), { ssr: false });
const ProtocolPlayground = dynamic(() => import('@/components/tabs/ProtocolPlayground').then(m => m.ProtocolPlayground), { ssr: false });
const FirewallSimulator = dynamic(() => import('@/components/tabs/FirewallSimulator').then(m => m.FirewallSimulator), { ssr: false });

const TABS = [
  { id: 'speed',    label: 'Speed Lab',           layer: 'L4 Transport',        icon: Zap        },
  { id: 'dns',      label: 'DNS Inspector',        layer: 'L7 Application',      icon: Globe      },
  { id: 'subnet',   label: 'Subnet Calculator',    layer: 'L3 Network',          icon: Calculator },
  { id: 'packet',   label: 'Packet Journey',       layer: 'OSI 7 Layers',        icon: Layers     },
  { id: 'protocol', label: 'Protocol Playground',  layer: 'Transport & App',     icon: GitMerge   },
  { id: 'firewall', label: 'Firewall Simulator',   layer: 'Network Security',    icon: Shield     },
] as const;

type TabId = typeof TABS[number]['id'];

function TabContent({ id }: { id: TabId }) {
  switch (id) {
    case 'speed':    return <SpeedLab />;
    case 'dns':      return <DnsInspector />;
    case 'subnet':   return <SubnetCalculator />;
    case 'packet':   return <PacketJourney />;
    case 'protocol': return <ProtocolPlayground />;
    case 'firewall': return <FirewallSimulator />;
  }
}

function AppContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as TabId;
  const active: TabId = TABS.some(t => t.id === tabParam) ? tabParam : 'speed';

  const activeTab = TABS.find(t => t.id === active) || TABS[0];
  const ActiveIcon = activeTab.icon;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7]">

      {/* ── Top Bar ────────────────────────────── */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#E2DDD5] bg-[#FAFAF7]/95 backdrop-blur-md flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Left: Back + Brand Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5C5650] hover:text-[#0D0D0D] transition-colors py-1 px-2 rounded-lg hover:bg-[#F4F0E8]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <div className="w-px h-4 bg-[#CDC7BC]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C1121F] flex items-center justify-center shadow-xs">
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-serif font-bold text-lg text-[#0D0D0D] tracking-tight">
                Swift<span className="text-[#C1121F]">Net</span>
              </span>
            </div>
          </div>

          {/* Center: Active Tool Title Badge — ALWAYS visible & high-contrast */}
          <div className="flex items-center gap-2 bg-white border border-[#CDC7BC] px-3.5 py-1.5 rounded-full shadow-xs">
            <ActiveIcon className="w-4 h-4 text-[#C1121F] shrink-0" />
            <span className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
              {activeTab.label}
            </span>
            <span className="hidden md:inline text-[10px] text-[#8C8680] font-mono border-l border-[#E2DDD5] pl-2">
              {activeTab.layer}
            </span>
          </div>

          {/* Right: Live Real Engine Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#5C5650] bg-white border border-[#E2DDD5] px-3 py-1.5 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Real Network Engine</span>
            <span className="sm:hidden">Live</span>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation Strip ───────────────── */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2DDD5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div role="tablist" className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  onClick={() => router.replace(`/app?tab=${tab.id}`, { scroll: false })}
                  className={`tab-btn ${isActive ? 'active' : 'inactive'}`}
                  aria-selected={isActive}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Tab Workspace ──────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div key={active} className="anim-fadeup">
          <TabContent id={active} />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="border-t border-[#E2DDD5] bg-[#FAFAF7] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8C8680]">
          <div className="flex items-center gap-2 font-medium text-[#5C5650]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C1121F]" />
            SwiftNet Diagnostics Suite
          </div>
          <div className="font-mono">
            100% Real HTTP/TCP Multi-Stream Measurements · Zero Simulated Data
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#C1121F] border-t-transparent rounded-full anim-spin" />
          <span className="text-xs font-semibold text-[#5C5650]">Loading SwiftNet Suite…</span>
        </div>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
