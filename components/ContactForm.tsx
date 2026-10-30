'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { sendEnquiry, type FormState } from '@/lib/actions';
import { studio } from '@/lib/site';
import { CheckIcon } from './Icons';

const types = ['Portrait', 'Family', 'Event', 'Other'];

export default function ContactForm() {
  // Changing the key starts a fresh, empty form after a successful send.
  const [round, setRound] = useState(0);
  return <EnquiryForm key={round} onAgain={() => setRound((r) => r + 1)} />;
}

function EnquiryForm({ onAgain }: { onAgain: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendEnquiry, { ok: false });

  if (state.ok) {
    return (
      <div role="status" className="form-card" style={{ flex: '1.3 1 520px', minWidth: 0, alignSelf: 'flex-start', padding: '48px 40px', gap: 16 }}>
        <span className="ok-badge"><CheckIcon /></span>
        <h2 className="serif" style={{ margin: 0, fontSize: 44, lineHeight: 1.05 }}>Thank you, {state.firstName}.</h2>
        <p className="lede" style={{ fontSize: 17 }}>Your {state.type?.toLowerCase()} enquiry is with the studio. We’ve emailed a copy to {state.email} and will reply with availability and options.</p>
        <p style={{ margin: 0, color: 'var(--muted)' }}>Can’t wait? Call or WhatsApp <a href={`tel:${studio.phoneIntl}`} style={{ color: 'var(--oxblood)', fontWeight: 600 }}>{studio.phoneDisplay}</a>.</p>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <Link href="/work" className="btn btn-dark">See recent work</Link>
          <button type="button" className="btn btn-outline" onClick={onAgain}>Send another enquiry</button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="form-card" aria-label="Booking enquiry" style={{ flex: '1.3 1 520px', minWidth: 0 }}>
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <legend className="legend" style={{ fontSize: 14, marginBottom: 12 }}>What would you like to book?</legend>
        <div className="types">
          {types.map((t) => (
            <label className="type-opt" key={t}>
              <input type="radio" name="type" value={t} defaultChecked={t === 'Family'} />{t}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-grid">
        <div className="field"><label htmlFor="cn">Full name</label><input className="input" id="cn" name="name" autoComplete="name" required /></div>
        <div className="field"><label htmlFor="ce">Email</label><input className="input" id="ce" name="email" type="email" autoComplete="email" required /></div>
        <div className="field"><label htmlFor="cp">Phone / WhatsApp</label><input className="input" id="cp" name="phone" type="tel" autoComplete="tel" /></div>
        <div className="field"><label htmlFor="cd">Date</label><input className="input" id="cd" name="date" type="date" /></div>
        <div className="field"><label htmlFor="cl">Location / city</label><input className="input" id="cl" name="location" /></div>
        <div className="field"><label htmlFor="ch">How did you find us?</label>
          <select className="input" id="ch" name="source" defaultValue="Instagram"><option>Instagram</option><option>Google</option><option>A friend</option><option>Other</option></select>
        </div>
        <div className="field span-2"><label htmlFor="cm">Tell us about your moment</label><textarea className="input" id="cm" name="message" rows={5} /></div>
      </div>
      <div className="hp" aria-hidden><label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label></div>
      {state.error && <div role="alert" className="alert">{state.error}</div>}
      <button type="submit" className="btn btn-accent" style={{ alignSelf: 'flex-start', minHeight: 50, padding: '0 32px' }} disabled={pending}>
        {pending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
