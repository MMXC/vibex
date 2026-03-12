/**
 * Tests for persistQueryClient
 */

import {
  createLocalStoragePersister,
  clearQueryCache,
  getCacheInfo,
} from '@/lib/query/persistQueryClient';
import { PersistedClient } from '@tanstack/react-query-persist-client';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('createLocalStoragePersister', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('persistClient', () => {
    it('should persist client to localStorage', async () => {
      const persister = createLocalStoragePersister();
      const client: PersistedClient = {
        clientState: {
          queries: [],
          mutations: [],
        },
        timestamp: Date.now(),
        buster: 'test-buster',
      };

      await persister.persistClient(client);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vibex-query-cache',
        JSON.stringify(client)
      );
    });

    it('should handle errors gracefully', async () => {
      const persister = createLocalStoragePersister();
      const client: PersistedClient = {
        clientState: {
          queries: [],
          mutations: [],
        },
        timestamp: Date.now(),
        buster: 'test-buster',
      };

      // Mock setItem to throw
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      await expect(persister.persistClient(client)).resolves.not.toThrow();
    });
  });

  describe('restoreClient', () => {
    it('should restore client from localStorage', async () => {
      const persister = createLocalStoragePersister();
      const client: PersistedClient = {
        clientState: {
          queries: [],
          mutations: [],
        },
        timestamp: Date.now(),
        buster: 'test-buster',
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(client));

      const restored = await persister.restoreClient();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('vibex-query-cache');
      expect(restored).toEqual(client);
    });

    it('should return undefined when no cache exists', async () => {
      const persister = createLocalStoragePersister();
      localStorageMock.getItem.mockReturnValueOnce(null);

      const restored = await persister.restoreClient();

      expect(restored).toBeUndefined();
    });

    it('should handle invalid JSON gracefully', async () => {
      const persister = createLocalStoragePersister();
      localStorageMock.getItem.mockReturnValueOnce('invalid-json');

      const restored = await persister.restoreClient();

      expect(restored).toBeUndefined();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vibex-query-cache');
    });
  });

  describe('removeClient', () => {
    it('should remove client from localStorage', async () => {
      const persister = createLocalStoragePersister();

      await persister.removeClient!();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vibex-query-cache');
    });
  });
});

describe('clearQueryCache', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should remove cache from localStorage', () => {
    clearQueryCache();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('vibex-query-cache');
  });
});

describe('getCacheInfo', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should return correct info when cache exists', () => {
    const cacheData = JSON.stringify({ test: 'data' });
    localStorageMock.getItem.mockReturnValueOnce(cacheData);

    const info = getCacheInfo();

    expect(info.hasCache).toBe(true);
    expect(info.size).toBe(cacheData.length);
  });

  it('should return correct info when no cache exists', () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    const info = getCacheInfo();

    expect(info.hasCache).toBe(false);
    expect(info.size).toBe(0);
  });
});