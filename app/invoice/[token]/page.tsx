import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PrintButton from '@/components/PrintButton';
import { fullAddress, studio as site } from '@/lib/site';
import { getStudio, invoiceByToken, longDate, naira, orderState, type Item } from '@/lib/studio';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Invoice', robots: { index: false, follow: false } };

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const inv = await invoiceByToken((await params).token);
  if (!inv) notFound();
  const [st, studio] = await Promise.all([orderState(inv.order_id), getStudio()]);
  if (!st) notFound();
  const items: Item[] = JSON.parse(inv.items);
  const sub = items.reduce((s, i) => s + i.qty * i.price, 0);
  const depositLeft = Math.max(0, Number(inv.deposit) - st.paid);
  return (
    <div id="main" className="inv-page">
      <div className="inv-actions"><PrintButton /></div>
      <article className="inv">
        <header className="inv-head">
          <img src="/brand/logo-brown.png" alt="Tboss Photography" width={93} height={64} />
          <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>{site.legalName}</strong><br />{fullAddress}<br />{site.phoneDisplay} · {site.email}
          </div>
        </header>
        <div className="inv-meta">
          <div><span className="a-kicker">Invoice for</span><strong style={{ fontSize: 18 }}>{st.client.name}</strong>{st.client.email && <span>{st.client.email}</span>}{st.client.phone && <span>{st.client.phone}</span>}</div>
          <div style={{ textAlign: 'right' }}><span className="a-kicker">Invoice</span><strong style={{ fontSize: 18 }}>{inv.number}</strong><span>Version {inv.version}{inv.sent_at ? ` · ${longDate(inv.sent_at.slice(0, 10))}` : ''}</span>{inv.due_date && <span>Due {longDate(inv.due_date)}</span>}</div>
        </div>
        <div className="inv-scroll"><table className="a-table inv-table">
          <thead><tr><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
          <tbody>{items.map((i, k) => <tr key={k}><td>{i.description}</td><td style={{ textAlign: 'right' }}>{i.qty}</td><td style={{ textAlign: 'right' }}>{naira(i.price)}</td><td style={{ textAlign: 'right' }}>{naira(i.qty * i.price)}</td></tr>)}</tbody>
        </table></div>
        <div className="inv-totals">
          {Number(inv.discount) > 0 && <><span>Subtotal</span><span>{naira(sub)}</span><span>Discount</span><span>−{naira(inv.discount)}</span></>}
          <strong>Total</strong><strong>{naira(inv.total)}</strong>
          {st.paid > 0 && <><span>Paid so far</span><span>−{naira(st.paid)}</span></>}
          <strong style={{ color: 'var(--oxblood)' }}>Balance due</strong><strong style={{ color: 'var(--oxblood)' }}>{naira(st.balance)}</strong>
        </div>
        {st.balance > 0 && (
          <div className="inv-pay">
            <strong>How to pay</strong>
            {studio.accountNumber ? (
              <p style={{ margin: 0 }}>Bank transfer to <strong>{studio.bankName}</strong> · <strong>{studio.accountNumber}</strong> · {studio.accountName}. Use <strong>{inv.number}</strong> as the reference.</p>
            ) : (
              <p style={{ margin: 0 }}>Call or WhatsApp {site.phoneDisplay} for payment details. Use <strong>{inv.number}</strong> as the reference.</p>
            )}
            {depositLeft > 0 && <p style={{ margin: 0 }}>Deposit to secure your date: <strong>{naira(depositLeft)}</strong></p>}
          </div>
        )}
        {st.balance === 0 && st.paid > 0 && <div className="a-ok">Paid in full. Thank you!</div>}
        {inv.note && <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{inv.note}</p>}
        {st.payments.length > 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Payments received: {st.payments.map((p) => `${naira(p.amount)} on ${longDate(p.paid_on)}`).join(' · ')}</div>
        )}
      </article>
    </div>
  );
}
