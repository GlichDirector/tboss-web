'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from './Icons';
import { srcSetFor } from '@/lib/images';

type Slide = { src: string; alt: string; eyebrow: string; caption: string; pos: string };

export default function HeroSlider({ slides: heroSlides, title, titleItalic, sub }: { slides: Slide[]; title: string; titleItalic: string; sub: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = heroSlides.length;
  const cur = heroSlides[i % n] || heroSlides[0];
  // Only the first photo loads with the page; the next one is fetched just before it is shown.
  const [ready, setReady] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => {
    const t = setTimeout(() => setReady((r) => (r.has(i) && r.has((i + 1) % n) ? r : new Set([...r, i, (i + 1) % n]))), i === 0 ? 2500 : 0);
    return () => clearTimeout(t);
  }, [i, n]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (paused || reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured photographs"
      style={{ backgroundColor: '#3A322B' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {heroSlides.map((s, k) => (
        <div key={`${s.src}-${k}`} className={k === i ? 'hero-slide on' : 'hero-slide'} aria-hidden={k !== i}>
          {(ready.has(k) || k === i) && (
            <img
              src={s.src}
              srcSet={srcSetFor(s.src)}
              sizes="100vw"
              alt={s.alt}
              style={{ objectPosition: s.pos }}
              fetchPriority={k === 0 ? 'high' : 'low'}
              loading={k === 0 ? 'eager' : 'lazy'}
              decoding={k === 0 ? 'sync' : 'async'}
            />
          )}
        </div>
      ))}
      <div className="hero-shade" aria-hidden />
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <p className="eyebrow" aria-live="polite">{cur.eyebrow}</p>
          <h1>{title} <em>{titleItalic}</em></h1>
          <p className="sub">{sub}</p>
          <div className="btn-row">
            <Link href="/contact" className="btn btn-light">Book a session</Link>
            <Link href="/work" className="btn btn-outline-light">See the work</Link>
          </div>
        </div>
        <div className="hero-ctrl">
          <span className="cap">{cur.caption}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" className="round-btn" aria-label="Previous photo" onClick={() => setI((i - 1 + n) % n)}><ChevronLeft /></button>
            <div style={{ display: 'flex', gap: 2 }}>
              {heroSlides.map((s, k) => (
                <button key={`${s.src}-${k}`} type="button" className="dot-btn" aria-label={`Show photo ${k + 1} of ${n}`} aria-current={k === i} onClick={() => setI(k)}>
                  <span style={{ width: k === i ? 28 : 12, background: k === i ? '#FBF8F3' : 'rgba(251,248,243,0.45)' }} />
                </button>
              ))}
            </div>
            <button type="button" className="round-btn" aria-label="Next photo" onClick={() => setI((i + 1) % n)}><ChevronRight /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
