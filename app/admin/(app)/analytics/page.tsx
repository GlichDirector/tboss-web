import Link from 'next/link';
import { report } from '@/lib/analytics';
import { listStoryRows } from '@/lib/journal';
import { requireArea } from '@/lib/team';

export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90, 365];
const PAGE_NAMES: Record<string, string> = {
  '/': 'Home', '/work': 'Work (all)', '/work/portraits': 'Work · Portraits', '/work/events': 'Work · Events', '/work/heritage': 'Work · Heritage',
  '/journal': 'Journal', '/about': 'About', '/contact': 'Contact', '/privacy': 'Privacy',
};
const fmt = (n: number) => n.toLocaleString('en-NG');
const change = (now: number, before: number) => {
  if (!before) return now ? 'New this period' : '';
  const p = Math.round(((now - before) / before) * 100);
  return `${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}% vs the previous period`;
};

function Bars({ title, rows, label, empty = 'No visits yet.', note }: { title: string; rows: { name: string; views: number; visitors: number; href?: string }[]; label?: (n: string) => string; empty?: string; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <section className="a-card an-panel">
      <h2 className="a-h2" style={{ margin: 0 }}>{title}</h2>
      {note && <p className="a-hint" style={{ margin: 0 }}>{note}</p>}
      {rows.length ? (
        <ol className="an-bars">
          <li className="an-head"><span>Name</span><span>Views</span><span>Visitors</span></li>
          {rows.map((r) => (
            <li key={r.name}>
              <span className="an-name"><i style={{ width: `${(r.views / max) * 100}%` }} />{r.href ? <a href={r.href} target="_blank" rel="noopener noreferrer">{label ? label(r.name) : r.name}</a> : <span>{label ? label(r.name) : r.name}</span>}</span>
              <span>{fmt(r.views)}</span><span>{fmt(r.visitors)}</span>
            </li>
          ))}
        </ol>
      ) : <p className="a-sub">{empty}</p>}
    </section>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  await requireArea('website');
  const d = Number((await searchParams).d);
  const days = RANGES.includes(d) ? d : 30;
  const [r, stories] = await Promise.all([report(days), listStoryRows()]);
  const titles = new Map(stories.map((s) => [`/journal/${s.slug}`, s.title]));
  const pageName = (p: string) => PAGE_NAMES[p] || titles.get(p) || p;
  const viewed = new Map(r.articles.map((a) => [a.name, a]));
  const articles = [
    ...r.articles.map((a) => ({ ...a, href: a.name })),
    ...stories.filter((s) => s.status === 'published' && !viewed.has(`/journal/${s.slug}`)).map((s) => ({ name: `/journal/${s.slug}`, views: 0, visitors: 0, href: `/journal/${s.slug}` })),
  ];
  const max = Math.max(1, ...r.series.map((s) => s.views));
  const tick = Math.max(1, Math.ceil(days / 10));
  const label = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">Website</p><h1>Analytics</h1><p className="a-sub" style={{ margin: 0 }}>Who is visiting the website, what they look at, and where they come from. Your own visits while signed in aren’t counted.</p></div>
        <nav className="a-seg" aria-label="Period">
          {RANGES.map((n) => <Link key={n} href={`/admin/analytics?d=${n}`} aria-current={n === days ? 'page' : undefined} className="an-range">{n === 365 ? '12 months' : `${n} days`}</Link>)}
        </nav>
      </div>

      <div className="an-stats">
        {[
          { k: 'Page views', v: r.now.views, b: r.before.views },
          { k: 'Visitors', v: r.now.visitors, b: r.before.visitors },
          { k: 'New visitors', v: r.now.newVisitors, b: r.before.newVisitors },
        ].map((s) => (
          <div key={s.k} className="a-card"><span className="a-sub">{s.k}</span><strong>{fmt(s.v)}</strong><span className="a-hint">{change(s.v, s.b)}</span></div>
        ))}
        <div className="a-card"><span className="a-sub">On the site now</span><strong>{fmt(r.live)}</strong><span className="a-hint">Visitors in the last 30 minutes</span></div>
      </div>

      <section className="a-card an-panel" style={{ marginTop: 12 }}>
        <h2 className="a-h2" style={{ margin: 0 }}>Views per day</h2>
        <div className="an-chart" role="img" aria-label={`Daily page views from ${label(r.from)} to ${label(r.to)}`}>
          {r.series.map((s, i) => (
            <div key={s.day} className="an-col" title={`${label(s.day)}: ${s.views} views, ${s.visitors} visitors`}>
              <span className="an-bar" style={{ height: `${(s.views / max) * 100}%` }} />
              <span className="an-x">{i % tick === 0 ? label(s.day) : ''}</span>
            </div>
          ))}
        </div>
        <p className="a-hint" style={{ margin: 0 }}>Busiest day: {(() => { const b = [...r.series].sort((a, c) => c.views - a.views)[0]; return b && b.views ? `${label(b.day)} (${b.views} views)` : 'none yet'; })()}</p>
      </section>

      <div className="an-grid">
        <Bars title="Most viewed pages" rows={r.pages.map((p) => ({ ...p, href: p.name }))} label={pageName} />
        <Bars title="Journal articles" rows={articles} label={pageName} empty="No articles published yet." />
        <Bars title="Countries" rows={r.countries} note="From the visitor’s network where available, otherwise their time zone." />
        <Bars title="Where visitors come from" rows={r.sources} note="Direct includes typed-in visits, saved links and most WhatsApp shares." />
        <Bars title="Devices" rows={r.devices} />
        <Bars title="Browsers & apps" rows={r.browsers} />
        {r.cities.length > 0 && <Bars title="Cities" rows={r.cities} />}
      </div>
      <p className="a-hint" style={{ marginTop: 16 }}>Age and gender aren’t collected: that needs Google Analytics with advertising features, which tracks visitors across other sites. Visit records are kept for 13 months.</p>
    </>
  );
}
