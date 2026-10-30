import type { Collection } from './content';

// Search-friendly copy for each Work category page (/work/portraits etc.).
export const workCategories: Record<string, { key: Collection; title: string; h1: string; description: string; intro: string }> = {
  portraits: {
    key: 'Portraits', h1: 'Portraits',
    title: 'Portrait photographer in Ibadan · Portraits, family & bridal',
    description: 'Portrait, family, maternity and bridal photography by Tboss Photography, a female-led studio in Ibadan, Oyo State. In studio or on location.',
    intro: 'Personal, family, maternity, bridal and professional portraits, gently guided in our Ibadan studio or somewhere that means something to you.',
  },
  events: {
    key: 'Events', h1: 'Events',
    title: 'Event & wedding photographer in Ibadan',
    description: 'Weddings, birthdays, owambes and milestones photographed with care by Tboss Photography in Ibadan and across Nigeria.',
    intro: 'Weddings, birthdays, owambes and milestones, documented honestly so you can relive the day exactly as it felt.',
  },
  heritage: {
    key: 'Heritage', h1: 'Heritage & Legacy',
    title: 'Heritage portraits in Nigeria · Elders, homes & traditions',
    description: 'The Heritage & Legacy Project by Tboss Photography: portraits of elders, family homes and Yoruba traditions, preserved for the next generation.',
    intro: 'Our ongoing work documenting elders, old houses and traditions before they fade, preserving stories for the generations after us.',
  },
};
