/**
 * Offline Request Queue — IndexedDB-backed write queue
 * Epic: F1.3-U1 离线写入队列
 *
 * Queues non-GET requests when offline and replays them when back online.
 * Uses timestamp as idempotency key for safe replay.
 *
 * @module lib/offline-queue
 */

// ==================== Constants ====================

const DB_NAME = 'vibex-offline';
const DB_VERSION = 1;
const STORE_NAME = 'request-queue';
const MAX_RETRIES = 3;

// ==================== Types ====================

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: string | null;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

export interface ReplayProgressEvent {
  type: 'progress' | 'complete' | 'error';
  total: number;
  completed: number;
  failed: number;
  lastError?: string;
}

// ==================== DB Helpers ====================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction(mode: IDBTransactionMode): Promise<{
  store: IDBObjectStore;
  db: IDBDatabase;
}> {
  return openDB().then((db) => {
    const tx = db.transaction(STORE_NAME, mode);
    return { store: tx.objectStore(STORE_NAME), db };
  });
}

// ==================== Core API ====================

/** Generate a stable idempotency key based on timestamp + URL */
function makeIdempotencyKey(timestamp: number, url: string, method: string): string {
  return `${timestamp}-${method}-${url}`;
}

/** Add a request to the offline queue */
export async function enqueueRequest(req: Omit<QueuedRequest, 'id' | 'retryCount'>): Promise<string> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const id = makeIdempotencyKey(req.timestamp, req.url, req.method);

  const queued: QueuedRequest = {
    ...req,
    id,
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(queued);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/** Remove a request from the queue */
export async function dequeueRequest(id: string): Promise<void> {
  const { store } = await transaction('readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** Get all queued requests, ordered by timestamp */
export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const { store } = await transaction('readonly');
  return new Promise((resolve, reject) => {
    const request = store.index('timestamp').getAll();
    request.onsuccess = () => resolve(request.result as QueuedRequest[]);
    request.onerror = () => reject(request.error);
  });
}

/** Get count of pending requests */
export async function getPendingCount(): Promise<number> {
  const requests = await getQueuedRequests();
  return requests.filter((r) => r.retryCount < MAX_RETRIES).length;
}

/** Clear all queued requests */
export async function clearQueue(): Promise<void> {
  const { store } = await transaction('readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ==================== Replay ====================

let isReplaying = false;

/** Dispatch a replay progress event */
function dispatchProgress(event: ReplayProgressEvent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-replay-progress', { detail: event }));
  }
}

/** Replay all queued requests in timestamp order */
export async function replayQueue(): Promise<{
  completed: number;
  failed: number;
}> {
  if (isReplaying) {
    return { completed: 0, failed: 0 };
  }
  isReplaying = true;

  const requests = await getQueuedRequests();
  let completed = 0;
  let failed = 0;

  dispatchProgress({ type: 'progress', total: requests.length, completed, failed });

  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        // Use cache mode that avoids browser cache for idempotent replay
        cache: 'no-cache',
        // Credentials: include for auth cookies if needed
        credentials: 'include',
      });

      if (response.ok || response.status === 409) {
        // Success or conflict (already processed — idempotent)
        await dequeueRequest(req.id);
        completed++;
      } else {
        // Retry: increment retryCount and keep in queue
        await incrementRetryCount(req.id);
        failed++;
      }
    } catch {
      // Network error — retry
      await incrementRetryCount(req.id);
      failed++;
    }

    dispatchProgress({ type: 'progress', total: requests.length, completed, failed });
  }

  isReplaying = false;
  dispatchProgress({ type: 'complete', total: requests.length, completed, failed });

  return { completed, failed };
}

/** Increment retryCount for a request */
async function incrementRetryCount(id: string): Promise<void> {
  const { store, db } = await transaction('readwrite');
  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const req = getReq.result as QueuedRequest;
      if (req) {
        req.retryCount += 1;
        const putReq = store.put(req);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
    db.close();
  });
}

/** Check if replay is currently in progress */
export function isReplayInProgress(): boolean {
  return isReplaying;
}

// ==================== Feature Flag ====================

/** Whether offline queue is enabled (read from window env) */
export function isOfflineQueueEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // Default to true in development
  if (process.env.NODE_ENV === 'development') return true;
  return process.env.NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE === 'true';
}
