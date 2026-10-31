import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Check headers provided by reverse proxies (Vercel, Cloudflare, Nginx, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');

  const clientIp = cfIp || (forwarded ? forwarded.split(',')[0].trim() : null) || realIp;

  const isLocal = !clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');

  let networkData: {
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    org?: string;
    asn?: string;
    source?: string;
    status: 'success' | 'unavailable' | 'error';
  } = {
    status: 'unavailable',
  };

  try {
    // If local or missing geo-details, query an external public IP service with 3.5s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const lookupUrl = isLocal 
      ? 'https://ipapi.co/json/' 
      : `https://ipapi.co/${clientIp}/json/`;

    const res = await fetch(lookupUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SwiftNet/1.0',
        'Accept': 'application/json',
      },
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      const data = await res.json();
      if (data && !data.error) {
        networkData = {
          ip: data.ip || clientIp || 'Unknown',
          city: data.city || 'Unknown',
          region: data.region || '',
          country: data.country_name || data.country || 'Unknown',
          org: data.org || data.asn || 'Internet Service Provider',
          asn: data.asn || '',
          source: 'ipapi.co',
          status: 'success',
        };
      }
    }

    // Fallback: if ipapi is rate-limited or unavailable, try ipify
    if (networkData.status !== 'success') {
      const ipifyController = new AbortController();
      const ipifyTimeout = setTimeout(() => ipifyController.abort(), 2500);
      const ipifyRes = await fetch('https://api.ipify.org?format=json', {
        signal: ipifyController.signal,
      }).catch(() => null);
      clearTimeout(ipifyTimeout);

      if (ipifyRes && ipifyRes.ok) {
        const ipifyData = await ipifyRes.json();
        networkData = {
          ip: ipifyData.ip || clientIp || 'Detected',
          org: 'Detected Provider',
          source: 'api.ipify.org',
          status: 'success',
        };
      }
    }
  } catch {
    // If external call fails, fallback gracefully to request header IP or local indicator
    if (clientIp) {
      networkData = {
        ip: clientIp,
        org: isLocal ? 'Localhost / Intranet' : 'External Client',
        source: 'Request Headers',
        status: 'success',
      };
    }
  }

  return NextResponse.json(networkData, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
