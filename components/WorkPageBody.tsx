import Link from 'next/link';
import WorkGallery from './WorkGallery';
import { collections, type Collection } from '@/lib/content';
import { workPhotos } from '@/lib/journal';
import { siteUrl } from '@/lib/site';

// Shared by /work and /work/<category>.
export default async function WorkPageBody({ active, eyebrow, title, intro, path }: { active: Collection | null; eyebrow: string; title: string; intro: string; path: string }) {
  const all = await workPhotos();
  const photos = active ? all.filter((p) => p.tag === active) : all;
  const counts: Record<string, number> = {};
  for (const c of collections) if (c.key) counts[c.key] = all.filter((p) => p.tag === c.key).length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', name: title, url: `${siteUrl}${path}`, description: intro,
        isPartOf: { '@id': `${siteUrl}/#studio` },
        hasPart: photos.slice(0, 30).map((p) => ({
          '@type': 'ImageObject', contentUrl: `${siteUrl}${p.src}`, description: p.alt, width: p.width, height: p.height,
          creator: { '@type': 'Person', name: 'Oluwatosin Aremu' }, copyrightHolder: { '@id': `${siteUrl}/#studio` },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Work', item: `${siteUrl}/work` },
          ...(active ? [{ '@type': 'ListItem', position: 3, name: title, item: `${siteUrl}${path}` }] : []),
        ],
      },
    ],
  };

  return (
    <>
      <section className="wrap" style={{ paddingTop: 88, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h-display">{title}</h1>
        <p className="lede">{intro}</p>
      </section>
      <section className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }} aria-label="Photos">
        <WorkGallery photos={photos} counts={counts} active={active} />
      </section>
      <section className="band-dark">
        <div className="wrap cta-row" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <h2 className="h-section" style={{ flex: '1 1 520px' }}>See yourself here? <em>Let us plan your session.</em></h2>
          <Link href="/contact" className="btn btn-light">Book a session</Link>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
