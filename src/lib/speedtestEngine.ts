import { 
  GraphDataPoint, 
  LatencyResult, 
  LoadedLatencyResult, 
  SpeedTestResult, 
  TestPhase, 
  TestServerEndpoint 
} from '@/types/speedtest';
import { calculateNetworkScore, evaluateSuitability } from './scoring';
import { generateTroubleshootingInsights } from './troubleshooting';
import { runDnsResponseTest } from './dnsTest';

export const TEST_ENDPOINTS: TestServerEndpoint[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare Global Edge',
    location: 'Nearest Anycast Edge PoP',
    provider: 'Cloudflare Global Edge',
    pingUrl: 'https://speed.cloudflare.com/__down?bytes=0',
    downloadUrl: 'https://speed.cloudflare.com/__down',
    uploadUrl: 'https://speed.cloudflare.com/__up',
    description: 'Direct CDN edge measurements for real-world ISP bandwidth and latency.',
  },
  {
    id: 'local',
    name: 'SwiftNet Local Engine',
    location: 'Next.js App Server',
    provider: 'SwiftNet Next.js Local',
    pingUrl: '/api/speedtest/ping',
    downloadUrl: '/api/speedtest/download',
    uploadUrl: '/api/speedtest/upload',
    description: 'Direct in-app route handlers streaming high-entropy payload.',
  },
];

export interface EngineCallbacks {
  onPhaseChange?: (phase: TestPhase) => void;
  onProgress?: (data: {
    phase: TestPhase;
    currentSpeedMbps: number;
    downloadSpeedMbps: number;
    uploadSpeedMbps: number;
    latencyMs: number;
    jitterMs: number;
    progressPercent: number; // 0 - 100
    graphPoint?: GraphDataPoint;
  }) => void;
  onComplete?: (result: SpeedTestResult) => void;
  onError?: (error: string) => void;
}

export class SpeedTestEngine {
  private abortController: AbortController | null = null;
  private endpoint: TestServerEndpoint;
  private callbacks: EngineCallbacks;
  private isRunning: boolean = false;

  constructor(endpoint: TestServerEndpoint = TEST_ENDPOINTS[0], callbacks: EngineCallbacks = {}) {
    this.endpoint = endpoint;
    this.callbacks = callbacks;
  }

  public setEndpoint(endpoint: TestServerEndpoint) {
    this.endpoint = endpoint;
  }

  public getEndpoint(): TestServerEndpoint {
    return this.endpoint;
  }

  public stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRunning = false;
    this.callbacks.onPhaseChange?.('idle');
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const startTime = performance.now();
    const graphData: GraphDataPoint[] = [];

    let downloadFinalSpeed = 0;
    let uploadFinalSpeed = 0;
    const idleLatencySamples: number[] = [];
    const downloadLoadedLatencySamples: number[] = [];
    const uploadLoadedLatencySamples: number[] = [];

