/**
 * Data Lifecycle - F3 数据生命周期
 * 游客数据的过期、清理和生命周期管理
 */

import { 
  getGuestSession, 
  getGuestData, 
  clearGuestSession, 
  clearGuestData,
  GuestData 
} from './session';

/**
 * 生命周期配置
 */
export interface LifecycleConfig {
  dataTtlMs: number;          // 数据 TTL（毫秒）
  cleanupIntervalMs: number;   // 清理间隔（毫秒）
  warnBeforeExpireMs: number;  // 过期前警告时间（毫秒）
}

const DEFAULT_CONFIG: LifecycleConfig = {
  dataTtlMs: 24 * 60 * 60 * 1000,    // 24 小时
  cleanupIntervalMs: 60 * 60 * 1000,  // 1 小时
  warnBeforeExpireMs: 30 * 60 * 1000, // 30 分钟
};

let currentConfig = { ...DEFAULT_CONFIG };
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 检查数据是否即将过期
 */
export function isExpiringSoon(): boolean {
  const data = getGuestData();
  if (!data) return false;
  
  const remaining = data.expiresAt - Date.now();
  return remaining > 0 && remaining < currentConfig.warnBeforeExpireMs;
}

/**
 * 检查数据是否已过期
 */
export function isDataExpired(): boolean {
  const data = getGuestData();
  if (!data) return true;
  
  return data.expiresAt < Date.now();
}

/**
 * 获取数据剩余有效时间（毫秒）
 */
export function getDataRemainingTime(): number {
  const data = getGuestData();
  if (!data) return 0;
  
  return Math.max(0, data.expiresAt - Date.now());
}

/**
 * 获取数据剩余有效时间（人类可读）
 */
export function getDataRemainingTimeFormatted(): string {
  const remaining = getDataRemainingTime();
  
  if (remaining <= 0) return '已过期';
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

/**
 * 清理过期的游客数据和会话
 * @returns 清理的数据项数量
 */
export function cleanupExpiredData(): number {
  let cleaned = 0;
  const now = Date.now();
  
  // 检查会话过期
  const session = getGuestSession();
  if (session && session.expiresAt < now) {
    clearGuestSession();
    cleaned++;
  }
  
  // 检查数据过期
  const data = getGuestData();
  if (data && data.expiresAt < now) {
    clearGuestData();
    cleaned++;
  }
  
  if (cleaned > 0) {
    console.log(`[Lifecycle] Cleaned ${cleaned} expired items`);
  }
  
  return cleaned;
}

/**
 * 定期清理任务
 */
export function startCleanupTask(): void {
  if (cleanupTimer) {
    console.log('[Lifecycle] Cleanup task already running');
    return;
  }
  
  cleanupTimer = setInterval(() => {
    cleanupExpiredData();
  }, currentConfig.cleanupIntervalMs);
  
  console.log('[Lifecycle] Cleanup task started');
}

/**
 * 停止清理任务
 */
export function stopCleanupTask(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log('[Lifecycle] Cleanup task stopped');
  }
}

/**
 * 初始化生命周期管理
 */
export function initLifecycle(): void {
  // 清理过期数据
  cleanupExpiredData();
  
  // 启动定期清理
  startCleanupTask();
  
  console.log('[Lifecycle] Initialized');
}

/**
 * 销毁生命周期管理
 */
export function destroyLifecycle(): void {
  stopCleanupTask();
}

/**
 * 扩展数据有效期
 */
export function extendDataLifetime(hours: number = 24): boolean {
  const data = getGuestData();
  if (!data) return false;
  
  data.expiresAt = Date.now() + (hours * 60 * 60 * 1000);
  
  try {
    localStorage.setItem('vibex_guest_data', JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('[Lifecycle] Failed to extend lifetime:', e);
    return false;
  }
}

/**
 * 获取数据创建时间
 */
export function getDataCreatedTime(): number | null {
  const data = getGuestData();
  return data?.createdAt || null;
}

/**
 * 获取数据过期时间
 */
export function getDataExpireTime(): number | null {
  const data = getGuestData();
  return data?.expiresAt || null;
}

/**
 * 格式化数据信息
 */
export function getDataInfo(): {
  exists: boolean;
  createdAt: string | null;
  expiresAt: string | null;
  remainingTime: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  projectCount: number;
} {
  const data = getGuestData();
  
  if (!data) {
    return {
      exists: false,
      createdAt: null,
      expiresAt: null,
      remainingTime: '无数据',
      isExpired: true,
      isExpiringSoon: false,
      projectCount: 0,
    };
  }
  
  return {
    exists: true,
    createdAt: data.createdAt ? new Date(data.createdAt).toLocaleString() : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt).toLocaleString() : null,
    remainingTime: getDataRemainingTimeFormatted(),
    isExpired: isDataExpired(),
    isExpiringSoon: isExpiringSoon(),
    projectCount: data.projects?.length || 0,
  };
}

/**
 * 更新配置
 */
export function updateLifecycleConfig(config: Partial<LifecycleConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * 获取当前配置
 */
export function getLifecycleConfig(): LifecycleConfig {
  return { ...currentConfig };
}

export default {
  isExpiringSoon,
  isDataExpired,
  getDataRemainingTime,
  getDataRemainingTimeFormatted,
  cleanupExpiredData,
  startCleanupTask,
  stopCleanupTask,
  initLifecycle,
  destroyLifecycle,
  extendDataLifetime,
  getDataCreatedTime,
  getDataExpireTime,
  getDataInfo,
  updateLifecycleConfig,
  getLifecycleConfig,
};
