'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Play, RotateCcw, ArrowDown, ArrowUp, CheckCircle2 } from 'lucide-react';

interface LayerInfo {
  num: number;
  name: string;
  pdu: string;
  protocol: string;
  header: string;
  explanation: string;
  encapsulation: string;
  icon: string;
}

const OSI_LAYERS: LayerInfo[] = [
  {
    num: 7,
    name: 'Application Layer',
    pdu: 'Data',
    protocol: 'HTTP, DNS, TLS, SSH',
    header: 'Payload Data (No L7 Header)',
    explanation: 'Directly interacts with software applications. Formulates the user request into standardized protocol syntax (e.g., HTTP request body and headers).',
    encapsulation: 'GET /index.html HTTP/1.1\\r\\nHost: swiftnet.io',
    icon: '🌐',
  },
  {
    num: 6,
    name: 'Presentation Layer',
    pdu: 'Data',
    protocol: 'TLS 1.3, SSL, JSON, ASCII',
    header: 'Encryption & Encoding Wrapper',
    explanation: 'Translates, compresses, and encrypts data. TLS encryption turns plain text data into encrypted ciphertext before transport.',
    encapsulation: '[TLS Record] Encrypted Payload [AES-256-GCM]',
    icon: '🔐',
  },
  {
    num: 5,
    name: 'Session Layer',
    pdu: 'Data',
    protocol: 'NetBIOS, RPC, Sockets',
    header: 'Session Token / Sync Checkpoint',
    explanation: 'Manages sessions between applications. Controls dialogue, maintains connections, and coordinates checkpoints for recovery.',
    encapsulation: '[Session ID: 0x9A4F] [Ciphertext Payload]',
    icon: '🤝',
  },
  {
    num: 4,
    name: 'Transport Layer',
    pdu: 'Segment',
    protocol: 'TCP, UDP, QUIC',
    header: 'TCP Header (20 Bytes: SRC/DST Port, SEQ, ACK, Flags)',
    explanation: 'Ensures end-to-end communication. TCP segments data, tracks sequence numbers, manages flow control, and provides retransmission if packets are lost.',
    encapsulation: '[TCP: 443 → 52410 | SEQ: 1001 ACK: 5001] [Payload]',
    icon: '📦',
  },
  {
    num: 3,
    name: 'Network Layer',
    pdu: 'Packet',
    protocol: 'IPv4, IPv6, ICMP, BGP',
    header: 'IP Header (20 Bytes: SRC IP, DST IP, TTL, Checksum)',
    explanation: 'Responsible for logical addressing and packet routing across networks. Routers inspect the destination IP to forward packets to the next hop.',
    encapsulation: '[IP: 192.168.1.100 → 104.16.12.5 | TTL: 64] [TCP Segment]',
    icon: '🗺️',
  },
  {
    num: 2,
    name: 'Data Link Layer',
    pdu: 'Frame',
    protocol: 'Ethernet (802.3), Wi-Fi (802.11), ARP',
    header: 'Ethernet Header (14 Bytes MAC) + FCS (4 Bytes CRC)',
    explanation: 'Transfers frames between adjacent nodes on the same local physical network using MAC addresses. Frame Check Sequence (FCS) detects transmission bit errors.',
    encapsulation: '[ETH: AA:BB:CC:DD → 11:22:33:44] [IP Packet] [FCS: 0x8F2D]',
    icon: '🔗',
  },
  {
    num: 1,
    name: 'Physical Layer',
    pdu: 'Bits',
    protocol: '1000BASE-T, Fiber Optics, 802.11 RF',
    header: 'Preamble (7 Bytes) + SFD (1 Byte)',
    explanation: 'Transmits raw unstructured bitstreams over physical media (electrical pulses on copper wires, light pulses in fiber, or radio waves over Wi-Fi).',
    encapsulation: '10101010 10101011 01001100 11010010 01101001...',
    icon: '⚡',
  },
];

