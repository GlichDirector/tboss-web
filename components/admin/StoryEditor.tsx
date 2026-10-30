'use client';

import { useRef, useState, useTransition } from 'react';
import { deleteStoryAction, saveStoryAction, type StoryForm } from '@/app/admin/journal-actions';
import { siteImageUploadAction } from '@/app/admin/website-actions';
import { putBlob, resizeImage } from './imageTools';

type Block = { type: 'p' | 'h2' | 'quote'; text: string } | { type: 'image'; src: string; alt: string };
const CATS = ['Portraits', 'Families', 'Events', 'Heritage', 'Guides & tips'];

async function upload(file: File) {
  const { blob } = await resizeImage(file, 2000);
  const { url, publicUrl } = await siteImageUploadAction('journal');
  await putBlob(url, blob);
  return publicUrl;
}

function PhotoButton({ label, onDone }: { label: string; onDone: (src: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-outline a-sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Uploading…' : label}</button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
        setBusy(true); try { onDone(await upload(f)); } catch { alert('Upload failed. Please try again.'); } setBusy(false);
      }} />
    </>
  );
}

export default function StoryEditor({ id, initial, blocks: initialBlocks, status, source, instagramUrl }: {
  id: number; initial: StoryForm; blocks: Block[]; status: 'draft' | 'published'; source: 'manual' | 'ai'; instagramUrl: string | null;
}) {
  const [f, setF] = useState<StoryForm>(initial);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks.length ? initialBlocks : [{ type: 'p', text: '' }]);
  const [st, setSt] = useState(status);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [busy, start] = useTransition();
  const [slugTouched, setSlugTouched] = useState(status === 'published');
  const slugify = (v: string) => v.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 90);
  const set = (k: keyof StoryForm, v: string) => setF((x) => ({ ...x, [k]: v, ...(k === 'title' && !slugTouched ? { slug: slugify(v) } : {}) }));
  const setB = (i: number, b: Block) => setBlocks(blocks.map((x, j) => (j === i ? b : x)));
  const move = (i: number, d: number) => { const n = [...blocks]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); setBlocks(n); };
  const add = (b: Block) => setBlocks([...blocks, b]);
  const coverSrc = f.cover_key ? (f.cover_key.startsWith('/') ? f.cover_key : `/media/${f.cover_key}`) : '';

  const save = (publish: boolean | null) => start(async () => {
    const r = await saveStoryAction(id, { ...f, body: JSON.stringify(blocks) }, publish);
    setMsg(r);
    if ('slug' in r && r.slug) setF((x) => ({ ...x, slug: r.slug! }));
    if ('status' in r && r.status) setSt(r.status);
  });

  return (
    <div className="a-cols">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {source === 'ai' && <div className="a-card" style={{ background: '#FBF3E6', borderColor: '#EBD3A9' }}><strong>AI draft from Instagram.</strong> <span className="a-sub">Read it through, correct anything that isn’t right, and add real names only with the clients’ permission. {instagramUrl && <a className="a-link" href={instagramUrl} target="_blank" rel="noopener noreferrer">See the original post</a>}</span></div>}
        <div className="a-card a-form" style={{ maxWidth: 'none' }}>
          <div className="field"><label htmlFor="st-title">Title</label><input id="st-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} style={{ fontSize: 18, fontWeight: 600 }} /></div>
          <div className="field"><label htmlFor="st-lead">Opening paragraph</label><textarea id="st-lead" className="input" rows={3} value={f.lead} onChange={(e) => set('lead', e.target.value)} /></div>
          <span className="legend">Story</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {blocks.map((b, i) => (
              <div key={i} className="pe-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span className="a-sub" style={{ fontWeight: 700 }}>{b.type === 'p' ? 'Paragraph' : b.type === 'h2' ? 'Sub-heading' : b.type === 'quote' ? 'Quote' : 'Photo'}</span>
                  <span className="pe-item-tools">
                    <button type="button" className="a-link" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                    <button type="button" className="a-link" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                    <button type="button" className="a-link a-danger" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}>Remove</button>
                  </span>
                </div>
                {b.type === 'image' ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {b.src && <img src={b.src} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6 }} />}
                    <PhotoButton label={b.src ? 'Replace photo' : 'Choose photo'} onDone={(src) => setB(i, { ...b, src })} />
                    <input className="input" aria-label="Describe the photo" placeholder="Describe the photo" value={b.alt} onChange={(e) => setB(i, { ...b, alt: e.target.value })} style={{ flex: '1 1 200px' }} />
                  </div>
                ) : (
                  <textarea className="input" aria-label="Text" rows={b.type === 'p' ? 4 : 2} value={b.text} onChange={(e) => setB(i, { ...b, text: e.target.value })} style={b.type === 'h2' ? { fontWeight: 700 } : b.type === 'quote' ? { fontStyle: 'italic' } : undefined} />
                )}
              </div>
            ))}
          </div>
          <div className="chips">
            <button type="button" className="chip" onClick={() => add({ type: 'p', text: '' })}>+ Paragraph</button>
            <button type="button" className="chip" onClick={() => add({ type: 'h2', text: '' })}>+ Sub-heading</button>
            <button type="button" className="chip" onClick={() => add({ type: 'image', src: '', alt: '' })}>+ Photo</button>
            <button type="button" className="chip" onClick={() => add({ type: 'quote', text: '' })}>+ Quote</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="a-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className={`a-badge ${st === 'published' ? 'a-finished' : 'a-selection'}`} style={{ alignSelf: 'flex-start' }}>{st === 'published' ? 'Published' : 'Draft · not on the website'}</span>
          {msg.ok && <div className="a-ok" role="status">{msg.ok}</div>}
          {msg.error && <div className="alert" role="alert">{msg.error}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {st === 'draft'
              ? <button type="button" className="btn btn-accent a-sm" disabled={busy} onClick={() => save(true)}>Approve &amp; publish</button>
              : <button type="button" className="btn btn-accent a-sm" disabled={busy} onClick={() => save(null)}>Save changes</button>}
            {st === 'draft' ? <button type="button" className="btn btn-outline a-sm" disabled={busy} onClick={() => save(null)}>Save draft</button>
              : <button type="button" className="btn btn-outline a-sm" disabled={busy} onClick={() => save(false)}>Unpublish</button>}
          </div>
          <a className="a-link" href={`/journal/${f.slug}?preview=1`} target="_blank" rel="noopener">Preview the page ↗</a>
          <span className="a-hint">Save first to preview your latest changes.</span>
        </div>
        <div className="a-card a-form">
          <span className="legend">Cover photo</span>
          {coverSrc && <img src={coverSrc} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 8 }} />}
          <PhotoButton label={coverSrc ? 'Replace cover' : 'Choose cover'} onDone={(src) => set('cover_key', src)} />
          <div className="field"><label htmlFor="st-alt">Describe the cover photo</label><input id="st-alt" className="input" value={f.cover_alt} onChange={(e) => set('cover_alt', e.target.value)} /></div>
          <div className="field"><label htmlFor="st-cat">Category</label><select id="st-cat" className="input" value={f.category} onChange={(e) => set('category', e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label htmlFor="st-ex">Short summary (for cards and Google)</label><textarea id="st-ex" className="input" rows={3} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} /><span className="a-hint">{f.excerpt.length}/200 characters</span></div>
          <div className="field"><label htmlFor="st-kw">Search phrases (comma separated)</label><input id="st-kw" className="input" value={f.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="family photographer Ibadan, outdoor family shoot" /></div>
          <div className="field"><label htmlFor="st-loc">Location</label><input id="st-loc" className="input" value={f.location} onChange={(e) => set('location', e.target.value)} /></div>
          <div className="field"><label htmlFor="st-ses">Session</label><input id="st-ses" className="input" value={f.session_type} onChange={(e) => set('session_type', e.target.value)} /></div>
          <div className="field"><label htmlFor="st-sty">Styling / make-up credit</label><input id="st-sty" className="input" value={f.styling} onChange={(e) => set('styling', e.target.value)} /></div>
          <div className="field"><label htmlFor="st-slug">Web address</label><input id="st-slug" className="input" value={f.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /><span className="a-hint">tbossphotography.com/journal/{f.slug}</span></div>
        </div>
        <button type="button" className="a-link a-danger" style={{ alignSelf: 'flex-start' }} onClick={() => { if (confirm('Delete this story? This can’t be undone.')) start(() => deleteStoryAction(id)); }}>Delete story</button>
      </div>
    </div>
  );
}
