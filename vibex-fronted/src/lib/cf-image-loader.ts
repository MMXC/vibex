/**
 * Cloudflare Images Loader
 * 
 * 自定义 Next.js 图片 loader，集成 Cloudflare Images CDN
 * 实现图片优化、自动格式转换、响应式处理
 */

import type { ImageLoaderProps } from 'next/image';

interface CloudflareImageConfig {
  accountId: string;
  baseUrl: string;
}

/**
 * 获取 Cloudflare Images 配置
 */
function getCfConfig(): CloudflareImageConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  
  return {
    accountId,
    baseUrl: accountId 
      ? `https://imagedelivery.net/${accountId}/`
      : '',
  };
}

/**
 * Cloudflare Images 自定义 Loader
 * 
 * 功能：
 * - 自动格式转换 (WebP/AVIF)
 * - 响应式图片生成
 * - 质量优化
 * - CDN 缓存
 */
export default function cloudflareImageLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderProps): string {
  const config = getCfConfig();
  
  // 如果没有配置 account ID，返回原始图片
  if (!config.accountId) {
    return src;
  }

  // 解析原始图片路径
  // 支持绝对 URL 和相对路径
  let imagePath = src;
  
  // 如果是相对路径，添加默认前缀
  if (!src.startsWith('http') && !src.startsWith('/')) {
    imagePath = `/${src}`;
  }

  // 构建 Cloudflare Images URL
  // 格式: https://imagedelivery.net/{accountId}/{imageId}/{options}
  
  // 提取图片 ID (去除路径前缀)
  const imageId = imagePath.replace(/^\//, '');
  
  // 构建变换参数
  const options: string[] = [];
  
  // 宽度参数
  if (width) {
    options.push(`w=${width}`);
  }
  
  // 质量参数
  if (quality && quality !== 75) {
    options.push(`quality=${quality}`);
  }
  
  // 格式自动转换 - 优先使用 AVIF，其次 WebP
  options.push('format=auto');
  
  // 构建最终 URL
  const params = options.join(',');
  
  return `${config.baseUrl}${imageId}${params ? `/${params}` : ''}`;
}

/**
 * 预定义的图片变体
 * 用于常见场景的图片加载
 */
export const imageVariants = {
  // 缩略图 - 150px
  thumbnail: (src: string) => cloudflareImageLoader({ src, width: 150, quality: 60 }),
  
  // 小图 - 300px
  small: (src: string) => cloudflareImageLoader({ src, width: 300, quality: 70 }),
  
  // 中图 - 600px
  medium: (src: string) => cloudflareImageLoader({ src, width: 600, quality: 75 }),
  
  // 大图 - 1200px
  large: (src: string) => cloudflareImageLoader({ src, width: 1200, quality: 80 }),
  
  // 原图
  original: (src: string) => cloudflareImageLoader({ src, width: 1920, quality: 85 }),
};

/**
 * 检查是否应该使用 Cloudflare Images
 * 
 * 只有配置了 account ID 时才启用
 */
export function shouldUseCloudflareImages(): boolean {
  return !!process.env.CLOUDFLARE_ACCOUNT_ID;
}
