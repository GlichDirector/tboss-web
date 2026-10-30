import 'server-only';
import { randomBytes } from 'node:crypto';
import { exec, q } from './db';
import { photoKey, removeKeys, viewUrl } from './storage';

export type Stage = 'draft' | 'selection' | 'finished';
export type Folder = 'unedited' | 'edited';

export type Gallery = {
  id: number;
  slug: string;
  access_key: string;
  title: string;
  client_name: string;
  client_emails: string;
  session_date: string | null;
  location: string | null;
  stage: Stage;
  cover_photo_id: number | null;
  selection_limit: number;
  extra_price: string | null;
  choose_by: string | null;
  expires_on: string | null;
  created_at: string;
};

export type Photo = {
  id: number;
  gallery_id: number;
  folder: Folder;
  filename: string;
  width: number;
  height: number;
  bytes: number;
  sort_order: number;
};

export type PhotoView = Photo & { thumb: string; web: string };

export const emailsOf = (g: Pick<Gallery, 'client_emails'>) =>
  g.client_emails.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);

function slugify(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 50) || 'gallery';
}

// ---------- galleries ----------

export async function createGallery(input: {
  title: string; client_name: string; client_emails: string; session_date?: string | null; location?: string | null;
  selection_limit?: number; extra_price?: string | null; choose_by?: string | null; expires_on?: string | null;
}) {
  const base = slugify(`${input.client_name} ${input.title}`);
  const slug = `${base}-${randomBytes(3).toString('hex')}`;
  const access_key = randomBytes(12).toString('base64url');
  const res = await exec(
    `INSERT INTO galleries (slug, access_key, title, client_name, client_emails, session_date, location, selection_limit, extra_price, choose_by, expires_on)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [slug, access_key, input.title, input.client_name, input.client_emails, input.session_date || null, input.location || null,
      input.selection_limit || 0, input.extra_price || null, input.choose_by || null, input.expires_on || null],
  );
  return res.insertId;
}

export async function updateGallery(id: number, fields: Partial<Omit<Gallery, 'id' | 'slug' | 'access_key' | 'created_at'>>) {
  const allowed = ['title', 'client_name', 'client_emails', 'session_date', 'location', 'stage', 'cover_photo_id', 'selection_limit', 'extra_price', 'choose_by', 'expires_on'] as const;
  const keys = allowed.filter((k) => k in fields);
  if (!keys.length) return;
  await exec(`UPDATE galleries SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => (fields[k] ?? null) as string | number | null), id]);
}

export async function listGalleries() {
  return q<Gallery & { unedited: number; edited: number; picks: number; downloads: number }>(
    `SELECT g.*,
      (SELECT COUNT(*) FROM photos p WHERE p.gallery_id = g.id AND p.folder = 'unedited' AND p.ready = 1) AS unedited,
      (SELECT COUNT(*) FROM photos p WHERE p.gallery_id = g.id AND p.folder = 'edited' AND p.ready = 1) AS edited,
      (SELECT COUNT(*) FROM selections s WHERE s.gallery_id = g.id) AS picks,
      (SELECT COUNT(*) FROM downloads d WHERE d.gallery_id = g.id) AS downloads
     FROM galleries g ORDER BY g.created_at DESC`,
  );
}

export async function getGallery(id: number) {
  return (await q<Gallery>('SELECT * FROM galleries WHERE id = ?', [id]))[0] || null;
}

export async function getGalleryBySlug(slug: string) {
  return (await q<Gallery>('SELECT * FROM galleries WHERE slug = ?', [slug]))[0] || null;
}

export async function galleriesForEmail(email: string) {
  const all = await q<Gallery>(`SELECT * FROM galleries WHERE stage <> 'draft' AND client_emails LIKE ? ORDER BY created_at DESC`, [`%${email.toLowerCase()}%`]);
  return all.filter((g) => emailsOf(g).includes(email.toLowerCase()));
}

export function isExpired(g: Gallery) {
  return Boolean(g.expires_on && g.expires_on < new Date().toISOString().slice(0, 10));
}

