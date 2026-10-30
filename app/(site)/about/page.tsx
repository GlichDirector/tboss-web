import type { Metadata } from 'next';
import Pic from '@/components/Pic';
import Link from 'next/link';
import { getContent } from '@/lib/siteContent';
import { studio } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About · Oluwatosin Aremu and the studio',
  description: 'Meet Oluwatosin Aremu, the photographer behind Tboss Photography in Ibadan, and see how a session works from first message to final gallery.',
  alternates: { canonical: '/about' },
};

export const revalidate = 300;

export default async function AboutPage() {
  const a = (await getContent()).about;
  return (
    <>
      <section className="wrap split" style={{ paddingTop: 88 }}>
        <div className="text">
          <p className="eyebrow">About Tboss Photography</p>
          <h1 className="serif" style={{ margin: 0, fontSize: 'clamp(48px, 6.4vw, 88px)', lineHeight: 1 }}>{a.title}</h1>
          <p className="lede" style={{ fontSize: 19 }}>{a.intro}</p>
          {a.story && <p className="lede" style={{ fontSize: 19 }}>{a.story}</p>}
        </div>
        <div className="media" style={{ maxWidth: 560 }}>
          <Pic src={a.image} alt="Oluwatosin Aremu, Tboss Photography" style={{ aspectRatio: '4 / 5' }} priority sizes="(max-width: 760px) 100vw, 520px" />
        </div>
      </section>

      <section className="band-sand" aria-labelledby="approach-h">
        <div className="wrap" style={{ paddingTop: 100, paddingBottom: 100 }}>
          <h2 className="h-section" id="approach-h" style={{ marginBottom: 48, maxWidth: 720 }}>{a.valuesTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 40 }}>
            {a.values.map((v, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--line-strong)', paddingTop: 24 }}>
                <h3 className="serif" style={{ margin: 0, fontSize: 30 }}>{v.title}</h3>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap" aria-labelledby="process-h" style={{ paddingTop: 110, paddingBottom: 110 }}>
        <p className="eyebrow" style={{ marginBottom: 12 }}>What to expect</p>
        <h2 className="h-section" id="process-h" style={{ marginBottom: 56 }}>{a.stepsTitle}</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 32 }}>
          {a.steps.map((s, i) => (
            <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="serif" style={{ fontSize: 56, lineHeight: 1, color: 'var(--oxblood)' }}>{String(i + 1).padStart(2, '0')}</span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{s.title}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 15 }}>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {a.showHeritage && <section className="band-dark" aria-labelledby="heritage-h">
        <div className="wrap split">
          <div className="media" style={{ flex: '1.3 1 520px' }}>
            <Pic src={a.heritageImage} alt="Heritage portrait by Tboss Photography" style={{ aspectRatio: '16 / 10', objectPosition: 'center 20%' }} sizes="(max-width: 760px) 100vw, 60vw" />
          </div>
          <div className="text">
            <p className="eyebrow">Giving back</p>
            <h2 className="h-section" id="heritage-h">The Heritage &amp; Legacy Project</h2>
            <p className="lede">{a.heritageText}</p>
            <Link href="/work/heritage" className="link-line">See the heritage portraits</Link>
          </div>
        </div>
      </section>}

      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '110px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <p className="eyebrow">Based in Ibadan · Available worldwide</p>
        <h2 className="serif" style={{ margin: 0, fontSize: 'clamp(40px, 5.4vw, 72px)', lineHeight: 1.02 }}>{a.ctaTitle}</h2>
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <Link href="/contact" className="btn btn-dark">Book a session</Link>
          <Link href="/work" className="btn btn-outline">See the work</Link>
        </div>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Or call {studio.phoneDisplay}</p>
      </section>
    </>
  );
}
