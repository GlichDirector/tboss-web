import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WorkPageBody from '@/components/WorkPageBody';
import { workPhotos } from '@/lib/journal';
import { workCategories } from '@/lib/workCategories';

// Rendered fresh on every visit, so changes made in the admin show immediately.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = workCategories[(await params).category];
  if (!c) return {};
  const first = (await workPhotos(c.key))[0];
  return {
    title: c.title, description: c.description,
    alternates: { canonical: `/work/${(await params).category}` },
    openGraph: first ? { images: [{ url: first.src, alt: first.alt }] } : undefined,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const slug = (await params).category;
  const c = workCategories[slug];
  if (!c) notFound();
  return <WorkPageBody active={c.key} eyebrow="Portfolio" title={c.h1} intro={c.intro} path={`/work/${slug}`} />;
}
