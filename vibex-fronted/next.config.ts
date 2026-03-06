import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // Temporarily disabled for build testing
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
