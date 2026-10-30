import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShareLinks from '@/components/ShareLinks';
import StoryCard from '@/components/StoryCard';
import { formatDate, getStories, getStory, readMinutes } from '@/lib/content';
import { siteUrl, studio } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getStories().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = getStory((await params).slug);
  if (!story) return {};
  return {
    title: story.title,
    description: story.excerpt,
    keywords: story.keywords,
    alternates: { canonical: `/journal/${story.slug}` },
    openGraph: { type: 'article', images: [{ url: story.cover.src, alt: story.cover.alt }], publishedTime: story.date },
    robots: story.sample ? { index: false } : undefined,
  };
}

export default async function StoryPage({ params }: Props) {
  const story = getStory((await params).slug);
  if (!story) notFound();
  const url = `${siteUrl}/journal/${story.slug}`;
  const related = getStories().filter((s) => s.slug !== story.slug).slice(0, 3);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: story.title,
    image: `${siteUrl}${story.cover.src}`,
    datePublished: story.date,
    author: { '@type': 'Person', name: studio.owner },
    publisher: { '@id': `${siteUrl}/#studio` },
    keywords: story.keywords.join(', '),
    mainEntityOfPage: url,
  };

  return (
    <>
      <article>
        <header className="article-head">
          <nav aria-label="Breadcrumb" className="crumbs">
            <Link href="/journal">Journal</Link> / <Link href={`/journal?c=${encodeURIComponent(story.category)}`}>{story.category}</Link>
          </nav>
          <h1>{story.title}</h1>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>By {studio.owner} · {formatDate(story.date)} · {readMinutes(story)} min read</span>
        </header>
        <div className="wrap">
          <img className="article-lead-img" src={story.cover.src} alt={story.cover.alt} />
        </div>
        <div className="article-body">
          <div className="prose">
            <p className="lead">{story.lead}</p>
            {story.body.map((b, i) => {
              switch (b.type) {
                case 'p': return <p key={i}>{b.text}</p>;
                case 'h2': return <h2 key={i}>{b.text}</h2>;
                case 'quote': return <blockquote key={i}>{b.text}</blockquote>;
                case 'image': return <figure key={i} className="wide" style={{ margin: 0 }}><img src={b.src} alt={b.alt} loading="lazy" /></figure>;
                case 'pair': return <div key={i} className="pair">{b.images.map((im) => <img key={im.src} src={im.src} alt={im.alt} loading="lazy" />)}</div>;
              }
            })}
            {story.keywords.length > 0 && <div className="tags">{story.keywords.map((k) => <span key={k}>{k}</span>)}</div>}
          </div>
          <aside className="aside-card" aria-label="Session details">
            <h2>Session details</h2>
            <dl>
              <div><dt>Location</dt><dd>{story.location}</dd></div>
              {story.session && <div><dt>Session</dt><dd>{story.session}</dd></div>}
              {story.styling && <div><dt>Styling</dt><dd>{story.styling}</dd></div>}
              {story.instagramUrl && <div><dt>Instagram</dt><dd><a href={story.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ borderBottom: '1px solid currentColor' }}>View original post</a></dd></div>}
            </dl>
            <Link href="/contact" className="btn btn-dark">Book a session like this</Link>
            <ShareLinks url={url} title={story.title} />
          </aside>
        </div>
      </article>
      {related.length > 0 && (
        <section aria-label="More stories" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="wrap" style={{ paddingTop: 80, paddingBottom: 100 }}>
            <h2 className="serif" style={{ margin: '0 0 36px', fontSize: 44 }}>More stories</h2>
            <div className="story-grid">{related.map((s) => <StoryCard key={s.slug} story={s} />)}</div>
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
