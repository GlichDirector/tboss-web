import Link from 'next/link';
import Pic from './Pic';
import { collections, type Collection } from '@/lib/content';
import type { WorkItem } from '@/lib/journal';

// The Work grid. Category chips are real links (/work/portraits …) so Google can crawl each one.
export default function WorkGallery({ photos, counts, active }: { photos: WorkItem[]; counts: Record<string, number>; active: Collection | null }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <>
      <nav className="chips" aria-label="Collections">
        {collections.filter((c) => !c.key || counts[c.key]).map((c) => (
          <Link key={c.label} href={c.slug ? `/work/${c.slug}` : '/work'} className="chip" aria-current={c.key === active ? 'page' : undefined}>
            {c.label} <span className="count">{c.key ? counts[c.key] : total}</span>
          </Link>
        ))}
      </nav>
      <div className="photo-grid" style={{ marginTop: 32 }}>
        {photos.map((p, i) => {
          const img = <Pic src={p.src} alt={p.alt} width={p.width} height={p.height} blur={p.blur} priority={i < 2} sizes="(max-width: 760px) 50vw, (max-width: 1200px) 33vw, 400px" />;
          return (
            <figure className="photo-card" key={p.src} style={{ margin: 0 }}>
              <div className="frame">{p.link ? <Link href={p.link}>{img}</Link> : img}</div>
              <figcaption className="tag" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                {p.tag}{p.link && <Link href={p.link} style={{ color: 'var(--oxblood)', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>Read the story</Link>}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </>
  );
}
