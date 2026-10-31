import { describe, it, expect } from 'vitest';
import { calculateNetworkScore, evaluateSuitability } from './scoring';

describe('calculateNetworkScore', () => {
  it('returns high score for fast, low-latency gigabit connection', () => {
    const result = calculateNetworkScore({
      downloadMbps: 450,
      uploadMbps: 180,
      latencyAvgMs: 12,
      jitterMs: 1.5,
      bufferbloatDeltaMs: 4,
      isComplete: true,
    });

    expect(result.totalScore).toBeGreaterThanOrEqual(85);
    expect(['Exceptional', 'Great']).toContain(result.tier);
    expect(result.downloadSubscore).toBeGreaterThan(80);
    expect(result.latencySubscore).toBe(100);
  });

  it('penalizes score heavily for high latency and bufferbloat', () => {
    const result = calculateNetworkScore({
      downloadMbps: 15,
      uploadMbps: 2,
      latencyAvgMs: 140,
      jitterMs: 35,
      bufferbloatDeltaMs: 120,
      isComplete: true,
    });

    expect(result.totalScore).toBeLessThan(50);
    expect(['Fair', 'Poor']).toContain(result.tier);
  });

  it('handles incomplete or failed tests gracefully', () => {
    const result = calculateNetworkScore({
      downloadMbps: 0,
      uploadMbps: 0,
      latencyAvgMs: 0,
      jitterMs: 0,
      bufferbloatDeltaMs: 0,
      isComplete: false,
    });

    expect(result.totalScore).toBe(0);
    expect(result.tier).toBe('Poor');
  });
});

describe('evaluateSuitability', () => {
  it('correctly qualifies competitive gaming for low latency and minimal bufferbloat', () => {
    const metrics = evaluateSuitability({
      downloadMbps: 100,
      uploadMbps: 50,
      latencyAvgMs: 15,
      jitterMs: 2,
      bufferbloatDeltaMs: 5,
    });

    const gaming = metrics.find((m) => m.category === 'gaming');
    expect(gaming).toBeDefined();
    expect(gaming?.status).toBe('excellent');
  });

  it('flags 4K streaming as poor if download bandwidth is under 10 Mbps', () => {
    const metrics = evaluateSuitability({
      downloadMbps: 6,
      uploadMbps: 1,
      latencyAvgMs: 40,
      jitterMs: 5,
      bufferbloatDeltaMs: 10,
    });

    const streaming = metrics.find((m) => m.category === 'streaming4k');
    expect(streaming).toBeDefined();
    expect(streaming?.status).toBe('poor');
  });
});
