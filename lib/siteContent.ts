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
