import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { bookingsNeedingReminder, lagosDate, logEvent, markReminded } from '@/lib/studio';
import { emailReminder } from '@/lib/studioMail';
import { pruneViews } from '@/lib/analytics';
import { siteOrigin } from '@/lib/auth';
import { extraTotal, selectionsToAutoSend, splitPicks, submitSelection } from '@/lib/galleries';
import { brandedEmail, notifyStudio, sendMail } from '@/lib/mail';

// Clients who hearted photos but forgot to press "Send selection": their hearts are taken
// as their selection after a quiet day, or once the choose-by date has passed.
async function autoSelections() {
  let n = 0;
  for (const { gallery: g, email, ids } of await selectionsToAutoSend()) {
    await submitSelection(g.id, email, ids, true);
    const { pkg, extra } = splitPicks(ids, g.selection_limit);
    const fee = extraTotal(g.extra_price, extra.length);
    await notifyStudio(`${g.client_name}: ${ids.length} picks taken from their hearts`,
      `<p>${email} hearted ${ids.length} photos in <strong>${g.title}</strong> but didn’t press Send, so we took their hearts as their selection: ${pkg.length} in the package${extra.length ? ` and <strong>${extra.length} extra</strong>${fee ? ` (${fee})` : ''}` : ''}.</p><p>Open the gallery’s Selections tab to copy the file names.</p>`);
    await sendMail(email, 'We’ve received your photo selection', brandedEmail({
      heading: 'We’ve got your picks',
      intro: `You hearted ${ids.length} photo${ids.length === 1 ? '' : 's'} in <strong>${g.title}</strong>, so we’ve taken them as your selection and started on your edits. If you’d like to change anything, just reply to this email.`,
      rows: [['Package photos', String(pkg.length)], ...(extra.length ? [['Extra photos', `${extra.length}${fee ? ` · ${fee}` : ''}`] as [string, string]] : [])],
      cta: { label: 'View your gallery', url: `${siteOrigin()}/g/${g.slug}?k=${g.access_key}` },
    }));
    n++;
  }
  return n;
}

// Called by a Hostinger cron job (once a day, or every hour). From 8 AM Lagos time it sends
// "see you tomorrow" reminders; each client is reminded only once.
export async function GET(req: NextRequest) {
  const want = process.env.CRON_SECRET || '';
  const got = req.nextUrl.searchParams.get('key') || '';
  if (!want || want.length !== got.length || !timingSafeEqual(Buffer.from(want), Buffer.from(got))) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  try { await pruneViews(); } catch { /* visit stats older than ~13 months are cleared */ }
  let autoSent = 0;
  try { autoSent = await autoSelections(); } catch (e) { console.error('auto selections failed', e); }
  const lagosHour = Number(new Date(Date.now() + 3600000).toISOString().slice(11, 13));
  if (lagosHour < 8 && req.nextUrl.searchParams.get('now') !== '1') return NextResponse.json({ ok: true, autoSelections: autoSent, reminders: 'waiting until 8 AM' });
  const tomorrow = lagosDate(1);
  const due = await bookingsNeedingReminder(tomorrow);
  let sent = 0;
  for (const b of due) {
    if (await emailReminder({ name: b.client_name, email: b.email }, b)) {
      await markReminded(b.id);
      await logEvent(b.order_id, `Reminder sent for tomorrow (${b.session_time})`);
      sent++;
    }
  }
  return NextResponse.json({ ok: true, autoSelections: autoSent, reminders: { date: tomorrow, due: due.length, sent } });
}
