import { WorkList, WorkPoster } from '@/components/admin/WorkTools';
import { aiConfigured } from '@/lib/ai';
import { listWorkPhotos, workSrc } from '@/lib/journal';
import { requireArea } from '@/lib/team';

export default async function WorkAdmin() {
  await requireArea('website');
  const rows = await listWorkPhotos();
  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker">Website</p><h1>Work</h1><p className="a-sub" style={{ margin: 0 }}>Post photos to the Work page under Portraits, Events or Heritage, with an optional Journal article written by AI.</p></div>
        <a href="/work" target="_blank" rel="noopener noreferrer" className="btn btn-outline a-sm">View Work page</a>
      </div>
      <WorkPoster aiReady={aiConfigured()} />
      <h2 className="a-h2" style={{ marginTop: 28 }}>On the website ({rows.length})</h2>
      <p className="a-sub" style={{ margin: '0 0 12px' }}>Until you post your first photos, the Work page shows the studio’s starter photos.</p>
      <WorkList rows={rows.map((r) => ({ id: r.id, src: workSrc(r, 640), category: r.category, hidden: r.hidden, in_work: r.in_work, alt: r.alt, story_id: r.story_id, title: r.title, status: r.status }))} />
    </>
  );
}
