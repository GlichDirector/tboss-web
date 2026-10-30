import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { aiConfigured, draftStoryFromPost } from '@/lib/ai';
import { igState, instagramConfigured, syncInstagram } from '@/lib/instagram';
import { getPost } from '@/lib/journal';
import { bookingsNeedingReminder, lagosDate, logEvent, markReminded } from '@/lib/studio';
import { emailReminder } from '@/lib/studioMail';

export const maxDuration = 110;

// Called by a Hostinger cron job (every hour is best). Each run:
// 1) copies new Instagram posts to the Work page and drafts up to 2 Journal stories for approval,
// 2) from 8 AM Lagos time, sends "see you tomorrow" reminders (each client only once).
export async function GET(req: NextRequest) {
  const want = process.env.CRON_SECRET || '';
  const got = req.nextUrl.searchParams.get('key') || '';
  if (!want || want.length !== got.length || !timingSafeEqual(Buffer.from(want), Buffer.from(got))) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  const out: Record<string, unknown> = {};

  if (await instagramConfigured()) {
    const sync = await syncInstagram();
    out.instagram = sync;
    if (aiConfigured() && (await igState()).autoDraft) {
      const drafted: number[] = [];
      for (const id of sync.added.slice(0, 2)) {
        const post = await getPost(id);
        if (post && post.media_type !== 'VIDEO') {
          try { drafted.push(await draftStoryFromPost(post)); } catch (e) { out.aiError = e instanceof Error ? e.message : 'AI failed'; }
        }
      }
      out.drafted = drafted;
    }
  }

  const lagosHour = Number(new Date(Date.now() + 3600000).toISOString().slice(11, 13));
  if (lagosHour >= 8 || req.nextUrl.searchParams.get('now') === '1') {
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
    out.reminders = { date: tomorrow, due: due.length, sent };
  }
  return NextResponse.json({ ok: true, ...out });
}
