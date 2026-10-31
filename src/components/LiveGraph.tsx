'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { GraphDataPoint } from '@/types/speedtest';

interface LiveGraphProps {
  data: GraphDataPoint[];
  isTesting: boolean;
}

export function LiveGraph({ data, isTesting }: LiveGraphProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-surface-border bg-surface/50 p-6 text-center">
        <p className="text-xs text-slate-500">
          Live bandwidth graph will plot in real time as the diagnostic runs.
        </p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((d, i) => ({
    time: `${d.timeOffsetSec}s`,
    download: d.downloadSpeed ?? null,
    upload: d.uploadSpeed ?? null,
    latency: d.latencySample ?? null,
    phase: d.phase,
    index: i,
  }));

  return (
    <div className="rounded-2xl border border-surface-border bg-surface/60 p-4 sm:p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
            Real-Time Bandwidth Timeline
          </span>
          {isTesting && (
            <span className="flex items-center gap-1 rounded-full bg-brand-cyan/15 px-2 py-0.5 text-[10px] font-semibold text-brand-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-ping" />
              STREAMING
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-cyan" />
            <span className="text-slate-400 text-[11px]">Download (Mbps)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-purple" />
            <span className="text-slate-400 text-[11px]">Upload (Mbps)</span>
          </div>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dlFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00F2FE" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ulFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-surface-border bg-surface-elevated/95 p-2.5 shadow-xl backdrop-blur-md text-xs">
                      <p className="font-mono text-[10px] text-slate-400 mb-1">
                        Time: {payload[0]?.payload?.time} ({payload[0]?.payload?.phase})
                      </p>
                      {payload.map((item, idx) => (
                        item.value !== null && (
                          <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                            <span className="capitalize text-slate-300 text-[11px] font-medium">
                              {item.name}:
                            </span>
                            <span className="font-mono font-bold text-white text-[11px]">
                              {Number(item.value).toFixed(1)} Mbps
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="download"
              name="Download"
              stroke="#00F2FE"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#dlFill)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="upload"
              name="Upload"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#ulFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
