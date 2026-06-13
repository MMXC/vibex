/**
 * nodeLockStore.test.ts — Vitest tests for nodeLockStore
 * S95-E3: Node Edit Locking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNodeLockStore } from '../nodeLockStore';

// Shared mock fetch — hoisted so module-level vi.mock works
const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('nodeLockStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useNodeLockStore.setState({
      lockedNodes: new Map(),
      _cleanupTimers: new Map(),
    });
  });

  describe('acquireLock', () => {
    it('sets lock in state when acquired=true', async () => {
      const lockData = {
        acquired: true,
        locked_by: 'user-current',
        user_name: 'Alice',
        avatar: null,
        expires_at: Date.now() + 60_000,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lockData),
      });

      const result = await useNodeLockStore.getState().acquireLock('canvas-1', 'node-1');

      expect(result.acquired).toBe(true);
      expect(result.lock).toMatchObject({
        locked_by: 'user-current',
        user_name: 'Alice',
        avatar: null,
      });

      const state = useNodeLockStore.getState();
      const lock = state.lockedNodes.get('node-1');
      expect(lock).toBeDefined();
      expect(lock!.locked_by).toBe('user-current');
      expect(lock!.user_name).toBe('Alice');
    });

    it('records lock info when acquired=false (another user holds it)', async () => {
      const lockData = {
        acquired: false,
        locked_by: 'user-other',
        user_name: 'Bob',
        avatar: 'https://example.com/bob.png',
        expires_at: Date.now() + 60_000,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lockData),
      });

      const result = await useNodeLockStore.getState().acquireLock('canvas-1', 'node-2');

      expect(result.acquired).toBe(false);
      expect(result.lock).toMatchObject({
        locked_by: 'user-other',
        user_name: 'Bob',
        avatar: 'https://example.com/bob.png',
      });

      // Badge should still be able to show Bob's info
      const state = useNodeLockStore.getState();
      const lock = state.lockedNodes.get('node-2');
      expect(lock).toBeDefined();
      expect(lock!.locked_by).toBe('user-other');
      expect(lock!.user_name).toBe('Bob');
    });

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      await expect(
        useNodeLockStore.getState().acquireLock('canvas-1', 'node-1')
      ).rejects.toThrow('Internal server error');
    });

    it('throws on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        useNodeLockStore.getState().acquireLock('canvas-1', 'node-1')
      ).rejects.toThrow('Network failure');
    });
  });

  describe('releaseLock', () => {
    it('clears lock from state after successful release', async () => {
      // First acquire
      const lockData = {
        acquired: true,
        locked_by: 'user-current',
        user_name: 'Alice',
        avatar: null,
        expires_at: Date.now() + 60_000,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lockData),
      });
      await useNodeLockStore.getState().acquireLock('canvas-1', 'node-1');

      // Then release
      mockFetch.mockResolvedValueOnce({ ok: true });
      await useNodeLockStore.getState().releaseLock('canvas-1', 'node-1');

      const state = useNodeLockStore.getState();
      expect(state.lockedNodes.has('node-1')).toBe(false);
    });

    it('clears state even if release API call fails', async () => {
      // First acquire
      const lockData = {
        acquired: true,
        locked_by: 'user-current',
        user_name: 'Alice',
        avatar: null,
        expires_at: Date.now() + 60_000,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lockData),
      });
      await useNodeLockStore.getState().acquireLock('canvas-1', 'node-1');

      // Release fails with network error
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));
      await useNodeLockStore.getState().releaseLock('canvas-1', 'node-1');

      // State should still be cleared (optimistic)
      const state = useNodeLockStore.getState();
      expect(state.lockedNodes.has('node-1')).toBe(false);
    });
  });

  describe('getLock', () => {
    it('returns correct lock info for a locked node', async () => {
      const lockData = {
        acquired: true,
        locked_by: 'user-current',
        user_name: 'Alice',
        avatar: null,
        expires_at: Date.now() + 60_000,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(lockData),
      });
      await useNodeLockStore.getState().acquireLock('canvas-1', 'node-1');

      const lock = useNodeLockStore.getState().getLock('node-1');

      expect(lock).toBeDefined();
      expect(lock!.locked_by).toBe('user-current');
      expect(lock!.user_name).toBe('Alice');
      expect(lock!.avatar).toBe(null);
      expect(lock!.expires_at).toBe(lockData.expires_at);
    });

    it('returns undefined for an unlocked node', () => {
      const lock = useNodeLockStore.getState().getLock('node-unlocked');
      expect(lock).toBeUndefined();
    });

    it('returns undefined and cleans up expired lock', async () => {
      // Manually insert an expired lock
      useNodeLockStore.setState((state) => {
        const next = new Map(state.lockedNodes);
        next.set('node-expired', {
          locked_by: 'user-other',
          user_name: 'Bob',
          avatar: null,
          expires_at: Date.now() - 1_000, // expired 1s ago
        });
        return { lockedNodes: next };
      });

      const lock = useNodeLockStore.getState().getLock('node-expired');

      expect(lock).toBeUndefined();
      // State should also be cleaned up
      expect(useNodeLockStore.getState().lockedNodes.has('node-expired')).toBe(false);
    });
  });
});
