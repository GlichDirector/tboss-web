import type { MetadataRoute } from 'next';
import { publishedStories } from '@/lib/journal';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['', '/work', '/journal', '/about', '/contact', '/galleries', '/privacy'].map((p) => ({
    url: `${siteUrl}${p}`,
    changeFrequency: (p === '/journal' || p === '/work' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
  const stories = (await publishedStories())
    .filter((s) => !s.sample)
    .map((s) => ({ url: `${siteUrl}/journal/${s.slug}`, lastModified: s.date, changeFrequency: 'monthly' as const, priority: 0.6 }));
  return [...pages, ...stories];
}
