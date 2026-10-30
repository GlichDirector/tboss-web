'use client';

import { useState, useTransition } from 'react';
import { deleteGalleryAction, deletePhotoAction, setCoverAction, setStageAction } from '@/app/admin/actions';

export function CopyButton({ text, label = 'Copy', done = 'Copied' }: { text: string; label?: string; done?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="btn btn-outline a-sm" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); } catch { /* blocked */ } }}>
      {ok ? done : label}
    </button>
  );
}

export function StageControls({ id, stage, hasUnedited, hasEdited }: { id: number; stage: 'draft' | 'selection' | 'finished'; hasUnedited: boolean; hasEdited: boolean }) {
  const [notify, setNotify] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, start] = useTransition();
  const go = (s: 'draft' | 'selection' | 'finished') => start(async () => {
    const r = await setStageAction(id, s, notify);
    setMsg(r && 'sent' in r && notify && s !== 'draft' ? `Done. Email sent to ${r.sent} client${r.sent === 1 ? '' : 's'}.` : 'Done.');
  });
  return (
    <div className="a-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <strong>What happens next</strong>
      {stage === 'draft' && <p className="a-sub" style={{ margin: 0 }}>The client can’t see this gallery yet. Upload the unedited photos, then open it for choosing.</p>}
      {stage === 'selection' && <p className="a-sub" style={{ margin: 0 }}>The client is choosing favourites. Upload the edited photos to the Edited folder, then deliver.</p>}
      {stage === 'finished' && <p className="a-sub" style={{ margin: 0 }}>Delivered. The client can view, favourite and download the edited photos.</p>}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--oxblood)' }} />Email the client when I change the stage</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {stage !== 'selection' && <button type="button" className="btn btn-accent a-sm" disabled={busy || !hasUnedited} onClick={() => go('selection')}>{stage === 'finished' ? 'Reopen for choosing' : 'Open for client to choose'}</button>}
        {stage !== 'finished' && <button type="button" className="btn btn-dark a-sm" disabled={busy || !hasEdited} onClick={() => go('finished')}>Deliver edited photos</button>}
        {stage !== 'draft' && <button type="button" className="btn btn-outline a-sm" disabled={busy} onClick={() => go('draft')}>Hide from client</button>}
      </div>
      {!hasUnedited && stage === 'draft' && <span className="a-sub">Upload unedited photos first.</span>}
      {msg && <span role="status" className="a-ok">{msg}</span>}
    </div>
  );
}

export function PhotoTile({ galleryId, photo, isCover, picks }: { galleryId: number; photo: { id: number; filename: string; thumb: string; width: number; height: number }; isCover: boolean; picks: number }) {
  const [busy, start] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    <figure className="a-tile" style={{ opacity: busy ? 0.5 : 1 }}>
      <div className="a-tile-img" style={{ aspectRatio: `${photo.width || 4} / ${photo.height || 5}` }}><img src={photo.thumb} alt={photo.filename} loading="lazy" /></div>
      {isCover && <span className="a-cover">Cover</span>}
      {picks > 0 && <span className="a-picks" title="Clients who picked or saved this photo">♥ {picks}</span>}
      <figcaption>
        <span className="a-fn" title={photo.filename}>{photo.filename}</span>
        <span style={{ display: 'flex', gap: 10 }}>
          {!isCover && <button type="button" className="a-link" onClick={() => start(() => setCoverAction(galleryId, photo.id))}>Set cover</button>}
          <button type="button" className="a-link a-danger" onClick={() => { if (confirm(`Delete ${photo.filename}? This can’t be undone.`)) start(async () => { await deletePhotoAction(galleryId, photo.id); setGone(true); }); }}>Delete</button>
        </span>
      </figcaption>
    </figure>
  );
}

export function DeleteGallery({ id, name }: { id: number; name: string }) {
  const [busy, start] = useTransition();
  return (
    <button type="button" className="btn btn-outline a-sm a-danger" disabled={busy} onClick={() => { if (prompt(`This deletes the gallery and every photo in it. Type DELETE to confirm deleting “${name}”.`) === 'DELETE') start(() => deleteGalleryAction(id)); }}>
      Delete this gallery
    </button>
  );
}
