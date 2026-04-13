import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fix Turbopack root detection for monorepo setup
  turbopack: {
    root: '/root/.openclaw/vibex/vibex-fronted',
  },
  // QA模式下用standalone，允许API routes和middleware
  output: process.env.NEXT_OUTPUT_MODE === 'standalone' ? 'standalone' : 'export',
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cf-image-loader.ts',
    // 允许的图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // 最小/最大图片尺寸
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 天
    formats: ['image/avif', 'image/webp'],
  },
  trailingSlash: true,
  // 显式声明客户端可用的环境变量，防止意外暴露
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  },
};

// 环境变量验证：确保生产构建时设置了必需的 API 地址
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error('缺少生产环境变量 NEXT_PUBLIC_API_BASE_URL，请创建 .env.production 文件');
  }
}

export default nextConfig;
