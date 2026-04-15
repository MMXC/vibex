/**
 * CanvasPage.test.tsx
 *
 * E1-U1: Tab State 修复
 * 验收标准:
 * AC1: Tab 切换到 context 时, phase 变为 'input'
 * AC3: resetPanelState() 在 Tab 变化时被调用, queuePanelExpanded = false
 *
 * 策略: 直接测试 useCanvasPanels hook 的 resetPanelState 行为
 * (CanvasPage 是大型组件, 集成测试由 Playwright E2E 覆盖)
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasPanels } from '@/hooks/canvas/useCanvasPanels';

describe('E1-U1: Tab State resetPanelState', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('AC3: resetPanelState 将 queuePanelExpanded 重置为 false', () => {
    const { result } = renderHook(() => useCanvasPanels());

    // Pre: 展开状态
    act(() => {
      result.current.setQueuePanelExpanded(true);
    });
    expect(result.current.queuePanelExpanded).toBe(true);

    // Action: resetPanelState
    act(() => {
      result.current.resetPanelState();
    });

    // Assert: 重置为 false
    expect(result.current.queuePanelExpanded).toBe(false);
  });

  it('AC3: useCanvasPanels 返回 resetPanelState 函数', () => {
    const { result } = renderHook(() => useCanvasPanels());
    expect(typeof result.current.resetPanelState).toBe('function');
  });

  it('AC3: 多次调用 resetPanelState 幂等', () => {
    const { result } = renderHook(() => useCanvasPanels());

    act(() => {
      result.current.setQueuePanelExpanded(true);
    });
    expect(result.current.queuePanelExpanded).toBe(true);

    act(() => {
      result.current.resetPanelState();
      result.current.resetPanelState();
      result.current.resetPanelState();
    });

    expect(result.current.queuePanelExpanded).toBe(false);
  });
});
