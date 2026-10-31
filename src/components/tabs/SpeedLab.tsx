'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Square, RotateCcw, Download, Upload,
  Clock, Activity, Globe, ShieldCheck, CheckCircle2,
  Tv, Gamepad2, PhoneCall, Cloud, FileJson, AlertTriangle
} from 'lucide-react';
import { SpeedTestEngine, TEST_ENDPOINTS } from '@/lib/speedtestEngine';
import { exportResultToJson } from '@/lib/exportReport';
import type { SpeedTestResult, TestPhase, GraphDataPoint } from '@/types/speedtest';

/* ─── Types ──────────────────────────────────── */
interface Progress {
  phase: TestPhase;
  speed: number;
  dl: number;
  ul: number;
  latency: number;
  jitter: number;
  progress: number;
  points: GraphDataPoint[];
}

interface NetworkInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  org: string;
  asn?: string;
  source?: string;
}

/* ─── Real-Time Live Bandwidth Canvas Graph ──────────────── */
function LiveBandwidthGraph({ points }: { points: GraphDataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const dlPts = points.filter(p => p.downloadSpeed != null);
    const ulPts = points.filter(p => p.uploadSpeed != null);

    if (dlPts.length < 2 && ulPts.length < 2) {
      ctx.fillStyle = '#8C8680';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Measuring multi-stream throughput…', w / 2, h / 2);
      return;
    }

    const allSpeeds = [
      ...dlPts.map(p => p.downloadSpeed!),
      ...ulPts.map(p => p.uploadSpeed!)
    ].filter(Boolean);
    const maxSpeed = Math.max(...allSpeeds, 20) * 1.15;
    const maxTime = Math.max(...points.map(p => p.timeOffsetSec), 1);

    const pad = { top: 16, right: 20, bottom: 28, left: 45 };
    const gw = w - pad.left - pad.right;
    const gh = h - pad.top - pad.bottom;

    const tx = (t: number) => pad.left + (t / maxTime) * gw;
    const ty = (v: number) => pad.top + gh - (v / maxSpeed) * gh;

    // Grid lines
    ctx.strokeStyle = '#E8E3DA';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(f => {
      const y = pad.top + gh * (1 - f);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + gw, y);
      ctx.stroke();

      ctx.fillStyle = '#8C8680';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${(maxSpeed * f).toFixed(0)}`, pad.left - 6, y + 3);
    });

    // Draw Line & Glowing Area Fill
    const drawSeries = (pts: { t: number; v: number }[], strokeColor: string, fillColor: string) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = tx(p.t);
        const y = ty(p.v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.lineTo(tx(pts[pts.length - 1].t), pad.top + gh);
      ctx.lineTo(tx(pts[0].t), pad.top + gh);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    };

    if (dlPts.length >= 2) {
      drawSeries(
        dlPts.map(p => ({ t: p.timeOffsetSec, v: p.downloadSpeed! })),
        '#C1121F',
        'rgba(193,18,31,0.08)'
      );
    }

    if (ulPts.length >= 2) {
      drawSeries(
        ulPts.map(p => ({ t: p.timeOffsetSec, v: p.uploadSpeed! })),
        '#7C3AED',
        'rgba(124,58,237,0.08)'
      );
    }
  }, [points]);

  return (
    <canvas ref={canvasRef} className="w-full h-36" style={{ display: 'block' }} />
  );
}

/* ─── High-End SaaS Speedometer Gauge (Clean & Zero-Overlap) ───────────────── */
function Speedometer({ speed, phase }: { speed: number; phase: TestPhase }) {
  // Arc parameters
  // Sweep from 150° (bottom left) to 390° (bottom right) -> 240 degrees span
  const cx = 130;
  const cy = 115;
  const r = 85;
  const startAngle = 150;
  const totalSweep = 240;

  // Scale: 0 to 500+ Mbps logarithmic mapping so low and high speeds look dynamic
  let fraction = 0;
  if (speed > 0) {
    if (speed <= 50) fraction = (speed / 50) * 0.45;
    else if (speed <= 150) fraction = 0.45 + ((speed - 50) / 100) * 0.30;
    else fraction = Math.min(1, 0.75 + ((speed - 150) / 350) * 0.25);
  }
  fraction = Math.max(0, Math.min(1, fraction));

  const needleAngle = startAngle + fraction * totalSweep;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = 65;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  const rad = (deg: number) => (deg * Math.PI) / 180;
  const arcPoint = (deg: number) => ({
    x: cx + r * Math.cos(rad(deg)),
    y: cy + r * Math.sin(rad(deg)),
  });

  const fullArcStart = arcPoint(startAngle);
  const fullArcEnd = arcPoint(startAngle + totalSweep);
  const bgArcPath = `M ${fullArcStart.x} ${fullArcStart.y} A ${r} ${r} 0 1 1 ${fullArcEnd.x} ${fullArcEnd.y}`;

  const activeEnd = arcPoint(startAngle + Math.max(2, fraction * totalSweep));
  const isLargeArc = fraction * totalSweep > 180 ? 1 : 0;
  const activeArcPath = `M ${fullArcStart.x} ${fullArcStart.y} A ${r} ${r} 0 ${isLargeArc} 1 ${activeEnd.x} ${activeEnd.y}`;

  const phaseColor = phase === 'download' ? '#C1121F' : phase === 'upload' ? '#7C3AED' : '#C1121F';
  const phaseText = phase === 'idle' ? 'READY' : phase === 'ping' ? 'MEASURING PING' : phase === 'download' ? 'DOWNLOADING' : phase === 'upload' ? 'UPLOADING' : phase === 'complete' ? 'FINISHED' : 'ERROR';

  const TICKS = [
    { label: '0', val: 0 },
    { label: '25', val: 0.22 },
    { label: '50', val: 0.45 },
    { label: '100', val: 0.60 },
    { label: '250', val: 0.82 },
    { label: '500+', val: 1.0 },
  ];

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox="0 0 260 210" className="w-64 h-52 overflow-visible">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C1121F" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#E63946" />
            <stop offset="100%" stopColor="#C1121F" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Background Track */}
        <path d={bgArcPath} fill="none" stroke="#EAE5DC" strokeWidth="11" strokeLinecap="round" />

        {/* Active Value Arc */}
        {speed > 0 && (
          <path
            d={activeArcPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="11"
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            style={{ transition: 'all 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)' }}
          />
        )}

        {/* Clean Tick Notches Outside Arc */}
        {TICKS.map((t, idx) => {
          const deg = startAngle + t.val * totalSweep;
          const tickRad = (deg * Math.PI) / 180;
          const innerX = cx + (r - 9) * Math.cos(tickRad);
          const innerY = cy + (r - 9) * Math.sin(tickRad);
          const outerX = cx + (r - 2) * Math.cos(tickRad);
          const outerY = cy + (r - 2) * Math.sin(tickRad);
          const labelX = cx + (r + 17) * Math.cos(tickRad);
          const labelY = cy + (r + 17) * Math.sin(tickRad);

          return (
            <React.Fragment key={idx}>
              <line
                x1={innerX}
                y1={innerY}
                x2={outerX}
                y2={outerY}
                stroke="#C5BFB4"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <text
                x={labelX}
                y={labelY + 3.5}
                textAnchor="middle"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="500"
                fill="#8C8680"
              >
                {t.label}
              </text>
            </React.Fragment>
          );
        })}

        {/* Smooth Needle Line */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={phaseColor}
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
          style={{ transition: 'x2 0.18s cubic-bezier(0.2, 0.9, 0.3, 1), y2 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)' }}
        />

        {/* Center Hub */}
        <circle cx={cx} cy={cy} r="7" fill="#0D0D0D" />
        <circle cx={cx} cy={cy} r="3.5" fill={phaseColor} />

        {/* Digital Readout — Centered in the Lower Arc with Zero Overlap */}
        <text
          x={cx}
          y={cy + 42}
          textAnchor="middle"
          fontSize="34"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="800"
          fill="#0D0D0D"
        >
          {speed > 0 ? (speed >= 100 ? speed.toFixed(0) : speed.toFixed(1)) : '0.0'}
        </text>
        <text
          x={cx}
          y={cy + 58}
          textAnchor="middle"
          fontSize="11"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
          fill="#8C8680"
          letterSpacing="0.05em"
        >
          Mbps
        </text>
        <text
          x={cx}
          y={cy + 75}
          textAnchor="middle"
          fontSize="10"
          fontFamily="Inter, sans-serif"
          fontWeight="700"
          fill={phaseColor}
          letterSpacing="0.08em"
        >
          {phaseText}
        </text>
      </svg>
    </div>
  );
}

/* ─── Metric Card ────────────────────────────── */
function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  highlight,
  color = 'text-[#0D0D0D]',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  sub?: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className={`card p-4 transition-all duration-200 ${highlight ? 'border-[#C1121F] shadow-sm ring-1 ring-[#C1121F]/20' : ''}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-4 h-4 ${highlight ? 'text-[#C1121F]' : 'text-[#8C8680]'}`} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8680]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-mono font-bold text-3xl tabular-nums ${color}`}>
          {value || '—'}
        </span>
        <span className="text-xs font-semibold text-[#8C8680]">{unit}</span>
      </div>
      {sub && <p className="text-[11px] text-[#8C8680] mt-1 truncate">{sub}</p>}
    </div>
  );
}

