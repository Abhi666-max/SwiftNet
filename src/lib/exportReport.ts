import { SpeedTestResult } from '@/types/speedtest';

export function exportResultToJson(result: SpeedTestResult): void {
  const exportPayload = {
    application: 'SwiftNet - Internet Speed Testing and Network Diagnostics Platform',
    version: '1.0.0',
    disclaimer: 'Measurements are HTTP-based application-level tests subject to browser capabilities, endpoint distance, Wi-Fi variance, and local device load. They do not constitute certified ICMP or physical link-layer diagnostics.',
    exportDate: new Date().toISOString(),
    testData: result,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  triggerDownload(blob, `swiftnet_report_${result.id}.json`);
}

export function exportHistoryToCsv(results: SpeedTestResult[]): void {
  if (results.length === 0) return;

  const headers = [
    'Test ID',
    'Date & Time',
    'Server Endpoint',
    'Download (Mbps)',
    'Upload (Mbps)',
    'Latency Min (ms)',
    'Latency Avg (ms)',
    'Latency Max (ms)',
    'Jitter (ms)',
    'Loaded Latency (ms)',
    'Bufferbloat Delta (ms)',
    'Bufferbloat Grade',
    'Network Score (0-100)',
    'Score Tier',
    'ISP / Organization',
    'Public IP',
    'Test Complete',
  ];

  const rows = results.map((r) => [
    `"${r.id}"`,
    `"${r.dateFormatted}"`,
    `"${r.endpointName}"`,
    r.downloadSpeedMbps.toFixed(2),
    r.uploadSpeedMbps.toFixed(2),
    r.latency?.min ?? 'N/A',
    r.latency?.avg ?? 'N/A',
    r.latency?.max ?? 'N/A',
    r.latency?.jitter ?? 'N/A',
    r.loadedLatency?.downloadLoadedAvg ?? 'N/A',
    r.loadedLatency?.bufferbloatDelta ?? 'N/A',
    `"${r.loadedLatency?.rating ?? 'N/A'}"`,
    r.score?.totalScore ?? 'N/A',
    `"${r.score?.tier ?? 'N/A'}"`,
    `"${r.networkInfo?.org || 'N/A'}"`,
    `"${r.networkInfo?.ip || 'N/A'}"`,
    r.isComplete ? 'Yes' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `swiftnet_history_export_${Date.now()}.csv`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
