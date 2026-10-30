'use client';

import { useState } from 'react';

export default function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(`${title} ${url}`);
  return (
    <div className="share">
      <span>Share:</span>
      <a href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { /* clipboard blocked */ } }}>
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
