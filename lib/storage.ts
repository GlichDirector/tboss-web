import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Photos live in Cloudflare R2. Browsers upload and download directly with short-lived
// signed links, so big files never pass through Hostinger.
// STORAGE_DRIVER=local keeps files on this computer instead (for testing only).

const local = process.env.STORAGE_DRIVER === 'local';
const bucket = () => process.env.R2_BUCKET || 'tboss-galleries';

let client: S3Client | null = null;
function s3() {
  if (!client) {
    if (!process.env.R2_ENDPOINT) throw new Error('Photo storage not configured: add R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET in Hostinger.');
    client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID || '', secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '' },
    });
  }
  return client;
}

export const storageConfigured = () => local || Boolean(process.env.R2_ENDPOINT);

export function photoKey(galleryId: number, folder: string, photoId: number, variant: 'original' | 'web' | 'thumb') {
  return `galleries/${galleryId}/${folder}/${photoId}/${variant}.jpg`;
}

// ----- local test driver -----
function sign(parts: string) {
  return createHmac('sha256', process.env.SESSION_SECRET || 'dev').update(parts).digest('base64url');
}
function localUrl(method: 'GET' | 'PUT', key: string, seconds: number, filename?: string) {
  const exp = Math.floor(Date.now() / 1000) + seconds;
  const dl = filename || '';
  const sig = sign(`${method}|${key}|${exp}|${dl}`);
  return `/api/storage?${new URLSearchParams({ key, exp: String(exp), sig, dl, m: method })}`;
}
export function verifyLocal(method: string, key: string, exp: string, dl: string, sig: string) {
  if (!local || Number(exp) < Date.now() / 1000 || key.includes('..')) return false;
  const want = Buffer.from(sign(`${method}|${key}|${exp}|${dl}`));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

// ----- public helpers -----
export async function uploadUrl(key: string, contentType = 'image/jpeg') {
  if (local) return localUrl('PUT', key, 900);
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), { expiresIn: 900 });
}

export async function viewUrl(key: string) {
  if (local) return localUrl('GET', key, 3600);
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 3600 });
}

export async function downloadUrl(key: string, filename: string) {
  const safe = filename.replace(/["\\\r\n]/g, '');
  if (local) return localUrl('GET', key, 300, safe);
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: `attachment; filename="${safe}"` }),
    { expiresIn: 300 },
  );
}

export async function removeKeys(keys: string[]) {
  if (!keys.length) return;
  if (local) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    await Promise.all(keys.map((k) => fs.rm(path.join(process.cwd(), '.storage', k), { force: true })));
    return;
  }
  await s3().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys.map((Key) => ({ Key })) } }));
}

// Server-side save and read (AI drafting reads photos with this). Small files only.
export async function putObject(key: string, body: Buffer, contentType = 'image/jpeg') {
  if (local) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = path.join(process.cwd(), '.storage', key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
    return;
  }
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
}

export async function getObject(key: string): Promise<Buffer> {
  if (local) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    return fs.readFile(path.join(process.cwd(), '.storage', key));
  }
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return Buffer.from(await res.Body!.transformToByteArray());
}
