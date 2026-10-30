import 'server-only';
import { studio } from './site';

export async function sendMail(to: string, subject: string, html: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email not sent: RESEND_API_KEY missing] to=${to} subject="${subject}"`);
    return true;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || `${studio.name} <${studio.email}>`, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) console.error('Resend error', res.status, await res.text());
  return res.ok;
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
