/**
 * Rate Limiter - F2 速率限制
 * IP 维度和游客会话维度的速率限制
 */
// @ts-nocheck


import { getGuestId } from './session';

// 速率限制存储
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * 速率限制记录
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockExpiresAt?: number;
}

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  // IP 限制
  ipLimit: number;
  ipWindowMs: number;
  // 游客限制
  guestLimit: number;
  guestWindowMs: number;
  // 阻止时间
  blockDurationMs: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  ipLimit: 10,           // 每分钟 10 次
  ipWindowMs: 60 * 1000, // 1 分钟窗口
  guestLimit: 10,        // 每分钟 10 次
  guestWindowMs: 60 * 1000,
  blockDurationMs: 5 * 60 * 1000, // 阻止 5 分钟
};

// 当前配置
let currentConfig = { ...DEFAULT_CONFIG };

/**
 * 获取客户端 IP（简化版）
 */
function getClientIP(): string {
  // 在实际环境中应该从请求头获取
  // 这里使用客户端指纹作为简化
  if (typeof window !== 'undefined') {
    return `ip_${Date.now() % 100000}`;
  }
  return 'server-ip';
}

/**
 * 获取速率限制 Key
 */
function getRateLimitKey(type: 'ip' | 'guest', identifier: string): string {
  return `rl_${type}_${identifier}`;
}

/**
 * 检查并更新速率限制
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  type: 'ip' | 'guest',
  identifier: string,
  config?: Partial<RateLimitConfig>
): RateLimitResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const key = getRateLimitKey(type, identifier);
  const now = Date.now();
  
  let record = rateLimitStore.get(key);
  
  // 检查是否被阻止
  if (record?.blocked && record.blockExpiresAt && record.blockExpiresAt > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.blockExpiresAt,
      blocked: true,
      blockExpiresAt: record.blockExpiresAt,
    };
  }
  
  // 重置或创建记录
  if (!record || record.resetAt < now) {
    record = {
      count: 0,
      resetAt: now + (type === 'ip' ? cfg.ipWindowMs : cfg.guestWindowMs),
      blocked: false,
    };
  }
  
  // 获取当前限制
  const limit = type === 'ip' ? cfg.ipLimit : cfg.guestLimit;
  
  // 检查是否超过限制
  if (record.count >= limit) {
    // 阻止请求
    record.blocked = true;
    record.blockExpiresAt = now + cfg.blockDurationMs;
    rateLimitStore.set(key, record);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      blocked: true,
      blockExpiresAt: record.blockExpiresAt,
    };
  }
  
  // 增加计数
  record.count++;
  rateLimitStore.set(key, record);
  
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
    blocked: false,
  };
}

/**
 * 速率限制结果
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  blocked: boolean;
  blockExpiresAt?: number;
}

/**
 * 检查 IP 速率限制
 */
export function checkIPRateLimit(ip?: string): RateLimitResult {
  const clientIP = ip || getClientIP();
  return checkRateLimit('ip', clientIP);
}

/**
 * 检查游客速率限制
 */
export function checkGuestRateLimit(): RateLimitResult {
  const guestId = getGuestId() || 'anonymous';
  return checkRateLimit('guest', guestId);
}

/**
 * 组合检查（IP + 游客）
 */
export function checkCombinedRateLimit(): RateLimitResult {
  // 先检查 IP 限制
  const ipResult = checkIPRateLimit();
  if (!ipResult.allowed) {
    return ipResult;
  }
  
  // 再检查游客限制
  const guestResult = checkGuestRateLimit();
  if (!guestResult.allowed) {
    return guestResult;
  }
  
  // 返回限制更严格的结果
  if (ipResult.remaining < guestResult.remaining) {
    return ipResult;
  }
  return guestResult;
}

/**
 * 检查是否被阻止
 */
export function isRateLimited(): boolean {
  const result = checkCombinedRateLimit();
  return !result.allowed;
}

/**
 * 获取阻止信息
 */
export function getRateLimitInfo(): { blocked: boolean; message: string; retryAfter?: number } {
  const result = checkCombinedRateLimit();
  
  if (!result.allowed) {
    const retryAfter = result.blockExpiresAt 
      ? Math.ceil((result.blockExpiresAt - Date.now()) / 1000)
      : Math.ceil((result.resetAt - Date.now()) / 1000);
    
    return {
      blocked: true,
      message: `请求过于频繁，请 ${retryAfter} 秒后再试`,
      retryAfter,
    };
  }
  
  return {
    blocked: false,
    message: '',
  };
}

/**
 * 重置速率限制（用于测试）
 */
export function resetRateLimit(): void {
  rateLimitStore.clear();
}

/**
 * 更新配置
 */
export function updateRateLimitConfig(config: Partial<RateLimitConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * 获取当前配置
 */
export function getRateLimitConfig(): RateLimitConfig {
  return { ...currentConfig };
}

/**
 * 清理过期的速率限制记录
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now && !record.blocked) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  return cleaned;
}

export default {
  checkRateLimit,
  checkIPRateLimit,
  checkGuestRateLimit,
  checkCombinedRateLimit,
  isRateLimited,
  getRateLimitInfo,
  resetRateLimit,
  updateRateLimitConfig,
  getRateLimitConfig,
  cleanupRateLimitStore,
};
