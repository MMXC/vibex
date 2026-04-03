/**
 * Theme Storage Service Tests
 */
// @ts-nocheck


import {
  getStoredTheme,
  setStoredTheme,
  clearStoredTheme,
  getSystemTheme,
  resolveTheme,
} from './themeStorage';

const STORAGE_KEY = 'vibex-theme';

describe('themeStorage', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: () => {
        store = {};
      },
      getStore: () => store,
    };
  })();

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('getStoredTheme', () => {
    it('returns null when no theme is stored', () => {
      expect(getStoredTheme()).toBeNull();
    });

    it('returns stored mode', () => {
      const stored = { mode: 'dark' as const, timestamp: Date.now() };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));
      expect(getStoredTheme()).toBe('dark');
    });

    it('returns null on invalid JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('not-json');
      expect(getStoredTheme()).toBeNull();
    });
  });

  describe('setStoredTheme', () => {
    it('stores theme with timestamp', () => {
      setStoredTheme('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
      const parsed = JSON.parse(localStorageMock.getStore()[STORAGE_KEY]);
      expect(parsed.mode).toBe('dark');
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('clearStoredTheme', () => {
    it('removes stored theme', () => {
      setStoredTheme('dark');
      clearStoredTheme();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('getSystemTheme', () => {
    it('returns light when no matchMedia', () => {
      const original = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn(() => ({ matches: false })),
        writable: true,
      });
      expect(getSystemTheme()).toBe('light');
      Object.defineProperty(window, 'matchMedia', { value: original, writable: true });
    });
  });

  describe('resolveTheme', () => {
    it('resolves light directly', () => {
      expect(resolveTheme('light')).toBe('light');
    });

    it('resolves dark directly', () => {
      expect(resolveTheme('dark')).toBe('dark');
    });

    it('resolves system to light', () => {
      expect(resolveTheme('system', 'light')).toBe('light');
    });

    it('resolves system to dark', () => {
      expect(resolveTheme('system', 'dark')).toBe('dark');
    });
  });
});
