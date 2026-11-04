import 'server-only';
import { cache } from 'react';
import { dbConfigured, q } from './db';
import { faqs as defaultFaqs, heroSlides, services as defaultServices, steps as defaultSteps, values as defaultValues } from './content';

// Everything on the public pages that the studio can edit in Pages & design.
// If the database can't be reached, the site quietly falls back to these defaults.

export type Slide = { src: string; alt: string; eyebrow: string; caption: string; pos: string };
export type Card = { title: string; body: string };
export type Faq = { q: string; a: string };

export type SiteContent = {
  home: {
    heroTitle: string; heroTitleItalic: string; heroSub: string; slides: Slide[];
    showServices: boolean; services: Card[];
    showWork: boolean; workTitle: string;
    showAbout: boolean; aboutTitle: string; aboutText: string; aboutImage: string;
    showHeritage: boolean; heritageTitle: string; heritageText: string; heritageImage: string;
    showGalleries: boolean; galleriesTitle: string; galleriesText: string;
    showJournal: boolean;
    testimonialQuote: string; testimonialName: string; testimonialSession: string;
    ctaTitle: string; ctaText: string;
  };
  about: {
    title: string; intro: string; story: string; image: string;
    valuesTitle: string; values: Card[];
    stepsTitle: string; steps: Card[];
    showHeritage: boolean; heritageText: string; heritageImage: string;
    ctaTitle: string;
  };
  contact: { title: string; intro: string; replyTime: string; faqs: Faq[] };
  work: { intro: string };
  legacy: {
    open: boolean; closedText: string;
    heroEyebrow: string; heroTitle: string; heroTitleItalic: string; heroText: string; heroImage: string; ctaLabel: string;
    whyTitle: string; whyText: string; whyImage: string; whyQuote: string;
    offerTitle: string; offers: Card[]; feeText: string;
    showStories: boolean; storiesTitle: string; storiesText: string;
    stepsTitle: string; steps: Card[];
    whoTitle: string; who: Card[];
    rightsTitle: string; rightsText: string;
    formTitle: string; formIntro: string;
    faqs: Faq[];
    closingTitle: string;
  };
};

