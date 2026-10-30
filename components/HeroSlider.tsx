'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { heroSlides } from '@/lib/content';
import { ChevronLeft, ChevronRight } from './Icons';

export default function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = heroSlides.length;
  const cur = heroSlides[i];

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
      style={{ backgroundColor: cur.bg }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {heroSlides.map((s, k) => (
        <div
          key={s.src}
          className={k === i ? 'hero-slide on' : 'hero-slide'}
          style={{ backgroundImage: `url(${s.src})`, backgroundPosition: s.pos }}
          role="img"
          aria-label={s.alt}
          aria-hidden={k !== i}
        />
      ))}
      <div className="hero-shade" aria-hidden />
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <p className="eyebrow" aria-live="polite">{cur.eyebrow}</p>
          <h1>Portraits, families &amp; celebrations, <em>told with warmth.</em></h1>
          <p className="sub">A female-led studio in Ibadan creating honest, timeless images, wherever in the world your moment is.</p>
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
                <button key={s.src} type="button" className="dot-btn" aria-label={`Show photo ${k + 1} of ${n}`} aria-current={k === i} onClick={() => setI(k)}>
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
