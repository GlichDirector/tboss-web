'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import {
  addPaymentAction, deletePaymentAction, markConfirmedAction, orderStatusAction, resendBookingAction, saveBookingAction, saveInvoiceAction, type R,
} from '@/app/admin/studio-actions';

const fmt = (n: number) => `₦${Math.round(n || 0).toLocaleString('en-NG')}`;
const num = (v: string) => Number(String(v).replace(/[^\d.]/g, '')) || 0;

function Msg({ s }: { s: R }) {
  return <>{s.error && <div role="alert" className="alert">{s.error}</div>}{s.ok && <div role="status" className="a-ok">{s.ok}</div>}</>;
}

// ---------------- Invoice ----------------

type Line = { description: string; qty: string; price: string };

export function InvoiceEditor({ orderId, initial, discount, deposit, due, note, sent, hasEmail, startOpen, depositPercent }: {
  orderId: number; initial: { description: string; qty: number; price: number }[]; discount: number; deposit: number; due: string | null; note: string | null;
  sent: boolean; hasEmail: boolean; startOpen: boolean; depositPercent: number;
}) {
  const [open, setOpen] = useState(startOpen);
  const [lines, setLines] = useState<Line[]>(initial.length ? initial.map((i) => ({ description: i.description, qty: String(i.qty), price: String(i.price) })) : [{ description: '', qty: '1', price: '' }]);
  const [disc, setDisc] = useState(discount ? String(discount) : '');
  const [dep, setDep] = useState(deposit ? String(deposit) : '');
  const [state, run, pending] = useActionState(saveInvoiceAction.bind(null, orderId), {});
  const total = useMemo(() => Math.max(0, lines.reduce((s, l) => s + num(l.qty || '1') * num(l.price), 0) - num(disc)), [lines, disc]);
  const set = (i: number, k: keyof Line, v: string) => setLines(lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  if (!open) return <button type="button" className="btn btn-outline a-sm" onClick={() => setOpen(true)}>{initial.length ? 'Edit invoice' : 'Create invoice'}</button>;
  return (
    <form action={run} className="a-form" style={{ maxWidth: 'none' }}>
      <input type="hidden" name="items" value={JSON.stringify(lines)} />
      <div className="a-lines">
        <div className="a-line a-line-h"><span>Description</span><span>Qty</span><span>Price (₦)</span><span>Amount</span><span /></div>
        {lines.map((l, i) => (
          <div className="a-line" key={i}>
            <input aria-label="Description" className="input" value={l.description} onChange={(e) => set(i, 'description', e.target.value)} placeholder="e.g. Family session · 2 hours" />
            <input aria-label="Quantity" className="input" inputMode="numeric" value={l.qty} onChange={(e) => set(i, 'qty', e.target.value)} />
            <input aria-label="Price" className="input" inputMode="numeric" value={l.price} onChange={(e) => set(i, 'price', e.target.value)} />
            <span className="a-amt">{fmt(num(l.qty || '1') * num(l.price))}</span>
            <button type="button" className="a-link a-danger" aria-label="Remove line" onClick={() => setLines(lines.filter((_, j) => j !== i))} disabled={lines.length === 1}>✕</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-outline a-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setLines([...lines, { description: '', qty: '1', price: '' }])}>+ Add line</button>
      <div className="a-grid a-grid3">
        <div className="field"><label htmlFor="discount">Discount (₦)</label><input className="input" id="discount" name="discount" inputMode="numeric" value={disc} onChange={(e) => setDisc(e.target.value)} /></div>
        <div className="field"><label htmlFor="deposit">Deposit to hold the date (₦)</label><input className="input" id="deposit" name="deposit" inputMode="numeric" value={dep} onChange={(e) => setDep(e.target.value)} />
          <button type="button" className="a-link" style={{ alignSelf: 'flex-start' }} onClick={() => setDep(String(Math.round((total * depositPercent) / 100)))}>Use {depositPercent}% ({fmt((total * depositPercent) / 100)})</button></div>
        <div className="field"><label htmlFor="due_date">Pay by</label><input className="input" id="due_date" name="due_date" type="date" defaultValue={due || ''} /></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="note">Note on the invoice</label><textarea className="input" id="note" name="note" rows={2} defaultValue={note || ''} /></div>
      </div>
      <div style={{ fontSize: 18 }}>Total <strong>{fmt(total)}</strong></div>
      <Msg s={state} />
      {!hasEmail && <div className="alert">This client has no email address yet. Add it on their profile to send the invoice.</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" name="send" value="1" className="btn btn-accent a-sm" disabled={pending || !hasEmail}>{pending ? 'Working…' : sent ? 'Save & resend to client' : 'Save & send to client'}</button>
        <button type="submit" name="send" value="0" className="btn btn-outline a-sm" disabled={pending}>Save without sending</button>
        <button type="button" className="a-link" onClick={() => setOpen(false)}>Close</button>
      </div>
    </form>
  );
}

// ---------------- Payments ----------------

export function PaymentForm({ orderId, balance, depositLeft, today }: { orderId: number; balance: number; depositLeft: number; today: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(depositLeft > 0 ? depositLeft : balance || ''));
  const [state, run, pending] = useActionState(addPaymentAction.bind(null, orderId), {});
  if (!open) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {state.ok && <div role="status" className="a-ok">{state.ok}</div>}
      <button type="button" className="btn btn-accent a-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>Record a payment</button>
    </div>
  );
  return (
    <form action={run} className="a-form" style={{ maxWidth: 'none' }}>
      <div className="chips">
        {depositLeft > 0 && depositLeft < balance && <button type="button" className="chip" aria-pressed={num(amount) === depositLeft} onClick={() => setAmount(String(depositLeft))}>Deposit {fmt(depositLeft)}</button>}
        {balance > 0 && <button type="button" className="chip" aria-pressed={num(amount) === balance} onClick={() => setAmount(String(balance))}>Full balance {fmt(balance)}</button>}
      </div>
      <div className="a-grid a-grid3">
        <div className="field"><label htmlFor="amount">Amount received (₦)</label><input className="input" id="amount" name="amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
        <div className="field"><label htmlFor="method">Paid by</label><select className="input" id="method" name="method" defaultValue="Bank transfer"><option>Bank transfer</option><option>Cash</option><option>POS</option><option>Paystack</option><option>Other</option></select></div>
        <div className="field"><label htmlFor="paid_on">Date received</label><input className="input" id="paid_on" name="paid_on" type="date" defaultValue={today} required /></div>
        <div className="field"><label htmlFor="reference">Reference</label><input className="input" id="reference" name="reference" placeholder="Bank reference or note" /></div>
        <div className="field" style={{ gridColumn: 'span 2' }}><label htmlFor="pnote">Internal note</label><input className="input" id="pnote" name="note" /></div>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="receipt" value="1" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--oxblood)' }} />Email the client a receipt</label>
      <Msg s={state} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-accent a-sm" disabled={pending}>{pending ? 'Saving…' : 'Save payment'}</button>
        <button type="button" className="a-link" onClick={() => setOpen(false)}>Close</button>
      </div>
    </form>
  );
}

export function RemovePayment({ orderId, paymentId }: { orderId: number; paymentId: number }) {
  const [busy, start] = useTransition();
  return <button type="button" className="a-link a-danger" disabled={busy} onClick={() => { if (confirm('Remove this payment record?')) start(() => deletePaymentAction(orderId, paymentId)); }}>Remove</button>;
}

// ---------------- Booking ----------------

export function BookingForm({ orderId, b, studioAddress, hasEmail, startOpen }: {
  orderId: number; studioAddress: string; hasEmail: boolean; startOpen: boolean;
  b: { session_date: string; session_time: string; duration_min: number; place: 'studio' | 'location'; address: string; notes: string | null } | null;
}) {
  const [open, setOpen] = useState(startOpen);
  const [place, setPlace] = useState<'studio' | 'location'>(b?.place || 'studio');
  const [state, run, pending] = useActionState(saveBookingAction.bind(null, orderId), {});
  if (!open) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {state.ok && <div role="status" className="a-ok">{state.ok}</div>}
      <button type="button" className="btn btn-outline a-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>{b ? 'Change date, time or place' : 'Book the session'}</button>
    </div>
  );
  return (
    <form action={run} className="a-form" style={{ maxWidth: 'none' }}>
      <div className="a-grid a-grid3">
        <div className="field"><label htmlFor="session_date">Date</label><input className="input" id="session_date" name="session_date" type="date" defaultValue={b?.session_date || ''} required /></div>
        <div className="field"><label htmlFor="session_time">Start time</label><input className="input" id="session_time" name="session_time" type="time" defaultValue={b?.session_time || '10:00'} required /></div>
        <div className="field"><label htmlFor="duration">Length</label>
          <select className="input" id="duration" name="duration" defaultValue={String(b?.duration_min || 120)}>{[30, 60, 90, 120, 180, 240, 360, 480].map((m) => <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m === 60 ? '' : 's'}`}</option>)}</select></div>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <legend className="legend" style={{ marginBottom: 6 }}>Where</legend>
        <div className="a-seg" style={{ alignSelf: 'flex-start' }}>
          <button type="button" aria-pressed={place === 'studio'} onClick={() => setPlace('studio')}>Studio</button>
          <button type="button" aria-pressed={place === 'location'} onClick={() => setPlace('location')}>On location</button>
        </div>
        <input type="hidden" name="place" value={place} />
        {place === 'studio' ? <span className="a-sub">{studioAddress}</span> : (
          <input className="input" name="address" aria-label="Address" defaultValue={b?.place === 'location' ? b.address : ''} placeholder="Full address of the shoot" required />
        )}
      </fieldset>
      <div className="field"><label htmlFor="bnotes">Notes for the client (optional)</label><textarea className="input" id="bnotes" name="notes" rows={2} defaultValue={b?.notes || ''} /></div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="notify" value="1" defaultChecked={hasEmail} disabled={!hasEmail} style={{ width: 18, height: 18, accentColor: 'var(--oxblood)' }} />Email the client with a “Confirm date &amp; time” button{!hasEmail && ' (add their email first)'}</label>
      <Msg s={state} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-accent a-sm" disabled={pending}>{pending ? 'Saving…' : b ? 'Save changes' : 'Book session'}</button>
        <button type="button" className="a-link" onClick={() => setOpen(false)}>Close</button>
      </div>
    </form>
  );
}

export function BookingButtons({ orderId, confirmed }: { orderId: number; confirmed: boolean }) {
  const [busy, start] = useTransition();
  const [done, setDone] = useState('');
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <button type="button" className="a-link" disabled={busy} onClick={() => start(async () => { await resendBookingAction(orderId); setDone('Booking email resent.'); })}>Resend booking email</button>
      {!confirmed && <button type="button" className="a-link" disabled={busy} onClick={() => start(() => markConfirmedAction(orderId))}>Mark confirmed (client confirmed by phone)</button>}
      {done && <span className="a-sub">{done}</span>}
    </div>
  );
}

// ---------------- Status ----------------

export function StatusButton({ orderId, what, label, className = 'btn btn-outline a-sm', ask }: { orderId: number; what: 'deliver' | 'undeliver' | 'cancel' | 'restore'; label: string; className?: string; ask?: string }) {
  const [busy, start] = useTransition();
  return <button type="button" className={className} disabled={busy} onClick={() => { if (!ask || confirm(ask)) start(() => orderStatusAction(orderId, what)); }}>{label}</button>;
}
