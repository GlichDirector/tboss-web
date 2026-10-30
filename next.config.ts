import type { NextConfig } from 'next';

const year = 'public, max-age=31536000, immutable';
const month = 'public, max-age=2592000, stale-while-revalidate=86400';

const nextConfig: NextConfig = {
  // Photos are resized in the browser before upload, so the server never has to resize them.
  images: { unoptimized: true },
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      { source: '/photos/:path*', headers: [{ key: 'Cache-Control', value: month }] },
      { source: '/brand/:path*', headers: [{ key: 'Cache-Control', value: month }] },
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: year }] },
    ];
  },
};

export default nextConfig;
