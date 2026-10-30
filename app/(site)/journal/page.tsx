import type { Metadata } from 'next';
import Pic from '@/components/Pic';
import Link from 'next/link';
import StoryCard from '@/components/StoryCard';
import SubscribeForm from '@/components/SubscribeForm';
import { formatDate, readMinutes } from '@/lib/content';
import { publishedStories } from '@/lib/journal';

// Rendered fresh on every visit, so changes made in the admin show immediately.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Journal · Stories behind the sessions',
  description: 'Stories from recent portrait, family, wedding and heritage sessions by Tboss Photography in Ibadan.',
  alternates: { canonical: '/journal' },
};

const cats = ['Portraits', 'Events', 'Heritage', 'Guides & tips'] as const;

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const all = await publishedStories();
  const active = cats.find((x) => x === c);
  const stories = active ? all.filter((s) => s.category === active) : all;
  const [featured, ...rest] = stories;
  const present = cats.filter((x) => all.some((s) => s.category === x));

  return (
    <>
      <section className="wrap" style={{ paddingTop: 88, paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p className="eyebrow">The journal</p>
        <h1 className="h-display">Stories behind <em>the sessions.</em></h1>
        {present.length > 0 && (
          <nav className="chips" aria-label="Categories" style={{ marginTop: 12 }}>
            <Link href="/journal" className="chip" aria-current={!active ? 'page' : undefined}>All stories</Link>
            {present.map((x) => (
              <Link key={x} href={`/journal?c=${encodeURIComponent(x)}`} className="chip" aria-current={active === x ? 'page' : undefined}>{x}</Link>
            ))}
          </nav>
        )}
      </section>

      {!featured ? (
        <section className="wrap" style={{ paddingBottom: 100 }}>
          <div className="empty">
            <p className="serif" style={{ margin: '0 0 8px', fontSize: 30, color: 'var(--ink)' }}>The first stories are on their way.</p>
            <p style={{ margin: 0 }}>Subscribe below and we’ll email you when they’re published.</p>
          </div>
        </section>
      ) : (
        <>
          <section className="wrap" aria-label="Featured story" style={{ paddingTop: 24, paddingBottom: 72 }}>
            <Link href={`/journal/${featured.slug}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
              <Pic src={featured.cover.src} alt={featured.cover.alt} priority sizes="(max-width: 760px) 100vw, 60vw" style={{ flex: '1.3 1 520px', minWidth: 0, aspectRatio: '16 / 10', objectFit: 'cover', width: '100%' }} />
              <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span className="eyebrow" style={{ letterSpacing: '0.2em' }}>Featured · {featured.category}</span>
                <h2 className="serif" style={{ margin: 0, fontSize: 'clamp(34px, 4vw, 52px)', lineHeight: 1.08 }}>{featured.title}</h2>
                <p style={{ margin: 0, fontSize: 17, color: 'var(--muted)' }}>{featured.excerpt}</p>
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>{featured.location} · {formatDate(featured.date)} · {readMinutes(featured)} min read</span>
              </div>
            </Link>
          </section>
          {rest.length > 0 && (
            <section aria-label="All stories" style={{ borderTop: '1px solid var(--line)' }}>
              <div className="wrap story-grid" style={{ paddingTop: 72, paddingBottom: 100 }}>
                {rest.map((s) => <StoryCard key={s.slug} story={s} />)}
              </div>
            </section>
          )}
        </>
      )}

      <section className="band-sand">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '88px 32px', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', textAlign: 'center' }}>
          <h2 className="serif" style={{ margin: 0, fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1 }}>New stories in your inbox</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>One email when a new story is published. No spam.</p>
          <SubscribeForm />
        </div>
      </section>
    </>
  );
}
