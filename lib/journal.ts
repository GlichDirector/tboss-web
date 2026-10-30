import 'server-only';
import { cache } from 'react';
import { dbConfigured, exec, q } from './db';
import { getStories as sampleStories, photos as defaultPhotos, type Block, type Collection, type Photo, type Story } from './content';
import { mediaUrl } from './images';

// ---------------- stories ----------------

export type StoryRow = {
  id: number; slug: string; status: 'draft' | 'published'; source: 'manual' | 'ai'; title: string; category: string;
  excerpt: string | null; lead: string | null; body: string; cover_key: string | null; cover_alt: string | null;
  location: string | null; session_type: string | null; styling: string | null; keywords: string | null;
  instagram_id: string | null; instagram_url: string | null; published_at: string | null; created_at: string; updated_at: string;
};

export const CATEGORIES = ['Portraits', 'Events', 'Heritage', 'Guides & tips'] as const;
export const mediaSrc = (key: string | null) => (!key ? '/photos/lace-pearl/w1600.webp' : key.startsWith('/') ? key : `/media/${key}`);

export function slugify(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 90) || 'story';
}

function toStory(r: StoryRow): Story {
  let body: Block[] = [];
  try { body = JSON.parse(r.body); } catch { body = []; }
  return {
    slug: r.slug, title: r.title, category: (CATEGORIES as readonly string[]).includes(r.category) ? (r.category as Story['category']) : 'Portraits',
    excerpt: r.excerpt || '', cover: { src: mediaSrc(r.cover_key), alt: r.cover_alt || r.title }, date: (r.published_at || r.created_at).slice(0, 10),
    location: r.location || 'Ibadan', session: r.session_type || undefined, styling: r.styling || undefined, instagramUrl: r.instagram_url || undefined,
    keywords: (r.keywords || '').split(',').map((k) => k.trim()).filter(Boolean), lead: r.lead || '', body,
  };
}

export const publishedStories = cache(async (): Promise<Story[]> => {
  if (dbConfigured()) {
    try {
      const rows = await q<StoryRow>("SELECT * FROM stories WHERE status = 'published' ORDER BY published_at DESC, id DESC");
      if (rows.length) return rows.map(toStory);
    } catch { /* fall back */ }
  }
  return sampleStories();
});

export const publishedStory = cache(async (slug: string, preview = false): Promise<Story | null> => {
  if (dbConfigured()) {
    try {
      const row = (await q<StoryRow>(`SELECT * FROM stories WHERE slug = ?${preview ? '' : " AND status = 'published'"}`, [slug]))[0];
      if (row) return toStory(row);
    } catch { /* fall back */ }
  }
  return sampleStories().find((s) => s.slug === slug) || null;
});

export const listStoryRows = () => q<StoryRow>('SELECT * FROM stories ORDER BY status = \'draft\' DESC, COALESCE(published_at, created_at) DESC, id DESC');
export const storyRow = async (id: number) => (await q<StoryRow>('SELECT * FROM stories WHERE id = ?', [id]))[0] || null;

async function uniqueSlug(base: string, exceptId?: number) {
  let slug = slugify(base); let n = 1;
  while ((await q<{ id: number }>('SELECT id FROM stories WHERE slug = ? AND id <> ?', [slug, exceptId || 0])).length) slug = `${slugify(base)}-${++n}`;
  return slug;
}

export type StoryInput = Partial<Omit<StoryRow, 'id' | 'created_at' | 'updated_at' | 'slug'>> & { slug?: string; title: string };

