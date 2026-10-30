'use client';

import { useActionState, useState } from 'react';
import type { R } from '@/app/admin/studio-actions';

export default function NewOrder({ action, packages }: { action: (p: R, f: FormData) => Promise<R>; packages: { id: string; name: string; price: number }[] }) {
  const [open, setOpen] = useState(false);
  const [state, run, pending] = useActionState(action, {});
  if (!open) return <button type="button" className="btn btn-accent a-sm" onClick={() => setOpen(true)}>+ New order</button>;
  return (
    <div className="a-modal-back" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <form action={run} className="a-modal" role="dialog" aria-modal="true" aria-labelledby="no-h">
        <h2 id="no-h" style={{ margin: 0, fontSize: 20 }}>New order</h2>
        <div className="field"><label htmlFor="package">Package</label>
          <select id="package" name="package" className="input" defaultValue={packages[0]?.id || ''}>
            {packages.map((p) => <option key={p.id} value={p.id}>{p.name} · ₦{p.price.toLocaleString('en-NG')}</option>)}
            <option value="">Custom (I’ll write the invoice)</option>
          </select>
          {packages.length === 0 && <span className="a-hint">Tip: add your packages in Settings so invoices fill in automatically.</span>}
        </div>
        <div className="field"><label htmlFor="title">Order name</label><input id="title" name="title" className="input" placeholder="Leave empty to use the package name" /></div>
        <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <legend className="legend" style={{ marginBottom: 6 }}>First step</legend>
          <label style={{ display: 'flex', gap: 8 }}><input type="radio" name="first" value="invoice" defaultChecked /> Send the invoice first</label>
          <label style={{ display: 'flex', gap: 8 }}><input type="radio" name="first" value="book" /> Book the session first (already paid)</label>
        </fieldset>
        {state.error && <div className="alert" role="alert">{state.error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline a-sm" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-accent a-sm" disabled={pending}>{pending ? 'Creating…' : 'Create order'}</button>
        </div>
      </form>
    </div>
  );
}
