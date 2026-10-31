import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

export async function GET() {
  return new NextResponse(JSON.stringify({ ok: true, timestamp: Date.now() }), {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...headers,
      'Access-Control-Allow-Headers': '*',
    },
  });
}
