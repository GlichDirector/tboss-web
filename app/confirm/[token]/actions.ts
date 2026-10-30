'use server';

import { revalidatePath } from 'next/cache';
import { notifyStudio, esc } from '@/lib/mail';
import { bookingByToken, confirmBooking, getClient, getOrder, logEvent, longDate, requestChange, time12 } from '@/lib/studio';

export async function confirmAction(token: string) {
  const b = await bookingByToken(token);
  if (!b) return { error: 'This link is no longer valid.' };
  await confirmBooking(b.id);
  const o = await getOrder(b.order_id);
  const c = o ? await getClient(o.client_id) : null;
  await logEvent(b.order_id, 'Client confirmed the date and time');
  await notifyStudio(`${c?.name || 'Client'} confirmed ${longDate(b.session_date)}`, `<p>${esc(c?.name || 'The client')} confirmed their session on ${longDate(b.session_date)} at ${time12(b.session_time)}.</p>`);
  revalidatePath(`/confirm/${token}`);
  return { ok: true };
}

export async function changeAction(token: string, text: string) {
  const b = await bookingByToken(token);
  if (!b) return { error: 'This link is no longer valid.' };
  const msg = text.trim();
  if (msg.length < 3) return { error: 'Tell us which day or time works better.' };
  await requestChange(b.id, msg);
  const o = await getOrder(b.order_id);
  const c = o ? await getClient(o.client_id) : null;
  await logEvent(b.order_id, `Client asked for a change: “${msg.slice(0, 200)}”`);
  await notifyStudio(`${c?.name || 'Client'} asked to change their session`, `<p>${esc(c?.name || 'The client')} asked to change their ${longDate(b.session_date)} session:</p><blockquote>${esc(msg)}</blockquote><p>${c?.phone ? `Phone: ${esc(c.phone)}` : ''}</p>`);
  revalidatePath(`/confirm/${token}`);
  return { ok: true };
}
