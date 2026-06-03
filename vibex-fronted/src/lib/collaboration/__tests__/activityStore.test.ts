/**
 * activityStore vitest — S60-E3
 * Tests: activityStore actions, ring buffer, user status derivation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useActivityStore } from '../activityStore';

describe('activityStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useActivityStore.setState({ entries: [], userStatuses: {} });
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

    it('keeps at most 5 entries (ring buffer)', () => {
      const entries = Array.from({ length: 8 }, (_, i) => ({
        id: `e${i}`,
        userId: `u${i}`,
        userName: `User${i}`,
        type: 'edit' as const,
        timestamp: (i + 1) * 1000,
      }));
      useActivityStore.getState().addEntries(entries);

      const state = useActivityStore.getState();
      expect(state.entries).toHaveLength(5);
      // Newest 5 (timestamps 8→4): e7, e6, e5, e4, e3
      expect(state.entries[0]!.id).toBe('e7');
      expect(state.entries[4]!.id).toBe('e3');
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
});
