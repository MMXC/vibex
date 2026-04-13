/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // QA/本地server模式: standalone | 生产部署: export
  output: process.env.NEXT_OUTPUT_MODE === 'standalone' ? 'standalone' : 'export',
  images: process.env.NEXT_OUTPUT_MODE === 'standalone'
    ? { unoptimized: true }
    : {
        loader: 'custom',
        loaderFile: './src/lib/cf-image-loader.ts',
        remotePatterns: [
          { protocol: 'https', hostname: 'imagedelivery.net', pathname: '/**' },
          { protocol: 'https', hostname: '**' },
        ],
        minimumCacheTTL: 60 * 60 * 24 * 30,
        formats: ['image/avif', 'image/webp'],
      },
  trailingSlash: process.env.NEXT_OUTPUT_MODE !== 'standalone',
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  },
}

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_OUTPUT_MODE) {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error('缺少生产环境变量 NEXT_PUBLIC_API_BASE_URL，请创建 .env.production 文件');
  }
}

module.exports = nextConfig
