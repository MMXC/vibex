/**
 * S80-E5: presenceStore — lastActiveAt / updateLastActive / isOnline tests
 * Verifies online/offline presence tracking per collaborator
 * Uses Zustand's getState() / setState() for unit testing
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { usePresenceStore } from '../presenceStore';

describe('presenceStore — S80-E5 Online Presence', () => {
  beforeEach(() => {
    // S80-E5: Reset store fields via setState
    usePresenceStore.setState({
      remoteUsers: new Map(),
      cursors: {},
      onlineUsers: [],
      focusedNodes: {},
      focusedNodeInfos: new Map(),
      editingNodeIds: new Map(),
      localEditing: new Map(),
      remoteEditing: new Map(),
      nodeLocks: new Map(),
      lastActiveAt: {},
    });
  });

  // S80-E5: updateLastActive sets timestamp
  it('updateLastActive sets lastActiveAt[userId] to current timestamp', () => {
    const before = Date.now();
    usePresenceStore.getState().updateLastActive('user-1');
    const after = Date.now();

    expect(usePresenceStore.getState().lastActiveAt['user-1']).toBeDefined();
    expect(usePresenceStore.getState().lastActiveAt['user-1']).toBeGreaterThanOrEqual(before);
    expect(usePresenceStore.getState().lastActiveAt['user-1']).toBeLessThanOrEqual(after);
  });

  // S80-E5: updateLastActive overwrites existing timestamp
  it('updateLastActive overwrites existing timestamp', () => {
    const state = usePresenceStore.getState();
    const updatedLastActive = { ...state.lastActiveAt, 'user-1': Date.now() - 10_000 };
    usePresenceStore.setState({ lastActiveAt: updatedLastActive });
    usePresenceStore.getState().updateLastActive('user-1');
    expect(usePresenceStore.getState().lastActiveAt['user-1']).toBeGreaterThan(Date.now() - 10_000);
  });

  // S80-E5: isOnline returns true for recent activity (< 5 min)
  it('isOnline returns true for recent activity (< 5 min)', () => {
    const state = usePresenceStore.getState();
    const updatedLastActive = { ...state.lastActiveAt, 'user-2': Date.now() - 60_000 };
    usePresenceStore.setState({ lastActiveAt: updatedLastActive });
    expect(usePresenceStore.getState().isOnline('user-2')).toBe(true);
  });

  it('isOnline returns true at exactly 4 minutes ago', () => {
    const state = usePresenceStore.getState();
    const updatedLastActive = { ...state.lastActiveAt, 'user-3': Date.now() - 4 * 60_000 };
    usePresenceStore.setState({ lastActiveAt: updatedLastActive });
    expect(usePresenceStore.getState().isOnline('user-3')).toBe(true);
  });

  // S80-E5: isOnline returns false for stale activity (>= 5 min)
  it('isOnline returns false at exactly 5 minutes ago', () => {
    const state = usePresenceStore.getState();
    const updatedLastActive = { ...state.lastActiveAt, 'user-4': Date.now() - 5 * 60_000 };
    usePresenceStore.setState({ lastActiveAt: updatedLastActive });
    expect(usePresenceStore.getState().isOnline('user-4')).toBe(false);
  });

  it('isOnline returns false for 10-minute-old activity', () => {
    const state = usePresenceStore.getState();
    const updatedLastActive = { ...state.lastActiveAt, 'user-5': Date.now() - 10 * 60_000 };
    usePresenceStore.setState({ lastActiveAt: updatedLastActive });
    expect(usePresenceStore.getState().isOnline('user-5')).toBe(false);
  });

  // S80-E5: isOnline returns false for unknown user
  it('isOnline returns false for unknown user (no lastActiveAt entry)', () => {
    expect(usePresenceStore.getState().isOnline('unknown-user')).toBe(false);
  });

  // S80-E5: clearAll resets lastActiveAt
  it('clearAll resets lastActiveAt to empty object', () => {
    usePresenceStore.setState({ lastActiveAt: { 'user-1': Date.now(), 'user-2': Date.now() } });
    usePresenceStore.getState().clearAll();
    expect(usePresenceStore.getState().lastActiveAt).toEqual({});
  });

  // S80-E5: removeUser cleans up lastActiveAt + remoteUsers entry
  it('removeUser deletes lastActiveAt and remoteUsers entry for that user', () => {
    const mockUser = { id: 'user-1', name: 'Alice', avatar: '#123', lastSeen: Date.now() };
    usePresenceStore.setState({
      lastActiveAt: { 'user-1': Date.now() },
      remoteUsers: new Map([['user-1', mockUser]]),
    });
    usePresenceStore.getState().removeUser('user-1');
    const newState = usePresenceStore.getState();
    expect(newState.lastActiveAt['user-1']).toBeUndefined();
    expect(newState.remoteUsers.has('user-1')).toBe(false);
  });

  // S80-E5: isOnline uses 5-minute threshold
  it('isOnline boundary: exactly 4m59s ago → online', () => {
    const state = usePresenceStore.getState();
    const updatedLastActive = { ...state.lastActiveAt, 'user-x': Date.now() - (5 * 60_000 - 1000) };
    usePresenceStore.setState({ lastActiveAt: updatedLastActive });
    expect(usePresenceStore.getState().isOnline('user-x')).toBe(true);
  });

  it('isOnline boundary: exactly 5m0s ago → offline', () => {
    const state = usePresenceStore.getState();
    const updatedLastActive = { ...state.lastActiveAt, 'user-y': Date.now() - (5 * 60_000) };
    usePresenceStore.setState({ lastActiveAt: updatedLastActive });
    expect(usePresenceStore.getState().isOnline('user-y')).toBe(false);
  });
});
