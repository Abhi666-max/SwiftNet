'use client';

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ArrowRight, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';

type ProtocolMode = 'tcp' | 'dhcp' | 'udp';

interface HandshakeStep {
  id: string;
  from: 'client' | 'server';
  to: 'client' | 'server';
  label: string;
  summary: string;
  flags: string;
  seqAck: string;
  details: string;
  explanation: string;
}

const TCP_HANDSHAKE: HandshakeStep[] = [
  {
    id: 'syn',
    from: 'client',
    to: 'server',
    label: 'SYN (Synchronize)',
    summary: 'Client initiates connection request',
    flags: 'SYN = 1 · ACK = 0',
    seqAck: 'Seq = 1000 · Ack = 0',
    details: 'Initial Sequence Number (ISN) chosen: 1000 · Window Size: 65535',
    explanation: 'The client sends an empty segment with the SYN flag set to 1. This requests a connection and announces its starting sequence number (ISN 1000) for reliable byte counting.',
  },
  {
    id: 'syn-ack',
    from: 'server',
    to: 'client',
    label: 'SYN-ACK (Synchronize + Acknowledge)',
    summary: 'Server acknowledges and initiates reverse stream',
    flags: 'SYN = 1 · ACK = 1',
    seqAck: 'Seq = 5000 · Ack = 1001',
    details: 'Server ISN: 5000 · Acknowledges byte 1000 with Ack=1001',
    explanation: 'The server accepts the request by sending SYN=1 and ACK=1. Ack=1001 tells the client "I received byte 1000, send 1001 next." The server also declares its own sequence number (5000).',
  },
  {
    id: 'ack',
    from: 'client',
    to: 'server',
    label: 'ACK (Acknowledge)',
    summary: 'Client confirms · Connection ESTABLISHED',
    flags: 'SYN = 0 · ACK = 1',
    seqAck: 'Seq = 1001 · Ack = 5001',
    details: 'Acknowledges byte 5000 with Ack=5001 · Handshake Complete',
    explanation: 'The client sends a final ACK acknowledging the server\'s SYN (Ack=5001). Both endpoints transition to the ESTABLISHED state. Bidirectional full-duplex payload transmission can now commence.',
  },
];

const DHCP_STEPS: HandshakeStep[] = [
  {
    id: 'discover',
    from: 'client',
    to: 'server',
    label: 'DHCP DISCOVER (Broadcast)',
    summary: 'Unconfigured client seeks DHCP server',
    flags: 'UDP Port 68 → 67',
    seqAck: 'SRC: 0.0.0.0 → DST: 255.255.255.255',
    details: 'MAC: 3C:52:82:11:AA:BB · Broadcast on local network',
    explanation: 'The new device has no IP yet. It broadcasts a DISCOVER datagram onto the physical segment asking any listening DHCP server to offer an IP.',
  },
  {
    id: 'offer',
    from: 'server',
    to: 'client',
    label: 'DHCP OFFER (Unicast)',
    summary: 'Server proposes IP address configuration',
    flags: 'UDP Port 67 → 68',
    seqAck: 'Offered IP: 192.168.1.55',
    details: 'Subnet: 255.255.255.0 · Gateway: 192.168.1.1 · DNS: 1.1.1.1 · Lease: 24h',
    explanation: 'The DHCP server reserves an available IP and replies with an OFFER containing network subnet mask, default gateway router, and DNS servers.',
  },
  {
    id: 'request',
    from: 'client',
    to: 'server',
    label: 'DHCP REQUEST (Broadcast)',
    summary: 'Client formally requests the offered IP',
    flags: 'UDP Port 68 → 67',
    seqAck: 'Requested: 192.168.1.55',
    details: 'Server ID: 192.168.1.1 · Notifies all other servers of acceptance',
    explanation: 'The client accepts the lease by broadcasting a REQUEST. This confirms the lease and informs any other DHCP servers that their offers were not chosen.',
  },
  {
    id: 'ack',
    from: 'server',
    to: 'client',
    label: 'DHCP ACK (Confirmation)',
    summary: 'Server confirms · Client joins network',
    flags: 'UDP Port 67 → 68',
    seqAck: 'Lease Confirmed: 192.168.1.55',
    details: 'Client configures network interface · Ready for internet traffic',
    explanation: 'The server records the binding in its lease database and returns an ACK. The client binds 192.168.1.55 to its NIC and becomes fully routable.',
  },
];