    try {
      // PHASE 1: Idle Latency and Jitter
      this.callbacks.onPhaseChange?.('ping');
      const pingCount = 8;
      for (let i = 0; i < pingCount; i++) {
        if (signal.aborted) return;

        const pingStart = performance.now();
        const pingUrl = `${this.endpoint.pingUrl}${this.endpoint.pingUrl.includes('?') ? '&' : '?'}t=${Date.now()}_${i}`;
        
        const res = await fetch(pingUrl, {
          method: 'GET',
          cache: 'no-store',
          signal,
        });

        if (!res.ok) {
          throw new Error(`Latency ping failed with status ${res.status}`);
        }
        await res.text(); // consume minimal body

        const rtt = Math.max(1, performance.now() - pingStart);
        idleLatencySamples.push(rtt);

        const currentAvg = idleLatencySamples.reduce((a, b) => a + b, 0) / idleLatencySamples.length;
        const currentJitter = this.calculateJitter(idleLatencySamples);

        const elapsedSec = (performance.now() - startTime) / 1000;
        const graphPt: GraphDataPoint = {
          timeOffsetSec: Number(elapsedSec.toFixed(1)),
          latencySample: Math.round(rtt),
          phase: 'ping',
        };
        graphData.push(graphPt);

        this.callbacks.onProgress?.({
          phase: 'ping',
          currentSpeedMbps: 0,
          downloadSpeedMbps: 0,
          uploadSpeedMbps: 0,
          latencyMs: Math.round(currentAvg),
          jitterMs: Number(currentJitter.toFixed(1)),
          progressPercent: Math.round(((i + 1) / pingCount) * 15),
          graphPoint: graphPt,
        });

        // Small pause between pings
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      const idleAvg = idleLatencySamples.reduce((a, b) => a + b, 0) / idleLatencySamples.length;
      const idleMin = Math.min(...idleLatencySamples);
      const idleMax = Math.max(...idleLatencySamples);
      const idleJitter = this.calculateJitter(idleLatencySamples);

      // PHASE 2: Download Speed & Download Loaded Latency
      this.callbacks.onPhaseChange?.('download');
      const downloadDurationMs = 8500; // 8.5 seconds
      const downloadStart = performance.now();

      let totalDownloadBytes = 0;
      let lastTickTime = downloadStart;
      let lastTickBytes = 0;
      let currentDownloadMbps = 0;
      const downloadSpeedReadings: number[] = [];

      // Concurrency: 3 parallel streaming requests
      const CONCURRENT_DOWNLOADS = 3;
      let downloadStopRequested = false;

      // Loaded latency poller during download
      const loadedLatencyInterval = setInterval(async () => {
        if (downloadStopRequested || signal.aborted) return;
        try {
          const lStart = performance.now();
          const lRes = await fetch(`${this.endpoint.pingUrl}${this.endpoint.pingUrl.includes('?') ? '&' : '?'}dl_load=${Date.now()}`, {
            cache: 'no-store',
            signal,
          });
          if (lRes.ok) {
            await lRes.text();
            downloadLoadedLatencySamples.push(Math.max(1, performance.now() - lStart));
          }
        } catch {
          // ignore background ping aborts
        }
      }, 750);

      const runDownloadWorker = async (workerId: number) => {
        let chunkIndex = 0;
        // Dynamically scale chunk size: start small, then ramp up
        const chunkSizes = [1048576, 2621440, 5242880, 10485760, 20971520]; // 1MB, 2.5MB, 5MB, 10MB, 20MB

        while (!downloadStopRequested && !signal.aborted) {
          const size = chunkSizes[Math.min(chunkIndex, chunkSizes.length - 1)];
          chunkIndex++;
          const dlUrl = `${this.endpoint.downloadUrl}${this.endpoint.downloadUrl.includes('?') ? '&' : '?'}bytes=${size}&w=${workerId}&t=${Date.now()}`;

          try {
            const res = await fetch(dlUrl, {
              cache: 'no-store',
              signal,
            });

            if (!res.ok || !res.body) {
              break;
            }

            const reader = res.body.getReader();
            while (!downloadStopRequested && !signal.aborted) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                totalDownloadBytes += value.length;
              }
            }
          } catch {
            break;
          }
        }
      };

      for (let w = 0; w < CONCURRENT_DOWNLOADS; w++) {
        void runDownloadWorker(w);
      }

      // Progress reporting loop for download
      while (performance.now() - downloadStart < downloadDurationMs && !signal.aborted) {
        await new Promise((r) => setTimeout(r, 120));
        const now = performance.now();
        const deltaSec = (now - lastTickTime) / 1000;
        const deltaBytes = totalDownloadBytes - lastTickBytes;

        if (deltaSec > 0.05) {
          const instantMbps = (deltaBytes * 8) / (deltaSec * 1000000);
          currentDownloadMbps = Number(instantMbps.toFixed(2));
          downloadSpeedReadings.push(currentDownloadMbps);

          lastTickTime = now;
          lastTickBytes = totalDownloadBytes;

          const elapsedTotal = (now - startTime) / 1000;
          const pct = 15 + Math.round(((now - downloadStart) / downloadDurationMs) * 40);

          const graphPt: GraphDataPoint = {
            timeOffsetSec: Number(elapsedTotal.toFixed(1)),
            downloadSpeed: currentDownloadMbps,
            phase: 'download',
          };
          graphData.push(graphPt);

          this.callbacks.onProgress?.({
            phase: 'download',
            currentSpeedMbps: currentDownloadMbps,
            downloadSpeedMbps: currentDownloadMbps,
            uploadSpeedMbps: 0,
            latencyMs: Math.round(idleAvg),
            jitterMs: Number(idleJitter.toFixed(1)),
            progressPercent: Math.min(55, pct),
            graphPoint: graphPt,
          });
        }
      }

