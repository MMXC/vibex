/**
 * apiClient.test.ts — P005-E2: API fetch wrapper with offline fallback
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to mock the Cache API
const mockCache = {
  match: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};
vi.stubGlobal('caches', {
  open: vi.fn().mockResolvedValue(mockCache),
});

describe('apiClient', () => {
  beforeEach(() => {
    mockCache.match.mockReset();
    mockCache.put.mockReset();
    mockCache.delete.mockReset();
  });

  describe('apiFetch', () => {
    it('returns data on successful network response', async () => {
      const cachedData = { data: 'hello' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(cachedData),
        clone: vi.fn().mockReturnThis(),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

      // Import dynamically to pick up the mocked caches
      const { apiFetch } = await import('./apiClient');
      const result = await apiFetch<typeof cachedData>('/api/test');

      expect(result.offline).toBe(false);
      expect((result as { offline: false; data: unknown }).data).toEqual(cachedData);
      // Should cache the response
      expect(mockCache.put).toHaveBeenCalled();
    });

    it('falls back to cache on network failure with cached data', async () => {
      const cachedData = { data: 'cached' };
      mockCache.match.mockResolvedValue({
        json: vi.fn().mockResolvedValue(cachedData),
      });

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as unknown as typeof fetch;

      const { apiFetch } = await import('./apiClient');
      const result = await apiFetch('/api/test');

      expect(result.offline).toBe(false);
      expect((result as { offline: false; cached: boolean }).cached).toBe(true);
    });

    it('returns offline: true when both network and cache miss', async () => {
      mockCache.match.mockResolvedValue(null);

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as unknown as typeof fetch;

      const { apiFetch } = await import('./apiClient');
      const result = await apiFetch('/api/test');

      expect(result.offline).toBe(true);
    });
  });
});
