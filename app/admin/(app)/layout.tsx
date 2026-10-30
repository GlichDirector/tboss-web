import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { dbHealth } from '@/lib/db';
import { storageConfigured } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Studio', robots: { index: false, follow: false } };

const soon = ['Dashboard', 'Calendar', 'Clients', 'Enquiries', 'Orders & bookings', 'Payments & invoices', 'Pages & design', 'Journal', 'Emails', 'Settings'];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdmin();
  if (!user) redirect('/admin/login');
  const db = await dbHealth();
  const storageOk = storageConfigured();
  return (
    <div className="a-shell">
      <aside className="a-side">
        <Link href="/admin/galleries" aria-label="Studio home"><img src="/brand/logo-brown.png" alt="Tboss Photography" width={64} height={44} /></Link>
        <nav aria-label="Studio" className="a-nav">
          <Link href="/admin/galleries" aria-current="page">Client galleries</Link>
          {soon.map((s) => <span key={s} title="Arrives in Phase 3" className="a-soon">{s}</span>)}
        </nav>
        <div className="a-me">
          <span>{user.name}</span>
          <a href="/api/auth/logout?next=/admin/login">Sign out</a>
        </div>
      </aside>
      <main className="a-main" id="main">
        {!db.ok ? (
          <div className="a-card" role="alert" style={{ maxWidth: 720, borderColor: '#E7B8B2' }}>
            <p className="a-kicker" style={{ color: 'var(--oxblood)' }}>Setup check</p>
            <h1 className="serif" style={{ margin: '0 0 10px', fontSize: 30 }}>The site can’t reach the database yet</h1>
            <p style={{ margin: '0 0 10px' }}>{db.advice}</p>
            <p className="a-sub" style={{ margin: 0 }}>Error code: {db.code}</p>
          </div>
        ) : (
          <>
            {!storageOk && <div className="alert" style={{ marginBottom: 16 }}>Photo storage isn’t connected: add R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET, then Redeploy.</div>}
            {children}
          </>
        )}
      </main>
    </div>
  );
}
