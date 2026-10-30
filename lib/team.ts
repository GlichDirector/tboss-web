import 'server-only';
import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { getUser, isAdminEmail, type User } from './auth';
import { dbConfigured, exec, q } from './db';

export type Role = 'full' | 'editor' | 'assistant' | 'bookkeeper';
export type Area = 'dashboard' | 'calendar' | 'clients' | 'galleries' | 'payments' | 'website' | 'settings';

export const ROLES: Record<Role, { label: string; help: string; areas: Area[] }> = {
  full: { label: 'Full access', help: 'Everything, including settings and the team', areas: ['dashboard', 'calendar', 'clients', 'galleries', 'payments', 'website', 'settings'] },
  editor: { label: 'Editor', help: 'Client galleries, the website, Journal and emails', areas: ['dashboard', 'galleries', 'website'] },
  assistant: { label: 'Assistant', help: 'Clients, enquiries, orders, bookings, calendar and galleries; no payments', areas: ['dashboard', 'calendar', 'clients', 'galleries'] },
  bookkeeper: { label: 'Bookkeeper', help: 'Payments and invoices, and the clients they belong to', areas: ['dashboard', 'clients', 'payments'] },
};

export type Staff = { user: User; role: Role; owner: boolean; areas: Set<Area> };
export type Member = { id: number; email: string; name: string | null; role: Role; invite_token: string | null; invited_at: string; accepted_at: string | null };

// Owners come from ADMIN_EMAILS (always full access); everyone else from the team list.
export async function getStaff(): Promise<Staff | null> {
  const user = await getUser();
  if (!user) return null;
  if (isAdminEmail(user.email)) return { user, role: 'full', owner: true, areas: new Set(ROLES.full.areas) };
  if (!dbConfigured()) return null;
  try {
    const m = (await q<Member>('SELECT * FROM team WHERE email = ? AND accepted_at IS NOT NULL', [user.email.toLowerCase()]))[0];
    return m ? { user, role: m.role, owner: false, areas: new Set(ROLES[m.role].areas) } : null;
  } catch {
    return null;
  }
}

// For pages: send people without access back to the dashboard.
export async function requireArea(area: Area) {
  const s = await getStaff();
  if (!s) redirect('/admin/login');
  if (!s.areas.has(area)) redirect('/admin?denied=1');
  return s;
}

// For actions: refuse quietly with a clear message.
export async function assertArea(area: Area) {
  const s = await getStaff();
  if (!s) throw new Error('Please sign in to the studio admin again.');
  if (!s.areas.has(area)) throw new Error('Your role doesn’t include this part of the studio. Ask the owner if you need it.');
  return s;
}

export const listTeam = () => q<Member>('SELECT * FROM team ORDER BY accepted_at IS NULL, name, email');

export async function inviteMember(email: string, name: string | null, role: Role) {
  const token = randomBytes(18).toString('base64url');
  await exec(
    `INSERT INTO team (email, name, role, invite_token, invited_at, accepted_at) VALUES (?,?,?,?,NOW(),NULL)
     ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), invite_token = IF(accepted_at IS NULL, VALUES(invite_token), invite_token), invited_at = NOW()`,
    [email.toLowerCase(), name, role, token],
  );
  return (await q<Member>('SELECT * FROM team WHERE email = ?', [email.toLowerCase()]))[0];
}
export const memberByToken = async (t: string) => (await q<Member>('SELECT * FROM team WHERE invite_token = ?', [t]))[0] || null;
export const acceptInvite = (id: number) => exec('UPDATE team SET accepted_at = NOW(), invite_token = NULL WHERE id = ?', [id]);
export const setRole = (id: number, role: Role) => exec('UPDATE team SET role = ? WHERE id = ?', [role, id]);
export const removeMember = (id: number) => exec('DELETE FROM team WHERE id = ?', [id]);
