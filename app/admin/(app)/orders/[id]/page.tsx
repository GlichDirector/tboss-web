import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionForm from '@/components/admin/ActionForm';
import GalleryButton from '@/components/admin/GalleryButton';
import StepBar from '@/components/admin/StepBar';
import { BookingButtons, BookingForm, InvoiceEditor, PaymentForm, RemovePayment, StatusButton } from '@/components/admin/OrderPanels';
import { orderNotesAction } from '@/app/admin/studio-actions';
import { getGallery } from '@/lib/galleries';
import { getStudio, invoiceVersions, lagosDate, longDate, naira, orderEvents, orderState, time12 } from '@/lib/studio';

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ open?: string }> }) {
  const id = Number((await params).id);
  const { open } = await searchParams;
  const st = await orderState(id);
  if (!st) notFound();
  const { order, client, invoice, items, payments, booking } = st;
  const [studio, events, versions, gallery] = await Promise.all([
    getStudio(), orderEvents(id), invoice ? invoiceVersions(invoice.id) : Promise.resolve([]), order.gallery_id ? getGallery(order.gallery_id) : Promise.resolve(null),
  ]);
  const depositLeft = Math.max(0, Number(invoice?.deposit || 0) - st.paid);
  const closed = Boolean(order.cancelled_at);

  return (
    <>
      <div className="a-head">
        <div>
          <p className="a-kicker"><Link href="/admin/clients">Clients</Link> / <Link href={`/admin/clients/${client.id}`}>{client.name}</Link> /</p>
          <h1>{order.title}</h1>
          <div className="a-sub" style={{ marginTop: 4 }}><span className={`a-badge ${st.stage === 'Delivered' ? 'a-finished' : st.stage === 'Cancelled' ? '' : 'a-selection'}`}>{st.stage}</span> Started {longDate(order.created_at.slice(0, 10))}{order.package_name ? ` · ${order.package_name}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {client.phone && <a className="btn btn-outline a-sm" href={`https://wa.me/${client.phone.replace(/\D/g, '').replace(/^0/, '234')}`} target="_blank" rel="noopener noreferrer">WhatsApp {client.name.split(' ')[0]}</a>}
        </div>
      </div>

      {!closed && (
        <div className="a-card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <StepBar index={st.stepIndex} />
          <div><span className="a-sub">Next step: </span><strong>{st.next}</strong></div>
        </div>
      )}

      <div className="a-cols">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* 1 · Invoice */}
          <section className="a-card a-sec" aria-labelledby="s-inv">
            <div className="a-sec-h"><h2 id="s-inv" className="a-h2">1 · Invoice</h2>{invoice && <a className="a-link" href={`/invoice/${invoice.token}`} target="_blank" rel="noopener">View client’s copy</a>}</div>
            {invoice ? (
              <div className="a-sub" style={{ color: 'var(--ink)' }}>
                <strong>{invoice.number}</strong> · version {invoice.version} · total <strong>{naira(invoice.total)}</strong>{Number(invoice.deposit) > 0 && <> · deposit {naira(invoice.deposit)}</>}
                <div className="a-sub">{invoice.sent_at ? `Sent ${longDate(invoice.sent_at.slice(0, 10))} to ${client.email}` : 'Not sent yet'}</div>
              </div>
            ) : <p className="a-sub" style={{ margin: 0 }}>No invoice yet.</p>}
            <InvoiceEditor orderId={id} initial={items} discount={Number(invoice?.discount || 0)} deposit={Number(invoice?.deposit || 0)} due={invoice?.due_date || null} note={invoice?.note ?? studio.invoiceNote}
              sent={Boolean(invoice?.sent_at)} hasEmail={Boolean(client.email)} startOpen={open === 'invoice' && !invoice?.sent_at} depositPercent={studio.depositPercent} />
            {versions.length > 1 && (
              <details><summary className="a-link" style={{ cursor: 'pointer' }}>Version history ({versions.length})</summary>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>{versions.map((v, i) => <li key={i}>v{v.version} · {naira(v.total)} · {v.sent ? 'sent' : 'saved'} {v.created_at.slice(0, 16)}</li>)}</ul>
              </details>
            )}
          </section>

          {/* 2 · Payments */}
          <section className="a-card a-sec" aria-labelledby="s-pay">
            <div className="a-sec-h"><h2 id="s-pay" className="a-h2">2 · Payments</h2><span className="a-sub">Paid {naira(st.paid)} · balance <strong style={{ color: st.balance ? 'var(--oxblood)' : '#25573A' }}>{naira(st.balance)}</strong></span></div>
            {payments.length > 0 && (
              <table className="a-table"><tbody>{payments.map((p) => (
                <tr key={p.id}><td><strong>{naira(p.amount)}</strong><div className="a-sub">{p.method}{p.reference ? ` · ${p.reference}` : ''}</div></td><td className="a-sub">{longDate(p.paid_on)}</td><td style={{ textAlign: 'right' }}><RemovePayment orderId={id} paymentId={p.id} /></td></tr>
              ))}</tbody></table>
            )}
            {(st.balance > 0 || !invoice) && <PaymentForm orderId={id} balance={st.balance} depositLeft={depositLeft} today={lagosDate()} />}
          </section>

          {/* 3 · Booking */}
          <section className="a-card a-sec" aria-labelledby="s-book">
            <div className="a-sec-h"><h2 id="s-book" className="a-h2">3 · Session booking</h2>{booking && <a className="a-link" href={`/confirm/${booking.token}`} target="_blank" rel="noopener">Client’s confirm page</a>}</div>
            {booking && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong>{longDate(booking.session_date)} · {time12(booking.session_time)}</strong>
                <span className="a-sub">{booking.place === 'studio' ? 'Studio' : 'On location'}: {booking.address}</span>
                {booking.confirmed_at ? <span className="a-ok" style={{ alignSelf: 'flex-start' }}>Client confirmed {booking.confirmed_at.slice(0, 10)}</span> : <span className="a-badge a-selection" style={{ alignSelf: 'flex-start' }}>Waiting for the client to confirm</span>}
                {booking.change_request && <div className="alert">Client asked for a change: “{booking.change_request}”. Update the booking below and they’ll get a new email.</div>}
                <span className="a-sub">{booking.reminder_sent_at ? `Reminder sent ${booking.reminder_sent_at.slice(0, 10)}` : 'A reminder is emailed automatically the day before.'}</span>
                <BookingButtons orderId={id} confirmed={Boolean(booking.confirmed_at)} />
              </div>
            )}
            <BookingForm orderId={id} b={booking} studioAddress={studio.studioAddress} hasEmail={Boolean(client.email)} startOpen={open === 'book' && !booking} />
          </section>

          {/* 4 · Gallery */}
          <section className="a-card a-sec" aria-labelledby="s-gal">
            <div className="a-sec-h"><h2 id="s-gal" className="a-h2">4 · Gallery</h2></div>
            {gallery ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <span><strong>{gallery.title}</strong> <span className="a-sub">· {gallery.stage === 'finished' ? 'Edited photos delivered' : gallery.stage === 'selection' ? 'Client choosing favourites' : 'Draft, not shared yet'}</span></span>
                <Link className="btn btn-outline a-sm" href={`/admin/galleries/${gallery.id}`}>Open gallery</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p className="a-sub" style={{ margin: 0 }}>After the shoot, create the gallery and upload the unedited photos. The client’s email, date and package photo limit fill in automatically.</p>
                <div><GalleryButton orderId={id} /></div>
              </div>
            )}
          </section>

          {/* 5 · Delivery */}
          <section className="a-card a-sec" aria-labelledby="s-del">
            <div className="a-sec-h"><h2 id="s-del" className="a-h2">5 · Delivery</h2></div>
            {order.delivered_at ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><span className="a-ok">Delivered {order.delivered_at.slice(0, 10)}</span><StatusButton orderId={id} what="undeliver" label="Undo" className="a-link" /></div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusButton orderId={id} what="deliver" label="Mark order delivered" className="btn btn-dark a-sm" />
                <span className="a-sub">Do this once the client has their edited photos. Same client coming back? Start a new order on their profile.</span>
              </div>
            )}
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ActionForm action={orderNotesAction.bind(null, id)} submit="Save" className="a-card a-form">
            <h2 className="a-h2">Order details</h2>
            <div className="field"><label htmlFor="otitle">Order name</label><input className="input" id="otitle" name="title" defaultValue={order.title} /></div>
            <div className="field"><label htmlFor="onotes">Notes (only the studio sees these)</label><textarea className="input" id="onotes" name="notes" rows={4} defaultValue={order.notes || ''} /></div>
          </ActionForm>
          <div className="a-card">
            <h2 className="a-h2">Client</h2>
            <p style={{ margin: 0 }}><Link href={`/admin/clients/${client.id}`} style={{ fontWeight: 700 }}>{client.name}</Link></p>
            <p className="a-sub" style={{ margin: '2px 0 0' }}>{client.email || 'No email'}{client.phone ? ` · ${client.phone}` : ''}</p>
          </div>
          <div className="a-card">
            <h2 className="a-h2">Activity</h2>
            <ul className="a-log">{events.map((e, i) => <li key={i}><span>{e.text}</span><span className="a-sub">{e.created_at.slice(0, 16)}</span></li>)}</ul>
          </div>
          <div>{closed ? <StatusButton orderId={id} what="restore" label="Restore this order" /> : <StatusButton orderId={id} what="cancel" label="Cancel this order" className="a-link a-danger" ask="Cancel this order? You can restore it later." />}</div>
        </div>
      </div>
    </>
  );
}
