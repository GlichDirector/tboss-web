'use client';

import { useEffect, useRef, useState } from 'react';
import { srcSetFor } from '@/lib/images';

// A responsive photo: right size for each screen, lazy below the fold, no layout jump.
// If a photo fails to load (a slow or busy moment on the server), it quietly tries again
// instead of showing a broken image.
const RETRIES = [800, 2500, 6000];

export default function Pic({ src, alt, sizes = '100vw', width, height, priority = false, className, style, blur }: {
  src: string; alt: string; sizes?: string; width?: number; height?: number; priority?: boolean; className?: string; style?: React.CSSProperties; blur?: string | null;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  const retry = () => {
    if (attempt >= RETRIES.length) { setFailed(true); return; }
    setTimeout(() => setAttempt((a) => a + 1), RETRIES[attempt]);
  };

  // An image can fail before the page becomes interactive; catch that too.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0 && img.currentSrc) retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = srcSetFor(src);
  // On a retry, ask for the plain photo again with a fresh address so no cached error is reused.
  const url = attempt ? `${src}${src.includes('?') ? '&' : '?'}r=${attempt}` : src;
  return (
    <img
      ref={ref}
      key={attempt}
      src={url}
      srcSet={attempt ? undefined : set}
      sizes={!attempt && set ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority || attempt ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={className ? `pic ${className}` : 'pic'}
      data-failed={failed || undefined}
      onError={retry}
      style={blur ? { backgroundImage: `url(${blur})`, backgroundSize: 'cover', ...style } : style}
    />
  );
}
