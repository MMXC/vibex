/**
 * canvasAccessHistoryStore — S89-E1 测试
 * 验证画布访问历史记录的存储和查询
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasAccessHistoryStore } from '../canvasAccessHistoryStore';

describe('canvasAccessHistoryStore', () => {
  beforeEach(() => {
    // Reset store state
    useCanvasAccessHistoryStore.setState({ history: {} });
  });

  describe('recordAccess', () => {
    it('records first access for a canvas', () => {
      useCanvasAccessHistoryStore.getState().recordAccess('c1', {
        userId: 'u1',
        userName: 'Alice',
      });
      const accessors = useCanvasAccessHistoryStore.getState().getRecentAccessors('c1');
      expect(accessors).toHaveLength(1);
      expect(accessors[0].userId).toBe('u1');
      expect(accessors[0].userName).toBe('Alice');
    });

    it('updates timestamp when same user accesses again', () => {
      useCanvasAccessHistoryStore.getState().recordAccess('c1', {
        userId: 'u1',
        userName: 'Alice',
      });
      const first = useCanvasAccessHistoryStore.getState().getRecentAccessors('c1')[0].accessedAt;
      // Wait a tiny bit
      const now = new Date().toISOString();
      useCanvasAccessHistoryStore.getState().recordAccess('c1', {
        userId: 'u1',
        userName: 'Alice',
      });
      const second = useCanvasAccessHistoryStore.getState().getRecentAccessors('c1')[0].accessedAt;
      expect(second).not.toBe(first);
    });

    it('limits to MAX_RECORDS (5) entries', () => {
      const users = Array.from({ length: 7 }, (_, i) => ({
        userId: `u${i}`,
        userName: `User ${i}`,
      }));
      users.forEach((u) =>
        useCanvasAccessHistoryStore.getState().recordAccess('c1', u)
      );
      const accessors = useCanvasAccessHistoryStore.getState().getRecentAccessors('c1');
      expect(accessors).toHaveLength(5);
      expect(accessors[0].userId).toBe('u6'); // Most recent first
      expect(accessors[4].userId).toBe('u2');
    });

    it('stores avatarUrl when provided', () => {
      useCanvasAccessHistoryStore.getState().recordAccess('c1', {
        userId: 'u1',
        userName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
      });
      const accessors = useCanvasAccessHistoryStore.getState().getRecentAccessors('c1');
      expect(accessors[0].avatarUrl).toBe('https://example.com/alice.jpg');
    });
  });

  describe('getRecentAccessors', () => {
    it('returns empty array for unknown canvas', () => {
      const accessors = useCanvasAccessHistoryStore.getState().getRecentAccessors('unknown');
      expect(accessors).toHaveLength(0);
    });

    it('respects custom limit', () => {
      for (let i = 0; i < 5; i++) {
        useCanvasAccessHistoryStore.getState().recordAccess('c1', {
          userId: `u${i}`,
          userName: `User ${i}`,
        });
      }
      const accessors = useCanvasAccessHistoryStore.getState().getRecentAccessors('c1', 2);
      expect(accessors).toHaveLength(2);
    });
  });

  describe('getHistory', () => {
    it('returns null for unknown canvas', () => {
      const hist = useCanvasAccessHistoryStore.getState().getHistory('unknown');
      expect(hist).toBeNull();
    });

    it('returns full history record', () => {
      useCanvasAccessHistoryStore.getState().recordAccess('c1', {
        userId: 'u1',
        userName: 'Alice',
      });
      const hist = useCanvasAccessHistoryStore.getState().getHistory('c1');
      expect(hist).not.toBeNull();
      expect(hist!.canvasId).toBe('c1');
      expect(hist!.records).toHaveLength(1);
    });
  });

  describe('clearHistory', () => {
    it('removes all history for a canvas', () => {
      useCanvasAccessHistoryStore.getState().recordAccess('c1', {
        userId: 'u1',
        userName: 'Alice',
      });
      useCanvasAccessHistoryStore.getState().clearHistory('c1');
      expect(useCanvasAccessHistoryStore.getState().getHistory('c1')).toBeNull();
    });
  });
});
