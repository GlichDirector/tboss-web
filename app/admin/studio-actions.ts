'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { createGallery, getGallery } from '@/lib/galleries';
import {
  addPayment, createClient, createOrder, deletePayment, findClientByEmail, getClient, getEnquiry, getPackages, getStudio, lagosDate, logEvent,
  longDate, naira, orderState, saveBooking, saveInvoice, setEnquiryStatus, setOrderFields, setSetting, time12, toNaira, updateClient,
  type Item, type Package,
} from '@/lib/studio';
import { emailBooking, emailInvoice, emailReceipt } from '@/lib/studioMail';

async function admin() {
  const a = await getAdmin();
  if (!a) throw new Error('Please sign in to the studio admin again.');
  return a;
}
const s = (f: FormData, k: string, max = 300) => String(f.get(k) ?? '').trim().slice(0, max);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export type R = { error?: string; ok?: string };

// ---------------- clients ----------------

export async function addClientsAction(_p: R, f: FormData): Promise<R> {
  await admin();
  const rows = JSON.parse(s(f, 'rows', 200000) || '[]') as { name: string; email: string; phone: string; type: string; date: string; instagram: string; notes: string }[];
  const clean = rows.map((r) => ({ ...r, name: r.name.trim(), email: r.email.trim().toLowerCase() })).filter((r) => r.name || r.email || r.phone);
  if (!clean.length) return { error: 'Add at least one client.' };
  const bad = clean.find((r) => !r.name || (r.email && !isEmail(r.email)));
  if (bad) return { error: bad.name ? `Check the email for ${bad.name}.` : 'Every client needs a name.' };
  let added = 0; let skipped = 0;
  for (const r of clean) {
    if (r.email && (await findClientByEmail(r.email))) { skipped++; continue; }
    const notes = [r.type && `Type of shoot: ${r.type}`, r.date && `Shoot date: ${r.date}`, r.notes].filter(Boolean).join('\n');
    await createClient({ name: r.name, email: r.email || null, phone: r.phone || null, instagram: r.instagram || null, source: 'imported', notes: notes || null });
    added++;
  }
  revalidatePath('/admin/clients');
  return { ok: `Added ${added} client${added === 1 ? '' : 's'}.${skipped ? ` ${skipped} skipped because that email is already a client.` : ''}` };
}

export async function updateClientAction(id: number, _p: R, f: FormData): Promise<R> {
  await admin();
  const email = s(f, 'email', 200).toLowerCase();
  if (!s(f, 'name')) return { error: 'Name is required.' };
  if (email && !isEmail(email)) return { error: 'That email doesn’t look right.' };
  await updateClient(id, { name: s(f, 'name', 160), email: email || null, phone: s(f, 'phone', 40) || null, instagram: s(f, 'instagram', 80) || null, notes: s(f, 'notes', 4000) || null });
  revalidatePath(`/admin/clients/${id}`);
  return { ok: 'Saved.' };
}

// ---------------- enquiries ----------------

export async function enquiryStatusAction(id: number, status: 'new' | 'replied' | 'archived') {
  await admin();
  await setEnquiryStatus(id, status);
  revalidatePath('/admin/enquiries');
}

export async function convertEnquiryAction(id: number) {
  await admin();
  const e = await getEnquiry(id);
  if (!e) throw new Error('Enquiry not found.');
  const existing = await findClientByEmail(e.email);
  const notes = [e.message, e.wanted_date && `Wanted date: ${e.wanted_date}`, e.location && `Location: ${e.location}`, e.found_via && `Found us via: ${e.found_via}`].filter(Boolean).join('\n');
  const clientId = existing?.id ?? (await createClient({ name: e.name, email: e.email, phone: e.phone, source: 'website', notes }));
  const orderId = await createOrder(clientId, `${e.session_type || 'Photo'} session`, null);
  await logEvent(orderId, 'Created from a website enquiry');
  await setEnquiryStatus(id, 'converted', clientId);
  redirect(`/admin/orders/${orderId}`);
}

// ---------------- orders ----------------

export async function newOrderAction(clientId: number, _p: R, f: FormData): Promise<R> {
  await admin();
  const packages = await getPackages();
  const pkg = packages.find((p) => p.id === s(f, 'package'));
  const title = s(f, 'title', 160) || pkg?.name || 'Photo session';
  const orderId = await createOrder(clientId, title, pkg?.name || null);
  if (pkg) {
    const studio = await getStudio();
    await saveInvoice(orderId, [{ description: pkg.name + (pkg.description ? ` · ${pkg.description}` : ''), qty: 1, price: pkg.price }], 0,
      Math.round((pkg.price * studio.depositPercent) / 100), null, studio.invoiceNote, false);
  }
  redirect(`/admin/orders/${orderId}${s(f, 'first') === 'book' ? '?open=book' : '?open=invoice'}`);
}

