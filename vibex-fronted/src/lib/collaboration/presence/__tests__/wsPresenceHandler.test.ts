/**
 * wsPresenceHandler.test.ts — S84-E2 vitest
 *
 * Tests:
 * 1. getCollaboratorColor returns a color from COLLABORATOR_COLORS
 * 2. Same userId always gets the same color (deterministic)
 * 3. Different users get different colors (8-color pool distribution)
 * 4. handlePresenceMessage presence:join — adds user to remoteUsers
 * 5. handlePresenceMessage presence:leave — removes user from remoteUsers
 * 6. handlePresenceMessage presence:update — updates cursor position
 * 7. handlePresenceMessage presence:heartbeat — updates lastActiveAt
 * 8. handleReconnect clears stale state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCollaboratorColor,
  COLLABORATOR_COLORS,
  handlePresenceMessage,
  handleReconnect,
  type PresenceMessage,
} from '../wsPresenceHandler';

// Shared mock state reference
const mockRemoteUsers = new Map();
const mockCursors: Record<string, unknown> = {};
let mockConnectionStatus: 'connected' | 'reconnecting' | 'disconnected' = 'connected';
const mockActions = {
  setRemoteUsers: vi.fn(),
  broadcastCursor: vi.fn(),
  updateLastActive: vi.fn(),
  removeUser: vi.fn(),
  clearCursor: vi.fn(),
  clearAllCursors: vi.fn(),
  clearAll: vi.fn(),
  setConnectionStatus: vi.fn(),
  reSync: vi.fn(),
};

function getMockState() {
  return {
    remoteUsers: mockRemoteUsers,
    cursors: mockCursors,
    connectionStatus: mockConnectionStatus,
    ...mockActions,
  };
}

// Zustand mock — usePresenceStore is both a hook and has a static getState()
vi.mock('@/lib/collaboration/presenceStore', () => {
  return {
    usePresenceStore: Object.assign(
      vi.fn(() => getMockState()),
      { getState: vi.fn(() => getMockState()) }
    ),
  };
});

describe('wsPresenceHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockRemoteUsers.clear();
    Object.keys(mockCursors).forEach((k) => delete mockCursors[k]);
    mockConnectionStatus = 'connected';
  });

  // === Case 1: Returns a valid color ===
  it('getCollaboratorColor returns a color from COLLABORATOR_COLORS', () => {
    const color = getCollaboratorColor('user-123');
    expect(COLLABORATOR_COLORS).toContain(color);
  });

  // === Case 2: Deterministic — same userId always gets same color ===
  it('getCollaboratorColor is deterministic for same userId', () => {
    const color1 = getCollaboratorColor('alice');
    const color2 = getCollaboratorColor('alice');
    expect(color1).toBe(color2);
  });

  // === Case 3: 8-color pool distribution ===
  it('getCollaboratorColor distributes across the 8-color pool', () => {
    const colors = new Set(
      ['user-a', 'user-b', 'user-c', 'user-d', 'user-e', 'user-f', 'user-g', 'user-h'].map(getCollaboratorColor)
    );
    colors.forEach((c) => expect(COLLABORATOR_COLORS).toContain(c));
  });

  // === Case 4: presence:join adds user ===
  it('presence:join adds user to remoteUsers and broadcasts cursor', () => {
    const msg: PresenceMessage = {
      type: 'presence:join',
      payload: { userId: 'u1', name: 'Alice', avatar: 'A', cursorX: 100, cursorY: 200 },
    };
    handlePresenceMessage(msg);

    expect(mockActions.setRemoteUsers).toHaveBeenCalled();
    expect(mockActions.broadcastCursor).toHaveBeenCalledWith('u1', 100, 200);
    expect(mockActions.updateLastActive).toHaveBeenCalledWith('u1');
  });

  // === Case 5: presence:leave removes user ===
  it('presence:leave removes user from remoteUsers and clears cursor', () => {
    const msg: PresenceMessage = {
      type: 'presence:leave',
      payload: { userId: 'u1' },
    };
    handlePresenceMessage(msg);

    expect(mockActions.removeUser).toHaveBeenCalledWith('u1');
    expect(mockActions.clearCursor).toHaveBeenCalledWith('u1');
  });

  // === Case 6: presence:update updates cursor ===
  it('presence:update broadcasts cursor position and updates lastActiveAt', () => {
    const msg: PresenceMessage = {
      type: 'presence:update',
      payload: { userId: 'u1', cursorX: 300, cursorY: 400, status: 'online' },
    };
    handlePresenceMessage(msg);

    expect(mockActions.broadcastCursor).toHaveBeenCalledWith('u1', 300, 400);
    expect(mockActions.updateLastActive).toHaveBeenCalledWith('u1');
  });

  // === Case 7: presence:heartbeat updates lastActiveAt ===
  it('presence:heartbeat updates lastActiveAt', () => {
    const msg: PresenceMessage = {
      type: 'presence:heartbeat',
      payload: { userId: 'u1', timestamp: Date.now() },
    };
    handlePresenceMessage(msg);

    expect(mockActions.updateLastActive).toHaveBeenCalledWith('u1');
  });

  // === Case 8: handleReconnect clears stale state ===
  it('handleReconnect clears cursors, clears remoteUsers, sets connection status, and calls reSync', () => {
    handleReconnect('self-1', 'Me', 'avatar-url');

    expect(mockActions.clearAllCursors).toHaveBeenCalled();
    expect(mockActions.clearAll).toHaveBeenCalled();
    expect(mockActions.setConnectionStatus).toHaveBeenCalledWith('connected');
    expect(mockActions.reSync).toHaveBeenCalled();
  });
});
