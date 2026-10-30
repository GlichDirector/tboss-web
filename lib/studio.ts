import 'server-only';
import { randomBytes } from 'node:crypto';
import { exec, q } from './db';
import { fullAddress } from './site';

// ---------------- money & dates ----------------

export const naira = (n: number | string | null | undefined) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
// Reads amounts typed like "₦150,000" or "150000" as whole naira.
export const toNaira = (v: string) => Math.max(0, Math.round(Number(String(v).replace(/[^\d.]/g, '')) || 0));

// Today and tomorrow in Lagos time (UTC+1), as YYYY-MM-DD.
export function lagosDate(offsetDays = 0) {
  const d = new Date(Date.now() + 60 * 60 * 1000 + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

export function time12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
}

export function longDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso || '')) return iso || '';
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

const token = () => randomBytes(16).toString('base64url');

// ---------------- settings ----------------

export type Package = { id: string; name: string; price: number; photos: number; description: string };
export type StudioSettings = {
  bankName: string; accountName: string; accountNumber: string; invoiceNote: string;
  studioAddress: string; depositPercent: number; replyTime: string;
};

const defaultSettings: StudioSettings = {
  bankName: '', accountName: '', accountNumber: '',
  invoiceNote: 'Your date is held once the deposit is paid. The balance is due on or before the session day.',
  studioAddress: fullAddress, depositPercent: 50, replyTime: '',
};

