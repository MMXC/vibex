/**
 * Sentry Configuration
 * 
 * APM 监控集成 - 实时性能监控 + 错误追踪
 * 
 * 功能:
 * - 自动捕获 JS 错误
 * - Promise 未处理 rejection
 * - 性能监控 (Core Web Vitals)
 * - 用户会话追踪
 */
// @ts-nocheck


import * as Sentry from '@sentry/nextjs';

/**
 * Sentry 配置
 * 使用环境变量:
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry DSN (公开)
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * 是否启用 Sentry
 */
const isSentryEnabled = !!SENTRY_DSN;

/**
 * Sentry 初始化配置
 */
Sentry.init({
  // 必需: DSN
  dsn: SENTRY_DSN || '',
  
  // 是否启用
  enabled: isSentryEnabled && process.env.NODE_ENV !== 'test',
  
  // 环境
  environment: process.env.NODE_ENV || 'development',
  
  // 采样率 (0-1)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // 错误采样率
  sampleRate: 1.0,
  
  // 是否调试模式
  debug: process.env.NODE_ENV === 'development',
  
  // 忽略错误
  ignoreErrors: [
    // 网络错误
    /Network Error/i,
    /fetch failed/i,
    /net::ERR_/i,
    // 第三方插件错误
    /ResizeObserver/i,
    /Loading chunk \d+ failed/i,
    // 用户主动取消
    /AbortError/i,
    /CancelledError/i,
  ],
  
  // 过滤器配置
  beforeSend(event) {
    // 过滤敏感信息
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
      delete event.request.headers['Cookie'];
    }
    
    return event;
  },
  
  // 释放版本
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
});

/**
 * 性能监控标记
 */
export const SENTRY_TRACE_SAMPLE_RATE = process.env.NODE_ENV === 'production' ? 0.1 : 1.0;

/**
 * 用户追踪
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (!isSentryEnabled) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * 自定义标签
 */
export function setTag(key: string, value: string) {
  if (!isSentryEnabled) return;
  Sentry.setTag(key, value);
}

/**
 * 自定义上下文
 */
export function setContext(name: string, context: Record<string, unknown>) {
  if (!isSentryEnabled) return;
  Sentry.setContext(name, context);
}

/**
 * 手动捕获错误
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!isSentryEnabled) return;
  
  if (context) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * 手动捕获消息
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!isSentryEnabled) return;
  Sentry.captureMessage(message, level);
}

export default Sentry;
