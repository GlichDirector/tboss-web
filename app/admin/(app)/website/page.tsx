import Link from 'next/link';
import PageEditor from '@/components/admin/PageEditor';
import { getContent } from '@/lib/siteContent';
import { requireArea } from '@/lib/team';

const pages = [['home', 'Home'], ['about', 'About'], ['contact', 'Contact'], ['work', 'Work']] as const;

export default async function WebsitePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireArea('website');
  const { page = 'home' } = await searchParams;
  const p = pages.find(([k]) => k === page)?.[0] || 'home';
  const content = await getContent();
  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">Website</p><h1>Pages &amp; design</h1></div>
        <nav className="chips" aria-label="Choose a page">{pages.map(([k, l]) => <Link key={k} href={`/admin/website?page=${k}`} className="chip" aria-current={p === k ? 'page' : undefined}>{l}</Link>)}<Link href="/admin/journal" className="chip">Journal →</Link></nav>
      </div>
      <PageEditor key={p} page={p} initial={content[p] as Record<string, unknown>} />
    </>
  );
}
