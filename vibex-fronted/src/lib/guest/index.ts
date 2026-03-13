/**
 * Guest Playground - 游客体验区模块
 * 游客身份识别、速率限制、数据生命周期、数据迁移
 */

export * from './session';
export * from './rateLimiter';
export * from './lifecycle';
export * from './migration';

// 默认配置
export const GUEST_CONFIG = {
  // 会话配置
  session: {
    ttlMs: 24 * 60 * 60 * 1000, // 24 小时
  },
  // 速率限制配置
  rateLimit: {
    ipLimit: 10,
    ipWindowMs: 60 * 1000,
    guestLimit: 10,
    guestWindowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
  },
  // 生命周期配置
  lifecycle: {
    dataTtlMs: 24 * 60 * 60 * 1000,
    cleanupIntervalMs: 60 * 60 * 1000,
    warnBeforeExpireMs: 30 * 60 * 1000,
  },
};
