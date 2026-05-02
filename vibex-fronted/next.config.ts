import type { NextConfig } from 'next';
import createBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  experimental: {
    // C-E2-1: Exclude MCP SDK from Turbopack static analysis to fix spawn resolution
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/serverComponentsExternalPackages
    serverComponentsExternalPackages: ['@modelcontextprotocol/sdk'],
  },
  // Mark child_process as external so Turbopack doesn't try to bundle it.
  // This allows spawn() calls to resolve at runtime instead of build time.
  // Required for mcp-bridge.ts which uses child_process.spawn() for MCP server stdio bridge.
  serverExternalPackages: ['child_process'],
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

export default withBundleAnalyzer(nextConfig);
