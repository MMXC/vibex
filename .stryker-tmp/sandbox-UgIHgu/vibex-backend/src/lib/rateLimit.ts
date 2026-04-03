// @ts-nocheck
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

/**
 * In-memory store for rate limiting
 * Uses a simple Map with timestamps for sliding window algorithm
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number; requests: number[] }>();

  /**
   * Get current window key
   */
  private getWindowKey(key: string, windowSeconds: number): string {
    const now = Date.now();
    const windowStart = Math.floor(now / (windowSeconds * 1000));
    return `${key}:${windowStart}`;
  }

  /**
   * Get sliding window key (includes individual request timestamps)
   */
  private getSlidingWindowKey(key: string, windowSeconds: number): string {
    return `${key}:sliding:${windowSeconds}`;
  }

  /**
   * Increment count for a key using fixed window algorithm
   */
  increment(key: string, windowSeconds: number): { count: number; resetTime: number } {
    const windowKey = this.getWindowKey(key, windowSeconds);
    const now = Date.now();
    const resetTime = Math.ceil((now + windowSeconds * 1000) / 1000);

    let entry = this.store.get(windowKey);
    if (!entry) {
      entry = { count: 0, resetTime, requests: [] };
      this.store.set(windowKey, entry);
    }

    entry.count++;
    entry.resetTime = resetTime;

    // Clean up old entries periodically
    if (this.store.size > 10000) {
      this.cleanup();
    }

    return { count: entry.count, resetTime: entry.resetTime };
  }

  /**
   * Increment count for a key using sliding window algorithm
   */
  incrementSliding(key: string, windowSeconds: number): { count: number; resetTime: number } {
    const windowKey = this.getSlidingWindowKey(key, windowSeconds);
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const resetTime = Math.ceil((now + windowMs) / 1000);

    let entry = this.store.get(windowKey);
    if (!entry) {
      entry = { count: 0, resetTime, requests: [] };
      this.store.set(windowKey, entry);
    }

    // Remove requests outside the sliding window
    entry.requests = entry.requests.filter((timestamp) => now - timestamp < windowMs);
    
    // Add current request
    entry.requests.push(now);
    entry.count = entry.requests.length;
    entry.resetTime = resetTime;

    // Clean up old entries periodically
    if (this.store.size > 10000) {
      this.cleanup();
    }

    return { count: entry.count, resetTime: entry.resetTime };
  }

  /**
   * Decrement count (for skipFailedRequests option)
   */
  decrement(key: string, windowSeconds: number): void {
    const windowKey = this.getWindowKey(key, windowSeconds);
    const entry = this.store.get(windowKey);
    if (entry && entry.count > 0) {
      entry.count--;
    }
  }

  /**
   * Reset key (for manual reset)
   */
  reset(key: string, windowSeconds: number): void {
    const windowKey = this.getWindowKey(key, windowSeconds);
    this.store.delete(windowKey);
    const slidingKey = this.getSlidingWindowKey(key, windowSeconds);
    this.store.delete(slidingKey);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.store.forEach((entry, key) => {
      if (entry.resetTime * 1000 < now - 60000) {
        keysToDelete.push(key);
      }
    });
    for (const key of keysToDelete) {
      this.store.delete(key);
    }
  }

  /**
   * Get current count for debugging
   */
  getCurrentCount(key: string, windowSeconds: number, slidingWindow: boolean): number {
    if (slidingWindow) {
      const windowKey = this.getSlidingWindowKey(key, windowSeconds);
      const entry = this.store.get(windowKey);
      if (!entry) return 0;
      
      const now = Date.now();
      const windowMs = windowSeconds * 1000;
      entry.requests = entry.requests.filter((timestamp) => now - timestamp < windowMs);
      return entry.requests.length;
    } else {
      const windowKey = this.getWindowKey(key, windowSeconds);
      const entry = this.store.get(windowKey);
      return entry?.count || 0;
    }
  }
}

// Singleton store instance
const store = new RateLimitStore();

/**
 * Create rate limiting middleware
 * @param options - Rate limit configuration
 * @returns Hono middleware
 */
export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  const { 
    limit, 
    windowSeconds, 
    keyGenerator, 
    slidingWindow, 
    message, 
    statusCode,
    skipSuccessfulRequests,
    skipFailedRequests,
    headers,
  } = config;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    
    // Check rate limit
    let result;
    if (slidingWindow) {
      result = store.incrementSliding(key, windowSeconds);
    } else {
      result = store.increment(key, windowSeconds);
    }

    const { count: used, resetTime } = result;
    const remaining = Math.max(0, limit - used);

    // Set rate limit headers
    c.res.headers.set(headers.limit!, String(limit));
    c.res.headers.set(headers.remaining!, String(remaining));
    c.res.headers.set(headers.reset!, String(resetTime));

    // Attach rate limit info to context
    (c as any).rateLimit = {
      limit,
      remaining,
      reset: resetTime,
      used,
    };

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
      // Optionally decrement - this is a simplified approach
      store.decrement(key, windowSeconds);
    } else if (skipFailedRequests && c.res.status >= 400) {
      store.decrement(key, windowSeconds);
    }
  };
}

/**
 * Create multiple rate limiters for different endpoints
 */
export const createRateLimiter = (options: Partial<RateLimitOptions>) => rateLimit(options);

/**
 * Pre-configured rate limiters for common use cases
 */

// Strict rate limiter: 10 requests per minute
export const strictRateLimit = rateLimit({
  limit: 10,
  windowSeconds: 60,
  message: 'Strict rate limit exceeded. Please wait before making more requests.',
});

// Moderate rate limiter: 60 requests per minute
export const moderateRateLimit = rateLimit({
  limit: 60,
  windowSeconds: 60,
  message: 'Moderate rate limit exceeded. Please slow down.',
});

// Default rate limiter: 100 requests per minute
export const defaultRateLimit = rateLimit({
  limit: 100,
  windowSeconds: 60,
});

// Generous rate limiter: 500 requests per minute (for authenticated users)
export const generousRateLimit = rateLimit({
  limit: 500,
  windowSeconds: 60,
  keyGenerator: (c) => {
    // Use user ID if available, otherwise fall back to IP
    const userId = (c as any).user?.id;
    return userId || c.req.header('cf-connecting-ip') || 'unknown';
  },
});

// Auth-specific rate limiter (stricter to prevent brute force)
export const authRateLimit = rateLimit({
  limit: 5,
  windowSeconds: 60,
  message: 'Too many authentication attempts. Please try again later.',
  statusCode: 429,
});

// Export store for testing/debugging
export { RateLimitStore, store };
