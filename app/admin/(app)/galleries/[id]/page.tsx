import Link from 'next/link';
import { notFound } from 'next/navigation';
import Uploader from '@/components/admin/Uploader';
import GalleryForm from '@/components/admin/GalleryForm';
import { CopyButton, DeleteGallery, PhotoTile, StageControls } from '@/components/admin/GalleryTools';
import { updateGalleryAction } from '@/app/admin/actions';
import { siteOrigin } from '@/lib/auth';
import { downloadsReport, favouriteCounts, getGallery, listPhotos, selectionsReport } from '@/lib/galleries';
import { formatDate } from '@/lib/content';

const tabs = [
  ['unedited', 'Unedited'], ['edited', 'Edited'], ['selections', 'Selections'], ['downloads', 'Downloads'], ['settings', 'Details'],
] as const;
const stageLabel = { draft: 'Draft · not shared', selection: 'Client choosing', finished: 'Delivered' } as const;

export default async function ManageGallery({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; new?: string }> }) {
  const id = Number((await params).id);
  const { tab = 'unedited', new: isNew } = await searchParams;
  const g = await getGallery(id);
  if (!g) notFound();

  const [unedited, edited, counts] = await Promise.all([listPhotos(id, 'unedited'), listPhotos(id, 'edited'), favouriteCounts(id)]);
  const link = `${siteOrigin()}/g/${g.slug}?k=${g.access_key}`;
  const folderPhotos = tab === 'edited' ? edited : unedited;

  return (
    <>
      <div className="a-head">
        <div>
          <p className="a-kicker"><Link href="/admin/galleries">Client galleries</Link> /</p>
          <h1>{g.client_name} · {g.title}</h1>
          <div className="a-sub" style={{ marginTop: 4 }}>
            <span className={`a-badge a-${g.stage}`}>{stageLabel[g.stage]}</span>{' '}
            {g.session_date ? formatDate(g.session_date) : ''}{g.location ? ` · ${g.location}` : ''} · {g.client_emails}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={link} target="_blank" rel="noopener" className="btn btn-outline a-sm">View as client</a>
          <CopyButton text={link} label="Copy client link" done="Link copied" />
        </div>
      </div>

      {isNew && <div className="a-ok" role="status" style={{ marginBottom: 16 }}>Gallery created. Upload the unedited photos below.</div>}

      <div className="a-cols">
        <div style={{ minWidth: 0 }}>
          <nav className="a-tabs" aria-label="Gallery sections">
            {tabs.map(([k, label]) => (
              <Link key={k} href={`/admin/galleries/${id}?tab=${k}`} aria-current={tab === k ? 'page' : undefined}>
                {label}{k === 'unedited' ? ` (${unedited.length})` : k === 'edited' ? ` (${edited.length})` : ''}
              </Link>
            ))}
          </nav>

          {(tab === 'unedited' || tab === 'edited') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Uploader galleryId={id} folder={tab} />
              {folderPhotos.length === 0 ? (
                <p className="a-sub">No {tab} photos yet.</p>
              ) : (
                <div className="a-photos">
                  {folderPhotos.map((p) => <PhotoTile key={p.id} galleryId={id} photo={p} isCover={g.cover_photo_id === p.id} picks={counts[p.id] || 0} />)}
                </div>
              )}
            </div>
          )}

          {tab === 'selections' && <Selections id={id} />}
          {tab === 'downloads' && <Downloads id={id} />}
          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <GalleryForm action={updateGalleryAction.bind(null, id)} values={g} submitLabel="Save details" />
              <div className="a-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="a-sub">Deleting removes the gallery and all its photos from storage.</span>
                <DeleteGallery id={id} name={`${g.client_name} · ${g.title}`} />
              </div>
            </div>
          )}
        </div>
        <StageControls id={id} stage={g.stage} hasUnedited={unedited.length > 0} hasEdited={edited.length > 0} />
      </div>
    </>
  );
}

async function Selections({ id }: { id: number }) {
  const rows = await selectionsReport(id);
  if (!rows.length) return <p className="a-sub">No selections sent yet. When a client presses “Send selection”, their picks appear here and you get an email.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rows.map((r) => (
        <div className="a-card" key={r.email}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><strong>{r.email}</strong><div className="a-sub">{r.files.length} photos · sent {formatDate(r.submitted_at.slice(0, 10))}</div></div>
            <CopyButton text={r.files.join('\n')} label="Copy file names" done="Copied for Lightroom" />
          </div>
          <p className="a-names">{r.files.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

async function Downloads({ id }: { id: number }) {
  const { byPerson, byPhoto, detail } = await downloadsReport(id);
  if (!byPerson.length) return <p className="a-sub">No downloads yet. Every download is recorded here with the email that made it.</p>;
  const total = byPerson.reduce((s, r) => s + Number(r.total), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="a-stats">
        <div className="a-card"><span className="a-sub">Downloads</span><strong>{total}</strong></div>
        <div className="a-card"><span className="a-sub">People</span><strong>{byPerson.length}</strong></div>
        <div className="a-card"><span className="a-sub">Different photos</span><strong>{byPhoto.length}</strong></div>
      </div>
      <div className="a-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="a-table">
          <thead><tr><th>Who downloaded</th><th>Downloads</th><th>Photos</th><th>Last</th></tr></thead>
          <tbody>{byPerson.map((r) => <tr key={r.email}><td>{r.email}</td><td>{r.total}</td><td>{r.photos}</td><td>{r.last.slice(0, 16).replace('T', ' ')}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="a-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="a-table">
          <thead><tr><th>Photo</th><th>Times downloaded</th><th>By how many people</th></tr></thead>
          <tbody>{byPhoto.map((r) => <tr key={r.filename}><td>{r.filename}</td><td>{r.total}</td><td>{r.people}</td></tr>)}</tbody>
        </table>
      </div>
      <details className="a-card">
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Every person × photo</summary>
        <table className="a-table" style={{ marginTop: 12 }}>
          <thead><tr><th>Email</th><th>Photo</th><th>Times</th></tr></thead>
          <tbody>{detail.map((r) => <tr key={r.email + r.filename}><td>{r.email}</td><td>{r.filename}</td><td>{r.times}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}