export async function getSetting<T>(k: string, fallback: T): Promise<T> {
  const row = (await q<{ v: string }>('SELECT v FROM settings WHERE k = ?', [k]))[0];
  if (!row) return fallback;
  try { return { ...fallback, ...JSON.parse(row.v) } as T; } catch { return fallback; }
}
export async function setSetting(k: string, v: unknown) {
  await exec('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [k, JSON.stringify(v)]);
}
export const getStudio = () => getSetting<StudioSettings>('studio', defaultSettings);
export async function getPackages(): Promise<Package[]> {
  const row = (await q<{ v: string }>("SELECT v FROM settings WHERE k = 'packages'"))[0];
  try { return row ? (JSON.parse(row.v) as Package[]) : []; } catch { return []; }
}

// ---------------- clients ----------------

export type Client = { id: number; name: string; email: string | null; phone: string | null; instagram: string | null; source: 'website' | 'imported' | 'manual'; notes: string | null; created_at: string };

export async function createClient(c: { name: string; email?: string | null; phone?: string | null; instagram?: string | null; source?: Client['source']; notes?: string | null }) {
  const res = await exec('INSERT INTO clients (name, email, phone, instagram, source, notes) VALUES (?,?,?,?,?,?)',
    [c.name, c.email?.toLowerCase() || null, c.phone || null, c.instagram || null, c.source || 'manual', c.notes || null]);
  return res.insertId;
}
export async function updateClient(id: number, c: Partial<Pick<Client, 'name' | 'email' | 'phone' | 'instagram' | 'notes'>>) {
  const keys = (['name', 'email', 'phone', 'instagram', 'notes'] as const).filter((k) => k in c);
  if (!keys.length) return;
  await exec(`UPDATE clients SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => (k === 'email' ? c[k]?.toLowerCase() || null : c[k] ?? null)), id]);
}
export const getClient = async (id: number) => (await q<Client>('SELECT * FROM clients WHERE id = ?', [id]))[0] || null;
export const findClientByEmail = async (email: string) => (await q<Client>('SELECT * FROM clients WHERE email = ? ORDER BY id LIMIT 1', [email.toLowerCase()]))[0] || null;

export async function listClients(search = '', filter = 'all') {
  const rows = await q<Client & { orders: number; open_orders: number; last_order: string | null }>(
    `SELECT c.*, COUNT(o.id) AS orders, SUM(o.id IS NOT NULL AND o.delivered_at IS NULL AND o.cancelled_at IS NULL) AS open_orders, MAX(o.created_at) AS last_order
     FROM clients c LEFT JOIN orders o ON o.client_id = c.id
     WHERE (? = '' OR c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)
     GROUP BY c.id ORDER BY COALESCE(MAX(o.created_at), c.created_at) DESC`,
    [search, `%${search}%`, `%${search}%`, `%${search}%`],
  );
  return rows.filter((r) =>
    filter === 'active' ? Number(r.open_orders) > 0 :
    filter === 'delivered' ? Number(r.orders) > 0 && Number(r.open_orders) === 0 :
    filter === 'imported' ? r.source === 'imported' : true);
}

// ---------------- enquiries ----------------

export type Enquiry = { id: number; name: string; email: string; phone: string | null; session_type: string | null; wanted_date: string | null; location: string | null; found_via: string | null; message: string | null; status: 'new' | 'replied' | 'converted' | 'archived'; client_id: number | null; created_at: string };

export async function saveEnquiry(e: Omit<Enquiry, 'id' | 'status' | 'client_id' | 'created_at'>) {
  await exec('INSERT INTO enquiries (name, email, phone, session_type, wanted_date, location, found_via, message) VALUES (?,?,?,?,?,?,?,?)',
    [e.name, e.email.toLowerCase(), e.phone, e.session_type, e.wanted_date, e.location, e.found_via, e.message]);
}
export const listEnquiries = (status: string) =>
  q<Enquiry>(`SELECT * FROM enquiries WHERE (? = 'all' OR status = ?) ORDER BY created_at DESC LIMIT 300`, [status, status]);
export const getEnquiry = async (id: number) => (await q<Enquiry>('SELECT * FROM enquiries WHERE id = ?', [id]))[0] || null;
export const setEnquiryStatus = (id: number, status: Enquiry['status'], clientId?: number) =>
  exec('UPDATE enquiries SET status = ?, client_id = COALESCE(?, client_id) WHERE id = ?', [status, clientId ?? null, id]);
export const countNewEnquiries = async () => Number((await q<{ n: number }>("SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'"))[0]?.n || 0);

// ---------------- orders ----------------

export type Order = { id: number; client_id: number; title: string; package_name: string | null; gallery_id: number | null; delivered_at: string | null; cancelled_at: string | null; notes: string | null; created_at: string };
export type Item = { description: string; qty: number; price: number };
export type Invoice = { id: number; order_id: number; number: string; token: string; version: number; items: string; discount: number; total: number; deposit: number; due_date: string | null; note: string | null; sent_at: string | null; updated_at: string };
export type Payment = { id: number; order_id: number; amount: number; method: string; paid_on: string; reference: string | null; note: string | null; created_at: string };
export type Booking = { id: number; order_id: number; token: string; session_date: string; session_time: string; duration_min: number; place: 'studio' | 'location'; address: string; notes: string | null; confirmed_at: string | null; change_request: string | null; change_requested_at: string | null; reminder_sent_at: string | null };

export const STEPS = ['Invoice sent', 'Paid', 'Booked', 'Confirmed', 'Shot', 'Gallery', 'Delivered'] as const;
export type Stage = 'New' | (typeof STEPS)[number] | 'Part paid' | 'Cancelled';

export type OrderState = {
  order: Order; client: Client; invoice: Invoice | null; items: Item[]; payments: Payment[]; booking: Booking | null;
  paid: number; balance: number; stage: Stage; stepIndex: number; next: string;
};

export async function createOrder(clientId: number, title: string, packageName: string | null) {
  const res = await exec('INSERT INTO orders (client_id, title, package_name) VALUES (?,?,?)', [clientId, title, packageName]);
  await logEvent(res.insertId, 'Order created');
  return res.insertId;
}
export const getOrder = async (id: number) => (await q<Order>('SELECT * FROM orders WHERE id = ?', [id]))[0] || null;
export const logEvent = (orderId: number, text: string) => exec('INSERT INTO order_events (order_id, text) VALUES (?,?)', [orderId, text.slice(0, 400)]);
export const orderEvents = (orderId: number) => q<{ text: string; created_at: string }>('SELECT text, created_at FROM order_events WHERE order_id = ? ORDER BY id DESC LIMIT 60', [orderId]);

function stageOf(o: Order, inv: Invoice | null, paid: number, b: Booking | null, galleryStage: string | null): { stage: Stage; stepIndex: number; next: string } {
  if (o.cancelled_at) return { stage: 'Cancelled', stepIndex: -1, next: 'Cancelled' };
  if (o.delivered_at) return { stage: 'Delivered', stepIndex: 6, next: 'Done. Start a new order when they come back.' };
  const today = lagosDate();
  if (o.gallery_id && galleryStage && galleryStage !== 'draft') return { stage: 'Gallery', stepIndex: 5, next: galleryStage === 'finished' ? 'Mark the order delivered' : 'Upload the edited photos and deliver' };
  if (b && b.session_date < today) return { stage: 'Shot', stepIndex: 4, next: 'Create the gallery and upload unedited photos' };
  if (b && b.confirmed_at) return { stage: 'Confirmed', stepIndex: 3, next: `Shoot on ${longDate(b.session_date)}` };
  if (b) return { stage: 'Booked', stepIndex: 2, next: b.change_request ? 'Client asked for a change: reply to them' : 'Waiting for the client to confirm' };
  if (inv && paid > 0) return { stage: paid >= inv.total ? 'Paid' : 'Part paid', stepIndex: 1, next: 'Book the session' };
  if (inv && inv.sent_at) return { stage: 'Invoice sent', stepIndex: 0, next: 'Record the payment when it arrives' };
  return { stage: 'New', stepIndex: -1, next: inv ? 'Send the invoice' : 'Create the invoice' };
}

export async function orderState(id: number): Promise<OrderState | null> {
  const order = await getOrder(id);
  if (!order) return null;
  const [client, invoice, payments, booking] = await Promise.all([
    getClient(order.client_id),
    q<Invoice>('SELECT * FROM invoices WHERE order_id = ?', [id]).then((r) => r[0] || null),
    q<Payment>('SELECT * FROM payments WHERE order_id = ? ORDER BY paid_on, id', [id]),
    q<Booking>('SELECT * FROM bookings WHERE order_id = ?', [id]).then((r) => r[0] || null),
  ]);
  const gStage = order.gallery_id ? (await q<{ stage: string }>('SELECT stage FROM galleries WHERE id = ?', [order.gallery_id]))[0]?.stage || null : null;
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const items: Item[] = invoice ? JSON.parse(invoice.items) : [];
  const total = invoice ? Number(invoice.total) : 0;
  return { order, client: client!, invoice, items, payments, booking, paid, balance: Math.max(0, total - paid), ...stageOf(order, invoice, paid, booking, gStage) };
}

export async function listOrders() {
  const ids = await q<{ id: number }>('SELECT id FROM orders ORDER BY created_at DESC LIMIT 400');
  return (await Promise.all(ids.map((r) => orderState(r.id)))).filter(Boolean) as OrderState[];
}

export async function ordersForClient(clientId: number) {
  const ids = await q<{ id: number }>('SELECT id FROM orders WHERE client_id = ? ORDER BY created_at DESC', [clientId]);
  return (await Promise.all(ids.map((r) => orderState(r.id)))).filter(Boolean) as OrderState[];
}

export async function setOrderFields(id: number, f: Partial<Pick<Order, 'title' | 'package_name' | 'gallery_id' | 'notes'>> & { delivered?: boolean | null; cancelled?: boolean | null }) {
  const sets: string[] = []; const vals: (string | number | null)[] = [];
  for (const k of ['title', 'package_name', 'gallery_id', 'notes'] as const) if (k in f) { sets.push(`${k} = ?`); vals.push((f[k] ?? null) as string | number | null); }
  if (f.delivered !== undefined) sets.push(f.delivered ? 'delivered_at = NOW()' : 'delivered_at = NULL');
  if (f.cancelled !== undefined) sets.push(f.cancelled ? 'cancelled_at = NOW()' : 'cancelled_at = NULL');
  if (sets.length) await exec(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
}

// ---------------- invoices ----------------

export function invoiceTotal(items: Item[], discount: number) {
  return Math.max(0, items.reduce((s, i) => s + Math.round(i.qty * i.price), 0) - discount);
}

export async function saveInvoice(orderId: number, items: Item[], discount: number, deposit: number, due: string | null, note: string | null, markSent: boolean) {
  const total = invoiceTotal(items, discount);
  const existing = (await q<Invoice>('SELECT * FROM invoices WHERE order_id = ?', [orderId]))[0];
  let id: number; let version: number;
  if (existing) {
    // A new version only when the invoice had already been sent and its contents change.
    const changed = existing.items !== JSON.stringify(items) || Number(existing.discount) !== discount || Number(existing.deposit) !== deposit;
    version = existing.sent_at && changed ? existing.version + 1 : existing.version;
    await exec('UPDATE invoices SET items = ?, discount = ?, total = ?, deposit = ?, due_date = ?, note = ?, version = ? WHERE id = ?',
      [JSON.stringify(items), discount, total, deposit, due, note, version, existing.id]);
    id = existing.id;
  } else {
    const n = Number((await q<{ n: number }>('SELECT COUNT(*) AS n FROM invoices'))[0]?.n || 0);
    const number = `TB-${1001 + n}`;
    const res = await exec('INSERT INTO invoices (order_id, number, token, items, discount, total, deposit, due_date, note) VALUES (?,?,?,?,?,?,?,?,?)',
      [orderId, number, token(), JSON.stringify(items), discount, total, deposit, due, note]);
    id = res.insertId; version = 1;
  }
  if (markSent) await exec('UPDATE invoices SET sent_at = NOW() WHERE id = ?', [id]);
  const last = (await q<{ version: number; items: string; total: number }>('SELECT version, items, total FROM invoice_versions WHERE invoice_id = ? ORDER BY id DESC LIMIT 1', [id]))[0];
  if (!last || last.version !== version || last.items !== JSON.stringify(items) || Number(last.total) !== total || markSent) {
    await exec('INSERT INTO invoice_versions (invoice_id, version, items, total, sent) VALUES (?,?,?,?,?)', [id, version, JSON.stringify(items), total, markSent ? 1 : 0]);
  }
  return (await q<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]))[0];
}
export const invoiceVersions = (invoiceId: number) => q<{ version: number; total: number; sent: number; created_at: string }>('SELECT version, total, sent, created_at FROM invoice_versions WHERE invoice_id = ? ORDER BY id DESC', [invoiceId]);
export const invoiceByToken = async (t: string) => (await q<Invoice>('SELECT * FROM invoices WHERE token = ?', [t]))[0] || null;

// ---------------- payments ----------------

export async function addPayment(orderId: number, p: { amount: number; method: string; paid_on: string; reference: string | null; note: string | null }) {
  const res = await exec('INSERT INTO payments (order_id, amount, method, paid_on, reference, note) VALUES (?,?,?,?,?,?)', [orderId, p.amount, p.method, p.paid_on, p.reference, p.note]);
  return res.insertId;
}
export const deletePayment = (orderId: number, id: number) => exec('DELETE FROM payments WHERE id = ? AND order_id = ?', [id, orderId]);
export const listPayments = () => q<Payment & { client_name: string; title: string; client_id: number }>(
  'SELECT p.*, c.name AS client_name, o.title, c.id AS client_id FROM payments p JOIN orders o ON o.id = p.order_id JOIN clients c ON c.id = o.client_id ORDER BY p.paid_on DESC, p.id DESC LIMIT 500');

// ---------------- bookings ----------------

export async function saveBooking(orderId: number, b: { session_date: string; session_time: string; duration_min: number; place: 'studio' | 'location'; address: string; notes: string | null }) {
  const existing = (await q<Booking>('SELECT * FROM bookings WHERE order_id = ?', [orderId]))[0];
  if (existing) {
    const moved = existing.session_date !== b.session_date || existing.session_time !== b.session_time || existing.address !== b.address;
    await exec(`UPDATE bookings SET session_date = ?, session_time = ?, duration_min = ?, place = ?, address = ?, notes = ?${moved ? ', confirmed_at = NULL, change_request = NULL, reminder_sent_at = NULL' : ''} WHERE id = ?`,
      [b.session_date, b.session_time, b.duration_min, b.place, b.address, b.notes, existing.id]);
    return { ...existing, ...b, token: existing.token, moved };
  }
  const t = token();
  await exec('INSERT INTO bookings (order_id, token, session_date, session_time, duration_min, place, address, notes) VALUES (?,?,?,?,?,?,?,?)',
    [orderId, t, b.session_date, b.session_time, b.duration_min, b.place, b.address, b.notes]);
  return { ...b, token: t, moved: true };
}
export const bookingByToken = async (t: string) => (await q<Booking>('SELECT * FROM bookings WHERE token = ?', [t]))[0] || null;
export const confirmBooking = (id: number) => exec('UPDATE bookings SET confirmed_at = NOW(), change_request = NULL WHERE id = ?', [id]);
export const requestChange = (id: number, text: string) => exec('UPDATE bookings SET change_request = ?, change_requested_at = NOW(), confirmed_at = NULL WHERE id = ?', [text.slice(0, 2000), id]);
export const markReminded = (id: number) => exec('UPDATE bookings SET reminder_sent_at = NOW() WHERE id = ?', [id]);

export const bookingsBetween = (from: string, to: string) => q<Booking & { client_name: string; title: string }>(
  `SELECT b.*, c.name AS client_name, o.title FROM bookings b JOIN orders o ON o.id = b.order_id JOIN clients c ON c.id = o.client_id
   WHERE b.session_date BETWEEN ? AND ? AND o.cancelled_at IS NULL ORDER BY b.session_date, b.session_time`, [from, to]);

export const bookingsNeedingReminder = (day: string) => q<Booking & { client_name: string; email: string | null; title: string }>(
  `SELECT b.*, c.name AS client_name, c.email, o.title FROM bookings b JOIN orders o ON o.id = b.order_id JOIN clients c ON c.id = o.client_id
   WHERE b.session_date = ? AND b.reminder_sent_at IS NULL AND o.cancelled_at IS NULL`, [day]);

export async function orderIdForGallery(galleryId: number) {
  return (await q<{ id: number }>('SELECT id FROM orders WHERE gallery_id = ? LIMIT 1', [galleryId]))[0]?.id || null;
}
