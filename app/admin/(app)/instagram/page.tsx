import { AutoDraft, PostTools, SyncButton } from '@/components/admin/InstagramTools';
import { aiConfigured } from '@/lib/ai';
import { igState, instagramConfigured } from '@/lib/instagram';
import { listPosts, mediaSrc } from '@/lib/journal';
import { requireArea } from '@/lib/team';

export default async function InstagramAdmin() {
  await requireArea('website');
  const [connected, state, posts] = await Promise.all([instagramConfigured(), igState(), listPosts()]);
  const ai = aiConfigured();
  return (
    <>
      <div className="a-head"><div><p className="a-kicker">Website</p><h1>Work &amp; Instagram</h1></div>{connected && <SyncButton />}</div>
      <div className="a-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {!connected ? (
          <p style={{ margin: 0 }}><strong>Instagram isn’t connected yet.</strong> <span className="a-sub">Add INSTAGRAM_TOKEN in Hostinger (see the setup steps). Until then, the Work page shows the studio’s starter photos.</span></p>
        ) : (
          <>
            <p style={{ margin: 0 }}><strong>Connected to @tee_boss.imagery.</strong> <span className="a-sub">New posts appear on the Work page automatically each hour.{state.lastSync && ` Last checked ${state.lastSync.slice(0, 16).replace('T', ' ')} UTC.`}</span></p>
            {state.lastError && <div className="alert">Last check failed: {state.lastError}</div>}
          </>
        )}
        {ai ? <AutoDraft on={state.autoDraft !== false} /> : <span className="a-sub">AI drafting is off until ANTHROPIC_API_KEY is added in Hostinger.</span>}
      </div>
      {posts.length === 0 ? <p className="a-sub">No posts copied yet.</p> : (
        <div className="a-igrid">
          {posts.map((p) => (
            <div key={p.id} className="a-card a-ipost" style={{ opacity: p.hidden ? 0.55 : 1 }}>
              <img src={mediaSrc(p.image_key)} alt="" loading="lazy" />
              <p className="a-sub" style={{ margin: 0 }}>{(p.caption || 'No caption').slice(0, 110)}{(p.caption || '').length > 110 ? '…' : ''}</p>
              <PostTools id={p.id} tag={p.tag} hidden={Boolean(p.hidden)} hasStory={Boolean(p.story_id)} ai={ai} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
