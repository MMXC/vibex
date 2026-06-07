/**
 * activityStore vitest — S60-E3
 * Tests: activityStore actions, ring buffer, user status derivation
 * S74-E4: @mention notification closure tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useActivityStore, extractMentions } from '../activityStore';

// S74-E4: Mock notificationStore so both activityStore and test share the same instance
const mockNotifications: any[] = [];
const mockAddNotification = vi.fn((data: any) => {
  const notif = { ...data, id: `mock-${Date.now()}`, isRead: false };
  mockNotifications.push(notif);
  return notif;
});
const mockClearAll = vi.fn(() => { mockNotifications.length = 0; });

vi.mock('@/stores/notificationStore', () => ({
  notificationStore: {
    getState: () => ({
      notifications: mockNotifications,
      addNotification: mockAddNotification,
      clearAll: mockClearAll,
    }),
  },
  useNotificationStore: {
    getState: () => ({
      notifications: mockNotifications,
      addNotification: mockAddNotification,
      clearAll: mockClearAll,
    }),
  },
}));

describe('activityStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useActivityStore.setState({ entries: [], recentActivity: [], userStatuses: {} });
    // S74-E4: clear module-level dedup cache
    useActivityStore.getState().__clearSeenMentions?.();
    // S74-E4: reset notificationStore mocks
    mockNotifications.length = 0;
    mockAddNotification.mockClear();
    mockClearAll.mockClear();
  });

  describe('addEntries', () => {
    it('adds entries and sorts by timestamp descending', () => {
      const entries = [
        { id: '1', userId: 'u1', userName: 'Alice', type: 'join', timestamp: 1000 },
        { id: '2', userId: 'u2', userName: 'Bob', type: 'edit', timestamp: 2000 },
      ];
      useActivityStore.getState().addEntries(entries);

      const state = useActivityStore.getState();
      expect(state.entries).toHaveLength(2);
      expect(state.entries[0]!.id).toBe('2'); // newest first
      expect(state.entries[1]!.id).toBe('1');
    });

    it('keeps at most 20 entries (ring buffer, E2: extended from 5)', () => {
      const entries = Array.from({ length: 8 }, (_, i) => ({
        id: `e${i}`,
        userId: `u${i}`,
        userName: `User${i}`,
        type: 'edit' as const,
        timestamp: (i + 1) * 1000,
      }));
      useActivityStore.getState().addEntries(entries);

      const state = useActivityStore.getState();
      expect(state.entries).toHaveLength(8);
      // All 8 fit in max 20 buffer: newest first
      expect(state.entries[0]!.id).toBe('e7');
      expect(state.entries[7]!.id).toBe('e0');
    });
  });

  describe('recentActivity sync', () => {
    it('recentActivity stays in sync with entries after addEntry', () => {
      useActivityStore.getState().addEntry({
        userId: 'u1', userName: 'Alice', type: 'join', timestamp: Date.now(),
      });
      const state = useActivityStore.getState();
      expect(state.recentActivity).toHaveLength(1);
      expect(state.recentActivity[0]!.userId).toBe('u1');
    });

    it('recentActivity stays in sync with entries after addEntries', () => {
      const entries = Array.from({ length: 5 }, (_, i) => ({
        id: `sync${i}`,
        userId: `u${i}`,
        userName: `User${i}`,
        type: 'edit' as const,
        timestamp: Date.now() + i * 1000,
      }));
      useActivityStore.getState().addEntries(entries);
      const state = useActivityStore.getState();
      expect(state.recentActivity).toHaveLength(5);
      expect(state.entries).toEqual(state.recentActivity);
    });
  });

  describe('addEntry', () => {
    it('adds single entry with generated id', () => {
      useActivityStore.getState().addEntry({
        userId: 'u1',
        userName: 'Alice',
        type: 'join',
        timestamp: Date.now(),
      });
      expect(useActivityStore.getState().entries).toHaveLength(1);
      expect(useActivityStore.getState().entries[0]!.id).toBeTruthy();
    });
  });

  describe('updateUserStatus', () => {
    it('stores user status with lastSeen timestamp', () => {
      const now = Date.now();
      useActivityStore.getState().updateUserStatus('u1', 'Alice', now);

      const status = useActivityStore.getState().userStatuses['u1'];
      expect(status).toBeDefined();
      expect(status!.userName).toBe('Alice');
      expect(status!.lastSeen).toBe(now);
    });
  });

  describe('getUserStatus', () => {
    it('returns online when lastSeen < 60s', () => {
      const now = Date.now();
      useActivityStore.getState().updateUserStatus('u1', 'Alice', now);
      expect(useActivityStore.getState().getUserStatus('u1')).toBe('online');
    });

    it('returns idle when lastSeen 60s–5min', () => {
      const sixtySecAgo = Date.now() - 90_000; // 90 seconds ago
      useActivityStore.getState().updateUserStatus('u1', 'Alice', sixtySecAgo);
      expect(useActivityStore.getState().getUserStatus('u1')).toBe('idle');
    });

    it('returns offline when lastSeen > 5min', () => {
      const fiveMinAgo = Date.now() - 6 * 60_000; // 6 minutes ago
      useActivityStore.getState().updateUserStatus('u1', 'Alice', fiveMinAgo);
      expect(useActivityStore.getState().getUserStatus('u1')).toBe('offline');
    });

    it('returns offline for unknown user', () => {
      expect(useActivityStore.getState().getUserStatus('unknown')).toBe('offline');
    });
  });

  describe('getRecentEntries', () => {
    it('returns entries sorted newest-first', () => {
      useActivityStore.getState().addEntries([
        { id: 'a', userId: 'u1', userName: 'Alice', type: 'join', timestamp: 1000 },
        { id: 'b', userId: 'u2', userName: 'Bob', type: 'edit', timestamp: 3000 },
        { id: 'c', userId: 'u3', userName: 'Carol', type: 'leave', timestamp: 2000 },
      ]);
      const recent = useActivityStore.getState().getRecentEntries();
      expect(recent[0]!.id).toBe('b');
      expect(recent[1]!.id).toBe('c');
      expect(recent[2]!.id).toBe('a');
    });

    it('respects limit parameter', () => {
      useActivityStore.getState().addEntries([
        { id: 'a', userId: 'u1', userName: 'Alice', type: 'join', timestamp: 1000 },
        { id: 'b', userId: 'u2', userName: 'Bob', type: 'edit', timestamp: 3000 },
        { id: 'c', userId: 'u3', userName: 'Carol', type: 'leave', timestamp: 2000 },
      ]);
      const recent = useActivityStore.getState().getRecentEntries(2);
      expect(recent).toHaveLength(2);
    });
  });

  describe('clearEntries', () => {
    it('clears all entries', () => {
      useActivityStore.getState().addEntries([
        { id: '1', userId: 'u1', userName: 'Alice', type: 'join', timestamp: 1000 },
      ]);
      useActivityStore.getState().clearEntries();
      expect(useActivityStore.getState().entries).toHaveLength(0);
    });
  });

  // =========================================================
  // S74-E4: @mention 通知闭环测试
  // =========================================================
  describe('extractMentions (E4)', () => {
    it('extracts a single @mention from message', () => {
      const result = extractMentions('Hello @alice how are you?');
      expect(result).toEqual(['alice']);
    });

    it('extracts multiple @mentions from message', () => {
      const result = extractMentions('Hey @alice and @bob check this out');
      expect(result).toEqual(['alice', 'bob']);
    });

    it('returns empty array when no @mentions present', () => {
      const result = extractMentions('Just a regular message');
      expect(result).toEqual([]);
    });

    it('deduplicates repeated @mentions in same message', () => {
      const result = extractMentions('Hi @alice and @alice again');
      expect(result).toEqual(['alice']);
    });

    it('skips self-mention (sender === target)', () => {
      mockAddNotification.mockClear();
      useActivityStore.getState().addEntry({
        userId: 'u1',
        userName: 'alice', // same as mention target
        type: 'edit',
        timestamp: Date.now(),
        message: 'Talking to myself @alice',
        canvasId: 'canvas-1',
      });
      // Should NOT have called addNotification
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('addEntry with message calls notificationStore', () => {
      mockAddNotification.mockClear();
      useActivityStore.getState().addEntry({
        userId: 'u1',
        userName: 'Bob',
        type: 'edit',
        timestamp: Date.now(),
        message: 'Hey @alice look at this',
        canvasId: 'canvas-1',
      });
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mention',
          targetUserId: 'alice',
          senderName: 'Bob',
          canvasId: 'canvas-1',
        }),
      );
    });

    it('addEntry without message does NOT call notificationStore', () => {
      mockAddNotification.mockClear();
      useActivityStore.getState().addEntry({
        userId: 'u1',
        userName: 'Alice',
        type: 'join',
        timestamp: Date.now(),
        // No message field
      });
      expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('duplicate @mention same sender+target+canvas only notifies once', () => {
      mockAddNotification.mockClear();
      // First mention
      useActivityStore.getState().addEntry({
        userId: 'u1',
        userName: 'Bob',
        type: 'edit',
        timestamp: Date.now(),
        message: 'Hey @alice first mention',
        canvasId: 'canvas-1',
      });
      // Duplicate mention (same sender+target+canvas)
      useActivityStore.getState().addEntry({
        userId: 'u1',
        userName: 'Bob',
        type: 'edit',
        timestamp: Date.now(),
        message: 'Hey @alice duplicate mention',
        canvasId: 'canvas-1',
      });
      // Should only have called addNotification once
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
    });
  });
});
