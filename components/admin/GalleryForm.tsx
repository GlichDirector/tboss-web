'use client';

import { useActionState } from 'react';
import type { FormResult } from '@/app/admin/actions';

type Values = {
  title?: string; client_name?: string; client_emails?: string; session_date?: string | null; location?: string | null;
  selection_limit?: number; extra_price?: string | null; choose_by?: string | null; expires_on?: string | null;
};

export default function GalleryForm({ action, values = {}, submitLabel }: { action: (p: FormResult, f: FormData) => Promise<FormResult>; values?: Values; submitLabel: string }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="a-card a-form">
      <div className="a-grid">
        <div className="field"><label htmlFor="client_name">Client name</label><input className="input" id="client_name" name="client_name" defaultValue={values.client_name} placeholder="e.g. The Adeyemi family" required /></div>
        <div className="field"><label htmlFor="title">Session</label><input className="input" id="title" name="title" defaultValue={values.title} placeholder="e.g. Family session" required /></div>
        <div className="field span-2"><label htmlFor="client_emails">Client emails</label><input className="input" id="client_emails" name="client_emails" defaultValue={values.client_emails} placeholder="one@email.com, another@email.com" required /><span className="a-hint">People with these emails can sign in with Google to see this gallery. Separate several with commas.</span></div>
        <div className="field"><label htmlFor="session_date">Session date</label><input className="input" type="date" id="session_date" name="session_date" defaultValue={values.session_date || ''} /></div>
        <div className="field"><label htmlFor="location">Location</label><input className="input" id="location" name="location" defaultValue={values.location || ''} placeholder="e.g. Tboss studio, Ibadan" /></div>
        <div className="field"><label htmlFor="selection_limit">Photos included in package</label><input className="input" type="number" min={0} id="selection_limit" name="selection_limit" defaultValue={values.selection_limit ?? ''} placeholder="e.g. 15" /></div>
        <div className="field"><label htmlFor="extra_price">Price per extra photo</label><input className="input" id="extra_price" name="extra_price" defaultValue={values.extra_price || ''} placeholder="e.g. ₦5,000" /></div>
        <div className="field"><label htmlFor="choose_by">Client chooses by</label><input className="input" type="date" id="choose_by" name="choose_by" defaultValue={values.choose_by || ''} /></div>
        <div className="field"><label htmlFor="expires_on">Gallery closes on</label><input className="input" type="date" id="expires_on" name="expires_on" defaultValue={values.expires_on || ''} /><span className="a-hint">Leave empty to keep it open.</span></div>
      </div>
      {state.error && <div role="alert" className="alert">{state.error}</div>}
      {state.ok && <div role="status" className="a-ok">Saved.</div>}
      <button type="submit" className="btn btn-accent" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Saving…' : submitLabel}</button>
    </form>
  );
}
