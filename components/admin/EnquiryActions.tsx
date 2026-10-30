'use client';

import { useTransition } from 'react';
import { convertEnquiryAction, enquiryStatusAction } from '@/app/admin/studio-actions';

export default function EnquiryActions({ id, status, email, phone }: { id: number; status: string; email: string; phone: string | null }) {
  const [busy, start] = useTransition();
  const wa = phone ? `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '234')}` : null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {status !== 'converted' && <button type="button" className="btn btn-accent a-sm" disabled={busy} onClick={() => start(() => convertEnquiryAction(id))}>Make client &amp; start order</button>}
      <a className="btn btn-outline a-sm" href={`mailto:${email}?subject=${encodeURIComponent('Your Tboss Photography enquiry')}`} onClick={() => { if (status === 'new') start(() => enquiryStatusAction(id, 'replied')); }}>Reply by email</a>
      {wa && <a className="btn btn-outline a-sm" href={wa} target="_blank" rel="noopener noreferrer" onClick={() => { if (status === 'new') start(() => enquiryStatusAction(id, 'replied')); }}>WhatsApp</a>}
      {status === 'new' && <button type="button" className="a-link" onClick={() => start(() => enquiryStatusAction(id, 'replied'))}>Mark replied</button>}
      {status !== 'archived' && status !== 'converted' && <button type="button" className="a-link" style={{ color: 'var(--muted)' }} onClick={() => start(() => enquiryStatusAction(id, 'archived'))}>Archive</button>}
      {status === 'archived' && <button type="button" className="a-link" onClick={() => start(() => enquiryStatusAction(id, 'new'))}>Restore</button>}
    </div>
  );
}
