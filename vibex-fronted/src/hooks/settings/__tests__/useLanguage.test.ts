/**
 * useLanguage.test.ts — S61-E3: i18n infrastructure
 * Tests for the useLanguage hook that reads locale from userPreferencesStore.
 *
 * D3.10: vitest coverage for useLanguage hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// MUST use vi.hoisted() — vi.mock factory runs BEFORE module-level const declarations
const mockState = vi.hoisted(() => ({
  locale: 'zh' as const,
  setLocale: vi.fn(),
}));

// Mock the userPreferencesStore Zustand store
// Pattern: vi.mock returns a fn that, when called with a selector fn,
// returns the selected value from mockState
vi.mock('@/stores/userPreferencesStore', () => {
  return {
    useUserPreferencesStore: Object.assign(
      // The main function — supports both store() and store(selector)
      (selector?: (s: typeof mockState) => unknown) => {
        if (!selector) return mockState;
        return selector(mockState);
      },
      {
        // Dual-interface: also has getState()
        getState: () => mockState,
        setState: vi.fn(),
        subscribe: vi.fn(),
        destroy: vi.fn(),
      }
    ),
  };
});

import { useLanguage } from '../useLanguage';

describe('useLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return locale from userPreferencesStore', () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.locale).toBe('zh');
  });

  it('should call setLocale when setLanguage is invoked', async () => {
    const { result } = renderHook(() => useLanguage());
    const { setLanguage } = result.current;

    setLanguage('en');

    expect(mockState.setLocale).toHaveBeenCalledWith('en');
  });

  it('should reflect locale change when mockState locale is updated', async () => {
    mockState.locale = 'en';
    const { result } = renderHook(() => useLanguage());
    expect(result.current.locale).toBe('en');
  });

  it('should have locale value of type en or zh', () => {
    mockState.locale = 'zh';
    const { result } = renderHook(() => useLanguage());
    expect(['en', 'zh']).toContain(result.current.locale);
  });
});
