/**
 * HomepageAPI Service Tests
 * Epic 3: API Data Binding
 */

import {
  fetchHomepageData,
  resolveMergedTheme,
  logThemeResolution,
  clearHomepageCache,
  type HomepageAPIResponse,
} from './homepageAPI';

// ── Mock global fetch ────────────────────────────────────────────────────────

const mockFetch = vi.fn();
const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = mockFetch;
});

beforeEach(() => {
  vi.clearAllMocks();
  clearHomepageCache();
});

afterAll(() => {
  global.fetch = originalFetch ?? (global.fetch as typeof global.fetch);
});

// ── resolveMergedTheme Tests ────────────────────────────────────────────────

describe('resolveMergedTheme', () => {
  describe('localStorage priority', () => {
    it('returns localStorage when set to light', () => {
      const result = resolveMergedTheme({
        local: 'light',
        api: null,
        system: 'dark',
      });
      expect(result).toBe('light');
    });

    it('returns localStorage when set to dark', () => {
      const result = resolveMergedTheme({
        local: 'dark',
        api: null,
        system: 'light',
      });
      expect(result).toBe('dark');
    });

    it('returns localStorage when set to system', () => {
      const result = resolveMergedTheme({
        local: 'system',
        api: null,
        system: 'dark',
      });
      expect(result).toBe('system');
    });
  });

  describe('API userPreferences priority', () => {
    it('returns api userPreferences.theme when no localStorage', () => {
      const result = resolveMergedTheme({
        local: null,
        api: { theme: 'light', userPreferences: { theme: 'dark' } },
        system: 'light',
      });
      expect(result).toBe('dark');
    });

    it('localStorage overrides api userPreferences', () => {
      const result = resolveMergedTheme({
        local: 'light',
        api: { theme: 'light', userPreferences: { theme: 'dark' } },
        system: 'light',
      });
      expect(result).toBe('light');
    });

    it('ignores invalid api userPreferences.theme', () => {
      const result = resolveMergedTheme({
        local: null,
        api: { theme: 'light', userPreferences: { theme: 'invalid' as never } },
        system: 'dark',
      });
      expect(result).toBe('light');
    });
  });

  describe('API default theme priority', () => {
    it('returns api theme when no localStorage and no userPreferences', () => {
      const result = resolveMergedTheme({
        local: null,
        api: { theme: 'dark' },
        system: 'light',
      });
      expect(result).toBe('dark');
    });

    it('ignores invalid api theme', () => {
      const result = resolveMergedTheme({
        local: null,
        api: { theme: 'auto' as never },
        system: 'light',
      });
      expect(result).toBe('light');
    });
  });

  describe('system fallback', () => {
    it('returns system dark when no localStorage and no API', () => {
      const result = resolveMergedTheme({
        local: null,
        api: null,
        system: 'dark',
      });
      expect(result).toBe('dark');
    });

    it('returns system light when no localStorage and no API', () => {
      const result = resolveMergedTheme({
        local: null,
        api: null,
        system: 'light',
      });
      expect(result).toBe('light');
    });

    it('returns system dark when API theme is invalid', () => {
      const result = resolveMergedTheme({
        local: null,
        api: { theme: 'invalid' as never },
        system: 'dark',
      });
      expect(result).toBe('dark');
    });
  });
});

// ── fetchHomepageData Tests ─────────────────────────────────────────────────

describe('fetchHomepageData', () => {
  it('returns parsed response on success', async () => {
    const mockData: HomepageAPIResponse = {
      theme: 'dark',
      userPreferences: { theme: 'light' },
      configs: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await fetchHomepageData();
    expect(result).toEqual(mockData);
  });

  it('returns null on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await fetchHomepageData();
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchHomepageData();
    expect(result).toBeNull();
  });

  it('filters out invalid theme values', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          theme: 'auto' as never,
          userPreferences: { theme: 'blue' as never },
        }),
    });

    const result = await fetchHomepageData();
    expect(result?.theme).toBeUndefined();
    expect(result?.userPreferences?.theme).toBeUndefined();
  });

  it('caches response and returns cached on second call', async () => {
    const mockData: HomepageAPIResponse = { theme: 'dark' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const first = await fetchHomepageData();
    const second = await fetchHomepageData();

    expect(first).toEqual(mockData);
    expect(second).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once (cached)
  });
});

// ── clearHomepageCache Tests ────────────────────────────────────────────────

describe('clearHomepageCache', () => {
  it('clears cache so next fetch hits network', async () => {
    const mockData: HomepageAPIResponse = { theme: 'light' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    await fetchHomepageData();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    clearHomepageCache();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ theme: 'dark' }),
    });

    await fetchHomepageData();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
