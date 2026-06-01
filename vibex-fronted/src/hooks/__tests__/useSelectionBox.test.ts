/**
 * useSelectionBox — vitest tests
 *
 * E4: 多选批量操作
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelectionBox } from '../dds/useSelectionBox';

// vi.hoisted keeps these accessible inside the hoisted vi.mock factory
const { mockDeselectAll, mockStoreState } = vi.hoisted(() => {
  const mockDeselectAll = vi.fn();
  const mockStoreState = { selectedCardIds: [] as string[], deselectAll: mockDeselectAll, setState: vi.fn() };
  return { mockDeselectAll, mockStoreState };
});

vi.mock('@/stores/dds', () => {
  const store = () => mockStoreState;
  (store as ReturnType<typeof vi.fn>).getState = () => mockStoreState;
  return { useDDSCanvasStore: store };
});

describe('useSelectionBox', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    mockDeselectAll.mockClear();
    container = document.createElement('div');
    container.setAttribute('data-testid', 'canvas-container');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('returns null selectionBox and false isSelecting initially', () => {
    const { result } = renderHook(() => useSelectionBox());
    expect(result.current.selectionBox).toBeNull();
    expect(result.current.isSelecting).toBe(false);
  });

  it('containerRef is a function', () => {
    const { result } = renderHook(() => useSelectionBox());
    expect(typeof result.current.containerRef).toBe('function');
  });

  it('clearSelection calls deselectAll on the store', async () => {
    mockStoreState.selectedCardIds = ['card-1', 'card-2'];
    const { result } = renderHook(() => useSelectionBox());
    act(() => {
      result.current.clearSelection();
    });
    expect(mockDeselectAll).toHaveBeenCalled();
  });
});