export async function orderStatusAction(orderId: number, what: 'deliver' | 'undeliver' | 'cancel' | 'restore') {
  await admin();
  await setOrderFields(orderId, what === 'deliver' ? { delivered: true } : what === 'undeliver' ? { delivered: false } : what === 'cancel' ? { cancelled: true } : { cancelled: false });
  await logEvent(orderId, { deliver: 'Marked delivered', undeliver: 'Delivery undone', cancel: 'Order cancelled', restore: 'Order restored' }[what]);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function orderNotesAction(orderId: number, _p: R, f: FormData): Promise<R> {
  await admin();
  await setOrderFields(orderId, { title: s(f, 'title', 160) || 'Photo session', notes: s(f, 'notes', 4000) || null });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: 'Saved.' };
}

// ---------------- invoice ----------------

export async function saveInvoiceAction(orderId: number, _p: R, f: FormData): Promise<R> {
  await admin();
  const st = await orderState(orderId);
  if (!st) return { error: 'Order not found.' };
  const raw = JSON.parse(s(f, 'items', 100000) || '[]') as { description: string; qty: string; price: string }[];
  const items: Item[] = raw.map((i) => ({ description: i.description.trim().slice(0, 200), qty: Math.max(1, Number(i.qty) || 1), price: toNaira(i.price) })).filter((i) => i.description);
  if (!items.length) return { error: 'Add at least one line to the invoice.' };
  const send = s(f, 'send') === '1';
  if (send && !st.client.email) return { error: 'This client has no email address. Add one on their profile first.' };
  const due = s(f, 'due_date');
  const wasSent = Boolean(st.invoice?.sent_at);
  const inv = await saveInvoice(orderId, items, toNaira(s(f, 'discount')), toNaira(s(f, 'deposit')), isDate(due) ? due : null, s(f, 'note', 2000) || null, send);
  if (send) {
    const ok = await emailInvoice(st.client, inv, st.order.title, wasSent);
    await logEvent(orderId, `${wasSent ? 'Invoice resent' : 'Invoice sent'} (${inv.number} v${inv.version}, ${naira(inv.total)}) to ${st.client.email}${ok ? '' : ' — email failed'}`);
  } else {
    await logEvent(orderId, `Invoice saved (${inv.number} v${inv.version}, ${naira(inv.total)})`);
  }
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: send ? `Invoice ${wasSent ? 'resent' : 'sent'} to ${st.client.email}.` : 'Invoice saved.' };
}

// ---------------- payments ----------------

export async function addPaymentAction(orderId: number, _p: R, f: FormData): Promise<R> {
  await admin();
  const st = await orderState(orderId);
  if (!st) return { error: 'Order not found.' };
  const amount = toNaira(s(f, 'amount'));
  const paidOn = s(f, 'paid_on');
  if (!amount) return { error: 'Enter the amount received.' };
  if (!isDate(paidOn)) return { error: 'Choose the date the payment arrived.' };
  const method = s(f, 'method', 40) || 'Bank transfer';
  await addPayment(orderId, { amount, method, paid_on: paidOn, reference: s(f, 'reference', 120) || null, note: s(f, 'note', 255) || null });
  const balance = Math.max(0, (st.invoice ? Number(st.invoice.total) : 0) - st.paid - amount);
  let mailed = false;
  if (s(f, 'receipt') === '1') mailed = await emailReceipt(st.client, amount, method, paidOn, balance, st.invoice);
  await logEvent(orderId, `Payment recorded: ${naira(amount)} by ${method}${balance > 0 ? `, ${naira(balance)} left` : ', fully paid'}${mailed ? ' · receipt emailed' : ''}`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: `${naira(amount)} recorded.${mailed ? ' Receipt emailed.' : ''}` };
}

export async function deletePaymentAction(orderId: number, paymentId: number) {
  await admin();
  await deletePayment(orderId, paymentId);
  await logEvent(orderId, 'A payment record was removed');
  revalidatePath(`/admin/orders/${orderId}`);
}

// ---------------- booking ----------------