/* ─── Main Component ─────────────────────────── */
export function SpeedLab() {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [prog, setProg] = useState<Progress>({
    phase: 'idle', speed: 0, dl: 0, ul: 0, latency: 0, jitter: 0, progress: 0, points: [],
  });
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const engineRef = useRef<SpeedTestEngine | null>(null);

  const isTesting = ['ping', 'download', 'upload'].includes(phase);

  // Fetch real client network details from in-app route on mount
  useEffect(() => {
    fetch('/api/network-info')
      .then(r => r.json())
      .then(d => {
        if (d && d.ip) setNetworkInfo(d);
      })
      .catch(() => {});
  }, []);

  const startTest = useCallback(() => {
    setError(null);
    setResult(null);
    setProg({ phase: 'ping', speed: 0, dl: 0, ul: 0, latency: 0, jitter: 0, progress: 0, points: [] });

    // Cloudflare Global Edge is index 0 for 100% genuine real ISP bandwidth
    const engine = new SpeedTestEngine(TEST_ENDPOINTS[0], {
      onPhaseChange: p => setPhase(p),
      onProgress: d => {
        setProg(prev => ({
          phase: d.phase,
          speed: d.currentSpeedMbps,
          dl: d.downloadSpeedMbps || prev.dl,
          ul: d.uploadSpeedMbps || prev.ul,
          latency: d.latencyMs || prev.latency,
          jitter: d.jitterMs,
          progress: d.progressPercent,
          points: d.graphPoint ? [...prev.points, d.graphPoint] : prev.points,
        }));
      },
      onComplete: r => {
        setResult(r);
      },
      onError: msg => {
        setError(msg);
        setPhase('error');
      },
    });

    engineRef.current = engine;
    engine.start();
  }, []);

  const stopTest = () => {
    engineRef.current?.stop();
    setPhase('idle');
  };

  const displayDl = result?.downloadSpeedMbps ?? prog.dl;
  const displayUl = result?.uploadSpeedMbps ?? prog.ul;
  const displayLat = result?.latency?.avg ?? prog.latency;
  const displayJit = result?.latency?.jitter ?? prog.jitter;
  const displaySpeed = isTesting ? prog.speed : (phase === 'complete' ? displayDl : 0);

  // App readiness ratings based on real metrics
  const getReadiness = (dl: number, lat: number) => {
    return {
      stream4k: dl >= 25 ? 'Excellent (4K UHD)' : dl >= 10 ? 'Good (1080p HD)' : 'Limited (SD)',
      gaming: lat <= 30 ? 'Competitive (<30ms)' : lat <= 60 ? 'Smooth (<60ms)' : 'High Latency',
      voip: (displayJit <= 10 && lat <= 80) ? 'Studio Quality' : 'Standard',
      backup: displayUl >= 15 ? 'High Speed' : displayUl >= 5 ? 'Moderate' : 'Basic',
    };
  };

  const readiness = getReadiness(displayDl, displayLat);

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#0D0D0D]">Real-Time Speed Lab</h2>
          <p className="text-xs text-[#8C8680] mt-0.5">
            Active multi-stream TCP throughput testing against nearest Cloudflare Anycast edge nodes.
          </p>
        </div>

        {/* Real Client Telemetry Badge */}
        {networkInfo && (
          <div className="flex items-center gap-2 bg-white border border-[#E2DDD5] px-3.5 py-1.5 rounded-full shadow-xs text-xs text-[#5C5650]">
            <Globe className="w-3.5 h-3.5 text-[#C1121F]" />
            <span className="font-semibold text-[#0D0D0D]">{networkInfo.org || 'ISP Network'}</span>
            <span className="text-[#CDC7BC]">·</span>
            <span className="font-mono text-[#8C8680]">{networkInfo.ip}</span>
            {networkInfo.city && (
              <>
                <span className="text-[#CDC7BC]">·</span>
                <span>{networkInfo.city}, {networkInfo.country}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Error Banner ──────────────────────── */}
      {phase === 'error' && error && (
        <div className="card p-4 flex items-center justify-between gap-3 border-rose-200 bg-rose-50 text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={startTest} className="btn-primary text-xs py-1.5 px-4 bg-rose-600 hover:bg-rose-700">
            Retry
          </button>
        </div>
      )}

      {/* ── Main Testing Console ──────────────── */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">

          {/* Left Column: Gauge & Start Button */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <Speedometer speed={displaySpeed} phase={phase} />

            {/* Progress bar during test */}
            {isTesting && (
              <div className="w-60">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${prog.progress}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-[#8C8680] font-mono mt-1">
                  <span>Stream Buffer</span>
                  <span>{prog.progress}%</span>
                </div>
              </div>
            )}

            {/* CTA Button */}
            {!isTesting ? (
              <button
                onClick={startTest}
                className="btn-primary px-9 py-3 text-sm font-semibold shadow-md"
              >
                {phase === 'idle' && <><Play className="w-4 h-4 fill-white" /> Run Diagnostics</>}
                {phase === 'complete' && <><RotateCcw className="w-4 h-4" /> Run Again</>}
                {phase === 'error' && <><RotateCcw className="w-4 h-4" /> Retry Test</>}
              </button>
            ) : (
              <button
                onClick={stopTest}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100 transition-colors"
              >
                <Square className="w-4 h-4 fill-rose-700" /> Cancel Test
              </button>
            )}
          </div>

          {/* Right Column: Key 4 Metric Tiles */}
          <div className="flex-1 grid grid-cols-2 gap-3.5 w-full">
            <MetricCard
              icon={Download}
              label="Download Speed"
              value={displayDl > 0 ? displayDl.toFixed(1) : '—'}
              unit="Mbps"
              sub="Incoming connection rate"
              highlight={phase === 'download'}
              color="text-[#C1121F]"
            />
            <MetricCard
              icon={Upload}
              label="Upload Speed"
              value={displayUl > 0 ? displayUl.toFixed(1) : '—'}
              unit="Mbps"
              sub="Outgoing connection rate"
              highlight={phase === 'upload'}
              color="text-[#7C3AED]"
            />
            <MetricCard
              icon={Clock}
              label="Ping Latency"
              value={displayLat > 0 ? Math.round(displayLat) : '—'}
              unit="ms"
              sub={result ? `Min ${result.latency.min}ms · Max ${result.latency.max}ms` : 'Server response delay'}
              highlight={phase === 'ping'}
            />
            <MetricCard
              icon={Activity}
              label="Connection Jitter"
              value={displayJit > 0 ? displayJit.toFixed(1) : '—'}
              unit="ms"
              sub={displayJit > 0 ? (displayJit <= 5 ? 'Smooth connection' : displayJit <= 15 ? 'Normal variance' : 'Slight fluctuation') : 'Stability measurement'}
            />
          </div>
        </div>
      </div>

      {/* ── Real-Time Live Graph (Active or Completed) ────────── */}
      {prog.points.length > 1 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#C1121F]" />
              <h3 className="font-serif font-bold text-sm text-[#0D0D0D]">Live Bandwidth Progression</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-[#8C8680]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#C1121F] rounded-full inline-block" /> Download
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#7C3AED] rounded-full inline-block" /> Upload
              </span>
            </div>
          </div>
          <LiveBandwidthGraph points={prog.points} />
        </div>
      )}

      {/* ── Executive Network Diagnostics Report (When Complete) ── */}
      {phase === 'complete' && result && (
        <div className="space-y-4 anim-slideup">

          {/* Section: Real-World Experience Readiness */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-base text-[#0D0D0D]">Application Performance Readiness</h3>
              </div>
              <button
                onClick={() => exportResultToJson(result)}
                className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <FileJson className="w-3.5 h-3.5 text-[#C1121F]" /> Export JSON Report
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-[#F8F6F0] border border-[#E8E3DA] rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5650] mb-1">
                  <Tv className="w-4 h-4 text-amber-600" />
                  <span>4K Video Streaming</span>
                </div>
                <div className="font-bold text-sm text-[#0D0D0D]">{readiness.stream4k}</div>
                <div className="text-[10px] text-[#8C8680] mt-0.5">Netflix, YouTube, Prime</div>
              </div>

              <div className="bg-[#F8F6F0] border border-[#E8E3DA] rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5650] mb-1">
                  <Gamepad2 className="w-4 h-4 text-emerald-600" />
                  <span>Online Gaming</span>
                </div>
                <div className="font-bold text-sm text-[#0D0D0D]">{readiness.gaming}</div>
                <div className="text-[10px] text-[#8C8680] mt-0.5">Valorant, CS2, Fortnite</div>
              </div>

              <div className="bg-[#F8F6F0] border border-[#E8E3DA] rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5650] mb-1">
                  <PhoneCall className="w-4 h-4 text-blue-600" />
                  <span>VoIP & Video Calls</span>
                </div>
                <div className="font-bold text-sm text-[#0D0D0D]">{readiness.voip}</div>
                <div className="text-[10px] text-[#8C8680] mt-0.5">Zoom, Teams, Google Meet</div>
              </div>

              <div className="bg-[#F8F6F0] border border-[#E8E3DA] rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5C5650] mb-1">
                  <Cloud className="w-4 h-4 text-violet-600" />
                  <span>Cloud Sync & Backup</span>
                </div>
                <div className="font-bold text-sm text-[#0D0D0D]">{readiness.backup}</div>
                <div className="text-[10px] text-[#8C8680] mt-0.5">Drive, iCloud, GitHub</div>
              </div>
            </div>
          </div>

          {/* Section: Diagnostic Insights & Recommendations */}
          {result.insights && result.insights.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif font-bold text-base text-[#0D0D0D] mb-3">Connection Insights & Diagnostics</h3>
              <div className="space-y-2.5">
                {result.insights.map((ins, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${
                      ins.type === 'critical' ? 'bg-rose-50 border-rose-200' :
                      ins.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                      ins.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-[#0D0D0D] mb-1">
                      <CheckCircle2 className={`w-4 h-4 ${ins.type === 'critical' ? 'text-rose-600' : ins.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`} />
                      {ins.title}
                    </div>
                    <div className="text-xs text-[#5C5650] leading-relaxed mb-2">{ins.description}</div>
                    <div className="text-xs bg-white/90 rounded-lg p-2.5 border border-white font-medium">
                      <span className="font-bold text-[#C1121F]">Action: </span>{ins.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
