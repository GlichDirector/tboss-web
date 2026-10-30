import Link from 'next/link';
import { requireArea } from '@/lib/team';
import { q } from '@/lib/db';
import { bookingsBetween, countNewEnquiries, lagosDate, listOrders, listPayments, longDate, naira, time12 } from '@/lib/studio';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const staff = await requireArea('dashboard');
  const { denied } = await searchParams;
  const can = (a: Parameters<typeof staff.areas.has>[0]) => staff.areas.has(a);
  const user = staff.user;
  const [orders, newEnq, payments] = await Promise.all([
    can('clients') || can('payments') ? listOrders() : Promise.resolve([]),
    can('clients') ? countNewEnquiries() : Promise.resolve(0),
    can('payments') ? listPayments() : Promise.resolve([]),
  ]);
  const today = lagosDate();
  const upcoming = await bookingsBetween(today, lagosDate(14));
  const live = orders.filter((o) => o.stage !== 'Cancelled');
  const month = today.slice(0, 7);
  const received = payments.filter((p) => p.paid_on.startsWith(month)).reduce((s, p) => s + Number(p.amount), 0);
  const waitingPicks = !can('galleries') ? [] : await q<{ id: number; client_name: string; title: string }>(
    `SELECT g.id, g.client_name, g.title FROM galleries g WHERE g.stage = 'selection'
     AND EXISTS (SELECT 1 FROM selections s WHERE s.gallery_id = g.id)
     AND NOT EXISTS (SELECT 1 FROM photos p WHERE p.gallery_id = g.id AND p.folder = 'edited' AND p.ready = 1)`);

  type Todo = { text: string; href: string; tone?: 'urgent' };
  const todos: Todo[] = [];
  if (newEnq) todos.push({ text: `${newEnq} new enquir${newEnq === 1 ? 'y' : 'ies'} to answer`, href: '/admin/enquiries', tone: 'urgent' });
  for (const o of live) {
    const name = `${o.client.name} · ${o.order.title}`;
    if (o.stage === 'New') todos.push({ text: `Send the invoice: ${name}`, href: `/admin/orders/${o.order.id}?open=invoice` });
    if (o.booking?.change_request) todos.push({ text: `${o.client.name} asked to change their session`, href: `/admin/orders/${o.order.id}`, tone: 'urgent' });
    if ((o.stage === 'Paid' || o.stage === 'Part paid')) todos.push({ text: `Book the session: ${name}`, href: `/admin/orders/${o.order.id}?open=book` });
    if (o.stage === 'Shot') todos.push({ text: `Upload unedited photos: ${name}`, href: `/admin/orders/${o.order.id}` });
    if (o.booking && o.balance > 0 && o.booking.session_date >= today && o.booking.session_date <= lagosDate(7)) todos.push({ text: `${naira(o.balance)} still due before ${o.client.name}’s session on ${longDate(o.booking.session_date)}`, href: `/admin/orders/${o.order.id}`, tone: 'urgent' });
    if (o.stage === 'Gallery' && o.next === 'Mark the order delivered') todos.push({ text: `Edited photos delivered — mark the order delivered: ${name}`, href: `/admin/orders/${o.order.id}` });
  }
  for (const g of waitingPicks) todos.push({ text: `${g.client_name} sent their picks: edit and upload to Edited`, href: `/admin/galleries/${g.id}?tab=selections` });

  const strip = ['New', 'Invoice sent', 'Paid', 'Booked', 'Confirmed', 'Shot', 'Gallery'].map((s) => ({ s, n: live.filter((o) => o.stage === s || (s === 'Paid' && o.stage === 'Part paid')).length }));

  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">{longDate(today)}</p><h1>Good {Number(new Date(Date.now() + 3600000).toISOString().slice(11, 13)) < 12 ? 'morning' : 'afternoon'}, {user?.name.split(' ')[0]}</h1></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {can('clients') && <Link href="/admin/clients/new" className="btn btn-outline a-sm">+ Add clients</Link>}
          {can('galleries') && <Link href="/admin/galleries/new" className="btn btn-accent a-sm">+ New gallery</Link>}
        </div>
      </div>
      {denied && <div className="alert" style={{ marginBottom: 16 }}>Your role doesn’t include that page. Ask the owner if you need it.</div>}
      <div className="a-strip" aria-label="Orders by stage">
        {strip.map((x) => <Link key={x.s} href="/admin/orders" className="a-card"><strong>{x.n}</strong><span className="a-sub">{x.s}</span></Link>)}
      </div>
      <div className="a-cols" style={{ marginTop: 20 }}>
        <section className="a-card" aria-labelledby="todo-h">
          <h2 className="a-h2" id="todo-h">To do ({todos.length})</h2>
          {todos.length === 0 ? <p className="a-sub">All caught up.</p> : (
            <ul className="a-todo">{todos.map((t, i) => <li key={i} className={t.tone}><Link href={t.href}>{t.text}</Link></li>)}</ul>
          )}
        </section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="a-card" aria-labelledby="up-h">
            <h2 className="a-h2" id="up-h">Next 2 weeks</h2>
            {upcoming.length === 0 ? <p className="a-sub" style={{ margin: 0 }}>No sessions booked.</p> : (
              <ul className="a-log">{upcoming.map((b) => <li key={b.id}><Link href={`/admin/orders/${b.order_id}`}><strong>{b.client_name}</strong> · {b.title}</Link><span className="a-sub">{longDate(b.session_date)} · {time12(b.session_time)} · {b.confirmed_at ? 'confirmed' : 'not confirmed yet'}</span></li>)}</ul>
            )}
            <Link href="/admin/calendar" className="a-link">Open calendar</Link>
          </section>
          {can('payments') && <section className="a-card"><span className="a-sub">Received this month</span><div className="serif" style={{ fontSize: 34 }}>{naira(received)}</div><Link href="/admin/payments" className="a-link">Payments &amp; invoices</Link></section>}
        </div>
      </div>
    </>
  );
}
