'use server';

import { studio } from './site';
import { dbConfigured } from './db';
import { saveEnquiry } from './studio';

export type FormState = { ok: boolean; error?: string; firstName?: string; email?: string; type?: string };

const clean = (v: FormDataEntryValue | null, max = 2000) => String(v ?? '').trim().slice(0, max);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Email not connected yet: keep a record in the server log instead.
    console.log(`[email not sent: RESEND_API_KEY missing] to=${to} subject="${subject}"`);
    return true;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${studio.name} <${studio.email}>`,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) console.error('Resend error', res.status, await res.text());
  return res.ok;
}

export async function sendEnquiry(_prev: FormState, form: FormData): Promise<FormState> {
  // Spam trap: real people never fill this hidden field.
  if (clean(form.get('company'))) return { ok: true, firstName: 'friend' };

  const type = clean(form.get('type'), 40) || 'Other';
  const name = clean(form.get('name'), 120);
  const email = clean(form.get('email'), 200);
  const phone = clean(form.get('phone'), 40);
  const date = clean(form.get('date'), 20);
  const location = clean(form.get('location'), 120);
  const source = clean(form.get('source'), 40);
  const message = clean(form.get('message'), 4000);

  if (!name) return { ok: false, error: 'Please add your name so we know who to reply to.' };
  if (!isEmail(email)) return { ok: false, error: 'Please check your email address. We reply by email.' };

  const rows: [string, string][] = [
    ['Session', type], ['Name', name], ['Email', email], ['Phone / WhatsApp', phone], ['Date', date],
    ['Location', location], ['Found us via', source], ['Message', message],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#625850;vertical-align:top">${k}</td><td style="padding:6px 0">${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');

  // Keep every enquiry in the studio admin (Enquiries), even if email isn't connected.
  let stored = false;
  if (dbConfigured()) {
    try {
      await saveEnquiry({ name, email, phone: phone || null, session_type: type, wanted_date: date || null, location: location || null, found_via: source || null, message: message || null });
      stored = true;
    } catch (e) {
      console.error('Could not save enquiry', e);
    }
  }

  const toStudio = await sendEmail(
    process.env.STUDIO_INBOX || studio.email,
    `New ${type.toLowerCase()} enquiry from ${name}`,
    `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1F1A16"><h2 style="font-weight:600">New enquiry</h2><table>${table}</table></div>`,
    email,
  );
  if (!toStudio && !stored) return { ok: false, error: 'Sorry, your enquiry didn’t send. Please try again, or call or WhatsApp us.' };

  const firstName = name.split(/\s+/)[0];
  await sendEmail(
    email,
    'We’ve received your enquiry · Tboss Photography',
    `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1F1A16"><p>Hi ${escapeHtml(firstName)},</p><p>Thank you for getting in touch about a ${escapeHtml(type.toLowerCase())} session. We’ve received your details and will reply with availability and options.</p><p>Can’t wait? Call or WhatsApp us on ${studio.phoneDisplay}.</p><p>Warmly,<br>Tboss Photography</p><table style="margin-top:16px;font-size:13px">${table}</table></div>`,
  );

  return { ok: true, firstName, email, type };
}

export async function subscribe(_prev: FormState, form: FormData): Promise<FormState> {
  if (clean(form.get('company'))) return { ok: true };
  const email = clean(form.get('email'), 200);
  if (!isEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };
  // Phase 3 stores subscribers in the database; until then the studio gets an email.
  await sendEmail(process.env.STUDIO_INBOX || studio.email, 'New Journal subscriber', `<p>${escapeHtml(email)} subscribed to the Journal.</p>`);
  return { ok: true, email };
}
