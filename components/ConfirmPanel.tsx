'use client';

import { useState, useTransition } from 'react';
import { changeAction, confirmAction } from '@/app/confirm/[token]/actions';
import { CheckIcon } from './Icons';

export default function ConfirmPanel({ token, confirmed, changeRequested }: { token: string; confirmed: boolean; changeRequested: string | null }) {
  const [state, setState] = useState<'idle' | 'confirmed' | 'change' | 'asked'>(confirmed ? 'confirmed' : changeRequested ? 'asked' : 'idle');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();

  if (state === 'confirmed') return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <span className="ok-badge"><CheckIcon /></span>
      <h2 className="serif" style={{ margin: 0, fontSize: 32 }}>You’re confirmed</h2>
      <p style={{ margin: 0, color: 'var(--muted)' }}>Thank you. We’ll send a reminder the day before.</p>
    </div>
  );
  if (state === 'asked') return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <h2 className="serif" style={{ margin: 0, fontSize: 30 }}>We’ve got your request</h2>
      <p style={{ margin: 0, color: 'var(--muted)' }}>The studio will get back to you with a new time. Changed your mind?</p>
      <button type="button" className="btn btn-accent" disabled={busy} onClick={() => start(async () => { const r = await confirmAction(token); if (r.ok) setState('confirmed'); })}>Confirm the original time</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {state === 'idle' && (
        <>
          <button type="button" className="btn btn-accent" disabled={busy} onClick={() => start(async () => { const r = await confirmAction(token); if (r.ok) setState('confirmed'); else setErr(r.error || ''); })}>{busy ? 'Confirming…' : 'Confirm date & time'}</button>
          <button type="button" className="btn btn-outline" onClick={() => setState('change')}>Request a change</button>
        </>
      )}
      {state === 'change' && (
        <>
          <label htmlFor="chg" style={{ fontWeight: 600, textAlign: 'left' }}>Which day or time works better?</label>
          <textarea id="chg" className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Saturday afternoon, or any day after the 20th" />
          <button type="button" className="btn btn-accent" disabled={busy} onClick={() => start(async () => { const r = await changeAction(token, text); if (r.ok) setState('asked'); else setErr(r.error || ''); })}>Send request</button>
          <button type="button" className="btn btn-outline" onClick={() => setState('idle')}>Back</button>
        </>
      )}
      {err && <div role="alert" className="alert">{err}</div>}
    </div>
  );
}
