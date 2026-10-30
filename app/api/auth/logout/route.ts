import { NextResponse, type NextRequest } from 'next/server';
import { clearSession, safeNext, siteOrigin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await clearSession();
  return NextResponse.redirect(`${siteOrigin()}${safeNext(req.nextUrl.searchParams.get('next'))}`);
}
