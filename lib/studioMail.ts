import 'server-only';
import { sendTemplate } from './mail';
import { siteOrigin } from './auth';
import { longDate, naira, time12, type Booking, type Client, type Invoice } from './studio';

const firstName = (name: string) => name.split(/\s+/)[0];

export async function emailInvoice(c: Client, inv: Invoice, title: string, isUpdate: boolean) {
  if (!c.email) return false;
  return sendTemplate(isUpdate ? 'invoiceUpdate' : 'invoice', c.email,
    { first_name: firstName(c.name), session: title.toLowerCase(), invoice_number: inv.number },
    {
      url: `${siteOrigin()}/invoice/${inv.token}`,
      rows: [
        ['Invoice', `${inv.number} · version ${inv.version}`], ['Total', naira(inv.total)],
        ...(Number(inv.deposit) > 0 ? [['Deposit due now', naira(inv.deposit)] as [string, string]] : []),
        ...(inv.due_date ? [['Due by', longDate(inv.due_date)] as [string, string]] : []),
      ],
    });
}

export async function emailReceipt(c: Client, amount: number, method: string, paidOn: string, balance: number, inv: Invoice | null) {
  if (!c.email) return false;
  return sendTemplate('receipt', c.email, { first_name: firstName(c.name), amount: naira(amount) }, {
    url: inv ? `${siteOrigin()}/invoice/${inv.token}` : undefined,
    rows: [['Amount received', naira(amount)], ['Paid by', `${method} · ${longDate(paidOn)}`], ['Balance remaining', naira(balance)]],
  });
}

export async function emailBooking(c: Client, b: Pick<Booking, 'token' | 'session_date' | 'session_time' | 'duration_min' | 'place' | 'address'>, _moved: boolean) {
  if (!c.email) return false;
  const hours = b.duration_min % 60 ? `${b.duration_min} minutes` : `${b.duration_min / 60} hour${b.duration_min === 60 ? '' : 's'}`;
  return sendTemplate('booking', c.email, { first_name: firstName(c.name), date: longDate(b.session_date), time: time12(b.session_time) }, {
    url: `${siteOrigin()}/confirm/${b.token}`,
    rows: [['Date', longDate(b.session_date)], ['Time', `${time12(b.session_time)} · ${hours}`], ['Where', b.place === 'studio' ? `Tboss studio, ${b.address}` : b.address]],
  });
}

export async function emailReminder(c: { name: string; email: string | null }, b: Pick<Booking, 'session_time' | 'place' | 'address'>) {
  if (!c.email) return false;
  return sendTemplate('reminder', c.email, { first_name: firstName(c.name), time: time12(b.session_time) }, {
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`,
    rows: [['When', `Tomorrow · ${time12(b.session_time)}`], ['Where', b.address], ['Questions?', '0902 442 1555 (call or WhatsApp)']],
  });
}
