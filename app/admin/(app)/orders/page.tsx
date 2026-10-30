import Link from 'next/link';
import { requireArea } from '@/lib/team';
import { listOrders, longDate, naira, time12, type OrderState } from '@/lib/studio';

const columns: { title: string; match: (o: OrderState) => boolean }[] = [
  { title: 'New · no invoice sent', match: (o) => o.stage === 'New' },
  { title: 'Invoice sent', match: (o) => o.stage === 'Invoice sent' },
  { title: 'Paid · not booked', match: (o) => o.stage === 'Paid' || o.stage === 'Part paid' },
  { title: 'Booked · awaiting confirm', match: (o) => o.stage === 'Booked' },
  { title: 'Confirmed', match: (o) => o.stage === 'Confirmed' },
  { title: 'Shot · gallery', match: (o) => o.stage === 'Shot' || o.stage === 'Gallery' },
  { title: 'Delivered', match: (o) => o.stage === 'Delivered' },
];

export default async function OrdersBoard() {
  await requireArea('clients');
  const orders = (await listOrders()).filter((o) => o.stage !== 'Cancelled');
  return (
    <>
      <div className="a-head"><div><p className="a-kicker">Clients</p><h1>Orders &amp; bookings</h1></div><Link href="/admin/clients" className="btn btn-accent a-sm">+ New order (pick a client)</Link></div>
      {orders.length === 0 ? <div className="a-card a-sub">No orders yet. Open a client and click “+ New order”, or turn a website enquiry into an order.</div> : (
        <div className="a-board">
          {columns.map((col) => {
            const list = orders.filter(col.match);
            return (
              <section key={col.title} className="a-col" aria-label={col.title}>
                <h2>{col.title} <span>{list.length}</span></h2>
                {list.map((o) => (
                  <Link key={o.order.id} href={`/admin/orders/${o.order.id}`} className="a-card a-ocard">
                    <strong>{o.client.name}</strong>
                    <span className="a-sub">{o.order.title}</span>
                    {o.booking && <span style={{ fontSize: 13 }}>{longDate(o.booking.session_date).replace(/ \d{4}$/, '')} · {time12(o.booking.session_time)}</span>}
                    {o.invoice && <span className="a-sub">{o.balance > 0 ? `${naira(o.balance)} due` : 'Paid in full'}</span>}
                    {o.booking?.change_request && <span className="a-badge a-selection">Change requested</span>}
                  </Link>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
