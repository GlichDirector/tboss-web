'use client';

import { useActionState } from 'react';
import { subscribe, type FormState } from '@/lib/actions';

export default function SubscribeForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, { ok: false });
  if (state.ok) {
    return <p role="status" style={{ margin: 0, padding: '12px 20px', borderRadius: 999, background: '#E2EDE5', color: '#25573A', fontWeight: 600 }}>You’re subscribed. Look out for the next story in your inbox.</p>;
  }
  return (
    <form action={action} aria-label="Subscribe" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 480, justifyContent: 'center' }}>
      <label htmlFor="sub" className="sr-only">Email address</label>
      <input id="sub" name="email" type="email" autoComplete="email" placeholder="Your email" required className="input" style={{ flex: '1 1 240px', borderRadius: 999, padding: '0 18px', background: 'var(--paper)' }} />
      <div className="hp" aria-hidden><input name="company" tabIndex={-1} autoComplete="off" /></div>
      <button type="submit" className="btn btn-accent" disabled={pending}>{pending ? 'Subscribing…' : 'Subscribe'}</button>
      {state.error && <span role="alert" style={{ width: '100%', color: 'var(--oxblood)', fontSize: 14, fontWeight: 600 }}>{state.error}</span>}
    </form>
  );
}
