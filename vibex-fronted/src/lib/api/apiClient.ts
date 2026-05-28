/**
 * apiClient.ts — P005-E2: API fetch wrapper with offline fallback
 *
 * - Wraps native fetch with Service Worker cache fallback
 * - Returns `{ offline: true }` when both network and cache miss
 * - Integrates with uiStore.isOffline state
 */

export interface OfflineResponse<T = unknown> {
  offline: true;
  /** Last cached response (if available) */
  cached?: T;
}

export interface ApiResponse<T = unknown> {
  offline: false;
  data: T;
  /** If fetched from cache during offline mode */
  cached?: boolean;
}

export type FetchResult<T> = ApiResponse<T> | OfflineResponse<T>;

/** Cache name for API responses */
const API_CACHE_NAME = 'vibex-api-cache-v1';

/** Open the API cache */
async function openApiCache(): Promise<Cache> {
  return caches.open(API_CACHE_NAME);
}

/**
 * Fetch with offline fallback.
 * 1. Try network first
 * 2. On network failure, try cache
 * 3. If cache miss, return { offline: true }
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<FetchResult<T>> {
  try {
    // Try network first
    const response = await fetch(url, {
      ...options,
      // Don't use SW for requests (bypass)
    });

    if (!response.ok) {
      // Server error — try cache fallback
      const cache = await openApiCache();
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        const cachedData = await cachedResponse.json().catch(() => undefined);
        return { offline: false, data: cachedData as T };
      }
      // No cache — return offline indicator
      return { offline: true };
    }

    // Success — put in cache for future offline use
    const cache = await openApiCache();
    cache.put(url, response.clone());

    const data = await response.json();
    return { offline: false, data: data as T };
  } catch {
    // Network failure — try cache
    try {
      const cache = await openApiCache();
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        const cachedData = await cachedResponse.json().catch(() => undefined);
        return { offline: false, data: cachedData as T, cached: true };
      }
    } catch {
      // Cache miss — truly offline
    }

    return { offline: true };
  }
}

/**
 * Invalidate a cached API response.
 * Call after mutations to ensure fresh data.
 */
export async function invalidateApiCache(url?: string): Promise<void> {
  const cache = await openApiCache();
  if (url) {
    await cache.delete(url);
  } else {
    // Clear all (by deleting and re-creating the cache)
    await caches.delete(API_CACHE_NAME);
  }
}

/**
 * Pre-warm the API cache with a list of URLs.
 * Call on app init for critical endpoints.
 */
export async function prewarmApiCache(urls: string[]): Promise<void> {
  const cache = await openApiCache();
  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // Ignore failures during prewarm
      }
    }),
  );
}
