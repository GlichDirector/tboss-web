'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createStory, deleteStory, setStoryStatus, showStoryPhotos, storyRow, updateStory } from '@/lib/journal';
import { pingSearchEngines } from '@/lib/indexnow';
import { assertArea } from '@/lib/team';

const refreshSite = () => { revalidatePath('/', 'layout'); };

export async function newStoryAction() {
  await assertArea('website');
  const id = await createStory({ title: 'Untitled story', body: JSON.stringify([{ type: 'p', text: '' }]) });
  redirect(`/admin/journal/${id}`);
}

export type StoryForm = {
  title: string; slug: string; category: string; excerpt: string; lead: string; body: string; cover_key: string; cover_alt: string;
  location: string; session_type: string; styling: string; keywords: string;
};

export async function saveStoryAction(id: number, f: StoryForm, publish: boolean | null) {
  await assertArea('website');
  if (!f.title.trim()) return { error: 'Add a title.' };
  const before = await storyRow(id);
  const slug = await updateStory(id, { ...f, title: f.title.trim().slice(0, 200), excerpt: f.excerpt.slice(0, 400) });
  if (publish !== null) {
    await setStoryStatus(id, publish ? 'published' : 'draft');
    await showStoryPhotos(id, publish);
  }
  refreshSite();
  const row = await storyRow(id);
  if (row?.status === 'published') await pingSearchEngines([`/journal/${slug}`, '/journal', '/work', ...(before?.slug && before.slug !== slug ? [`/journal/${before.slug}`] : [])]);
  return { ok: publish === true ? 'Published. It’s live on the Journal and its photos are on Work.' : publish === false ? 'Moved back to drafts.' : 'Saved.', slug, status: row?.status };
}

export async function deleteStoryAction(id: number) {
  await assertArea('website');
  await showStoryPhotos(id, false);
  await deleteStory(id);
  refreshSite();
  redirect('/admin/journal');
}
