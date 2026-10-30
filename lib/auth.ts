import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export type User = { email: string; name: string; picture?: string };

const COOKIE = 'tb_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET missing or shorter than 32 characters.');
  return new TextEncoder().encode(s);
}

export async function setSession(user: User) {
  const token = await new SignJWT({ name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.email.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { email: String(payload.sub), name: String(payload.name || payload.sub), picture: payload.picture ? String(payload.picture) : undefined };
  } catch {
    return null;
  }
}

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function getAdmin(): Promise<User | null> {
  const u = await getUser();
  return u && isAdminEmail(u.email) ? u : null;
}

// Only allow redirects back into this site.
export function safeNext(next: string | null | undefined, fallback = '/') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

export const siteOrigin = () => (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
