'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { deleteWorkPhotoAction, publishWorkAction, workPhotoAction, workUploadUrlsAction, type PostedPhoto } from '@/app/admin/work-actions';
import { makeVariants, putTyped, WEB_WIDTHS } from './imageTools';

const CATS = ['Portraits', 'Events', 'Heritage'] as const;

export function WorkPoster({ aiReady }: { aiReady: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [category, setCategory] = useState<(typeof CATS)[number]>('Portraits');
  const [note, setNote] = useState('');
  const [article, setArticle] = useState(aiReady);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [onWork, setOnWork] = useState<boolean[]>([]);
  const [cover, setCover] = useState(0);

  function pick(list: FileList | null) {
    const chosen = Array.from(list || []).filter((f) => f.type.startsWith('image/')).slice(0, 12);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles(chosen);
    setPreviews(chosen.map((f) => URL.createObjectURL(f)));
    // With an article, only the first photo goes on Work until you tick more; without one, all do.
    setOnWork(chosen.map((_, i) => !article || i === 0));
    setCover(0);
  }

  async function post() {
    if (!files.length) { setErr('Choose at least one photo.'); return; }
    if (!article && !onWork.some(Boolean)) { setErr('Tick “On Work page” on at least one photo.'); return; }
    if (article && note.trim().length < 15) { setErr('Add a short note about the session (who, where, what made it special), so the article is accurate.'); return; }
    setErr(''); setOk('');
    try {
      // The Journal cover goes first; the rest keep their order.
      const order = article ? [cover, ...files.map((_, i) => i).filter((i) => i !== cover)] : files.map((_, i) => i);
      const made: (Awaited<ReturnType<typeof makeVariants>>)[] = [];
      for (const [n, i] of order.entries()) {
        setBusy(`Preparing photo ${n + 1} of ${files.length}…`);
        made.push(await makeVariants(files[i]));
      }
      const ext = made[0].ext as 'webp' | 'jpg';
      const links = await workUploadUrlsAction(made.length, ext);
      const photos: PostedPhoto[] = [];
      for (const [i, m] of made.entries()) {
        setBusy(`Uploading photo ${i + 1} of ${made.length}…`);
        await Promise.all(WEB_WIDTHS.map((w) => putTyped(links[i].urls[w], m.blobs[w], m.type)));
        photos.push({ base: links[i].base, ext, width: m.width, height: m.height, blur: m.blur, inWork: onWork[order[i]] });
      }
      setBusy(article ? 'Writing the article… this takes about 30 seconds.' : 'Publishing…');
      const r = await publishWorkAction({ category, note, article, photos });
      setBusy('');
      if ('error' in r && r.error) { setErr(r.error); router.refresh(); return; }
      if ('storyId' in r && r.storyId) { router.push(`/admin/journal/${r.storyId}?drafted=1`); return; }
      setOk(r.ok || 'Posted.');
      pick(null); setNote('');
      if (input.current) input.current.value = '';
      router.refresh();
    } catch (e) {
      setBusy('');
      setErr(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="a-card a-form" style={{ maxWidth: 'none' }}>
      <h2 className="a-h2" style={{ margin: 0 }}>New post</h2>
      <div className="field">
        <label htmlFor="wp-files">Photos (up to 12)</label>
        <input ref={input} id="wp-files" type="file" accept="image/*" multiple className="input" onChange={(e) => { setErr(''); setOk(''); pick(e.target.files); }} disabled={!!busy} />
        <span className="a-hint">Use your full-size edited JPEGs. They’re resized here for a fast website.</span>
      </div>
      {previews.length > 0 && (
        <div className="field">
          <span style={{ fontWeight: 600, fontSize: 14 }}>{article ? 'Choose the Journal cover, and which photos go on the Work page' : 'Choose which photos go on the Work page'}</span>
          <div className="a-wpick">
            {previews.map((u, i) => (
              <div key={u} className={`a-wpick-item${article && cover === i ? ' is-cover' : ''}`}>
                <img src={u} alt={`Selected photo ${i + 1}`} />
                {article && (
                  <label><input type="radio" name="wp-cover" checked={cover === i} onChange={() => setCover(i)} disabled={!!busy} /> Journal cover</label>
                )}
                <label><input type="checkbox" checked={!!onWork[i]} onChange={(e) => setOnWork((w) => w.map((v, k) => (k === i ? e.target.checked : v)))} disabled={!!busy} /> On Work page</label>
              </div>
            ))}
          </div>
          <span className="a-hint">{article ? 'All the photos appear in the article. Only the ticked ones also show in your portfolio on the Work page.' : 'Only the ticked photos are posted.'}</span>
        </div>
      )}
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Category on the Work page</legend>
        <div className="a-seg" role="group">
          {CATS.map((c) => <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} disabled={!!busy}>{c}</button>)}
        </div>
        <span className="a-hint">Family sessions go under Portraits.</span>
      </fieldset>
      <div className="field">
        <label htmlFor="wp-note">Short note about the session</label>
        <textarea id="wp-note" className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={!!busy} maxLength={1500}
          placeholder="e.g. Mrs Adeyemi’s 80th birthday portraits at her family home in Bodija. Three generations, aso-oke in gold, a lot of laughter." />
        <span className="a-hint">Only facts you write here (and what’s visible in the photos) go into the article. Add names only with the client’s permission.</span>
      </div>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={article} onChange={(e) => { const on = e.target.checked; setArticle(on); setOnWork((w) => w.map((_, i) => !on || i === cover)); }} disabled={!!busy || !aiReady} style={{ marginTop: 4 }} />
        <span><strong>Write a Journal article with AI</strong><br /><span className="a-sub">{aiReady ? 'You’ll review the draft before it goes live. The ticked photos appear on Work when you publish the article.' : 'Add ANTHROPIC_API_KEY in Hostinger to turn this on. Photos still post straight to Work.'}</span></span>
      </label>
      {err && <div role="alert" className="alert">{err}</div>}
      {ok && <div role="status" className="a-ok">{ok}</div>}
      {busy && <div role="status" className="a-sub" aria-live="polite">{busy}</div>}
      <div><button type="button" className="btn btn-accent" onClick={post} disabled={!!busy || !files.length}>{busy ? 'Working…' : article ? 'Upload and write article' : 'Post to Work'}</button></div>
    </div>
  );
}

export type WorkRow = { id: number; src: string; category: string; hidden: number; in_work: number; alt: string | null; story_id: number | null; title: string | null; status: string | null };

export function WorkList({ rows }: { rows: WorkRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState('All');
  const shown = filter === 'All' ? rows : rows.filter((r) => r.category === filter);
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  return (
    <>
      <div className="a-seg" role="group" aria-label="Show category" style={{ marginBottom: 12 }}>
        {['All', ...CATS].map((c) => <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}>{c} ({c === 'All' ? rows.length : rows.filter((r) => r.category === c).length})</button>)}
      </div>
      {!shown.length && <p className="a-sub">No photos here yet.</p>}
      <div className="a-igrid" aria-busy={pending}>
        {shown.map((r) => (
          <figure key={r.id} className="a-tile" style={{ margin: 0, opacity: r.hidden || !r.in_work ? 0.6 : 1 }}>
            <div className="a-tile-img" style={{ aspectRatio: '4 / 5' }}><img src={r.src} alt={r.alt || ''} loading="lazy" /></div>
            {!r.in_work ? <span className="a-cover">Article only</span> : r.hidden ? <span className="a-cover">{r.story_id && r.status === 'draft' ? 'Waiting for article' : 'Hidden'}</span> : null}
            <figcaption>
              <label className="a-hint" htmlFor={`cat${r.id}`}>Category</label>
              <select id={`cat${r.id}`} className="input" value={r.category} onChange={(e) => run(() => workPhotoAction(r.id, { category: e.target.value }))}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <label className="a-hint" htmlFor={`alt${r.id}`}>Description (for Google)</label>
              <textarea id={`alt${r.id}`} className="input" rows={2} defaultValue={r.alt || ''} onBlur={(e) => e.target.value !== (r.alt || '') && run(() => workPhotoAction(r.id, { alt: e.target.value }))} />
              {r.story_id && r.title && <a className="a-link" href={`/admin/journal/${r.story_id}`}>Story: {r.title}</a>}
              <span style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {r.in_work ? <button type="button" className="a-link" onClick={() => run(() => workPhotoAction(r.id, { hidden: !r.hidden }))}>{r.hidden ? 'Show on website' : 'Hide'}</button> : null}
                {r.story_id ? <button type="button" className="a-link" onClick={() => run(() => workPhotoAction(r.id, { in_work: !r.in_work }))}>{r.in_work ? 'Article only' : 'Add to Work page'}</button> : null}
                <button type="button" className="a-link" style={{ color: 'var(--oxblood)' }} onClick={() => { if (confirm(r.story_id ? 'Delete this photo? It will also disappear from its Journal story.' : 'Delete this photo from the website?')) run(() => deleteWorkPhotoAction(r.id)); }}>Delete</button>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
