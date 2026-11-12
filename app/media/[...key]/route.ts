import { NextResponse, type NextRequest } from 'next/server';
import { getObject, isMissing } from '@/lib/storage';

// Public website photos stored in R2 (Work posts, Pages & design, Journal).
// Served from the site's own address with a one-year cache: every upload gets a new name,
// so a file never changes once published. Client gallery photos are never served here.
const PUBLIC = ['work/', 'site/', 'journal/'];
const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

// Small in-memory cache of recently served photos, so busy pages don't fetch the same
// file from storage again and again.
const MAX_BYTES = 64 * 1024 * 1024;
const cache = new Map<string, Buffer>();
let cached = 0;
function remember(key: string, body: Buffer) {
  if (body.length > 4 * 1024 * 1024) return;
  cache.set(key, body); cached += body.length;
  for (const [k, v] of cache) { if (cached <= MAX_BYTES) break; cache.delete(k); cached -= v.length; }
}

async function load(key: string) {
  const hit = cache.get(key);
  if (hit) { cache.delete(key); cache.set(key, hit); return hit; }
  let lastError: unknown;
  for (let i = 0; i < 3; i++) {
    try { const body = await getObject(key); remember(key, body); return body; } catch (e) {
      if (isMissing(e)) throw e;
      lastError = e;
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }
  throw lastError;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join('/');
  const ext = key.split('.').pop()?.toLowerCase() || '';
  if (!PUBLIC.some((p) => key.startsWith(p)) || key.includes('..') || !TYPES[ext]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const body = await load(key);
    return new NextResponse(new Uint8Array(body), {
      headers: { 'Content-Type': TYPES[ext], 'Content-Length': String(body.length), 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch (e) {
    if (isMissing(e)) return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    console.error('media: could not load', key, e);
    // A passing storage hiccup: never let a browser or CDN keep this error.
    return new NextResponse('Try again', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '2' } });
  }
}
