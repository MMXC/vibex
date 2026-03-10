import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // 显式声明客户端可用的环境变量，防止意外暴露
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

// 环境变量验证：确保生产构建时设置了必需的 API 地址
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error('缺少生产环境变量 NEXT_PUBLIC_API_BASE_URL，请创建 .env.production 文件');
  }
}

export default nextConfig;
