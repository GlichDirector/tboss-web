'use server';

import { galleryAccess } from '@/lib/access';
import { extraTotal, favouriteIds, getPhoto, splitPicks, submitSelection, toggleFavourite } from '@/lib/galleries';
import { notifyStudio } from '@/lib/mail';

type Result = { ok: boolean; error?: string; needsSignIn?: boolean; favs?: number[] };

export async function toggleFav(slug: string, key: string, photoId: number): Promise<Result> {
  const a = await galleryAccess(slug, key);
  if (!a) return { ok: false, error: 'This gallery link is no longer valid.' };
  if (!a.user) return { ok: false, needsSignIn: true };
  const photo = await getPhoto(photoId);
  if (!photo || photo.gallery_id !== a.gallery.id) return { ok: false, error: 'Photo not found.' };
  await toggleFavourite(a.gallery.id, photoId, a.user.email);
  return { ok: true, favs: await favouriteIds(a.gallery.id, a.user.email) };
}

export async function sendSelection(slug: string, key: string): Promise<Result> {
  const a = await galleryAccess(slug, key);
  if (!a) return { ok: false, error: 'This gallery link is no longer valid.' };
  if (!a.user) return { ok: false, needsSignIn: true };
  if (a.gallery.stage !== 'selection') return { ok: false, error: 'Selection is closed for this gallery.' };
  const favs = await favouriteIds(a.gallery.id, a.user.email);
  const ids: number[] = [];
  for (const id of favs) {
    const p = await getPhoto(id);
    if (p && p.folder === 'unedited') ids.push(id);
  }
  if (!ids.length) return { ok: false, error: 'Tap the heart on the photos you want edited, then send your selection.' };
  await submitSelection(a.gallery.id, a.user.email, ids);
  const { pkg, extra } = splitPicks(ids, a.gallery.selection_limit);
  const fee = extraTotal(a.gallery.extra_price, extra.length);
  await notifyStudio(
    `${a.gallery.client_name} sent ${ids.length} picks${extra.length ? ` (${extra.length} extra)` : ''}`,
    `<p>${a.user.email} sent a selection of ${ids.length} photos for <strong>${a.gallery.title}</strong>: ${pkg.length} in the package${extra.length ? ` and <strong>${extra.length} extra</strong>${fee ? ` (${fee} to add to the invoice)` : ''}` : ''}.</p><p>Open the gallery’s Selections tab in the studio admin to copy the file names.</p>`,
  );
  return { ok: true };
}
