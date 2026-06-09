/**
 * S80-E5: presenceStore — lastActiveAt / updateLastActive / isOnline tests
 * Verifies online/offline presence tracking per collaborator
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPresenceStore, type PresenceState } from '../presenceStore';

describe('presenceStore — S80-E5 Online Presence', () => {
  let store: ReturnType<typeof createPresenceStore>;

  beforeEach(() => {
    store = createPresenceStore();
  });

  // S80-E5: updateLastActive sets timestamp
  it('updateLastActive sets lastActiveAt[userId] to current timestamp', () => {
    const before = Date.now();
    store.updateLastActive('user-1');
    const after = Date.now();

    expect(store.lastActiveAt['user-1']).toBeDefined();
    expect(store.lastActiveAt['user-1']).toBeGreaterThanOrEqual(before);
    expect(store.lastActiveAt['user-1']).toBeLessThanOrEqual(after);
  });

  // S80-E5: updateLastActive overwrites existing timestamp
  it('updateLastActive overwrites existing timestamp', () => {
    store.lastActiveAt['user-1'] = Date.now() - 10_000;
    store.updateLastActive('user-1');
    expect(store.lastActiveAt['user-1']).toBeGreaterThan(Date.now() - 10_000);
  });

  // S80-E5: isOnline returns true for recent activity (< 5 min)
  it('isOnline returns true for recent activity (< OFFLINE_THRESHOLD_MS)', () => {
    store.lastActiveAt['user-2'] = Date.now() - 60_000; // 1 minute ago
    expect(store.isOnline('user-2')).toBe(true);
  });

  it('isOnline returns true at exactly 4 minutes ago', () => {
    store.lastActiveAt['user-3'] = Date.now() - 4 * 60_000;
    expect(store.isOnline('user-3')).toBe(true);
  });

  // S80-E5: isOnline returns false for stale activity (>= 5 min)
  it('isOnline returns false at exactly 5 minutes ago', () => {
    store.lastActiveAt['user-4'] = Date.now() - 5 * 60_000;
    expect(store.isOnline('user-4')).toBe(false);
  });

  it('isOnline returns false for 10-minute-old activity', () => {
    store.lastActiveAt['user-5'] = Date.now() - 10 * 60_000;
    expect(store.isOnline('user-5')).toBe(false);
  });

  // S80-E5: isOnline returns false for unknown user
  it('isOnline returns false for unknown user (no lastActiveAt entry)', () => {
    expect(store.isOnline('unknown-user')).toBe(false);
  });

  // S80-E5: clearAll resets lastActiveAt
  it('clearAll resets lastActiveAt to empty object', () => {
    store.lastActiveAt['user-1'] = Date.now();
    store.lastActiveAt['user-2'] = Date.now();
    store.clearAll();
    expect(store.lastActiveAt).toEqual({});
  });

  // S80-E5: removeUser cleans up lastActiveAt entry
  it('removeUser deletes lastActiveAt entry for that user', () => {
    store.lastActiveAt['user-1'] = Date.now();
    store.onlineUsers.add('user-1');
    store.removeUser('user-1');
    expect(store.lastActiveAt['user-1']).toBeUndefined();
    expect(store.onlineUsers.has('user-1')).toBe(false);
  });

  // S80-E5: OFFLINE_THRESHOLD_MS is 5 minutes
  it('OFFLINE_THRESHOLD_MS equals 5 minutes (300000ms)', () => {
    expect(store.OFFLINE_THRESHOLD_MS).toBe(5 * 60 * 1000);
  });
});
