import 'server-only';
import { CATEGORIES, createStory } from './journal';
import { getObject } from './storage';

const SYSTEM = `You write Journal articles for Tboss Photography, a female-led photography studio in Ibadan, Oyo State, Nigeria, run by Oluwatosin Aremu.
Write warm, honest, unhurried prose in British English, in the studio's voice ("we"). The article must help future clients and rank in Google for local searches such as "portrait photographer Ibadan", "event photographer Ibadan" or "heritage portraits Nigeria".
Rules:
- Use only facts given in the studio's note or clearly visible in the photos. Never invent names, places, dates, quotes, prices or numbers. If a detail is unknown, write around it.
- Natural SEO: put the main search phrase in the title and first paragraph, use one or two helpful sub-headings with natural search phrases, and include a short practical section for people planning a similar session in Ibadan.
- 450 to 700 words in total. No hashtags, no emoji, no keyword stuffing.
- Describe every photo you are given in one plain sentence (for Google Images and screen readers), in the same order as the photos.
Reply with JSON only, no other text, in exactly this shape:
{"title": string (max 65 characters), "category": one of ${JSON.stringify(CATEGORIES)}, "excerpt": string (max 155 characters, for Google results),
 "lead": string (1-2 sentences), "body": [{"type": "p" | "h2" | "quote", "text": string}], "keywords": [string] (4-6 search phrases),
 "location": string or "", "session_type": string or "", "alts": [string] (one per photo, same order)}`;

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

export type Drafted = { storyId: number; alts: string[]; body: { type: string; text: string }[] };

// Writes an SEO article from the studio's short note and up to 4 of the photos.
export async function draftArticle(note: string, category: string, photos: { key: string; type: string }[]): Promise<Drafted> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('AI isn’t connected yet. Add ANTHROPIC_API_KEY in Hostinger.');
  const sample = photos.slice(0, 4);
  const images = await Promise.all(sample.map(async (p) => ({
    type: 'image', source: { type: 'base64', media_type: p.type, data: (await getObject(p.key)).toString('base64') },
  })));
  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 3000,
      system: SYSTEM,
      messages: [{ role: 'user', content: [
        ...images,
        { type: 'text', text: `Category chosen by the studio: ${category}\nNumber of photos shown: ${sample.length}\nStudio's note about this session:\n${note || '(no note)'}` },
      ] }],
    }),
  });
  if (!res.ok) throw new Error(`The AI couldn’t write the article (${res.status}). ${(await res.text()).slice(0, 160)}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
  let json: { title: string; category: string; excerpt: string; lead: string; body: { type: string; text: string }[]; keywords: string[]; location: string; session_type: string; alts: string[] };
  try { json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch { throw new Error('The AI reply couldn’t be read. Please try again.'); }
  const body = (json.body || []).filter((b) => ['p', 'h2', 'quote'].includes(b.type) && b.text).map((b) => ({ type: b.type, text: b.text }));
  const storyId = await createStory({
    title: (json.title || 'New story').slice(0, 200), source: 'ai', category: (CATEGORIES as readonly string[]).includes(json.category) ? json.category : category,
    excerpt: (json.excerpt || '').slice(0, 400), lead: json.lead || '', body: JSON.stringify(body),
    location: json.location || null, session_type: json.session_type || null, keywords: (json.keywords || []).join(', '),
  });
  return { storyId, alts: json.alts || [], body };
}
