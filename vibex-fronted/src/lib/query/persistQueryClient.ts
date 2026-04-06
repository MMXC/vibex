/**
 * React Query 持久化配置
 * 将查询缓存持久化到 localStorage，页面刷新后自动恢复
 */

'use client';

import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// localStorage 键名
const STORAGE_KEY = 'vibex-query-cache';

/**
 * 创建 localStorage 持久化器
 */
export function createLocalStoragePersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      if (typeof window === 'undefined') return;
      
      try {
        const serialized = JSON.stringify(client);
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch (error) {
        canvasLogger.default.error('Failed to persist query cache:', error);
      }
    },
    restoreClient: async (): Promise<PersistedClient | undefined> => {
      if (typeof window === 'undefined') return undefined;
      
      try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (!serialized) return undefined;
        return JSON.parse(serialized);
      } catch (error) {
        canvasLogger.default.error('Failed to restore query cache:', error);
        localStorage.removeItem(STORAGE_KEY);
        return undefined;
      }
    },
    removeClient: async (): Promise<void> => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(STORAGE_KEY);
    },
  };
}

/**
 * 清除缓存
 */
export function clearQueryCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 获取缓存信息
 */
export function getCacheInfo(): { size: number; hasCache: boolean } {
  if (typeof window === 'undefined') {
    return { size: 0, hasCache: false };
  }
  
  const data = localStorage.getItem(STORAGE_KEY);
  return {
    size: data ? data.length : 0,
    hasCache: !!data,
  };
}
