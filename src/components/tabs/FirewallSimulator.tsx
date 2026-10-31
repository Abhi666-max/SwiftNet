'use client';

import React, { useState } from 'react';
import { Shield, Plus, Trash2, Play, CheckCircle2, XCircle, ArrowUp, ArrowDown, X } from 'lucide-react';

type Action = 'ALLOW' | 'DENY';
type Protocol = 'TCP' | 'UDP' | 'ICMP' | 'ANY';
type Direction = 'INBOUND' | 'OUTBOUND' | 'ANY';

interface Rule {
  id: string;
  priority: number;
  action: Action;
  protocol: Protocol;
  srcIp: string;
  dstIp: string;
  port: string;
  direction: Direction;
  description: string;
}

interface TrafficPacket {
  id: string;
  protocol: Protocol;
  srcIp: string;
  dstIp: string;
  port: string;
  direction: Direction;
  description: string;
}

interface MatchResult {
  allowed: boolean;
  matchedRule: Rule | null;
  reason: string;
  checkedRules: { rule: Rule; matched: boolean }[];
}

function matchesIp(ruleIp: string, packetIp: string): boolean {
  if (ruleIp === '*' || ruleIp === 'ANY' || !ruleIp) return true;
  if (ruleIp === packetIp) return true;
  if (ruleIp.includes('/')) {
    try {
      const [network, prefixStr] = ruleIp.split('/');
      const prefix = parseInt(prefixStr);
      const ipToNum = (ip: string) => ip.split('.').reduce((acc, o) => (acc << 8) | parseInt(o), 0) >>> 0;
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      return (ipToNum(network) & mask) === (ipToNum(packetIp) & mask);
    } catch {
      return false;
    }
  }
  return false;
}

function matchesPort(rulePort: string, packetPort: string): boolean {
  if (rulePort === '*' || rulePort === 'ANY' || !rulePort) return true;
  if (rulePort === packetPort) return true;
  if (rulePort.includes('-')) {
    const [min, max] = rulePort.split('-').map(Number);
    const p = parseInt(packetPort);
    return p >= min && p <= max;
  }
  return false;
}

function evaluateRules(rules: Rule[], packet: TrafficPacket): MatchResult {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  const checkedRules: { rule: Rule; matched: boolean }[] = [];

  for (const rule of sorted) {
    const ipMatch = matchesIp(rule.srcIp, packet.srcIp) && matchesIp(rule.dstIp, packet.dstIp);
    const portMatch = matchesPort(rule.port, packet.port);
    const protoMatch = rule.protocol === 'ANY' || rule.protocol === packet.protocol;
    const dirMatch = rule.direction === 'ANY' || rule.direction === packet.direction;
    const matched = ipMatch && portMatch && protoMatch && dirMatch;

    checkedRules.push({ rule, matched });

    if (matched) {
      return {
        allowed: rule.action === 'ALLOW',
        matchedRule: rule,
        reason: `Matched Rule #${rule.priority} ("${rule.description}") → Action: ${rule.action}`,
        checkedRules,
      };
    }
  }

  return {
    allowed: false,
    matchedRule: null,
    reason: 'Zero matching ACL rules found → Evaluated to Default Security Policy: DENY ALL',
    checkedRules,
  };
}

const DEFAULT_RULES: Rule[] = [
  { id: '1', priority: 10, action: 'ALLOW', protocol: 'TCP', srcIp: '*', dstIp: '*', port: '80', direction: 'INBOUND', description: 'Allow Inbound HTTP Web Traffic' },
  { id: '2', priority: 20, action: 'ALLOW', protocol: 'TCP', srcIp: '*', dstIp: '*', port: '443', direction: 'INBOUND', description: 'Allow Secure HTTPS Web Traffic' },
  { id: '3', priority: 30, action: 'DENY',  protocol: 'TCP', srcIp: '*', dstIp: '*', port: '23', direction: 'ANY', description: 'Block Unencrypted Telnet' },
  { id: '4', priority: 40, action: 'DENY',  protocol: 'TCP', srcIp: '*', dstIp: '*', port: '21', direction: 'INBOUND', description: 'Block Inbound FTP Control' },
  { id: '5', priority: 50, action: 'ALLOW', protocol: 'UDP', srcIp: '*', dstIp: '*', port: '53', direction: 'ANY', description: 'Allow DNS Name Resolution' },
  { id: '6', priority: 60, action: 'ALLOW', protocol: 'ICMP', srcIp: '192.168.0.0/24', dstIp: '*', port: '*', direction: 'ANY', description: 'Allow LAN ICMP Ping' },
  { id: '7', priority: 70, action: 'DENY',  protocol: 'ANY', srcIp: '10.0.0.0/8', dstIp: '*', port: '*', direction: 'INBOUND', description: 'Block Spoofed Private Range Inbound' },
];

