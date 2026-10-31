import { SpeedTestScoreBreakdown, SuitabilityMetric } from '@/types/speedtest';

/**
 * SwiftNet Network Quality Score Calculator
 * 
 * Transparent scoring formula (0 - 100):
 * 1. Download Speed (Weight 30%): Log-scaled from 0 to 500+ Mbps
 * 2. Upload Speed   (Weight 20%): Log-scaled from 0 to 200+ Mbps
 * 3. Base Latency   (Weight 25%): Linear dropoff from <15ms (100) to >150ms (0)
 * 4. Jitter         (Weight 15%): Linear dropoff from <3ms (100) to >35ms (0)
 * 5. Loaded Latency (Weight 10%): Linear dropoff from <15ms delta (100) to >120ms delta (0)
 */
export function calculateNetworkScore(params: {
  downloadMbps: number;
  uploadMbps: number;
  latencyAvgMs: number;
  jitterMs: number;
  bufferbloatDeltaMs: number;
  isComplete: boolean;
}): SpeedTestScoreBreakdown {
  const { downloadMbps, uploadMbps, latencyAvgMs, jitterMs, bufferbloatDeltaMs, isComplete } = params;

  if (!isComplete && downloadMbps === 0 && uploadMbps === 0) {
    return {
      totalScore: 0,
      tier: 'Poor',
      color: '#94A3B8',
      summary: 'Test incomplete or interrupted.',
      downloadSubscore: 0,
      uploadSubscore: 0,
      latencySubscore: 0,
      jitterSubscore: 0,
      bufferbloatSubscore: 0,
      reasons: ['The test did not collect sufficient samples to generate a quality score.'],
    };
  }

  // 1. Download Subscore (30 pts max)
  // 10 Mbps = 40%, 50 Mbps = 70%, 100 Mbps = 85%, 300+ Mbps = 100%
  let downloadSubscore = 0;
  if (downloadMbps > 0) {
    const rawDl = Math.min(100, Math.round((Math.log10(Math.max(1, downloadMbps)) / Math.log10(500)) * 100));
    downloadSubscore = Math.max(5, rawDl);
  }

  // 2. Upload Subscore (20 pts max)
  // 5 Mbps = 45%, 20 Mbps = 70%, 50 Mbps = 85%, 150+ Mbps = 100%
  let uploadSubscore = 0;
  if (uploadMbps > 0) {
    const rawUl = Math.min(100, Math.round((Math.log10(Math.max(1, uploadMbps)) / Math.log10(200)) * 100));
    uploadSubscore = Math.max(5, rawUl);
  }

  // 3. Latency Subscore (25 pts max)
  // <= 15ms -> 100, 50ms -> 75, 100ms -> 40, >= 160ms -> 5
  let latencySubscore = 100;
  if (latencyAvgMs <= 15) {
    latencySubscore = 100;
  } else if (latencyAvgMs >= 160) {
    latencySubscore = 5;
  } else {
    latencySubscore = Math.round(100 - ((latencyAvgMs - 15) / (160 - 15)) * 95);
  }

  // 4. Jitter Subscore (15 pts max)
  // <= 2ms -> 100, 10ms -> 70, 25ms -> 30, >= 40ms -> 5
  let jitterSubscore = 100;
  if (jitterMs <= 2) {
    jitterSubscore = 100;
  } else if (jitterMs >= 40) {
    jitterSubscore = 5;
  } else {
    jitterSubscore = Math.round(100 - ((jitterMs - 2) / (40 - 2)) * 95);
  }

  // 5. Bufferbloat / Loaded Latency Delta Subscore (10 pts max)
  // <= 10ms delta -> 100, 40ms delta -> 70, 100ms delta -> 25, >= 150ms delta -> 5
  let bufferbloatSubscore = 100;
  if (bufferbloatDeltaMs <= 10) {
    bufferbloatSubscore = 100;
  } else if (bufferbloatDeltaMs >= 150) {
    bufferbloatSubscore = 5;
  } else {
    bufferbloatSubscore = Math.round(100 - ((bufferbloatDeltaMs - 10) / (150 - 10)) * 95);
  }

  // Weighted total score
  const totalWeighted = (
    downloadSubscore * 0.30 +
    uploadSubscore * 0.20 +
    latencySubscore * 0.25 +
    jitterSubscore * 0.15 +
    bufferbloatSubscore * 0.10
  );

  const totalScore = Math.max(1, Math.min(100, Math.round(totalWeighted)));

  let tier: 'Exceptional' | 'Great' | 'Good' | 'Fair' | 'Poor';
  let color: string;
  let summary: string;

  if (totalScore >= 90) {
    tier = 'Exceptional';
    color = '#00F2FE'; // electric cyan
    summary = 'Outstanding internet quality across bandwidth, responsiveness, and load stability.';
  } else if (totalScore >= 75) {
    tier = 'Great';
    color = '#10B981'; // emerald green
    summary = 'Reliable high-speed performance suitable for intensive multi-user home and remote work demands.';
  } else if (totalScore >= 60) {
    tier = 'Good';
    color = '#38BDF8'; // sky blue
    summary = 'Good everyday connection for HD streaming, web browsing, and regular teleconferencing.';
  } else if (totalScore >= 40) {
    tier = 'Fair';
    color = '#F59E0B'; // amber
    summary = 'Moderate connection. May experience occasional lag or buffering during simultaneous heavy usage.';
  } else {
    tier = 'Poor';
    color = '#F43F5E'; // rose
    summary = 'Sub-optimal connection with latency bottlenecks or severe bandwidth limitations.';
  }

  const reasons: string[] = [];
  if (downloadSubscore >= 85) {
    reasons.push(`Fast download bandwidth (${downloadMbps.toFixed(1)} Mbps) handles high-throughput tasks with ease.`);
  } else if (downloadSubscore < 50) {
    reasons.push(`Download throughput (${downloadMbps.toFixed(1)} Mbps) may bottleneck multi-device downloads.`);
  }

  if (latencySubscore >= 85) {
    reasons.push(`Ultra-low latency (${latencyAvgMs.toFixed(0)} ms) ensures immediate application response.`);
  } else if (latencySubscore < 50) {
    reasons.push(`Elevated base latency (${latencyAvgMs.toFixed(0)} ms) introduces noticeable delay in interactive sessions.`);
  }

  if (jitterSubscore >= 85) {
    reasons.push(`Minimal packet delay variation (${jitterMs.toFixed(1)} ms jitter) delivers exceptional stream stability.`);
  } else if (jitterSubscore < 50) {
    reasons.push(`Significant jitter (${jitterMs.toFixed(1)} ms) may cause choppy voice/video communication.`);
  }

  if (bufferbloatSubscore < 50) {
    reasons.push(`Heavy traffic increases latency by +${bufferbloatDeltaMs.toFixed(0)} ms (loaded latency), causing bufferbloat.`);
  }

  return {
    totalScore,
    tier,
    color,
    summary,
    downloadSubscore,
    uploadSubscore,
    latencySubscore,
    jitterSubscore,
    bufferbloatSubscore,
    reasons,
  };
}

