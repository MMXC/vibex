import { Context, Next } from 'hono';

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  /** Maximum number of requests allowed in the time window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key generator function - defaults to IP address */
  keyGenerator?: (c: Context) => string;
  /** Whether to use sliding window (more accurate) vs fixed window (better performance) */
  slidingWindow?: boolean;
  /** Custom message when rate limit is exceeded */
  message?: string;
  /** Custom status code when rate limit is exceeded */
  statusCode?: number;
  /** Skip successful requests (only count errors) */
  skipSuccessfulRequests?: boolean;
  /** Skip failed requests (only count successes) */
  skipFailedRequests?: boolean;
  /** Rate limit headers format */
  headers?: {
    limit?: string;
    remaining?: string;
    reset?: string;
  };
}

/**
 * Rate limit info attached to context
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

/**
 * Default rate limit options
 */
const defaultOptions: Required<RateLimitOptions> = {
  limit: 100,
  windowSeconds: 60,
  keyGenerator: (c: Context) => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown',
  slidingWindow: false,
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  headers: {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
  },
};

// ─── In-memory fallback store (local dev / non-Workers) ───────────────────────

interface InMemoryEntry {
  count: number;
  resetTime: number;
}

class InMemoryStore {
  private store = new Map<string, InMemoryEntry>();

  private windowKey(key: string, windowSeconds: number): string {
    const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
    return `${key}:${windowStart}`;
  }

  async get(key: string): Promise<InMemoryEntry | null> {
    return this.store.get(key) ?? null;
  }

  async put(key: string, entry: InMemoryEntry): Promise<void> {
    this.store.set(key, entry);
    // Periodic cleanup
    if (this.store.size > 10000) {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (v.resetTime * 1000 < now - 60000) this.store.delete(k);
      }
    }
  }

  increment(key: string, windowSeconds: number): { count: number; resetTime: number } {
    const windowK = this.windowKey(key, windowSeconds);
    const now = Date.now();
    const resetTime = Math.ceil((now + windowSeconds * 1000) / 1000);
    let entry = this.store.get(windowK) ?? { count: 0, resetTime };
    entry.count++;
    entry.resetTime = resetTime;
    this.store.set(windowK, entry);
    return { count: entry.count, resetTime };
  }

  decrement(key: string, windowSeconds: number): void {
    const windowK = this.windowKey(key, windowSeconds);
    const entry = this.store.get(windowK);
    if (entry && entry.count > 0) entry.count--;
    // Also decrement at exact windowStart to handle time drift
    const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
    const driftKey = `${key}:${windowStart}`;
    const driftEntry = this.store.get(driftKey);
    if (driftEntry && driftEntry.count > 0) driftEntry.count--;
  }

  /** Clear all entries — for testing */
  clear(): void {
    this.store.clear();
  }
}

// ─── Cloudflare Cache API store (multi-Worker) ────────────────────────────────

interface CacheEntry {
  count: number;
  resetTime: number;
}

class CacheStore {
  /** Check if Cache API is available (Workers environment) */
  isAvailable(): boolean {
    try {
      const c = globalThis.caches as { default?: CacheStorage } | undefined;
      return c != null && c.default != null;
    } catch {
      return false;
    }
  }

  private cacheKey(key: string): string {
    return `rl:${key}`;
  }

  async get(key: string): Promise<CacheEntry | null> {
    if (!this.isAvailable()) return null;
    try {
      const c = globalThis.caches as unknown as { default?: { match: (k: string) => Promise<Response | undefined> } };
      const cached = await c.default?.match(this.cacheKey(key));
      if (!cached) return null;
      return await (cached as unknown as { json: () => Promise<CacheEntry> }).json();
    } catch {
      return null;
    }
  }

  async put(key: string, entry: CacheEntry, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const c = globalThis.caches as unknown as { default?: { put: (k: string, r: Response, opts: { expirationTtl: number }) => Promise<void> } };
      const response = new Response(JSON.stringify(entry), {
        headers: { 'Content-Type': 'application/json' },
      });
      await c.default?.put(this.cacheKey(key), response, { expirationTtl: ttlSeconds });
    } catch {
      // Silently fail — rate limiting should not crash the request
    }
  }
}

