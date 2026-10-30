import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import StoryArticle from '@/components/StoryArticle';
import { publishedStory } from '@/lib/journal';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;
export const generateStaticParams = async () => [];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = await publishedStory((await params).slug);
  if (!story) return {};
  return {
    title: story.title,
    description: story.excerpt,
    keywords: story.keywords,
    alternates: { canonical: `/journal/${story.slug}` },
    openGraph: { type: 'article', images: [{ url: story.cover.src, alt: story.cover.alt }], publishedTime: story.date },
    robots: story.sample ? { index: false } : undefined,
  };
}

export default async function StoryPage({ params }: Props) {
  const story = await publishedStory((await params).slug);
  if (!story) notFound();
  return <StoryArticle story={story} />;
}
