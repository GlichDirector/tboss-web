import Link from 'next/link';
import HeroSlider from '@/components/HeroSlider';
import StoryCard from '@/components/StoryCard';
import { PersonIcon, QuoteMark } from '@/components/Icons';
import { getContent } from '@/lib/siteContent';
import { publishedStories, workPhotos } from '@/lib/journal';
import { studio } from '@/lib/site';

export const revalidate = 300;

export default async function Home() {
  const [c, allStories, photos] = await Promise.all([getContent(), publishedStories(), workPhotos()]);
  const h = c.home;
  const stories = allStories.slice(0, 3);
  const work = photos.slice(0, 8);
  const mini = ['/photos/couple-rings.jpg', '/photos/lace-hands.jpg', '/photos/white-hat-teal.jpg', '/photos/elder-flowers.jpg', '/photos/couple-cream.jpg', '/photos/headwrap-elder-profile.jpg'];

  return (
    <>
      <HeroSlider slides={h.slides} title={h.heroTitle} titleItalic={h.heroTitleItalic} sub={h.heroSub} />

      {h.showServices && <section className="services" aria-label="What we photograph">
        <div className="wrap grid">
          {h.services.map((s, i) => (
            <div className="service" key={i}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>}

      {h.showWork && <section className="wrap section" aria-labelledby="work-h">
        <div className="section-head">
          <div>
            <p className="eyebrow">Selected work</p>
            <h2 className="h-big" id="work-h">{h.workTitle}</h2>
          </div>
          <Link href="/work" className="link-line">View the full portfolio</Link>
        </div>
        <div className="photo-grid">
          {work.map((p) => (
            <Link href={p.link || '/work'} className="photo-card" key={p.src}>
              <div className="frame"><img src={p.src} alt={p.alt} loading="lazy" /></div>
              <span className="tag">{p.tag}</span>
            </Link>
          ))}
        </div>
      </section>}

      {h.showAbout && <section className="band-sand">
        <div className="wrap split">
          <div className="media" style={{ maxWidth: 520 }}>
            <img src={h.aboutImage} alt="Studio portrait by Tboss Photography" style={{ aspectRatio: '4 / 5' }} loading="lazy" />
          </div>
          <div className="text">
            <p className="eyebrow">About the studio</p>
            <h2 className="h-section">{h.aboutTitle}</h2>
            <p className="lede">{h.aboutText}</p>
            <Link href="/about" className="link-line">Read our story</Link>
          </div>
        </div>
      </section>}

      {h.showHeritage && <section className="wrap split" aria-labelledby="heritage-h">
        <div className="text">
          <p className="eyebrow">Giving back</p>
          <h2 className="h-section" id="heritage-h">{h.heritageTitle}</h2>
          <p className="lede">{h.heritageText}</p>
          <Link href="/work?c=Heritage" className="link-line">Explore the project</Link>
        </div>
        <div className="media" style={{ flex: '1.4 1 520px' }}>
          <img src={h.heritageImage} alt="Heritage portrait by Tboss Photography" style={{ aspectRatio: '16 / 10' }} loading="lazy" />
        </div>
      </section>}

      {h.showGalleries && <section className="band-dark" aria-labelledby="galleries-h">
        <div className="wrap split">
          <div className="text">
            <p className="eyebrow">For our clients</p>
            <h2 className="h-section" id="galleries-h">{h.galleriesTitle}</h2>
            <p className="lede">{h.galleriesText}</p>
            <div className="btn-row" style={{ alignItems: 'center', marginTop: 8 }}>
              <Link href="/galleries" className="btn btn-light"><PersonIcon />Client galleries</Link>
            </div>
          </div>
          <div className="media mini-grid">
            {mini.map((src) => <img key={src} src={src} alt="" loading="lazy" />)}
          </div>
        </div>
      </section>}

      {h.showJournal && stories.length > 0 && (
        <section className="wrap section" aria-labelledby="journal-h">
          <div className="section-head">
            <div>
              <p className="eyebrow">The journal</p>
              <h2 className="h-big" id="journal-h">Stories from recent sessions</h2>
            </div>
            <Link href="/journal" className="link-line">All stories</Link>
          </div>
          <div className="story-grid">
            {stories.map((s) => <StoryCard key={s.slug} story={s} />)}
          </div>
        </section>
      )}

      {h.testimonialQuote && (
        <section className="quote-band" aria-label="Kind words">
          <div className="inner">
            <QuoteMark />
            <p className="serif" style={{ margin: 0, fontStyle: 'italic', fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: 1.25 }}>{h.testimonialQuote}</p>
            <span style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>{[h.testimonialName, h.testimonialSession].filter(Boolean).join(' · ')}</span>
          </div>
        </section>
      )}

      <section className="wrap cta-row" style={{ borderTop: '1px solid var(--line)' }}>
        <div style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p className="eyebrow">Let us create together</p>
          <h2 className="serif" style={{ margin: 0, fontSize: 'clamp(44px, 5.6vw, 76px)', lineHeight: 1 }}>{h.ctaTitle}</h2>
          <p className="lede">{h.ctaText} {c.contact.replyTime ? `We reply within ${c.contact.replyTime} with availability and options.` : 'We reply with availability and options as soon as we can.'}</p>
        </div>
        <div className="btn-row">
          <Link href="/contact" className="btn btn-accent">Start your booking</Link>
          <a href={studio.whatsapp} className="btn btn-outline" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
        </div>
      </section>
    </>
  );
}