export function evaluateSuitability(metrics: {
  downloadMbps: number;
  uploadMbps: number;
  latencyAvgMs: number;
  jitterMs: number;
  bufferbloatDeltaMs: number;
}): SuitabilityMetric[] {
  const { downloadMbps, uploadMbps, latencyAvgMs, jitterMs, bufferbloatDeltaMs } = metrics;

  // 1. Online Competitive Gaming
  let gamingStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  let gamingSummary = '';
  if (latencyAvgMs <= 30 && jitterMs <= 5 && bufferbloatDeltaMs <= 20) {
    gamingStatus = 'excellent';
    gamingSummary = 'Ideal for competitive esports, fast-paced FPS, and fighting games.';
  } else if (latencyAvgMs <= 60 && jitterMs <= 12 && bufferbloatDeltaMs <= 50) {
    gamingStatus = 'good';
    gamingSummary = 'Smooth experience for most online multiplayer titles.';
  } else if (latencyAvgMs <= 110 && jitterMs <= 25) {
    gamingStatus = 'fair';
    gamingSummary = 'Playable for turn-based and casual games; occasional desync in fast titles.';
  } else {
    gamingStatus = 'poor';
    gamingSummary = 'High latency or instability will likely cause noticeable lag spikes and rubberbanding.';
  }

  // 2. Video Calls & Conferencing (Zoom, Teams, Discord, Meet)
  let callStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  let callSummary = '';
  if (uploadMbps >= 6 && downloadMbps >= 10 && latencyAvgMs <= 60 && jitterMs <= 10) {
    callStatus = 'excellent';
    callSummary = 'Crystal clear HD video & voice calls with near-zero audio stutter.';
  } else if (uploadMbps >= 3 && downloadMbps >= 5 && latencyAvgMs <= 100 && jitterMs <= 20) {
    callStatus = 'good';
    callSummary = 'Stable video meetings with standard quality screen sharing.';
  } else if (uploadMbps >= 1.5 && downloadMbps >= 2.5) {
    callStatus = 'fair';
    callSummary = 'Audio will function, but video resolution may downscale during peak traffic.';
  } else {
    callStatus = 'poor';
    callSummary = 'Limited bandwidth or severe jitter may cause robot-voice and dropped calls.';
  }

  // 3. 4K Ultra HD Streaming (Netflix, YouTube, Prime)
  let streamStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  let streamSummary = '';
  if (downloadMbps >= 50) {
    streamStatus = 'excellent';
    streamSummary = 'Flawless 4K HDR playback simultaneously across multiple screens.';
  } else if (downloadMbps >= 25) {
    streamStatus = 'good';
    streamSummary = 'Smooth single-device 4K streaming with quick initial buffering.';
  } else if (downloadMbps >= 10) {
    streamStatus = 'fair';
    streamSummary = 'Suitable for 1080p Full HD; 4K streams may experience buffering pauses.';
  } else {
    streamStatus = 'poor';
    streamSummary = 'Limited to 720p HD or standard definition streams.';
  }

  // 4. Cloud Gaming (GeForce Now, Xbox Cloud, Boosteroid)
  let cloudStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  let cloudSummary = '';
  if (downloadMbps >= 45 && latencyAvgMs <= 35 && jitterMs <= 5) {
    cloudStatus = 'excellent';
    cloudSummary = 'Pristine 1080p/4K 60fps+ cloud streaming with responsive input controls.';
  } else if (downloadMbps >= 25 && latencyAvgMs <= 55 && jitterMs <= 10) {
    cloudStatus = 'good';
    cloudSummary = 'Reliable cloud gaming sessions with standard input response.';
  } else if (downloadMbps >= 15 && latencyAvgMs <= 85) {
    cloudStatus = 'fair';
    cloudSummary = 'Noticeable controller input lag and occasional video compression artifacts.';
  } else {
    cloudStatus = 'poor';
    cloudSummary = 'Cloud gaming requires lower latency and higher sustained bandwidth.';
  }

  // 5. General Web Browsing & Social Media
  let browseStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  let browseSummary = '';
  if (downloadMbps >= 15 && latencyAvgMs <= 100) {
    browseStatus = 'excellent';
    browseSummary = 'Instantaneous page loading, rapid downloads, and fluid social feeds.';
  } else if (downloadMbps >= 5) {
    browseStatus = 'good';
    browseSummary = 'Comfortable everyday browsing for news, research, and e-commerce.';
  } else if (downloadMbps >= 2) {
    browseStatus = 'fair';
    browseSummary = 'Pages with heavy images and interactive scripts may load sluggishly.';
  } else {
    browseStatus = 'poor';
    browseSummary = 'Severely restricted web experience with noticeable loading delays.';
  }

  return [
    {
      title: 'Online Gaming',
      category: 'gaming',
      status: gamingStatus,
      summary: gamingSummary,
      icon: 'Gamepad2',
    },
    {
      title: 'Video Conferencing',
      category: 'videocall',
      status: callStatus,
      summary: callSummary,
      icon: 'Video',
    },
    {
      title: '4K Ultra HD Streaming',
      category: 'streaming4k',
      status: streamStatus,
      summary: streamSummary,
      icon: 'Tv',
    },
    {
      title: 'Cloud Gaming',
      category: 'cloudGaming',
      status: cloudStatus,
      summary: cloudSummary,
      icon: 'CloudLightning',
    },
    {
      title: 'Web Browsing',
      category: 'browsing',
      status: browseStatus,
      summary: browseSummary,
      icon: 'Globe',
    },
  ];
}
