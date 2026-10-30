'use client';
import { useTransition } from 'react';
import { newStoryAction } from '@/app/admin/journal-actions';
export default function NewStoryButton() {
  const [busy, start] = useTransition();
  return <button type="button" className="btn btn-accent a-sm" disabled={busy} onClick={() => start(() => newStoryAction())}>+ Write a story</button>;
}
