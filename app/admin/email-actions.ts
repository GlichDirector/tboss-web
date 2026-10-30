'use server';

import { revalidatePath } from 'next/cache';
import { getTemplates, sendTemplate } from '@/lib/mail';
import type { Tpl, TplKey } from '@/lib/emailTemplates';
import { DEFAULT_TEMPLATES } from '@/lib/emailTemplates';
import { setSetting } from '@/lib/studio';
import { assertArea } from '@/lib/team';
import { siteOrigin } from '@/lib/auth';

const SAMPLE: Record<string, string> = { first_name: 'Adaeze', session: 'family session', session_type: 'family', invoice_number: 'TB-1047', amount: '₦75,000', date: 'Saturday, 14 November 2026', time: '10:00 AM' };

export async function saveTemplateAction(key: TplKey, t: Tpl) {
  await assertArea('website');
  const all = await getTemplates();
  const clean: Tpl = { subject: t.subject.slice(0, 200), heading: t.heading.slice(0, 200), intro: t.intro.slice(0, 2000), button: t.button.slice(0, 60), note: t.note.slice(0, 600) };
  await setSetting('emails', { ...all, [key]: clean });
  revalidatePath('/admin/emails');
  return { ok: 'Saved. The next email of this kind uses your wording.' };
}

export async function resetTemplateAction(key: TplKey) {
  await assertArea('website');
  const all = await getTemplates();
  await setSetting('emails', { ...all, [key]: DEFAULT_TEMPLATES[key] });
  revalidatePath('/admin/emails');
}

export async function sendTestAction(key: TplKey) {
  const me = await assertArea('website');
  const ok = await sendTemplate(key, me.user.email, SAMPLE, { url: siteOrigin(), rows: [['Example detail', 'Filled in automatically']] });
  return ok ? { ok: `Test sent to ${me.user.email}. (Without RESEND_API_KEY it’s only recorded, not delivered.)` } : { error: 'Sending failed. Check the email settings.' };
}
