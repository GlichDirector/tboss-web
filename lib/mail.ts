import 'server-only';
import { studio } from './site';

// The reason the most recent email failed, in plain words (shown in the admin).
let lastError = '';
export const lastMailError = () => lastError;

function explain(status: number, body: string) {
  const b = body.toLowerCase();
  if (status === 401 || b.includes('api key is invalid') || b.includes('invalid api key')) return 'The email key (RESEND_API_KEY) in Hostinger is wrong or was deleted in Resend. Create a new key in Resend and paste it into Hostinger.';
  if (b.includes('domain is not verified') || b.includes('not verified')) return 'Your sending address’s domain isn’t verified in Resend yet. In Resend → Domains, check that tbossphotography.com shows “Verified” (add the DNS records it lists in Hostinger).';
  if (b.includes('only send testing emails') || b.includes('testing emails to your own')) return 'Resend is still in test mode: it only sends to your own email until tbossphotography.com is verified in Resend → Domains.';
  if (b.includes('from') && status === 422) return 'The “from” address (EMAIL_FROM in Hostinger) isn’t valid. Use: Tboss Photography <hello@tbossphotography.com>';
  if (status === 429) return 'Too many emails at once, or the daily Resend limit was reached. Try again in a few minutes.';
  return `Resend refused the email (${status}): ${body.slice(0, 200)}`;
}

export async function sendMail(to: string, subject: string, html: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    lastError = 'Email isn’t connected: RESEND_API_KEY is missing in Hostinger.';
    console.log(`[email not sent: RESEND_API_KEY missing] to=${to} subject="${subject}"`);
    return false;
  }
  try {
    const res = await fetch(`${process.env.RESEND_BASE_URL || 'https://api.resend.com'}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: (process.env.EMAIL_FROM || `${studio.name} <${studio.email}>`).trim(), to: [to.trim()], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return true;
    const body = await res.text();
    lastError = explain(res.status, body);
    console.error('Resend error', res.status, body);
    return false;
  } catch (e) {
    lastError = `Couldn’t reach the email service: ${e instanceof Error ? e.message : 'network error'}.`;
    console.error('Resend unreachable', e);
    return false;
  }
}

export const notifyStudio = (subject: string, html: string) => sendMail(process.env.STUDIO_INBOX || studio.email, subject, html);

export { esc, brandedEmail } from './emailHtml';

import { DEFAULT_TEMPLATES, fill, fillPlain, type Tpl, type TplKey } from './emailTemplates';
import { brandedEmail as _branded } from './emailHtml';
import { studio as _site } from './site';

export async function getTemplates(): Promise<Record<TplKey, Tpl>> {
  try {
    const { dbConfigured, q } = await import('./db');
    if (!dbConfigured()) return DEFAULT_TEMPLATES;
    const row = (await q<{ v: string }>("SELECT v FROM settings WHERE k = 'emails'"))[0];
    if (!row) return DEFAULT_TEMPLATES;
    const saved = JSON.parse(row.v) as Partial<Record<TplKey, Partial<Tpl>>>;
    return Object.fromEntries(Object.entries(DEFAULT_TEMPLATES).map(([k, d]) => [k, { ...d, ...(saved[k as TplKey] || {}) }])) as Record<TplKey, Tpl>;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

// Sends one of the editable emails.
export async function sendTemplate(key: TplKey, to: string, vars: Record<string, string>, extra: { rows?: [string, string][]; url?: string } = {}, replyTo?: string) {
  const t = (await getTemplates())[key];
  const v = { studio_phone: _site.phoneDisplay, ...vars };
  return sendMail(to, fillPlain(t.subject, v), _branded({
    heading: fillPlain(t.heading, v), intro: fill(t.intro, v), rows: extra.rows,
    cta: t.button && extra.url ? { label: fillPlain(t.button, v), url: extra.url } : undefined,
    note: t.note ? fill(t.note, v) : undefined,
  }), replyTo);
}
