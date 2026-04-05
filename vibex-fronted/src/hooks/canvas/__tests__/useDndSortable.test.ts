/**
 * useDndSortable Hook Tests
 *
 * 覆盖场景:
 * - 基本返回值结构
 * - disabled=true 行为
 * - dragStyle 计算
 *
 * 注意: @dnd-kit 交互需要 DOM 环境，这些测试覆盖可测试的部分
 * 完整 DnD 交互测试在 E2E 测试中进行
 *
 * 参考: docs/proposals/20260405-1321/canvas-testing-strategy/
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDndSortable } from '../useDndSortable';
import * as sortableModule from '@dnd-kit/sortable';

type SortableArgs = { id: string; disabled?: boolean; isDragging?: boolean };

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(({ id, disabled, isDragging }: SortableArgs) => ({
    setNodeRef: vi.fn(),
    transform: disabled ? null : { x: 0, y: 0 },
    transition: 'transform 200ms',
    isDragging: isDragging ?? false,
    attributes: { 'data-id': id },
    listeners: { onPointerDown: vi.fn() },
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn((t: { x: number; y: number } | null) =>
        t ? `translate3d(${t.x}px, ${t.y}px, 0)` : ''
      ),
    },
  },
}));

describe('useDndSortable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('return structure', () => {
    it('should return all required properties', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(result.current).toHaveProperty('setNodeRef');
      expect(result.current).toHaveProperty('transform');
      expect(result.current).toHaveProperty('transition');
      expect(result.current).toHaveProperty('isDragging');
      expect(result.current).toHaveProperty('attributes');
      expect(result.current).toHaveProperty('listeners');
      expect(result.current).toHaveProperty('dragStyle');
    });

    it('should return isDragging as false initially', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(result.current.isDragging).toBe(false);
    });

    it('should return setNodeRef as a function', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(typeof result.current.setNodeRef).toBe('function');
    });

    it('should return attributes as an object', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(typeof result.current.attributes).toBe('object');
    });

    it('should return listeners as an object', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(typeof result.current.listeners).toBe('object');
    });

    it('should return transform from useSortable', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      // Mock returns { x: 0, y: 0 }
      expect(result.current.transform).toEqual({ x: 0, y: 0 });
    });

    it('should return transition from useSortable', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(result.current.transition).toBe('transform 200ms');
    });
  });

  describe('dragStyle computation', () => {
    it('should return dragStyle as a React.CSSProperties object', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(typeof result.current.dragStyle).toBe('object');
      expect(result.current.dragStyle).toHaveProperty('transform');
      expect(result.current.dragStyle).toHaveProperty('transition');
      expect(result.current.dragStyle).toHaveProperty('opacity');
      expect(result.current.dragStyle).toHaveProperty('zIndex');
    });

    it('should set opacity to 1 when not dragging', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      // isDragging=false → opacity = 1
      expect(result.current.dragStyle.opacity).toBe(1);
    });

    it('should set zIndex to 1 when not dragging', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      // isDragging=false → zIndex = 1
      expect(result.current.dragStyle.zIndex).toBe(1);
    });

    it('should include transform in dragStyle', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(result.current.dragStyle.transform).toBeDefined();
    });

    it('should include transition in dragStyle', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(result.current.dragStyle.transition).toBe('transform 200ms');
    });

    it('should compute transform via CSS.Transform.toString', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      // Mock returns { x: 0, y: 0 } → toString returns 'translate3d(0px, 0px, 0)'
      expect(result.current.dragStyle.transform).toBe('translate3d(0px, 0px, 0)');
    });

    it('should set opacity to 0.5 when isDragging=true', () => {
      vi.mocked(sortableModule.useSortable).mockReturnValueOnce({
        setNodeRef: vi.fn(),
        transform: { x: 0, y: 0 },
        transition: 'transform 200ms',
        isDragging: true,
        attributes: { 'data-id': 'node-1' },
        listeners: { onPointerDown: vi.fn() },
      });
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(result.current.dragStyle.opacity).toBe(0.5);
    });

    it('should set zIndex to 1000 when isDragging=true', () => {
      vi.mocked(sortableModule.useSortable).mockReturnValueOnce({
        setNodeRef: vi.fn(),
        transform: { x: 0, y: 0 },
        transition: 'transform 200ms',
        isDragging: true,
        attributes: { 'data-id': 'node-1' },
        listeners: { onPointerDown: vi.fn() },
      });
      const { result } = renderHook(() => useDndSortable({ id: 'node-1' }));
      expect(result.current.dragStyle.zIndex).toBe(1000);
    });
  });

  describe('disabled option', () => {
    it('should work with disabled=false (default)', () => {
      const { result } = renderHook(() =>
        useDndSortable({ id: 'node-1', disabled: false })
      );
      expect(result.current).toBeDefined();
    });

    it('should work with disabled=true', () => {
      const { result } = renderHook(() =>
        useDndSortable({ id: 'node-1', disabled: true })
      );
      expect(result.current).toBeDefined();
    });

    it('should return null transform when disabled', () => {
      const { result } = renderHook(() =>
        useDndSortable({ id: 'node-1', disabled: true })
      );
      expect(result.current.transform).toBeNull();
    });
  });

  describe('id parameter', () => {
    it('should accept string id', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'my-node-id' }));
      expect(result.current).toBeDefined();
    });

    it('should include id in attributes', () => {
      const { result } = renderHook(() => useDndSortable({ id: 'test-id' }));
      expect(result.current.attributes['data-id']).toBe('test-id');
    });
  });
});
