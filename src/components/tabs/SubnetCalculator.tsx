'use client';

import React, { useState, useCallback } from 'react';
import { Calculator, Info, AlertCircle } from 'lucide-react';

interface SubnetResult {
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  subnetMask: string;
  subnetMaskBinary: string;
  ipBinary: string;
  networkBinary: string;
  broadcastBinary: string;
  ipClass: string;
  isPrivate: boolean;
  wildcardMask: string;
  cidrNotation: string;
  numSubnets: number;
}

function ipToBinary(ip: string): string {
  return ip.split('.').map(o => parseInt(o).toString(2).padStart(8, '0')).join('.');
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet), 0) >>> 0;
}

function longToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

function getIpClass(ip: string): string {
  const first = parseInt(ip.split('.')[0]);
  if (first >= 1 && first <= 126) return 'Class A';
  if (first === 127) return 'Class A (Loopback)';
  if (first >= 128 && first <= 191) return 'Class B';
  if (first >= 192 && first <= 223) return 'Class C';
  if (first >= 224 && first <= 239) return 'Class D (Multicast)';
  return 'Class E (Reserved)';
}

function isPrivateIp(ip: string): boolean {
  const n = ipToLong(ip);
  return (
    (n >= ipToLong('10.0.0.0') && n <= ipToLong('10.255.255.255')) ||
    (n >= ipToLong('172.16.0.0') && n <= ipToLong('172.31.255.255')) ||
    (n >= ipToLong('192.168.0.0') && n <= ipToLong('192.168.255.255'))
  );
}

function calculateSubnet(ip: string, prefix: number): SubnetResult | null {
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return null;
  const parts = ip.split('.').map(Number);
  if (parts.some(p => p < 0 || p > 255)) return null;
  if (prefix < 0 || prefix > 32) return null;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const ipLong = ipToLong(ip);
  const networkLong = (ipLong & mask) >>> 0;
  const broadcastLong = (networkLong | (~mask >>> 0)) >>> 0;

  const subnetMask = longToIp(mask);
  const wildcardMask = longToIp(~mask >>> 0);
  const networkAddress = longToIp(networkLong);
  const broadcastAddress = longToIp(broadcastLong);
  const firstHost = prefix < 31 ? longToIp(networkLong + 1) : networkAddress;
  const lastHost = prefix < 31 ? longToIp(broadcastLong - 1) : broadcastAddress;
  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix < 31 ? Math.max(0, totalHosts - 2) : totalHosts;
  const maskBin = mask.toString(2).padStart(32, '0');
  const subnetMaskBinary = [maskBin.slice(0, 8), maskBin.slice(8, 16), maskBin.slice(16, 24), maskBin.slice(24)].join('.');

  return {
    networkAddress, broadcastAddress, firstHost, lastHost,
    totalHosts, usableHosts, subnetMask, wildcardMask,
    subnetMaskBinary,
    ipBinary: ipToBinary(ip),
    networkBinary: ipToBinary(networkAddress),
    broadcastBinary: ipToBinary(broadcastAddress),
    ipClass: getIpClass(ip),
    isPrivate: isPrivateIp(ip),
    cidrNotation: `${networkAddress}/${prefix}`,
    numSubnets: Math.pow(2, prefix),
  };
}

function BinaryDisplay({ binary, prefix }: { binary: string; prefix: number }) {
  return (
    <div className="font-mono text-xs leading-relaxed flex flex-wrap gap-0">
      {binary.split('.').map((octet, oi) => (
        <React.Fragment key={oi}>
          {oi > 0 && <span className="text-stone-300 mx-0.5">.</span>}
          {octet.split('').map((bit, bi) => {
            const globalIdx = oi * 8 + bi;
            const isNetwork = globalIdx < prefix;
            return (
              <span key={bi} className={`${isNetwork ? 'text-crimson-DEFAULT font-bold' : 'text-stone-400'}`}>
                {bit}
              </span>
            );
          })}
        </React.Fragment>
      ))}
      <span className="ml-2 text-stone-300 text-[10px]">
        ({prefix} network bits | {32 - prefix} host bits)
      </span>
    </div>
  );
}

