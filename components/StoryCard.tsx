import Link from 'next/link';
import { formatDate, type Story } from '@/lib/content';

export default function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/journal/${story.slug}`} className="story-card">
      <div className="frame"><img src={story.cover.src} alt={story.cover.alt} loading="lazy" /></div>
      <span className="cat">{story.category}</span>
      <h3>{story.title}</h3>
      <span className="meta">{story.location} · {formatDate(story.date)}</span>
    </Link>
  );
}
