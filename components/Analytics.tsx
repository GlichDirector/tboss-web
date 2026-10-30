'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Counts page views for the studio's Analytics page. No cookies; a random ID is kept in
// this browser only, so returning visitors can be told apart from new ones.
function store(kind: 'local' | 'session') {
  try { return kind === 'local' ? window.localStorage : window.sessionStorage; } catch { return null; }
}

export default function Analytics() {
  const path = usePathname();
  useEffect(() => {
    const ls = store('local'), ss = store('session');
    if (/[?&]track=1/.test(location.search)) try { ss?.setItem('tb_track', '1'); } catch { /* ignore */ }
    if (!path || (navigator.webdriver && !ss?.getItem('tb_track'))) return; // skip automated browsers
    let v = ls?.getItem('tb_v') || '';
    let isNew = false;
    if (!/^[a-f0-9]{16}$/.test(v)) {
      v = Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => x.toString(16).padStart(2, '0')).join('');
      isNew = true;
      try { ls?.setItem('tb_v', v); } catch { /* private mode */ }
    }
    // Count each page once per visit (30 minutes), so refreshes don't inflate numbers.
    const seenKey = `tb_seen:${path}`;
    const last = Number(ss?.getItem(seenKey) || 0);
    if (Date.now() - last < 30 * 60000) return;
    try { ss?.setItem(seenKey, String(Date.now())); } catch { /* ignore */ }
    // Where the visit came from is remembered for the whole visit.
    let r = ss?.getItem('tb_ref');
    if (r === null || r === undefined) { r = document.referrer || ''; try { ss?.setItem('tb_ref', r); } catch { /* ignore */ } }
    const u = new URLSearchParams(location.search).get('utm_source') || '';
    const body = JSON.stringify({ p: path, v, n: isNew, r, u, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '' });
    if (!navigator.sendBeacon?.('/api/v', new Blob([body], { type: 'text/plain' }))) {
      fetch('/api/v', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  }, [path]);
  return null;
}
