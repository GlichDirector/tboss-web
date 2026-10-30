'use server';

import { WIDTHS } from '@/lib/images';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { setSetting } from '@/lib/studio';
import { getContent, type SiteContent } from '@/lib/siteContent';
import { uploadUrl } from '@/lib/storage';
import { assertArea } from '@/lib/team';
import { pingSearchEngines } from '@/lib/indexnow';

// Signed upload links for one website photo in four widths (see lib/images.ts).
export async function siteImageUploadAction(folder: 'site' | 'journal', ext: 'webp' | 'jpg' = 'webp') {
  await assertArea('website');
  const base = `${folder}/${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  const type = ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const urls: Record<number, string> = {};
  for (const w of WIDTHS) urls[w] = await uploadUrl(`${base}/w${w}.${ext}`, type);
  return { urls, publicUrl: `/media/${base}/w1600.${ext}` };
}

export async function savePageAction(page: keyof SiteContent, data: unknown) {
  await assertArea('website');
  const all = await getContent();
  const next = { ...all, [page]: { ...all[page], ...(data as object) } };
  await setSetting('site', next);
  revalidatePath('/', 'layout');
  await pingSearchEngines([page === 'home' ? '/' : `/${page}`]);
  return { ok: true };
}