export function PacketJourney() {
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const [activeLayerNum, setActiveLayerNum] = useState<number>(7);
  const [message, setMessage] = useState('GET /api/diagnostics HTTP/1.1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  const layerOrder = useMemo(
    () => (direction === 'down' ? [7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7]),
    [direction],
  );

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex >= layerOrder.length) {
        setIsPlaying(false);
        return;
      }
      setCurrentStepIndex(nextIndex);
      setActiveLayerNum(layerOrder[nextIndex]);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, layerOrder]);

  const handleStart = () => {
    setCurrentStepIndex(0);
    setActiveLayerNum(layerOrder[0]);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setActiveLayerNum(direction === 'down' ? 7 : 1);
  };

  const activeLayer = OSI_LAYERS.find(l => l.num === activeLayerNum) || OSI_LAYERS[0];

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#0D0D0D]">OSI Packet Journey Visualizer</h2>
          <p className="text-xs text-[#8C8680] mt-0.5">
            Step through all 7 OSI layers to see real encapsulation (headers added) and decapsulation (headers stripped).
          </p>
        </div>

        {/* Direction Toggle */}
        <div className="flex items-center gap-1 bg-[#F4F0E8] p-1 rounded-xl border border-[#E2DDD5]">
          <button
            onClick={() => {
              setDirection('down');
              handleReset();
            }}
            disabled={isPlaying}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              direction === 'down' ? 'bg-[#C1121F] text-white shadow-xs' : 'text-[#5C5650] hover:text-[#0D0D0D]'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Sending (L7 → L1)</span>
          </button>
          <button
            onClick={() => {
              setDirection('up');
              handleReset();
            }}
            disabled={isPlaying}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              direction === 'up' ? 'bg-[#C1121F] text-white shadow-xs' : 'text-[#5C5650] hover:text-[#0D0D0D]'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Receiving (L1 → L7)</span>
          </button>
        </div>
      </div>

      {/* ── Control Bar ───────────────────────── */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full flex items-center gap-2">
          <span className="text-xs font-bold text-[#8C8680] uppercase tracking-wider shrink-0">Payload:</span>
          <input
            type="text"
            className="w-full bg-[#F8F6F0] border border-[#E2DDD5] rounded-lg px-3 py-1.5 text-xs font-mono text-[#0D0D0D] outline-none focus:border-[#C1121F]"
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={isPlaying}
            placeholder="e.g. GET /index.html HTTP/1.1"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isPlaying ? (
            <button onClick={handleStart} className="btn-primary text-xs py-2 px-4">
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Animate Flow</span>
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
      </div>

      {/* ── Side-by-Side Synchronized Workspace ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">

        {/* Left Column (5 Cols): The 7 OSI Layers Stack */}
        <div className="md:col-span-5 card overflow-hidden">
          <div className="px-4 py-3 bg-[#F8F6F0] border-b border-[#E8E3DA] flex items-center justify-between">
            <span className="font-serif font-bold text-xs text-[#0D0D0D] uppercase tracking-wider">
              OSI Protocol Stack
            </span>
            <span className="text-[11px] font-mono text-[#8C8680]">
              {direction === 'down' ? 'Top-Down Encapsulation' : 'Bottom-Up Decapsulation'}
            </span>
          </div>

          <div className="divide-y divide-[#F0ECE4]">
            {OSI_LAYERS.map(layer => {
              const isActive = activeLayerNum === layer.num;
              const isPassed = direction === 'down'
                ? layer.num > activeLayerNum
                : layer.num < activeLayerNum;

              return (
                <div
                  key={layer.num}
                  onClick={() => {
                    if (!isPlaying) setActiveLayerNum(layer.num);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#FDF2F3] border-l-4 border-[#C1121F]'
                      : 'hover:bg-[#FAF8F4] border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-xl shrink-0">{layer.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#C1121F]' : 'text-[#8C8680]'}`}>
                        Layer {layer.num}
                      </span>
                      <span className="text-[10px] font-mono text-[#8C8680] bg-[#F4F0E8] px-1.5 py-0.2 rounded">
                        {layer.pdu}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-[#0D0D0D] truncate">
                      {layer.name}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {isActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C1121F] animate-pulse shrink-0" />
                  )}
                  {isPassed && !isActive && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 Cols): Locked Active Layer Inspector Card */}
        <div className="md:col-span-7 card p-6 space-y-4 md:sticky md:top-28">
          {/* Active Layer Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeLayer.icon}</span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C1121F]">
                  Layer {activeLayer.num} · Protocol Data Unit: {activeLayer.pdu}
                </div>
                <h3 className="font-serif font-bold text-xl text-[#0D0D0D]">
                  {activeLayer.name}
                </h3>
              </div>
            </div>
            <span className="badge badge-crimson font-mono text-xs">
              {direction === 'down' ? 'Header Appended' : 'Header Processed'}
            </span>
          </div>

          {/* Protocols At This Layer */}
          <div>
            <div className="text-[10px] font-bold text-[#8C8680] uppercase tracking-wider mb-1">
              Active Protocols
            </div>
            <div className="font-mono text-xs font-semibold text-[#0D0D0D] bg-[#F8F6F0] border border-[#E8E3DA] rounded-lg px-3 py-2">
              {activeLayer.protocol}
            </div>
          </div>

          {/* Header Added / Processed */}
          <div>
            <div className="text-[10px] font-bold text-[#8C8680] uppercase tracking-wider mb-1">
              {direction === 'down' ? 'Header Added at Layer' : 'Header Stripped / Read at Layer'}
            </div>
            <div className="bg-[#FDF2F3] border border-[#C1121F]/20 rounded-lg p-3">
              <div className="font-mono text-xs font-bold text-[#C1121F]">
                {activeLayer.header}
              </div>
            </div>
          </div>

          {/* Packet Encapsulation Visual Representation */}
          <div>
            <div className="text-[10px] font-bold text-[#8C8680] uppercase tracking-wider mb-1">
              Frame / Packet Wire Representation
            </div>
            <div className="font-mono text-[11px] text-emerald-300 bg-[#1A1F2E] rounded-lg p-4 leading-relaxed break-all border border-[#2D3550]"
              style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', letterSpacing: '0.02em' }}>
              <span className="text-[#8B9CC7] select-none">&#9658; </span>
              {activeLayer.encapsulation.replace('GET /index.html HTTP/1.1', message || 'GET / HTTP/1.1')}
            </div>
          </div>

          {/* Plain-English Explanation */}
          <div className="bg-[#F8F6F0] border border-[#E8E3DA] rounded-xl p-4">
            <div className="text-[10px] font-bold text-[#8C8680] uppercase tracking-wider mb-1">
              How It Works
            </div>
            <p className="text-xs text-[#5C5650] leading-relaxed">
              {activeLayer.explanation}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
