'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Area = 'dashboard' | 'calendar' | 'clients' | 'galleries' | 'payments' | 'website' | 'settings';
const groups: { title: string; items: { href: string; label: string; area: Area; badge?: 'enq' }[] }[] = [
  { title: 'Overview', items: [{ href: '/admin', label: 'Dashboard', area: 'dashboard' }, { href: '/admin/calendar', label: 'Calendar', area: 'calendar' }] },
  { title: 'Clients', items: [
    { href: '/admin/clients', label: 'Clients', area: 'clients' }, { href: '/admin/enquiries', label: 'Enquiries', area: 'clients', badge: 'enq' },
    { href: '/admin/orders', label: 'Orders & bookings', area: 'clients' }, { href: '/admin/galleries', label: 'Client galleries', area: 'galleries' },
    { href: '/admin/payments', label: 'Payments & invoices', area: 'payments' },
  ] },
  { title: 'Website', items: [
    { href: '/admin/website', label: 'Pages & design', area: 'website' }, { href: '/admin/journal', label: 'Journal', area: 'website' },
    { href: '/admin/instagram', label: 'Work & Instagram', area: 'website' }, { href: '/admin/emails', label: 'Emails', area: 'website' },
  ] },
  { title: 'Studio', items: [{ href: '/admin/settings', label: 'Settings', area: 'settings' }, { href: '/admin/team', label: 'Team', area: 'settings' }] },
];

export default function AdminNav({ newEnquiries, areas }: { newEnquiries: number; areas: Area[] }) {
  const path = usePathname() || '/admin';
  const on = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href));
  return (
    <nav aria-label="Studio" className="a-nav">
      {groups.map((g) => {
        const items = g.items.filter((i) => areas.includes(i.area));
        if (!items.length) return null;
        return (
          <div key={g.title} className="a-group">
            <span className="a-gtitle">{g.title}</span>
            {items.map((i) => (
              <Link key={i.href} href={i.href} aria-current={on(i.href) ? 'page' : undefined}>
                {i.label}
                {i.badge === 'enq' && newEnquiries > 0 && <span className="a-count">{newEnquiries}</span>}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