      downloadStopRequested = true;
      clearInterval(loadedLatencyInterval);

      // Compute weighted download speed (trimming slow-start initial 15%)
      const validReadings = downloadSpeedReadings.slice(Math.floor(downloadSpeedReadings.length * 0.15));
      if (validReadings.length > 0) {
        // 80th percentile / stable average
        const sorted = [...validReadings].sort((a, b) => a - b);
        const p80 = sorted[Math.floor(sorted.length * 0.8)];
        const avg = validReadings.reduce((a, b) => a + b, 0) / validReadings.length;
        downloadFinalSpeed = Number(((p80 * 0.5) + (avg * 0.5)).toFixed(2));
      } else {
        const totalDurationSec = Math.max(0.5, (performance.now() - downloadStart) / 1000);
        downloadFinalSpeed = Number(((totalDownloadBytes * 8) / (totalDurationSec * 1000000)).toFixed(2));
      }
      if (downloadFinalSpeed === 0 && totalDownloadBytes > 0) {
        const totalDurationSec = Math.max(0.5, (performance.now() - downloadStart) / 1000);
        downloadFinalSpeed = Number(((totalDownloadBytes * 8) / (totalDurationSec * 1000000)).toFixed(2));
      }

      // PHASE 3: Upload Speed & Upload Loaded Latency
      this.callbacks.onPhaseChange?.('upload');
      const uploadDurationMs = 7500; // 7.5 seconds
      const uploadStart = performance.now();

      let totalUploadBytes = 0;
      let lastUploadTickTime = uploadStart;
      let lastUploadTickBytes = 0;
      let currentUploadMbps = 0;
      const uploadSpeedReadings: number[] = [];
      let uploadStopRequested = false;

      // Create a reusable 1MB pseudo-random high-entropy buffer for uploads
      const UPLOAD_PAYLOAD_SIZE = 1024 * 1024; // 1 MB
      const uploadPayload = new Uint8Array(UPLOAD_PAYLOAD_SIZE);
      for (let i = 0; i < UPLOAD_PAYLOAD_SIZE; i++) {
        uploadPayload[i] = (i * 37 + 109) & 0xff;
      }

      // Loaded latency poller during upload
      const uploadLoadedInterval = setInterval(async () => {
        if (uploadStopRequested || signal.aborted) return;
        try {
          const lStart = performance.now();
          const lRes = await fetch(`${this.endpoint.pingUrl}${this.endpoint.pingUrl.includes('?') ? '&' : '?'}ul_load=${Date.now()}`, {
            cache: 'no-store',
            signal,
          });
          if (lRes.ok) {
            await lRes.text();
            uploadLoadedLatencySamples.push(Math.max(1, performance.now() - lStart));
          }
        } catch {
          // ignore
        }
      }, 750);

