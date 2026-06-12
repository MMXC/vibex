/**
 * syncQueue.ts — S93-E3: Offline-First PWA Enhancement
 *
 * Core sync queue using the `idb` library for IndexedDB persistence.
 * Queue operations (SyncOp) are persisted so they survive page refreshes.
 * On reconnect, operations are replayed in FIFO order.
 *
 * @module lib/offline/syncQueue
 */

import { openDB, type IDBPDatabase } from 'idb';

// ==================== Constants ====================

const DB_NAME = 'vibex-sync-queue';
const DB_VERSION = 1;
const STORE_NAME = 'operations';
const MAX_RETRIES = 3;

// ==================== Types ====================

/** A syncable operation entry */
export interface SyncOp {
  /** Unique operation ID */
  id: string;
  /** Operation type (e.g. 'canvas:update', 'canvas:addNode') */
  type: string;
  /** Serialized operation payload */
  payload: string;
  /** When this operation was queued (ms since epoch) */
  timestamp: number;
  /** Number of times this operation has been retried */
  retries: number;
}

/** Result of a sync replay attempt */
export interface SyncResult {
  completed: number;
  failed: number;
}

/** Progress event during sync replay */
export interface SyncProgressEvent {
  type: 'progress' | 'complete';
  total: number;
  completed: number;
  failed: number;
}

// ==================== DB Setup ====================

let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;

  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    },
  });

  return _db;
}

// ==================== Core Queue API ====================

/**
 * Generate a stable unique ID for an operation.
 * Uses timestamp + type to create an idempotent key.
 */
export function generateOpId(type: string, timestamp: number): string {
  return `op_${timestamp}_${type.replace(/[^a-z0-9]/gi, '_')}`;
}

/**
 * Queue a SyncOp to IndexedDB.
 * Persists the operation so it survives page refreshes.
 *
 * @param op - The operation to queue (id, type, payload, timestamp, retries)
 * @throws If IndexedDB is unavailable
 */
export async function queueOperation(op: SyncOp): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, {
    id: op.id,
    type: op.type,
    payload: op.payload,
    timestamp: op.timestamp,
    retries: op.retries,
  });
}

/**
 * Create and queue a new SyncOp from its constituent parts.
 * Generates a stable ID automatically.
 *
 * @param type - Operation type string
 * @param payload - JSON-serializable payload (will be stringified)
 * @param timestamp - Optional timestamp (defaults to Date.now())
 */
export async function enqueue(
  type: string,
  payload: unknown,
  timestamp = Date.now()
): Promise<SyncOp> {
  const id = generateOpId(type, timestamp);
  const op: SyncOp = {
    id,
    type,
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
    timestamp,
    retries: 0,
  };
  await queueOperation(op);
  return op;
}

/**
 * Dequeue (peek) the next SyncOp in FIFO order.
 * Does NOT remove the operation — use dequeueAndRemove() to consume it.
 *
 * @returns The oldest queued operation, or null if queue is empty
 */
export async function peek(): Promise<SyncOp | null> {
  const db = await getDB();
  const all = await db.getAllFromIndex(STORE_NAME, 'timestamp');
  return all.length > 0 ? (all[0] as SyncOp) : null;
}

/**
 * Dequeue and remove a SyncOp from the queue.
 *
 * @param id - The operation ID to remove
 */
export async function dequeue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Get all queued operations, ordered by timestamp (oldest first).
 */
export async function getAll(): Promise<SyncOp[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(STORE_NAME, 'timestamp');
  return all as SyncOp[];
}

/**
 * Get the count of pending (non-failed) operations.
 * Operations with retries >= MAX_RETRIES are considered permanently failed.
 */
export async function pendingCount(): Promise<number> {
  const all = await getAll();
  return all.filter((op) => op.retries < MAX_RETRIES).length;
}

/**
 * Clear all operations from the queue.
 */