const UDP_STEPS: HandshakeStep[] = [
  {
    id: 'udp-1',
    from: 'client',
    to: 'server',
    label: 'UDP Datagram 1 (Direct Send)',
    summary: 'Sent immediately with zero connection setup',
    flags: 'Connectionless',
    seqAck: 'SRC Port 54120 → DST Port 53 (DNS)',
    details: 'Payload: DNS Query "swiftnet.io" · Checksum: 0x4A1E',
    explanation: 'UDP does not perform handshakes. The application creates a socket and transmits immediately. Fast, zero-overhead, but does not guarantee delivery.',
  },
  {
    id: 'udp-2',
    from: 'client',
    to: 'server',
    label: 'UDP Datagram 2 (Streaming Burst)',
    summary: 'Subsequent datagram sent independently',
    flags: 'No Flow Control',
    seqAck: 'SRC Port 54120 → DST Port 53 (DNS)',
    details: 'Packets can take alternate paths and arrive out of order',
    explanation: 'Each UDP packet is completely independent. If packet 1 is delayed or dropped, packet 2 is delivered without waiting. Essential for VoIP and live gaming.',
  },
  {
    id: 'udp-resp',
    from: 'server',
    to: 'client',
    label: 'UDP Server Response',
    summary: 'Direct response without acknowledgment',
    flags: 'Best-Effort',
    seqAck: 'SRC Port 53 → DST Port 54120',
    details: 'Payload: 104.16.12.5 · Zero retransmission mechanism',
    explanation: 'The server responds directly. If this response is dropped in transit, UDP does not retry. Reliability, if needed, must be implemented at Layer 7.',
  },
];

