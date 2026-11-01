import { NextResponse, type NextRequest } from 'next/server';
import { galleryAccess } from '@/lib/access';
import { coverKey } from '@/lib/galleries';
import { getObject } from '@/lib/storage';

// The cover photo for link previews of a private gallery. Needs the gallery's private key.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await galleryAccess(slug, req.nextUrl.searchParams.get('k')).catch(() => null);
  const key = a ? await coverKey(a.gallery, 'thumb').catch(() => null) : null;
  if (!key) return NextResponse.redirect(new URL('/photos/gallery-signin/w1080.webp', req.url), 302);
  try {
    const body = await getObject(key);
    return new NextResponse(new Uint8Array(body), {
      headers: { 'Content-Type': 'image/jpeg', 'Content-Length': String(body.length), 'Cache-Control': 'private, max-age=3600', 'X-Robots-Tag': 'noindex' },
    });
  } catch {
    return NextResponse.redirect(new URL('/photos/gallery-signin/w1080.webp', req.url), 302);
  }
}
