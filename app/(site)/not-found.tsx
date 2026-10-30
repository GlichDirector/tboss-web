import Link from 'next/link';

export default function NotFound() {
  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '140px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      <p className="eyebrow">Page not found</p>
      <h1 className="h-section">This page has moved, <em>or never was.</em></h1>
      <p className="lede">Try the work, the journal, or get in touch.</p>
      <div className="btn-row" style={{ justifyContent: 'center' }}>
        <Link href="/" className="btn btn-dark">Back to home</Link>
        <Link href="/contact" className="btn btn-outline">Contact us</Link>
      </div>
    </section>
  );
}
