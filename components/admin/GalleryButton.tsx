'use client';
import { useTransition } from 'react';
import { createOrderGalleryAction } from '@/app/admin/studio-actions';
export default function GalleryButton({ orderId }: { orderId: number }) {
  const [busy, start] = useTransition();
  return <button type="button" className="btn btn-accent a-sm" disabled={busy} onClick={() => start(() => createOrderGalleryAction(orderId))}>{busy ? 'Creating…' : 'Create gallery & upload photos'}</button>;
}
