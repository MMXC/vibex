import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Remove output: 'export' - using @opennextjs/cloudflare adapter instead
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default withNextIntl(nextConfig);
