// Every website photo is stored in four widths, e.g. /media/work/abc/w1600.webp.
// Browsers pick the smallest one that looks sharp on their screen.
export const WIDTHS = [640, 1080, 1600, 2400] as const;

const VARIANT = /\/w(\d+)\.(webp|jpg)$/;

export function variant(src: string, w: number) {
  const m = src.match(VARIANT);
  return m ? src.replace(VARIANT, `/w${w}.${m[2]}`) : src;
}

export function srcSetFor(src: string) {
  return VARIANT.test(src) ? WIDTHS.map((w) => `${variant(src, w)} ${w}w`).join(', ') : undefined;
}

export const mediaUrl = (base: string, ext: string, w = 1600) => `/media/${base}/w${w}.${ext}`;
