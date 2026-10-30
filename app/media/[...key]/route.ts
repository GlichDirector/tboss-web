import { NextResponse, type NextRequest } from 'next/server';
import { siteOrigin } from '@/lib/auth';
import { viewUrl } from '@/lib/storage';

// Public website images stored in R2 (Pages & design, Journal, Instagram copies).
// Client gallery photos are never served here.
const PUBLIC = ['site/', 'journal/', 'instagram/'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join('/');
  if (!PUBLIC.some((p) => key.startsWith(p)) || key.includes('..')) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const url = await viewUrl(key);
  const res = NextResponse.redirect(url.startsWith('/') ? `${siteOrigin()}${url}` : url, 302);
  res.headers.set('Cache-Control', 'public, max-age=1800');
  return res;
}
