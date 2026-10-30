import 'server-only';
import { createStory, CATEGORIES } from './journal';
import { exec } from './db';
import { getObject } from './storage';
import type { PostRow } from './journal';


const SYSTEM = `You write Journal stories for Tboss Photography, a female-led photography studio in Ibadan, Oyo State, Nigeria, run by Oluwatosin Aremu.
Write warm, honest, unhurried prose in British English, in the studio's voice ("we"). The goal is a story that helps future clients and ranks in Google for searches like "family photographer Ibadan".
Rules:
- Use only facts found in the Instagram caption or clearly visible in the photo. Never invent names, places, dates, quotes or numbers. If a detail is unknown, write around it.
- Include one helpful sub-heading with a natural search phrase, and a short practical paragraph for people planning a similar session.
- 350 to 600 words in total. No hashtags, no emoji.
Reply with JSON only, no other text, in exactly this shape:
{"title": string, "category": one of ${JSON.stringify(CATEGORIES)}, "excerpt": string (max 200 chars), "lead": string (1-2 sentences),
 "body": [{"type": "p" | "h2" | "quote", "text": string}], "keywords": [string] (3-6 search phrases), "location": string or "", "session_type": string or "", "alt": string (describe the photo in one sentence)}`;

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function draftStoryFromPost(post: PostRow): Promise<number> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('AI isn’t connected yet (ANTHROPIC_API_KEY).');
  if (!post.image_key) throw new Error('This post has no photo.');
  const image = (await getObject(post.image_key)).toString('base64');
  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: `Instagram caption:\n${post.caption || '(no caption)'}\n\nPosted: ${post.posted_at || 'unknown'}` },
      ] }],
    }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as {
    title: string; category: string; excerpt: string; lead: string; body: { type: string; text: string }[]; keywords: string[]; location: string; session_type: string; alt: string;
  };
  const body = (json.body || []).filter((b) => ['p', 'h2', 'quote'].includes(b.type) && b.text).map((b) => ({ type: b.type, text: b.text }));
  const id = await createStory({
    title: json.title || 'New story', source: 'ai', category: (CATEGORIES as readonly string[]).includes(json.category) ? json.category : 'Portraits',
    excerpt: (json.excerpt || '').slice(0, 400), lead: json.lead || '', body: JSON.stringify(body), cover_key: post.image_key, cover_alt: json.alt || null,
    location: json.location || null, session_type: json.session_type || null, keywords: (json.keywords || []).join(', '), instagram_id: post.id, instagram_url: post.permalink,
  });
  await exec('UPDATE instagram_posts SET story_id = ? WHERE id = ?', [id, post.id]);
  return id;
}
