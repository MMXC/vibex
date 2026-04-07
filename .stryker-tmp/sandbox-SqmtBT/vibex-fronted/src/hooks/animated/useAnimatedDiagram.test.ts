/**
 * useAnimatedDiagram Hook Tests
 */
// @ts-nocheck


import { renderHook, act } from '@testing-library/react';
import useAnimatedDiagram from './useAnimatedDiagram';

describe('useAnimatedDiagram', () => {
  const initialItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];

  it('should initialize with items', () => {
    const { result } = renderHook(() => useAnimatedDiagram(initialItems));

    expect(result.current.animatedItems).toHaveLength(2);
    expect(result.current.isAnimating('1')).toBe(false);
    expect(result.current.isEntering('1')).toBe(false);
  });

  it('should detect new items and trigger enter animation', async () => {
    const { result, rerender } = renderHook(
      ({ items }) => useAnimatedDiagram(items),
      { initialProps: { items: initialItems } }
    );

    // 添加新项
    const newItems = [
      ...initialItems,
      { id: '3', name: 'Item 3' },
    ];

    rerender({ items: newItems });

    // 应该有 3 个 items
    expect(result.current.animatedItems).toHaveLength(3);
  });

  it('should detect updated items and trigger update animation', async () => {
    const { result, rerender } = renderHook(
      ({ items }) => useAnimatedDiagram(items),
      { initialProps: { items: initialItems } }
    );

    // 更新已有项
    const updatedItems = [
      { id: '1', name: 'Item 1 Updated' },
      { id: '2', name: 'Item 2' },
    ];

    rerender({ items: updatedItems });

    // 应该检测到更新
    expect(result.current.animatedItems[0].item.name).toBe('Item 1 Updated');
  });

  it('should return correct animation key', () => {
    const { result } = renderHook(() => useAnimatedDiagram(initialItems));

    expect(result.current.getAnimationKey('1')).toBe(0);
  });

  it('should clear all animations', () => {
    const { result, rerender } = renderHook(
      ({ items }) => useAnimatedDiagram(items),
      { initialProps: { items: initialItems } }
    );

    // 添加新项触发动画
    const newItems = [...initialItems, { id: '3', name: 'Item 3' }];
    rerender({ items: newItems });

    // 清除动画
    act(() => {
      result.current.clearAnimations();
    });

    expect(result.current.isAnimating('1')).toBe(false);
    expect(result.current.isAnimating('3')).toBe(false);
  });

  it('should use custom animation config', () => {
    const customConfig = {
      enterDuration: 500,
      updateDuration: 300,
      staggerDelay: 100,
    };

    const { result } = renderHook(() =>
      useAnimatedDiagram(initialItems, customConfig)
    );

    expect(result.current.config.enterDuration).toBe(500);
    expect(result.current.config.updateDuration).toBe(300);
    expect(result.current.config.staggerDelay).toBe(100);
  });
});
