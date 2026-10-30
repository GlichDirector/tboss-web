import Link from 'next/link';
import { requireArea } from '@/lib/team';
import { lagosDate, listOrders, listPayments, longDate, naira } from '@/lib/studio';

export default async function PaymentsPage() {
  await requireArea('payments');
  const [payments, orders] = await Promise.all([listPayments(), listOrders()]);
  const month = lagosDate().slice(0, 7);
  const thisMonth = payments.filter((p) => p.paid_on.startsWith(month)).reduce((s, p) => s + Number(p.amount), 0);
  const owing = orders.filter((o) => o.invoice?.sent_at && o.balance > 0 && o.stage !== 'Cancelled');
  const outstanding = owing.reduce((s, o) => s + o.balance, 0);
  return (
    <>
      <div className="a-head"><div><p className="a-kicker">Clients</p><h1>Payments &amp; invoices</h1></div></div>
      <div className="a-stats" style={{ marginBottom: 20 }}>
        <div className="a-card"><span className="a-sub">Received this month</span><strong>{naira(thisMonth)}</strong></div>
        <div className="a-card"><span className="a-sub">Still owed</span><strong>{naira(outstanding)}</strong></div>
        <div className="a-card"><span className="a-sub">Invoices with a balance</span><strong>{owing.length}</strong></div>
      </div>
      <h2 className="a-h2">Waiting for payment</h2>
      <div className="a-card" style={{ padding: 0, overflowX: 'auto', marginBottom: 24 }}>
        {owing.length === 0 ? <p className="a-sub" style={{ padding: 16, margin: 0 }}>Nothing owed. 🎉</p> : (
          <table className="a-table"><thead><tr><th>Client</th><th>Invoice</th><th>Total</th><th>Paid</th><th>Balance</th></tr></thead>
            <tbody>{owing.map((o) => <tr key={o.order.id}><td><Link href={`/admin/orders/${o.order.id}`} style={{ fontWeight: 700 }}>{o.client.name}</Link><div className="a-sub">{o.order.title}</div></td><td>{o.invoice!.number} <span className="a-sub">v{o.invoice!.version}</span></td><td>{naira(o.invoice!.total)}</td><td>{naira(o.paid)}</td><td style={{ color: 'var(--oxblood)', fontWeight: 700 }}>{naira(o.balance)}</td></tr>)}</tbody></table>
        )}
      </div>
      <h2 className="a-h2">Payments received</h2>
      <div className="a-card" style={{ padding: 0, overflowX: 'auto' }}>
        {payments.length === 0 ? <p className="a-sub" style={{ padding: 16, margin: 0 }}>No payments recorded yet. Record them from each order.</p> : (
          <table className="a-table"><thead><tr><th>Date</th><th>Client</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
            <tbody>{payments.map((p) => <tr key={p.id}><td className="a-sub">{longDate(p.paid_on)}</td><td><Link href={`/admin/orders/${p.order_id}`} style={{ fontWeight: 700 }}>{p.client_name}</Link><div className="a-sub">{p.title}</div></td><td><strong>{naira(p.amount)}</strong></td><td>{p.method}</td><td className="a-sub">{p.reference || '—'}</td></tr>)}</tbody></table>
        )}
      </div>
    </>
  );
}
