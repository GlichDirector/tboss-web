import Link from 'next/link';
import { listGalleries } from '@/lib/galleries';
import { formatDate } from '@/lib/content';

const stageLabel = { draft: 'Draft · not shared', selection: 'Client choosing', finished: 'Delivered' } as const;

export default async function GalleriesAdmin() {
  const rows = await listGalleries();
  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">Clients</p><h1>Client galleries</h1></div>
        <Link href="/admin/galleries/new" className="btn btn-accent">+ New client gallery</Link>
      </div>
      {rows.length === 0 ? (
        <div className="a-card" style={{ textAlign: 'center', padding: 48 }}>
          <p className="serif" style={{ fontSize: 28, margin: '0 0 8px' }}>No galleries yet</p>
          <p style={{ margin: '0 0 18px', color: 'var(--muted)' }}>Create one for your next client, upload the unedited photos, then send them the link.</p>
          <Link href="/admin/galleries/new" className="btn btn-dark">Create the first gallery</Link>
        </div>
      ) : (
        <div className="a-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="a-table">
            <thead><tr><th>Gallery</th><th>Stage</th><th>Unedited</th><th>Edited</th><th>Selections</th><th>Downloads</th><th>Expires</th></tr></thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td><Link href={`/admin/galleries/${g.id}`} style={{ fontWeight: 700 }}>{g.client_name} · {g.title}</Link><div className="a-sub">{g.session_date ? formatDate(g.session_date) : 'No date'}{g.location ? ` · ${g.location}` : ''}</div></td>
                  <td><span className={`a-badge a-${g.stage}`}>{stageLabel[g.stage]}</span></td>
                  <td>{g.unedited}</td><td>{g.edited}</td><td>{g.picks}</td><td>{g.downloads}</td>
                  <td>{g.expires_on ? formatDate(g.expires_on) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