export function ProtocolPlayground() {
  const [mode, setMode] = useState<ProtocolMode>('tcp');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(1800);

  const steps = mode === 'tcp' ? TCP_HANDSHAKE : mode === 'dhcp' ? DHCP_STEPS : UDP_STEPS;
  const isComplete = currentStepIdx >= steps.length - 1 && !isPlaying;
  const activeStep = currentStepIdx >= 0 && currentStepIdx < steps.length ? steps[currentStepIdx] : null;

  useEffect(() => {
    if (!isPlaying) return;

    const t = setTimeout(() => {
      setCurrentStepIdx(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);

    return () => clearTimeout(t);
  }, [isPlaying, currentStepIdx, steps.length, speedMs]);

  const handleStart = () => {
    setCurrentStepIdx(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(-1);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#0D0D0D]">Interactive Protocol Playground</h2>
          <p className="text-xs text-[#8C8680] mt-0.5">
            Visualize the exact packet flow across the wire for TCP 3-Way Handshake, DHCP DORA, and UDP.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-[#F4F0E8] p-1 rounded-xl border border-[#E2DDD5]">
          {[
            { id: 'tcp', label: 'TCP 3-Way Handshake' },
            { id: 'dhcp', label: 'DHCP DORA' },
            { id: 'udp', label: 'UDP Datagrams' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id as ProtocolMode);
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === m.id ? 'bg-[#C1121F] text-white shadow-xs' : 'text-[#5C5650] hover:text-[#0D0D0D]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Live Network Animated Wire Diagram ──────────────── */}
      <div className="card p-6 sm:p-8 bg-white border border-[#E2DDD5] space-y-6">

        {/* Diagram Nodes: Client Wire Server */}
        <div className="relative py-4">
          <div className="flex items-center justify-between relative z-10">

            {/* Left Node: Client */}
            <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
              activeStep?.from === 'client' ? 'border-[#C1121F] bg-[#FDF2F3] shadow-md scale-105' :
              activeStep?.to === 'client' ? 'border-emerald-500 bg-emerald-50 shadow-md scale-105' :
              'border-[#E2DDD5] bg-[#F8F6F0]'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2DDD5] flex items-center justify-center text-2xl shadow-xs">
                💻
              </div>
              <div className="text-center">
                <div className="font-bold text-xs text-[#0D0D0D]">Client Node</div>
                <div className="font-mono text-[10px] text-[#8C8680]">
                  {mode === 'dhcp' && currentStepIdx < 3 ? '0.0.0.0' : '192.168.1.100'}
                </div>
              </div>
            </div>

            {/* Middle: Traveling Packet Animated Wire */}
            <div className="flex-1 mx-6 relative flex flex-col items-center">
              {/* Baseline Wire Line */}
              <div className="w-full h-1.5 bg-[#EDE8DC] rounded-full relative">
                {/* Active Beam Travel - Absolute positioned inside the wire track */}
                {activeStep && (
                  <div
                    key={activeStep.id}
                    className={`absolute top-0 h-full rounded-full ${
                      activeStep.from === 'client' ? 'bg-[#C1121F]' : 'bg-[#7C3AED]'
                    } ${activeStep.from === 'client' ? 'swiftnet-slide-right' : 'swiftnet-slide-left'}`}
                    style={{
                      animationDuration: `${speedMs * 0.9}ms`,
                      animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      animationFillMode: 'forwards',
                    }}
                  />
                )}
              </div>

              {/* Floating Packet Payload Badge Moving Across */}
              {activeStep && (
                <div
                  key={`${activeStep.id}_badge`}
                  className={`mt-3 px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-xs font-mono font-bold ${
                    activeStep.from === 'client'
                      ? 'bg-[#FDF2F3] border-[#C1121F] text-[#C1121F] swiftnet-float-right'
                      : 'bg-[#EDE9FE] border-[#7C3AED] text-[#7C3AED] swiftnet-float-left'
                  }`}
                  style={{
                    animationDuration: `${speedMs * 0.9}ms`,
                    animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    animationFillMode: 'forwards',
                  }}
                >
                  {activeStep.from === 'client' ? (
                    <ArrowRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowLeft className="w-3.5 h-3.5" />
                  )}
                  <span>{activeStep.label}</span>
                </div>
              )}

              {!activeStep && (
                <span className="text-xs text-[#8C8680] mt-3 font-medium">
                  Press &ldquo;Run Handshake Animation&rdquo; to send packet stream
                </span>
              )}
            </div>

            {/* Right Node: Server */}
            <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
              activeStep?.from === 'server' ? 'border-[#7C3AED] bg-[#EDE9FE] shadow-md scale-105' :
              activeStep?.to === 'server' ? 'border-[#C1121F] bg-[#FDF2F3] shadow-md scale-105' :
              'border-[#E2DDD5] bg-[#F8F6F0]'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2DDD5] flex items-center justify-center text-2xl shadow-xs">
                🖥️
              </div>
              <div className="text-center">
                <div className="font-bold text-xs text-[#0D0D0D]">Server / Gateway</div>
                <div className="font-mono text-[10px] text-[#8C8680]">
                  {mode === 'dhcp' ? '192.168.1.1' : '104.16.12.5:443'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animation Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F0ECE4]">
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button onClick={handleStart} className="btn-primary text-xs py-2 px-5">
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{currentStepIdx >= 0 ? 'Replay Simulation' : 'Run Handshake Animation'}</span>
              </button>
            ) : (
              <button onClick={() => setIsPlaying(false)} className="btn-secondary text-xs py-2 px-4">
                Pause
              </button>
            )}

            <button onClick={handleReset} className="btn-ghost text-xs py-2 px-3">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2 text-xs text-[#8C8680]">
            <span className="font-medium">Step Delay:</span>
            {[
              { label: 'Fast', ms: 1000 },
              { label: 'Normal', ms: 1800 },
              { label: 'Slow', ms: 2800 },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setSpeedMs(s.ms)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  speedMs === s.ms ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]' : 'bg-white text-[#5C5650] border-[#E2DDD5]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step-by-Step Breakdown Cards ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s, idx) => {
          const isCurrent = idx === currentStepIdx;
          const isDone = idx < currentStepIdx || isComplete;

          return (
            <div
              key={s.id}
              className={`card p-4 transition-all duration-200 ${
                isCurrent ? 'border-[#C1121F] ring-2 ring-[#C1121F]/20 shadow-md bg-[#FDF2F3]/40' :
                isDone ? 'border-emerald-300 bg-emerald-50/30' :
                'opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isCurrent ? 'bg-[#C1121F] text-white' :
                  isDone ? 'bg-emerald-600 text-white' :
                  'bg-[#E2DDD5] text-[#8C8680]'
                }`}>
                  STEP {idx + 1}
                </span>

                <span className="text-[10px] font-mono font-semibold text-[#8C8680]">
                  {s.from.toUpperCase()} → {s.to.toUpperCase()}
                </span>
              </div>

              <div className="font-bold text-sm text-[#0D0D0D] mb-1">{s.label}</div>
              <div className="text-xs text-[#5C5650] mb-2">{s.summary}</div>

              <div className="bg-white border border-[#E2DDD5] rounded-lg p-2 font-mono text-[11px] text-[#0D0D0D] space-y-0.5">
                <div className="text-[#C1121F] font-semibold">{s.flags}</div>
                <div className="text-[#8C8680]">{s.seqAck}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Step Detailed Insight ────────────────────── */}
      {activeStep && (
        <div className="card p-5 border-l-4 border-[#C1121F] bg-[#FDF2F3]/30 anim-fadeup">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C1121F] uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Inspection: {activeStep.label}</span>
          </div>
          <p className="text-xs text-[#5C5650] leading-relaxed">
            {activeStep.explanation}
          </p>
        </div>
      )}

      {/* ── Completion Banner ─────────────────────────────── */}
      {isComplete && (
        <div className="card p-5 border-emerald-300 bg-emerald-50 flex items-center justify-between gap-4 anim-fadeup">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-sm text-emerald-800">
                {mode === 'tcp' ? 'TCP Connection State: ESTABLISHED' :
                 mode === 'dhcp' ? 'IP Address Lease Configured Successfully' :
                 'UDP Datagram Stream Finished'}
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">
                {mode === 'tcp' ? 'Full duplex synchronized connection ready for application payload.' :
                 mode === 'dhcp' ? 'Interface bound with default route and DNS resolvers.' :
                 'Best-effort delivery achieved without transmission overhead.'}
              </div>
            </div>
          </div>
          <button onClick={handleStart} className="btn-primary text-xs py-2 px-4 bg-emerald-700 hover:bg-emerald-800">
            Replay Flow
          </button>
        </div>
      )}

      {/* CSS Keyframes for Moving Packets */}
      <style dangerouslySetInnerHTML={{ __html: `
        .swiftnet-slide-right {
          animation-name: swiftnetSlideRight;
          left: 0;
          width: 0;
        }
        @keyframes swiftnetSlideRight {
          0%   { left: 0%;   width: 0%; }
          100% { left: 0%;   width: 100%; }
        }
        .swiftnet-slide-left {
          animation-name: swiftnetSlideLeft;
          right: 0;
          width: 0;
        }
        @keyframes swiftnetSlideLeft {
          0%   { right: 0%;  width: 0%; }
          100% { right: 0%;  width: 100%; }
        }
        .swiftnet-float-right {
          animation-name: swiftnetFloatRight;
        }
        @keyframes swiftnetFloatRight {
          0%   { transform: translateX(-55%); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateX(55%);  opacity: 1; }
        }
        .swiftnet-float-left {
          animation-name: swiftnetFloatLeft;
        }
        @keyframes swiftnetFloatLeft {
          0%   { transform: translateX(55%);  opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateX(-55%); opacity: 1; }
        }
      ` }} />
    </div>
  );
}
