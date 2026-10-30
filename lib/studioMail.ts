import 'server-only';
import { brandedEmail, esc, sendMail } from './mail';
import { siteOrigin } from './auth';
import { studio as site } from './site';
import { longDate, naira, time12, type Booking, type Client, type Invoice } from './studio';

const first = (c: Client) => esc(c.name.split(/\s+/)[0]);

export async function emailInvoice(c: Client, inv: Invoice, title: string, isUpdate: boolean) {
  if (!c.email) return false;
  const link = `${siteOrigin()}/invoice/${inv.token}`;
  return sendMail(c.email, isUpdate ? `Updated invoice ${inv.number} from Tboss Photography` : `Your invoice ${inv.number} from Tboss Photography`, brandedEmail({
    heading: isUpdate ? 'Your updated invoice' : 'Your invoice is ready',
    intro: `Hi ${first(c)}, thank you for choosing us. Here’s your invoice for your ${esc(title.toLowerCase())}.${Number(inv.deposit) > 0 ? ' Pay the deposit to secure your date.' : ''}`,
    rows: [
      ['Invoice', `${inv.number} · version ${inv.version}`],
      ['Total', naira(inv.total)],
      ...(Number(inv.deposit) > 0 ? [['Deposit due now', naira(inv.deposit)] as [string, string]] : []),
      ...(inv.due_date ? [['Due by', longDate(inv.due_date)] as [string, string]] : []),
    ],
    cta: { label: 'View invoice & payment details', url: link },
    note: isUpdate ? 'This replaces the earlier version we sent you.' : `Questions? Call or WhatsApp ${site.phoneDisplay}.`,
  }));
}

export async function emailReceipt(c: Client, amount: number, method: string, paidOn: string, balance: number, inv: Invoice | null) {
  if (!c.email) return false;
  return sendMail(c.email, 'Payment received · thank you', brandedEmail({
    heading: 'We’ve received your payment',
    intro: `Hi ${first(c)}, this is your receipt. ${balance > 0 ? 'We’ll be in touch to book your session.' : 'You’re fully paid. Thank you!'}`,
    rows: [['Amount received', naira(amount)], ['Paid by', `${method} · ${longDate(paidOn)}`], ['Balance remaining', naira(balance)]],
    cta: inv ? { label: 'View your invoice', url: `${siteOrigin()}/invoice/${inv.token}` } : undefined,
  }));
}

export async function emailBooking(c: Client, b: Pick<Booking, 'token' | 'session_date' | 'session_time' | 'duration_min' | 'place' | 'address'>, moved: boolean) {
  if (!c.email) return false;
  const hours = b.duration_min % 60 ? `${b.duration_min} minutes` : `${b.duration_min / 60} hour${b.duration_min === 60 ? '' : 's'}`;
  return sendMail(c.email, `${moved ? 'Your session is booked' : 'Your session details'} · ${longDate(b.session_date)}`, brandedEmail({
    heading: 'Your session is booked',
    intro: `Hi ${first(c)}, we can’t wait to photograph you. Please confirm the date and time below.`,
    rows: [['Date', longDate(b.session_date)], ['Time', `${time12(b.session_time)} · ${hours}`], ['Where', b.place === 'studio' ? `Tboss studio, ${b.address}` : b.address]],
    cta: { label: 'Confirm date & time', url: `${siteOrigin()}/confirm/${b.token}` },
    note: `Need a different time? Tap the button and choose “Request a change”, or call ${site.phoneDisplay}.`,
  }));
}

export async function emailReminder(c: { name: string; email: string | null }, b: Pick<Booking, 'session_time' | 'place' | 'address'>) {
  if (!c.email) return false;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
  return sendMail(c.email, `See you tomorrow, ${c.name.split(/\s+/)[0]}!`, brandedEmail({
    heading: 'See you tomorrow',
    intro: `Hi ${esc(c.name.split(/\s+/)[0])}, a quick reminder about your session. Please arrive 10 minutes early.`,
    rows: [['When', `Tomorrow · ${time12(b.session_time)}`], ['Where', b.address], ['Questions?', `${site.phoneDisplay} (call or WhatsApp)`]],
    cta: { label: 'Get directions', url: maps },
  }));
}
