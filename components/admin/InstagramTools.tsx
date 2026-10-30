'use client';

import { useState, useTransition } from 'react';
import { autoDraftAction, draftFromPostAction, postFieldsAction, syncNowAction } from '@/app/admin/journal-actions';

export function SyncButton() {
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button type="button" className="btn btn-accent a-sm" disabled={busy} onClick={() => start(async () => setMsg(await syncNowAction()))}>{busy ? 'Checking Instagram…' : 'Check for new posts now'}</button>
      {msg.ok && <span className="a-ok">{msg.ok}</span>}
      {msg.error && <span className="alert">{msg.error}</span>}
    </div>
  );
}

export function AutoDraft({ on }: { on: boolean }) {
  const [busy, start] = useTransition();
  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="checkbox" defaultChecked={on} disabled={busy} onChange={(e) => start(() => autoDraftAction(e.target.checked))} style={{ width: 18, height: 18, accentColor: 'var(--oxblood)' }} />
      Draft a Journal story automatically for each new post (you approve before anything is published)
    </label>
  );
}

export function PostTools({ id, tag, hidden, hasStory, ai }: { id: string; tag: string; hidden: boolean; hasStory: boolean; ai: boolean }) {
  const [busy, start] = useTransition();
  const [err, setErr] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="input" aria-label="Collection" style={{ minHeight: 34, width: 'auto', fontSize: 13 }} defaultValue={tag} disabled={busy} onChange={(e) => start(() => postFieldsAction(id, { tag: e.target.value }))}>
          {['Portrait', 'Family', 'Event', 'Heritage'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <button type="button" className="a-link" disabled={busy} onClick={() => start(() => postFieldsAction(id, { hidden: !hidden }))}>{hidden ? 'Show on website' : 'Hide from website'}</button>
      </div>
      {ai && <button type="button" className="a-link" disabled={busy} style={{ alignSelf: 'flex-start' }} onClick={() => start(async () => { const r = await draftFromPostAction(id); if (r?.error) setErr(r.error); })}>{busy ? 'Writing draft… (about 20 seconds)' : hasStory ? 'Open its Journal story' : '✦ Draft a Journal story with AI'}</button>}
      {err && <span className="alert">{err}</span>}
    </div>
  );
}
