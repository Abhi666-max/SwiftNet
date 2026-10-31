import { describe, it, expect } from 'vitest';
import { generateTroubleshootingInsights } from './troubleshooting';

describe('generateTroubleshootingInsights', () => {
  it('detects high bufferbloat and suggests SQM/QoS', () => {
    const insights = generateTroubleshootingInsights({
      downloadMbps: 80,
      uploadMbps: 15,
      latencyAvgMs: 25,
      latencyMinMs: 20,
      jitterMs: 3,
      loadedLatencyAvgMs: 135,
      bufferbloatDeltaMs: 110,
      isComplete: true,
    });

    const bufferbloatInsight = insights.find((i) => i.id === 'bufferbloat-high');
    expect(bufferbloatInsight).toBeDefined();
    expect(bufferbloatInsight?.type).toBe('warning');
    expect(bufferbloatInsight?.recommendation).toContain('Smart Queue Management (SQM)');
  });

  it('detects high jitter and suggests 5GHz Wi-Fi or Ethernet', () => {
    const insights = generateTroubleshootingInsights({
      downloadMbps: 45,
      uploadMbps: 10,
      latencyAvgMs: 30,
      latencyMinMs: 22,
      jitterMs: 25,
      loadedLatencyAvgMs: 35,
      bufferbloatDeltaMs: 5,
      isComplete: true,
    });

    const jitterInsight = insights.find((i) => i.id === 'jitter-high');
    expect(jitterInsight).toBeDefined();
    expect(jitterInsight?.type).toBe('warning');
    expect(jitterInsight?.recommendation).toContain('Ethernet');
  });

  it('handles error state properly', () => {
    const insights = generateTroubleshootingInsights({
      downloadMbps: 0,
      uploadMbps: 0,
      latencyAvgMs: 0,
      latencyMinMs: 0,
      jitterMs: 0,
      loadedLatencyAvgMs: 0,
      bufferbloatDeltaMs: 0,
      isComplete: false,
      hasError: true,
      errorMessage: 'Connection timed out',
    });

    expect(insights.length).toBe(1);
    expect(insights[0].type).toBe('critical');
    expect(insights[0].title).toContain('Interrupted');
  });
});
