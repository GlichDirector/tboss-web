'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { setSetting } from '@/lib/studio';
import { getContent, type SiteContent } from '@/lib/siteContent';
import { uploadUrl } from '@/lib/storage';
import { assertArea } from '@/lib/team';

export async function siteImageUploadAction(folder: 'site' | 'journal') {
  await assertArea('website');
  const key = `${folder}/${Date.now()}-${randomBytes(4).toString('hex')}.jpg`;
  return { url: await uploadUrl(key), publicUrl: `/media/${key}` };
}

export async function savePageAction(page: keyof SiteContent, data: unknown) {
  await assertArea('website');
  const all = await getContent();
  const next = { ...all, [page]: { ...all[page], ...(data as object) } };
  await setSetting('site', next);
  revalidatePath('/', 'layout');
  return { ok: true };
}
