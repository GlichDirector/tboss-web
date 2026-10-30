import { NextResponse, type NextRequest } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { verifyLocal } from '@/lib/storage';

// Local test storage only (STORAGE_DRIVER=local). The live site uses Cloudflare R2.
const root = path.join(process.cwd(), '.storage');

function check(req: NextRequest, method: string) {
  const p = req.nextUrl.searchParams;
  const key = p.get('key') || '';
  const ok = verifyLocal(method, key, p.get('exp') || '', p.get('dl') || '', p.get('sig') || '');
  return ok ? { key, dl: p.get('dl') || '' } : null;
}

export async function GET(req: NextRequest) {
  const c = check(req, 'GET');
  if (!c) return NextResponse.json({ error: 'Link expired' }, { status: 403 });
  try {
    const buf = await fs.readFile(path.join(root, c.key));
    const headers: Record<string, string> = { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600' };
    if (c.dl) headers['Content-Disposition'] = `attachment; filename="${c.dl}"`;
    return new NextResponse(new Uint8Array(buf), { headers });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PUT(req: NextRequest) {
  const c = check(req, 'PUT');
  if (!c) return NextResponse.json({ error: 'Link expired' }, { status: 403 });
  const file = path.join(root, c.key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(await req.arrayBuffer()));
  return new NextResponse(null, { status: 200 });
}
