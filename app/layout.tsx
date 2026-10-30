import type { Metadata, Viewport } from 'next';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import './globals.css';
import { siteUrl, studio } from '@/lib/site';

const description =
  'Tboss Photography is a female-led photography studio in Ibadan, Oyo State, creating warm, timeless portraits, family photos, wedding and event photography, and heritage portraits.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Tboss Photography · Portrait, family & event photographer in Ibadan', template: '%s · Tboss Photography' },
  description,
  openGraph: {
    type: 'website',
    siteName: studio.name,
    locale: 'en_NG',
    images: [{ url: '/photos/hero-1.jpg', width: 2400, height: 1350, alt: 'Bridal portrait by Tboss Photography' }],
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
  // Paste the code from Google Search Console / Bing Webmaster Tools into Hostinger to verify the site.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export const viewport: Viewport = { themeColor: '#F7F2EA' };

const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${siteUrl}/#studio`,
  name: studio.name,
  description,
  url: siteUrl,
  image: `${siteUrl}/photos/hero-1.jpg`,
  logo: `${siteUrl}/brand/logo-brown.png`,
  email: studio.email,
  telephone: studio.phoneIntl,
  founder: { '@type': 'Person', name: studio.owner },
  address: {
    '@type': 'PostalAddress',
    streetAddress: studio.address.street,
    addressLocality: studio.address.city,
    postalCode: studio.address.postcode,
    addressRegion: studio.address.region,
    addressCountry: studio.address.country,
  },
  areaServed: ['Ibadan', 'Oyo State', 'Nigeria'],
  sameAs: [studio.instagramUrl],
  knowsAbout: ['Portrait photography', 'Family photography', 'Wedding photography', 'Event photography', 'Heritage portraits'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>
        <a href="#main" className="skip">Skip to content</a>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }} />
      </body>
    </html>
  );
}
