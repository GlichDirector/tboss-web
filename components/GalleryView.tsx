'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { sendSelection, toggleFav } from '@/app/g/[slug]/actions';
import { ChevronLeft, ChevronRight, PersonIcon } from './Icons';

type P = { id: number; filename: string; width: number; height: number; thumb: string; web: string };
type Props = {
  slug: string; accessKey: string; title: string; clientName: string; meta: string; cover: string | null;
  stage: 'draft' | 'selection' | 'finished'; admin: boolean; user: { email: string; name: string } | null;
  unedited: P[]; edited: P[]; initialFavs: number[]; limit: number; extraPrice: string | null;
  chooseBy: string | null; expires: string | null; sentAt: string | null;
};

const Heart = ({ on }: { on: boolean }) => (
  <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
);
const Down = () => <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></svg>;
const Send = () => <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l16-8-6 16-3-7z" /></svg>;

export default function GalleryView(p: Props) {
  const delivered = p.stage === 'finished';
  const [folder, setFolder] = useState<'unedited' | 'edited'>(delivered && p.edited.length ? 'edited' : 'unedited');
  const [favs, setFavs] = useState<number[]>(p.initialFavs);
  const [favView, setFavView] = useState(false);
  const [prompt, setPrompt] = useState<null | 'fav' | 'download' | 'submit'>(null);
  const [toast, setToast] = useState('');
  const [sent, setSent] = useState<string | null>(p.sentAt);
  const [open, setOpen] = useState<number | null>(null);
  const [busy, start] = useTransition();

  const here = `/g/${p.slug}${p.accessKey ? `?k=${encodeURIComponent(p.accessKey)}` : ''}`;
  const signInHref = `/api/auth/google?next=${encodeURIComponent(here)}`;
  const selecting = p.stage === 'selection' && folder === 'unedited';
  const editedWaiting = folder === 'edited' && p.edited.length === 0;
  const photos = folder === 'edited' ? p.edited : p.unedited;
  const shown = favView ? photos.filter((x) => favs.includes(x.id)) : photos;
  const folderFavs = photos.filter((x) => favs.includes(x.id)).length;
  const canDownload = folder === 'edited' && (delivered || p.admin);

  const heart = useCallback((id: number) => {
    if (!p.user) { setPrompt('fav'); return; }
    if (selecting && sent) { setToast('Your selection was sent to the studio. Message us if you need a change.'); return; }
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
    start(async () => {
      const r = await toggleFav(p.slug, p.accessKey, id);
      if (r.needsSignIn) setPrompt('fav');
      else if (r.favs) setFavs(r.favs);
      else if (r.error) setToast(r.error);
    });
  }, [p.user, p.slug, p.accessKey, selecting, sent]);

  const download = (id: number) => {
    if (!p.user) { setPrompt('download'); return; }
    window.location.href = `/g/${p.slug}/download/${id}${p.accessKey ? `?k=${encodeURIComponent(p.accessKey)}` : ''}`;
  };

  const submit = () => {
    if (!p.user) { setPrompt('submit'); return; }
    if (sent) return;
    if (!folderFavs) { setToast('Tap the heart on the photos you want edited, then send your selection.'); return; }
    start(async () => {
      const r = await sendSelection(p.slug, p.accessKey);
      if (r.ok) { setSent('today'); setToast(`Thank you! Your ${folderFavs} picks were sent to the studio. We will let you know when your edited photos are ready.`); }
      else if (r.needsSignIn) setPrompt('submit');
      else setToast(r.error || 'Something went wrong. Please try again.');
    });
  };

  // Keyboard control for the full-screen viewer.
  const idx = useMemo(() => shown.findIndex((x) => x.id === open), [shown, open]);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight' && idx < shown.length - 1) setOpen(shown[idx + 1].id);
      if (e.key === 'ArrowLeft' && idx > 0) setOpen(shown[idx - 1].id);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, idx, shown]);

  const copy = {
    fav: ['Save your picks', 'Sign in with Google so your hearts are saved and only you can see them.'],
    download: ['Download your photos', 'Sign in with Google to download full-size photos. Only you can download from your gallery.'],
    submit: ['Send your selection', 'Sign in with Google to send your picks to the studio.'],
  } as const;
  const pct = p.limit ? Math.min(100, Math.round((folderFavs / p.limit) * 100)) : 0;
  const cur = idx >= 0 ? shown[idx] : null;

  return (
    <div className="g-shell" id="main">
      <section className="g-cover" style={{ backgroundImage: p.cover ? `linear-gradient(0deg, rgba(14,13,12,0.85) 0%, rgba(14,13,12,0.15) 55%, rgba(14,13,12,0.35) 100%), url(${p.cover})` : undefined }}>
        <Link href="/" className="g-logo" aria-label="Tboss Photography, home"><img src="/brand/logo-cream.png" alt="Tboss Photography" width={82} height={56} /></Link>
        <div className="g-cover-text">
          <span className="eyebrow" style={{ color: '#E9C9A8' }}>{delivered ? 'Your finished photos' : 'Selection gallery · choose your photos'}</span>
          <h1>{p.clientName} <em>{p.title}</em></h1>
          <span className="g-meta">{p.meta}</span>
        </div>
      </section>

      <div className="g-bar">
        <div className="g-bar-in">
          <nav aria-label="Gallery folders" className="g-tabs">
            {(['unedited', 'edited'] as const).map((f) => (
              <button key={f} type="button" aria-pressed={folder === f && !favView} className="g-tab" onClick={() => { setFolder(f); setFavView(false); setToast(''); }}>
                {f === 'unedited' ? 'Unedited' : 'Edited'} ({f === 'unedited' ? p.unedited.length : p.edited.length})
              </button>
            ))}
          </nav>
          <div className="g-actions">
            {p.user ? (
              <span className="g-who" title={p.user.email}><span>{p.user.name.slice(0, 1).toUpperCase()}</span>Signed in</span>
            ) : (
              <a href={signInHref} className="g-who">Sign in</a>
            )}
            <button type="button" className="g-btn" aria-pressed={favView} onClick={() => setFavView((v) => !v)} disabled={editedWaiting}>
              <Heart on={favView} />{selecting ? 'My selection' : 'Favourites'} ({folderFavs})
            </button>
            {selecting && (
              <button type="button" className="g-btn g-primary" onClick={submit} disabled={busy || Boolean(sent)} style={{ opacity: !sent && !folderFavs ? 0.55 : 1 }}>
                <Send />{sent ? 'Selection sent ✓' : 'Send selection'}
              </button>
            )}
          </div>
        </div>
      </div>

      {selecting && (
        <div className="g-wrap" style={{ paddingTop: 20 }}>
          <div className="g-banner">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong>{sent ? 'Your selection is with the studio' : 'Choose the photos you’d like edited'}</strong>
              <span style={{ fontSize: 13, color: '#C9C0B4' }}>
                {sent
                  ? `Sent ${sent === 'today' ? 'today' : `on ${sent}`}. We’ll email you when your edited photos are ready.`
                  : [p.limit ? `Your package includes ${p.limit} photos.` : '', p.extraPrice ? `Extra picks are ${p.extraPrice} each.` : '', p.chooseBy ? `Please choose by ${p.chooseBy}.` : ''].filter(Boolean).join(' ') || 'Tap the heart on your favourites, then press Send selection.'}
              </span>
            </div>
            {p.limit > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220, flex: '0 1 280px' }}>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'rgba(243,238,230,0.14)', overflow: 'hidden' }}><div style={{ height: 8, width: `${pct}%`, background: '#D6A77A' }} /></div>
                <strong style={{ whiteSpace: 'nowrap' }}>{folderFavs} of {p.limit}</strong>
              </div>
            )}
            {p.limit > 0 && folderFavs > p.limit && (
              <span style={{ flexBasis: '100%', fontSize: 13, color: '#E9C9A8' }}>
                {folderFavs - p.limit} extra photo{folderFavs - p.limit > 1 ? 's' : ''}{p.extraPrice ? ` at ${p.extraPrice} each` : ''}. You can remove a heart to stay within your package.
              </span>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="g-wrap" style={{ paddingTop: 16 }} role="status">
          <div className="g-toast">{toast}<button type="button" aria-label="Dismiss" onClick={() => setToast('')}>×</button></div>
        </div>
      )}

      <section className="g-wrap" aria-label="Photos" style={{ paddingTop: 24, paddingBottom: 64 }}>
        {editedWaiting ? (
          <p className="g-empty">Your edited photos will appear here once you send your selection and the studio finishes editing.</p>
        ) : shown.length === 0 ? (
          <p className="g-empty">{favView ? (selecting ? 'No photos selected yet. Tap the heart on the photos you want edited.' : 'No favourites yet. Tap the heart on any photo to save it here.') : 'Photos are on their way.'}</p>
        ) : (
          <div className="masonry">
            {shown.map((ph) => {
              const on = favs.includes(ph.id);
              return (
                <div key={ph.id} className="m-item" style={{ aspectRatio: `${ph.width || 4} / ${ph.height || 5}`, outline: selecting && on ? '3px solid #D6A77A' : undefined }}>
                  <button type="button" className="m-open" onClick={() => setOpen(ph.id)} aria-label={`Open ${ph.filename}`}>
                    <img src={ph.thumb} alt={ph.filename} loading="lazy" />
                  </button>
                  <button type="button" className="m-heart" aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${ph.filename} ${selecting ? 'from your selection' : 'from favourites'}`} onClick={() => heart(ph.id)} style={{ color: on ? '#D6A77A' : '#F3EEE6' }}>
                    <Heart on={on} />
                  </button>
                  {canDownload && <button type="button" className="m-down" aria-label={`Download ${ph.filename}`} onClick={() => download(ph.id)}><Down /></button>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="g-foot">
        <span>{delivered ? `Favourites and downloads need Google sign-in${p.expires ? ` · available until ${p.expires}` : ''}` : 'Unedited previews · downloads open once your edited photos are delivered'}</span>
        {p.user ? <a href={`/api/auth/logout?next=${encodeURIComponent(here)}`}>Sign out ({p.user.email})</a> : <Link href="/galleries">All my galleries</Link>}
      </footer>

      {cur && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={cur.filename} onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <img src={cur.web} alt={cur.filename} />
          <div className="lb-bar">
            <span>{cur.filename} · {idx + 1} of {shown.length}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="g-btn" onClick={() => heart(cur.id)} aria-pressed={favs.includes(cur.id)} style={{ color: favs.includes(cur.id) ? '#D6A77A' : undefined }}><Heart on={favs.includes(cur.id)} />{favs.includes(cur.id) ? 'Saved' : 'Save'}</button>
              {canDownload && <button type="button" className="g-btn" onClick={() => download(cur.id)}><Down />Download</button>}
              <button type="button" className="g-btn" onClick={() => setOpen(null)}>Close</button>
            </div>
          </div>
          {idx > 0 && <button type="button" className="lb-nav lb-prev" aria-label="Previous photo" onClick={() => setOpen(shown[idx - 1].id)}><ChevronLeft size={22} /></button>}
          {idx < shown.length - 1 && <button type="button" className="lb-nav lb-next" aria-label="Next photo" onClick={() => setOpen(shown[idx + 1].id)}><ChevronRight size={22} /></button>}
        </div>
      )}

      {prompt && (
        <div className="lightbox" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={(e) => { if (e.target === e.currentTarget) setPrompt(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="gtitle" className="g-modal">
            <h2 id="gtitle" className="serif" style={{ margin: 0, fontSize: 32, lineHeight: 1.1 }}>{copy[prompt][0]}</h2>
            <p style={{ margin: 0, color: '#625850', fontSize: 15 }}>{copy[prompt][1]}</p>
            <a href={signInHref} className="btn" style={{ width: '100%', border: '1px solid rgba(31,26,22,0.2)', background: '#fff', color: '#1F1A16' }}><PersonIcon />Continue with Google</a>
            <button type="button" onClick={() => setPrompt(null)} style={{ border: 0, background: 'none', color: '#625850', fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>Not now, keep browsing</button>
            <p style={{ margin: 0, fontSize: 12, color: '#625850' }}>We only use your Google name and email to keep your picks private to you.</p>
          </div>
        </div>
      )}
    </div>
  );
}
