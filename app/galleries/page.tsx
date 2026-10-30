import type { Metadata } from 'next';
import Link from 'next/link';
import { PersonIcon } from '@/components/Icons';
import { getUser } from '@/lib/auth';
import { dbConfigured } from '@/lib/db';
import { coverUrl, galleriesForEmail } from '@/lib/galleries';
import { formatDate } from '@/lib/content';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Client galleries',
  description: 'Sign in to see your Tboss Photography galleries, save favourites and download your photos.',
  alternates: { canonical: '/galleries' },
};

export default async function GalleriesPage({ searchParams }: { searchParams: Promise<{ signin?: string }> }) {
  const { signin } = await searchParams;
  const ready = Boolean(process.env.GOOGLE_CLIENT_ID) && dbConfigured();
  const user = ready ? await getUser() : null;
  const mine = user ? await galleriesForEmail(user.email) : [];
  const covers = await Promise.all(mine.map((g) => coverUrl(g)));

  return (
    <div className="signin" id="main">
      <div className="signin-photo" role="img" aria-label="Couple sharing a quiet moment, from a recent Tboss gallery" style={{ backgroundImage: 'url(/photos/gallery-signin/w1600.webp)' }}>
        <Link href="/" aria-label="Tboss Photography, home"><img src="/brand/logo-cream.png" alt="Tboss Photography" width={128} height={88} /></Link>
      </div>
      <div className="signin-panel">
        <div className="box">
          <span className="eyebrow" style={{ color: '#D6A77A' }}>Client galleries</span>

          {user ? (
            <>
              <h1 className="serif" style={{ margin: 0, fontSize: 48, lineHeight: 1.02 }}>Welcome back, {user.name.split(' ')[0]}.</h1>
              {mine.length === 0 ? (
                <p>We couldn’t find a gallery for {user.email}. If you booked with a different email, sign out and try that one, or <Link href="/contact" style={{ borderBottom: '1px solid #A9A094' }}>let us know</Link>.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {mine.map((g, i) => (
                    <li key={g.id}>
                      <Link href={`/g/${g.slug}`} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 10, borderRadius: 12, background: '#1A1815', border: '1px solid rgba(243,238,230,0.12)' }}>
                        <span style={{ width: 72, height: 72, flex: 'none', borderRadius: 8, background: covers[i] ? `#2A2622 url(${covers[i]}) center / cover` : '#2A2622' }} />
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <strong style={{ fontSize: 16 }}>{g.title}</strong>
                          <span style={{ fontSize: 13, color: '#A9A094' }}>{g.stage === 'finished' ? 'Edited photos ready' : 'Choose your photos'}{g.session_date ? ` · ${formatDate(g.session_date)}` : ''}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <a href="/api/auth/logout?next=/galleries" style={{ fontSize: 14, color: '#C9C0B4' }}>Sign out ({user.email})</a>
            </>
          ) : (
            <>
              <h1 className="serif" style={{ margin: 0, fontSize: 52, lineHeight: 1.02 }}>Your photos are waiting.</h1>
              <p>Opening the gallery link we sent you? You can start viewing straight away. No sign-in needed.</p>
              <p>Sign in with Google to see every gallery you have with us, save favourites and download.</p>
              {signin === 'failed' && <p role="alert" style={{ color: '#F2B8B0' }}>Sign-in didn’t finish. Please try again.</p>}
              {ready ? (
                <a href="/api/auth/google?next=/galleries" className="btn" style={{ background: '#F3EEE6', color: '#0E0D0C', minHeight: 52 }}><PersonIcon />Continue with Google</a>
              ) : (
                <>
                  <button type="button" className="btn" disabled aria-describedby="soon" style={{ background: '#F3EEE6', color: '#0E0D0C', minHeight: 52, opacity: 0.6, cursor: 'not-allowed' }}><PersonIcon />Continue with Google</button>
                  <p id="soon" style={{ fontSize: 13, color: '#A9A094' }}>Online galleries open soon. Until then, use the link we email you, or <Link href="/contact" style={{ borderBottom: '1px solid #A9A094' }}>contact the studio</Link>.</p>
                </>
              )}
              <p style={{ fontSize: 13, color: '#A9A094' }}>We only use your Google name and email to show the galleries booked under that email.</p>
            </>
          )}
          <Link href="/" style={{ fontSize: 14, color: '#C9C0B4' }}>← Back to website</Link>
        </div>
      </div>
    </div>
  );
}
