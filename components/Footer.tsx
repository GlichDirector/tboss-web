import Link from 'next/link';
import { fullAddress, studio } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap inner">
        <div className="contact">
          <span>© {new Date().getFullYear()} {studio.legalName}</span>
          <span>
            <a href={`tel:${studio.phoneIntl}`}>{studio.phoneDisplay}</a> · <a href={`mailto:${studio.email}`}>{studio.email}</a>
          </span>
          <span>{fullAddress}</span>
        </div>
        <div className="links">
          <a href={studio.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram · {studio.instagramHandle}</a>
          <Link href="/journal">Journal</Link>
          <Link href="/galleries">Client galleries</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
