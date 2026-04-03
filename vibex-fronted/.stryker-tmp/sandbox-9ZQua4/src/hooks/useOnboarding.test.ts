/**
 * useOnboarding Hook Tests
 * 
 * 测试引导触发逻辑
 */
// @ts-nocheck


import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnboarding } from './useOnboarding';
import { useOnboardingStore } from '@/stores/onboarding/onboardingStore';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

describe('useOnboarding', () => {
  beforeEach(() => {
    // 重置 store 状态
    useOnboardingStore.getState().reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    useOnboardingStore.getState().reset();
  });

  it('应该对未开始的用户延迟触发引导', async () => {
    const { result } = renderHook(() => useOnboarding());

    // 初始状态应该是 not-started
    expect(result.current.status).toBe('not-started');

    // 快进时间到1.5秒后
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // 等待状态更新
    await waitFor(() => {
      expect(useOnboardingStore.getState().status).toBe('in-progress');
    });
  });

  it('不应该对已完成的用户触发引导', async () => {
    // 先完成引导
    useOnboardingStore.getState().start();
    useOnboardingStore.getState().complete();

    const { result } = renderHook(() => useOnboarding());

    // 快进时间
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // 状态应该仍然是 completed
    await waitFor(() => {
      expect(useOnboardingStore.getState().status).toBe('completed');
    });
  });

  it('不应该对已跳过的用户触发引导', async () => {
    // 先跳过引导
    useOnboardingStore.getState().skip();

    const { result } = renderHook(() => useOnboarding());

    // 快进时间
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // 状态应该仍然是 skipped
    await waitFor(() => {
      expect(useOnboardingStore.getState().status).toBe('skipped');
    });
  });

  it('manuallyStartOnboarding 应该立即触发引导', async () => {
    const { result } = renderHook(() => useOnboarding());

    // 手动触发
    act(() => {
      result.current.manuallyStartOnboarding();
    });

    // 状态应该变为 in-progress
    await waitFor(() => {
      expect(useOnboardingStore.getState().status).toBe('in-progress');
    });
  });

  it('在排除路由上不应该触发引导', async () => {
    // 重新 mock 路由为排除路由
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/project/123');

    const { result } = renderHook(() => useOnboarding());

    // 快进时间
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // 状态应该仍然是 not-started
    await waitFor(() => {
      expect(useOnboardingStore.getState().status).toBe('not-started');
    });

    // 恢复路由
    usePathname.mockReturnValue('/');
  });
});
