import { NextResponse, type NextRequest } from 'next/server';
import { safeNext, setSession, siteOrigin } from '@/lib/auth';

// Step 2: Google sends the visitor back here; we confirm who they are and sign them in.
export async function GET(req: NextRequest) {
  const raw = req.cookies.get('tb_oauth')?.value;
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  let saved: { state: string; verifier: string; next: string } | null = null;
  try { saved = raw ? JSON.parse(raw) : null; } catch { saved = null; }

  const fail = (why: string) => NextResponse.redirect(`${siteOrigin()}/galleries?signin=failed&why=${encodeURIComponent(why)}`);
  if (!code || !saved || state !== saved.state) return fail('expired');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${siteOrigin()}/api/auth/google/callback`,
      grant_type: 'authorization_code',
      code_verifier: saved.verifier,
    }),
  });
  if (!tokenRes.ok) return fail('token');
  const { access_token } = (await tokenRes.json()) as { access_token?: string };

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${access_token}` } });
  if (!infoRes.ok) return fail('profile');
  const info = (await infoRes.json()) as { email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!info.email || info.email_verified === false) return fail('email');

  await setSession({ email: info.email, name: info.name || info.email, picture: info.picture });
  const res = NextResponse.redirect(`${siteOrigin()}${safeNext(saved.next)}`);
  res.cookies.delete('tb_oauth');
  return res;
}
