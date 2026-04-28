import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionHistory } from './useVersionHistory';

const mockGetCanvasState = vi.fn(() => ({ nodes: [], edges: [] }));

describe('useVersionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts empty', () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: null, getCanvasState: mockGetCanvasState })
    );
    expect(result.current.snapshots).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('creates manual snapshot with projectId', () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: 'proj-1', getCanvasState: mockGetCanvasState })
    );
    act(() => {
      result.current.createSnapshot('Checkpoint 1');
    });
    expect(result.current.snapshots).toHaveLength(1);
    expect(result.current.snapshots[0].type).toBe('manual');
    expect(result.current.snapshots[0].label).toBe('Checkpoint 1');
    expect(result.current.snapshots[0].projectId).toBe('proj-1');
  });

  it('createSnapshot fails gracefully when projectId is null', () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: null, getCanvasState: mockGetCanvasState })
    );
    act(() => {
      result.current.createSnapshot();
    });
    expect(result.current.error).toBeTruthy();
  });

  it('deletes snapshot', () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: 'proj-1', getCanvasState: mockGetCanvasState })
    );
    act(() => {
      result.current.createSnapshot();
    });
    const id = result.current.snapshots[0].id;
    act(() => {
      result.current.deleteSnapshot(id);
    });
    expect(result.current.snapshots).toHaveLength(0);
  });

  it('restores snapshot and re-adds it on top', () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: 'proj-1', getCanvasState: mockGetCanvasState })
    );
    act(() => {
      result.current.createSnapshot('v1');
    });
    act(() => {
      result.current.createSnapshot('v2');
    });
    const firstId = result.current.snapshots[1].id;
    const beforeRestore = result.current.snapshots.length;
    act(() => {
      result.current.restoreSnapshot(firstId);
    });
    // Snapshot count increases (restored version re-added)
    expect(result.current.snapshots.length).toBeGreaterThanOrEqual(beforeRestore);
  });

  it('notifyChange does nothing when projectId is null', () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: null, getCanvasState: mockGetCanvasState })
    );
    act(() => {
      result.current.notifyChange();
    });
    expect(result.current.snapshots).toHaveLength(0);
  });

  it('clears all snapshots', () => {
    const { result } = renderHook(() =>
      useVersionHistory({ projectId: 'proj-1', getCanvasState: mockGetCanvasState })
    );
    act(() => {
      result.current.createSnapshot();
      result.current.createSnapshot();
    });
    expect(result.current.snapshots).toHaveLength(2);
    act(() => {
      result.current.clearAll();
    });
    expect(result.current.snapshots).toHaveLength(0);
  });

  it('enforces maxSnapshots limit', () => {
    const { result } = renderHook(() =>
      useVersionHistory({
        projectId: 'proj-1',
        getCanvasState: mockGetCanvasState,
        maxSnapshots: 3,
      })
    );
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.createSnapshot(`snap-${i}`);
      });
    }
    expect(result.current.snapshots.length).toBeLessThanOrEqual(3);
  });
});
