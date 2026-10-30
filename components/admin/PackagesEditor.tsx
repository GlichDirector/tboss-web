'use client';

import { useActionState, useState } from 'react';
import { savePackagesAction, type R } from '@/app/admin/studio-actions';
import type { Package } from '@/lib/studio';

type Row = { id: string; name: string; price: string; photos: string; description: string };

export default function PackagesEditor({ initial }: { initial: Package[] }) {
  const [rows, setRows] = useState<Row[]>(initial.length ? initial.map((p) => ({ id: p.id, name: p.name, price: String(p.price), photos: String(p.photos), description: p.description })) : [{ id: '', name: '', price: '', photos: '', description: '' }]);
  const [state, run, pending] = useActionState<R, FormData>(savePackagesAction, {});
  const set = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <form action={run} className="a-card a-form" style={{ maxWidth: 'none' }}>
      <div><h2 className="a-h2">Packages &amp; pricing</h2><p className="a-sub" style={{ margin: 0 }}>Used when you start a new order: the invoice and the gallery’s photo limit fill in automatically.</p></div>
      <input type="hidden" name="packages" value={JSON.stringify(rows)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i} className="a-pkg">
            <div className="field"><label htmlFor={`pn${i}`}>Package name</label><input id={`pn${i}`} className="input" value={r.name} onChange={(e) => set(i, 'name', e.target.value)} placeholder="e.g. Family session" /></div>
            <div className="field"><label htmlFor={`pp${i}`}>Price (₦)</label><input id={`pp${i}`} className="input" inputMode="numeric" value={r.price} onChange={(e) => set(i, 'price', e.target.value)} placeholder="150000" /></div>
            <div className="field"><label htmlFor={`ph${i}`}>Edited photos included</label><input id={`ph${i}`} className="input" inputMode="numeric" value={r.photos} onChange={(e) => set(i, 'photos', e.target.value)} placeholder="15" /></div>
            <div className="field" style={{ gridColumn: '1 / -2' }}><label htmlFor={`pd${i}`}>What’s included</label><input id={`pd${i}`} className="input" value={r.description} onChange={(e) => set(i, 'description', e.target.value)} placeholder="e.g. 2 hours, 2 outfits, studio or outdoor" /></div>
            <button type="button" className="a-link a-danger" style={{ alignSelf: 'end', paddingBottom: 14 }} onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-outline a-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setRows([...rows, { id: '', name: '', price: '', photos: '', description: '' }])}>+ Add package</button>
      {state.error && <div role="alert" className="alert">{state.error}</div>}
      {state.ok && <div role="status" className="a-ok">{state.ok}</div>}
      <button type="submit" className="btn btn-accent a-sm" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Saving…' : 'Save packages'}</button>
    </form>
  );
}
