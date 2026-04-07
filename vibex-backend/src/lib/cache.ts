import { Context, Next } from 'hono';
import { debug } from './logger';

/**
 * Extended context with cache properties attached by the cache middleware
 */
interface CacheContext extends Context {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache?: CacheInfo & { stale?: boolean } | Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: { id: string };
}

import { safeError } from '@/lib/log-sanitizer';

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Default TTL in seconds */
  ttl: number;
  /** Maximum number of cache entries */
  maxEntries?: number;
  /** Cache key generator function */
  keyGenerator?: (c: Context) => string;
  /** Whether to cache only successful responses */
  cacheOnlySuccess?: boolean;
  /** HTTP status codes to cache (default: 200) */
  cacheStatusCodes?: number[];
  /** Custom cache control header name */
  cacheControlHeader?: string;
  /** Whether to respect browser/cache-control headers */
  respectCacheControl?: boolean;
  /** Stale-while-revalidate seconds */
  staleWhileRevalidate?: number;
  /** Skip cache for these paths */
  excludePaths?: string[];
  /** Custom serializer */
  serializer?: (data: unknown) => string;
  /** Custom deserializer */
  deserializer?: (data: string) => unknown;
}

/**
 * Cache entry interface
 */
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
  hitCount: number;
  lastHitAt: number;
}

/**
 * Cache info attached to context
 */
export interface CacheInfo {
  hit: boolean;
  key: string;
  ttl: number;
  expiresAt: number;
  hitCount?: number;
}

/**
 * Default cache options
 */
const defaultOptions: Required<CacheOptions> = {
  ttl: 60, // 1 minute default
  maxEntries: 1000,
  keyGenerator: (c: Context) => {
    // Generate cache key from method + path + query
    const path = c.req.path;
    const query = c.req.query();
    const queryString = Object.keys(query).sort()
      .map(k => `${k}=${query[k]}`)
      .join('&');
    return `${c.req.method}:${path}${queryString ? '?' + queryString : ''}`;
  },
  cacheOnlySuccess: true,
  cacheStatusCodes: [200],
  cacheControlHeader: 'Cache-Control',
  respectCacheControl: true,
  staleWhileRevalidate: 10,
  excludePaths: [],
  serializer: JSON.stringify,
  deserializer: JSON.parse,
};

/**
 * In-memory cache store with TTL and LRU-like eviction
 */
class CacheStore {
  maxEntries: number;
  defaultTtl: number;
  private store = new Map<string, CacheEntry>();

