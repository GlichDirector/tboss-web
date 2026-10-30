import Link from 'next/link';
import { listClients, longDate } from '@/lib/studio';

const filters = [['all', 'All'], ['active', 'Active'], ['delivered', 'Delivered'], ['imported', 'Imported']] as const;

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = '', f = 'all' } = await searchParams;
  const rows = await listClients(q.trim(), f);
  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">Clients</p><h1>Clients</h1></div>
        <Link href="/admin/clients/new" className="btn btn-accent a-sm">+ Add clients</Link>
      </div>
      <form className="a-toolbar" role="search">
        <input className="input" name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search clients" style={{ maxWidth: 320 }} />
        <input type="hidden" name="f" value={f} />
        <div className="chips">{filters.map(([k, l]) => <Link key={k} href={`/admin/clients?f=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className="chip" aria-current={f === k ? 'page' : undefined}>{l}</Link>)}</div>
      </form>
      {rows.length === 0 ? (
        <div className="a-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ margin: '0 0 14px', color: 'var(--muted)' }}>{q || f !== 'all' ? 'No clients match.' : 'No clients yet. Add past clients, or convert a website enquiry.'}</p>
          <Link href="/admin/clients/new" className="btn btn-dark a-sm">Add clients</Link>
        </div>
      ) : (
        <div className="a-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="a-table">
            <thead><tr><th>Client</th><th>Contact</th><th>Orders</th><th>Status</th><th>Since</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/clients/${c.id}`} style={{ fontWeight: 700 }}>{c.name}</Link>{c.source !== 'manual' && <div className="a-sub">{c.source === 'imported' ? 'Imported' : 'From website'}</div>}</td>
                  <td><div>{c.email || '—'}</div><div className="a-sub">{c.phone}</div></td>
                  <td>{c.orders}{Number(c.orders) > 1 && <div className="a-sub">Returning client</div>}</td>
                  <td>{Number(c.open_orders) > 0 ? <span className="a-badge a-selection">Active order</span> : Number(c.orders) > 0 ? <span className="a-badge a-finished">Delivered</span> : <span className="a-badge">No orders</span>}</td>
                  <td className="a-sub">{longDate(c.created_at.slice(0, 10))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
