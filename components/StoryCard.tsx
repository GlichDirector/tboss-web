import Link from 'next/link';
import Pic from './Pic';
import { formatDate, type Story } from '@/lib/content';

export default function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/journal/${story.slug}`} className="story-card">
      <div className="frame"><Pic src={story.cover.src} alt={story.cover.alt} sizes="(max-width: 760px) 100vw, 33vw" /></div>
      <span className="cat">{story.category}</span>
      <h3>{story.title}</h3>
      <span className="meta">{story.location} · {formatDate(story.date)}</span>
    </Link>
  );
}
