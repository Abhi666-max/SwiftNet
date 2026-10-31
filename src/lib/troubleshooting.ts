import { TroubleshootingInsight } from '@/types/speedtest';

interface DiagnosticsInput {
  downloadMbps: number;
  uploadMbps: number;
  latencyAvgMs: number;
  latencyMinMs: number;
  jitterMs: number;
  loadedLatencyAvgMs: number;
  bufferbloatDeltaMs: number;
  isComplete: boolean;
  dnsLatencyMs?: number | null;
  hasError?: boolean;
  errorMessage?: string;
}

export function generateTroubleshootingInsights(data: DiagnosticsInput): TroubleshootingInsight[] {
  const insights: TroubleshootingInsight[] = [];

  if (data.hasError) {
    insights.push({
      id: 'test-failure',
      type: 'critical',
      title: 'Test Interrupted or Network Request Failed',
      description: data.errorMessage || 'One or more network requests timed out or could not be established.',
      recommendation: 'Check whether your device is connected to the local network or Wi-Fi. Verify if an ad-blocker, VPN, or firewall is blocking test endpoints, then retry.',
    });
    return insights;
  }

  // 1. Bufferbloat / Loaded Latency
  if (data.bufferbloatDeltaMs > 75) {
    insights.push({
      id: 'bufferbloat-high',
      type: 'warning',
      title: 'High Loaded Latency (Bufferbloat Detected)',
      description: `Latency surged by +${data.bufferbloatDeltaMs.toFixed(0)} ms (reaching ${data.loadedLatencyAvgMs.toFixed(0)} ms) while your connection was transmitting data.`,
      recommendation: 'Excessive router packet queuing is likely causing latency spikes during heavy traffic. Consider enabling Smart Queue Management (SQM) / Cake / FQ-CoDel on your router, or prioritizing voice/gaming traffic with Quality of Service (QoS).',
    });
  } else if (data.bufferbloatDeltaMs <= 15 && data.isComplete) {
    insights.push({
      id: 'bufferbloat-clean',
      type: 'success',
      title: 'Excellent Queue Management Under Load',
      description: `Your loaded latency only shifted by +${data.bufferbloatDeltaMs.toFixed(0)} ms during active downloads.`,
      recommendation: 'Your local router and ISP handle concurrent traffic efficiently without introducing latency spikes.',
    });
  }

  // 2. High Jitter / Connection Stability
  if (data.jitterMs > 18) {
    insights.push({
      id: 'jitter-high',
      type: 'warning',
      title: 'Elevated Packet Delay Variation (Jitter)',
      description: `Measured jitter of ${data.jitterMs.toFixed(1)} ms indicates fluctuating round-trip times between consecutive packets.`,
      recommendation: 'Common causes include Wi-Fi channel interference, physical distance from the access point, or background torrents/cloud backups. Try switching from 2.4 GHz to 5 GHz Wi-Fi, or test using a direct Ethernet cable.',
    });
  } else if (data.jitterMs < 4 && data.isComplete) {
    insights.push({
      id: 'jitter-stable',
      type: 'success',
      title: 'Rock-Solid Connection Stability',
      description: `Measured jitter is exceptionally low (${data.jitterMs.toFixed(1)} ms), meaning packet transit times are remarkably consistent.`,
      recommendation: 'Your link stability is optimal for real-time multiplayer gaming, VoIP calling, and video meetings.',
    });
  }

  // 3. Base Latency
  if (data.latencyAvgMs > 120) {
    insights.push({
      id: 'latency-elevated',
      type: 'warning',
      title: 'High Base HTTP Latency',
      description: `Average HTTP response time is ${data.latencyAvgMs.toFixed(0)} ms (min: ${data.latencyMinMs.toFixed(0)} ms).`,
      recommendation: 'High latency is frequently correlated with geographic distance to the test server, mobile cellular routing (4G/LTE), or multiple intermediate ISP hops. Try selecting a closer endpoint or checking if an active VPN is rerouting traffic.',
    });
  }

  // 4. Download Bandwidth
  if (data.downloadMbps < 15 && data.isComplete) {
    insights.push({
      id: 'download-low',
      type: 'warning',
      title: 'Limited Download Bandwidth',
      description: `Download speed measured at ${data.downloadMbps.toFixed(1)} Mbps.`,
      recommendation: 'Verify if your ISP subscribed plan speed matches this result. Also check if other family members or smart devices (OS updates, game downloads, security cameras) are saturating the connection.',
    });
  } else if (data.downloadMbps > 150) {
    insights.push({
      id: 'download-high',
      type: 'success',
      title: 'Gigabit-Tier Download Capacity',
      description: `Measured ${data.downloadMbps.toFixed(1)} Mbps provides massive throughput for 4K streaming and gigabyte downloads in seconds.`,
      recommendation: 'Bandwidth is plentiful. Ensure your local home network switches and cables support Cat5e/Cat6 to take full advantage.',
    });
  }

  // 5. Upload Bandwidth Asymmetry
  if (data.downloadMbps > 80 && data.uploadMbps < 5 && data.isComplete) {
    insights.push({
      id: 'upload-asymmetric',
      type: 'info',
      title: 'Asymmetrical Connection Detected',
      description: `Download (${data.downloadMbps.toFixed(1)} Mbps) is substantially faster than upload (${data.uploadMbps.toFixed(1)} Mbps).`,
      recommendation: 'This is typical of DOCSIS cable internet and VDSL plans. Be cautious with large video uploads or cloud syncs, as they may choke downstream acknowledgments if unmanaged.',
    });
  }

  // 6. DNS Resolution
  if (data.dnsLatencyMs && data.dnsLatencyMs > 140) {
    insights.push({
      id: 'dns-sluggish',
      type: 'info',
      title: 'Slower DNS Query Times',
      description: `Secure DNS resolution required ${data.dnsLatencyMs.toFixed(0)} ms.`,
      recommendation: 'Consider configuring fast public encrypted DNS resolvers (such as Cloudflare 1.1.1.1, Google 8.8.8.8, or Quad9 9.9.9.9) on your router or device settings for snappier initial web browsing.',
    });
  }

  return insights;
}
