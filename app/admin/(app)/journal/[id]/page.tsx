import Link from 'next/link';
import { notFound } from 'next/navigation';
import StoryEditor from '@/components/admin/StoryEditor';
import { mediaSrc, storyRow } from '@/lib/journal';
import { requireArea } from '@/lib/team';

export default async function EditStory({ params }: { params: Promise<{ id: string }> }) {
  await requireArea('website');
  const r = await storyRow(Number((await params).id));
  if (!r) notFound();
  let blocks: { type: string; text?: string; src?: string; alt?: string; images?: { src: string; alt: string }[] }[] = [];
  try { blocks = JSON.parse(r.body); } catch { blocks = []; }
  // Older "pair" blocks become two photo blocks in the editor.
  const flat = blocks.flatMap((b) => (b.type === 'pair' ? (b.images || []).map((im) => ({ type: 'image', src: im.src, alt: im.alt })) : [b]));
  return (
    <>
      <div className="a-head"><div><p className="a-kicker"><Link href="/admin/journal">Journal</Link> /</p><h1>{r.status === 'draft' ? 'Edit draft' : 'Edit story'}</h1></div></div>
      <StoryEditor
        id={r.id}
        status={r.status}
        source={r.source}
        blocks={flat as never}
        initial={{
          title: r.title, slug: r.slug, category: r.category, excerpt: r.excerpt || '', lead: r.lead || '', body: r.body,
          cover_key: r.cover_key ? mediaSrc(r.cover_key) : '', cover_alt: r.cover_alt || '', location: r.location || '', session_type: r.session_type || '',
          styling: r.styling || '', keywords: r.keywords || '',
        }}
      />
    </>
  );
}
