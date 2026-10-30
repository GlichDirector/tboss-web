'use client';
import { useState, useTransition } from 'react';
import { acceptAction } from '@/app/admin/team-actions';
export default function AcceptInvite({ token }: { token: string }) {
  const [busy, start] = useTransition();
  const [err, setErr] = useState('');
  return (
    <>
      <button type="button" className="btn btn-accent" disabled={busy} onClick={() => start(async () => { const r = await acceptAction(token); if (r?.error) setErr(r.error); })}>{busy ? 'Joining…' : 'Accept & open the studio'}</button>
      {err && <div role="alert" className="alert">{err}</div>}
    </>
  );
}
