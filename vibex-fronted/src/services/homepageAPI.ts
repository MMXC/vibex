/**
 * HomepageAPI Service
 * Epic 3: API Data Binding
 *
 * Fetches theme preferences from GET /api/v1/homepage
 * and provides priority-based merge strategy.
 */

import type { ThemeMode } from '../types/theme';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface HomepageAPIResponse {
  /** Default theme from server */
  theme?: ThemeMode;
  /** Authenticated user override */
  userPreferences?: {
    theme?: ThemeMode;
  };
  /** Homepage configs */
  configs?: unknown[];
}

export interface ThemeMergeInput {
  local: ThemeMode | null;
  api: HomepageAPIResponse | null;
  system: 'light' | 'dark';
}

// ── Constants ───────────────────────────────────────────────────────────────

/** Priority: localStorage > API userPreferences > system > API default > 'system' */
const VALID_THEMES = new Set<ThemeMode>(['light', 'dark', 'system']);

/** Cache TTL in ms (5 minutes) */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: HomepageAPIResponse;
  timestamp: number;
}

// ── Dev Helper ─────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== 'production';

// ── Cache ───────────────────────────────────────────────────────────────────

let cache: CacheEntry | null = null;

/**
 * Get cached homepage data if still fresh
 */
function getCached(): HomepageAPIResponse | null {
  if (!cache) return null;
  if (Date.now() - cache.timestamp > CACHE_TTL_MS) {
    cache = null;
    return null;
  }
  return cache.data;
}

/**
 * Cache homepage response
 */
function setCache(data: HomepageAPIResponse): void {
  cache = { data, timestamp: Date.now() };
}

/**
 * Clear cache (useful for logout)
 */
export function clearHomepageCache(): void {
  cache = null;
}

// ── API Client ──────────────────────────────────────────────────────────────

/**
 * Fetch homepage data from /api/v1/homepage
 * Returns null on network error (graceful degradation)
 */
export async function fetchHomepageData(): Promise<HomepageAPIResponse | null> {
  // Return cached data if fresh
  const cached = getCached();
  if (cached) return cached;

  try {
    const res = await fetch('/api/v1/homepage', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });

    if (!res.ok) {
      if (isDev) {
        console.warn('[HomepageAPI] Non-OK response:', res.status, res.statusText);
      }
      return null;
    }

    const data: HomepageAPIResponse = await res.json();

    // Validate theme fields
    if (data.theme && !VALID_THEMES.has(data.theme)) {
      if (isDev) {
        console.warn('[HomepageAPI] Invalid theme from API:', data.theme);
      }
      data.theme = undefined;
    }
    if (data.userPreferences?.theme && !VALID_THEMES.has(data.userPreferences.theme)) {
      if (isDev) {
        console.warn('[HomepageAPI] Invalid userPreferences.theme:', data.userPreferences.theme);
      }
      data.userPreferences.theme = undefined;
    }

    setCache(data);
    return data;
  } catch (err) {
    if (isDev) {
      console.warn('[HomepageAPI] Fetch failed:', err);
    }
    return null;
  }
}

// ── Merge Strategy ─────────────────────────────────────────────────────────

/**
 * Resolve theme using priority merge strategy:
 * 1. localStorage (explicit user choice)
 * 2. API userPreferences.theme (authenticated user override)
 * 3. system preference (OS setting)
 * 4. API theme default (server fallback)
 * 5. 'system' (hardcoded default)
 */
export function resolveMergedTheme(input: ThemeMergeInput): ThemeMode {
  const { local, api, system } = input;

  // 1. localStorage takes highest priority
  if (local && VALID_THEMES.has(local)) {
    return local;
  }

  // 2. API userPreferences.theme (logged-in user override)
  if (api?.userPreferences?.theme && VALID_THEMES.has(api.userPreferences.theme)) {
    return api.userPreferences.theme;
  }

  // 3. API theme default (server fallback)
  if (api?.theme && VALID_THEMES.has(api.theme)) {
    return api.theme;
  }

  // 4. system (OS preference) - resolved immediately
  return system === 'dark' ? 'dark' : 'light';
}

/**
 * Log theme resolution for debugging (visible in DevTools)
 */
export function logThemeResolution(input: ThemeMergeInput, resolved: ThemeMode): void {
  if (!isDev) return;

  const { local, api } = input;
  console.debug('[ThemeResolution]', {
    localStorage: local ?? '(none)',
    apiUserPrefs: api?.userPreferences?.theme ?? '(none)',
    apiDefault: api?.theme ?? '(none)',
    resolved,
  });
}