  constructor(maxEntries: number = 1000, defaultTtl: number = 60) {
    this.maxEntries = maxEntries;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get entry from cache
   */
  get<T = unknown>(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Update hit stats
    entry.hitCount++;
    entry.lastHitAt = Date.now();
    
    return entry;
  }

  /**
   * Set entry in cache
   */
  set<T = unknown>(key: string, value: T, ttl: number = this.defaultTtl): void {
    const now = Date.now();
    const expiresAt = now + (ttl * 1000);

    // Evict if at capacity (simple LRU: remove oldest by lastHitAt)
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictOldest();
    }

    this.store.set(key, {
      key,
      value,
      expiresAt,
      createdAt: now,
      hitCount: 0,
      lastHitAt: now,
    });
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalHits = 0;
    let oldestEntry = 0;
    let newestEntry = 0;

    this.store.forEach((entry) => {
      if (entry.expiresAt < now) expiredCount++;
      totalHits += entry.hitCount;
      if (oldestEntry === 0 || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    });

    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      totalHits,
      expiredCount,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    this.store.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        this.store.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * Evict oldest entry by lastHitAt
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.store.forEach((entry, key) => {
      if (entry.lastHitAt < oldestTime) {
        oldestTime = entry.lastHitAt;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  /**
   * Get TTL remaining for a key
   */
  getTTL(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    
    const remaining = Math.max(0, entry.expiresAt - Date.now());
    return Math.ceil(remaining / 1000);
  }
}

// Singleton store instance
const store = new CacheStore();

/**
 * Parse cache control header
 */
function parseCacheControl(header: string | null): {
  maxAge?: number;
  noCache?: boolean;
  noStore?: boolean;
  private?: boolean;
  public?: boolean;
  mustRevalidate?: boolean;
} {
  if (!header) return {};

  const directives: Record<string, string | boolean> = {};
  const parts = header.split(',').map(p => p.trim().toLowerCase());

  for (const part of parts) {
    const [directive, value] = part.split('=').map(p => p.trim());
    if (value !== undefined) {
      directives[directive] = value;
    } else {
      directives[directive] = true;
    }
  }

  return {
    maxAge: directives['max-age'] ? parseInt(directives['max-age'] as string, 10) : undefined,
    noCache: !!directives['no-cache'],
    noStore: !!directives['no-store'],
    private: !!directives['private'],
    public: !!directives['public'],
    mustRevalidate: !!directives['must-revalidate'],
  };
}

/**
 * Create cache middleware
 * @param options - Cache configuration
 * @returns Hono middleware
 */
export function cache(options: Partial<CacheOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  const {
    ttl,
    maxEntries,
    keyGenerator,
    cacheOnlySuccess,
    cacheStatusCodes,
    respectCacheControl,
    staleWhileRevalidate,
    excludePaths,
    serializer: _serializer,
    deserializer: _deserializer,
  } = config;

  // Update store settings
  store.maxEntries = maxEntries || 1000;
  store.defaultTtl = ttl;

  return async (c: CacheContext, next: Next) => {
    const path = c.req.path;

    // Skip excluded paths
    if (excludePaths.some(exclude => 
      path === exclude || path.startsWith(exclude.replace(/\/$/, '') + '/')
    )) {
      await next();
      return;
    }

    const cacheKey = keyGenerator(c as unknown as Context);
    const method = c.req.method;

    // Only cache GET requests by default
    if (method !== 'GET') {
      await next();
      return;
    }

    // Check Respect Cache-Control header
    if (respectCacheControl) {
      const cacheControl = c.req.header(config.cacheControlHeader) || null;
      const parsed = parseCacheControl(cacheControl);

      if (parsed.noStore || parsed.private) {
        await next();
        return;
      }

      if (parsed.noCache) {
        // Skip cache but still try to get cached response for validation
        store.delete(cacheKey);
        await next();
        return;
      }
    }

    // Check if we have a cached response
    const cachedEntry = store.get(cacheKey);
    
    if (cachedEntry) {
      // Check stale-while-revalidate
      const ttl = store.getTTL(cacheKey);
      const isStale = ttl <= 0;
      
      // If stale but has stale-while-revalidate, return cached and revalidate in background
      if (isStale && staleWhileRevalidate > 0) {
        // Attach cache info to context (stale response)
        c.cache = {
          hit: true,
          key: cacheKey,
          ttl: 0,
          expiresAt: cachedEntry.expiresAt,
          hitCount: cachedEntry.hitCount,
          stale: true,
        } as CacheInfo & { stale: boolean };

        // Add stale header
        c.res.headers.set('X-Cache', 'STALE');
        c.res.headers.set('X-Cache-Expires', new Date(cachedEntry.expiresAt).toISOString());

        // Return cached response immediately
        const cachedResponse = cachedEntry.value;
        
        // If it's already a Response object, return it
        if (cachedResponse instanceof Response) {
          // Revalidate in background (don't await)
          next().then(() => {
            // Will be handled by the revalidation logic below
          });
          
          // Return cached response
          return cachedResponse;
        }
        
        // Return cached JSON
        return c.json(cachedResponse);
      }

      // Fresh cache hit
      c.cache = {
        hit: true,
        key: cacheKey,
        ttl,
        expiresAt: cachedEntry.expiresAt,
        hitCount: cachedEntry.hitCount,
      };

      c.res.headers.set('X-Cache', 'HIT');
      c.res.headers.set('X-Cache-Key', cacheKey);
      c.res.headers.set('X-Cache-TTL', String(ttl));
      c.res.headers.set('X-Cache-Expires', new Date(cachedEntry.expiresAt).toISOString());

      const cachedResponse = cachedEntry.value;
      
      if (cachedResponse instanceof Response) {
        return cachedResponse.clone();
      }
      
      return c.json(cachedResponse);
    }

    // No cache hit - execute request and cache response
    await next();

    // Check if response should be cached
    const status = c.res.status;
    
    // Only cache successful responses (or configured status codes)
    if (cacheOnlySuccess && status >= 400) {
      return;
    }

    if (!cacheStatusCodes.includes(status)) {
      return;
    }

    // Get response body
    try {
      // Clone response before reading
      const responseClone = c.res.clone();
      const body = await responseClone.text();
      
      let data: unknown;
      const contentType = c.res.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data = (_deserializer ?? JSON.parse)(body);
        } catch {
          // If we can't parse JSON, don't cache
          return;
        }
      } else {
        // For non-JSON responses, cache the text
        data = body;
      }

      // Calculate TTL from Cache-Control if present
      let effectiveTtl = ttl;
      if (respectCacheControl) {
        const cacheControl = c.res.headers.get(config.cacheControlHeader);
        const parsed = parseCacheControl(cacheControl);
        if (parsed.maxAge !== undefined) {
          effectiveTtl = parsed.maxAge;
        }
      }

      // Store in cache
      store.set(cacheKey, data, effectiveTtl);

      // Add cache headers to response
      const expiresAt = Date.now() + (effectiveTtl * 1000);
      c.res.headers.set('X-Cache', 'MISS');
      c.res.headers.set('X-Cache-Key', cacheKey);
      c.res.headers.set('X-Cache-TTL', String(effectiveTtl));
      c.res.headers.set('X-Cache-Expires', new Date(expiresAt).toISOString());
      
      // Add standard cache headers
      c.res.headers.set('Cache-Control', `public, max-age=${effectiveTtl}`);
      if (staleWhileRevalidate > 0) {
        c.res.headers.set('Cache-Control', 
          `public, max-age=${effectiveTtl}, stale-while-revalidate=${staleWhileRevalidate}`);
      }

    } catch (error) {
      // Failed to cache response - continue without caching
      safeError('Cache: Failed to cache response', error);
    }
  };
}

/**
 * Create multiple cache instances with different configurations
 */
export const createCache = (options: Partial<CacheOptions>) => cache(options);

/**
 * Pre-configured cache middleware for common use cases
 */

// Short cache: 30 seconds (for frequently changing data)
export const shortCache = cache({
  ttl: 30,
  maxEntries: 500,
});

// Medium cache: 5 minutes (for user-specific data)
export const mediumCache = cache({
  ttl: 300,
  maxEntries: 1000,
});

// Long cache: 1 hour (for static/reference data)
export const longCache = cache({
  ttl: 3600,
  maxEntries: 2000,
});

// Very long cache: 24 hours (for static content)
export const veryLongCache = cache({
  ttl: 86400,
  maxEntries: 5000,
  excludePaths: ['/api/'],
});

// No cache (for dynamic data)
export const noCache = cache({
  ttl: 0,
  excludePaths: ['*'],
});

// Cache with stale-while-revalidate (for API data that updates occasionally)
export const staleWhileRevalidateCache = cache({
  ttl: 60,
  staleWhileRevalidate: 60,
  cacheStatusCodes: [200, 304],
});

// User-specific cache (with user ID in key)
export const userCache = cache({
  ttl: 300,
  keyGenerator: (c: Context) => {
    const userId = ((c as unknown as CacheContext).user?.id) || 'anonymous';
    const path = c.req.path;
    const query = c.req.query();
    const queryString = Object.keys(query).sort()
      .map(k => `${k}=${query[k]}`)
      .join('&');
    return `user:${userId}:${path}${queryString ? '?' + queryString : ''}`;
  },
});

/**
 * Cache utilities
 */
export const cacheUtils = {
  /**
   * Get value from cache
   */
  get: <T = unknown>(key: string): T | null => {
    const entry = store.get<T>(key);
    return entry?.value || null;
  },

  /**
   * Set value in cache
   */
  set: <T = unknown>(key: string, value: T, ttl?: number): void => {
    store.set(key, value, ttl);
  },

  /**
   * Delete value from cache
   */
  delete: (key: string): boolean => {
    return store.delete(key);
  },

  /**
   * Check if key exists
   */
  has: (key: string): boolean => {
    return store.has(key);
  },

  /**
   * Clear all cache
   */
  clear: (): void => {
    store.clear();
  },

  /**
   * Get cache size
   */
  size: (): number => {
    return store.size();
  },

  /**
   * Get all cache keys
   */
  keys: (): string[] => {
    return store.keys();
  },

  /**
   * Get cache stats
   */
  getStats: () => {
    return store.getStats();
  },

  /**
   * Get TTL for a key
   */
  getTTL: (key: string): number => {
    return store.getTTL(key);
  },

  /**
   * Clean up expired entries
   */
  cleanup: (): number => {
    return store.cleanup();
  },
};

/**
 * Start periodic cleanup of expired cache entries
 */
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start automatic cache cleanup
 * @param intervalMs - Cleanup interval in milliseconds (default: 60000 = 1 minute)
 */
export function startCacheCleanup(intervalMs: number = 60000) {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    const cleaned = store.cleanup();
    if (cleaned > 0 && process.env.NODE_ENV !== 'production') {
      debug(`Cache: Cleaned up ${cleaned} expired entries`);
    }
  }, intervalMs);

  // Don't keep the process alive in serverless
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Stop automatic cache cleanup
 */
export function stopCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Export store for testing/debugging
export { CacheStore, store };
