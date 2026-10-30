import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionForm from '@/components/admin/ActionForm';
import NewOrder from '@/components/admin/NewOrder';
import StepBar from '@/components/admin/StepBar';
import { newOrderAction, updateClientAction } from '@/app/admin/studio-actions';
import { galleriesForEmail } from '@/lib/galleries';
import { getClient, getPackages, longDate, naira, ordersForClient } from '@/lib/studio';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const c = await getClient(id);
  if (!c) notFound();
  const [orders, packages, galleries] = await Promise.all([ordersForClient(id), getPackages(), c.email ? galleriesForEmail(c.email) : Promise.resolve([])]);
  const spent = orders.reduce((s, o) => s + o.paid, 0);
  return (
    <>
      <div className="a-head">
        <div>
          <p className="a-kicker"><Link href="/admin/clients">Clients</Link> /</p>
          <h1>{c.name}</h1>
          <div className="a-sub" style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {c.source === 'imported' && <span className="a-badge">Imported</span>}
            {c.source === 'website' && <span className="a-badge">From website</span>}
            {orders.length > 1 && <span className="a-badge a-finished">Returning client</span>}
            <span>Client since {longDate(c.created_at.slice(0, 10))}</span>
          </div>
        </div>
        <NewOrder action={newOrderAction.bind(null, id)} packages={packages} />
      </div>
      <div className="a-stats" style={{ marginBottom: 20 }}>
        <div className="a-card"><span className="a-sub">Orders</span><strong>{orders.length}</strong></div>
        <div className="a-card"><span className="a-sub">Paid to date</span><strong>{naira(spent)}</strong></div>
        <div className="a-card"><span className="a-sub">Galleries</span><strong>{galleries.length}</strong></div>
      </div>
      <div className="a-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <h2 className="a-h2">Orders</h2>
          {orders.length === 0 && <div className="a-card a-sub">No orders yet. Click “+ New order” to send an invoice or book a session.</div>}
          {orders.map((o) => (
            <Link key={o.order.id} href={`/admin/orders/${o.order.id}`} className="a-card a-order">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div><strong>{o.order.title}</strong><div className="a-sub">Started {longDate(o.order.created_at.slice(0, 10))}{o.invoice ? ` · ${naira(o.invoice.total)}` : ''}</div></div>
                <span className={`a-badge ${o.stage === 'Delivered' ? 'a-finished' : o.stage === 'Cancelled' ? '' : 'a-selection'}`}>{o.stage}</span>
              </div>
              {o.stage !== 'Cancelled' && <StepBar index={o.stepIndex} compact />}
              <span className="a-sub">Next: {o.next}</span>
            </Link>
          ))}
          {galleries.length > 0 && <>
            <h2 className="a-h2" style={{ marginTop: 8 }}>Galleries</h2>
            {galleries.map((g) => <Link key={g.id} href={`/admin/galleries/${g.id}`} className="a-card" style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{g.title}</strong><span className="a-sub">{g.stage === 'finished' ? 'Delivered' : g.stage === 'selection' ? 'Client choosing' : 'Draft'}</span></Link>)}
          </>}
        </div>
        <ActionForm action={updateClientAction.bind(null, id)} submit="Save details" className="a-card a-form">
          <h2 className="a-h2">Details</h2>
          <div className="field"><label htmlFor="name">Name</label><input className="input" id="name" name="name" defaultValue={c.name} required /></div>
          <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" defaultValue={c.email || ''} /></div>
          <div className="field"><label htmlFor="phone">Phone / WhatsApp</label><input className="input" id="phone" name="phone" defaultValue={c.phone || ''} /></div>
          {c.phone && <a className="a-link" href={`https://wa.me/${c.phone.replace(/\D/g, '').replace(/^0/, '234')}`} target="_blank" rel="noopener noreferrer">Open WhatsApp chat</a>}
          <div className="field"><label htmlFor="instagram">Instagram</label><input className="input" id="instagram" name="instagram" defaultValue={c.instagram || ''} /></div>
          <div className="field"><label htmlFor="notes">Notes</label><textarea className="input" id="notes" name="notes" rows={5} defaultValue={c.notes || ''} /></div>
        </ActionForm>
      </div>
    </>
  );
}
