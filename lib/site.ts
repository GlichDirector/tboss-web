// Studio details used across the site. Change them here and every page updates.

export const studio = {
  name: 'Tboss Photography',
  legalName: 'Tboss Photography Ltd',
  owner: 'Oluwatosin Aremu',
  email: 'hello@tbossphotography.com',
  phoneDisplay: '0902 442 1555',
  phoneIntl: '+2349024421555',
  whatsapp: 'https://wa.me/2349024421555',
  instagramHandle: '@tee_boss.imagery',
  instagramUrl: 'https://www.instagram.com/tee_boss.imagery/',
  address: {
    street: 'No 15 Adewaku Avenue, Abayomi Bus Stop, Iwo Road',
    city: 'Ibadan',
    postcode: '200223',
    region: 'Oyo State',
    country: 'NG',
  },
  // Shown where the design had "[response time]". Set once known, e.g. '24 hours'.
  replyTime: '',
};

export const fullAddress = `${studio.address.street}, ${studio.address.city} ${studio.address.postcode}, ${studio.address.region}`;

export const siteUrl = (process.env.SITE_URL || 'https://tbossphotography.com').replace(/\/$/, '');

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/journal', label: 'Journal' },
  { href: '/about', label: 'About' },
  { href: '/galleries', label: 'Client galleries' },
  { href: '/contact', label: 'Contact' },
];

export function replyLine(prefix = 'We reply') {
  return studio.replyTime
    ? `${prefix} within ${studio.replyTime} with availability and options.`
    : `${prefix} with availability and options as soon as we can.`;
}
