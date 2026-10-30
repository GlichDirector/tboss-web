import type { Metadata } from 'next';
import Link from 'next/link';
import AcceptInvite from '@/components/admin/AcceptInvite';
import { PersonIcon } from '@/components/Icons';
import { getUser } from '@/lib/auth';
import { memberByToken, ROLES } from '@/lib/team';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Join the studio', robots: { index: false, follow: false } };

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [m, user] = await Promise.all([memberByToken(token), getUser()]);
  const here = `/admin/join/${token}`;
  return (
    <div className="a-login" id="main">
      <div className="a-login-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><img src="/brand/logo-cream.png" alt="Tboss Photography" width={93} height={64} /><span className="a-kicker" style={{ color: '#C9C0B4' }}>Studio</span></div>
        <img src="/photos/white-hat-teal/w1600.webp" alt="" className="a-login-photo" />
        <p className="serif" style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>You’re invited to <em>join the team.</em></p>
      </div>
      <main className="a-login-form">
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!m ? (
            <>
              <h1 className="serif" style={{ margin: 0, fontSize: 38 }}>This invite has expired</h1>
              <p style={{ margin: 0, color: 'var(--muted)' }}>It may already have been used, or cancelled. Ask the studio owner to send a new one.</p>
              <Link href="/admin/login" className="a-link">Go to studio sign-in</Link>
            </>
          ) : (
            <>
              <h1 className="serif" style={{ margin: 0, fontSize: 40, lineHeight: 1.05 }}>Welcome{m.name ? `, ${m.name.split(' ')[0]}` : ''}</h1>
              <p style={{ margin: 0, color: 'var(--muted)' }}>You’ve been invited as <strong style={{ color: 'var(--ink)' }}>{ROLES[m.role].label}</strong>: {ROLES[m.role].help.toLowerCase()}.</p>
              {!user ? (
                <a href={`/api/auth/google?next=${encodeURIComponent(here)}`} className="btn" style={{ border: '1px solid rgba(31,26,22,0.2)', background: '#fff' }}><PersonIcon />Continue with Google as {m.email}</a>
              ) : user.email.toLowerCase() !== m.email ? (
                <>
                  <div className="alert">You’re signed in as {user.email}, but this invite is for {m.email}.</div>
                  <a href={`/api/auth/logout?next=${encodeURIComponent(here)}`} className="btn btn-outline">Switch Google account</a>
                </>
              ) : (
                <AcceptInvite token={token} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
