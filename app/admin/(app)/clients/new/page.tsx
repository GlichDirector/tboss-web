import Link from 'next/link';
import AddClients from '@/components/admin/AddClients';

export default function NewClients() {
  return (
    <>
      <div className="a-head"><div><p className="a-kicker"><Link href="/admin/clients">Clients</Link> /</p><h1>Add clients</h1></div></div>
      <p style={{ margin: '0 0 16px', color: 'var(--muted)', maxWidth: 640 }}>Type in past or new clients. Add as many as you like, then save them all at once. A client whose email is already saved is skipped.</p>
      <AddClients />
    </>
  );
}
