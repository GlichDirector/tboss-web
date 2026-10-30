'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const groups: { title: string; items: { href: string; label: string; badge?: 'enq' }[] }[] = [
  { title: 'Overview', items: [{ href: '/admin', label: 'Dashboard' }, { href: '/admin/calendar', label: 'Calendar' }] },
  { title: 'Clients', items: [
    { href: '/admin/clients', label: 'Clients' }, { href: '/admin/enquiries', label: 'Enquiries', badge: 'enq' },
    { href: '/admin/orders', label: 'Orders & bookings' }, { href: '/admin/galleries', label: 'Client galleries' }, { href: '/admin/payments', label: 'Payments & invoices' },
  ] },
  { title: 'Studio', items: [{ href: '/admin/settings', label: 'Settings' }] },
];
const soon = ['Pages & design', 'Journal', 'Emails'];

export default function AdminNav({ newEnquiries }: { newEnquiries: number }) {
  const path = usePathname() || '/admin';
  const on = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href));
  return (
    <nav aria-label="Studio" className="a-nav">
      {groups.map((g) => (
        <div key={g.title} className="a-group">
          <span className="a-gtitle">{g.title}</span>
          {g.items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={on(i.href) ? 'page' : undefined}>
              {i.label}
              {i.badge === 'enq' && newEnquiries > 0 && <span className="a-count">{newEnquiries}</span>}
            </Link>
          ))}
        </div>
      ))}
      <div className="a-group">
        <span className="a-gtitle">Website · coming in Phase 4</span>
        {soon.map((s) => <span key={s} className="a-soon">{s}</span>)}
      </div>
    </nav>
  );
}
