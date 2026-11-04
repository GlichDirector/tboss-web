import type { Metadata } from 'next';
import Link from 'next/link';
import NominationForm from '@/components/NominationForm';
import Pic from '@/components/Pic';
import StoryCard from '@/components/StoryCard';
import { publishedStories, workPhotos } from '@/lib/journal';
import { siteUrl, studio } from '@/lib/site';
import { getContent } from '@/lib/siteContent';

// Rendered fresh on every visit, so changes made in the admin show immediately.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preserving Legacy · Nominate an elder for a heritage portrait',
  description: 'Nominate a parent, grandparent or elder aged 80+ in Southwest Nigeria for a sponsored heritage portrait and film session with Tboss Photography, and have their story told.',
  alternates: { canonical: '/preserving-legacy' },
  openGraph: { title: 'Preserving Legacy · Tboss Photography', description: 'Nominate an elder aged 80+ in Southwest Nigeria to be photographed, filmed and have their story told.', images: [{ url: '/photos/headwrap-elder/w1600.webp' }] },
};

export default async function PreservingLegacy() {
  const [content, stories, photos] = await Promise.all([getContent(), publishedStories(), workPhotos('Heritage')]);
  const c = content.legacy;
  const heritageStories = stories.filter((s) => s.category === 'Heritage').slice(0, 6);
  const paras = c.whyText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: 'Preserving Legacy', url: `${siteUrl}/preserving-legacy`, description: c.heroText, isPartOf: { '@id': `${siteUrl}/#studio` } },
      { '@type': 'FAQPage', mainEntity: c.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };

  return (
    <>
      <section className="band-dark lg-hero">
        <div className="wrap split" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <div className="text">
            <p className="eyebrow" style={{ color: '#E9C9A8' }}>{c.heroEyebrow}</p>
            <h1 className="h-display" style={{ fontSize: 'clamp(44px, 6vw, 84px)' }}>{c.heroTitle} <em>{c.heroTitleItalic}</em></h1>
            <p className="lede" style={{ color: '#D9D0C4' }}>{c.heroText}</p>
            <div className="btn-row">
              {c.open ? <a href="#nominate" className="btn btn-light">{c.ctaLabel}</a> : <span className="lg-closed">{c.closedText}</span>}
              <a href="#why" className="btn btn-outline-light">Read our story</a>
            </div>
            <p className="lg-facts"><span>Aged 80+</span><span>Southwest Nigeria</span><span>Photos &amp; film</span></p>
          </div>
          <div className="media lg-hero-img">
            <Pic src={c.heroImage} alt="Heritage portrait of an elder by Tboss Photography" priority sizes="(max-width: 760px) 100vw, 45vw" />
          </div>
        </div>
      </section>

      <section className="wrap split" id="why" aria-labelledby="why-h">
        <div className="media" style={{ flex: '1 1 380px', maxWidth: 520 }}>
          <Pic src={c.whyImage} alt="Elder photographed for the Heritage & Legacy Project" style={{ aspectRatio: '4 / 5' }} sizes="(max-width: 760px) 100vw, 520px" />
        </div>
        <div className="text">
          <p className="eyebrow">Why we do this</p>
          <h2 className="h-section" id="why-h">{c.whyTitle}</h2>
          {paras.map((p, i) => <p key={i} className={i === 0 ? 'lede' : undefined} style={i ? { margin: 0, color: 'var(--ink-2)', fontSize: 17, lineHeight: 1.7 } : undefined}>{p}</p>)}
          {c.whyQuote && <blockquote className="lg-quote">“{c.whyQuote}” <span>— {studio.owner}</span></blockquote>}
        </div>
      </section>

      <section className="band-sand" aria-labelledby="offer-h">
        <div className="wrap" style={{ paddingTop: 88, paddingBottom: 88, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <h2 className="h-section" id="offer-h">{c.offerTitle}</h2>
          <div className="lg-cards">
            {c.offers.map((o, i) => (
              <div key={i} className="lg-card"><span className="num">{String(i + 1).padStart(2, '0')}</span><h3>{o.title}</h3><p>{o.body}</p></div>
            ))}
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>{c.feeText ? `Sponsorship: ${c.feeText}` : 'The sponsorship fee is shared when we call you about your nomination.'}</p>
        </div>
      </section>

      {c.showStories && (heritageStories.length > 0 || photos.length > 0) && (
        <section className="wrap section" aria-labelledby="stories-h">
          <div className="section-head">
            <div>
              <p className="eyebrow">Stories</p>
              <h2 className="h-big" id="stories-h">{c.storiesTitle}</h2>
              {c.storiesText && <p className="lede" style={{ marginTop: 12 }}>{c.storiesText}</p>}
            </div>
            <Link href="/work/heritage" className="link-line">See all heritage portraits</Link>
          </div>
          {heritageStories.length > 0 && <div className="story-grid lg-stories" style={{ marginBottom: 32 }}>{heritageStories.map((s) => <StoryCard key={s.slug} story={s} />)}</div>}
          {photos.length > 0 && (
            <div className="lg-strip">
              {photos.slice(0, 8).map((p) => (
                <Link key={p.src} href={p.link || '/work/heritage'} className="lg-strip-item"><Pic src={p.src} alt={p.alt} width={p.width} height={p.height} blur={p.blur} sizes="(max-width: 760px) 50vw, 25vw" /></Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="band-dark" aria-labelledby="steps-h">
        <div className="wrap" style={{ paddingTop: 88, paddingBottom: 88, display: 'flex', flexDirection: 'column', gap: 36 }}>
          <h2 className="h-section" id="steps-h">{c.stepsTitle}</h2>
          <ol className="lg-steps">
            {c.steps.map((s, i) => <li key={i}><span className="num">{String(i + 1).padStart(2, '0')}</span><h3>{s.title}</h3><p>{s.body}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 88, paddingBottom: 40 }} aria-labelledby="who-h">
        <h2 className="h-section" id="who-h" style={{ marginBottom: 28 }}>{c.whoTitle}</h2>
        <ul className="lg-who">
          {c.who.map((w, i) => <li key={i}><strong>{w.title}</strong><span>{w.body}</span></li>)}
        </ul>
        <div className="lg-rights">
          <h3>{c.rightsTitle}</h3>
          <p>{c.rightsText}</p>
        </div>
      </section>

      <section className="wrap" id="nominate" style={{ paddingTop: 40, paddingBottom: 96, scrollMarginTop: 96 }}>
        {c.open ? (
          <NominationForm title={c.formTitle} intro={c.formIntro} feeText={c.feeText} rightsText={c.rightsText} />
        ) : (
          <div className="form-card lg-done"><h2 className="serif" style={{ margin: 0, fontSize: 40 }}>{c.formTitle}</h2><p className="lede" style={{ margin: 0 }}>{c.closedText}</p></div>
        )}
      </section>

      {c.faqs.length > 0 && (
        <section className="band-sand" aria-labelledby="lfaq-h">
          <div className="faq" style={{ maxWidth: 900, margin: '0 auto', padding: '88px 32px' }}>
            <h2 className="h-section" id="lfaq-h" style={{ marginBottom: 32 }}>Questions families ask</h2>
            {c.faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
        </section>
      )}

      <section className="band-dark">
        <div className="wrap cta-row" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <h2 className="h-section" style={{ flex: '1 1 520px' }}>{c.closingTitle}</h2>
          {c.open && <a href="#nominate" className="btn btn-light">{c.ctaLabel}</a>}
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