export async function deleteGallery(id: number) {
  const photos = await q<Photo>('SELECT * FROM photos WHERE gallery_id = ?', [id]);
  await removeKeys(photos.flatMap((p) => (['original', 'web', 'thumb'] as const).map((v) => photoKey(id, p.folder, p.id, v))));
  for (const t of ['photos', 'favourites', 'selections', 'downloads']) await exec(`DELETE FROM ${t} WHERE gallery_id = ?`, [id]);
  await exec('DELETE FROM galleries WHERE id = ?', [id]);
}

// ---------- photos ----------

export async function listPhotos(galleryId: number, folder: Folder): Promise<PhotoView[]> {
  const rows = await q<Photo>(
    'SELECT id, gallery_id, folder, filename, width, height, bytes, sort_order FROM photos WHERE gallery_id = ? AND folder = ? AND ready = 1 ORDER BY sort_order, filename',
    [galleryId, folder],
  );
  return Promise.all(rows.map(async (p) => ({
    ...p,
    thumb: await viewUrl(photoKey(galleryId, folder, p.id, 'thumb')),
    web: await viewUrl(photoKey(galleryId, folder, p.id, 'web')),
  })));
}

export async function coverUrl(g: Gallery) {
  let id = g.cover_photo_id;
  let folder: Folder = 'unedited';
  if (id) {
    const row = (await q<Photo>('SELECT id, folder FROM photos WHERE id = ? AND gallery_id = ? AND ready = 1', [id, g.id]))[0];
    if (row) folder = row.folder; else id = null;
  }
  if (!id) {
    const first = (await q<Photo>(`SELECT id, folder FROM photos WHERE gallery_id = ? AND ready = 1 ORDER BY folder = 'edited' DESC, sort_order, filename LIMIT 1`, [g.id]))[0];
    if (!first) return null;
    id = first.id; folder = first.folder;
  }
  return viewUrl(photoKey(g.id, folder, id, 'web'));
}

export async function existingNames(galleryId: number, folder: Folder) {
  const rows = await q<{ filename: string }>('SELECT filename FROM photos WHERE gallery_id = ? AND folder = ? AND ready = 1', [galleryId, folder]);
  return rows.map((r) => r.filename);
}

// Creates (or, when replacing, reuses) the photo record before its files are uploaded.
export async function preparePhoto(galleryId: number, folder: Folder, filename: string) {
  const existing = (await q<{ id: number }>('SELECT id FROM photos WHERE gallery_id = ? AND folder = ? AND filename = ?', [galleryId, folder, filename]))[0];
  if (existing) {
    await exec('UPDATE photos SET ready = 0 WHERE id = ?', [existing.id]);
    return existing.id;
  }
  const max = (await q<{ m: number | null }>('SELECT MAX(sort_order) AS m FROM photos WHERE gallery_id = ? AND folder = ?', [galleryId, folder]))[0]?.m ?? 0;
  const res = await exec(
    'INSERT INTO photos (gallery_id, folder, filename, storage_key, sort_order) VALUES (?,?,?,?,?)',
    [galleryId, folder, filename, '', (max || 0) + 1],
  );
  await exec('UPDATE photos SET storage_key = ? WHERE id = ?', [`galleries/${galleryId}/${folder}/${res.insertId}`, res.insertId]);
  return res.insertId;
}

export async function markReady(photoId: number, galleryId: number, width: number, height: number, bytes: number) {
  await exec('UPDATE photos SET ready = 1, width = ?, height = ?, bytes = ? WHERE id = ? AND gallery_id = ?', [width, height, bytes, photoId, galleryId]);
}

export async function getPhoto(photoId: number) {
  return (await q<Photo & { ready: number }>('SELECT * FROM photos WHERE id = ?', [photoId]))[0] || null;
}

export async function deletePhoto(galleryId: number, photoId: number) {
  const p = (await q<Photo>('SELECT * FROM photos WHERE id = ? AND gallery_id = ?', [photoId, galleryId]))[0];
  if (!p) return;
  await removeKeys((['original', 'web', 'thumb'] as const).map((v) => photoKey(galleryId, p.folder, p.id, v)));
  await exec('DELETE FROM photos WHERE id = ?', [photoId]);
  await exec('DELETE FROM favourites WHERE photo_id = ?', [photoId]);
  await exec('UPDATE galleries SET cover_photo_id = NULL WHERE id = ? AND cover_photo_id = ?', [galleryId, photoId]);
}

