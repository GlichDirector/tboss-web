import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import { ChatIcon } from '@/components/Icons';
import { getContent } from '@/lib/siteContent';
import { fullAddress, studio } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact & booking',
  description: `Book a portrait, family or event session with Tboss Photography in Ibadan. Call or WhatsApp ${studio.phoneDisplay} or send an enquiry.`,
  alternates: { canonical: '/contact' },
};

// Rendered fresh on every visit, so changes made in the admin show immediately.
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const c = (await getContent()).contact;
  const faqs = c.faqs;
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <>
      <section className="wrap" style={{ paddingTop: 88, paddingBottom: 100, display: 'flex', flexWrap: 'wrap', gap: 72 }}>
        <div style={{ flex: '1 1 380px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p className="eyebrow">Contact &amp; booking</p>
          <h1 className="serif" style={{ margin: 0, fontSize: 'clamp(48px, 6.4vw, 88px)', lineHeight: 1 }}>{c.title}</h1>
          <p className="lede" style={{ maxWidth: 440 }}>{c.intro} {c.replyTime ? `We reply within ${c.replyTime} with availability and options.` : 'We reply with availability and options as soon as we can.'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
            <div><div style={{ fontSize: 13, color: 'var(--muted)' }}>Email</div><a href={`mailto:${studio.email}`} style={{ fontSize: 17, borderBottom: '1px solid var(--line-strong)' }}>{studio.email}</a></div>
            <div><div style={{ fontSize: 13, color: 'var(--muted)' }}>Phone &amp; WhatsApp</div><a href={`tel:${studio.phoneIntl}`} style={{ fontSize: 17, borderBottom: '1px solid var(--line-strong)' }}>{studio.phoneDisplay}</a></div>
            <div><div style={{ fontSize: 13, color: 'var(--muted)' }}>Studio</div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 17 }}>{fullAddress}</a></div>
            <div><div style={{ fontSize: 13, color: 'var(--muted)' }}>Instagram</div><a href={studio.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 17 }}>{studio.instagramHandle}</a></div>
          </div>
          <a href={studio.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ alignSelf: 'flex-start' }}><ChatIcon />Chat on WhatsApp</a>
        </div>
        <ContactForm />
      </section>

      <section className="band-sand" aria-labelledby="faq-h">
        <div className="faq" style={{ maxWidth: 900, margin: '0 auto', padding: '96px 32px' }}>
          <h2 className="h-section" id="faq-h" style={{ marginBottom: 32 }}>Good to know</h2>
          {faqs.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </>
  );
}
