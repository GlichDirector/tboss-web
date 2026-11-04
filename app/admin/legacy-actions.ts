'use server';

import { revalidatePath } from 'next/cache';
import { LEGACY_STATUSES, updateNomination } from '@/lib/legacy';
import { assertArea } from '@/lib/team';

export async function saveNominationAction(id: number, status: string, notes: string) {
  await assertArea('clients');
  if (!LEGACY_STATUSES.some(([k]) => k === status)) return { error: 'Unknown status.' };
  await updateNomination(id, status, notes.slice(0, 4000));
  revalidatePath('/admin/legacy');
  return { ok: 'Saved.' };
}
