'use client';

import { useActionState, useTransition } from 'react';
import { inviteAction, removeAction, roleAction, type R } from '@/app/admin/team-actions';

const roles = [['assistant', 'Assistant'], ['editor', 'Editor'], ['bookkeeper', 'Bookkeeper'], ['full', 'Full access']] as const;

export function InviteForm({ help }: { help: Record<string, string> }) {
  const [state, run, pending] = useActionState<R, FormData>(inviteAction, {});
  return (
    <form action={run} className="a-card a-form" style={{ maxWidth: 'none' }}>
      <h2 className="a-h2">Invite a team member</h2>
      <div className="a-grid a-grid3">
        <div className="field"><label htmlFor="iname">Name</label><input className="input" id="iname" name="name" /></div>
        <div className="field"><label htmlFor="iemail">Their Google email</label><input className="input" id="iemail" name="email" type="email" required /></div>
        <div className="field"><label htmlFor="irole">Role</label><select className="input" id="irole" name="role" defaultValue="assistant">{roles.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      </div>
      <ul className="a-sub" style={{ margin: 0, paddingLeft: 18 }}>{roles.map(([k, l]) => <li key={k}><strong>{l}:</strong> {help[k]}</li>)}</ul>
      {state.error && <div role="alert" className="alert">{state.error}</div>}
      {state.ok && <div role="status" className="a-ok" style={{ wordBreak: 'break-all' }}>{state.ok}</div>}
      <button type="submit" className="btn btn-accent a-sm" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Sending…' : 'Send invite'}</button>
    </form>
  );
}

export function MemberRow({ id, role, pending }: { id: number; role: string; pending: boolean }) {
  const [busy, start] = useTransition();
  return (
    <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <select className="input" aria-label="Role" style={{ minHeight: 36, width: 'auto' }} defaultValue={role} disabled={busy} onChange={(e) => start(() => roleAction(id, e.target.value))}>
        {roles.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <button type="button" className="a-link a-danger" disabled={busy} onClick={() => { if (confirm(pending ? 'Cancel this invite?' : 'Remove this person from the team?')) start(() => removeAction(id)); }}>{pending ? 'Cancel invite' : 'Remove'}</button>
    </span>
  );
}
