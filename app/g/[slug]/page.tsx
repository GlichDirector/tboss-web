import type { Metadata } from 'next';
import Link from 'next/link';
import GalleryView from '@/components/GalleryView';
import { galleryAccess } from '@/lib/access';
import { coverUrl, favouriteIds, latestSelection, listPhotos } from '@/lib/galleries';
import { formatDate } from '@/lib/content';
import { studio } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your gallery', robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ k?: string }> };

export default async function ClientGallery({ params, searchParams }: Props) {
  const { slug } = await params;
  const { k = '' } = await searchParams;
  const a = await galleryAccess(slug, k);

  if (!a) {
    return (
      <div className="g-shell" id="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ maxWidth: 460, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <img src="/brand/logo-cream.png" alt="Tboss Photography" width={102} height={70} />
          <h1 className="serif" style={{ margin: 0, fontSize: 40 }}>This gallery isn’t available</h1>
          <p style={{ margin: 0, color: '#C9C0B4' }}>The link may be incomplete, or the gallery may have closed. Please use the full link from your email, or contact the studio on {studio.phoneDisplay}.</p>
          <Link href={`/api/auth/google?next=${encodeURIComponent(`/g/${slug}`)}`} className="btn btn-light">Sign in with Google</Link>
          <Link href="/" style={{ color: '#C9C0B4', fontSize: 14 }}>← Tboss Photography</Link>
        </div>
      </div>
    );
  }

  const g = a.gallery;
  const [unedited, edited, cover, favs, sel] = await Promise.all([
    listPhotos(g.id, 'unedited'),
    listPhotos(g.id, 'edited'),
    coverUrl(g),
    a.user ? favouriteIds(g.id, a.user.email) : Promise.resolve([] as number[]),
    a.user ? latestSelection(g.id, a.user.email) : Promise.resolve(null),
  ]);
  const meta = [g.session_date ? formatDate(g.session_date) : null, g.location, `${unedited.length + edited.length} photos`].filter(Boolean).join(' · ');

  return (
    <GalleryView
      slug={slug}
      accessKey={k}
      title={g.title}
      clientName={g.client_name}
      meta={meta}
      cover={cover}
      stage={g.stage}
      admin={a.admin}
      user={a.user ? { email: a.user.email, name: a.user.name } : null}
      unedited={unedited.map(({ id, filename, width, height, thumb, web }) => ({ id, filename, width, height, thumb, web }))}
      edited={edited.map(({ id, filename, width, height, thumb, web }) => ({ id, filename, width, height, thumb, web }))}
      initialFavs={favs}
      limit={g.selection_limit}
      extraPrice={g.extra_price}
      chooseBy={g.choose_by ? formatDate(g.choose_by) : null}
      expires={g.expires_on ? formatDate(g.expires_on) : null}
      sentAt={sel ? formatDate(sel.submitted_at.slice(0, 10)) : null}
    />
  );
}
