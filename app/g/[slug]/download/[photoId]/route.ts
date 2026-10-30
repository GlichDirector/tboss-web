import { NextResponse, type NextRequest } from 'next/server';
import { galleryAccess } from '@/lib/access';
import { siteOrigin } from '@/lib/auth';
import { getPhoto, logDownload } from '@/lib/galleries';
import { downloadUrl, photoKey } from '@/lib/storage';

// Every download is recorded (who, which photo, when) before the file is handed over.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; photoId: string }> }) {
  const { slug, photoId } = await params;
  const key = req.nextUrl.searchParams.get('k') || '';
  const back = `/g/${slug}${key ? `?k=${encodeURIComponent(key)}` : ''}`;
  const a = await galleryAccess(slug, key);
  if (!a) return NextResponse.json({ error: 'This gallery link is no longer valid.' }, { status: 403 });
  if (!a.user) return NextResponse.redirect(`${siteOrigin()}/api/auth/google?next=${encodeURIComponent(back)}`);

  const photo = await getPhoto(Number(photoId));
  if (!photo || photo.gallery_id !== a.gallery.id || !photo.ready) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
  const allowed = a.admin || (photo.folder === 'edited' && a.gallery.stage === 'finished');
  if (!allowed) return NextResponse.json({ error: 'Downloads open when your edited photos are delivered.' }, { status: 403 });

  if (!a.admin) await logDownload(a.gallery.id, photo.id, a.user.email);
  const url = await downloadUrl(photoKey(a.gallery.id, photo.folder, photo.id, 'original'), photo.filename);
  return NextResponse.redirect(url.startsWith('/') ? `${siteOrigin()}${url}` : url);
}
