import 'server-only';
import { exec, q } from './db';
import { imageSize } from './imageSize';
import { putObject } from './storage';
import { getSetting, setSetting } from './studio';

type IgMedia = { id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; permalink?: string; timestamp?: string; children?: { data: { media_type: string; media_url?: string }[] } };
type IgState = { token: string; refreshedAt: string; lastSync: string; lastError: string; autoDraft: boolean };
const blank: IgState = { token: '', refreshedAt: '', lastSync: '', lastError: '', autoDraft: true };

export const igState = () => getSetting<IgState>('instagram', blank);
const token = async () => (await igState()).token || process.env.INSTAGRAM_TOKEN || '';
export const instagramConfigured = async () => Boolean(await token());

export function guessTag(caption: string) {
  const c = caption.toLowerCase();
  if (/(heritage|legacy|elder|grandma|grandmother|mama|baba|tradition|culture)/.test(c)) return 'Heritage';
  if (/(family|families|kids|children|siblings|mum|mom|dad|newborn|baby)/.test(c)) return 'Family';
  if (/(wedding|bride|groom|engagement|birthday|owambe|party|event|celebration|anniversary)/.test(c)) return 'Event';
  return 'Portrait';
}

// Long-lived Instagram tokens last 60 days; renew when older than 30.
async function refreshIfNeeded(state: IgState, t: string) {
  const age = state.refreshedAt ? Date.now() - Date.parse(state.refreshedAt) : Infinity;
  if (age < 30 * 86400000) return t;
  const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(t)}`);
  if (!r.ok) return t;
  const j = (await r.json()) as { access_token?: string };
  if (j.access_token) { await setSetting('instagram', { ...state, token: j.access_token, refreshedAt: new Date().toISOString() }); return j.access_token; }
  return t;
}

// Copies new Instagram posts into storage so the Work page never shows expired Instagram links.
export async function syncInstagram(): Promise<{ added: string[]; error?: string }> {
  const state = await igState();
  let t = await token();
  if (!t) return { added: [], error: 'Instagram isn’t connected yet (INSTAGRAM_TOKEN).' };
  try {
    t = await refreshIfNeeded(state, t);
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url}';
    const r = await fetch(`https://graph.instagram.com/me/media?fields=${fields}&limit=40&access_token=${encodeURIComponent(t)}`);
    if (!r.ok) throw new Error(`Instagram said ${r.status}: ${(await r.text()).slice(0, 160)}`);
    const { data } = (await r.json()) as { data: IgMedia[] };
    const known = new Set((await q<{ id: string }>('SELECT id FROM instagram_posts')).map((x) => x.id));
    const added: string[] = [];
    for (const m of data.filter((x) => !known.has(x.id))) {
      const url = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_type === 'CAROUSEL_ALBUM' ? m.children?.data.find((c) => c.media_type === 'IMAGE')?.media_url : m.media_url;
      if (!url) continue;
      const img = await fetch(url);
      if (!img.ok) continue;
      const buf = Buffer.from(await img.arrayBuffer());
      const { width, height } = imageSize(buf);
      const key = `instagram/${m.id}.jpg`;
      await putObject(key, buf);
      await exec('INSERT INTO instagram_posts (id, caption, permalink, media_type, posted_at, image_key, width, height, tag) VALUES (?,?,?,?,?,?,?,?,?)',
        [m.id, m.caption || null, m.permalink || null, m.media_type, m.timestamp ? m.timestamp.slice(0, 19).replace('T', ' ') : null, key, width, height, guessTag(m.caption || '')]);
      added.push(m.id);
    }
    await setSetting('instagram', { ...(await igState()), lastSync: new Date().toISOString(), lastError: '' });
    return { added };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    await setSetting('instagram', { ...(await igState()), lastError: msg });
    return { added: [], error: msg };
  }
}
