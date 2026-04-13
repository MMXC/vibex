import type { NextConfig } from 'next';

/**
 * QA 测试专用配置
 * - 移除 output: 'export'，启用 middleware 和 API routes
 * - 使用 standalone 输出，本地启动完整 server
 */
const qaConfig: NextConfig = {
  reactStrictMode: true,
  // 移除 output: 'export'，让 middleware 和 API routes 正常工作
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // 复制必要的环境变量支持
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  },
};

export default qaConfig;