export function SubnetCalculator() {
  const [ip, setIp] = useState('192.168.1.100');
  const [prefix, setPrefix] = useState(24);
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = useCallback(() => {
    setError('');
    const r = calculateSubnet(ip.trim(), prefix);
    if (!r) {
      setError('Invalid IP address or prefix length. Please check your input.');
      setResult(null);
    } else {
      setResult(r);
    }
  }, [ip, prefix]);

  const PRESETS = [
    { label: 'Class A /8', ip: '10.0.0.1', prefix: 8 },
    { label: 'Class B /16', ip: '172.16.5.30', prefix: 16 },
    { label: 'Class C /24', ip: '192.168.1.100', prefix: 24 },
    { label: 'VLSM /26', ip: '192.168.10.65', prefix: 26 },
    { label: 'Host /30', ip: '10.0.0.1', prefix: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif font-bold text-2xl text-ink-400">Subnet Calculator</h2>
        <p className="text-sm text-stone-400 mt-0.5">IPv4 CIDR subnetting with binary notation — Network Layer</p>
      </div>

      {/* CN Concept */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-700">
          <span className="font-semibold">CN Concept: </span>
          Subnetting divides a large network (Network Layer, OSI Layer 3) into smaller logical segments. The prefix length <span className="font-mono">/n</span> defines how many bits are the <span className="font-semibold text-crimson-DEFAULT">network portion</span> (red). Remaining bits are the host portion. Network Address = IP AND Subnet Mask (bitwise AND).
        </div>
      </div>

      {/* Input Panel */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">IPv4 Address</label>
            <input type="text" className="input-base font-mono" placeholder="192.168.1.100" value={ip}
              onChange={e => setIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCalculate()} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Prefix / CIDR — /{prefix}
            </label>
            <input type="range" min="1" max="32" value={prefix} onChange={e => setPrefix(parseInt(e.target.value))}
              className="w-full accent-crimson-DEFAULT cursor-pointer" />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-0.5">
              <span>/1</span><span>/16</span><span>/32</span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs text-stone-400 font-medium">Presets:</span>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { setIp(p.ip); setPrefix(p.prefix); }}
              className="text-xs px-2.5 py-1 rounded-lg bg-cream-200 border border-cream-border text-stone-400 hover:border-crimson-DEFAULT hover:text-crimson-DEFAULT transition-colors font-medium">
              {p.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-2 text-sm text-rose-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <button onClick={handleCalculate} className="btn-primary w-full justify-center py-3">
          <Calculator className="w-5 h-5" /> Calculate Subnet
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Network Address', value: result.networkAddress, mono: true },
              { label: 'Broadcast Address', value: result.broadcastAddress, mono: true },
              { label: 'Usable Hosts', value: result.usableHosts.toLocaleString(), mono: true },
              { label: 'Subnet Mask', value: result.subnetMask, mono: true },
            ].map(s => (
              <div key={s.label} className="card p-3 text-center">
                <div className={`font-${s.mono ? 'mono' : 'serif'} font-bold text-lg text-ink-400`}>{s.value}</div>
                <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Binary Breakdown */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-cream-200 border-b border-cream-border">
              <h3 className="font-serif font-semibold text-ink-400 text-sm">Binary Notation Breakdown</h3>
              <p className="text-xs text-stone-400 mt-0.5"><span className="text-crimson-DEFAULT font-bold font-mono">Red = Network bits</span> · Gray = Host bits</p>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'IP Address', binary: result.ipBinary },
                { label: 'Subnet Mask', binary: result.subnetMaskBinary, isFullRed: true },
                { label: 'Network Address', binary: result.networkBinary },
                { label: 'Broadcast Address', binary: result.broadcastBinary },
              ].map(row => (
                <div key={row.label} className="flex flex-col sm:flex-row gap-2">
                  <div className="text-xs font-medium text-stone-400 w-36 shrink-0 pt-0.5">{row.label}</div>
                  <BinaryDisplay binary={row.binary} prefix={row.isFullRed ? 32 : prefix} />
                </div>
              ))}
            </div>
          </div>

          {/* Host Range */}
          <div className="card p-5">
            <h3 className="font-serif font-semibold text-ink-400 mb-3">Host Range & Network Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'First Usable Host', value: result.firstHost },
                { label: 'Last Usable Host', value: result.lastHost },
                { label: 'CIDR Notation', value: result.cidrNotation },
                { label: 'Wildcard Mask', value: result.wildcardMask },
                { label: 'IP Class', value: result.ipClass },
                { label: 'IP Type', value: result.isPrivate ? 'Private (RFC 1918)' : 'Public' },
              ].map(r => (
                <div key={r.label} className="bg-cream-200 rounded-xl p-3">
                  <div className="font-mono font-semibold text-ink-400 text-sm break-all">{r.value}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{r.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-crimson-glow border border-crimson-DEFAULT/20 rounded-xl p-3">
              <p className="text-sm text-ink-100">
                <span className="font-semibold text-crimson-DEFAULT">Formula: </span>
                Usable Hosts = 2<sup>{32 - prefix}</sup> − 2 = <span className="font-mono font-bold">{result.usableHosts.toLocaleString()}</span> hosts
                {prefix > 24 && <span className="ml-2 text-xs text-stone-400">(/{prefix} is a small subnet — typically used for point-to-point links)</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
