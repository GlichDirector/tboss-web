import 'server-only';
import { dbConfigured, exec, q } from './db';
import { getStories as sampleStories, photos as defaultPhotos, type Block, type Collection, type Photo, type Story } from './content';

// ---------------- stories ----------------

export type StoryRow = {
  id: number; slug: string; status: 'draft' | 'published'; source: 'manual' | 'ai'; title: string; category: string;
  excerpt: string | null; lead: string | null; body: string; cover_key: string | null; cover_alt: string | null;
  location: string | null; session_type: string | null; styling: string | null; keywords: string | null;
  instagram_id: string | null; instagram_url: string | null; published_at: string | null; created_at: string; updated_at: string;
};

export const CATEGORIES = ['Portraits', 'Families', 'Events', 'Heritage', 'Guides & tips'] as const;
export const mediaSrc = (key: string | null) => (!key ? '/photos/lace-pearl.jpg' : key.startsWith('/') ? key : `/media/${key}`);

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

export async function publishedStories(): Promise<Story[]> {
  if (dbConfigured()) {
    try {
      const rows = await q<StoryRow>("SELECT * FROM stories WHERE status = 'published' ORDER BY published_at DESC, id DESC");
      if (rows.length) return rows.map(toStory);
    } catch { /* fall back */ }
  }
  return sampleStories();
}

export async function publishedStory(slug: string, preview = false): Promise<Story | null> {
  if (dbConfigured()) {
    try {
      const row = (await q<StoryRow>(`SELECT * FROM stories WHERE slug = ?${preview ? '' : " AND status = 'published'"}`, [slug]))[0];
      if (row) return toStory(row);
    } catch { /* fall back */ }
  }
  return sampleStories().find((s) => s.slug === slug) || null;
}

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

// ---------------- Instagram posts (Work page) ----------------

export type PostRow = { id: string; caption: string | null; permalink: string | null; media_type: string | null; posted_at: string | null; image_key: string | null; width: number; height: number; tag: Collection; hidden: number; story_id: number | null };

export const listPosts = () => q<PostRow>('SELECT * FROM instagram_posts ORDER BY posted_at DESC LIMIT 300');
export const getPost = async (id: string) => (await q<PostRow>('SELECT * FROM instagram_posts WHERE id = ?', [id]))[0] || null;
export const setPostFields = (id: string, f: { tag?: string; hidden?: boolean; story_id?: number | null }) => {
  const sets: string[] = []; const vals: (string | number | null)[] = [];
  if (f.tag) { sets.push('tag = ?'); vals.push(f.tag); }
  if (f.hidden !== undefined) { sets.push('hidden = ?'); vals.push(f.hidden ? 1 : 0); }
  if (f.story_id !== undefined) { sets.push('story_id = ?'); vals.push(f.story_id); }
  return sets.length ? exec(`UPDATE instagram_posts SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]) : Promise.resolve();
};

// Photos for the Work page and the home page grid: Instagram once connected, the studio's starter photos until then.
export async function workPhotos(): Promise<(Photo & { link?: string })[]> {
  if (dbConfigured()) {
    try {
      const rows = await q<PostRow & { slug: string | null }>(
        `SELECT p.*, s.slug FROM instagram_posts p LEFT JOIN stories s ON s.id = p.story_id AND s.status = 'published'
         WHERE p.hidden = 0 AND p.image_key IS NOT NULL ORDER BY p.posted_at DESC LIMIT 120`);
      if (rows.length) {
        return rows.map((r) => ({
          src: mediaSrc(r.image_key), alt: (r.caption || 'Photo by Tboss Photography').split('\n')[0].slice(0, 140), tag: r.tag,
          width: r.width || 1080, height: r.height || 1350, link: r.slug ? `/journal/${r.slug}` : undefined,
        }));
      }
    } catch { /* fall back */ }
  }
  return defaultPhotos;
}
