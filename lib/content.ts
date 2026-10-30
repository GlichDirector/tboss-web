// Default website content. Work photos posted in the admin and Journal stories replace these.

export type Collection = 'Portraits' | 'Events' | 'Heritage';

export type Photo = {
  src: string;
  alt: string;
  tag: Collection;
  width: number;
  height: number;
};

export const heroSlides = [
  { src: '/photos/hero-1/w1600.webp', alt: 'Bridal beauty portrait with lace headpiece and pearl earring', eyebrow: 'Bridal & beauty', caption: 'Bridal portrait · Ibadan', pos: 'center 30%', bg: '#5A4632' },
  { src: '/photos/hero-2/w1600.webp', alt: 'Couple in cream and lace sharing a quiet moment', eyebrow: 'Weddings & couples', caption: 'Wedding portrait', pos: 'center 30%', bg: '#6B625A' },
  { src: '/photos/hero-3/w1600.webp', alt: 'Woman in a green pleated outfit in the Tboss studio', eyebrow: 'Portraits · Ibadan', caption: 'Studio portrait · Tboss studio', pos: 'center 25%', bg: '#2A3014' },
  { src: '/photos/hero-4/w1600.webp', alt: 'Elder in a colourful headwrap and pearls', eyebrow: 'Heritage & Legacy', caption: 'Heritage portrait', pos: 'center 25%', bg: '#1E2414' },
];

export const photos: Photo[] = [
  { src: '/photos/lace-pearl/w1600.webp', alt: 'Bridal portrait with lace headpiece and pearl earring', tag: 'Portraits', width: 1600, height: 1278 },
  { src: '/photos/couple-cream/w1600.webp', alt: 'Bride and groom in cream, eyes closed, close together', tag: 'Events', width: 1278, height: 1600 },
  { src: '/photos/headwrap-elder/w1600.webp', alt: 'Elder in a red and gold headwrap with pearls, hands at her chin', tag: 'Heritage', width: 1278, height: 1600 },
  { src: '/photos/green-pleats/w1600.webp', alt: 'Woman in a sculptural green pleated outfit', tag: 'Portraits', width: 1278, height: 1600 },
  { src: '/photos/couple-rings/w1600.webp', alt: 'Black and white portrait of a couple, rings and hands in focus', tag: 'Events', width: 1278, height: 1600 },
  { src: '/photos/white-hat-teal/w1600.webp', alt: 'Woman in a white dress and pearl-trimmed hat on a teal backdrop', tag: 'Portraits', width: 1278, height: 1600 },
  { src: '/photos/elder-flowers/w1600.webp', alt: 'Black and white portrait of an elder holding flowers and a cane', tag: 'Heritage', width: 1278, height: 1600 },
  { src: '/photos/lace-hands/w1600.webp', alt: 'Beauty portrait with lace headpiece, hands framing the face', tag: 'Portraits', width: 1600, height: 1278 },
  { src: '/photos/headwrap-elder-profile/w1600.webp', alt: 'Elder in a headwrap and pearls, in profile with eyes closed', tag: 'Heritage', width: 1278, height: 1600 },
  { src: '/photos/pearl-profile/w1600.webp', alt: 'Black and white profile with pearl earring and pearl necklaces', tag: 'Portraits', width: 1278, height: 1600 },
];

export const collections: { label: string; key: Collection | null; slug: string }[] = [
  { label: 'All', key: null, slug: '' },
  { label: 'Portraits', key: 'Portraits', slug: 'portraits' },
  { label: 'Events', key: 'Events', slug: 'events' },
  { label: 'Heritage', key: 'Heritage', slug: 'heritage' },
];

export const services = [
  { num: '01', title: 'Portraits', body: 'Personal, maternity and professional portraits with gentle direction.' },
  { num: '02', title: 'Families', body: 'Relaxed sessions at home, in the studio or somewhere meaningful to you.' },
  { num: '03', title: 'Events', body: 'Weddings, birthdays, owambes and milestones, documented with care.' },
  { num: '04', title: 'Heritage', body: 'Our project preserving elders, homes and traditions for the next generation.' },
];

export const values = [
  { title: 'Gently guided', body: 'No stiff poses. We direct softly so you can relax and simply be together.' },
  { title: 'Timeless, not trendy', body: 'Natural colour and honest light, so your images still feel right in twenty years.' },
  { title: 'Cared for after', body: 'A private gallery, help choosing favourites, and prints made to last.' },
];

export const steps = [
  { num: '01', title: 'Enquire', body: 'Tell us about your moment through the contact form or WhatsApp.' },
  { num: '02', title: 'Plan', body: 'We agree the date, location, outfits and the shots that matter to you.' },
  { num: '03', title: 'Shoot', body: 'A relaxed session, at home, in studio or wherever in the world you are.' },
  { num: '04', title: 'Receive', body: 'Your private online gallery arrives, ready to favourite, download and share.' },
];

