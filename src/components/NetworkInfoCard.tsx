'use client';

import React, { useState } from 'react';
import { Network, MapPin, Building, Eye, EyeOff } from 'lucide-react';
import { NetworkInfo } from '@/types/speedtest';
import { getPrivacySettings, savePrivacySettings } from '@/lib/history';

interface NetworkInfoCardProps {
  networkInfo?: NetworkInfo;
}

export function NetworkInfoCard({ networkInfo }: NetworkInfoCardProps) {
  const [storeIpOptIn, setStoreIpOptIn] = useState(() => getPrivacySettings().storeIpInHistory);
  const [isIpMasked, setIsIpMasked] = useState(true);

  const handleToggleOptIn = (checked: boolean) => {
    setStoreIpOptIn(checked);
    savePrivacySettings({ storeIpInHistory: checked });
  };

  const displayIp = () => {
    if (!networkInfo?.ip || networkInfo.ip === 'Unknown') return 'Unavailable';
    if (isIpMasked) {
      // mask middle octets
      const parts = networkInfo.ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.***.***.${parts[3]}`;
      }
      return `${networkInfo.ip.slice(0, 4)}...masked`;
    }
    return networkInfo.ip;
  };

  return (
    <div className="glass-panel rounded-2xl border border-surface-border p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-brand-cyan" />
          <h4 className="text-xs font-bold tracking-wider uppercase text-slate-300">
            Client Connection & Network Identity
          </h4>
        </div>

        {/* Privacy IP store opt-in toggle */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={storeIpOptIn}
              onChange={(e) => handleToggleOptIn(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-surface-elevated text-brand-cyan focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px]">Save IP in local history</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Public IP */}
        <div className="rounded-xl border border-surface-border bg-surface-subtle/50 p-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
            <span>Detected Public IP</span>
            {networkInfo?.ip && networkInfo.ip !== 'Unknown' && (
              <button
                type="button"
                onClick={() => setIsIpMasked(!isIpMasked)}
                className="text-slate-400 hover:text-white transition-colors"
                title={isIpMasked ? 'Reveal IP' : 'Mask IP'}
              >
                {isIpMasked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            )}
          </div>
          <span className="font-mono text-sm font-bold text-white block truncate">
            {displayIp()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Source: {networkInfo?.source || 'HTTP Headers'}
          </span>
        </div>

        {/* ISP / Organization */}
        <div className="rounded-xl border border-surface-border bg-surface-subtle/50 p-3">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
            <Building className="h-3 w-3 text-brand-purple" />
            <span>Service Provider (ISP)</span>
          </div>
          <span className="text-sm font-bold text-white block truncate">
            {networkInfo?.org || 'Standard Network'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {networkInfo?.asn ? `ASN: ${networkInfo.asn}` : 'Broadband / Cellular'}
          </span>
        </div>

        {/* Location / Geolocation */}
        <div className="rounded-xl border border-surface-border bg-surface-subtle/50 p-3">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-brand-cyan" />
            <span>Approx. Routing Location</span>
          </div>
          <span className="text-sm font-bold text-white block truncate">
            {networkInfo?.city && networkInfo?.country
              ? `${networkInfo.city}, ${networkInfo.country}`
              : networkInfo?.country || 'Detected Region'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Geographic IP lookup
          </span>
        </div>
      </div>
    </div>
  );
}
