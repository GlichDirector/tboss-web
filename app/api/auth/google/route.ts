import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { safeNext, siteOrigin } from '@/lib/auth';

// Step 1: send the visitor to Google to choose an account.
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'Google sign-in is not set up yet.' }, { status: 503 });

  const next = safeNext(req.nextUrl.searchParams.get('next'));
  const state = randomBytes(16).toString('hex');
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteOrigin()}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();

  const res = NextResponse.redirect(url);
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 600 };
  res.cookies.set('tb_oauth', JSON.stringify({ state, verifier, next }), opts);
  return res;
}
