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
