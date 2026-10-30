import { srcSetFor } from '@/lib/images';

// A responsive photo: right size for each screen, lazy below the fold, no layout jump.
export default function Pic({ src, alt, sizes = '100vw', width, height, priority = false, className, style, blur }: {
  src: string; alt: string; sizes?: string; width?: number; height?: number; priority?: boolean; className?: string; style?: React.CSSProperties; blur?: string | null;
}) {
  return (
    <img
      src={src}
      srcSet={srcSetFor(src)}
      sizes={srcSetFor(src) ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      style={blur ? { backgroundImage: `url(${blur})`, backgroundSize: 'cover', ...style } : style}
    />
  );
}
