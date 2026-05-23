/**
 * oplogStore.test.ts — Sprint38 P002-E1
 *
 * Note: Always call useOplogStore.getState() after mutations to get the
 * updated state (Zustand's set() creates a new state object).
 */

import { useOplogStore } from '../oplogStore';

describe('useOplogStore', () => {
  beforeEach(() => {
    useOplogStore.getState().clearOplog();
  });

  describe('addOplogEntry', () => {
    it('should add an entry with generated id and timestamp', () => {
      const store = useOplogStore.getState();
      const id = store.addOplogEntry({
        userId: 'ai',
        type: 'ai',
        nodeId: 'node-1',
        action: 'edit',
      });

      const state = useOplogStore.getState();
      expect(state.oplog).toHaveLength(1);
      expect(state.oplog[0].id).toBe(id);
      expect(state.oplog[0].userId).toBe('ai');
      expect(state.oplog[0].type).toBe('ai');
      expect(state.oplog[0].nodeId).toBe('node-1');
      expect(state.oplog[0].action).toBe('edit');
      expect(state.oplog[0].timestamp).toBeGreaterThan(0);
    });

    it('should prepend entries (newest first)', () => {
      const store = useOplogStore.getState();
      const id1 = store.addOplogEntry({ userId: 'u1', type: 'user', nodeId: 'n1', action: 'a1' });
      const id2 = store.addOplogEntry({ userId: 'u2', type: 'ai', nodeId: 'n2', action: 'a2' });

      const state = useOplogStore.getState();
      expect(state.oplog[0].id).toBe(id2); // newest first
      expect(state.oplog[1].id).toBe(id1);
    });

    it('should accept optional diff field', () => {
      const store = useOplogStore.getState();
      store.addOplogEntry({
        userId: 'ai',
        type: 'ai',
        nodeId: 'node-1',
        action: 'accept',
        diff: '+ line 10: const x = 1',
      });

      const state = useOplogStore.getState();
      expect(state.oplog[0].diff).toBe('+ line 10: const x = 1');
    });
  });

  describe('getOplogForNode', () => {
    it('should return only entries for the given nodeId', () => {
      const store = useOplogStore.getState();
      store.addOplogEntry({ userId: 'u1', type: 'user', nodeId: 'node-1', action: 'a1' });
      store.addOplogEntry({ userId: 'u2', type: 'ai', nodeId: 'node-2', action: 'a2' });
      store.addOplogEntry({ userId: 'u3', type: 'ai', nodeId: 'node-1', action: 'a3' });

      const node1Entries = store.getOplogForNode('node-1');
      expect(node1Entries).toHaveLength(2);
      expect(node1Entries.every((e) => e.nodeId === 'node-1')).toBe(true);

      const node2Entries = store.getOplogForNode('node-2');
      expect(node2Entries).toHaveLength(1);
      expect(node2Entries[0].nodeId).toBe('node-2');
    });

    it('should return empty array for unknown nodeId', () => {
      const store = useOplogStore.getState();
      store.addOplogEntry({ userId: 'u1', type: 'user', nodeId: 'node-1', action: 'a1' });
      expect(store.getOplogForNode('unknown-node')).toHaveLength(0);
    });
  });

  describe('clearOplog', () => {
    it('should remove all entries', () => {
      const store = useOplogStore.getState();
      store.clearOplog(); // ensure clean state
      // Re-fetch after mutation to get updated reference
      const s1 = useOplogStore.getState();
      s1.addOplogEntry({ userId: 'u1', type: 'user', nodeId: 'n1', action: 'a1' });
      // Re-fetch after mutation
      const s2 = useOplogStore.getState();
      expect(s2.oplog).toHaveLength(1);

      s2.addOplogEntry({ userId: 'u2', type: 'ai', nodeId: 'n2', action: 'a2' });
      // Re-fetch after mutation
      const s3 = useOplogStore.getState();
      expect(s3.oplog).toHaveLength(2);

      s3.clearOplog();
      // Re-fetch after mutation
      const s4 = useOplogStore.getState();
      expect(s4.oplog).toHaveLength(0);
    });
  });
});
