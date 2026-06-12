/**
 * presenceStore — S91-E3-F1/F2/F3: Intent broadcast, conflict detection, operation history
 *
 * 覆盖场景:
 * - E3-F1: broadcastIntent throttling (1 per second), updateRemoteIntent, getRemoteIntent
 * - E3-F2: nodeSelectionConflicts Map, addNodeConflict, clearNodeConflict, getNodeConflict
 * - E3-F3: operationHistory (FIFO, max 10), addOperation, clearOperationHistory
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresenceStore } from '../presenceStore';

// ─── Mock generateId ───────────────────────────────────────────────────────────
vi.mock('@/lib/canvas/id', () => ({
  generateId: vi.fn(() => `mock-id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
}

// ─── E3-F1: Intent Broadcast Tests ────────────────────────────────────────────
describe('presenceStore — E3-F1: Intent Broadcast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store
    act(() => {
      usePresenceStore.getState().clearAll();
      usePresenceStore.getState().clearOperationHistory();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should update remote user intent via updateRemoteIntent', () => {
    const userId = 'user-1';
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });

    // Add a remote user first
    act(() => {
      result.current.setRemoteUsers([
        { userId, name: 'Alice', avatar: '', lastSeen: Date.now() },
      ]);
    });

    // Update intent
    act(() => {
      result.current.updateRemoteIntent(userId, '编辑中');
    });

    expect(result.current.remoteUsers.get(userId)?.intent).toBe('编辑中');
    expect(result.current.remoteUsers.get(userId)?.intentUpdatedAt).toBeDefined();
  });

  it('should return undefined for non-existent user intent', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });
    expect(result.current.getRemoteIntent('nonexistent')).toBeUndefined();
  });

  it('should throttle intent broadcast to 1 per second', () => {
    const userId = 'user-1';
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });

    // Add a remote user
    act(() => {
      result.current.setRemoteUsers([
        { userId, name: 'Alice', avatar: '', lastSeen: Date.now() },
      ]);
    });

    // First broadcast should work
    act(() => {
      result.current.broadcastIntent(userId, '意图1');
    });
    expect(result.current.remoteUsers.get(userId)?.intent).toBe('意图1');

    // Advance time by 500ms — should still be throttled
    act(() => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      result.current.broadcastIntent(userId, '意图2');
    });
    // Should still be '意图1' because throttle hasn't elapsed
    expect(result.current.remoteUsers.get(userId)?.intent).toBe('意图1');

    // Advance by another 600ms (total 1100ms) — should now allow new intent
    act(() => {
      vi.advanceTimersByTime(600);
    });

    act(() => {
      result.current.broadcastIntent(userId, '意图2');
    });
    expect(result.current.remoteUsers.get(userId)?.intent).toBe('意图2');
  });
});

// ─── E3-F2: Node Selection Conflict Tests ─────────────────────────────────────
describe('presenceStore — E3-F2: Node Selection Conflict', () => {
  beforeEach(() => {
    act(() => {
      usePresenceStore.getState().clearAll();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add a node selection conflict', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });

    act(() => {
      result.current.addNodeConflict('node-1', 'user-2', 'Bob');
    });

    const conflict = result.current.getNodeConflict('node-1');
    expect(conflict).toBeDefined();
    expect(conflict?.userId).toBe('user-2');
    expect(conflict?.userName).toBe('Bob');
    expect(conflict?.targetId).toBe('node-1');
    expect(conflict?.lockedAt).toBeGreaterThan(0);
  });

  it('should clear a node selection conflict', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });

    act(() => {
      result.current.addNodeConflict('node-1', 'user-2', 'Bob');
    });
    expect(result.current.getNodeConflict('node-1')).toBeDefined();

    act(() => {
      result.current.clearNodeConflict('node-1');
    });
    expect(result.current.getNodeConflict('node-1')).toBeUndefined();
  });

  it('should return undefined for non-existent node conflict', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });
    expect(result.current.getNodeConflict('nonexistent')).toBeUndefined();
  });

  it('should overwrite existing conflict for same node', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });

    act(() => {
      result.current.addNodeConflict('node-1', 'user-2', 'Bob');
    });
    act(() => {
      result.current.addNodeConflict('node-1', 'user-3', 'Carol');
    });

    const conflict = result.current.getNodeConflict('node-1');
    expect(conflict?.userId).toBe('user-3');
    expect(conflict?.userName).toBe('Carol');
  });
});

// ─── E3-F3: Operation History Tests ───────────────────────────────────────────
describe('presenceStore — E3-F3: Operation History', () => {
  beforeEach(() => {
    act(() => {
      usePresenceStore.getState().clearOperationHistory();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add an operation to history', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });

    act(() => {
      result.current.addOperation({
        userId: 'user-1',
        userName: 'Alice',
        operationType: 'add',
        description: '添加了节点',
        targetId: 'node-1',
      });
    });

    const history = result.current.operationHistory;
    expect(history.length).toBe(1);
    expect(history[0]?.operationType).toBe('add');
    expect(history[0]?.description).toBe('添加了节点');
    expect(history[0]?.timestamp).toBeGreaterThan(0);
  });

  it('should keep maximum 10 operations (FIFO)', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });

    // Add 15 operations
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.addOperation({
          userId: `user-${i}`,
          userName: `User ${i}`,
          operationType: 'add',
          description: `操作 ${i}`,
          targetId: `node-${i}`,
        });
      });
    }

    const history = result.current.operationHistory;
    expect(history.length).toBe(10);
    // Newest first (FIFO — latest at position 0)
    expect(history[0]?.description).toBe('操作 14');
    expect(history[9]?.description).toBe('操作 5');
  });

  it('should clear operation history', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });

    act(() => {
      result.current.addOperation({
        userId: 'user-1',
        userName: 'Alice',
        operationType: 'delete',
        description: '删除了节点',
        targetId: 'node-1',
      });
    });

    expect(result.current.operationHistory.length).toBe(1);

    act(() => {
      result.current.clearOperationHistory();
    });

    expect(result.current.operationHistory.length).toBe(0);
  });

  it('should maintain correct timestamp on operations', () => {
    const { result } = renderHook(() => usePresenceStore((s) => s), { wrapper: createWrapper() });
    const before = Date.now();

    act(() => {
      result.current.addOperation({
        userId: 'user-1',
        userName: 'Alice',
        operationType: 'move',
        description: '移动了节点',
        targetId: 'node-1',
      });
    });

    const after = Date.now();
    const history = result.current.operationHistory;
    expect(history[0]?.timestamp).toBeGreaterThanOrEqual(before);
    expect(history[0]?.timestamp).toBeLessThanOrEqual(after);
  });
});
