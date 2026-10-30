import Link from 'next/link';
import { requireArea } from '@/lib/team';
import GalleryForm from '@/components/admin/GalleryForm';
import { createGalleryAction } from '@/app/admin/actions';

export default async function NewGallery() {
  await requireArea('galleries');
  return (
    <>
      <div className="a-head">
        <div><p className="a-kicker"><Link href="/admin/galleries">Client galleries</Link> /</p><h1>New client gallery</h1></div>
      </div>
      <p style={{ margin: '0 0 20px', color: 'var(--muted)', maxWidth: 640 }}>Create the gallery first. Next you’ll upload the unedited photos, pick a cover, and send the client their link to choose favourites.</p>
      <GalleryForm action={createGalleryAction} submitLabel="Create gallery and upload photos" />
    </>
  );
}
