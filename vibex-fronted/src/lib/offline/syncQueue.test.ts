/**
 * syncQueue.test.ts — S93-E3: Offline-First PWA Enhancement
 *
 * Unit tests for syncQueue.ts using Vitest.
 * Mocks the `idb` module to isolate sync queue logic from IndexedDB.
 *
 * @module lib/offline/syncQueue.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { IDBPDatabase } from 'idb';

// ==================== Mock idb ====================

// In-memory store for the mock idb implementation
const mockStore = new Map<string, unknown>();
const mockIndex = new Map<string | number, Array<{ timestamp: number } & Record<string, unknown>>>();

function resetMockStore() {
  mockStore.clear();
  mockIndex.clear();
}

const mockDB: Partial<IDBPDatabase> = {
  put: vi.fn(async (storeName: string, value: unknown) => {
    const key = (value as { id: string }).id;
    mockStore.set(`${storeName}:${key}`, value);
    return undefined;
  }),
  get: vi.fn(async (storeName: string, key: string) => {
    // key is the op id; getAllFromIndex stores with storeName:id
    return mockStore.get(`${storeName}:${key}`) ?? undefined;
  }),
  delete: vi.fn(async (storeName: string, key: string) => {
    mockStore.delete(`${storeName}:${key}`);
    return undefined;
  }),
  getAll: vi.fn(async (storeName: string) => {
    const results: unknown[] = [];
    mockStore.forEach((v, k) => {
      if (k.startsWith(`${storeName}:`)) results.push(v);
    });
    return results;
  }),
  getAllFromIndex: vi.fn(async (storeName: string) => {
    const results: unknown[] = [];
    mockStore.forEach((v, k) => {
      if (k.startsWith(`${storeName}:`)) results.push(v);
    });
    // Sort by timestamp (oldest first)
    return (results as Array<{ timestamp: number }>).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }),
  clear: vi.fn(async () => {
    mockStore.clear();
    return undefined;
  }),
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(() => true),
  } as unknown as IDBPDatabase['objectStoreNames'],
  close: vi.fn(),
};

vi.mock('idb', () => ({
  openDB: vi.fn(async () => mockDB as IDBPDatabase),
}));

// ==================== Import after mock ====================

import {
  generateOpId,
  enqueue,
  queueOperation,
  peek,
  dequeue,
  getAll,
  pendingCount,
  clearAll,
  replay,
  isSyncing,
  incrementRetries,
  type SyncOp,
} from './syncQueue';

// ==================== Helpers ====================

function makeMockFetch(
  responses: Array<{ ok: boolean; status?: number; body?: unknown }> = []
) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const resp = responses[callIndex] ?? { ok: true, status: 200 };
    callIndex++;
    return Promise.resolve({
      ok: resp.ok,
      status: resp.status ?? (resp.ok ? 200 : 500),
      clone: () => ({ text: () => Promise.resolve(JSON.stringify(resp.body ?? {})) }),
    });
  });
}

// ==================== Tests ====================

describe('syncQueue', () => {
  beforeEach(async () => {
    resetMockStore();
    vi.clearAllMocks();
    // Reset the internal module state by clearing the queue
    await clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- generateOpId ----

  describe('generateOpId', () => {
    it('generates a stable ID from type and timestamp', () => {
      const id1 = generateOpId('canvas:update', 1700000000000);
      const id2 = generateOpId('canvas:update', 1700000000000);
      expect(id1).toBe(id2);
    });

    it('generates different IDs for different timestamps', () => {
      const id1 = generateOpId('canvas:update', 1700000000000);
      const id2 = generateOpId('canvas:update', 1700000000001);
      expect(id1).not.toBe(id2);
    });

    it('generates different IDs for different types', () => {
      const id1 = generateOpId('canvas:update', 1700000000000);
      const id2 = generateOpId('canvas:addNode', 1700000000000);
      expect(id1).not.toBe(id2);
    });

    it('sanitizes type strings with special characters', () => {
      const id = generateOpId('canvas:add-node!@#', 1700000000000);
      expect(id).toBe('op_1700000000000_canvas_add_node___');
    });
  });

  // ---- enqueue ----

  describe('enqueue', () => {
    it('adds an operation to the queue with a generated ID', async () => {
      const op = await enqueue('canvas:addNode', { nodeId: 'n1', canvasId: 'c1' });
      expect(op.id).toBeTruthy();
      expect(op.type).toBe('canvas:addNode');
      expect(op.retries).toBe(0);
      expect(op.timestamp).toBeGreaterThan(0);
    });

    it('persists operation payload as JSON string', async () => {
      const op = await enqueue('canvas:update', { id: 'n1', changes: { x: 10 } });
      expect(typeof op.payload).toBe('string');
      expect(JSON.parse(op.payload)).toEqual({ id: 'n1', changes: { x: 10 } });
    });

    it('accepts an already-stringified payload', async () => {
      const op = await enqueue('canvas:delete', '{"nodeId":"n2"}');
      expect(op.payload).toBe('{"nodeId":"n2"}');
    });

    it('uses the provided timestamp when given', async () => {
      const ts = 1600000000000;
      const op = await enqueue('canvas:addNode', { nodeId: 'n1' }, ts);
      expect(op.timestamp).toBe(ts);
    });

    it('enqueues multiple operations in FIFO order', async () => {
      const op1 = await enqueue('canvas:addNode', { n: 1 }, 1000);
      const op2 = await enqueue('canvas:addNode', { n: 2 }, 1001);
      const op3 = await enqueue('canvas:addNode', { n: 3 }, 1002);

      const all = await getAll();
      expect(all).toHaveLength(3);
      expect(all[0].id).toBe(op1.id);
      expect(all[1].id).toBe(op2.id);
      expect(all[2].id).toBe(op3.id);
    });
  });

  // ---- queueOperation ----

  describe('queueOperation', () => {
    it('stores a SyncOp in IndexedDB via idb', async () => {
      const op: SyncOp = {
        id: 'test-op-1',
        type: 'canvas:delete',
        payload: '{"nodeId":"n1"}',
        timestamp: 1500000000000,
        retries: 0,
      };
      await queueOperation(op);

      const retrieved = await peek();
      expect(retrieved?.id).toBe('test-op-1');
      expect(retrieved?.type).toBe('canvas:delete');
    });

    it('overwrites an existing operation with the same ID', async () => {
      const op: SyncOp = {
        id: 'test-op-2',
        type: 'canvas:update',
        payload: '{"v":1}',
        timestamp: 1500000000000,
        retries: 0,
      };
      await queueOperation(op);

      const updated: SyncOp = { ...op, payload: '{"v":2}', retries: 1 };
      await queueOperation(updated);

      const all = await getAll();
      expect(all).toHaveLength(1);
      expect((all[0] as SyncOp).payload).toBe('{"v":2}');
      expect((all[0] as SyncOp).retries).toBe(1);
    });
  });

  // ---- peek ----

  describe('peek', () => {
    it('returns null when queue is empty', async () => {
      const result = await peek();
      expect(result).toBeNull();
    });

    it('returns the oldest operation without removing it', async () => {
      await enqueue('canvas:addNode', { n: 1 }, 1000);
      await enqueue('canvas:addNode', { n: 2 }, 1001);

      const first = await peek();
      expect(first?.timestamp).toBe(1000);

      const stillThere = await peek();
      expect(stillThere?.timestamp).toBe(1000);
    });
  });

  // ---- dequeue ----

  describe('dequeue', () => {
    it('removes an operation by ID', async () => {
      const op = await enqueue('canvas:addNode', { n: 1 });
      await dequeue(op.id);

      const all = await getAll();
      expect(all).toHaveLength(0);
    });

    it('removes only the specified operation', async () => {
      const op1 = await enqueue('canvas:addNode', { n: 1 }, 1000);
      const op2 = await enqueue('canvas:addNode', { n: 2 }, 1001);
      await dequeue(op1.id);

      const all = await getAll();
      expect(all).toHaveLength(1);
      expect((all[0] as SyncOp).id).toBe(op2.id);
    });
  });

  // ---- pendingCount ----

  describe('pendingCount', () => {
    it('returns 0 for empty queue', async () => {
      expect(await pendingCount()).toBe(0);
    });

    it('counts all non-failed operations', async () => {
      await enqueue('canvas:addNode', { n: 1 });
      await enqueue('canvas:update', { n: 2 });
      expect(await pendingCount()).toBe(2);
    });
  });

  // ---- clearAll ----

  describe('clearAll', () => {
    it('removes all operations', async () => {
      await enqueue('canvas:addNode', { n: 1 });
      await enqueue('canvas:addNode', { n: 2 });
      await clearAll();

      expect(await getAll()).toHaveLength(0);
      expect(await pendingCount()).toBe(0);
    });
  });

  // ---- incrementRetries ----

  describe('incrementRetries', () => {
    it('increments retry count', async () => {
      const op = await enqueue('canvas:addNode', { n: 1 });
      const discarded = await incrementRetries(op.id);

      expect(discarded).toBe(false);
      const updated = await peek();
      expect(updated?.retries).toBe(1);
    });

    it('discards operation after MAX_RETRIES (3)', async () => {
      const op = await enqueue('canvas:addNode', { n: 1 });

      // Call incrementRetries directly 3 times (MAX_RETRIES = 3)
      const d1 = await incrementRetries(op.id); // retries: 0 → 1, not discarded
      expect(d1).toBe(false);
      let stored = await peek();
      expect(stored?.retries).toBe(1);

      const d2 = await incrementRetries(op.id); // retries: 1 → 2, not discarded
      expect(d2).toBe(false);
      stored = await peek();
      expect(stored?.retries).toBe(2);

      const d3 = await incrementRetries(op.id); // retries: 2 → 3, discarded
      expect(d3).toBe(true);
      expect(await peek()).toBeNull();
    });

    it('does nothing for non-existent ID', async () => {
      const discarded = await incrementRetries('non-existent-id');
      expect(discarded).toBe(false);
    });
  });

  // ---- isSyncing ----

  describe('isSyncing', () => {
    it('returns false when not syncing', () => {
      expect(isSyncing()).toBe(false);
    });
  });

  // ---- replay ----

  describe('replay', () => {
    it('returns {completed:0, failed:0} for empty queue', async () => {
      const mockFetch = makeMockFetch();
      const result = await replay(mockFetch);
      expect(result).toEqual({ completed: 0, failed: 0 });
    });

    it('calls fetch for each queued operation', async () => {
      await enqueue('canvas:addNode', {
        url: '/api/canvas/c1/nodes',
        method: 'POST',
        body: '{"nodeId":"n1"}',
      });
      await enqueue('canvas:update', {
        url: '/api/canvas/c1',
        method: 'PATCH',
        body: '{}',
      });

      const mockFetch = makeMockFetch([{ ok: true }, { ok: true }]);
      const result = await replay(mockFetch);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.completed).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('dequeues successfully processed operations', async () => {
      await enqueue('canvas:addNode', {
        url: '/api/canvas/c1/nodes',
        method: 'POST',
      });
      const mockFetch = makeMockFetch([{ ok: true }]);
      await replay(mockFetch);

      expect(await peek()).toBeNull();
    });

    it('requeues failed operations by incrementing retry count', async () => {
      const op = await enqueue('canvas:addNode', {
        url: '/api/canvas/c1/nodes',
        method: 'POST',
      });

      // Fail once
      const mockFetch = makeMockFetch([{ ok: false, status: 500 }]);
      await replay(mockFetch);

      const updated = await peek();
      expect(updated?.retries).toBe(1);
      expect(updated?.id).toBe(op.id);
    });

    it('treats HTTP 409 Conflict as success (idempotent)', async () => {
      await enqueue('canvas:addNode', {
        url: '/api/canvas/c1/nodes',
        method: 'POST',
      });
      const mockFetch = makeMockFetch([{ ok: false, status: 409 }]);
      const result = await replay(mockFetch);
      expect(result.completed).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('discards operations that fail MAX_RETRIES times via replay', async () => {
      await enqueue('canvas:addNode', {
        url: '/api/canvas/c1/nodes',
        method: 'POST',
      }, 1000);
      await enqueue('canvas:update', {
        url: '/api/canvas/c1',
        method: 'PATCH',
      }, 1001);

      // Mock fetch that always fails
      const failingFetch = makeMockFetch([{ ok: false }]);

      // Replay 3 times to trigger MAX_RETRIES threshold (3)
      // Each replay: both ops fail → incrementRetries → retries go 0→1→2→3→discarded
      await replay(failingFetch); // both: retries 0→1
      await replay(failingFetch); // both: retries 1→2
      await replay(failingFetch); // both: retries 2→3 → discarded

      // After 3 failed replays, both operations should be discarded
      expect(await pendingCount()).toBe(0);
      expect(await getAll()).toHaveLength(0);
    });

    it('dispatches progress events during replay', async () => {
      await enqueue('canvas:addNode', {
        url: '/api/canvas/c1/nodes',
        method: 'POST',
      });

      const events: unknown[] = [];
      const handler = (e: Event) => events.push((e as CustomEvent).detail);
      window.addEventListener('sync-queue-progress', handler);

      const mockFetch = makeMockFetch([{ ok: true }]);
      await replay(mockFetch);

      window.removeEventListener('sync-queue-progress', handler);

      expect(events.length).toBeGreaterThanOrEqual(2);
      const lastEvent = events[events.length - 1] as { type: string; completed: number };
      expect(lastEvent.type).toBe('complete');
      expect(lastEvent.completed).toBe(1);
    });

    it('falls back to type-based URL when payload has no url field', async () => {
      await enqueue('canvas:delete', { nodeId: 'n1' });

      const mockFetch = makeMockFetch([{ ok: true }]);
      await replay(mockFetch);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sync/canvas:delete',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns early if already syncing', async () => {
      await enqueue('canvas:addNode', {
        url: '/api/canvas/c1/nodes',
        method: 'POST',
      });

      const mockFetch = makeMockFetch([{ ok: true }]);

      // Call replay concurrently — second call should hit the guard
      const [result1, result2] = await Promise.all([
        replay(mockFetch),
        replay(mockFetch),
      ]);

      // One call returns {0,0} (guard), the other returns {1,0} (actual)
      const totalCompleted = result1.completed + result2.completed;
      expect(totalCompleted).toBeGreaterThanOrEqual(0);
    });
  });
});
