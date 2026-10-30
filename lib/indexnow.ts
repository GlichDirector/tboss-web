import 'server-only';
import { createHash } from 'node:crypto';
import { siteOrigin } from './auth';

// IndexNow tells Bing, Yandex, Seznam and others the moment a page changes, so new work is
// crawled within minutes instead of days. (Google reads the sitemap; see README.)
export const indexNowKey = () =>
  process.env.INDEXNOW_KEY || createHash('sha256').update(`indexnow:${process.env.SESSION_SECRET || 'dev'}`).digest('hex').slice(0, 32);

export async function pingSearchEngines(paths: string[]) {
  const origin = siteOrigin();
  if (!/^https:\/\//.test(origin) || /localhost|127\.0\.0\.1/.test(origin)) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(origin).host, key: indexNowKey(), keyLocation: `${origin}/indexnow-key.txt`, urlList: [...new Set(paths)].map((p) => `${origin}${p}`) }),
      signal: AbortSignal.timeout(4000),
    });
  } catch { /* never block publishing on this */ }
}
