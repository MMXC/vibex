/**
 * presenceStore.test.ts — S42-P002-E2 + S44-P003-E3 + S52-E1 + S62-E1 + S63-E1 + S64-E1 + S65-E2
 * Tests: cursor sync (S42) + node locking (S44) + S52 presence awareness
 * + S62-E1: editingNodeIds editing lock state transitions
 * + S63-E1: cursor tracking + removeCursor
 * + S64-E1: onlineUsers + heartbeat + removeStaleUsers
 * + S65-E2: node focus awareness — focusedNodes + focusedNodeInfos + WS message handlers
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { usePresenceStore } from '../presenceStore';
import type { CollabUser } from '../types';

describe('presenceStore', () => {
  beforeEach(() => {
    usePresenceStore.getState().clearAll();
  });

  // === S42: Cursor Sync ===

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

  // === S44: Node Locking ===

  it('lockNode adds node to lockedNodes', () => {
    usePresenceStore.getState().lockNode('node-1', 'u1');
    expect(usePresenceStore.getState().lockedNodes['node-1']).toBe('u1');
  });

  it('unlockNode removes node from lockedNodes', () => {
    usePresenceStore.getState().lockNode('node-1', 'u1');
    usePresenceStore.getState().unlockNode('node-1');
    expect('node-1' in usePresenceStore.getState().lockedNodes).toBe(false);
  });

  it('isLocked returns true for locked node, false for unlocked', () => {
    expect(usePresenceStore.getState().isLocked('node-1')).toBe(false);
    usePresenceStore.getState().lockNode('node-1', 'u1');
    expect(usePresenceStore.getState().isLocked('node-1')).toBe(true);
    usePresenceStore.getState().unlockNode('node-1');
    expect(usePresenceStore.getState().isLocked('node-1')).toBe(false);
  });

  it('handleNodeLockedMessage updates lockedNodes from WebSocket', () => {
    usePresenceStore.getState().handleNodeLockedMessage('node-2', 'u2');
    expect(usePresenceStore.getState().lockedNodes['node-2']).toBe('u2');
    expect(usePresenceStore.getState().isLocked('node-2')).toBe(true);
  });

  it('handleNodeUnlockedMessage removes lock from WebSocket', () => {
    usePresenceStore.getState().lockNode('node-3', 'u3');
    usePresenceStore.getState().handleNodeUnlockedMessage('node-3');
    expect('node-3' in usePresenceStore.getState().lockedNodes).toBe(false);
  });

  // === S52: Presence awareness ===

  it('setRemoteUsers replaces the entire remote users map', () => {
    const initialUsers: CollabUser[] = [
      { userId: 'u1', name: 'Alice', avatar: 'A' },
    ];
    usePresenceStore.getState().setRemoteUsers(initialUsers);
    expect(usePresenceStore.getState().remoteUsers.size).toBe(1);
    expect(usePresenceStore.getState().remoteUsers.has('u1')).toBe(true);

    const newUsers: CollabUser[] = [
      { userId: 'u2', name: 'Bob', avatar: 'B' },
      { userId: 'u3', name: 'Carol', avatar: 'C' },
    ];
    usePresenceStore.getState().setRemoteUsers(newUsers);
    const remoteUsers = usePresenceStore.getState().remoteUsers;
    expect(remoteUsers.size).toBe(2);
    expect(remoteUsers.has('u1')).toBe(false); // u1 was replaced
    expect(remoteUsers.get('u2')!.name).toBe('Bob');
    expect(remoteUsers.get('u3')!.name).toBe('Carol');
  });

  // === S62-E1: Editing Node Lock ===

  it('startEditing adds node to editingNodeIds', () => {
    usePresenceStore.getState().startEditing('node-1', 'u1', 'Alice', 'A');
    const state = usePresenceStore.getState();
    expect(state.editingNodeIds.has('node-1')).toBe(true);
    const info = state.editingNodeIds.get('node-1')!;
    expect(info.userId).toBe('u1');
    expect(info.userName).toBe('Alice');
    expect(info.avatar).toBe('A');
    expect(info.startedAt).toBeGreaterThan(0);
  });

  it('endEditing removes node from editingNodeIds', () => {
    usePresenceStore.getState().startEditing('node-1', 'u1', 'Alice', 'A');
    usePresenceStore.getState().endEditing('node-1');
    expect(usePresenceStore.getState().editingNodeIds.has('node-1')).toBe(false);
  });

  it('endEditingByUser removes all nodes edited by that user', () => {
    usePresenceStore.getState().startEditing('node-1', 'u1', 'Alice', 'A');
    usePresenceStore.getState().startEditing('node-2', 'u1', 'Alice', 'A');
    usePresenceStore.getState().startEditing('node-3', 'u2', 'Bob', 'B');
    usePresenceStore.getState().endEditingByUser('u1');
    const map = usePresenceStore.getState().editingNodeIds;
    expect(map.has('node-1')).toBe(false);
    expect(map.has('node-2')).toBe(false);
    expect(map.has('node-3')).toBe(true); // u2's node remains
    expect(map.get('node-3')!.userId).toBe('u2');
  });

  it('isBeingEdited returns true when node is in editingNodeIds', () => {
    expect(usePresenceStore.getState().isBeingEdited('node-1')).toBe(false);
    usePresenceStore.getState().startEditing('node-1', 'u1', 'Alice', 'A');
    expect(usePresenceStore.getState().isBeingEdited('node-1')).toBe(true);
    usePresenceStore.getState().endEditing('node-1');
    expect(usePresenceStore.getState().isBeingEdited('node-1')).toBe(false);
  });

  it('getEditor returns editor info for a node', () => {
    expect(usePresenceStore.getState().getEditor('node-1')).toBeUndefined();
    usePresenceStore.getState().startEditing('node-1', 'u1', 'Alice', 'A');
    const info = usePresenceStore.getState().getEditor('node-1');
    expect(info?.userId).toBe('u1');
    expect(info?.userName).toBe('Alice');
    expect(info?.avatar).toBe('A');
  });

  it('handleEditingStartedMessage adds remote editing without overwriting self', () => {
    // Self already editing
    usePresenceStore.getState().startEditing('node-1', 'self-u1', 'Self', 'S');
    // Remote signal for same node (another tab or device)
    usePresenceStore.getState().handleEditingStartedMessage('node-1', 'self-u1', 'Self', 'S');
    // Self should NOT be overwritten
    const info = usePresenceStore.getState().editingNodeIds.get('node-1')!;
    expect(info.userId).toBe('self-u1');

    // Different user editing same node
    usePresenceStore.getState().handleEditingStartedMessage('node-1', 'u2', 'Bob', 'B');
    const info2 = usePresenceStore.getState().editingNodeIds.get('node-1')!;
    // Overwrites since different user
    expect(info2.userId).toBe('u2');
  });

  it('handleEditingEndedMessage removes remote editing', () => {
    usePresenceStore.getState().handleEditingStartedMessage('node-1', 'u2', 'Bob', 'B');
    expect(usePresenceStore.getState().isBeingEdited('node-1')).toBe(true);
    usePresenceStore.getState().handleEditingEndedMessage('node-1');
    expect(usePresenceStore.getState().isBeingEdited('node-1')).toBe(false);
  });

  it('clearAll also clears editingNodeIds', () => {
    usePresenceStore.getState().startEditing('node-1', 'u1', 'Alice', 'A');
    usePresenceStore.getState().clearAll();
    expect(usePresenceStore.getState().editingNodeIds.size).toBe(0);
  });

  // === Conflict Resolution: start → end → conflict → resolve ===

  it('start → end → conflict → resolve: full editing lifecycle', () => {
    const state = usePresenceStore.getState();

    // Alice starts editing node-1
    state.startEditing('node-1', 'u1', 'Alice', 'A');
    expect(state.isBeingEdited('node-1')).toBe(true);
    expect(state.getEditor('node-1')?.userName).toBe('Alice');

    // Alice stops editing
    state.endEditing('node-1');
    expect(state.isBeingEdited('node-1')).toBe(false);
    expect(state.getEditor('node-1')).toBeUndefined();

    // Bob starts editing node-1 (no conflict since node is free)
    state.startEditing('node-1', 'u2', 'Bob', 'B');
    expect(state.isBeingEdited('node-1')).toBe(true);
    expect(state.getEditor('node-1')?.userName).toBe('Bob');

    // Remote conflict: Alice also editing (handleEditingStartedMessage overwrites Bob's entry)
    state.handleEditingStartedMessage('node-1', 'u1', 'Alice', 'A');
    // Alice becomes editor, overwrites Bob
    expect(state.getEditor('node-1')?.userId).toBe('u1');

    // Bob resolves: ends his editing (unconditional — removes node from editingNodeIds)
    state.endEditing('node-1');
    expect(state.isBeingEdited('node-1')).toBe(false);
    expect(state.getEditor('node-1')).toBeUndefined();

    // Alice finally resolves: no-op since node already removed
    state.endEditing('node-1');
    expect(state.isBeingEdited('node-1')).toBe(false);
  });

  // === S63-E1: Real-time Cursor Tracking ===

  it('updateCursor replaces previous cursor position', () => {
    usePresenceStore.getState().setRemoteUsers([
      { userId: 'u1', name: 'Alice', avatar: 'A' },
    ]);
    // Set initial position
    usePresenceStore.getState().updateCursor('u1', 100, 200);
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.cursorX).toBe(100);
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.cursorY).toBe(200);

    // Move cursor
    usePresenceStore.getState().updateCursor('u1', 300, 400);
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.cursorX).toBe(300);
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.cursorY).toBe(400);
    // User still present
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.name).toBe('Alice');
  });

  it('removeCursor clears cursor position but keeps user', () => {
    usePresenceStore.getState().setRemoteUsers([
      { userId: 'u1', name: 'Alice', avatar: 'A' },
    ]);
    usePresenceStore.getState().updateCursor('u1', 100, 200);
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.cursorX).toBe(100);

    // Remove cursor — user stays
    usePresenceStore.getState().removeCursor('u1');
    expect(usePresenceStore.getState().remoteUsers.has('u1')).toBe(true);
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.name).toBe('Alice');
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.cursorX).toBeUndefined();
    expect(usePresenceStore.getState().remoteUsers.get('u1')!.cursorY).toBeUndefined();
  });

  it('removeCursor on non-existent user is a no-op', () => {
    usePresenceStore.getState().setRemoteUsers([
      { userId: 'u1', name: 'Alice', avatar: 'A' },
    ]);
    // Should not throw
    expect(() => usePresenceStore.getState().removeCursor('non-existent')).not.toThrow();
    // u1 still present
    expect(usePresenceStore.getState().remoteUsers.has('u1')).toBe(true);
  });

  it('remoteCursors Map reflects updateCursor + removeCursor lifecycle', () => {
    usePresenceStore.getState().setRemoteUsers([
      { userId: 'user-2', name: 'Bob', avatar: 'B' },
    ]);
    // Initially no cursor
    expect(usePresenceStore.getState().remoteUsers.get('user-2')!.cursorX).toBeUndefined();

    // Bob moves cursor — re-fetch state after set() mutation
    usePresenceStore.getState().updateCursor('user-2', 500, 600);
    expect(usePresenceStore.getState().remoteUsers.get('user-2')!.cursorX).toBe(500);
    expect(usePresenceStore.getState().remoteUsers.get('user-2')!.cursorY).toBe(600);

    // Bob stops moving (cursor goes out of viewport)
    usePresenceStore.getState().removeCursor('user-2');
    expect(usePresenceStore.getState().remoteUsers.get('user-2')!.cursorX).toBeUndefined();
    expect(usePresenceStore.getState().remoteUsers.get('user-2')!.cursorY).toBeUndefined();
    // User still tracked (for editing/locking)
    expect(usePresenceStore.getState().remoteUsers.has('user-2')).toBe(true);
  });

  // === S64-E1: Online Users + Presence Heartbeat ===

  it('updateOnlineUsers adds a new online user', () => {
    usePresenceStore.getState().updateOnlineUsers('u1', 'online', 'Alice', 'A');
    const users = usePresenceStore.getState().onlineUsers;
    expect(users).toHaveLength(1);
    expect(users[0].userId).toBe('u1');
    expect(users[0].name).toBe('Alice');
    expect(users[0].avatar).toBe('A');
    expect(users[0].status).toBe('online');
    expect(users[0].lastSeen).toBeGreaterThan(0);
  });

  it('updateOnlineUsers updates an existing user', () => {
    usePresenceStore.getState().updateOnlineUsers('u1', 'online', 'Alice', 'A');
    const originalLastSeen = usePresenceStore.getState().onlineUsers[0].lastSeen;

    // Wait a bit and update
    usePresenceStore.getState().updateOnlineUsers('u1', 'idle', 'Alice', 'A');
    expect(usePresenceStore.getState().onlineUsers).toHaveLength(1); // not a new entry
    expect(usePresenceStore.getState().onlineUsers[0].status).toBe('idle');
    expect(usePresenceStore.getState().onlineUsers[0].lastSeen).toBeGreaterThanOrEqual(originalLastSeen);
  });

  it('updateOnlineUsers allows status transition online → idle → offline', () => {
    usePresenceStore.getState().updateOnlineUsers('u1', 'online', 'Alice', 'A');
    expect(usePresenceStore.getState().onlineUsers[0].status).toBe('online');

    usePresenceStore.getState().updateOnlineUsers('u1', 'idle', 'Alice', 'A');
    expect(usePresenceStore.getState().onlineUsers[0].status).toBe('idle');

    usePresenceStore.getState().updateOnlineUsers('u1', 'offline', 'Alice', 'A');
    expect(usePresenceStore.getState().onlineUsers[0].status).toBe('offline');
  });

  it('updateOnlineUsers updates name and avatar for existing user', () => {
    usePresenceStore.getState().updateOnlineUsers('u1', 'online', 'Alice', 'A');

    // Update name/avatar
    usePresenceStore.getState().updateOnlineUsers('u1', 'online', 'Alice Updated', 'AVATAR_URL');
    const users = usePresenceStore.getState().onlineUsers;
    expect(users[0].name).toBe('Alice Updated');
    expect(users[0].avatar).toBe('AVATAR_URL');
  });

  it('removeStaleUsers removes users with lastSeen > 30s ago', () => {
    const state = usePresenceStore.getState();
    // Add a stale user (simulate by manipulating lastSeen directly)
    usePresenceStore.setState({
      onlineUsers: [
        { userId: 'u1', name: 'Alice', avatar: 'A', status: 'online', lastSeen: Date.now() - 35_000 },
        { userId: 'u2', name: 'Bob', avatar: 'B', status: 'online', lastSeen: Date.now() },
      ],
    });

    expect(usePresenceStore.getState().onlineUsers).toHaveLength(2);
    usePresenceStore.getState().removeStaleUsers();
    const remaining = usePresenceStore.getState().onlineUsers;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].userId).toBe('u2');
  });

  it('removeStaleUsers keeps users with recent heartbeat', () => {
    const state = usePresenceStore.getState();
    usePresenceStore.setState({
      onlineUsers: [
        { userId: 'u1', name: 'Alice', avatar: 'A', status: 'online', lastSeen: Date.now() },
        { userId: 'u2', name: 'Bob', avatar: 'B', status: 'online', lastSeen: Date.now() - 10_000 },
      ],
    });

    usePresenceStore.getState().removeStaleUsers();
    expect(usePresenceStore.getState().onlineUsers).toHaveLength(2); // both within 30s
  });

  it('clearOnlineUsers removes all online users', () => {
    usePresenceStore.getState().updateOnlineUsers('u1', 'online', 'Alice', 'A');
    usePresenceStore.getState().updateOnlineUsers('u2', 'idle', 'Bob', 'B');
    expect(usePresenceStore.getState().onlineUsers).toHaveLength(2);

    usePresenceStore.getState().clearOnlineUsers();
    expect(usePresenceStore.getState().onlineUsers).toHaveLength(0);
  });

  it('clearAll also clears onlineUsers', () => {
    usePresenceStore.getState().updateOnlineUsers('u1', 'online', 'Alice', 'A');
    expect(usePresenceStore.getState().onlineUsers).toHaveLength(1);

    usePresenceStore.getState().clearAll();
    const state = usePresenceStore.getState();
    expect(state.onlineUsers).toHaveLength(0);
    expect(state.remoteUsers.size).toBe(0);
    expect(state.editingNodeIds.size).toBe(0);
  });

  // === DoD expect() assertions (S64-E1) ===

  it('DoD: onlineUsers initialises as empty array', () => {
    const store = usePresenceStore.getState();
    expect(store.onlineUsers).toEqual([]);
  });

  it('DoD: updateOnlineUsers is a function', () => {
    const store = usePresenceStore.getState();
    expect(typeof store.updateOnlineUsers).toBe('function');
  });

  it('DoD: removeStaleUsers is a function', () => {
    const store = usePresenceStore.getState();
    expect(typeof store.removeStaleUsers).toBe('function');
  });

  it('DoD: clearOnlineUsers is a function', () => {
    const store = usePresenceStore.getState();
    expect(typeof store.clearOnlineUsers).toBe('function');
  });

  // === S65-E2: Node Focus Awareness ===

  it('focusedNodes initialises as empty object', () => {
    expect(usePresenceStore.getState().focusedNodes).toEqual({});
  });

  it('focusedNodeInfos initialises as empty Map', () => {
    expect(usePresenceStore.getState().focusedNodeInfos.size).toBe(0);
  });

  it('setNodeFocus adds node to focusedNodes and focusedNodeInfos', () => {
    usePresenceStore.getState().setNodeFocus('node-1', 'u1', 'Alice', 'A');
    // Re-fetch state after set() — Zustand proxy becomes stale after mutation
    const state = usePresenceStore.getState();

    expect(state.focusedNodes['node-1']).toBe('u1');
    expect(state.focusedNodeInfos.has('node-1')).toBe(true);
    const info = state.focusedNodeInfos.get('node-1')!;
    expect(info.userId).toBe('u1');
    expect(info.userName).toBe('Alice');
    expect(info.avatar).toBe('A');
    expect(info.startedAt).toBeGreaterThan(0);
  });

  it('setNodeFocus overwrites existing focus for same node', () => {
    usePresenceStore.getState().setNodeFocus('node-1', 'u1', 'Alice', 'A');
    usePresenceStore.getState().setNodeFocus('node-1', 'u2', 'Bob', 'B');
    // Re-fetch after EACH set() — Zustand proxy goes stale after mutation
    const state = usePresenceStore.getState();
    expect(state.focusedNodes['node-1']).toBe('u2');
    expect(state.focusedNodeInfos.get('node-1')!.userName).toBe('Bob');
  });

  it('clearNodeFocus removes node from focusedNodes and focusedNodeInfos', () => {
    usePresenceStore.getState().setNodeFocus('node-1', 'u1', 'Alice', 'A');
    expect(usePresenceStore.getState().focusedNodes['node-1']).toBe('u1');

    usePresenceStore.getState().clearNodeFocus('node-1');
    const state = usePresenceStore.getState();
    expect(state.focusedNodes['node-1']).toBeUndefined();
    expect(state.focusedNodeInfos.has('node-1')).toBe(false);
  });

  it('clearNodeFocus on non-focused node is a no-op', () => {
    const state = usePresenceStore.getState();
    expect(() => state.clearNodeFocus('nonexistent')).not.toThrow();
  });

  it('getFocusedBy returns userId for remote focus, undefined for self focus', () => {
    const state = usePresenceStore.getState();
    // No focus
    expect(state.getFocusedBy('node-1', 'self-u1')).toBeUndefined();

    // Remote user focused
    state.setNodeFocus('node-1', 'remote-u2', 'Bob', 'B');
    expect(state.getFocusedBy('node-1', 'self-u1')).toBe('remote-u2');

    // Self focused (same userId) — should return undefined (not remote)
    state.clearNodeFocus('node-1');
    state.setNodeFocus('node-1', 'self-u1', 'Alice', 'A');
    expect(state.getFocusedBy('node-1', 'self-u1')).toBeUndefined();
  });

  it('getFocusInfo returns FocusedNodeInfo for focused node', () => {
    const state = usePresenceStore.getState();
    expect(state.getFocusInfo('node-1')).toBeUndefined();

    state.setNodeFocus('node-1', 'u1', 'Alice', 'A');
    const info = state.getFocusInfo('node-1');
    expect(info?.userId).toBe('u1');
    expect(info?.userName).toBe('Alice');
    expect(info?.avatar).toBe('A');
  });

  it('handleNodeFocusedMessage adds remote focus without local timer', () => {
    // Simulate receiving WS message: Bob focuses node-1
    usePresenceStore.getState().handleNodeFocusedMessage('node-1', 'u2', 'Bob', 'B');
    // Re-fetch after mutation — Zustand proxy goes stale after set()
    const state = usePresenceStore.getState();
    expect(state.focusedNodes['node-1']).toBe('u2');
    const info = state.focusedNodeInfos.get('node-1')!;
    expect(info.userName).toBe('Bob');
  });

  it('handleNodeFocusedMessage overwrites previous focus for same node', () => {
    usePresenceStore.getState().handleNodeFocusedMessage('node-1', 'u1', 'Alice', 'A');
    usePresenceStore.getState().handleNodeFocusedMessage('node-1', 'u2', 'Bob', 'B');
    // Re-fetch after each mutation
    const state = usePresenceStore.getState();
    expect(state.focusedNodes['node-1']).toBe('u2');
    expect(state.focusedNodeInfos.get('node-1')!.userName).toBe('Bob');
  });

  it('handleNodeUnfocusedMessage clears focus only for the specified user', () => {
    usePresenceStore.getState().setNodeFocus('node-1', 'u1', 'Alice', 'A');
    let state = usePresenceStore.getState();
    expect(state.focusedNodes['node-1']).toBe('u1');

    // Bob tries to unfocus (but Alice was focusing)
    usePresenceStore.getState().handleNodeUnfocusedMessage('node-1', 'u2');
    // Alice's focus should remain (unfocus was for wrong user)
    state = usePresenceStore.getState();
    expect(state.focusedNodes['node-1']).toBe('u1');

    // Alice unfocuses
    usePresenceStore.getState().handleNodeUnfocusedMessage('node-1', 'u1');
    state = usePresenceStore.getState();
    expect(state.focusedNodes['node-1']).toBeUndefined();
  });

  it('handleNodeUnfocusedMessage on non-focused node is a no-op', () => {
    const state = usePresenceStore.getState();
    expect(() => state.handleNodeUnfocusedMessage('nonexistent', 'u1')).not.toThrow();
  });

  it('clearAllFocus clears all focus state', () => {
    usePresenceStore.getState().setNodeFocus('node-1', 'u1', 'Alice', 'A');
    usePresenceStore.getState().setNodeFocus('node-2', 'u2', 'Bob', 'B');
    let state = usePresenceStore.getState();
    expect(Object.keys(state.focusedNodes)).toHaveLength(2);

    usePresenceStore.getState().clearAllFocus();
    state = usePresenceStore.getState();
    expect(state.focusedNodes).toEqual({});
    expect(state.focusedNodeInfos.size).toBe(0);
  });

  it('clearAll also clears focusedNodes and focusedNodeInfos', () => {
    const state = usePresenceStore.getState();
    state.setNodeFocus('node-1', 'u1', 'Alice', 'A');

    state.clearAll();
    expect(state.focusedNodes).toEqual({});
    expect(state.focusedNodeInfos.size).toBe(0);
  });

  it('DoD: setNodeFocus is a function', () => {
    expect(typeof usePresenceStore.getState().setNodeFocus).toBe('function');
  });

  it('DoD: clearNodeFocus is a function', () => {
    expect(typeof usePresenceStore.getState().clearNodeFocus).toBe('function');
  });

  it('DoD: getFocusedBy is a function', () => {
    expect(typeof usePresenceStore.getState().getFocusedBy).toBe('function');
  });

  it('DoD: getFocusInfo is a function', () => {
    expect(typeof usePresenceStore.getState().getFocusInfo).toBe('function');
  });

  it('DoD: handleNodeFocusedMessage is a function', () => {
    expect(typeof usePresenceStore.getState().handleNodeFocusedMessage).toBe('function');
  });

  it('DoD: handleNodeUnfocusedMessage is a function', () => {
    expect(typeof usePresenceStore.getState().handleNodeUnfocusedMessage).toBe('function');
  });

  it('DoD: clearAllFocus is a function', () => {
    expect(typeof usePresenceStore.getState().clearAllFocus).toBe('function');
  });

  it('focus + unfocus full lifecycle', () => {
    const state = usePresenceStore.getState();

    // Alice focuses node-1
    state.setNodeFocus('node-1', 'u1', 'Alice', 'A');
    expect(state.getFocusedBy('node-1', 'self-other')).toBe('u1');
    expect(state.getFocusInfo('node-1')?.userName).toBe('Alice');

    // Bob focuses node-1 (overwrites Alice)
    state.handleNodeFocusedMessage('node-1', 'u2', 'Bob', 'B');
    expect(state.getFocusInfo('node-1')?.userName).toBe('Bob');

    // Alice unfocuses
    state.handleNodeUnfocusedMessage('node-1', 'u1');
    // Bob still focused
    expect(state.getFocusInfo('node-1')?.userName).toBe('Bob');

    // Bob unfocuses
    state.handleNodeUnfocusedMessage('node-1', 'u2');
    expect(state.getFocusInfo('node-1')).toBeUndefined();
    expect(state.focusedNodes['node-1']).toBeUndefined();
  });

  // ===== S68-E5: 协作光标同步 — dedicated cursors field =====
  // E5 DoD: cursors field (Record<userId, CursorState>), broadcastCursor, clearCursor

  describe('S68-E5: cursors field', () => {
    it('cursors initialises as empty object', () => {
      const { cursors } = usePresenceStore.getState();
      expect(cursors).toEqual({});
    });

    it('broadcastCursor adds a cursor to the cursors map', () => {
      const state = usePresenceStore.getState();
      state.broadcastCursor('u1', 100, 200);
      const cursors = usePresenceStore.getState().cursors;
      expect(cursors['u1']).toMatchObject({
        userId: 'u1',
        x: 100,
        y: 200,
      });
      expect(cursors['u1'].lastSeen).toBeGreaterThan(0);
    });

    it('broadcastCursor overwrites previous position for same userId', () => {
      const state = usePresenceStore.getState();
      state.broadcastCursor('u1', 100, 200);
      state.broadcastCursor('u1', 300, 400);
      const cursors = usePresenceStore.getState().cursors;
      expect(cursors['u1'].x).toBe(300);
      expect(cursors['u1'].y).toBe(400);
    });

    it('broadcastCursor from multiple users coexists without overwriting', () => {
      const state = usePresenceStore.getState();
      state.broadcastCursor('u1', 100, 200);
      state.broadcastCursor('u2', 300, 400);
      state.broadcastCursor('u3', 500, 600);
      const cursors = usePresenceStore.getState().cursors;
      expect(Object.keys(cursors)).toHaveLength(3);
      expect(cursors['u1']).toMatchObject({ userId: 'u1', x: 100, y: 200 });
      expect(cursors['u2']).toMatchObject({ userId: 'u2', x: 300, y: 400 });
      expect(cursors['u3']).toMatchObject({ userId: 'u3', x: 500, y: 600 });
    });

    it('clearCursor removes only that user from cursors', () => {
      const state = usePresenceStore.getState();
      state.broadcastCursor('u1', 100, 200);
      state.broadcastCursor('u2', 300, 400);
      state.clearCursor('u1');
      const cursors = usePresenceStore.getState().cursors;
      expect(Object.keys(cursors)).toHaveLength(1);
      expect(cursors['u2']).toMatchObject({ userId: 'u2', x: 300, y: 400 });
      expect(cursors['u1']).toBeUndefined();
    });

    it('clearCursor on non-existent user is a no-op', () => {
      const state = usePresenceStore.getState();
      const cursorsBefore = usePresenceStore.getState().cursors;
      state.clearCursor('non-existent');
      expect(usePresenceStore.getState().cursors).toEqual(cursorsBefore);
    });

    it('clearAllCursors removes all cursors', () => {
      const state = usePresenceStore.getState();
      state.broadcastCursor('u1', 100, 200);
      state.broadcastCursor('u2', 300, 400);
      state.clearAllCursors();
      expect(usePresenceStore.getState().cursors).toEqual({});
    });

    it('removeUser also clears from cursors', () => {
      const state = usePresenceStore.getState();
      state.setRemoteUsers([
        { userId: 'u1', name: 'Alice', avatar: 'A' },
        { userId: 'u2', name: 'Bob', avatar: 'B' },
      ]);
      state.broadcastCursor('u1', 100, 200);
      state.broadcastCursor('u2', 300, 400);
      state.removeUser('u1');
      const cursors = usePresenceStore.getState().cursors;
      expect(cursors['u1']).toBeUndefined();
      expect(cursors['u2']).toMatchObject({ userId: 'u2', x: 300, y: 400 });
    });

    it('clearAll also clears cursors', () => {
      const state = usePresenceStore.getState();
      state.broadcastCursor('u1', 100, 200);
      state.broadcastCursor('u2', 300, 400);
      state.clearAll();
      expect(usePresenceStore.getState().cursors).toEqual({});
    });
  });

});
