import type { MetadataRoute } from 'next';
import { lastWorkUpdate, publishedStories, workPhotos } from '@/lib/journal';
import { siteUrl } from '@/lib/site';
import { workCategories } from '@/lib/workCategories';

export const revalidate = 600;

const abs = (src: string) => `${siteUrl}${src}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stories, photos, workUpdated] = await Promise.all([publishedStories(), workPhotos(), lastWorkUpdate()]);
  const live = stories.filter((s) => !s.sample);
  const newestStory = live[0]?.date;
  const workDate = workUpdated ? new Date(workUpdated) : undefined;

  const pages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: workDate, changeFrequency: 'weekly', priority: 1, images: photos.slice(0, 8).map((p) => abs(p.src)) },
    { url: `${siteUrl}/work`, lastModified: workDate, changeFrequency: 'weekly', priority: 0.9, images: photos.slice(0, 50).map((p) => abs(p.src)) },
    ...Object.entries(workCategories).map(([slug, c]) => ({
      url: `${siteUrl}/work/${slug}`, lastModified: workDate, changeFrequency: 'weekly' as const, priority: 0.8,
      images: photos.filter((p) => p.tag === c.key).slice(0, 50).map((p) => abs(p.src)),
    })),
    { url: `${siteUrl}/journal`, lastModified: newestStory, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/galleries`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ];
  const articles: MetadataRoute.Sitemap = live.map((s) => ({
    url: `${siteUrl}/journal/${s.slug}`, lastModified: s.date, changeFrequency: 'monthly', priority: 0.7,
    images: [s.cover.src, ...s.body.flatMap((b) => (b.type === 'image' ? [b.src] : b.type === 'pair' ? b.images.map((i) => i.src) : []))].slice(0, 20).map(abs),
  }));
  return [...pages, ...articles];
}
