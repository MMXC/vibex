/**
 * undoRedoStore.test.ts — vitest for S62-E4 collaboration undo/redo
 * D4.5: vitest coverage for undoRedoStore (13 tests)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// All mocks inside vi.hoisted to avoid TDZ
const mocks = vi.hoisted(() => {
  const mockGetEditor = vi.fn();
  const mockBroadcastUndo = vi.fn();
  const mockBroadcastRedo = vi.fn();
  const mockUndo = vi.fn();
  const mockRedo = vi.fn();

  // canvasHistoryStore mock — Zustand dual-interface: hook fn + getState()
  const mockGetState = vi.fn(() => ({
    undo: mockUndo,
    redo: mockRedo,
    canUndo: vi.fn(() => true),
    canRedo: vi.fn(() => true),
  }));
  const mockFn = vi.fn(mockGetState);
  (mockFn as typeof mockFn & { getState: typeof mockGetState }).getState = mockGetState;

  // presenceStore mock — Zustand dual-interface: hook fn + getState()
  const mockPresenceGetState = vi.fn(() => ({ getEditor: mockGetEditor }));
  const mockPresenceFn = vi.fn(mockPresenceGetState);
  (mockPresenceFn as typeof mockPresenceFn & { getState: typeof mockPresenceGetState }).getState = mockPresenceGetState;

  return {
    mockGetEditor,
    mockBroadcastUndo,
    mockBroadcastRedo,
    mockUndo,
    mockRedo,
    mockFn,
    mockGetState,
    mockPresenceFn,
    mockPresenceGetState,
  };
});

vi.mock('@/lib/collaboration/presenceStore', () => ({
  usePresenceStore: mocks.mockPresenceFn,
}));

vi.mock('@/lib/collaboration/wsCollabHandler', () => ({
  broadcastUndo: mocks.mockBroadcastUndo,
  broadcastRedo: mocks.mockBroadcastRedo,
}));

vi.mock('@/stores/dds/canvasHistoryStore', () => {
  const { mockFn, mockGetState } = mocks;
  const storeFn = vi.fn(mockGetState) as typeof mockFn & { getState: typeof mockGetState };
  storeFn.getState = mockGetState;
  return { useCanvasHistoryStore: storeFn };
});

import { useUndoRedoStore } from '../undoRedoStore';

describe('S62-E4 undoRedoStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetEditor.mockReturnValue(undefined);
    mocks.mockGetState.mockReturnValue({
      undo: mocks.mockUndo,
      redo: mocks.mockRedo,
      canUndo: vi.fn(() => true),
      canRedo: vi.fn(() => true),
    });
    mocks.mockPresenceGetState.mockReturnValue({ getEditor: mocks.mockGetEditor });
    useUndoRedoStore.setState({
      currentOperator: null,
      conflictDialog: { open: false, conflictingUserName: '', conflictingUserId: '', nodeId: '' },
    });
  });

  it('D4.1: setCurrentOperator stores operator info', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    act(() => {
      result.current.setCurrentOperator({
        userId: 'u1', userName: 'alice', avatar: '', action: 'undo', timestamp: 1000,
      });
    });
    expect(result.current.currentOperator?.userName).toBe('alice');
    expect(result.current.currentOperator?.action).toBe('undo');
  });

  it('D4.1: clearOperator resets operator', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    act(() => {
      result.current.setCurrentOperator({
        userId: 'u1', userName: 'bob', avatar: '', action: 'redo', timestamp: 2000,
      });
    });
    expect(result.current.currentOperator?.userName).toBe('bob');
    act(() => { result.current.clearOperator(); });
    expect(result.current.currentOperator).toBeNull();
  });

  it('D4.4: checkConflict returns false when node not being edited', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    expect(result.current.checkConflict('node-1', 'u1')).toBe(false);
  });

  it('D4.4: checkConflict returns true when another user is editing', () => {
    mocks.mockGetEditor.mockReturnValue({ userId: 'u2', userName: 'bob', avatar: '', startedAt: Date.now() });
    const { result } = renderHook(() => useUndoRedoStore());
    expect(result.current.checkConflict('node-1', 'u1')).toBe(true);
  });

  it('D4.4: checkConflict returns false when owner is editing', () => {
    mocks.mockGetEditor.mockReturnValue({ userId: 'u1', userName: 'alice', avatar: '', startedAt: Date.now() });
    const { result } = renderHook(() => useUndoRedoStore());
    expect(result.current.checkConflict('node-1', 'u1')).toBe(false);
  });

  it('D4.4: showConflict opens dialog with user info', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    act(() => { result.current.showConflict('bob', 'u2', 'node-1'); });
    expect(result.current.conflictDialog.open).toBe(true);
    expect(result.current.conflictDialog.conflictingUserName).toBe('bob');
    expect(result.current.conflictDialog.nodeId).toBe('node-1');
  });

  it('D4.4: dismissConflict closes dialog', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    act(() => { result.current.showConflict('bob', 'u2', 'node-1'); });
    expect(result.current.conflictDialog.open).toBe(true);
    act(() => { result.current.dismissConflict(); });
    expect(result.current.conflictDialog.open).toBe(false);
  });

  it('D4.1: performUndo sets operator and calls canvasHistoryStore.undo', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    act(() => { result.current.performUndo('u1', 'alice', 'canvas-1'); });
    expect(result.current.currentOperator?.userName).toBe('alice');
    expect(result.current.currentOperator?.action).toBe('undo');
    expect(mocks.mockUndo).toHaveBeenCalledTimes(1);
  });

  it('D4.1: performRedo sets operator and calls canvasHistoryStore.redo', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    act(() => { result.current.performRedo('u1', 'alice', 'canvas-1'); });
    expect(result.current.currentOperator?.userName).toBe('alice');
    expect(result.current.currentOperator?.action).toBe('redo');
    expect(mocks.mockRedo).toHaveBeenCalledTimes(1);
  });

  it('initial state: currentOperator is null', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    expect(result.current.currentOperator).toBeNull();
  });

  it('initial state: conflictDialog is closed', () => {
    const { result } = renderHook(() => useUndoRedoStore());
    expect(result.current.conflictDialog.open).toBe(false);
  });

  it('D4.2: broadcastUndo called on performUndo', async () => {
    const { result } = renderHook(() => useUndoRedoStore());
    await act(async () => {
      result.current.performUndo('u1', 'alice', 'canvas-1');
    });
    expect(mocks.mockBroadcastUndo).toHaveBeenCalledWith(null, 'u1', 'alice', 'canvas-1');
  });

  it('D4.2: broadcastRedo called on performRedo', async () => {
    const { result } = renderHook(() => useUndoRedoStore());
    await act(async () => {
      result.current.performRedo('u2', 'bob', 'canvas-2');
    });
    expect(mocks.mockBroadcastRedo).toHaveBeenCalledWith(null, 'u2', 'bob', 'canvas-2');
  });
});
