import type { MetadataRoute } from 'next';
import { getStories } from '@/lib/content';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/work', '/journal', '/about', '/contact', '/galleries', '/privacy'].map((p) => ({
    url: `${siteUrl}${p}`,
    changeFrequency: (p === '/journal' || p === '/work' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
  const stories = getStories()
    .filter((s) => !s.sample)
    .map((s) => ({ url: `${siteUrl}/journal/${s.slug}`, lastModified: s.date, changeFrequency: 'monthly' as const, priority: 0.6 }));
  return [...pages, ...stories];
}