export async function createStory(s: StoryInput) {
  const slug = await uniqueSlug(s.slug || s.title);
  const res = await exec(
    `INSERT INTO stories (slug, status, source, title, category, excerpt, lead, body, cover_key, cover_alt, location, session_type, styling, keywords, instagram_id, instagram_url)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slug, 'draft', s.source || 'manual', s.title, s.category || 'Portraits', s.excerpt || null, s.lead || null, s.body || '[]', s.cover_key || null, s.cover_alt || null,
      s.location || null, s.session_type || null, s.styling || null, s.keywords || null, s.instagram_id || null, s.instagram_url || null],
  );
  return res.insertId;
}

export async function updateStory(id: number, s: StoryInput) {
  const slug = await uniqueSlug(s.slug || s.title, id);
  await exec(
    `UPDATE stories SET slug=?, title=?, category=?, excerpt=?, lead=?, body=?, cover_key=?, cover_alt=?, location=?, session_type=?, styling=?, keywords=? WHERE id = ?`,
    [slug, s.title, s.category || 'Portraits', s.excerpt || null, s.lead || null, s.body || '[]', s.cover_key || null, s.cover_alt || null,
      s.location || null, s.session_type || null, s.styling || null, s.keywords || null, id],
  );
  return slug;
}

export const setStoryStatus = (id: number, status: 'draft' | 'published') =>
  exec(`UPDATE stories SET status = ?, published_at = ${status === 'published' ? 'COALESCE(published_at, CURDATE())' : 'published_at'} WHERE id = ?`, [status, id]);
export const deleteStory = (id: number) => exec('DELETE FROM stories WHERE id = ?', [id]);

// ---------------- Work photos (posted from the admin) ----------------

export type WorkPhoto = { id: number; story_id: number | null; category: Collection; media_base: string; ext: string; width: number; height: number; alt: string | null; blur: string | null; hidden: number; in_work: number; created_at: string };
export type WorkItem = Photo & { link?: string; blur?: string | null; id?: number };

export const workSrc = (p: Pick<WorkPhoto, 'media_base' | 'ext'>, w = 1600) => mediaUrl(p.media_base, p.ext, w);

export async function addWorkPhoto(p: { category: string; media_base: string; ext: string; width: number; height: number; alt: string | null; blur: string | null; story_id: number | null; hidden: boolean; in_work?: boolean }) {
  const res = await exec('INSERT INTO work_photos (category, media_base, ext, width, height, alt, blur, story_id, hidden, in_work) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [p.category, p.media_base, p.ext, p.width, p.height, p.alt, p.blur, p.story_id, p.hidden ? 1 : 0, p.in_work === false ? 0 : 1]);
  return res.insertId;
}
export const listWorkPhotos = () => q<WorkPhoto & { title: string | null; status: string | null }>(
  'SELECT w.*, s.title, s.status FROM work_photos w LEFT JOIN stories s ON s.id = w.story_id ORDER BY w.created_at DESC, w.id DESC LIMIT 500');
export const photosForStory = (storyId: number) => q<WorkPhoto>('SELECT * FROM work_photos WHERE story_id = ? ORDER BY sort_order, id', [storyId]);
export const setWorkPhoto = (id: number, f: { category?: string; hidden?: boolean; alt?: string; in_work?: boolean }) => {
  const sets: string[] = []; const vals: (string | number)[] = [];
  if (f.category) { sets.push('category = ?'); vals.push(f.category); }
  if (f.hidden !== undefined) { sets.push('hidden = ?'); vals.push(f.hidden ? 1 : 0); }
  if (f.in_work !== undefined) { sets.push('in_work = ?'); vals.push(f.in_work ? 1 : 0); }
  if (f.alt !== undefined) { sets.push('alt = ?'); vals.push(f.alt.slice(0, 300)); }
  return sets.length ? exec(`UPDATE work_photos SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]) : Promise.resolve();
};
export const deleteWorkPhoto = (id: number) => exec('DELETE FROM work_photos WHERE id = ?', [id]);
// Photos written into a story stay hidden until the story is published.
export const showStoryPhotos = (storyId: number, show: boolean) => exec('UPDATE work_photos SET hidden = ? WHERE story_id = ?', [show ? 0 : 1, storyId]);

// Photos for the Work page and the home page grid. Starter photos show until the first posts are made.
export const workPhotos = cache(async (category?: Collection | null): Promise<WorkItem[]> => {
  if (dbConfigured()) {
    try {
      const rows = await q<WorkPhoto & { slug: string | null }>(
        `SELECT w.*, s.slug FROM work_photos w LEFT JOIN stories s ON s.id = w.story_id AND s.status = 'published'
         WHERE w.hidden = 0 AND w.in_work = 1 ORDER BY w.created_at DESC, w.sort_order, w.id LIMIT 300`);
      if (rows.length) {
        return rows
          .filter((r) => !category || r.category === category)
          .map((r) => ({ id: r.id, src: workSrc(r), alt: r.alt || 'Photograph by Tboss Photography, Ibadan', tag: r.category, width: r.width, height: r.height, blur: r.blur, link: r.slug ? `/journal/${r.slug}` : undefined }));
      }
    } catch { /* fall back */ }
  }
  return defaultPhotos.filter((p) => !category || p.tag === category);
});

export async function lastWorkUpdate(): Promise<string | null> {
  if (!dbConfigured()) return null;
  try { return (await q<{ d: string | null }>('SELECT MAX(created_at) AS d FROM work_photos WHERE hidden = 0 AND in_work = 1'))[0]?.d || null; } catch { return null; }
}

export const setStoryMedia = (id: number, f: { cover_key: string; cover_alt: string; body: string }) =>
  exec('UPDATE stories SET cover_key = ?, cover_alt = ?, body = ? WHERE id = ?', [f.cover_key, f.cover_alt, f.body, id]);
export const workPhotoRow = async (id: number) => (await q<WorkPhoto>('SELECT * FROM work_photos WHERE id = ?', [id]))[0] || null;