export const defaultContent: SiteContent = {
  home: {
    heroTitle: 'Portraits, families & celebrations,', heroTitleItalic: 'told with warmth.',
    heroSub: 'A female-led studio in Ibadan creating honest, timeless images, wherever in the world your moment is.',
    slides: heroSlides.map(({ src, alt, eyebrow, caption, pos }) => ({ src, alt, eyebrow, caption, pos })),
    showServices: true, services: defaultServices.map(({ title, body }) => ({ title, body })),
    showWork: true, workTitle: 'Selected work',
    showAbout: true, aboutTitle: 'Behind the lens is Oluwatosin Aremu.',
    aboutText: 'Tboss Photography documents portraits, families and celebrations from our home in Ibadan to destinations around the world. Every session is guided gently, so you can simply be yourselves.',
    aboutImage: '/photos/green-pleats/w1600.webp',
    showHeritage: true, heritageTitle: 'The Heritage & Legacy Project',
    heritageText: 'Our ongoing work documenting elders, old houses and traditions before they fade, preserving stories for the generations after us.',
    heritageImage: '/photos/hero-4/w1600.webp',
    showGalleries: true, galleriesTitle: 'Your gallery, beautifully delivered.',
    galleriesText: 'Open the link we send you and your photos are right there. Sign in with Google only when you want to save favourites or download.',
    showJournal: true,
    testimonialQuote: '', testimonialName: '', testimonialSession: '',
    ctaTitle: 'Tell us about your moment.', ctaText: 'Share a few details.',
  },
  about: {
    title: 'Hello, I am Oluwatosin.',
    intro: 'I founded Tboss Photography in Ibadan to make images that feel like the people in them: warm, unhurried and true. Today the studio photographs portraits, families and celebrations at home and around the world.',
    story: '', image: '/photos/white-hat-teal/w1600.webp',
    valuesTitle: 'How we work with you', values: defaultValues,
    stepsTitle: 'From first message to final gallery', steps: defaultSteps.map(({ title, body }) => ({ title, body })),
    showHeritage: true, heritageText: 'Alongside client work, we document elders, old homes and traditions so their stories outlive us.', heritageImage: '/photos/elder-flowers/w1600.webp',
    ctaTitle: 'Wherever your moment is, we will be there.',
  },
  contact: { title: 'Let us plan your session.', intro: 'Tell us a little about what you have in mind.', replyTime: '', faqs: defaultFaqs },
  work: { intro: 'Recent photographs from the studio and on location.' },
  legacy: {
    open: true,
    closedText: 'Nominations are closed for now. Follow us on Instagram to hear when the next round opens.',
    heroEyebrow: 'The Heritage & Legacy Project',
    heroTitle: 'Preserving Legacy:', heroTitleItalic: 'honour an elder while they are still with us.',
    heroText: 'Nominate a parent, grandparent or elder aged 80 or above in Southwest Nigeria. Sponsor their session, and we will photograph and film them in one beautiful look, and tell their story for the generations after them.',
    heroImage: '/photos/headwrap-elder/w1600.webp', ctaLabel: 'Nominate an elder',
    whyTitle: 'Why we started preserving legacy',
    whyText: 'Every family has an elder whose face holds a whole history: the songs, the proverbs, the journeys, the way they tie their gele. Too often the only photographs we have of them are old, faded or taken in a hurry.\n\nWe started the Heritage & Legacy Project to change that. Alongside our client work, we photograph elders, old homes and traditions before they fade, so their stories outlive us and their great-grandchildren can see exactly who they were.\n\nPreserving Legacy opens that work to you. Tell us about someone you love, and we will give them the dignity of a proper portrait session and a story told with care.',
    whyImage: '/photos/elder-flowers/w1600.webp', whyQuote: '',
    offerTitle: 'What the session includes',
    offers: [
      { title: 'Portraits in one look', body: 'A gently guided portrait session in one outfit of their choice, at home or in our Ibadan studio.' },
      { title: 'A short film', body: 'Video of them in that look, with their voice and their story where they are happy to share it.' },
      { title: 'Their story, told', body: 'We listen to the family and write their story, to publish on our Journal, with the media and in photography competitions.' },
    ],
    feeText: '',
    showStories: true, storiesTitle: 'Stories we have preserved', storiesText: 'Some of the elders we have photographed so far.',
    stepsTitle: 'How it works',
    steps: [
      { title: 'Nominate', body: 'Tell us about your elder in the form below. It takes about five minutes.' },
      { title: 'We call you', body: 'We read every nomination and call to talk through the story, the look, the date and the sponsorship.' },
      { title: 'The shoot', body: 'We come to them or welcome them to our studio, and work slowly and at their pace.' },
      { title: 'Their story lives on', body: 'We edit the photos and film and publish their story for the world to see.' },
    ],
    whoTitle: 'Who can be nominated',
    who: [
      { title: 'Aged 80 or above', body: 'A parent, grandparent, relative or respected elder in your community.' },
      { title: 'In Southwest Nigeria', body: 'Living in Lagos, Ogun, Oyo, Osun, Ondo or Ekiti State.' },
      { title: 'Happy to take part', body: 'They, and their family, agree to be photographed, filmed and to share their story.' },
      { title: 'Sponsored', body: 'You, or another family member, sponsor the shoot.' },
    ],
    rightsTitle: 'Using the photographs and story',
    rightsText: 'Preserving Legacy exists to share these stories widely. By nominating, you confirm that the elder and their family agree that Tboss Photography may use the photographs, videos and story without limit: on our website and social media, in print, in features with newspapers, magazines, broadcasters and other media, and in photography competitions and exhibitions. We will always present your elder with respect.',
    formTitle: 'Nominate an elder', formIntro: 'Tell us about them in your own words. We read every nomination and will call you.',
    faqs: [
      { q: 'Who pays for the session?', a: 'The person who nominates, or another family member, sponsors the shoot. We share the fee and what it covers when we call you.' },
      { q: 'Can you come to their home?', a: 'Yes, anywhere in Southwest Nigeria: Lagos, Ogun, Oyo, Osun, Ondo and Ekiti. We will agree the location when we call.' },
      { q: 'What if they cannot stand or walk far?', a: 'That is fine. We work slowly, with seating and breaks, and plan everything around their comfort.' },
      { q: 'Does every nomination get a shoot?', a: 'We read every nomination and call the families we can photograph. Sessions are limited, so we may not be able to say yes to everyone.' },
    ],
    closingTitle: 'Their story deserves to be remembered.',
  },
};

function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== 'object' || Array.isArray(base)) return (over as T) ?? base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    if (!(k in out)) continue;
    const b = out[k];
    out[k] = b && typeof b === 'object' && !Array.isArray(b) ? merge(b, v) : v ?? b;
  }
  return out as T;
}

export const getContent = cache(async (): Promise<SiteContent> => {
  if (!dbConfigured()) return defaultContent;
  try {
    const row = (await q<{ v: string }>("SELECT v FROM settings WHERE k = 'site'"))[0];
    return row ? merge(defaultContent, JSON.parse(row.v)) : defaultContent;
  } catch {
    return defaultContent;
  }
});
