import Link from 'next/link';
import { requireArea } from '@/lib/team';
import EnquiryActions from '@/components/admin/EnquiryActions';
import { listEnquiries, longDate } from '@/lib/studio';

const tabs = [['new', 'New'], ['replied', 'Replied'], ['converted', 'Became clients'], ['archived', 'Archived'], ['all', 'All']] as const;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requireArea('clients');
  const { s = 'new' } = await searchParams;
  const rows = await listEnquiries(s);
  return (
    <>
      <div className="a-head"><div><p className="a-kicker">Clients</p><h1>Enquiries</h1></div></div>
      <p className="a-sub" style={{ margin: '-8px 0 16px' }}>Every message from the website’s Contact form lands here.</p>
      <div className="chips" style={{ marginBottom: 16 }}>{tabs.map(([k, l]) => <Link key={k} href={`/admin/enquiries?s=${k}`} className="chip" aria-current={s === k ? 'page' : undefined}>{l}</Link>)}</div>
      {rows.length === 0 ? <div className="a-card a-sub">Nothing here.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((e) => (
            <article key={e.id} className="a-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div><strong style={{ fontSize: 16 }}>{e.name}</strong> <span className="a-badge">{e.session_type || 'Enquiry'}</span><div className="a-sub">{e.email}{e.phone ? ` · ${e.phone}` : ''}</div></div>
                <span className="a-sub">{longDate(e.created_at.slice(0, 10))}</span>
              </div>
              {e.message && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{e.message}</p>}
              <div className="a-sub">{[e.wanted_date && `Date: ${longDate(e.wanted_date)}`, e.location && `Where: ${e.location}`, e.found_via && `Found us via ${e.found_via}`].filter(Boolean).join(' · ')}</div>
              {e.client_id && <Link href={`/admin/clients/${e.client_id}`} className="a-link">Open client</Link>}
              <EnquiryActions id={e.id} status={e.status} email={e.email} phone={e.phone} />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
