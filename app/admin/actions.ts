'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdmin, siteOrigin } from '@/lib/auth';
import {
  createGallery, deleteGallery, deletePhoto, emailsOf, existingNames, getGallery, getPhoto, markReady, preparePhoto, updateGallery,
  type Folder, type Stage,
} from '@/lib/galleries';
import { brandedEmail, esc, sendMail } from '@/lib/mail';
import { photoKey, uploadUrl } from '@/lib/storage';
import { formatDate } from '@/lib/content';

async function admin() {
  const a = await getAdmin();
  if (!a) throw new Error('Please sign in to the studio admin again.');
  return a;
}

const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? '').trim().slice(0, max);
const dateOrNull = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function galleryFields(f: FormData) {
  return {
    title: str(f, 'title', 200),
    client_name: str(f, 'client_name', 160),
    client_emails: str(f, 'client_emails', 1000).toLowerCase(),
    session_date: dateOrNull(str(f, 'session_date')),
    location: str(f, 'location', 200) || null,
    selection_limit: Math.max(0, Number(str(f, 'selection_limit')) || 0),
    extra_price: str(f, 'extra_price', 40) || null,
    choose_by: dateOrNull(str(f, 'choose_by')),
    expires_on: dateOrNull(str(f, 'expires_on')),
  };
}

export type FormResult = { error?: string; ok?: boolean };

export async function createGalleryAction(_p: FormResult, f: FormData): Promise<FormResult> {
  await admin();
  const v = galleryFields(f);
  if (!v.client_name || !v.title) return { error: 'Add the client’s name and a session title.' };
  if (!emailsOf(v).length) return { error: 'Add at least one client email. This is who can sign in to the gallery.' };
  const id = await createGallery(v);
  redirect(`/admin/galleries/${id}?tab=unedited&new=1`);
}

export async function updateGalleryAction(id: number, _p: FormResult, f: FormData): Promise<FormResult> {
  await admin();
  const v = galleryFields(f);
  if (!v.client_name || !v.title) return { error: 'Add the client’s name and a session title.' };
  await updateGallery(id, v);
  revalidatePath(`/admin/galleries/${id}`);
  return { ok: true };
}

export async function deleteGalleryAction(id: number) {
  await admin();
  await deleteGallery(id);
  redirect('/admin/galleries');
}

export async function setCoverAction(galleryId: number, photoId: number) {
  await admin();
  await updateGallery(galleryId, { cover_photo_id: photoId });
  revalidatePath(`/admin/galleries/${galleryId}`);
}

export async function deletePhotoAction(galleryId: number, photoId: number) {
  await admin();
  await deletePhoto(galleryId, photoId);
  revalidatePath(`/admin/galleries/${galleryId}`);
}

// Moves the gallery to a new stage and, if asked, emails the client.
export async function setStageAction(galleryId: number, stage: Stage, notify: boolean) {
  await admin();
  const g = await getGallery(galleryId);
  if (!g) return { error: 'Gallery not found.' };
  await updateGallery(galleryId, { stage });
  let sent = 0;
  if (notify && stage !== 'draft') {
    const link = `${siteOrigin()}/g/${g.slug}?k=${g.access_key}`;
    const first = esc(g.client_name.split(' ')[0]);
    const html = stage === 'selection'
      ? brandedEmail({
          heading: 'Pick your favourites',
          intro: `Hi ${first}, your unedited photos are ready. Choose the ones you’d like us to edit and we’ll get started.`,
          rows: [
            ...(g.selection_limit ? [['Included in your package', `${g.selection_limit} edited photos`] as [string, string]] : []),
            ...(g.extra_price ? [['Each extra photo', g.extra_price] as [string, string]] : []),
            ...(g.choose_by ? [['Please choose by', formatDate(g.choose_by)] as [string, string]] : []),
          ],
          cta: { label: 'Choose your photos', url: link },
          note: 'Tap the heart on the photos you love, then press “Send selection”. Sign in with Google to save your picks.',
        })
      : brandedEmail({
          heading: 'Your gallery is ready',
          intro: `Hi ${first}, your edited photos are ready to view, favourite and download.`,
          rows: g.expires_on ? [['Available until', formatDate(g.expires_on)]] : [],
          cta: { label: 'View your gallery', url: link },
          note: 'No sign-in needed to view. Sign in with Google to save favourites or download.',
        });
    const subject = stage === 'selection' ? 'Your photos are ready to choose from' : 'Your photos are here';
    for (const to of emailsOf(g)) if (await sendMail(to, subject, html)) sent++;
  }
  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath('/admin/galleries');
  return { ok: true, sent };
}

// ----- uploads -----

export async function checkNamesAction(galleryId: number, folder: Folder, names: string[]) {
  await admin();
  const have = new Set(await existingNames(galleryId, folder));
  return names.filter((n) => have.has(n));
}

export async function prepareUploadAction(galleryId: number, folder: Folder, filename: string, originalType: string) {
  await admin();
  const g = await getGallery(galleryId);
  if (!g) throw new Error('Gallery not found.');
  const name = filename.replace(/[\\/]/g, '_').slice(0, 250);
  const photoId = await preparePhoto(galleryId, folder, name);
  return {
    photoId,
    original: await uploadUrl(photoKey(galleryId, folder, photoId, 'original'), originalType || 'image/jpeg'),
    web: await uploadUrl(photoKey(galleryId, folder, photoId, 'web')),
    thumb: await uploadUrl(photoKey(galleryId, folder, photoId, 'thumb')),
  };
}

export async function confirmUploadAction(galleryId: number, photoId: number, width: number, height: number, bytes: number) {
  await admin();
  const p = await getPhoto(photoId);
  if (!p || p.gallery_id !== galleryId) throw new Error('Photo not found.');
  await markReady(photoId, galleryId, Math.round(width), Math.round(height), Math.round(bytes));
}

export async function refreshGallery(galleryId: number) {
  await admin();
  revalidatePath(`/admin/galleries/${galleryId}`);
}
