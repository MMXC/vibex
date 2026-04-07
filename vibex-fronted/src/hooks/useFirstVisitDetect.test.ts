/**
 * useFirstVisitDetect Tests
 * 
 * 测试首次访问检测功能
 * 对应 PRD: F1.1, F1.2, F1.3
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFirstVisitDetect } from './useFirstVisitDetect';

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
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useFirstVisitDetect', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('F1.1: 首次访问自动触发', () => {
    it('首次访问时应返回 isFirstVisit=true', async () => {
      const { result } = renderHook(() => useFirstVisitDetect({
        storageKey: 'vibex-first-visit',
        expirationMs: 7 * 24 * 60 * 60 * 1000,
      }));

      await waitFor(() => expect(result.current.isReady).toBe(true));
      
      expect(result.current.isFirstVisit).toBe(true);
    });

    it('记录访问后应返回 isFirstVisit=false', async () => {
      const { result } = renderHook(() => useFirstVisitDetect({
        storageKey: 'vibex-first-visit',
        expirationMs: 7 * 24 * 60 * 60 * 1000,
      }));

      await waitFor(() => expect(result.current.isReady).toBe(true));
      
      // 记录访问
      act(() => {
        result.current.recordVisit();
      });

      expect(result.current.isFirstVisit).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vibex-first-visit',
        expect.any(String)
      );
    });
  });

  describe('F1.2: localStorage 记录访问状态', () => {
    it('应使用指定的 storageKey', async () => {
      const customKey = 'vibex-first-visit';
      const { result } = renderHook(() => useFirstVisitDetect({
        storageKey: customKey,
      }));

      await waitFor(() => expect(result.current.isReady).toBe(true));
      
      act(() => {
        result.current.recordVisit();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        customKey,
        expect.any(String)
      );
    });

    it('应正确保存时间戳', async () => {
      const { result } = renderHook(() => useFirstVisitDetect({
        storageKey: 'vibex-first-visit',
      }));

      await waitFor(() => expect(result.current.isReady).toBe(true));
      
      const beforeTime = Date.now();
      act(() => {
        result.current.recordVisit();
      });
      const afterTime = Date.now();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vibex-first-visit',
        expect.stringMatching(/{"timestamp":\d+,"expiresIn":\d+}/)
      );
    });
  });

  describe('F1.3: 过期后可重新触发', () => {
    it('未过期时 isExpired 应为 false', async () => {
      // 模拟刚记录的访问
      localStorageMock.setItem('vibex-first-visit', JSON.stringify({
        timestamp: Date.now(),
        expiresIn: 7 * 24 * 60 * 60 * 1000,
      }));

      const { result } = renderHook(() => useFirstVisitDetect({
        storageKey: 'vibex-first-visit',
        expirationMs: 7 * 24 * 60 * 60 * 1000,
      }));

      await waitFor(() => expect(result.current.isReady).toBe(true));
      
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isFirstVisit).toBe(false);
    });

    it('过期后 isExpired 应为 true', async () => {
      // 模拟 8 天前的访问（已过期）
      const expiredTime = Date.now() - (8 * 24 * 60 * 60 * 1000);
      localStorageMock.setItem('vibex-first-visit', JSON.stringify({
        timestamp: expiredTime,
        expiresIn: 7 * 24 * 60 * 60 * 1000,
      }));

      const { result } = renderHook(() => useFirstVisitDetect({
        storageKey: 'vibex-first-visit',
        expirationMs: 7 * 24 * 60 * 60 * 1000,
      }));

      await waitFor(() => expect(result.current.isReady).toBe(true));
      
      expect(result.current.isExpired).toBe(true);
      expect(result.current.isFirstVisit).toBe(true);
    });

    it('resetFirstVisit 应重置状态', async () => {
      // 先记录访问
      localStorageMock.setItem('vibex-first-visit', JSON.stringify({
        timestamp: Date.now(),
        expiresIn: 7 * 24 * 60 * 60 * 1000,
      }));

      const { result } = renderHook(() => useFirstVisitDetect({
        storageKey: 'vibex-first-visit',
        expirationMs: 7 * 24 * 60 * 60 * 1000,
      }));

      await waitFor(() => expect(result.current.isReady).toBe(true));
      
      expect(result.current.isFirstVisit).toBe(false);

      // 重置
      act(() => {
        result.current.resetFirstVisit();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vibex-first-visit');
      expect(result.current.isFirstVisit).toBe(true);
    });
  });
});
