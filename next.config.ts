import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Photos are resized before upload, so the server never has to resize them.
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
