import { NextResponse, type NextRequest } from 'next/server';
import { browserOf, countryOf, deviceOf, isBot, recordView, sourceOf } from '@/lib/analytics';
import { dbConfigured } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import { getStaff } from '@/lib/team';

// Receives one page view from the website (sent by components/Analytics.tsx).
const ok = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: NextRequest) {
  if (!dbConfigured()) return ok();
  const ua = req.headers.get('user-agent') || '';
  if (isBot(ua)) return ok();
  let b: { p?: string; v?: string; n?: boolean; r?: string; u?: string; tz?: string };
  try { b = JSON.parse(await req.text()); } catch { return ok(); }
  const path = String(b.p || '').split(/[?#]/)[0].slice(0, 255);
  const visitor = String(b.v || '');
  if (!path.startsWith('/') || /^\/(admin|api|g\/|invoice|confirm)/.test(path) || !/^[a-f0-9]{16}$/.test(visitor)) return ok();
  try { if (await getStaff()) return ok(); } catch { /* not signed in */ } // the studio's own visits don't count
  const h = req.headers;
  const city = h.get('x-vercel-ip-city') || h.get('cf-ipcity') || h.get('x-city');
  try {
    await recordView({
      path, visitor, isNew: Boolean(b.n),
      country: countryOf(h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || h.get('x-country-code'), String(b.tz || '')),
      city: city ? decodeURIComponent(city).slice(0, 60) : null,
      device: deviceOf(ua), browser: browserOf(ua),
      source: sourceOf(String(b.r || ''), String(b.u || '').replace(/[^\w .-]/g, ''), new URL(siteUrl).hostname),
    });
  } catch { /* stats must never break the site */ }
  return ok();
}
