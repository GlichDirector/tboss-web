import ActionForm from '@/components/admin/ActionForm';
import { requireArea } from '@/lib/team';
import PackagesEditor from '@/components/admin/PackagesEditor';
import { saveStudioSettingsAction } from '@/app/admin/studio-actions';
import { getPackages, getStudio } from '@/lib/studio';

export default async function SettingsPage() {
  await requireArea('settings');
  const [studio, packages] = await Promise.all([getStudio(), getPackages()]);
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
  return (
    <>
      <div className="a-head"><div><p className="a-kicker">Studio</p><h1>Settings</h1></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PackagesEditor initial={packages} />
        <ActionForm action={saveStudioSettingsAction} submit="Save studio details" className="a-card a-form">
          <div><h2 className="a-h2">Invoices &amp; bookings</h2><p className="a-sub" style={{ margin: 0 }}>Bank details appear on every invoice. The studio address is used for studio bookings and reminders.</p></div>
          <div className="a-grid">
            <div className="field"><label htmlFor="bankName">Bank</label><input className="input" id="bankName" name="bankName" defaultValue={studio.bankName} placeholder="e.g. GTBank" /></div>
            <div className="field"><label htmlFor="accountNumber">Account number</label><input className="input" id="accountNumber" name="accountNumber" inputMode="numeric" defaultValue={studio.accountNumber} /></div>
            <div className="field span-2"><label htmlFor="accountName">Account name</label><input className="input" id="accountName" name="accountName" defaultValue={studio.accountName} /></div>
            <div className="field"><label htmlFor="depositPercent">Deposit to hold a date (%)</label><input className="input" id="depositPercent" name="depositPercent" inputMode="numeric" defaultValue={studio.depositPercent} /></div>
            <div className="field"><label htmlFor="replyTime">How fast you reply to enquiries</label><input className="input" id="replyTime" name="replyTime" defaultValue={studio.replyTime} placeholder="e.g. 24 hours" /></div>
            <div className="field span-2"><label htmlFor="studioAddress">Studio address</label><input className="input" id="studioAddress" name="studioAddress" defaultValue={studio.studioAddress} /></div>
            <div className="field span-2"><label htmlFor="invoiceNote">Note at the bottom of invoices</label><textarea className="input" id="invoiceNote" name="invoiceNote" rows={3} defaultValue={studio.invoiceNote} /></div>
          </div>
        </ActionForm>
        <div className="a-card">
          <h2 className="a-h2">Team</h2>
          <p className="a-sub" style={{ margin: 0 }}>Owners: {admins.join(', ')}. Invite team members and choose what they can see on the <a className="a-link" href="/admin/team">Team page</a>.</p>
        </div>
      </div>
    </>
  );
}
