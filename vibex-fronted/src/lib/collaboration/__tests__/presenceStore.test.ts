/**
 * presenceStore.test.ts — S42-P002-E2
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { usePresenceStore } from '../presenceStore';
import type { CollabUser } from '../types';

describe('presenceStore', () => {
  beforeEach(() => {
    usePresenceStore.getState().clearAll();
  });

  it('setRemoteUsers replaces all remote users', () => {
    const users: CollabUser[] = [
      { userId: 'u1', name: 'Alice', avatar: 'A' },
      { userId: 'u2', name: 'Bob', avatar: 'B' },
    ];
    usePresenceStore.getState().setRemoteUsers(users);
    const remoteUsers = usePresenceStore.getState().remoteUsers;
    expect(remoteUsers.size).toBe(2);
    expect(remoteUsers.get('u1')!.name).toBe('Alice');
    expect(remoteUsers.get('u2')!.name).toBe('Bob');
  });

  it('updateCursor updates a single users position', () => {
    usePresenceStore.getState().setRemoteUsers([
      { userId: 'u1', name: 'Alice', avatar: 'A' },
    ]);
    usePresenceStore.getState().updateCursor('u1', 120, 340);
    const user = usePresenceStore.getState().remoteUsers.get('u1');
    expect(user!.cursorX).toBe(120);
    expect(user!.cursorY).toBe(340);
  });

  it('removeUser removes a user', () => {
    usePresenceStore.getState().setRemoteUsers([
      { userId: 'u1', name: 'Alice', avatar: 'A' },
      { userId: 'u2', name: 'Bob', avatar: 'B' },
    ]);
    usePresenceStore.getState().removeUser('u1');
    const remoteUsers = usePresenceStore.getState().remoteUsers;
    expect(remoteUsers.size).toBe(1);
    expect(remoteUsers.has('u1')).toBe(false);
    expect(remoteUsers.get('u2')!.name).toBe('Bob');
  });

  it('clearAll removes all users', () => {
    usePresenceStore.getState().setRemoteUsers([
      { userId: 'u1', name: 'Alice', avatar: 'A' },
    ]);
    usePresenceStore.getState().clearAll();
    expect(usePresenceStore.getState().remoteUsers.size).toBe(0);
  });
});
