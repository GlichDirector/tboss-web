// Pure HTML builder for branded emails (used by the server and by the email preview).
import { studio } from './site';

export const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Branded email wrapper used by gallery emails.
export function brandedEmail(o: { heading: string; intro: string; rows?: [string, string][]; cta?: { label: string; url: string }; note?: string }) {
  const rows = (o.rows || []).map(([k, v]) => `<tr><td style="padding:6px 0;color:#625850">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`).join('');
  return `<div style="background:#E9E3DA;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#1F1A16">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:#F7F2EA;padding:22px;text-align:center;font-family:Georgia,serif;font-size:22px;letter-spacing:0.08em">TBOSS PHOTOGRAPHY</div>
    <div style="padding:28px 32px;font-size:15px;line-height:1.6">
      <h1 style="font-family:Georgia,serif;font-weight:500;font-size:30px;line-height:1.15;margin:0 0 14px">${esc(o.heading)}</h1>
      <p style="margin:0 0 16px">${o.intro}</p>
      ${rows ? `<table style="width:100%;background:#FBF8F3;border-radius:10px;padding:10px 16px;font-size:14px;margin:0 0 20px">${rows}</table>` : ''}
      ${o.cta ? `<p style="text-align:center;margin:24px 0"><a href="${o.cta.url}" style="background:#7A2E2A;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;display:inline-block">${esc(o.cta.label)}</a></p>` : ''}
      ${o.note ? `<p style="font-size:13px;color:#625850;text-align:center;margin:0">${o.note}</p>` : ''}
    </div>
    <div style="border-top:1px solid #eee;padding:16px 32px;font-size:12px;color:#625850;text-align:center">${studio.legalName} · ${studio.phoneDisplay} · ${studio.email}<br>No 15 Adewaku Avenue, Abayomi Bus Stop, Iwo Road, Ibadan</div>
  </div></div>`;
}
