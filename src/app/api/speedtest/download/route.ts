import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Pre-fill a 64KB buffer with pseudo-random high-entropy data so compression cannot fake transfer speeds
const CHUNK_SIZE = 64 * 1024; // 64 KB
const SAMPLE_BUFFER = new Uint8Array(CHUNK_SIZE);
for (let i = 0; i < CHUNK_SIZE; i++) {
  // Linear congruential pseudo-random generator
  SAMPLE_BUFFER[i] = (i * 1664525 + 1013904223) & 0xff;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedBytes = parseInt(searchParams.get('bytes') || '5242880', 10); // default 5MB

  // Bound requested size between 64KB and 50MB
  const totalBytes = Math.min(Math.max(requestedBytes, 64 * 1024), 50 * 1024 * 1024);

  let bytesSent = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= totalBytes) {
        controller.close();
        return;
      }

      const remaining = totalBytes - bytesSent;
      const chunkSize = Math.min(remaining, CHUNK_SIZE);

      if (chunkSize === CHUNK_SIZE) {
        controller.enqueue(SAMPLE_BUFFER);
      } else {
        controller.enqueue(SAMPLE_BUFFER.subarray(0, chunkSize));
      }

      bytesSent += chunkSize;
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': totalBytes.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Length',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
