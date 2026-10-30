import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import StoryArticle from '@/components/StoryArticle';
import { publishedStory } from '@/lib/journal';
import { getStaff } from '@/lib/team';

// Draft preview for the studio team. Never indexed.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StoryPreview({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await getStaff())?.areas.has('website')) notFound();
  const story = await publishedStory((await params).slug, true);
  if (!story) notFound();
  return <StoryArticle story={story} />;
}