// ─── Unified store: Cache-first, in-memory fallback ──────────────────────────

const inMemoryStore = new InMemoryStore();

export { inMemoryStore };
const cacheStore = new CacheStore();

function windowStart(windowSeconds: number): number {
  return Math.floor(Date.now() / (windowSeconds * 1000));
}

function fullKey(key: string, windowSeconds: number): string {
  return `${key}:${windowStart(windowSeconds)}`;
}

async function getCount(key: string, windowSeconds: number): Promise<CacheEntry | null> {
  if (cacheStore.isAvailable()) {
    const cacheEntry = await cacheStore.get(fullKey(key, windowSeconds));
    if (cacheEntry) return cacheEntry;
  }
  return inMemoryStore.get(fullKey(key, windowSeconds));
}

async function recordRequest(key: string, windowSeconds: number): Promise<{ count: number; resetTime: number }> {
  const now = Date.now();
  const resetTime = Math.ceil((now + windowSeconds * 1000) / 1000);
  const fk = fullKey(key, windowSeconds);

  const current = await getCount(key, windowSeconds);
  const count = (current?.count ?? 0) + 1;
  const entry: CacheEntry = { count, resetTime };

  // Write to both stores
  if (cacheStore.isAvailable()) {
    await cacheStore.put(fk, entry, windowSeconds);
  }
  await inMemoryStore.put(fk, entry);

  return { count, resetTime };
}

// ─── Hono middleware ────────────────────────────────────────────────────────

export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  const {
    limit,
    windowSeconds,
    keyGenerator,
    message,
    skipSuccessfulRequests,
    skipFailedRequests,
    headers,
    statusCode,
  } = config;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);

    let used: number;
    let resetTime: number;

    try {
      const result = await recordRequest(key, windowSeconds);
      used = result.count;
      resetTime = result.resetTime;
    } catch {
      // If both stores fail, allow the request (fail open)
      used = 0;
      resetTime = Math.ceil(Date.now() / 1000) + windowSeconds;
    }

    const remaining = Math.max(0, limit - used);

    // Set rate limit headers
    c.res.headers.set(headers.limit!, String(limit));
    c.res.headers.set(headers.remaining!, String(remaining));
    c.res.headers.set(headers.reset!, String(resetTime));

    // Attach rate limit info to context
    (c as any).rateLimit = { limit, remaining, reset: resetTime, used };

    // Check if rate limit exceeded
    if (used > limit) {
      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: resetTime - Math.ceil(Date.now() / 1000),
        },
        timestamp: new Date().toISOString(),
      }, statusCode as any);
    }

    // Execute the next middleware
    await next();

    // Handle skip options after request completes
    if (skipSuccessfulRequests && c.res.status < 400) {
      inMemoryStore.decrement(key, windowSeconds);
    } else if (skipFailedRequests && c.res.status >= 400) {
      inMemoryStore.decrement(key, windowSeconds);
    }
  };
}

/**
 * Create multiple rate limiters for different endpoints
 */
export const createRateLimiter = (options: Partial<RateLimitOptions>) => rateLimit(options);

// Pre-configured rate limiters
export const strictRateLimit = rateLimit({
  limit: 10,
  windowSeconds: 60,
  message: 'Strict rate limit exceeded. Please wait before making more requests.',
});

export const moderateRateLimit = rateLimit({
  limit: 60,
  windowSeconds: 60,
  message: 'Moderate rate limit exceeded. Please slow down.',
});

export const defaultRateLimit = rateLimit({
  limit: 100,
  windowSeconds: 60,
});

export const generousRateLimit = rateLimit({
  limit: 500,
  windowSeconds: 60,
  keyGenerator: (c) => {
    const userId = (c as any).user?.id;
    return userId || c.req.header('cf-connecting-ip') || 'unknown';
  },
});

export const authRateLimit = rateLimit({
  limit: 5,
  windowSeconds: 60,
  message: 'Too many authentication attempts. Please try again later.',
  statusCode: 429,
});

// ─── Exports for testing ────────────────────────────────────────────────────
export { InMemoryStore, CacheStore, getCount, recordRequest };
