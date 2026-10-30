'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { aiConfigured, draftStoryFromPost } from '@/lib/ai';
import { igState, syncInstagram } from '@/lib/instagram';
import { createStory, deleteStory, getPost, setPostFields, setStoryStatus, storyRow, updateStory } from '@/lib/journal';
import { setSetting } from '@/lib/studio';
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
  const slug = await updateStory(id, { ...f, title: f.title.trim().slice(0, 200), excerpt: f.excerpt.slice(0, 400) });
  if (publish !== null) await setStoryStatus(id, publish ? 'published' : 'draft');
  refreshSite();
  const row = await storyRow(id);
  return { ok: publish === true ? 'Published. It’s live on the Journal now.' : publish === false ? 'Moved back to drafts.' : 'Saved.', slug, status: row?.status };
}

export async function deleteStoryAction(id: number) {
  await assertArea('website');
  await deleteStory(id);
  refreshSite();
  redirect('/admin/journal');
}

export async function syncNowAction() {
  await assertArea('website');
  const r = await syncInstagram();
  refreshSite();
  revalidatePath('/admin/instagram');
  return r.error ? { error: r.error } : { ok: r.added.length ? `${r.added.length} new post${r.added.length === 1 ? '' : 's'} added.` : 'Up to date. No new posts.' };
}

export async function draftFromPostAction(postId: string) {
  await assertArea('website');
  if (!aiConfigured()) return { error: 'AI isn’t connected yet. Add ANTHROPIC_API_KEY in Hostinger.' };
  const post = await getPost(postId);
  if (!post) return { error: 'Post not found.' };
  if (post.story_id && (await storyRow(post.story_id))) redirect(`/admin/journal/${post.story_id}`);
  let id: number;
  try { id = await draftStoryFromPost(post); } catch (e) { return { error: e instanceof Error ? e.message : 'The AI draft failed. Try again.' }; }
  redirect(`/admin/journal/${id}`);
}

export async function postFieldsAction(postId: string, f: { tag?: string; hidden?: boolean }) {
  await assertArea('website');
  await setPostFields(postId, f);
  refreshSite();
  revalidatePath('/admin/instagram');
}

export async function autoDraftAction(on: boolean) {
  await assertArea('website');
  await setSetting('instagram', { ...(await igState()), autoDraft: on });
  revalidatePath('/admin/instagram');
}
