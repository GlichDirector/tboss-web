import type { Metadata } from 'next';
import Link from 'next/link';
import { PersonIcon } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Client galleries',
  description: 'Sign in to see your Tboss Photography galleries, save favourites and download your photos.',
  alternates: { canonical: '/galleries' },
};

export default function GalleriesPage() {
  return (
    <div className="signin" id="main">
      <div className="signin-photo" role="img" aria-label="Couple sharing a quiet moment, from a recent Tboss gallery" style={{ backgroundImage: 'url(/photos/gallery-signin.jpg)' }}>
        <Link href="/" aria-label="Tboss Photography, home"><img src="/brand/logo-cream.png" alt="Tboss Photography" width={128} height={88} /></Link>
      </div>
      <div className="signin-panel">
        <div className="box">
          <span className="eyebrow" style={{ color: '#D6A77A' }}>Client galleries</span>
          <h1 className="serif" style={{ margin: 0, fontSize: 52, lineHeight: 1.02 }}>Your photos are waiting.</h1>
          <p>Opening the gallery link we sent you? You can start viewing straight away. No sign-in needed.</p>
          <p>Sign in with Google to see every gallery you have with us, save favourites and download.</p>
          {/* Phase 2 connects Google sign-in here. */}
          <button type="button" className="btn" disabled aria-describedby="soon" style={{ background: '#F3EEE6', color: '#0E0D0C', minHeight: 52, opacity: 0.6, cursor: 'not-allowed' }}>
            <PersonIcon />Continue with Google
          </button>
          <p id="soon" style={{ fontSize: 13, color: '#A9A094' }}>Online galleries open soon. Until then, use the link we email you, or <Link href="/contact" style={{ borderBottom: '1px solid #A9A094' }}>contact the studio</Link>.</p>
          <Link href="/" style={{ fontSize: 14, color: '#C9C0B4' }}>← Back to website</Link>
        </div>
      </div>
    </div>
  );
}
