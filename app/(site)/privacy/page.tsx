import type { Metadata } from 'next';
import { fullAddress, studio } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How Tboss Photography collects, uses and protects your personal information.',
  alternates: { canonical: '/privacy' },
};

// DRAFT for the studio to review. Not legal advice; have it checked before launch.
export default function PrivacyPage() {
  const h2 = { margin: '40px 0 12px', fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 30 } as const;
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '88px 32px 110px', fontSize: 17, lineHeight: 1.75, color: 'var(--ink-2)' }}>
      <p className="eyebrow">Privacy</p>
      <h1 className="h-section" style={{ margin: '12px 0 24px', color: 'var(--ink)' }}>How we look after your information</h1>
      <p>{studio.legalName} (“we”) collects only what we need to plan your session, deliver your photos and keep in touch. We follow the Nigeria Data Protection Act 2023.</p>
      <h2 style={h2}>What we collect</h2>
      <p>Your name, email address, phone number, session details and any message you send us; your photographs; and, if you sign in to a client gallery, your Google name and email. We also record which photos are downloaded and by which signed-in email, so we can support you.</p>
      <p>To understand which pages are useful, we count website visits: the page, the approximate country, the type of device and the website you came from. We don’t use cookies or advertising trackers for this, we don’t store your IP address, and these records are deleted after 13 months.</p>
      <h2 style={h2}>How we use it</h2>
      <p>To reply to enquiries, send invoices and booking confirmations, deliver your galleries, and, only if you subscribe, send new Journal stories. We never sell your information.</p>
      <h2 style={h2}>Your photographs</h2>
      <p>Galleries are private and shared only with people you give the link to. We only publish photos of you on our website or Instagram with your permission.</p>
      <h2 style={h2}>Who helps us</h2>
      <p>Trusted services store and send data for us: our web host (Hostinger), photo storage (Cloudflare), email delivery (Resend) and Google sign-in. Each only uses your data to provide that service.</p>
      <h2 style={h2}>How long we keep it</h2>
      <p>Galleries stay online until their expiry date. We keep booking and invoice records as long as the law requires.</p>
      <h2 style={h2}>Your choices</h2>
      <p>You can ask to see, correct or delete your information, or unsubscribe at any time. Email <a href={`mailto:${studio.email}`} style={{ borderBottom: '1px solid currentColor' }}>{studio.email}</a> or write to us at {fullAddress}.</p>
    </section>
  );
}
