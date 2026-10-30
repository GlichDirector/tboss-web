import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { getUser, isAdminEmail, type User } from './auth';
import { emailsOf, getGalleryBySlug, isExpired, type Gallery } from './galleries';

export type Access = { gallery: Gallery; user: User | null; admin: boolean };

function keyMatches(given: string | null | undefined, real: string) {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Who may open a gallery: anyone with the private link, the client emails on the gallery, or the studio.
export async function galleryAccess(slug: string, key: string | null | undefined): Promise<Access | null> {
  const gallery = await getGalleryBySlug(slug);
  if (!gallery) return null;
  const user = await getUser();
  const admin = isAdminEmail(user?.email);
  if (admin) return { gallery, user, admin };
  if (gallery.stage === 'draft' || isExpired(gallery)) return null;
  const listed = Boolean(user && emailsOf(gallery).includes(user.email.toLowerCase()));
  if (listed || keyMatches(key, gallery.access_key)) return { gallery, user, admin };
  return null;
}
