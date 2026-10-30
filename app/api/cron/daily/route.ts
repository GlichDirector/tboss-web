import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { bookingsNeedingReminder, lagosDate, logEvent, markReminded } from '@/lib/studio';
import { emailReminder } from '@/lib/studioMail';
import { pruneViews } from '@/lib/analytics';

// Called by a Hostinger cron job (once a day, or every hour). From 8 AM Lagos time it sends
// "see you tomorrow" reminders; each client is reminded only once.
export async function GET(req: NextRequest) {
  const want = process.env.CRON_SECRET || '';
  const got = req.nextUrl.searchParams.get('key') || '';
  if (!want || want.length !== got.length || !timingSafeEqual(Buffer.from(want), Buffer.from(got))) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  try { await pruneViews(); } catch { /* visit stats older than ~13 months are cleared */ }
  const lagosHour = Number(new Date(Date.now() + 3600000).toISOString().slice(11, 13));
  if (lagosHour < 8 && req.nextUrl.searchParams.get('now') !== '1') return NextResponse.json({ ok: true, reminders: 'waiting until 8 AM' });
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
  return NextResponse.json({ ok: true, reminders: { date: tomorrow, due: due.length, sent } });
}
