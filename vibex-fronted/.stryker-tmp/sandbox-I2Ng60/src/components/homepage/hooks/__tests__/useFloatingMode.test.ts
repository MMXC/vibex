/**
 * useFloatingMode Hook Tests
 *
 * Epic 8: 悬浮模式
 * ST-8.1: 滚动触发收起 (滚动超过 50%)
 * ST-8.2: 悬浮停止恢复 (停止滚动 1s 后面板恢复)
 */
// @ts-nocheck


import { renderHook, act } from '@testing-library/react';
import { useFloatingMode } from '../useFloatingMode';

describe('useFloatingMode', () => {
  // Capture the registered scroll handler
  let capturedHandler: ((e: Event) => void) | null = null;

  beforeEach(() => {
    capturedHandler = null;
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset test interface to avoid cross-test pollution
    const win = window as Window & { __testScrollY?: number; __testScrollHeight?: number; __testInnerHeight?: number };
    delete win.__testScrollY;
    delete win.__testScrollHeight;
    delete win.__testInnerHeight;

    // Intercept addEventListener to capture the handler
    jest.spyOn(window, 'addEventListener').mockImplementation(
      (event: string, handler: (e: Event) => void) => {
        if (event === 'scroll') capturedHandler = handler;
        return undefined as unknown as () => void;
      }
    );

    jest.spyOn(window, 'removeEventListener').mockImplementation(
      (event: string) => {
        if (event === 'scroll') capturedHandler = null;
        return undefined as unknown as () => void;
      }
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Simulate scroll by using the test interface (__testScrollY)
   * Wrapped in act() to ensure React state updates are flushed.
   */
  function simulateScroll(scrollY: number, scrollHeight = 1000, innerHeight = 600) {
    if (!capturedHandler) return;

    // Use test interface to set scroll position
    const win = window as Window & { __testScrollY?: number; __testScrollHeight?: number; __testInnerHeight?: number };
    win.__testScrollY = scrollY;
    win.__testScrollHeight = scrollHeight;
    win.__testInnerHeight = innerHeight;

    // Wrap in act() to flush React state updates
    act(() => {
      capturedHandler!(new Event('scroll'));
    });
  }

  describe('ST-8.1: 滚动触发收起', () => {
    it('滚动超过 50% 时应触发悬浮模式', () => {
      const { result } = renderHook(() => useFloatingMode({ threshold: 0.5 }));

      // Initial: scrollY=0 → ratio=0 < 0.5
      simulateScroll(0);
      expect(result.current.isFloating).toBe(false);

      // scrollY=240 → ratio=240/400=0.6 > 0.5 → floating
      simulateScroll(240);
      expect(result.current.isFloating).toBe(true);
    });

    it('滚动未超过 50% 时不应触发悬浮模式', () => {
      const { result } = renderHook(() => useFloatingMode({ threshold: 0.5 }));

      // scrollY=160 → ratio=160/400=0.4 < 0.5
      simulateScroll(160);
      expect(result.current.isFloating).toBe(false);
    });

    it('精确 50% 时不触发', () => {
      const { result } = renderHook(() => useFloatingMode({ threshold: 0.5 }));

      // scrollY=200 → ratio=200/400=0.5, NOT > 0.5
      simulateScroll(200);
      expect(result.current.isFloating).toBe(false);
    });

    it('可配置阈值 - 30%', () => {
      const { result } = renderHook(() => useFloatingMode({ threshold: 0.3 }));

      // scrollY=80 → ratio=80/400=0.2 < 0.3
      simulateScroll(80);
      expect(result.current.isFloating).toBe(false);

      // scrollY=140 → ratio=140/400=0.35 > 0.3
      simulateScroll(140);
      expect(result.current.isFloating).toBe(true);
    });

    it('页面高度为0时不触发', () => {
      const { result } = renderHook(() => useFloatingMode());
      simulateScroll(0, 0, 600);
      expect(result.current.isFloating).toBe(false);
    });
  });

  describe('ST-8.2: 悬浮停止恢复', () => {
    it('停止滚动 1s 后面板应恢复', async () => {
      const { result } = renderHook(() => useFloatingMode({ resumeDelay: 1000 }));

      simulateScroll(240); // floating
      expect(result.current.isFloating).toBe(true);

      simulateScroll(0); // schedules resume
      expect(result.current.isFloating).toBe(true);

      act(() => { jest.advanceTimersByTime(999); });
      expect(result.current.isFloating).toBe(true);

      act(() => { jest.advanceTimersByTime(1); });
      expect(result.current.isFloating).toBe(false);
    });

    it('恢复延迟可配置', async () => {
      const { result } = renderHook(() => useFloatingMode({ resumeDelay: 500 }));

      simulateScroll(240);
      expect(result.current.isFloating).toBe(true);

      simulateScroll(0);

      act(() => { jest.advanceTimersByTime(499); });
      expect(result.current.isFloating).toBe(true);

      act(() => { jest.advanceTimersByTime(1); });
      expect(result.current.isFloating).toBe(false);
    });

    it('恢复期间再次滚动应取消恢复', async () => {
      const { result } = renderHook(() => useFloatingMode({ resumeDelay: 1000 }));

      simulateScroll(240);
      expect(result.current.isFloating).toBe(true);

      simulateScroll(0);

      act(() => { jest.advanceTimersByTime(500); });
      expect(result.current.isFloating).toBe(true);

      simulateScroll(240); // re-trigger while waiting
      expect(result.current.isFloating).toBe(true);

      act(() => { jest.advanceTimersByTime(1000); });
      expect(result.current.isFloating).toBe(true); // still floating
    });
  });

  describe('ST-8.3: 状态回调', () => {
    it('enabled=false 时不触发悬浮', () => {
      const { result } = renderHook(() => useFloatingMode({ enabled: false }));
      simulateScroll(240);
      expect(result.current.isFloating).toBe(false);
    });

    it('onFloatingChange 回调在状态变化时被调用', () => {
      const onChange = jest.fn();
      renderHook(() => useFloatingMode({ onFloatingChange: onChange }));
      simulateScroll(240);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('onFloatingChange 仅在状态变化时触发', () => {
      const onChange = jest.fn();
      renderHook(() => useFloatingMode({ onFloatingChange: onChange }));
      simulateScroll(240);
      const count = onChange.mock.calls.length;
      simulateScroll(300);
      expect(onChange.mock.calls.length).toBe(count); // no new calls
    });
  });

  describe('cleanup', () => {
    it('卸载时应清理 scroll listener', () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useFloatingMode());
      unmount();
      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('卸载时应清理 pending timer', () => {
      const clearSpy = jest.spyOn(global, 'clearTimeout');
      const { unmount } = renderHook(() => useFloatingMode({ resumeDelay: 1000 }));
      simulateScroll(240);
      simulateScroll(0); // schedules resume
      unmount();
      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
