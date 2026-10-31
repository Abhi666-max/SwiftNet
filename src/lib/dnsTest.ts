import { DnsTestResult } from '@/types/speedtest';

interface DohProviderConfig {
  provider: string;
  url: string;
  headers: Record<string, string>;
  extractIp: (data: unknown) => string | undefined;
}

const PROVIDERS: DohProviderConfig[] = [
  {
    provider: 'Cloudflare 1.1.1.1 (DoH)',
    url: 'https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A',
    headers: { 'Accept': 'application/dns-json' },
    extractIp: (data: unknown) => {
      const res = data as { Answer?: Array<{ data: string }> };
      return res?.Answer?.[0]?.data;
    },
  },
  {
    provider: 'Google Public DNS 8.8.8.8 (DoH)',
    url: 'https://dns.google/resolve?name=google.com&type=A',
    headers: { 'Accept': 'application/json' },
    extractIp: (data: unknown) => {
      const res = data as { Answer?: Array<{ data: string }> };
      return res?.Answer?.[0]?.data;
    },
  },
];

export async function runDnsResponseTest(): Promise<DnsTestResult[]> {
  const results: DnsTestResult[] = [];

  for (const config of PROVIDERS) {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${config.url}&t=${Date.now()}`, {
        headers: config.headers,
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const json = await res.json();
        const resolvedIp = config.extractIp(json);
        results.push({
          provider: config.provider,
          endpoint: config.url.split('?')[0],
          latencyMs,
          status: 'success',
          ipResolved: resolvedIp,
        });
      } else {
        results.push({
          provider: config.provider,
          endpoint: config.url.split('?')[0],
          latencyMs: null,
          status: 'failed',
          error: `HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err) {
      results.push({
        provider: config.provider,
        endpoint: config.url.split('?')[0],
        latencyMs: null,
        status: 'failed',
        error: err instanceof Error ? err.message : 'DNS lookup request failed or timed out',
      });
    }
  }

  return results;
}
