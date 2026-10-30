'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { aiConfigured, draftArticle } from '@/lib/ai';
import type { Block } from '@/lib/content';
import { WIDTHS } from '@/lib/images';
import { pingSearchEngines } from '@/lib/indexnow';
import { addWorkPhoto, deleteWorkPhoto, setStoryMedia, setWorkPhoto, workPhotoRow } from '@/lib/journal';
import { removeKeys, uploadUrl } from '@/lib/storage';
import { assertArea } from '@/lib/team';

const CATS = ['Portraits', 'Events', 'Heritage'];
const BASE = /^work\/[a-z0-9-]{6,40}$/;
const catSlug = (c: string) => `/work/${c.toLowerCase()}`;

// Step 1: signed upload links for each photo's four sizes.
export async function workUploadUrlsAction(count: number, ext: 'webp' | 'jpg') {
  await assertArea('website');
  const n = Math.max(1, Math.min(12, Math.floor(count)));
  const type = ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const stamp = Date.now().toString(36);
  return Promise.all(Array.from({ length: n }, async () => {
    const base = `work/${stamp}-${randomBytes(4).toString('hex')}`;
    const urls: Record<number, string> = {};
    for (const w of WIDTHS) urls[w] = await uploadUrl(`${base}/w${w}.${ext}`, type);
    return { base, urls };
  }));
}

export type PostedPhoto = { base: string; ext: 'webp' | 'jpg'; width: number; height: number; blur: string; inWork: boolean };

// Step 2: save the post. With an article, the AI writes a draft story and the photos wait
// (hidden) until that story is published. Without one, the photos go live on Work at once.
export async function publishWorkAction(input: { category: string; note: string; article: boolean; photos: PostedPhoto[] }) {
  await assertArea('website');
  const category = CATS.includes(input.category) ? input.category : 'Portraits';
  const photos = input.photos.slice(0, 12).filter((p) => BASE.test(p.base) && (p.ext === 'webp' || p.ext === 'jpg'))
    .map((p) => ({ ...p, inWork: p.inWork !== false, width: Math.round(p.width) || 1600, height: Math.round(p.height) || 2000, blur: /^data:image\/jpeg;base64,[A-Za-z0-9+/=]{0,4000}$/.test(p.blur) ? p.blur : '' }));
  if (!photos.length) return { error: 'Add at least one photo.' };
  const note = input.note.trim().slice(0, 1500);

  if (!input.article) {
    const chosen = photos.filter((p) => p.inWork);
    if (!chosen.length) return { error: 'Tick “On Work page” on at least one photo.' };
    for (const p of chosen) await addWorkPhoto({ category, media_base: p.base, ext: p.ext, width: p.width, height: p.height, alt: note ? note.slice(0, 280) : null, blur: p.blur || null, story_id: null, hidden: false });
    revalidatePath('/', 'layout');
    await pingSearchEngines(['/work', catSlug(category)]);
    return { ok: `${chosen.length} photo${chosen.length === 1 ? ' is' : 's are'} now on the Work page under ${category}.` };
  }

  if (!aiConfigured()) return { error: 'AI isn’t connected yet. Add ANTHROPIC_API_KEY in Hostinger, or untick “Write a Journal article”.' };
  let drafted: Awaited<ReturnType<typeof draftArticle>>;
  try {
    drafted = await draftArticle(note, category, photos.map((p) => ({ key: `${p.base}/w1080.${p.ext}`, type: p.ext === 'webp' ? 'image/webp' : 'image/jpeg' })));
  } catch (e) {
    // Keep the photos so nothing is lost; they can be shown from the Work list.
    for (const p of photos) await addWorkPhoto({ category, media_base: p.base, ext: p.ext, width: p.width, height: p.height, alt: null, blur: p.blur || null, story_id: null, hidden: true });
    revalidatePath('/admin/work');
    return { error: `${e instanceof Error ? e.message : 'The AI article failed.'} Your photos are saved (hidden) below.` };
  }

  const alts = photos.map((_, i) => (drafted.alts[i] || drafted.alts[0] || `${category} photograph by Tboss Photography, Ibadan`).slice(0, 280));
  for (const [i, p] of photos.entries()) {
    await addWorkPhoto({ category, media_base: p.base, ext: p.ext, width: p.width, height: p.height, alt: alts[i], blur: p.blur || null, story_id: drafted.storyId, hidden: true, in_work: p.inWork });
  }
  // Place the remaining photos through the article, one after every two paragraphs.
  const src = (p: PostedPhoto) => `/media/${p.base}/w1600.${p.ext}`;
  const rest: Block[] = photos.slice(1).map((p, i) => ({ type: 'image', src: src(p), alt: alts[i + 1] }));
  const body: Block[] = [];
  drafted.body.forEach((b, i) => { body.push(b as Block); if (i % 2 === 1 && rest.length) body.push(rest.shift()!); });
  body.push(...rest);
  await setStoryMedia(drafted.storyId, { cover_key: `${photos[0].base}/w1600.${photos[0].ext}`, cover_alt: alts[0], body: JSON.stringify(body) });
  revalidatePath('/admin/work');
  revalidatePath('/admin/journal');
  return { ok: 'Article drafted.', storyId: drafted.storyId };
}

export async function workPhotoAction(id: number, f: { category?: string; hidden?: boolean; alt?: string; in_work?: boolean }) {
  await assertArea('website');
  if (f.category && !CATS.includes(f.category)) return;
  await setWorkPhoto(id, f);
  revalidatePath('/', 'layout');
}

export async function deleteWorkPhotoAction(id: number) {
  await assertArea('website');
  const p = await workPhotoRow(id);
  if (!p) return;
  await deleteWorkPhoto(id);
  try { await removeKeys(WIDTHS.map((w) => `${p.media_base}/w${w}.${p.ext}`)); } catch { /* file clean-up can fail quietly */ }
  revalidatePath('/', 'layout');
}
