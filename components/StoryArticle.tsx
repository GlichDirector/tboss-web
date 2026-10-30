import Link from 'next/link';
import Pic from './Pic';
import ShareLinks from './ShareLinks';
import StoryCard from './StoryCard';
import { formatDate, readMinutes, type Story } from '@/lib/content';
import { publishedStories } from '@/lib/journal';
import { siteUrl, studio } from '@/lib/site';

// One Journal article. Used by the public page and the studio's draft preview.
export default async function StoryArticle({ story }: { story: Story }) {
  const url = `${siteUrl}/journal/${story.slug}`;
  const related = (await publishedStories()).filter((s) => s.slug !== story.slug).slice(0, 3);
  const images = [story.cover.src, ...story.body.flatMap((b) => (b.type === 'image' ? [b.src] : b.type === 'pair' ? b.images.map((im) => im.src) : []))];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: story.title,
        description: story.excerpt,
        image: [...new Set(images)].slice(0, 12).map((src) => `${siteUrl}${src}`),
        datePublished: story.date,
        author: { '@type': 'Person', name: studio.owner },
        publisher: { '@id': `${siteUrl}/#studio` },
        keywords: story.keywords.join(', '),
        articleSection: story.category,
        contentLocation: story.location ? { '@type': 'Place', name: story.location } : undefined,
        mainEntityOfPage: url,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Journal', item: `${siteUrl}/journal` },
          { '@type': 'ListItem', position: 3, name: story.title, item: url },
        ],
      },
    ],
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
          <Pic className="article-lead-img" src={story.cover.src} alt={story.cover.alt} priority sizes="(max-width: 1200px) 100vw, 1200px" />
        </div>
        <div className="article-body">
          <div className="prose">
            <p className="lead">{story.lead}</p>
            {story.body.map((b, i) => {
              switch (b.type) {
                case 'p': return <p key={i}>{b.text}</p>;
                case 'h2': return <h2 key={i}>{b.text}</h2>;
                case 'quote': return <blockquote key={i}>{b.text}</blockquote>;
                case 'image': return <figure key={i} className="wide" style={{ margin: 0 }}><Pic src={b.src} alt={b.alt} sizes="(max-width: 1100px) 100vw, 1100px" /></figure>;
                case 'pair': return <div key={i} className="pair">{b.images.map((im) => <Pic key={im.src} src={im.src} alt={im.alt} sizes="(max-width: 760px) 100vw, 550px" />)}</div>;
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
            </dl>
            <Link href="/contact" className="btn btn-dark">Book a session like this</Link>
            {story.category !== 'Guides & tips' && <Link href={`/work/${story.category.toLowerCase()}`} className="link-line">See more {story.category.toLowerCase()} work</Link>}
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
