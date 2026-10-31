export type TestPhase = 
  | 'idle' 
  | 'ping' 
  | 'download' 
  | 'upload' 
  | 'complete' 
  | 'error';

export interface LatencyResult {
  min: number;
  avg: number;
  max: number;
  jitter: number;
  samples: number[];
}

export interface LoadedLatencyResult {
  idleAvg: number;
  downloadLoadedAvg: number;
  uploadLoadedAvg: number;
  bufferbloatDelta: number; // difference in ms between loaded and idle
  rating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  explanation: string;
}

export interface DnsTestResult {
  provider: string;
  endpoint: string;
  latencyMs: number | null;
  status: 'success' | 'failed' | 'running' | 'untested';
  ipResolved?: string;
  error?: string;
}

export interface NetworkInfo {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  asn?: string;
  hostname?: string;
  isV6Supported?: boolean;
  status: 'loading' | 'success' | 'unavailable' | 'error';
  source?: string;
}

export interface SpeedTestScoreBreakdown {
  totalScore: number;
  tier: 'Exceptional' | 'Great' | 'Good' | 'Fair' | 'Poor';
  color: string;
  summary: string;
  downloadSubscore: number; // 0-100
  uploadSubscore: number;   // 0-100
  latencySubscore: number;  // 0-100
  jitterSubscore: number;   // 0-100
  bufferbloatSubscore: number; // 0-100
  reasons: string[];
}

export interface SuitabilityMetric {
  title: string;
  category: 'gaming' | 'videocall' | 'streaming4k' | 'cloudGaming' | 'browsing';
  status: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
  icon: string;
}

export interface TroubleshootingInsight {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  recommendation: string;
}

export interface SpeedTestResult {
  id: string;
  timestamp: number;
  dateFormatted: string;
  endpointName: string;
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  latency: LatencyResult;
  loadedLatency: LoadedLatencyResult;
  dns: DnsTestResult[];
  networkInfo?: NetworkInfo;
  score: SpeedTestScoreBreakdown;
  insights: TroubleshootingInsight[];
  suitability: SuitabilityMetric[];
  isComplete: boolean;
  errorMessage?: string;
}

export interface GraphDataPoint {
  timeOffsetSec: number;
  downloadSpeed?: number;
  uploadSpeed?: number;
  latencySample?: number;
  phase: 'idle' | 'ping' | 'download' | 'upload' | 'complete';
}

export interface TestServerEndpoint {
  id: string;
  name: string;
  location: string;
  provider: 'SwiftNet Next.js Local' | 'Cloudflare Global Edge';
  pingUrl: string;
  downloadUrl: string;
  uploadUrl: string;
  description: string;
}
