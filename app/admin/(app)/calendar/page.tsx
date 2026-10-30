import Link from 'next/link';
import { bookingsBetween, lagosDate, time12 } from '@/lib/studio';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const [y, mo] = (/^\d{4}-\d{2}$/.test(m || '') ? m! : lagosDate().slice(0, 7)).split('-').map(Number);
  const first = new Date(Date.UTC(y, mo - 1, 1));
  const days = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const pad = (n: number) => String(n).padStart(2, '0');
  const from = `${y}-${pad(mo)}-01`, to = `${y}-${pad(mo)}-${pad(days)}`;
  const bookings = await bookingsBetween(from, to);
  const prev = mo === 1 ? `${y - 1}-12` : `${y}-${pad(mo - 1)}`;
  const next = mo === 12 ? `${y + 1}-01` : `${y}-${pad(mo + 1)}`;
  const today = lagosDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => i - lead + 1);

  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">Overview</p><h1>{MONTHS[mo - 1]} {y}</h1></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn btn-outline a-sm" href={`/admin/calendar?m=${prev}`} aria-label="Previous month">←</Link>
          <Link className="btn btn-outline a-sm" href="/admin/calendar">Today</Link>
          <Link className="btn btn-outline a-sm" href={`/admin/calendar?m=${next}`} aria-label="Next month">→</Link>
        </div>
      </div>
      <div className="a-cal" role="grid" aria-label={`${MONTHS[mo - 1]} ${y}`}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="a-cal-h" role="columnheader">{d}</div>)}
        {cells.map((d, i) => {
          if (d < 1 || d > days) return <div key={i} className="a-cal-c out" />;
          const iso = `${y}-${pad(mo)}-${pad(d)}`;
          const list = bookings.filter((b) => b.session_date === iso);
          return (
            <div key={i} className={`a-cal-c${iso === today ? ' today' : ''}`} role="gridcell">
              <span className="a-cal-d">{d}</span>
              {list.map((b) => (
                <Link key={b.id} href={`/admin/orders/${b.order_id}`} className={`a-cal-e${b.confirmed_at ? ' ok' : ''}`} title={`${b.client_name} · ${b.title}`}>
                  {time12(b.session_time)} {b.client_name}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      <p className="a-sub" style={{ marginTop: 10 }}>Green = client confirmed · Red = waiting for confirmation. Click a session to open its order.</p>
    </>
  );
}
