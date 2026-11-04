import Link from 'next/link';
import NominationTools from '@/components/admin/NominationTools';
import { LEGACY_STATUSES, listNominations, nominationCounts } from '@/lib/legacy';
import { longDate } from '@/lib/studio';
import { requireArea } from '@/lib/team';

export const dynamic = 'force-dynamic';

const sponsorLabel: Record<string, string> = { me: 'Nominator will sponsor', family: 'Another family member will sponsor', unsure: 'Sponsor not sure yet' };

export default async function LegacyNominations({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requireArea('clients');
  const { s = 'new' } = await searchParams;
  const tab = s === 'all' || LEGACY_STATUSES.some(([k]) => k === s) ? s : 'new';
  const [rows, counts] = await Promise.all([listNominations(tab), nominationCounts()]);
  const count = (k: string) => (k === 'all' ? counts.reduce((a, c) => a + Number(c.n), 0) : Number(counts.find((c) => c.status === k)?.n || 0));
  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">Clients</p><h1>Legacy nominations</h1><p className="a-sub" style={{ margin: 0 }}>Elders nominated on the Preserving Legacy page.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/preserving-legacy" target="_blank" rel="noopener noreferrer" className="btn btn-outline a-sm">View the page</a>
          <Link href="/admin/website?page=legacy" className="btn btn-outline a-sm">Edit the page</Link>
        </div>
      </div>
      <div className="chips" style={{ marginBottom: 16 }}>
        {[...LEGACY_STATUSES, ['all', 'All'] as const].map(([k, l]) => <Link key={k} href={`/admin/legacy?s=${k}`} className="chip" aria-current={tab === k ? 'page' : undefined}>{l} <span className="count">{count(k)}</span></Link>)}
      </div>
      {rows.length === 0 ? <div className="a-card a-sub">No nominations here yet.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((n) => (
            <article key={n.id} className="a-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ fontSize: 18 }}>{n.elder_name}</strong>{n.known_as ? <span className="a-sub"> “{n.known_as}”</span> : null}
                  <div className="a-sub">{n.sex} · {n.age} years · {n.town}, {n.state} State{n.languages ? ` · speaks ${n.languages}` : ''}</div>
                </div>
                <span className="a-sub">Nominated {longDate(n.created_at.slice(0, 10))}</span>
              </div>
              {n.known_for && <div><span className="a-hint">Known for</span><div>{n.known_for}</div></div>}
              <div><span className="a-hint">Their story</span><p style={{ margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{n.story}</p></div>
              <div className="a-grid" style={{ gap: 10 }}>
                {n.outfit && <div><span className="a-hint">Outfit idea</span><div>{n.outfit}</div></div>}
                {n.care_notes && <div><span className="a-hint">For their comfort</span><div>{n.care_notes}</div></div>}
                <div><span className="a-hint">Nominated by</span><div>{n.nominator_name} ({n.relationship})<br /><span className="a-sub">{n.phone} · {n.email}</span></div></div>
                <div><span className="a-hint">Sponsorship</span><div>{sponsorLabel[n.sponsor] || n.sponsor}{n.found_via ? <span className="a-sub"> · heard via {n.found_via}</span> : null}</div></div>
              </div>
              <NominationTools id={n.id} status={n.status} notes={n.notes} statuses={LEGACY_STATUSES} phone={n.phone} email={n.email} elder={n.elder_name} />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