const PRESET_PACKETS: TrafficPacket[] = [
  { id: 'p1', protocol: 'TCP', srcIp: '203.0.113.5', dstIp: '192.168.1.100', port: '443', direction: 'INBOUND', description: 'Standard HTTPS Web Request' },
  { id: 'p2', protocol: 'TCP', srcIp: '45.33.32.156', dstIp: '192.168.1.1', port: '23', direction: 'INBOUND', description: 'Malicious Telnet Port 23 Probe' },
  { id: 'p3', protocol: 'UDP', srcIp: '192.168.1.5', dstIp: '1.1.1.1', port: '53', direction: 'OUTBOUND', description: 'Outbound DNS Query' },
  { id: 'p4', protocol: 'TCP', srcIp: '10.0.0.5', dstIp: '192.168.1.1', port: '8080', direction: 'INBOUND', description: 'Rogue Internal Port 8080 Probe' },
];

export function FirewallSimulator() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [activePacket, setActivePacket] = useState<TrafficPacket>(PRESET_PACKETS[0]);
  const [testResult, setTestResult] = useState<MatchResult | null>(() => evaluateRules(DEFAULT_RULES, PRESET_PACKETS[0]));
  const [showAddModal, setShowAddModal] = useState(false);

  // New Rule Form State
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    action: 'ALLOW',
    protocol: 'TCP',
    direction: 'INBOUND',
    srcIp: '*',
    dstIp: '*',
    port: '8080',
    description: 'Custom Proxy Service',
  });

  const runTest = (packet: TrafficPacket) => {
    setActivePacket(packet);
    const res = evaluateRules(rules, packet);
    setTestResult(res);
  };

  const deleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    if (activePacket) setTestResult(evaluateRules(updated, activePacket));
  };

  const moveRule = (id: string, dir: 'up' | 'down') => {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex(r => r.id === id);
    if (dir === 'up' && idx > 0) {
      const temp = sorted[idx].priority;
      sorted[idx].priority = sorted[idx - 1].priority;
      sorted[idx - 1].priority = temp;
    } else if (dir === 'down' && idx < sorted.length - 1) {
      const temp = sorted[idx].priority;
      sorted[idx].priority = sorted[idx + 1].priority;
      sorted[idx + 1].priority = temp;
    }
    const finalRules = [...sorted].sort((a, b) => a.priority - b.priority);
    setRules(finalRules);
    if (activePacket) setTestResult(evaluateRules(finalRules, activePacket));
  };

  const addRule = () => {
    if (!newRule.description || !newRule.port) return;
    const maxPriority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) : 0;
    const createdRule: Rule = {
      id: Date.now().toString(),
      priority: maxPriority + 10,
      action: newRule.action || 'ALLOW',
      protocol: newRule.protocol || 'TCP',
      direction: newRule.direction || 'INBOUND',
      srcIp: newRule.srcIp || '*',
      dstIp: newRule.dstIp || '*',
      port: newRule.port || '*',
      description: newRule.description || 'Custom Rule',
    };
    const updated = [...rules, createdRule].sort((a, b) => a.priority - b.priority);
    setRules(updated);
    setShowAddModal(false);
    if (activePacket) setTestResult(evaluateRules(updated, activePacket));
  };

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#0D0D0D]">Firewall ACL Rule Engine</h2>
          <p className="text-xs text-[#8C8680] mt-0.5">
            Test packet filtering against ordered Access Control Lists (First-match wins, default DENY ALL).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs py-2 px-4 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add ACL Rule</span>
        </button>
      </div>

      {/* ── Top Section: Live Packet Tester & Instant Decision ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Left (7 Cols): Packet Injection Console */}
        <div className="lg:col-span-7 card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#8C8680] uppercase tracking-wider">
                Select Packet to Inject Through Firewall
              </span>
              <span className="text-xs font-mono text-[#C1121F] font-semibold">
                Click Any Packet Below
              </span>
            </div>

            {/* 4 Preset Clickable Packets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_PACKETS.map(p => {
                const isSelected = activePacket.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => runTest(p)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#C1121F] bg-[#FDF2F3] shadow-sm ring-1 ring-[#C1121F]/20'
                        : 'border-[#E2DDD5] bg-[#F8F6F0] hover:border-[#CDC7BC]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`badge ${p.protocol === 'TCP' ? 'badge-blue' : 'badge-yellow'}`}>
                        {p.protocol} · Port {p.port}
                      </span>
                      <Play className={`w-3 h-3 ${isSelected ? 'text-[#C1121F] fill-[#C1121F]' : 'text-[#8C8680]'}`} />
                    </div>
                    <div className="text-xs font-bold text-[#0D0D0D] truncate">{p.description}</div>
                    <div className="font-mono text-[10px] text-[#8C8680] mt-0.5 truncate">
                      {p.srcIp} → {p.dstIp} ({p.direction})
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Packet Input Form */}
          <div className="pt-3 border-t border-[#F0ECE4]">
            <div className="text-[10px] font-bold text-[#8C8680] uppercase tracking-wider mb-2">
              Or Inject Custom Packet
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="SRC IP (e.g. 192.168.1.50)"
                value={activePacket.srcIp}
                onChange={e => {
                  const updated = { ...activePacket, id: 'custom', srcIp: e.target.value };
                  runTest(updated);
                }}
                className="bg-white border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#C1121F]"
              />
              <input
                type="text"
                placeholder="Port (e.g. 80, 23)"
                value={activePacket.port}
                onChange={e => {
                  const updated = { ...activePacket, id: 'custom', port: e.target.value };
                  runTest(updated);
                }}
                className="bg-white border border-[#E2DDD5] rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#C1121F]"
              />
              <select
                value={activePacket.protocol}
                onChange={e => {
                  const updated = { ...activePacket, id: 'custom', protocol: e.target.value as Protocol };
                  runTest(updated);
                }}
                className="bg-white border border-[#E2DDD5] rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:border-[#C1121F]"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
              <button
                onClick={() => runTest(activePacket)}
                className="btn-primary text-xs py-1.5 px-3 w-full"
              >
                Inject Packet
              </button>
            </div>
          </div>
        </div>

        {/* Right (5 Cols): Instant Decision Display */}
        <div className="lg:col-span-5 card p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#8C8680] uppercase tracking-wider block mb-2">
              Firewall Inspection Verdict
            </span>

            {testResult && (
              <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
                testResult.allowed ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'
              }`}>
                {testResult.allowed ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className={`font-serif font-extrabold text-xl ${
                    testResult.allowed ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {testResult.allowed ? 'TRAFFIC ALLOWED' : 'TRAFFIC BLOCKED'}
                  </div>
                  <div className={`text-xs font-medium mt-0.5 ${
                    testResult.allowed ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {testResult.reason}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Packet Details Inspected */}
          <div className="mt-3 bg-[#F8F6F0] border border-[#E8E3DA] rounded-xl p-3 font-mono text-[11px] text-[#5C5650] space-y-1">
            <div className="flex justify-between">
              <span>Protocol: <strong className="text-[#0D0D0D]">{activePacket.protocol}</strong></span>
              <span>Target Port: <strong className="text-[#0D0D0D]">{activePacket.port}</strong></span>
            </div>
            <div className="flex justify-between text-[#8C8680]">
              <span>Src: {activePacket.srcIp}</span>
              <span>Dst: {activePacket.dstIp}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Active ACL Ruleset Table ───────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F8F6F0] border-b border-[#E8E3DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#C1121F]" />
            <span className="font-serif font-bold text-sm text-[#0D0D0D]">
              Active Access Control List ({rules.length} Rules)
            </span>
          </div>
          <span className="text-xs text-[#8C8680] font-mono">
            Evaluated Top to Bottom · First Match Applies
          </span>
        </div>

        <div className="divide-y divide-[#F0ECE4]">
          {rules.map((rule, idx) => {
            const isHit = testResult?.matchedRule?.id === rule.id;
            return (
              <div
                key={rule.id}
                className={`px-5 py-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                  isHit
                    ? 'bg-[#FDF2F3] border-l-4 border-[#C1121F]'
                    : 'hover:bg-[#FAF8F4] border-l-4 border-transparent'
                }`}
              >
                {/* Priority & Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-[#8C8680] w-6">#{rule.priority}</span>
                  <span className={`badge ${rule.action === 'ALLOW' ? 'badge-green' : 'badge-red'}`}>
                    {rule.action}
                  </span>
                  <span className="font-mono font-bold text-[#0D0D0D] w-12">{rule.protocol}</span>
                </div>

                {/* Ports & IPs */}
                <div className="flex-1 min-w-0 font-mono text-[11px] text-[#5C5650] truncate">
                  Port: <span className="font-bold text-[#0D0D0D]">{rule.port}</span> · Src: {rule.srcIp} ({rule.description})
                </div>

                {/* Hit Badge */}
                {isHit && (
                  <span className="badge badge-crimson text-[10px] font-bold shrink-0">
                    MATCHED &amp; EXECUTED
                  </span>
                )}

                {/* Actions: Move Up / Down / Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveRule(rule.id, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-[#EAE5DC] text-[#8C8680] disabled:opacity-30"
                    title="Increase Priority"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveRule(rule.id, 'down')}
                    disabled={idx === rules.length - 1}
                    className="p-1 rounded hover:bg-[#EAE5DC] text-[#8C8680] disabled:opacity-30"
                    title="Decrease Priority"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1 rounded hover:bg-rose-100 text-[#8C8680] hover:text-rose-600 transition-colors ml-1"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Default Security Fallback */}
        <div className="px-5 py-3 bg-[#F8F6F0] border-t border-[#E8E3DA] flex items-center justify-between text-xs">
          <span className="text-[#8C8680] font-mono">Implicit Bottom Rule:</span>
          <span className="badge badge-red font-mono text-[10px]">DEFAULT POLICY: DENY ALL</span>
        </div>
      </div>

      {/* ── Add Rule Modal ───────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 anim-fadeup">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
              <h3 className="font-serif font-bold text-base text-[#0D0D0D]">Add New Firewall ACL Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#8C8680] hover:text-[#0D0D0D]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#8C8680] uppercase tracking-wider block mb-1">Action</label>
                <select
                  value={newRule.action}
                  onChange={e => setNewRule(r => ({ ...r, action: e.target.value as Action }))}
                  className="w-full bg-[#F8F6F0] border border-[#E2DDD5] rounded-lg p-2 font-semibold text-xs outline-none"
                >
                  <option value="ALLOW">ALLOW</option>
                  <option value="DENY">DENY</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#8C8680] uppercase tracking-wider block mb-1">Protocol</label>
                  <select
                    value={newRule.protocol}
                    onChange={e => setNewRule(r => ({ ...r, protocol: e.target.value as Protocol }))}
                    className="w-full bg-[#F8F6F0] border border-[#E2DDD5] rounded-lg p-2 font-semibold text-xs outline-none"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                    <option value="ANY">ANY</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#8C8680] uppercase tracking-wider block mb-1">Port / Range</label>
                  <input
                    type="text"
                    value={newRule.port}
                    onChange={e => setNewRule(r => ({ ...r, port: e.target.value }))}
                    placeholder="e.g. 80, 443, 8000-9000"
                    className="w-full bg-[#F8F6F0] border border-[#E2DDD5] rounded-lg p-2 font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#8C8680] uppercase tracking-wider block mb-1">Source IP / CIDR</label>
                <input
                  type="text"
                  value={newRule.srcIp}
                  onChange={e => setNewRule(r => ({ ...r, srcIp: e.target.value }))}
                  placeholder="* or 192.168.1.0/24"
                  className="w-full bg-[#F8F6F0] border border-[#E2DDD5] rounded-lg p-2 font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#8C8680] uppercase tracking-wider block mb-1">Rule Description</label>
                <input
                  type="text"
                  value={newRule.description}
                  onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))}
                  placeholder="e.g. Allow Webhook Endpoint"
                  className="w-full bg-[#F8F6F0] border border-[#E2DDD5] rounded-lg p-2 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={addRule} className="btn-primary w-full py-2.5 text-xs">
                Save &amp; Activate Rule
              </button>
              <button onClick={() => setShowAddModal(false)} className="btn-ghost py-2.5 px-4 text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
