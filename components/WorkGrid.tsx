'use client';

import { useState } from 'react';
import { collections, photos, type Collection } from '@/lib/content';

export default function WorkGrid({ initial }: { initial: Collection | null }) {
  const [filter, setFilter] = useState<Collection | null>(initial);
  const shown = filter ? photos.filter((p) => p.tag === filter) : photos;
  const groups = collections
    .map((c) => ({ ...c, count: c.key ? photos.filter((p) => p.tag === c.key).length : photos.length }))
    .filter((c) => c.count > 0);

  return (
    <>
      <div className="chips" role="group" aria-label="Filter by collection">
        {groups.map((g) => (
          <button
            key={g.label}
            type="button"
            className="chip"
            aria-pressed={g.key === filter}
            onClick={() => {
              setFilter(g.key);
              const url = g.key ? `/work?c=${g.key}` : '/work';
              window.history.replaceState(null, '', url);
            }}
          >
            {g.label} <span className="count">{g.count}</span>
          </button>
        ))}
      </div>
      <div className="photo-grid" style={{ marginTop: 32 }} aria-live="polite">
        {shown.map((p) => (
          <figure className="photo-card" key={p.src} style={{ margin: 0 }}>
            <div className="frame"><img src={p.src} alt={p.alt} loading="lazy" /></div>
            <figcaption className="tag">{p.tag}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