export const faqs = [
  { q: 'Do you travel for sessions?', a: 'Yes. We are based in Ibadan and photograph across Nigeria and abroad. Travel costs depend on the location; we include them in your quote.' },
  { q: 'How soon will I receive my photos?', a: 'You first get a private online gallery of unedited photos to choose your favourites. We then edit your picks and deliver them to the same gallery.' },
  { q: 'How do I secure my date?', a: 'Your date is held once the deposit on your invoice is paid. We confirm the booking by email with the date, time and address.' },
  { q: 'Can we print our photos?', a: 'Yes. Ask us about prints and albums when your edited photos are delivered.' },
];

// Set once you have a real, approved quote from a client. Hidden while null.
export const testimonial: { quote: string; name: string; session: string } | null = null;

// ---------- Journal ----------

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'pair'; images: { src: string; alt: string }[] };

export type Story = {
  slug: string;
  title: string;
  category: 'Portraits' | 'Events' | 'Heritage' | 'Guides & tips';
  excerpt: string;
  cover: { src: string; alt: string };
  date: string; // YYYY-MM-DD
  location: string;
  session?: string;
  styling?: string;
  instagramUrl?: string;
  keywords: string[];
  lead: string;
  body: Block[];
  sample?: boolean; // sample stories show only on preview copies, never on the live site
};

const allStories: Story[] = [
  {
    slug: 'sample-heritage-portrait-session',
    sample: true,
    title: 'Sample story: a heritage portrait session in Ibadan',
    category: 'Heritage',
    excerpt: 'This is a layout sample. Real stories are drafted from the studio’s photos and approved in the admin before they appear.',
    cover: { src: '/photos/headwrap-elder/w1600.webp', alt: 'Elder in a red and gold headwrap with pearls' },
    date: '2026-10-01',
    location: 'Tboss studio, Ibadan',
    session: 'Heritage portrait',
    keywords: ['Ibadan portrait photographer', 'Heritage portraits', 'Oyo State'],
    lead: 'This sample shows how a Journal story is laid out. In the finished site, each story is drafted from the studio’s photos and note, edited by the studio, and only then published.',
    body: [
      { type: 'p', text: 'The opening paragraphs introduce the people in the photographs and why the session mattered, in the studio’s own voice.' },
      { type: 'pair', images: [
        { src: '/photos/headwrap-elder-profile/w1600.webp', alt: 'Elder in a headwrap, in profile' },
        { src: '/photos/elder-flowers/w1600.webp', alt: 'Black and white portrait of an elder with flowers' },
      ] },
      { type: 'h2', text: 'A sub-heading with the words people search for' },
      { type: 'p', text: 'Helpful detail for future clients goes here: what to wear, timing, locations and tips. This is the part that helps the story rank in Google.' },
      { type: 'quote', text: 'A real line from the clients about their experience goes here, with their permission.' },
      { type: 'p', text: 'A closing paragraph invites readers to book a similar session.' },
    ],
  },
  {
    slug: 'sample-bridal-beauty-portraits',
    sample: true,
    title: 'Sample story: bridal beauty portraits with lace and pearls',
    category: 'Portraits',
    excerpt: 'A second layout sample, so the Journal grid and related stories can be reviewed.',
    cover: { src: '/photos/lace-pearl/w1600.webp', alt: 'Bridal portrait with lace headpiece and pearl earring' },
    date: '2026-09-18',
    location: 'Tboss studio, Ibadan',
    session: 'Bridal portrait',
    keywords: ['Bridal portraits Ibadan', 'Beauty photography'],
    lead: 'A second sample story for reviewing the layout.',
    body: [
      { type: 'p', text: 'Sample body text.' },
      { type: 'image', src: '/photos/lace-hands/w1600.webp', alt: 'Beauty portrait with lace headpiece, hands framing the face' },
      { type: 'p', text: 'Sample closing paragraph.' },
    ],
  },
  {
    slug: 'sample-wedding-portraits-in-cream',
    sample: true,
    title: 'Sample story: a wedding couple in cream and lace',
    category: 'Events',
    excerpt: 'A third layout sample.',
    cover: { src: '/photos/couple-cream/w1600.webp', alt: 'Bride and groom in cream' },
    date: '2026-09-02',
    location: 'Ibadan',
    session: 'Wedding portraits',
    keywords: ['Wedding photographer Ibadan'],
    lead: 'A third sample story for reviewing the layout.',
    body: [
      { type: 'p', text: 'Sample body text.' },
      { type: 'image', src: '/photos/couple-rings/w1600.webp', alt: 'Black and white portrait of a couple with rings' },
    ],
  },
];

const showSamples = process.env.SHOW_SAMPLES === '1';

export function getStories(): Story[] {
  return allStories
    .filter((s) => showSamples || !s.sample)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getStory(slug: string): Story | undefined {
  return getStories().find((s) => s.slug === slug);
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${months[m - 1]} ${y}`;
}

export function readMinutes(story: Story) {
  const words = [story.lead, ...story.body.map((b) => ('text' in b ? b.text : ''))].join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
