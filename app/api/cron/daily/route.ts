import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { bookingsNeedingReminder, lagosDate, logEvent, markReminded } from '@/lib/studio';
import { emailReminder } from '@/lib/studioMail';

// Called once a day by a Hostinger cron job: sends "see you tomorrow" reminders.
// Safe to call more than once a day; each client is reminded only once.
export async function GET(req: NextRequest) {
  const want = process.env.CRON_SECRET || '';
  const got = req.nextUrl.searchParams.get('key') || '';
  if (!want || want.length !== got.length || !timingSafeEqual(Buffer.from(want), Buffer.from(got))) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
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
  return NextResponse.json({ ok: true, date: tomorrow, due: due.length, sent });
}
