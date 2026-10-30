import { siteImageUploadAction } from '@/app/admin/website-actions';
import { makeVariants, putTyped, WEB_WIDTHS } from './imageTools';

// Resizes a photo into the four website sizes and uploads them. Returns the address to save.
export async function uploadSiteImage(file: File, folder: 'site' | 'journal') {
  const m = await makeVariants(file);
  const { urls, publicUrl } = await siteImageUploadAction(folder, m.ext as 'webp' | 'jpg');
  await Promise.all(WEB_WIDTHS.map((w) => putTyped(urls[w], m.blobs[w], m.type)));
  return publicUrl;
}
