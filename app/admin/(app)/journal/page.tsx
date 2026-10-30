import Link from 'next/link';
import NewStoryButton from '@/components/admin/NewStoryButton';
import { listStoryRows, mediaSrc } from '@/lib/journal';
import { longDate } from '@/lib/studio';
import { requireArea } from '@/lib/team';

export default async function JournalAdmin() {
  await requireArea('website');
  const rows = await listStoryRows();
  const drafts = rows.filter((r) => r.status === 'draft');
  const live = rows.filter((r) => r.status === 'published');
  const Card = ({ r }: { r: (typeof rows)[number] }) => (
    <Link href={`/admin/journal/${r.id}`} className="a-card a-story">
      <img src={mediaSrc(r.cover_key)} alt="" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {r.source === 'ai' && <span className="a-badge a-selection">AI draft</span>}
          <span className="a-badge">{r.category}</span>
        </span>
        <strong>{r.title}</strong>
        <span className="a-sub">{r.status === 'published' ? `Published ${longDate(r.published_at || r.created_at)}` : `Draft · updated ${r.updated_at.slice(0, 10)}`}</span>
      </div>
    </Link>
  );
  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">Website</p><h1>Journal</h1></div>
        <div style={{ display: 'flex', gap: 8 }}><Link href="/admin/work" className="btn btn-outline a-sm">New post with AI article</Link><NewStoryButton /></div>
      </div>
      <h2 className="a-h2">Waiting for approval ({drafts.length})</h2>
      <p className="a-sub" style={{ margin: '0 0 12px' }}>Drafts are never shown on the website until you press Publish.</p>
      <div className="a-stories">{drafts.length ? drafts.map((r) => <Card key={r.id} r={r} />) : <p className="a-sub">No drafts.</p>}</div>
      <h2 className="a-h2" style={{ marginTop: 24 }}>Published ({live.length})</h2>
      <div className="a-stories">{live.length ? live.map((r) => <Card key={r.id} r={r} />) : <p className="a-sub">Nothing published yet.</p>}</div>
    </>
  );
}
