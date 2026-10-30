'use client';

import { useRef, useState, useTransition } from 'react';
import { savePageAction, siteImageUploadAction } from '@/app/admin/website-actions';
import { putBlob, resizeImage } from './imageTools';

type Field =
  | { key: string; label: string; type: 'text' | 'textarea'; help?: string }
  | { key: string; label: string; type: 'image'; size?: number }
  | { key: string; label: string; type: 'toggle' }
  | { key: string; label: string; type: 'cards'; item: string }
  | { key: string; label: string; type: 'faqs' }
  | { key: string; label: string; type: 'slides' };
type Section = { title: string; toggle?: string; fields: Field[] };

const SCHEMA: Record<string, { label: string; path: string; sections: Section[] }> = {
  home: { label: 'Home', path: '/', sections: [
    { title: 'Hero slider', fields: [
      { key: 'heroTitle', label: 'Headline', type: 'text' }, { key: 'heroTitleItalic', label: 'Headline, italic part', type: 'text' },
      { key: 'heroSub', label: 'Line under the headline', type: 'textarea' }, { key: 'slides', label: 'Slides', type: 'slides' },
    ] },
    { title: 'What we photograph', toggle: 'showServices', fields: [{ key: 'services', label: 'Services', type: 'cards', item: 'service' }] },
    { title: 'Selected work (from Instagram)', toggle: 'showWork', fields: [{ key: 'workTitle', label: 'Heading', type: 'text' }] },
    { title: 'About the studio', toggle: 'showAbout', fields: [{ key: 'aboutTitle', label: 'Heading', type: 'text' }, { key: 'aboutText', label: 'Text', type: 'textarea' }, { key: 'aboutImage', label: 'Photo', type: 'image' }] },
    { title: 'Heritage project', toggle: 'showHeritage', fields: [{ key: 'heritageTitle', label: 'Heading', type: 'text' }, { key: 'heritageText', label: 'Text', type: 'textarea' }, { key: 'heritageImage', label: 'Photo', type: 'image' }] },
    { title: 'Client galleries band', toggle: 'showGalleries', fields: [{ key: 'galleriesTitle', label: 'Heading', type: 'text' }, { key: 'galleriesText', label: 'Text', type: 'textarea' }] },
    { title: 'Journal stories', toggle: 'showJournal', fields: [] },
    { title: 'Client testimonial', fields: [{ key: 'testimonialQuote', label: 'Quote (leave empty to hide the section)', type: 'textarea' }, { key: 'testimonialName', label: 'Client name', type: 'text' }, { key: 'testimonialSession', label: 'Session', type: 'text' }] },
    { title: 'Closing call to action', fields: [{ key: 'ctaTitle', label: 'Heading', type: 'text' }, { key: 'ctaText', label: 'Text', type: 'textarea' }] },
  ] },
  about: { label: 'About', path: '/about', sections: [
    { title: 'Introduction', fields: [{ key: 'title', label: 'Heading', type: 'text' }, { key: 'intro', label: 'Introduction', type: 'textarea' }, { key: 'story', label: 'A personal paragraph (optional)', type: 'textarea' }, { key: 'image', label: 'Portrait', type: 'image' }] },
    { title: 'How we work', fields: [{ key: 'valuesTitle', label: 'Heading', type: 'text' }, { key: 'values', label: 'Values', type: 'cards', item: 'value' }] },
    { title: 'What to expect', fields: [{ key: 'stepsTitle', label: 'Heading', type: 'text' }, { key: 'steps', label: 'Steps', type: 'cards', item: 'step' }] },
    { title: 'Heritage project', toggle: 'showHeritage', fields: [{ key: 'heritageText', label: 'Text', type: 'textarea' }, { key: 'heritageImage', label: 'Photo', type: 'image' }] },
    { title: 'Closing', fields: [{ key: 'ctaTitle', label: 'Heading', type: 'text' }] },
  ] },
  contact: { label: 'Contact', path: '/contact', sections: [
    { title: 'Introduction', fields: [{ key: 'title', label: 'Heading', type: 'text' }, { key: 'intro', label: 'Introduction', type: 'textarea' }, { key: 'replyTime', label: 'How fast you reply (e.g. 24 hours)', type: 'text' }] },
    { title: 'Questions & answers', fields: [{ key: 'faqs', label: 'FAQs', type: 'faqs' }] },
  ] },
  work: { label: 'Work', path: '/work', sections: [{ title: 'Introduction', fields: [{ key: 'intro', label: 'Line under “The work”', type: 'textarea', help: 'Photos on this page come from Instagram. Hide or re-label them in Work & Instagram.' }] }] },
};

