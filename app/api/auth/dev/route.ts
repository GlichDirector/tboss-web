import { NextResponse, type NextRequest } from 'next/server';
import { safeNext, setSession, siteOrigin } from '@/lib/auth';

// Testing only: sign in as any email without Google.
// Works only when DEV_LOGIN=1 AND the site address is localhost, so it can never run on the live site.
export async function GET(req: NextRequest) {
  if (process.env.DEV_LOGIN !== '1' || !siteOrigin().startsWith('http://localhost')) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const email = req.nextUrl.searchParams.get('email') || 'test@example.com';
  await setSession({ email, name: email.split('@')[0] });
  return NextResponse.redirect(`${siteOrigin()}${safeNext(req.nextUrl.searchParams.get('next'))}`);
}
