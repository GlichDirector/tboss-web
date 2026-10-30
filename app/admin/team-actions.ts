'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser, siteOrigin } from '@/lib/auth';
import { brandedEmail, esc, sendMail } from '@/lib/mail';
import { acceptInvite, assertArea, inviteMember, memberByToken, removeMember, ROLES, setRole, type Role } from '@/lib/team';

export type R = { error?: string; ok?: string };
const isRole = (r: string): r is Role => r in ROLES;

export async function inviteAction(_p: R, f: FormData): Promise<R> {
  const me = await assertArea('settings');
  const email = String(f.get('email') || '').trim().toLowerCase();
  const name = String(f.get('name') || '').trim().slice(0, 120) || null;
  const role = String(f.get('role') || 'assistant');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'Enter their Google email address.' };
  if (!isRole(role)) return { error: 'Choose a role.' };
  const m = await inviteMember(email, name, role);
  if (m.accepted_at) { revalidatePath('/admin/team'); return { ok: `${email} is already on the team. Their role is now ${ROLES[role].label}.` }; }
  const link = `${siteOrigin()}/admin/join/${m.invite_token}`;
  const sent = await sendMail(email, 'You’re invited to Tboss Studio', brandedEmail({
    heading: 'Join the Tboss Studio team',
    intro: `Hi${name ? ` ${esc(name.split(' ')[0])}` : ''}, ${esc(me.user.name)} invited you to the Tboss Photography studio admin as <strong>${ROLES[role].label}</strong> (${esc(ROLES[role].help.toLowerCase())}).`,
    cta: { label: 'Accept invite', url: link },
    note: `Sign in with the Google account for ${esc(email)}. If you weren’t expecting this, ignore this email.`,
  }));
  revalidatePath('/admin/team');
  return { ok: sent && process.env.RESEND_API_KEY ? `Invite emailed to ${email}. You can also copy their invite link from the list below.` : `Invite created. Email isn’t connected yet, so send them this link yourself (WhatsApp is fine): ${link}` };
}

export async function roleAction(id: number, role: string) {
  await assertArea('settings');
  if (isRole(role)) await setRole(id, role);
  revalidatePath('/admin/team');
}

export async function removeAction(id: number) {
  await assertArea('settings');
  await removeMember(id);
  revalidatePath('/admin/team');
}

export async function acceptAction(token: string) {
  const user = await getUser();
  const m = await memberByToken(token);
  if (!user || !m || m.email !== user.email.toLowerCase()) return { error: 'This invite is for a different Google account.' };
  await acceptInvite(m.id);
  redirect('/admin');
}
