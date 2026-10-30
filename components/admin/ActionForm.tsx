'use client';

import { useActionState } from 'react';
import type { R } from '@/app/admin/studio-actions';

// A form that runs a studio action and shows its result underneath.
export default function ActionForm({ action, children, submit, secondary, className = 'a-form', style }: {
  action: (p: R, f: FormData) => Promise<R>; children: React.ReactNode; submit: string;
  secondary?: { label: string; name: string; value: string }; className?: string; style?: React.CSSProperties;
}) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className={className} style={style}>
      {children}
      {state.error && <div role="alert" className="alert">{state.error}</div>}
      {state.ok && <div role="status" className="a-ok">{state.ok}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-accent a-sm" disabled={pending}>{pending ? 'Working…' : submit}</button>
        {secondary && <button type="submit" name={secondary.name} value={secondary.value} className="btn btn-outline a-sm" disabled={pending}>{secondary.label}</button>}
      </div>
    </form>
  );
}
