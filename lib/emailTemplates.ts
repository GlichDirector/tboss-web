import { esc } from './emailHtml';

// Wording of every automatic email. Edited in Website → Emails; details tables and links are added automatically.
export type Tpl = { subject: string; heading: string; intro: string; button: string; note: string };
export type TplKey = 'enquiry' | 'invoice' | 'invoiceUpdate' | 'receipt' | 'booking' | 'reminder' | 'choose' | 'ready';

export const TEMPLATE_INFO: Record<TplKey, { name: string; when: string; vars: string[] }> = {
  enquiry: { name: 'Enquiry received', when: 'Someone sends the Contact form', vars: ['first_name', 'session_type'] },
  invoice: { name: 'Invoice', when: 'You send an invoice', vars: ['first_name', 'session', 'invoice_number'] },
  invoiceUpdate: { name: 'Updated invoice', when: 'You resend an edited invoice', vars: ['first_name', 'session', 'invoice_number'] },
  receipt: { name: 'Payment receipt', when: 'You record a payment', vars: ['first_name', 'amount'] },
  booking: { name: 'Session booked', when: 'You book or move a session', vars: ['first_name', 'date', 'time'] },
  reminder: { name: 'Day-before reminder', when: 'The day before a session', vars: ['first_name', 'time'] },
  choose: { name: 'Choose your photos', when: 'You open a gallery for choosing', vars: ['first_name', 'session'] },
  ready: { name: 'Your gallery is ready', when: 'You deliver the edited photos', vars: ['first_name', 'session'] },
};

export const DEFAULT_TEMPLATES: Record<TplKey, Tpl> = {
  enquiry: { subject: 'We’ve received your enquiry · Tboss Photography', heading: 'Thank you for getting in touch', intro: 'Hi {first_name}, thank you for your {session_type} enquiry. We’ve received your details and will reply with availability and options.', button: '', note: 'Can’t wait? Call or WhatsApp {studio_phone}.' },
  invoice: { subject: 'Your invoice {invoice_number} from Tboss Photography', heading: 'Your invoice is ready', intro: 'Hi {first_name}, thank you for choosing us. Here’s your invoice for your {session}. Pay the deposit to secure your date.', button: 'View invoice & payment details', note: 'Questions? Call or WhatsApp {studio_phone}.' },
  invoiceUpdate: { subject: 'Updated invoice {invoice_number} from Tboss Photography', heading: 'Your updated invoice', intro: 'Hi {first_name}, here’s the updated invoice for your {session}.', button: 'View invoice & payment details', note: 'This replaces the earlier version we sent you.' },
  receipt: { subject: 'Payment received · thank you', heading: 'We’ve received your payment', intro: 'Hi {first_name}, thank you. This is your receipt for {amount}.', button: 'View your invoice', note: '' },
  booking: { subject: 'Your session is booked · {date}', heading: 'Your session is booked', intro: 'Hi {first_name}, we can’t wait to photograph you. Please confirm the date and time below.', button: 'Confirm date & time', note: 'Need a different time? Tap the button and choose “Request a change”, or call {studio_phone}.' },
  reminder: { subject: 'See you tomorrow, {first_name}!', heading: 'See you tomorrow', intro: 'Hi {first_name}, a quick reminder about your session. Please arrive 10 minutes early.', button: 'Get directions', note: '' },
  choose: { subject: 'Your photos are ready to choose from', heading: 'Pick your favourites', intro: 'Hi {first_name}, your unedited photos are ready. Choose the ones you’d like us to edit and we’ll get started.', button: 'Choose your photos', note: 'Tap the heart on the photos you love, then press “Send selection”. Sign in with Google to save your picks.' },
  ready: { subject: 'Your photos are here', heading: 'Your gallery is ready', intro: 'Hi {first_name}, your edited photos are ready to view, favourite and download.', button: 'View your gallery', note: 'No sign-in needed to view. Sign in with Google to save favourites or download.' },
};

// Fills {placeholders}. Values are escaped; the studio's own wording is escaped too, since it is plain text.
export function fill(text: string, vars: Record<string, string>) {
  return esc(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? esc(vars[k]) : m));
}
export const fillPlain = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
