import 'server-only';
import { exec, q } from './db';

export const SW_STATES = ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'] as const;
export const LEGACY_STATUSES = [
  ['new', 'New'], ['contacted', 'Contacted'], ['scheduled', 'Shoot booked'], ['shot', 'Photographed'], ['published', 'Story published'], ['declined', 'Not going ahead'],
] as const;
export type LegacyStatus = (typeof LEGACY_STATUSES)[number][0];

export type Nomination = {
  id: number; status: LegacyStatus; elder_name: string; known_as: string | null; sex: string; age: number; state: string; town: string;
  languages: string | null; known_for: string | null; story: string; outfit: string | null; care_notes: string | null;
  nominator_name: string; relationship: string; phone: string; email: string; sponsor: string; found_via: string | null;
  notes: string | null; created_at: string;
};

export async function saveNomination(n: Omit<Nomination, 'id' | 'status' | 'notes' | 'created_at'>) {
  const res = await exec(
    `INSERT INTO legacy_nominations (elder_name, known_as, sex, age, state, town, languages, known_for, story, outfit, care_notes, nominator_name, relationship, phone, email, sponsor, found_via)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [n.elder_name, n.known_as, n.sex, n.age, n.state, n.town, n.languages, n.known_for, n.story, n.outfit, n.care_notes, n.nominator_name, n.relationship, n.phone, n.email.toLowerCase(), n.sponsor, n.found_via],
  );
  return res.insertId;
}

export const listNominations = (status: string) =>
  q<Nomination>(`SELECT * FROM legacy_nominations WHERE (? = 'all' OR status = ?) ORDER BY created_at DESC LIMIT 500`, [status, status]);
export const getNomination = async (id: number) => (await q<Nomination>('SELECT * FROM legacy_nominations WHERE id = ?', [id]))[0] || null;
export const nominationCounts = () => q<{ status: string; n: number }>('SELECT status, COUNT(*) AS n FROM legacy_nominations GROUP BY status');
export const updateNomination = (id: number, status: string, notes: string) =>
  exec('UPDATE legacy_nominations SET status = ?, notes = ? WHERE id = ?', [status, notes || null, id]);
export const newNominationCount = async () => {
  try { return Number((await q<{ n: number }>("SELECT COUNT(*) AS n FROM legacy_nominations WHERE status = 'new'"))[0]?.n || 0); } catch { return 0; }
};
