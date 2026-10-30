'use client';

import { useMemo, useState, useTransition } from 'react';
import { resetTemplateAction, saveTemplateAction, sendTestAction } from '@/app/admin/email-actions';
import { brandedEmail } from '@/lib/emailHtml';
import { fill, fillPlain, TEMPLATE_INFO, type Tpl, type TplKey } from '@/lib/emailTemplates';

const SAMPLE: Record<string, string> = { first_name: 'Adaeze', session: 'family session', session_type: 'family', invoice_number: 'TB-1047', amount: '₦75,000', date: 'Saturday, 14 November 2026', time: '10:00 AM', studio_phone: '0902 442 1555' };
const SAMPLE_ROWS: Record<TplKey, [string, string][]> = {
  enquiry: [['Session', 'Family'], ['Date', '14 November']],
  invoice: [['Invoice', 'TB-1047 · version 1'], ['Total', '₦150,000'], ['Deposit due now', '₦75,000']],
  invoiceUpdate: [['Invoice', 'TB-1047 · version 2'], ['Total', '₦170,000']],
  receipt: [['Amount received', '₦75,000'], ['Paid by', 'Bank transfer'], ['Balance remaining', '₦75,000']],
  booking: [['Date', 'Saturday, 14 November 2026'], ['Time', '10:00 AM · 2 hours'], ['Where', 'Tboss studio, Iwo Road, Ibadan']],
  reminder: [['When', 'Tomorrow · 10:00 AM'], ['Where', 'Tboss studio, Iwo Road, Ibadan']],
  choose: [['Included in your package', '15 edited photos'], ['Please choose by', '28 November 2026']],
  ready: [['Available until', '31 January 2027']],
};

export default function EmailBuilder({ templates }: { templates: Record<TplKey, Tpl> }) {
  const keys = Object.keys(TEMPLATE_INFO) as TplKey[];
  const [cur, setCur] = useState<TplKey>('choose');
  const [all, setAll] = useState(templates);
  const [view, setView] = useState<'desktop' | 'phone'>('desktop');
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [busy, start] = useTransition();
  const t = all[cur];
  const set = (k: keyof Tpl, v: string) => { setAll({ ...all, [cur]: { ...t, [k]: v } }); setMsg({}); };
  const html = useMemo(() => brandedEmail({
    heading: fillPlain(t.heading, SAMPLE), intro: fill(t.intro, SAMPLE), rows: SAMPLE_ROWS[cur],
    cta: t.button ? { label: fillPlain(t.button, SAMPLE), url: '#' } : undefined, note: t.note ? fill(t.note, SAMPLE) : undefined,
  }), [t, cur]);

  return (
    <div className="eb">
      <nav className="eb-list" aria-label="Emails">
        {keys.map((k) => (
          <button key={k} type="button" aria-pressed={k === cur} onClick={() => { setCur(k); setMsg({}); }}>
            <strong>{TEMPLATE_INFO[k].name}</strong><span className="a-sub">{TEMPLATE_INFO[k].when}</span>
          </button>
        ))}
      </nav>
      <div className="a-card a-form" style={{ maxWidth: 'none' }}>
        <div className="field"><label htmlFor="eb-sub">Subject line</label><input id="eb-sub" className="input" value={t.subject} onChange={(e) => set('subject', e.target.value)} /></div>
        <div className="field"><label htmlFor="eb-h">Heading</label><input id="eb-h" className="input" value={t.heading} onChange={(e) => set('heading', e.target.value)} /></div>
        <div className="field"><label htmlFor="eb-i">Message</label><textarea id="eb-i" className="input" rows={4} value={t.intro} onChange={(e) => set('intro', e.target.value)} /></div>
        <div className="field"><label htmlFor="eb-b">Button label</label><input id="eb-b" className="input" value={t.button} onChange={(e) => set('button', e.target.value)} placeholder="Leave empty for no button" /></div>
        <div className="field"><label htmlFor="eb-n">Small note under the button</label><textarea id="eb-n" className="input" rows={2} value={t.note} onChange={(e) => set('note', e.target.value)} /></div>
        <div className="a-sub">You can use: {[...TEMPLATE_INFO[cur].vars, 'studio_phone'].map((v) => <code key={v} className="eb-var">{`{${v}}`}</code>)}. The details box and the link are added automatically.</div>
        {msg.ok && <div className="a-ok" role="status">{msg.ok}</div>}
        {msg.error && <div className="alert" role="alert">{msg.error}</div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-accent a-sm" disabled={busy} onClick={() => start(async () => setMsg(await saveTemplateAction(cur, t)))}>Save</button>
          <button type="button" className="btn btn-outline a-sm" disabled={busy} onClick={() => start(async () => setMsg(await sendTestAction(cur)))}>Send me a test</button>
          <button type="button" className="a-link" disabled={busy} onClick={() => { if (confirm('Go back to the original wording?')) start(async () => { await resetTemplateAction(cur); location.reload(); }); }}>Reset to original</button>
        </div>
      </div>
      <div className="eb-preview">
        <div className="pe-bar">
          <span className="a-sub">Preview · Subject: <strong style={{ color: 'var(--ink)' }}>{fillPlain(t.subject, SAMPLE)}</strong></span>
          <div className="a-seg"><button type="button" aria-pressed={view === 'desktop'} onClick={() => setView('desktop')}>Desktop</button><button type="button" aria-pressed={view === 'phone'} onClick={() => setView('phone')}>Phone</button></div>
        </div>
        <iframe title="Email preview" srcDoc={html} className={`eb-frame ${view}`} />
      </div>
    </div>
  );
}
