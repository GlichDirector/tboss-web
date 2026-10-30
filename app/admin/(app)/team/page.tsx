import { InviteForm, MemberRow } from '@/components/admin/TeamTools';
import { listTeam, requireArea, ROLES } from '@/lib/team';
import { CopyButton } from '@/components/admin/GalleryTools';
import { siteOrigin } from '@/lib/auth';

export default async function TeamPage() {
  await requireArea('settings');
  const team = await listTeam();
  const owners = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
  const help = Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, v.help]));
  return (
    <>
      <div className="a-head"><div><p className="a-kicker">Studio</p><h1>Team</h1></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <InviteForm help={help} />
        <div className="a-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="a-table">
            <thead><tr><th>Person</th><th>Status</th><th>Role</th></tr></thead>
            <tbody>
              {owners.map((o) => <tr key={o}><td><strong>{o}</strong></td><td><span className="a-badge a-finished">Owner</span></td><td className="a-sub">Full access (set in Hostinger)</td></tr>)}
              {team.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.name || m.email}</strong>{m.name && <div className="a-sub">{m.email}</div>}</td>
                  <td>{m.accepted_at ? <span className="a-badge a-finished">Active</span> : <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span className="a-badge a-selection">Invite pending</span>{m.invite_token && <CopyButton text={`${siteOrigin()}/admin/join/${m.invite_token}`} label="Copy invite link" done="Link copied" />}</span>}</td>
                  <td><MemberRow id={m.id} role={m.role} pending={!m.accepted_at} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
