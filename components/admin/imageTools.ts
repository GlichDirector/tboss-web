// Shrinks a photo in the browser before upload (keeps the website fast on phones).
export async function resizeImage(file: File, maxSide: number, quality = 0.86) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('resize failed'))), 'image/jpeg', quality));
  return { blob, width: w, height: h };
}

export async function putBlob(url: string, blob: Blob) {
  const r = await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
  if (!r.ok) throw new Error(`upload failed (${r.status})`);
}

// Website photos: four sizes (640/1080/1600/2400 px wide) in WebP, plus a tiny blurred
// placeholder that shows while the real photo loads. Falls back to JPEG on old browsers.
export const WEB_WIDTHS = [640, 1080, 1600, 2400] as const;

export async function makeVariants(file: File) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const draw = (maxW: number) => {
    const scale = Math.min(1, maxW / bmp.width);
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  };
  const toBlob = (type: string, q: number) => new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Couldn’t process this photo'))), type, q));
  draw(32);
  const test = await toBlob('image/webp', 0.5);
  const webp = test.type === 'image/webp';
  const type = webp ? 'image/webp' : 'image/jpeg';
  const blur = canvas.toDataURL('image/jpeg', 0.5);
  const blobs: Record<number, Blob> = {};
  for (const w of WEB_WIDTHS) { draw(w); blobs[w] = await toBlob(type, w <= 1080 ? 0.82 : 0.86); }
  const out = { ext: webp ? 'webp' : 'jpg', type, width: bmp.width, height: bmp.height, blur, blobs };
  bmp.close();
  return out;
}

export async function putTyped(url: string, blob: Blob, type: string) {
  const r = await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': type } });
  if (!r.ok) throw new Error(`upload failed (${r.status})`);
}