export async function clearAll(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/**
 * Increment the retry count for an operation.
 * If retries >= MAX_RETRIES, the operation is discarded.
 *
 * @returns true if operation was discarded (max retries reached), false otherwise
 */
export async function incrementRetries(id: string): Promise<boolean> {
  const db = await getDB();
  const op = (await db.get(STORE_NAME, id)) as SyncOp | undefined;
  if (!op) return false;

  op.retries += 1;
  if (op.retries >= MAX_RETRIES) {
    await db.delete(STORE_NAME, id);
    return true; // discarded
  }
  await db.put(STORE_NAME, op);
  return false;
}

// ==================== Replay Engine ====================

let _isSyncing = false;

/**
 * Check if a sync is currently in progress.
 */
export function isSyncing(): boolean {
  return _isSyncing;
}

/**
 * Dispatch a sync progress event on the window (for React listeners).
 */
function dispatchProgress(event: SyncProgressEvent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sync-queue-progress', { detail: event })
    );
  }
}

/**
 * Replay all queued operations in FIFO order.
 * Each operation is sent to the appropriate API endpoint based on its type.
 * Operations that succeed (HTTP 2xx or 409 Conflict) are dequeued.
 * Operations that fail are retried (up to MAX_RETRIES) then discarded.
 *
 * @param fetchFn - Optional fetch override for testing
 * @returns SyncResult with completed/failed counts
 */
export async function replay(
  fetchFn: typeof fetch = fetch
): Promise<SyncResult> {
  if (_isSyncing) return { completed: 0, failed: 0 };
  _isSyncing = true;

  const ops = await getAll();
  let completed = 0;
  let failed = 0;

  dispatchProgress({ type: 'progress', total: ops.length, completed, failed });

  for (const op of ops) {
    const success = await replayOperation(op, fetchFn);

    if (success) {
      await dequeue(op.id);
      completed++;
    } else {
      const discarded = await incrementRetries(op.id);
      if (discarded) failed++;
    }

    dispatchProgress({
      type: 'progress',
      total: ops.length,
      completed,
      failed,
    });
  }

  _isSyncing = false;
  dispatchProgress({ type: 'complete', total: ops.length, completed, failed });

  return { completed, failed };
}

/**
 * Replay a single SyncOp by dispatching an API request.
 * Subclasses/extensions can override this for custom operation types.
 *
 * @returns true if the operation succeeded, false if it should be retried
 */
async function replayOperation(
  op: SyncOp,
  fetchFn: typeof fetch
): Promise<boolean> {
  try {
    // Parse payload to extract URL and method
    let url: string;
    let method: string;
    let body: string | null;
    let headers: Record<string, string>;

    try {
      const parsed = JSON.parse(op.payload);
      url = parsed.url ?? `/api/sync/${op.type}`;
      method = parsed.method ?? 'POST';
      body = parsed.body ?? null;
      headers = parsed.headers ?? { 'Content-Type': 'application/json' };
    } catch {
      // Non-JSON payload — treat as direct type-based dispatch
      url = `/api/sync/${op.type}`;
      method = 'POST';
      body = op.payload;
      headers = { 'Content-Type': 'application/json' };
    }

    const response = await fetchFn(url, {
      method,
      headers,
      body,
      cache: 'no-cache',
      credentials: 'include',
    });

    // 2xx = success; 409 = conflict (already processed = idempotent success)
    return response.ok || response.status === 409;
  } catch {
    // Network error
    return false;
  }
}

// ==================== Background Sync Integration ====================

/**
 * Register a Background Sync event with the Service Worker.
 * Falls back gracefully if Background Sync is not supported.
 *
 * @param tag - Unique tag for this sync (e.g. 'vibex-sync')
 */
export async function registerBackgroundSync(tag = 'vibex-sync'): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('sync' in ServiceWorkerRegistration.prototype)
  ) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
  } catch {
    // Background Sync not supported or denied — fallback to online event
  }
}

// ==================== Feature Flag ====================

/**
 * Whether the sync queue feature is enabled.
 */
export function isSyncQueueEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV === 'development') return true;
  return process.env.NEXT_PUBLIC_ENABLE_SYNC_QUEUE === 'true';
}
