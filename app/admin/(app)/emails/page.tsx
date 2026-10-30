import EmailBuilder from '@/components/admin/EmailBuilder';
import { getTemplates } from '@/lib/mail';
import { requireArea } from '@/lib/team';

export default async function EmailsPage() {
  await requireArea('website');
  const templates = await getTemplates();
  return (
    <>
      <div className="a-head"><div><p className="a-kicker">Website</p><h1>Emails</h1></div></div>
      <p className="a-sub" style={{ margin: '-8px 0 16px', maxWidth: 680 }}>These go out automatically at each step. Change the wording, preview it, and send yourself a test.{!process.env.RESEND_API_KEY && ' Email delivery isn’t connected yet (RESEND_API_KEY), so nothing is delivered until it is.'}</p>
      <EmailBuilder templates={templates} />
    </>
  );
}
