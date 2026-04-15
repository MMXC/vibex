/**
 * Unit Tests: useCanvasPanels — Bug2 Canvas Tab State Fix
 *
 * B2: Canvas Tab State 残留修复验收
 *
 * Root Cause #1: queuePanelExpanded 初始为 true
 * Fix: queuePanelExpanded 初始为 false + resetPanelState()
 *
 * Root Cause #2: activeTab 切换时面板状态未重置
 * Fix: useEffect(() => { resetPanelState(); }, [activeTab]);
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasPanels } from '../useCanvasPanels';

vi.mock('@/stores/sessionStore', () => ({
  useSessionStore: vi.fn(() => ({
    projectId: 'test-project',
    projectName: 'Test Project',
    setProjectName: vi.fn(),
  })),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ user: null })),
}));

describe('useCanvasPanels — Bug2 Tab State Fix', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('queuePanelExpanded defaults to false (Root Cause #1 fix)', () => {
    const { result } = renderHook(() => useCanvasPanels());
    expect(result.current.queuePanelExpanded).toBe(false);
  });

  it('resetPanelState is defined and callable', () => {
    const { result } = renderHook(() => useCanvasPanels());
    expect(typeof result.current.resetPanelState).toBe('function');
    act(() => { result.current.resetPanelState(); });
    expect(result.current.queuePanelExpanded).toBe(false);
  });

  it('activeTab defaults to context', () => {
    const { result } = renderHook(() => useCanvasPanels());
    expect(result.current.activeTab).toBe('context');
  });

  it('setActiveTab is defined and callable', () => {
    const { result } = renderHook(() => useCanvasPanels());
    expect(typeof result.current.setActiveTab).toBe('function');
  });

  it('returns componentGenerating state', () => {
    const { result } = renderHook(() => useCanvasPanels());
    expect(typeof result.current.componentGenerating).toBe('boolean');
  });
});
