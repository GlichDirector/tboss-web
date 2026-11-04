'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveNominationAction } from '@/app/admin/legacy-actions';

export default function NominationTools({ id, status, notes, statuses, phone, email, elder }: {
  id: number; status: string; notes: string | null; statuses: readonly (readonly [string, string])[]; phone: string; email: string; elder: string;
}) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [n, setN] = useState(notes || '');
  const [msg, setMsg] = useState('');
  const [busy, start] = useTransition();
  const wa = phone.replace(/\D/g, '').replace(/^0/, '234');
  const save = (next = s) => start(async () => { const r = await saveNominationAction(id, next, n); setMsg(r.ok || r.error || ''); router.refresh(); });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <a className="btn btn-outline a-sm" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello, this is Tboss Photography. Thank you for nominating ${elder} for Preserving Legacy.`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a className="btn btn-outline a-sm" href={`tel:${phone}`}>Call</a>
        <a className="btn btn-outline a-sm" href={`mailto:${email}?subject=${encodeURIComponent(`Your Preserving Legacy nomination for ${elder}`)}`}>Email</a>
        <label className="a-sub" htmlFor={`st${id}`} style={{ marginLeft: 'auto' }}>Status</label>
        <select id={`st${id}`} className="input" style={{ width: 'auto' }} value={s} onChange={(e) => { setS(e.target.value); save(e.target.value); }} disabled={busy}>
          {statuses.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`nt${id}`} className="a-hint">Studio notes (only the team sees these)</label>
        <textarea id={`nt${id}`} className="input" rows={2} value={n} onChange={(e) => setN(e.target.value)} onBlur={() => n !== (notes || '') && save()} placeholder="e.g. Called 4 Nov, shoot on 20 Nov at her home in Bodija" />
      </div>
      {msg && <span className="a-hint" role="status">{msg}</span>}
    </div>
  );
}
