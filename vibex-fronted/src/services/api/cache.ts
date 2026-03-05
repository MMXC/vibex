// ==================== 接口定义 ====================

export interface CacheOptions {
  prefix?: string;
}

export interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

// ==================== 缓存实现 ====================

const CACHE_PREFIX = 'vibex_cache_';

class LocalStorageCache implements CacheService {
  get<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    return cached ? JSON.parse(cached) : null;
  }

  set<T>(key: string, value: T): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(CACHE_PREFIX + key);
  }

  clear(): void {
    if (typeof localStorage === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// ==================== 单例导出 ====================

export const cache: CacheService = new LocalStorageCache();

// ==================== 工具函数 ====================

export function getCacheKey(resource: string, id?: string): string {
  return id ? `${resource}_${id}` : resource;
}
