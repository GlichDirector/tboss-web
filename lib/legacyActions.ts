'use server';

import { dbConfigured } from './db';
import { saveNomination, SW_STATES } from './legacy';
import { brandedEmail, esc, notifyStudio, sendMail } from './mail';
import { siteOrigin } from './auth';
import { studio } from './site';

export type NominationState = { ok: boolean; error?: string; field?: string; elder?: string; email?: string };

const clean = (v: FormDataEntryValue | null, max = 300) => String(v ?? '').trim().replace(/\s+\n/g, '\n').slice(0, max);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export async function nominateElder(_prev: NominationState, form: FormData): Promise<NominationState> {
  if (clean(form.get('company'))) return { ok: true, elder: 'them' }; // spam trap

  const n = {
    elder_name: clean(form.get('elder_name'), 160),
    known_as: clean(form.get('known_as'), 120) || null,
    sex: clean(form.get('sex'), 10),
    age: Number(clean(form.get('age'), 3)),
    state: clean(form.get('state'), 20),
    town: clean(form.get('town'), 120),
    languages: clean(form.get('languages'), 160) || null,
    known_for: clean(form.get('known_for'), 300) || null,
    story: clean(form.get('story'), 3000),
    outfit: clean(form.get('outfit'), 300) || null,
    care_notes: clean(form.get('care_notes'), 500) || null,
    nominator_name: clean(form.get('nominator_name'), 160),
    relationship: clean(form.get('relationship'), 80),
    phone: clean(form.get('phone'), 40),
    email: clean(form.get('email'), 200),
    sponsor: clean(form.get('sponsor'), 20) || 'me',
    found_via: clean(form.get('found_via'), 60) || null,
  };

  const fail = (field: string, error: string): NominationState => ({ ok: false, field, error });
  if (!n.elder_name) return fail('elder_name', 'Please add the elder’s full name.');
  if (!['Female', 'Male'].includes(n.sex)) return fail('sex', 'Please choose the elder’s sex.');
  if (!Number.isFinite(n.age) || n.age < 80 || n.age > 125) return fail('age', 'Preserving Legacy is for elders aged 80 or above. Please check the age.');
  if (!(SW_STATES as readonly string[]).includes(n.state)) return fail('state', 'Please choose a state in Southwest Nigeria: Lagos, Ogun, Oyo, Osun, Ondo or Ekiti.');
  if (!n.town) return fail('town', 'Please add the town or city where they live.');
  if (n.story.length < 40) return fail('story', 'Please tell us a little more of their story (at least two or three sentences).');
  if (!n.nominator_name) return fail('nominator_name', 'Please add your name.');
  if (!n.relationship) return fail('relationship', 'Please tell us how you know them.');
  if (n.phone.replace(/\D/g, '').length < 10) return fail('phone', 'Please add a phone or WhatsApp number we can call.');
  if (!isEmail(n.email)) return fail('email', 'Please check your email address.');
  if (form.get('consent_family') !== 'on') return fail('consent_family', 'Please confirm the elder and their family are happy to take part.');
  if (form.get('consent_rights') !== 'on') return fail('consent_rights', 'Please confirm you agree to how the photos, videos and story will be used.');
  if (!['me', 'family', 'unsure'].includes(n.sponsor)) n.sponsor = 'me';

  let stored = false;
  if (dbConfigured()) {
    try { await saveNomination(n); stored = true; } catch (e) { console.error('Could not save nomination', e); }
  }

  const sponsorLabel = ({ me: 'I will sponsor it', family: 'Another family member will sponsor it', unsure: 'Not sure yet' } as Record<string, string>)[n.sponsor] || 'Not sure yet';
  const rows: [string, string][] = [
    ['Elder', `${n.elder_name}${n.known_as ? ` (${n.known_as})` : ''}`], ['Sex', n.sex], ['Age', String(n.age)], ['Lives in', `${n.town}, ${n.state} State`],
    ['Languages', n.languages || ''], ['Known for', n.known_for || ''], ['Outfit idea', n.outfit || ''], ['Care notes', n.care_notes || ''],
    ['Nominated by', `${n.nominator_name} (${n.relationship})`], ['Phone / WhatsApp', n.phone], ['Email', n.email], ['Sponsorship', sponsorLabel], ['Heard about it', n.found_via || ''],
  ];
  const toStudio = await notifyStudio(
    `Legacy nomination: ${n.elder_name}, ${n.age}, ${n.town}`,
    brandedEmail({
      heading: `New nomination: ${n.elder_name}`,
      intro: `<strong>Their story:</strong><br>${esc(n.story).replace(/\n/g, '<br>')}`,
      rows: rows.filter(([, v]) => v),
      cta: { label: 'Open in the studio admin', url: `${siteOrigin()}/admin/legacy` },
    }),
  );
  if (!stored && !toStudio) return { ok: false, error: `Sorry, your nomination didn’t send. Please try again, or call or WhatsApp us on ${studio.phoneDisplay}.` };

  await sendMail(n.email, `We’ve received your nomination for ${n.elder_name}`, brandedEmail({
    heading: 'Thank you for your nomination',
    intro: `Thank you for telling us about <strong>${esc(n.elder_name)}</strong>. We read every Preserving Legacy nomination personally and will call you on ${esc(n.phone)} to talk about their story, the shoot and the sponsorship.`,
    rows: [['Elder', n.elder_name], ['Age', String(n.age)], ['Lives in', `${n.town}, ${n.state} State`]],
    cta: { label: 'See stories we have preserved', url: `${siteOrigin()}/preserving-legacy` },
    note: `Questions? Call or WhatsApp ${studio.phoneDisplay}.`,
  }), process.env.STUDIO_INBOX || studio.email);

  return { ok: true, elder: n.elder_name.split(/\s+/)[0], email: n.email };
}
