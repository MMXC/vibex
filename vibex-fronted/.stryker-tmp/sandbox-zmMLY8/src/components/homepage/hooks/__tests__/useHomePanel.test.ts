/**
 * useHomePanel Hook Tests
 */
// @ts-nocheck


import { renderHook, act } from '@testing-library/react';
import { useHomePanel } from '../useHomePanel';

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
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useHomePanel', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state with default panel sizes', () => {
      const { result } = renderHook(() => useHomePanel());

      expect(result.current.panelSizes).toEqual([60, 40]);
      expect(result.current.maximizedPanel).toBeNull();
      expect(result.current.minimizedPanel).toBeNull();
    });
  });

  describe('setPanelSizes', () => {
    it('should update panel sizes', () => {
      const { result } = renderHook(() => useHomePanel());

      act(() => {
        result.current.setPanelSizes([70, 30]);
      });

      expect(result.current.panelSizes).toEqual([70, 30]);
    });

    it('should save to localStorage', () => {
      const { result } = renderHook(() => useHomePanel());

      act(() => {
        result.current.setPanelSizes([50, 50]);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vibex-panel-sizes',
        JSON.stringify([50, 50])
      );
    });
  });

  describe('toggleMaximize', () => {
    it('should maximize panel when not maximized', () => {
      const { result } = renderHook(() => useHomePanel());

      act(() => {
        result.current.toggleMaximize('left-panel');
      });

      expect(result.current.maximizedPanel).toBe('left-panel');
    });

    it('should unmaximize panel when already maximized', () => {
      const { result } = renderHook(() => useHomePanel());

      act(() => {
        result.current.toggleMaximize('left-panel');
      });
      expect(result.current.maximizedPanel).toBe('left-panel');

      act(() => {
        result.current.toggleMaximize('left-panel');
      });
      expect(result.current.maximizedPanel).toBeNull();
    });

    it('should clear minimized panel when maximizing', () => {
      const { result } = renderHook(() => useHomePanel());

      act(() => {
        result.current.toggleMinimize('right-panel');
      });
      expect(result.current.minimizedPanel).toBe('right-panel');

      act(() => {
        result.current.toggleMaximize('left-panel');
      });
      expect(result.current.minimizedPanel).toBeNull();
    });
  });

  describe('toggleMinimize', () => {
    it('should minimize panel when not minimized', () => {
      const { result } = renderHook(() => useHomePanel());

      act(() => {
        result.current.toggleMinimize('right-panel');
      });

      expect(result.current.minimizedPanel).toBe('right-panel');
    });

    it('should unminimize panel when already minimized', () => {
      const { result } = renderHook(() => useHomePanel());

      act(() => {
        result.current.toggleMinimize('right-panel');
      });
      expect(result.current.minimizedPanel).toBe('right-panel');

      act(() => {
        result.current.toggleMinimize('right-panel');
      });
      expect(result.current.minimizedPanel).toBeNull();
    });

    it('should clear maximized panel when minimizing', () => {
      const { result } = renderHook(() => useHomePanel());

      act(() => {
        result.current.toggleMaximize('left-panel');
      });
      expect(result.current.maximizedPanel).toBe('left-panel');

      act(() => {
        result.current.toggleMinimize('right-panel');
      });
      expect(result.current.maximizedPanel).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all panel states to defaults', () => {
      const { result } = renderHook(() => useHomePanel());

      // Make some changes
      act(() => {
        result.current.setPanelSizes([80, 20]);
        result.current.toggleMaximize('left-panel');
        result.current.toggleMinimize('right-panel');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.panelSizes).toEqual([60, 40]);
      expect(result.current.maximizedPanel).toBeNull();
      expect(result.current.minimizedPanel).toBeNull();
    });
  });

  describe('expandPanel', () => {
    it.todo('expandPanel tests - to be implemented');
  });
});