// ---------- favourites, selections, downloads ----------

export async function favouriteIds(galleryId: number, email: string) {
  const rows = await q<{ photo_id: number }>('SELECT photo_id FROM favourites WHERE gallery_id = ? AND email = ?', [galleryId, email.toLowerCase()]);
  return rows.map((r) => r.photo_id);
}

export async function toggleFavourite(galleryId: number, photoId: number, email: string) {
  const e = email.toLowerCase();
  const res = await exec('DELETE FROM favourites WHERE photo_id = ? AND email = ?', [photoId, e]);
  if (res.affectedRows === 0) await exec('INSERT INTO favourites (gallery_id, photo_id, email) VALUES (?,?,?)', [galleryId, photoId, e]);
  return res.affectedRows === 0;
}

export async function submitSelection(galleryId: number, email: string, photoIds: number[]) {
  await exec('INSERT INTO selections (gallery_id, email, photo_ids) VALUES (?,?,?)', [galleryId, email.toLowerCase(), photoIds.join(',')]);
}

export async function latestSelection(galleryId: number, email: string) {
  return (await q<{ submitted_at: string; photo_ids: string }>('SELECT submitted_at, photo_ids FROM selections WHERE gallery_id = ? AND email = ? ORDER BY id DESC LIMIT 1', [galleryId, email.toLowerCase()]))[0] || null;
}

export async function selectionsReport(galleryId: number) {
  const rows = await q<{ id: number; email: string; photo_ids: string; submitted_at: string }>('SELECT * FROM selections WHERE gallery_id = ? ORDER BY id DESC', [galleryId]);
  const names = new Map((await q<{ id: number; filename: string }>('SELECT id, filename FROM photos WHERE gallery_id = ?', [galleryId])).map((r) => [r.id, r.filename]));
  const seen = new Set<string>();
  return rows
    .filter((r) => (seen.has(r.email) ? false : (seen.add(r.email), true))) // latest per person
    .map((r) => ({ email: r.email, submitted_at: r.submitted_at, files: r.photo_ids.split(',').filter(Boolean).map((id) => names.get(Number(id)) || `(deleted photo ${id})`) }));
}

export async function logDownload(galleryId: number, photoId: number, email: string) {
  await exec('INSERT INTO downloads (gallery_id, photo_id, email) VALUES (?,?,?)', [galleryId, photoId, email.toLowerCase()]);
}

export async function downloadsReport(galleryId: number) {
  const byPerson = await q<{ email: string; total: number; photos: number; last: string }>(
    'SELECT email, COUNT(*) AS total, COUNT(DISTINCT photo_id) AS photos, MAX(created_at) AS last FROM downloads WHERE gallery_id = ? GROUP BY email ORDER BY total DESC',
    [galleryId],
  );
  const byPhoto = await q<{ filename: string; total: number; people: number }>(
    `SELECT p.filename, COUNT(*) AS total, COUNT(DISTINCT d.email) AS people FROM downloads d JOIN photos p ON p.id = d.photo_id
     WHERE d.gallery_id = ? GROUP BY d.photo_id, p.filename ORDER BY total DESC, p.filename`,
    [galleryId],
  );
  const detail = await q<{ email: string; filename: string; times: number }>(
    `SELECT d.email, p.filename, COUNT(*) AS times FROM downloads d JOIN photos p ON p.id = d.photo_id
     WHERE d.gallery_id = ? GROUP BY d.email, p.filename ORDER BY d.email, p.filename`,
    [galleryId],
  );
  return { byPerson, byPhoto, detail };
}

export async function favouriteCounts(galleryId: number) {
  const rows = await q<{ photo_id: number; n: number }>('SELECT photo_id, COUNT(*) AS n FROM favourites WHERE gallery_id = ? GROUP BY photo_id', [galleryId]);
  return Object.fromEntries(rows.map((r) => [r.photo_id, Number(r.n)])) as Record<number, number>;
}
