import type { Metadata } from 'next';
import WorkPageBody from '@/components/WorkPageBody';
import { getContent } from '@/lib/siteContent';

// Rendered fresh on every visit, so changes made in the admin show immediately.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Portfolio · Portrait, event and heritage photography in Ibadan',
  description: 'Portraits, weddings, events and heritage portraits by Tboss Photography, a female-led photography studio in Ibadan, Oyo State.',
  alternates: { canonical: '/work' },
};

export default async function WorkPage() {
  const content = await getContent();
  return <WorkPageBody active={null} eyebrow="Portfolio" title="The work" intro={content.work.intro} path="/work" />;
}
