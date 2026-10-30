import type { Metadata } from 'next';
import Link from 'next/link';
import WorkGrid from '@/components/WorkGrid';
import { collections, type Collection } from '@/lib/content';
import { studio } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Portfolio · Portrait, wedding and heritage photography',
  description: 'Portraits, weddings, events and heritage portraits by Tboss Photography, a photography studio in Ibadan, Oyo State.',
  alternates: { canonical: '/work' },
};

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const initial = (collections.find((g) => g.key === c)?.key ?? null) as Collection | null;

  return (
    <>
      <section className="wrap" style={{ paddingTop: 88, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p className="eyebrow">Portfolio</p>
        <h1 className="h-display">The work</h1>
        <p className="lede">
          Recent photographs from the studio and on location. New posts on{' '}
          <a href={studio.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ borderBottom: '1px solid currentColor' }}>{studio.instagramHandle}</a>{' '}
          will appear here automatically.
        </p>
      </section>
      <section className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }} aria-label="Photos">
        <WorkGrid initial={initial} />
      </section>
      <section className="band-dark">
        <div className="wrap cta-row" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <h2 className="h-section" style={{ flex: '1 1 520px' }}>See yourself here? <em>Let us plan your session.</em></h2>
          <Link href="/contact" className="btn btn-light">Book a session</Link>
        </div>
      </section>
    </>
  );
}
