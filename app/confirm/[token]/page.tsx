import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ConfirmPanel from '@/components/ConfirmPanel';
import { bookingByToken, getClient, getOrder, longDate, time12 } from '@/lib/studio';
import { studio } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Confirm your session', robots: { index: false, follow: false } };

export default async function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const b = await bookingByToken((await params).token);
  if (!b) notFound();
  const o = await getOrder(b.order_id);
  const c = o ? await getClient(o.client_id) : null;
  const hours = b.duration_min % 60 ? `${b.duration_min} minutes` : `${b.duration_min / 60} hour${b.duration_min === 60 ? '' : 's'}`;
  return (
    <div id="main" style={{ minHeight: '100svh', background: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'center', alignItems: 'center' }}>
        <Link href="/"><img src="/brand/logo-brown.png" alt="Tboss Photography" width={82} height={56} /></Link>
        <h1 className="serif" style={{ margin: 0, fontSize: 38, lineHeight: 1.05 }}>{c ? `Hi ${c.name.split(/\s+/)[0]}, ` : ''}your session</h1>
        <dl style={{ margin: 0, width: '100%', background: 'var(--ivory)', borderRadius: 12, padding: '14px 18px', display: 'grid', gap: 10, textAlign: 'left', fontSize: 15 }}>
          <div><dt style={{ color: 'var(--muted)', fontSize: 13 }}>Session</dt><dd style={{ margin: 0, fontWeight: 600 }}>{o?.title}</dd></div>
          <div><dt style={{ color: 'var(--muted)', fontSize: 13 }}>Date</dt><dd style={{ margin: 0, fontWeight: 600 }}>{longDate(b.session_date)}</dd></div>
          <div><dt style={{ color: 'var(--muted)', fontSize: 13 }}>Time</dt><dd style={{ margin: 0, fontWeight: 600 }}>{time12(b.session_time)} · {hours}</dd></div>
          <div><dt style={{ color: 'var(--muted)', fontSize: 13 }}>Where</dt><dd style={{ margin: 0, fontWeight: 600 }}><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`} target="_blank" rel="noopener noreferrer" style={{ borderBottom: '1px solid currentColor' }}>{b.place === 'studio' ? `Tboss studio, ${b.address}` : b.address}</a></dd></div>
        </dl>
        <ConfirmPanel token={b.token} confirmed={Boolean(b.confirmed_at)} changeRequested={b.change_request} />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Questions? Call or WhatsApp <a href={`tel:${studio.phoneIntl}`}>{studio.phoneDisplay}</a></p>
      </div>
    </div>
  );
}
