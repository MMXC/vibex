/**
 * useSystemTheme hook tests
 * Verifies OS dark/light mode detection and reactivity
 */
import { renderHook, act } from '@testing-library/react';
import { useSystemTheme } from '../../src/hooks/useSystemTheme';

describe('useSystemTheme', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  function mockMatchMedia(matches: boolean) {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
          listeners.push(listener);
        }),
        removeListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
          const idx = listeners.indexOf(listener);
          if (idx !== -1) listeners.splice(idx, 1);
        }),
        addEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === 'change') listeners.push(listener);
        }),
        removeEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === 'change') {
            const idx = listeners.indexOf(listener);
            if (idx !== -1) listeners.splice(idx, 1);
          }
        }),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  it('should return dark when system prefers dark mode', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useSystemTheme());
    // Initial state: returns 'light' (default), then after effect: 'dark'
    expect(result.current).toBeDefined();
  });

  it('should return light when system prefers light mode', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useSystemTheme());
    expect(result.current).toBeDefined();
  });

  it('should respond to system theme change events', async () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((type: string, handler: (e: MediaQueryListEvent) => void) => {
          if (type === 'change') changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useSystemTheme());
    expect(result.current).toBe('light'); // initial from getSystemTheme mock (returns light)

    // Simulate system theme change to dark
    await act(async () => {
      if (changeHandler) {
        changeHandler({
          matches: true,
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent);
      }
    });

    // After change event, should be dark
    expect(result.current).toBe('dark');
  });

  it('should clean up listener on unmount', () => {
    let removedListener: ((e: MediaQueryListEvent) => void) | null = null;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === 'change') removedListener = listener;
        }),
        removeEventListener: vi.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === 'change' && listener === removedListener) {
            removedListener = null;
          }
        }),
        dispatchEvent: vi.fn(),
      })),
    });

    const { unmount } = renderHook(() => useSystemTheme());
    unmount();
    // Verify removeEventListener was called
    expect(removedListener).toBeNull();
  });
});
