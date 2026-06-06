/**
 * presenceStore.conflict.test.ts — S70-E4: Collaboration Conflict Detection
 *
 * Tests:
 * - ConflictRecord interface and conflict state
 * - addConflict: adds pending conflict, avoids duplicates
 * - resolveConflict: removes conflict from pending list
 * - hasConflict: returns true only for nodes with unresolved conflicts
 * - getUnresolvedCount: returns count of pending conflicts
 * - startEditing conflict detection: local user starts editing node already
 *   being edited by remote user → conflict recorded
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePresenceStore } from '../presenceStore';

// Mock useCollaboration to avoid WS dependency
vi.mock('@/lib/collaboration/useCollaboration', () => ({
  useCollaboration: () => ({ isConnected: false, subscribe: () => () => {}, sendRaw: () => {} }),
}));

// Mock IndexedDB for vi.hoisted() persistence store
const mockIDBDatabase = {
  createObjectStore: vi.fn(() => ({
    createIndex: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  })),
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    })),
  })),
  close: vi.fn(),
  addEventListener: vi.fn(),
};
globalThis.indexedDB = vi.fn(() => mockIDBDatabase) as unknown as IDBFactory;

beforeEach(() => {
  vi.useFakeTimers();
  usePresenceStore.setState({
    pendingConflicts: [],
    editingNodeIds: new Map(),
    localEditing: new Map(),
  });
});

describe('ConflictRecord interface + conflict state', () => {
  it('should initialize with empty pendingConflicts', () => {
    const { pendingConflicts } = usePresenceStore.getState();
    expect(pendingConflicts).toEqual([]);
  });

  it('should accept ConflictRecord-like objects in pendingConflicts', () => {
    const conflict = {
      nodeId: 'node-1',
      nodeName: 'Test Node',
      localVersion: 'version A',
      remoteVersion: 'version B',
      localUserId: 'user-1',
      localUserName: 'Alice',
      remoteUserId: 'user-2',
      remoteUserName: 'Bob',
      detectedAt: Date.now(),
      resolution: 'pending' as const,
    };
    usePresenceStore.setState({ pendingConflicts: [conflict] });
    expect(usePresenceStore.getState().pendingConflicts).toHaveLength(1);
  });
});

describe('addConflict', () => {
  it('should add a new conflict to pendingConflicts', () => {
    const store = usePresenceStore.getState();
    store.addConflict({
      nodeId: 'node-1',
      nodeName: 'My Node',
      localVersion: 'v1',
      remoteVersion: 'v2',
      localUserId: 'user-a',
      localUserName: 'Alice',
      remoteUserId: 'user-b',
      remoteUserName: 'Bob',
      detectedAt: 1000,
      resolution: 'pending',
    });

    expect(usePresenceStore.getState().pendingConflicts).toHaveLength(1);
    expect(usePresenceStore.getState().pendingConflicts[0].nodeId).toBe('node-1');
    expect(usePresenceStore.getState().pendingConflicts[0].resolution).toBe('pending');
  });

  it('should NOT add duplicate conflict for the same nodeId', () => {
    const store = usePresenceStore.getState();
    store.addConflict({
      nodeId: 'node-1', nodeName: 'N1', localVersion: 'v1', remoteVersion: 'v2',
      localUserId: 'u1', localUserName: 'A', remoteUserId: 'u2', remoteUserName: 'B',
      detectedAt: 1000, resolution: 'pending',
    });
    store.addConflict({
      nodeId: 'node-1', nodeName: 'N1', localVersion: 'v1', remoteVersion: 'v2',
      localUserId: 'u1', localUserName: 'A', remoteUserId: 'u2', remoteUserName: 'B',
      detectedAt: 2000, resolution: 'pending',
    });

    expect(usePresenceStore.getState().pendingConflicts).toHaveLength(1);
  });

  it('should allow conflicts on different nodes', () => {
    const store = usePresenceStore.getState();
    store.addConflict({
      nodeId: 'node-1', nodeName: 'N1', localVersion: 'v1', remoteVersion: 'v2',
      localUserId: 'u1', localUserName: 'A', remoteUserId: 'u2', remoteUserName: 'B',
      detectedAt: 1000, resolution: 'pending',
    });
    store.addConflict({
      nodeId: 'node-2', nodeName: 'N2', localVersion: 'v3', remoteVersion: 'v4',
      localUserId: 'u3', localUserName: 'C', remoteUserId: 'u4', remoteUserName: 'D',
      detectedAt: 2000, resolution: 'pending',
    });

    expect(usePresenceStore.getState().pendingConflicts).toHaveLength(2);
  });
});

describe('resolveConflict', () => {
  beforeEach(() => {
    const store = usePresenceStore.getState();
    store.addConflict({
      nodeId: 'node-1', nodeName: 'N1', localVersion: 'v1', remoteVersion: 'v2',
      localUserId: 'u1', localUserName: 'Alice', remoteUserId: 'u2', remoteUserName: 'Bob',
      detectedAt: 1000, resolution: 'pending',
    });
    store.addConflict({
      nodeId: 'node-2', nodeName: 'N2', localVersion: 'v3', remoteVersion: 'v4',
      localUserId: 'u3', localUserName: 'Carol', remoteUserId: 'u4', remoteUserName: 'Dave',
      detectedAt: 2000, resolution: 'pending',
    });
  });

  it('should remove the specified conflict', () => {
    const store = usePresenceStore.getState();
    store.resolveConflict('node-1', 'keep-local');

    const state = usePresenceStore.getState();
    expect(state.pendingConflicts).toHaveLength(1);
    expect(state.pendingConflicts[0].nodeId).toBe('node-2');
  });

  it('should not affect other conflicts', () => {
    const store = usePresenceStore.getState();
    store.resolveConflict('node-1', 'keep-remote');

    const state = usePresenceStore.getState();
    expect(state.pendingConflicts).toHaveLength(1);
    expect(state.pendingConflicts[0].nodeId).toBe('node-2');
  });
});

describe('hasConflict', () => {
  beforeEach(() => {
    const store = usePresenceStore.getState();
    store.addConflict({
      nodeId: 'conflict-node', nodeName: 'CN', localVersion: 'v1', remoteVersion: 'v2',
      localUserId: 'u1', localUserName: 'A', remoteUserId: 'u2', remoteUserName: 'B',
      detectedAt: 1000, resolution: 'pending',
    });
  });

  it('should return true for node with unresolved conflict', () => {
    expect(usePresenceStore.getState().hasConflict('conflict-node')).toBe(true);
  });

  it('should return false for node without conflict', () => {
    expect(usePresenceStore.getState().hasConflict('clean-node')).toBe(false);
  });

  it('should return false after conflict is resolved', () => {
    usePresenceStore.getState().resolveConflict('conflict-node', 'keep-local');
    expect(usePresenceStore.getState().hasConflict('conflict-node')).toBe(false);
  });
});

describe('getUnresolvedCount', () => {
  it('should return 0 when no conflicts', () => {
    expect(usePresenceStore.getState().getUnresolvedCount()).toBe(0);
  });

  it('should return correct count', () => {
    const store = usePresenceStore.getState();
    store.addConflict({
      nodeId: 'n1', nodeName: 'N1', localVersion: 'v1', remoteVersion: 'v2',
      localUserId: 'u1', localUserName: 'A', remoteUserId: 'u2', remoteUserName: 'B',
      detectedAt: 1000, resolution: 'pending',
    });
    store.addConflict({
      nodeId: 'n2', nodeName: 'N2', localVersion: 'v3', remoteVersion: 'v4',
      localUserId: 'u3', localUserName: 'C', remoteUserId: 'u4', remoteUserName: 'D',
      detectedAt: 2000, resolution: 'pending',
    });

    expect(usePresenceStore.getState().getUnresolvedCount()).toBe(2);
  });

  it('should decrease after resolveConflict', () => {
    const store = usePresenceStore.getState();
    store.addConflict({
      nodeId: 'n1', nodeName: 'N1', localVersion: 'v1', remoteVersion: 'v2',
      localUserId: 'u1', localUserName: 'A', remoteUserId: 'u2', remoteUserName: 'B',
      detectedAt: 1000, resolution: 'pending',
    });
    store.addConflict({
      nodeId: 'n2', nodeName: 'N2', localVersion: 'v3', remoteVersion: 'v4',
      localUserId: 'u3', localUserName: 'C', remoteUserId: 'u4', remoteUserName: 'D',
      detectedAt: 2000, resolution: 'pending',
    });

    store.resolveConflict('n1', 'keep-local');
    expect(usePresenceStore.getState().getUnresolvedCount()).toBe(1);
  });
});

describe('S70-E4: startEditing conflict detection', () => {
  it('should NOT create conflict when no remote user is editing', () => {
    const store = usePresenceStore.getState();
    store.startEditing('node-1', 'user-1', 'Alice', 'A');

    expect(store.pendingConflicts).toHaveLength(0);
  });

  it('should NOT create conflict when same user is editing (self-edit)', () => {
    const store = usePresenceStore.getState();
    // Simulate remote user already editing
    usePresenceStore.setState({
      editingNodeIds: new Map([['node-1', { userId: 'user-1', userName: 'Alice', avatar: 'A', startedAt: Date.now() }]]),
    });

    store.startEditing('node-1', 'user-1', 'Alice', 'A');

    expect(store.pendingConflicts).toHaveLength(0);
  });

  it('should create conflict when local user starts editing a node already edited by remote user', () => {
    const store = usePresenceStore.getState();
    // Remote user Bob is already editing node-1
    usePresenceStore.setState({
      editingNodeIds: new Map([['node-1', { userId: 'user-2', userName: 'Bob', avatar: 'B', startedAt: Date.now() }]]),
    });

    // Local user Alice tries to edit the same node
    store.startEditing('node-1', 'user-1', 'Alice', 'A');

    // Get fresh state after the Zustand update
    const state = usePresenceStore.getState();
    expect(state.pendingConflicts).toHaveLength(1);
    expect(state.pendingConflicts[0].nodeId).toBe('node-1');
    expect(state.pendingConflicts[0].localUserId).toBe('user-1');
    expect(state.pendingConflicts[0].localUserName).toBe('Alice');
    expect(state.pendingConflicts[0].remoteUserId).toBe('user-2');
    expect(state.pendingConflicts[0].remoteUserName).toBe('Bob');
    expect(state.pendingConflicts[0].resolution).toBe('pending');
  });

  it('should NOT create duplicate conflicts on repeated startEditing calls', () => {
    const store = usePresenceStore.getState();
    usePresenceStore.setState({
      editingNodeIds: new Map([['node-1', { userId: 'user-2', userName: 'Bob', avatar: 'B', startedAt: Date.now() }]]),
    });

    store.startEditing('node-1', 'user-1', 'Alice', 'A');
    store.startEditing('node-1', 'user-1', 'Alice', 'A');

    const state = usePresenceStore.getState();
    expect(state.pendingConflicts).toHaveLength(1);
  });

  it('should still add the node to editingNodeIds even when conflict is detected', () => {
    const store = usePresenceStore.getState();
    usePresenceStore.setState({
      editingNodeIds: new Map([['node-1', { userId: 'user-2', userName: 'Bob', avatar: 'B', startedAt: Date.now() }]]),
    });

    store.startEditing('node-1', 'user-1', 'Alice', 'A');

    const state = usePresenceStore.getState();
    const editor = state.editingNodeIds.get('node-1');
    expect(editor).toBeDefined();
    expect(editor!.userId).toBe('user-1');
    expect(editor!.userName).toBe('Alice');
  });
});
