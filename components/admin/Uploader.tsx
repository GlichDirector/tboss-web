'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { checkNamesAction, confirmUploadAction, prepareUploadAction, refreshGallery } from '@/app/admin/actions';

type Item = { file: File; status: 'waiting' | 'working' | 'done' | 'skipped' | 'failed'; note?: string };
type Dup = { name: string; replace: boolean };

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

// Makes the web-size copy and thumbnail in the browser, so phones load galleries quickly.
async function resized(file: File, maxSide: number, quality: number) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('resize failed'))), 'image/jpeg', quality));
  const dims = { width: bmp.width, height: bmp.height };
  bmp.close();
  return { blob, dims };
}

async function put(url: string, body: Blob, type: string) {
  const res = await fetch(url, { method: 'PUT', body, headers: { 'Content-Type': type } });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
}

export default function Uploader({ galleryId, folder }: { galleryId: number; folder: 'unedited' | 'edited' }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dups, setDups] = useState<Dup[] | null>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [drag, setDrag] = useState(false);

  const done = items.filter((i) => i.status === 'done').length;
  const total = items.filter((i) => i.status !== 'skipped').length;

  async function choose(list: FileList | File[]) {
    const files = Array.from(list).filter((f) => ACCEPT.includes(f.type));
    const rejected = Array.from(list).length - files.length;
    if (!files.length) { alertMsg(rejected ? 'Only JPEG, PNG or WebP photos can be uploaded.' : ''); return; }
    // Same name chosen twice in one go: keep the last one.
    const unique = Array.from(new Map(files.map((f) => [f.name, f])).values());
    const clash = await checkNamesAction(galleryId, folder, unique.map((f) => f.name));
    setPending(unique);
    if (clash.length) setDups(clash.map((name) => ({ name, replace: false })));
    else start(unique, new Set());
    if (rejected) alertMsg(`${rejected} file${rejected > 1 ? 's were' : ' was'} skipped: only JPEG, PNG or WebP photos can be uploaded.`);
  }

  const [msg, alertMsg] = useState('');

  async function start(files: File[], skip: Set<string>) {
    const list: Item[] = files.map((file) => ({ file, status: skip.has(file.name) ? 'skipped' : 'waiting' }));
    setItems(list);
    setRunning(true);
    const update = (name: string, patch: Partial<Item>) => setItems((cur) => cur.map((it) => (it.file.name === name ? { ...it, ...patch } : it)));
    const queue = list.filter((i) => i.status === 'waiting').map((i) => i.file);

    const worker = async () => {
      while (queue.length) {
        const file = queue.shift()!;
        update(file.name, { status: 'working' });
        try {
          const web = await resized(file, 2560, 0.9);
          const thumb = await resized(file, 1200, 0.85);
          const urls = await prepareUploadAction(galleryId, folder, file.name, file.type);
          await put(urls.thumb, thumb.blob, 'image/jpeg');
          await put(urls.web, web.blob, 'image/jpeg');
          await put(urls.original, file, file.type || 'image/jpeg');
          await confirmUploadAction(galleryId, urls.photoId, web.dims.width, web.dims.height, file.size);
          update(file.name, { status: 'done' });
        } catch (e) {
          update(file.name, { status: 'failed', note: e instanceof Error ? e.message : 'failed' });
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setRunning(false);
    await refreshGallery(galleryId);
    router.refresh();
  }

  const failed = items.filter((i) => i.status === 'failed');

  return (
    <div className="a-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        className={`a-drop${drag ? ' on' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!running) choose(e.dataTransfer.files); }}
      >
        <strong>Drop {folder} photos here</strong>
        <span className="a-sub">JPEG, PNG or WebP · full size is kept for downloads; web-size copies are made automatically</span>
        <button type="button" className="btn btn-dark" disabled={running} onClick={() => input.current?.click()}>Choose photos</button>
        <input ref={input} type="file" accept={ACCEPT.join(',')} multiple hidden onChange={(e) => { if (e.target.files) choose(e.target.files); e.target.value = ''; }} />
      </div>
      {msg && <div className="alert" role="alert">{msg}</div>}

      {items.length > 0 && (
        <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <strong>{running ? `Uploading ${done} of ${total}…` : `Uploaded ${done} of ${total}`}</strong>
            {items.some((i) => i.status === 'skipped') && <span className="a-sub">{items.filter((i) => i.status === 'skipped').length} skipped (already in gallery)</span>}
          </div>
          <div className="a-progress"><span style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
          {failed.length > 0 && !running && (
            <div className="alert">
              {failed.length} photo{failed.length > 1 ? 's' : ''} didn’t upload: {failed.map((f) => f.file.name).join(', ')}.{' '}
              <button type="button" className="a-link" onClick={() => start(failed.map((f) => f.file), new Set())}>Try again</button>
            </div>
          )}
        </div>
      )}

      {dups && (
        <div className="a-modal-back">
          <div className="a-modal" role="dialog" aria-modal="true" aria-labelledby="dup-h">
            <h2 id="dup-h" style={{ margin: 0, fontSize: 20 }}>{dups.length} photo{dups.length > 1 ? 's have' : ' has'} the same name as one already here</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Replace the old photo with the new one, or skip the new one. Favourites on a replaced photo are kept.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={() => setDups(dups.map((d) => ({ ...d, replace: true })))}>Replace all</button>
              <button type="button" className="btn btn-outline" onClick={() => setDups(dups.map((d) => ({ ...d, replace: false })))}>Skip all</button>
            </div>
            <ul className="a-dups">
              {dups.map((d, i) => (
                <li key={d.name}>
                  <span>{d.name}</span>
                  <span className="a-seg">
                    <button type="button" aria-pressed={d.replace} onClick={() => setDups(dups.map((x, j) => (j === i ? { ...x, replace: true } : x)))}>Replace</button>
                    <button type="button" aria-pressed={!d.replace} onClick={() => setDups(dups.map((x, j) => (j === i ? { ...x, replace: false } : x)))}>Skip</button>
                  </span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setDups(null); setPending([]); }}>Cancel</button>
              <button type="button" className="btn btn-accent" onClick={() => { const skip = new Set(dups.filter((d) => !d.replace).map((d) => d.name)); setDups(null); start(pending, skip); }}>Continue upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
