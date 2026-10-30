'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { addClientsAction, type R } from '@/app/admin/studio-actions';

type Row = { name: string; email: string; phone: string; type: string; date: string; instagram: string; notes: string };
const blank = (): Row => ({ name: '', email: '', phone: '', type: '', date: '', instagram: '', notes: '' });

export default function AddClients() {
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [state, run, pending] = useActionState<R, FormData>(addClientsAction, {});
  const set = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  if (state.ok) return (
    <div className="a-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="a-ok">{state.ok}</div>
      <div style={{ display: 'flex', gap: 8 }}><Link href="/admin/clients?f=imported" className="btn btn-dark a-sm">See imported clients</Link><button type="button" className="btn btn-outline a-sm" onClick={() => location.reload()}>Add more</button></div>
    </div>
  );
  return (
    <form action={run} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <fieldset key={i} className="a-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <legend className="a-sub" style={{ fontWeight: 700, padding: '0 6px' }}>Client {i + 1}</legend>
          <div className="a-grid a-grid3">
            <div className="field"><label htmlFor={`n${i}`}>Name</label><input id={`n${i}`} className="input" value={r.name} onChange={(e) => set(i, 'name', e.target.value)} /></div>
            <div className="field"><label htmlFor={`e${i}`}>Email</label><input id={`e${i}`} type="email" className="input" value={r.email} onChange={(e) => set(i, 'email', e.target.value)} /></div>
            <div className="field"><label htmlFor={`p${i}`}>Phone / WhatsApp</label><input id={`p${i}`} type="tel" className="input" value={r.phone} onChange={(e) => set(i, 'phone', e.target.value)} /></div>
            <div className="field"><label htmlFor={`t${i}`}>Type of shoot</label><input id={`t${i}`} className="input" value={r.type} onChange={(e) => set(i, 'type', e.target.value)} placeholder="Portrait, family, event…" /></div>
            <div className="field"><label htmlFor={`d${i}`}>Shoot date</label><input id={`d${i}`} type="date" className="input" value={r.date} onChange={(e) => set(i, 'date', e.target.value)} /></div>
            <div className="field"><label htmlFor={`ig${i}`}>Instagram</label><input id={`ig${i}`} className="input" value={r.instagram} onChange={(e) => set(i, 'instagram', e.target.value)} placeholder="@handle" /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor={`no${i}`}>Notes</label><input id={`no${i}`} className="input" value={r.notes} onChange={(e) => set(i, 'notes', e.target.value)} /></div>
          </div>
          {rows.length > 1 && <button type="button" className="a-link a-danger" style={{ alignSelf: 'flex-start' }} onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove this client</button>}
        </fieldset>
      ))}
      <button type="button" className="btn btn-outline a-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setRows([...rows, blank()])}>+ Another client</button>
      {state.error && <div role="alert" className="alert">{state.error}</div>}
      <button type="submit" className="btn btn-accent a-sm" style={{ alignSelf: 'flex-start' }} disabled={pending}>{pending ? 'Saving…' : `Save ${rows.length} client${rows.length > 1 ? 's' : ''}`}</button>
    </form>
  );
}
