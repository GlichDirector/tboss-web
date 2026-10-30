import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PersonIcon } from '@/components/Icons';
import { getUser, isAdminEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Studio sign in', robots: { index: false, follow: false } };

export default async function AdminLogin() {
  const user = await getUser();
  if (user && isAdminEmail(user.email)) redirect('/admin');
  const ready = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <div className="a-login" id="main">
      <div className="a-login-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><img src="/brand/logo-cream.png" alt="Tboss Photography" width={93} height={64} /><span className="a-kicker" style={{ color: '#C9C0B4' }}>Studio</span></div>
        <img src="/photos/lace-hands.jpg" alt="" className="a-login-photo" />
        <div>
          <p className="serif" style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>Your studio, <em>all in one place.</em></p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#C9C0B4' }}>Bookings, galleries, payments and your website, managed without code.</p>
        </div>
      </div>
      <main className="a-login-form">
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h1 className="serif" style={{ margin: 0, fontSize: 44, lineHeight: 1.05 }}>Welcome back</h1>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Sign in to the Tboss Studio admin.</p>
          {user && <div role="alert" className="alert">{user.email} isn’t on the studio team. Sign in with a studio Google account, or ask the owner to add you.</div>}
          {ready
            ? <a href="/api/auth/google?next=/admin" className="btn" style={{ border: '1px solid rgba(31,26,22,0.2)', background: '#fff' }}><PersonIcon />Continue with Google</a>
            : <p className="alert">Google sign-in isn’t connected yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Hostinger.</p>}
          {user && <a href="/api/auth/logout?next=/admin/login" style={{ fontSize: 14, color: 'var(--muted)' }}>Use a different account</a>}
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Only team members can sign in. Email and password sign-in for the team arrives with the full admin.</p>
          <Link href="/" style={{ fontSize: 13, color: 'var(--muted)' }}>← Back to the website</Link>
        </div>
      </main>
    </div>
  );
}
