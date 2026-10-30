'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { nav } from '@/lib/site';
import { MenuIcon } from './Icons';

function isCurrent(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
}

export default function Nav() {
  const pathname = usePathname() || '/';
  const menu = useRef<HTMLDetailsElement>(null);
  const overlay = pathname === '/';

  // Close the phone menu after moving to another page.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <header className={overlay ? 'site-header' : 'site-header solid'}>
      <nav className="nav" aria-label="Main">
        <Link href="/" className="nav-logo" aria-label="Tboss Photography, home">
          <img src="/brand/logo-brown.png" alt="Tboss Photography" width={70} height={48} />
        </Link>
        <div className="nav-links">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
          {pathname !== '/contact' && <Link href="/contact" className="nav-cta">Book a session</Link>}
        </div>
        <details className="mnav" ref={menu}>
          <summary><MenuIcon />Menu</summary>
          <div className="mnav-panel">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact" className="nav-cta">Book a session</Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
