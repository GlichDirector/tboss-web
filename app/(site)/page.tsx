import Link from 'next/link';
import HeroSlider from '@/components/HeroSlider';
import StoryCard from '@/components/StoryCard';
import { PersonIcon, QuoteMark } from '@/components/Icons';
import { getStories, photos, services, testimonial } from '@/lib/content';
import { replyLine, studio } from '@/lib/site';

export default function Home() {
  const stories = getStories().slice(0, 3);
  const work = photos.slice(0, 8);
  const mini = ['/photos/couple-rings.jpg', '/photos/lace-hands.jpg', '/photos/white-hat-teal.jpg', '/photos/elder-flowers.jpg', '/photos/couple-cream.jpg', '/photos/headwrap-elder-profile.jpg'];

  return (
    <>
      <HeroSlider />

      <section className="services" aria-label="What we photograph">
        <div className="wrap grid">
          {services.map((s) => (
            <div className="service" key={s.num}>
              <span className="num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section" aria-labelledby="work-h">
        <div className="section-head">
          <div>
            <p className="eyebrow">Selected work</p>
            <h2 className="h-big" id="work-h">Fresh from <em>{studio.instagramHandle}</em></h2>
          </div>
          <Link href="/work" className="link-line">View the full portfolio</Link>
        </div>
        <div className="photo-grid">
          {work.map((p) => (
            <Link href="/work" className="photo-card" key={p.src}>
              <div className="frame"><img src={p.src} alt={p.alt} loading="lazy" /></div>
              <span className="tag">{p.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="band-sand">
        <div className="wrap split">
          <div className="media" style={{ maxWidth: 520 }}>
            <img src="/photos/green-pleats.jpg" alt="Studio portrait by Tboss Photography" style={{ aspectRatio: '4 / 5' }} loading="lazy" />
          </div>
          <div className="text">
            <p className="eyebrow">About the studio</p>
            <h2 className="h-section">Behind the lens is <em>{studio.owner}.</em></h2>
            <p className="lede">Tboss Photography documents portraits, families and celebrations from our home in Ibadan to destinations around the world. Every session is guided gently, so you can simply be yourselves.</p>
            <Link href="/about" className="link-line">Read our story</Link>
          </div>
        </div>
      </section>

      <section className="wrap split" aria-labelledby="heritage-h">
        <div className="text">
          <p className="eyebrow">Giving back</p>
          <h2 className="h-section" id="heritage-h">The Heritage &amp; Legacy Project</h2>
          <p className="lede">Our ongoing work documenting elders, old houses and traditions before they fade, preserving stories for the generations after us.</p>
          <Link href="/work?c=Heritage" className="link-line">Explore the project</Link>
        </div>
        <div className="media" style={{ flex: '1.4 1 520px' }}>
          <img src="/photos/hero-4.jpg" alt="Elder in a colourful headwrap and pearls" style={{ aspectRatio: '16 / 10' }} loading="lazy" />
        </div>
      </section>

      <section className="band-dark" aria-labelledby="galleries-h">
        <div className="wrap split">
          <div className="text">
            <p className="eyebrow">For our clients</p>
            <h2 className="h-section" id="galleries-h">Your gallery, <em>beautifully delivered.</em></h2>
            <p className="lede">Open the link we send you and your photos are right there. Sign in with Google only when you want to save favourites or download.</p>
            <div className="btn-row" style={{ alignItems: 'center', marginTop: 8 }}>
              <Link href="/galleries" className="btn btn-light"><PersonIcon />Client galleries</Link>
            </div>
          </div>
          <div className="media mini-grid">
            {mini.map((src) => <img key={src} src={src} alt="" loading="lazy" />)}
          </div>
        </div>
      </section>

      {stories.length > 0 && (
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

      {testimonial && (
        <section className="quote-band" aria-label="Kind words">
          <div className="inner">
            <QuoteMark />
            <p className="serif" style={{ margin: 0, fontStyle: 'italic', fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: 1.25 }}>{testimonial.quote}</p>
            <span style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>{testimonial.name} · {testimonial.session}</span>
          </div>
        </section>
      )}

      <section className="wrap cta-row" style={{ borderTop: '1px solid var(--line)' }}>
        <div style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p className="eyebrow">Let us create together</p>
          <h2 className="serif" style={{ margin: 0, fontSize: 'clamp(44px, 5.6vw, 76px)', lineHeight: 1 }}>Tell us about your <em>moment.</em></h2>
          <p className="lede">Share a few details. {replyLine()}</p>
        </div>
        <div className="btn-row">
          <Link href="/contact" className="btn btn-accent">Start your booking</Link>
          <a href={studio.whatsapp} className="btn btn-outline" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
        </div>
      </section>
    </>
  );
}
