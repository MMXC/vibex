/**
 * Cache Service Tests
 */

import { cache, getCacheKey } from '@/services/api/cache';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('CacheService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value', () => {
      const data = { id: '1', name: 'Test' };
      localStorageMock.setItem('vibex_cache_test_key', JSON.stringify(data));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(data));

      const result = cache.get<{ id: string; name: string }>('test_key');

      expect(result).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = cache.get('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value in cache', () => {
      const data = { id: '1', name: 'Test' };

      cache.set('test_key', data);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vibex_cache_test_key',
        JSON.stringify(data)
      );
    });

    it('should store primitive values', () => {
      cache.set('string_key', 'test string');
      cache.set('number_key', 123);
      cache.set('bool_key', true);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vibex_cache_string_key',
        JSON.stringify('test string')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vibex_cache_number_key',
        JSON.stringify(123)
      );
    });
  });

  describe('remove', () => {
    it('should remove value from cache', () => {
      cache.remove('test_key');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vibex_cache_test_key');
    });
  });

  describe('clear', () => {
    it('should clear all vibex cache entries', () => {
      // Set up some cache entries using the cache.set method
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      // Verify removeItem was called for our cache keys
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });
});

describe('getCacheKey', () => {
  it('should return resource only when id not provided', () => {
    expect(getCacheKey('projects')).toBe('projects');
  });

  it('should return resource_id when id provided', () => {
    expect(getCacheKey('projects', 'user-1')).toBe('projects_user-1');
  });
});