      const runUploadWorker = async (workerId: number) => {
        let useFallback = false;
        while (!uploadStopRequested && !signal.aborted) {
          const baseUrl = useFallback ? '/api/speedtest/upload' : this.endpoint.uploadUrl;
          const upUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}w=${workerId}&t=${Date.now()}`;
          try {
            await new Promise<void>((resolve) => {
              const xhr = new XMLHttpRequest();
              xhr.open('POST', upUrl, true);
              // Only send Content-Type to avoid CORS preflight rejection from Cloudflare
              xhr.setRequestHeader('Content-Type', 'application/octet-stream');

              let prevLoaded = 0;
              xhr.upload.onprogress = (e) => {
                if (uploadStopRequested || signal.aborted) {
                  xhr.abort();
                  resolve();
                  return;
                }
                const chunkLoaded = e.loaded - prevLoaded;
                if (chunkLoaded > 0) {
                  totalUploadBytes += chunkLoaded;
                  prevLoaded = e.loaded;
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve();
                } else {
                  useFallback = true;
                  resolve();
                }
              };
              xhr.onerror = () => {
                useFallback = true;
                resolve();
              };
              xhr.onabort = () => resolve();

              signal.addEventListener('abort', () => {
                xhr.abort();
                resolve();
              });

              xhr.send(uploadPayload);
            });
          } catch {
            useFallback = true;
          }
        }
      };

      const CONCURRENT_UPLOADS = 2;
      for (let u = 0; u < CONCURRENT_UPLOADS; u++) {
        runUploadWorker(u);
      }

      // Progress reporting loop for upload
      while (performance.now() - uploadStart < uploadDurationMs && !signal.aborted) {
        await new Promise((r) => setTimeout(r, 120));
        const now = performance.now();
        const deltaSec = (now - lastUploadTickTime) / 1000;
        const deltaBytes = totalUploadBytes - lastUploadTickBytes;

        if (deltaSec > 0.05) {
          const instantMbps = (deltaBytes * 8) / (deltaSec * 1000000);
          currentUploadMbps = Number(instantMbps.toFixed(2));
          uploadSpeedReadings.push(currentUploadMbps);

          lastUploadTickTime = now;
          lastUploadTickBytes = totalUploadBytes;

          const elapsedTotal = (now - startTime) / 1000;
          const pct = 55 + Math.round(((now - uploadStart) / uploadDurationMs) * 35);

          const graphPt: GraphDataPoint = {
            timeOffsetSec: Number(elapsedTotal.toFixed(1)),
            uploadSpeed: currentUploadMbps,
            phase: 'upload',
          };
          graphData.push(graphPt);

          this.callbacks.onProgress?.({
            phase: 'upload',
            currentSpeedMbps: currentUploadMbps,
            downloadSpeedMbps: downloadFinalSpeed,
            uploadSpeedMbps: currentUploadMbps,
            latencyMs: Math.round(idleAvg),
            jitterMs: Number(idleJitter.toFixed(1)),
            progressPercent: Math.min(90, pct),
            graphPoint: graphPt,
          });
        }
      }

      uploadStopRequested = true;
      clearInterval(uploadLoadedInterval);

      // Compute final upload speed
      const validUploads = uploadSpeedReadings.slice(Math.floor(uploadSpeedReadings.length * 0.15));
      if (validUploads.length > 0) {
        const sorted = [...validUploads].sort((a, b) => a - b);
        const p80 = sorted[Math.floor(sorted.length * 0.8)];
        const avg = validUploads.reduce((a, b) => a + b, 0) / validUploads.length;
        uploadFinalSpeed = Number(((p80 * 0.5) + (avg * 0.5)).toFixed(2));
      } else {
        const totalDurationSec = Math.max(0.5, (performance.now() - uploadStart) / 1000);
        uploadFinalSpeed = Number(((totalUploadBytes * 8) / (totalDurationSec * 1000000)).toFixed(2));
      }
      if (uploadFinalSpeed === 0 && totalUploadBytes > 0) {
        const totalDurationSec = Math.max(0.5, (performance.now() - uploadStart) / 1000);
        uploadFinalSpeed = Number(((totalUploadBytes * 8) / (totalDurationSec * 1000000)).toFixed(2));
      }

      // PHASE 4: DNS response test
      this.callbacks.onProgress?.({
        phase: 'complete',
        currentSpeedMbps: downloadFinalSpeed,
        downloadSpeedMbps: downloadFinalSpeed,
        uploadSpeedMbps: uploadFinalSpeed,
        latencyMs: Math.round(idleAvg),
        jitterMs: Number(idleJitter.toFixed(1)),
        progressPercent: 95,
      });

      const dnsResults = await runDnsResponseTest();

      // PHASE 5: Loaded Latency & Bufferbloat Analysis
      const dlLoadedAvg = downloadLoadedLatencySamples.length > 0
        ? downloadLoadedLatencySamples.reduce((a, b) => a + b, 0) / downloadLoadedLatencySamples.length
        : idleAvg;

      const ulLoadedAvg = uploadLoadedLatencySamples.length > 0
        ? uploadLoadedLatencySamples.reduce((a, b) => a + b, 0) / uploadLoadedLatencySamples.length
        : idleAvg;

      const combinedLoadedAvg = (dlLoadedAvg + ulLoadedAvg) / 2;
      const bufferbloatDelta = Math.max(0, Math.round(combinedLoadedAvg - idleAvg));

      let bufferbloatRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
      let bufferbloatExplanation = '';

      if (bufferbloatDelta <= 5) {
        bufferbloatRating = 'A+';
        bufferbloatExplanation = 'Near-zero latency increase under load. Excellent bufferbloat control.';
      } else if (bufferbloatDelta <= 15) {
        bufferbloatRating = 'A';
        bufferbloatExplanation = 'Minimal latency increase under heavy load. Ideal for gaming and voice calls.';
      } else if (bufferbloatDelta <= 40) {
        bufferbloatRating = 'B';
        bufferbloatExplanation = 'Moderate latency elevation under load. May notice minor ping increases during downloads.';
      } else if (bufferbloatDelta <= 75) {
        bufferbloatRating = 'C';
        bufferbloatExplanation = 'Noticeable bufferbloat. Gaming ping will rise whenever someone streams or downloads.';
      } else if (bufferbloatDelta <= 120) {
        bufferbloatRating = 'D';
        bufferbloatExplanation = 'Substantial bufferbloat. Packet delays spike significantly during network transfers.';
      } else {
        bufferbloatRating = 'F';
        bufferbloatExplanation = 'Severe bufferbloat. Latency jumps over 120ms during downloads, causing severe lag spikes.';
      }

      const loadedLatencyResult: LoadedLatencyResult = {
        idleAvg: Math.round(idleAvg),
        downloadLoadedAvg: Math.round(dlLoadedAvg),
        uploadLoadedAvg: Math.round(ulLoadedAvg),
        bufferbloatDelta,
        rating: bufferbloatRating,
        explanation: bufferbloatExplanation,
      };

      const latencyResult: LatencyResult = {
        min: Math.round(idleMin),
        avg: Math.round(idleAvg),
        max: Math.round(idleMax),
        jitter: Number(idleJitter.toFixed(1)),
        samples: idleLatencySamples.map((s) => Math.round(s)),
      };

      // Quality Score
      const score = calculateNetworkScore({
        downloadMbps: downloadFinalSpeed,
        uploadMbps: uploadFinalSpeed,
        latencyAvgMs: idleAvg,
        jitterMs: idleJitter,
        bufferbloatDeltaMs: bufferbloatDelta,
        isComplete: true,
      });

      // Troubleshooting insights
      const insights = generateTroubleshootingInsights({
        downloadMbps: downloadFinalSpeed,
        uploadMbps: uploadFinalSpeed,
        latencyAvgMs: idleAvg,
        latencyMinMs: idleMin,
        jitterMs: idleJitter,
        loadedLatencyAvgMs: combinedLoadedAvg,
        bufferbloatDeltaMs: bufferbloatDelta,
        isComplete: true,
        dnsLatencyMs: dnsResults.find((d) => d.latencyMs !== null)?.latencyMs,
      });

      // Category Suitability
      const suitability = evaluateSuitability({
        downloadMbps: downloadFinalSpeed,
        uploadMbps: uploadFinalSpeed,
        latencyAvgMs: idleAvg,
        jitterMs: idleJitter,
        bufferbloatDeltaMs: bufferbloatDelta,
      });

      const fullResult: SpeedTestResult = {
        id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        dateFormatted: new Date().toLocaleString(),
        endpointName: this.endpoint.name,
        downloadSpeedMbps: downloadFinalSpeed,
        uploadSpeedMbps: uploadFinalSpeed,
        latency: latencyResult,
        loadedLatency: loadedLatencyResult,
        dns: dnsResults,
        score,
        insights,
        suitability,
        isComplete: true,
      };

      this.callbacks.onPhaseChange?.('complete');
      this.callbacks.onProgress?.({
        phase: 'complete',
        currentSpeedMbps: 0,
        downloadSpeedMbps: downloadFinalSpeed,
        uploadSpeedMbps: uploadFinalSpeed,
        latencyMs: Math.round(idleAvg),
        jitterMs: Number(idleJitter.toFixed(1)),
        progressPercent: 100,
      });
      this.callbacks.onComplete?.(fullResult);
    } catch (err: unknown) {
      if (signal.aborted) {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Speed test encountered an unexpected network error.';
      this.callbacks.onPhaseChange?.('error');
      this.callbacks.onError?.(errorMessage);
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  /**
   * RFC 3550 Standard Jitter calculation:
   * Jitter = Sum(|D(i, i-1)|) / (N - 1)
   */
  private calculateJitter(samples: number[]): number {
    if (samples.length < 2) return 0;
    let sumDiff = 0;
    for (let i = 1; i < samples.length; i++) {
      sumDiff += Math.abs(samples[i] - samples[i - 1]);
    }
    return sumDiff / (samples.length - 1);
  }
}
