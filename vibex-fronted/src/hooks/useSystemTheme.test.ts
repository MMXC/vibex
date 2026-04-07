/**
 * useSystemTheme Hook Tests
 */

import { renderHook } from '@testing-library/react';
import { useSystemTheme } from './useSystemTheme';

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: (_: string, handler: (e: { matches: boolean }) => void) => {
        listeners.push(handler);
      },
      removeEventListener: vi.fn(),
    }),
  });
  return { getListeners: () => listeners };
};

describe('useSystemTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns dark when system prefers dark', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useSystemTheme());
    expect(result.current).toBe('dark');
  });

  it('returns light when system prefers light', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useSystemTheme());
    expect(result.current).toBe('light');
  });
});