type Data = Record<string, unknown>;

function ImageField({ value, onChange, label, size = 1800 }: { value: string; onChange: (v: string) => void; label: string; size?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="field">
      <span className="legend">{label}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <img src={value} alt="" style={{ width: 84, height: 64, objectFit: 'cover', borderRadius: 6, background: '#EFE7DA' }} />
        <button type="button" className="btn btn-outline a-sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Uploading…' : 'Replace photo'}</button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = '';
          if (!f) return;
          setBusy(true); setErr('');
          try {
            const { blob } = await resizeImage(f, size);
            const { url, publicUrl } = await siteImageUploadAction('site');
            await putBlob(url, blob);
            onChange(publicUrl);
          } catch { setErr('Upload failed. Check the photo storage settings and try again.'); }
          setBusy(false);
        }} />
      </div>
      {err && <span className="alert">{err}</span>}
    </div>
  );
}

export default function PageEditor({ page, initial }: { page: string; initial: Data }) {
  const spec = SCHEMA[page];
  const [data, setData] = useState<Data>(initial);
  const [saved, setSaved] = useState<string>('');
  const [dirty, setDirty] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop');
  const [key, setKey] = useState(0);
  const [busy, start] = useTransition();
  const set = (k: string, v: unknown) => { setData((d) => ({ ...d, [k]: v })); setDirty(true); setSaved(''); };
  const list = <T,>(k: string) => (data[k] as T[]) || [];

  const save = () => start(async () => { await savePageAction(page as never, data); setDirty(false); setSaved('Published. The page below shows the live version.'); setKey((x) => x + 1); });

  return (
    <div className="pe">
      <div className="pe-form">
        <div className="pe-bar">
          <strong>{spec.label} page</strong>
          <button type="button" className="btn btn-accent a-sm" disabled={busy || !dirty} onClick={save}>{busy ? 'Publishing…' : dirty ? 'Publish changes' : 'Published'}</button>
        </div>
        {saved && <div className="a-ok" role="status">{saved}</div>}
        {spec.sections.map((sec, idx) => {
          const hidden = sec.toggle ? data[sec.toggle] === false : false;
          return (
            <details key={sec.title} className="a-card pe-sec" open={!hidden && (idx === 0 || spec.sections.length < 4)}>
              <summary>
                <span>{sec.title}</span>
                {sec.toggle && (
                  <label className="pe-toggle" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={!hidden} onChange={(e) => set(sec.toggle!, e.target.checked)} /> {hidden ? 'Hidden' : 'Shown'}
                  </label>
                )}
              </summary>
              <div className="pe-fields">
                {sec.fields.map((f) => {
                  if (f.type === 'text') return <div className="field" key={f.key}><label htmlFor={`f-${f.key}`}>{f.label}</label><input id={`f-${f.key}`} className="input" value={String(data[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />{f.help && <span className="a-hint">{f.help}</span>}</div>;
                  if (f.type === 'textarea') return <div className="field" key={f.key}><label htmlFor={`f-${f.key}`}>{f.label}</label><textarea id={`f-${f.key}`} className="input" rows={3} value={String(data[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />{f.help && <span className="a-hint">{f.help}</span>}</div>;
                  if (f.type === 'image') return <ImageField key={f.key} label={f.label} value={String(data[f.key] ?? '')} onChange={(v) => set(f.key, v)} size={f.size} />;
                  if (f.type === 'cards' || f.type === 'faqs') {
                    const isFaq = f.type === 'faqs';
                    const items = list<{ title?: string; body?: string; q?: string; a?: string }>(f.key);
                    const upd = (i: number, k: string, v: string) => set(f.key, items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
                    const move = (i: number, d: number) => { const n = [...items]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); set(f.key, n); };
                    return (
                      <div key={f.key} className="pe-list">
                        {items.map((it, i) => (
                          <div key={i} className="pe-item">
                            <input className="input" aria-label={isFaq ? 'Question' : 'Title'} value={(isFaq ? it.q : it.title) || ''} onChange={(e) => upd(i, isFaq ? 'q' : 'title', e.target.value)} placeholder={isFaq ? 'Question' : 'Title'} />
                            <textarea className="input" aria-label={isFaq ? 'Answer' : 'Text'} rows={2} value={(isFaq ? it.a : it.body) || ''} onChange={(e) => upd(i, isFaq ? 'a' : 'body', e.target.value)} placeholder={isFaq ? 'Answer' : 'Text'} />
                            <div className="pe-item-tools">
                              <button type="button" className="a-link" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                              <button type="button" className="a-link" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                              <button type="button" className="a-link a-danger" onClick={() => set(f.key, items.filter((_, j) => j !== i))}>Remove</button>
                            </div>
                          </div>
                        ))}
                        <button type="button" className="btn btn-outline a-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set(f.key, [...items, isFaq ? { q: '', a: '' } : { title: '', body: '' }])}>+ Add {isFaq ? 'question' : (f as { item: string }).item}</button>
                      </div>
                    );
                  }
                  if (f.type === 'slides') {
                    const items = list<{ src: string; alt: string; eyebrow: string; caption: string; pos: string }>(f.key);
                    const upd = (i: number, k: string, v: string) => set(f.key, items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
                    const move = (i: number, d: number) => { const n = [...items]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); set(f.key, n); };
                    return (
                      <div key={f.key} className="pe-list">
                        {items.map((s, i) => (
                          <div key={i} className="pe-item">
                            <ImageField label={`Slide ${i + 1}`} value={s.src} size={2400} onChange={(v) => upd(i, 'src', v)} />
                            <input className="input" aria-label="Small label above the headline" value={s.eyebrow} onChange={(e) => upd(i, 'eyebrow', e.target.value)} placeholder="Small label, e.g. Portraits · Ibadan" />
                            <input className="input" aria-label="Caption" value={s.caption} onChange={(e) => upd(i, 'caption', e.target.value)} placeholder="Caption, e.g. Bridal portrait · Ibadan" />
                            <input className="input" aria-label="Describe the photo" value={s.alt} onChange={(e) => upd(i, 'alt', e.target.value)} placeholder="Describe the photo (for Google and screen readers)" />
                            <div className="pe-item-tools">
                              <button type="button" className="a-link" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                              <button type="button" className="a-link" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                              <button type="button" className="a-link a-danger" disabled={items.length === 1} onClick={() => set(f.key, items.filter((_, j) => j !== i))}>Remove</button>
                            </div>
                          </div>
                        ))}
                        <button type="button" className="btn btn-outline a-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set(f.key, [...items, { ...items[items.length - 1], caption: '', eyebrow: '' }])}>+ Add slide</button>
                      </div>
                    );
                  }
                  return null;
                })}
                {sec.fields.length === 0 && <span className="a-sub">This section updates itself.</span>}
              </div>
            </details>
          );
        })}
      </div>
      <div className="pe-preview">
        <div className="pe-bar">
          <div className="a-seg">
            <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>Desktop</button>
            <button type="button" aria-pressed={device === 'phone'} onClick={() => setDevice('phone')}>Phone</button>
          </div>
          <a className="a-link" href={spec.path} target="_blank" rel="noopener">Open page ↗</a>
        </div>
        {dirty && <div className="a-sub">You have unpublished changes. Publish to see them on the page.</div>}
        <div className={`pe-frame ${device}`}>
          <iframe key={key} src={spec.path} title={`${spec.label} page preview`} />
        </div>
      </div>
    </div>
  );
}