export async function saveBookingAction(orderId: number, _p: R, f: FormData): Promise<R> {
  await admin();
  const st = await orderState(orderId);
  if (!st) return { error: 'Order not found.' };
  const date = s(f, 'session_date'); const time = s(f, 'session_time');
  if (!isDate(date)) return { error: 'Choose the session date.' };
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: 'Choose the start time.' };
  const place = s(f, 'place') === 'location' ? 'location' : 'studio';
  const studio = await getStudio();
  const address = place === 'studio' ? studio.studioAddress : s(f, 'address', 255);
  if (!address) return { error: 'Add the address for the on-location shoot.' };
  const b = await saveBooking(orderId, { session_date: date, session_time: time, duration_min: Math.max(15, Number(s(f, 'duration')) || 120), place, address, notes: s(f, 'notes', 2000) || null });
  let mailed = false;
  if (s(f, 'notify') === '1') {
    if (!st.client.email) return { error: 'Booking saved, but this client has no email address to send it to.' };
    mailed = await emailBooking(st.client, b, b.moved);
  }
  await logEvent(orderId, `${st.booking ? 'Booking updated' : 'Session booked'}: ${longDate(date)} at ${time12(time)}, ${place === 'studio' ? 'studio' : address}${mailed ? ' · email with Confirm button sent' : ''}`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: mailed ? `Booked. ${st.client.email} has been emailed to confirm.` : 'Booking saved.' };
}

export async function resendBookingAction(orderId: number) {
  await admin();
  const st = await orderState(orderId);
  if (!st?.booking) return;
  await emailBooking(st.client, st.booking, false);
  await logEvent(orderId, 'Booking email resent');
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function markConfirmedAction(orderId: number) {
  await admin();
  const st = await orderState(orderId);
  if (!st?.booking) return;
  const { confirmBooking } = await import('@/lib/studio');
  await confirmBooking(st.booking.id);
  await logEvent(orderId, 'Marked confirmed by the studio');
  revalidatePath(`/admin/orders/${orderId}`);
}

// ---------------- gallery ----------------

export async function createOrderGalleryAction(orderId: number) {
  await admin();
  const st = await orderState(orderId);
  if (!st) throw new Error('Order not found.');
  if (st.order.gallery_id && (await getGallery(st.order.gallery_id))) redirect(`/admin/galleries/${st.order.gallery_id}`);
  const packages = await getPackages();
  const pkg = packages.find((p) => p.name === st.order.package_name);
  const gid = await createGallery({
    title: st.order.title, client_name: st.client.name, client_emails: st.client.email || '',
    session_date: st.booking?.session_date || null, location: st.booking ? (st.booking.place === 'studio' ? 'Tboss studio, Ibadan' : st.booking.address) : null,
    selection_limit: pkg?.photos || 0, choose_by: lagosDate(14), expires_on: lagosDate(120),
  });
  await setOrderFields(orderId, { gallery_id: gid });
  await logEvent(orderId, 'Gallery created');
  redirect(`/admin/galleries/${gid}?tab=unedited&new=1`);
}

// ---------------- settings ----------------

export async function saveStudioSettingsAction(_p: R, f: FormData): Promise<R> {
  await admin();
  await setSetting('studio', {
    bankName: s(f, 'bankName', 80), accountName: s(f, 'accountName', 120), accountNumber: s(f, 'accountNumber', 20),
    invoiceNote: s(f, 'invoiceNote', 1000), studioAddress: s(f, 'studioAddress', 255),
    depositPercent: Math.min(100, Math.max(0, Number(s(f, 'depositPercent')) || 0)), replyTime: s(f, 'replyTime', 40),
  });
  revalidatePath('/admin/settings');
  return { ok: 'Studio details saved.' };
}

export async function savePackagesAction(_p: R, f: FormData): Promise<R> {
  await admin();
  const raw = JSON.parse(s(f, 'packages', 50000) || '[]') as { id: string; name: string; price: string; photos: string; description: string }[];
  const list: Package[] = raw.filter((p) => p.name.trim()).map((p, i) => ({
    id: p.id || `p${Date.now()}${i}`, name: p.name.trim().slice(0, 80), price: toNaira(p.price), photos: Math.max(0, Number(p.photos) || 0), description: p.description.trim().slice(0, 200),
  }));
  await setSetting('packages', list);
  revalidatePath('/admin/settings');
  return { ok: `${list.length} package${list.length === 1 ? '' : 's'} saved.` };
}
