import { NextResponse, type NextRequest } from 'next/server';
import { getObject } from '@/lib/storage';

// Public website photos stored in R2 (Work posts, Pages & design, Journal).
// Served from the site's own address with a one-year cache: every upload gets a new name,
// so a file never changes once published. Client gallery photos are never served here.
const PUBLIC = ['work/', 'site/', 'journal/'];
const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join('/');
  const ext = key.split('.').pop()?.toLowerCase() || '';
  if (!PUBLIC.some((p) => key.startsWith(p)) || key.includes('..') || !TYPES[ext]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const body = await getObject(key);
    return new NextResponse(new Uint8Array(body), {
      headers: { 'Content-Type': TYPES[ext], 'Content-Length': String(body.length), 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
  }
}
