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

// ==================== E5: Cloud Backup + Undo/Redo Helpers ====================

/** Canvas data structure for offline caching */
export interface CachedCanvasData {
  canvasId: string;
  data: {
    nodes?: unknown[];
    edges?: unknown[];
    metadata?: Record<string, unknown>;
  };
  cachedAt: number;
  expiresAt: number;
}

const CANVAS_DB_NAME = 'vibex-canvas-cache';
const CANVAS_DB_VERSION = 1;
const CANVAS_STORE_NAME = 'canvas-cache';
const MAX_CACHED_CANVASES = 5;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function openCanvasDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CANVAS_DB_NAME, CANVAS_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CANVAS_STORE_NAME)) {
        const store = db.createObjectStore(CANVAS_STORE_NAME, { keyPath: 'canvasId' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * E5-D5.2: Queue a cloud backup request when offline.
 * Queues the canvas data snapshot for upload when back online.
 */
export async function queueCloudBackup(
  canvasId: string,
  data: CachedCanvasData['data']
): Promise<void> {
  // Also cache locally first
  await cacheCanvasData(canvasId, data);
  // Then queue the API backup request
  const url = `/api/backup/${encodeURIComponent(canvasId)}`;
  await enqueueRequest({
    url,
    method: 'POST',
    body: JSON.stringify({ canvasId, data, timestamp: Date.now() }),
    headers: { 'Content-Type': 'application/json' },
    timestamp: Date.now(),
  });
}

/**
 * E5-D5.2: Queue an undo/redo operation when offline.
 * Preserves the action type for replay with conflict detection.
 */
export async function queueUndoRedo(
  action: 'undo' | 'redo',
  canvasId: string,
  context?: { nodeId?: string; snapshot?: unknown }
): Promise<void> {
  const url = `/api/canvas/${encodeURIComponent(canvasId)}/${action}`;
  await enqueueRequest({
    url,
    method: 'POST',
    body: JSON.stringify({ canvasId, action, context, timestamp: Date.now() }),
    headers: { 'Content-Type': 'application/json' },
    timestamp: Date.now(),
  });
}

/**
 * E5-D5.5: Cache canvas data locally (last 5 canvases, 7-day TTL).
 * Called automatically when canvas data changes or is backed up.
 */
export async function cacheCanvasData(
  canvasId: string,
  data: CachedCanvasData['data']
): Promise<void> {
  const db = await openCanvasDB();
  const tx = db.transaction(CANVAS_STORE_NAME, 'readwrite');
  const store = tx.objectStore(CANVAS_STORE_NAME);

  const now = Date.now();
  const entry: CachedCanvasData = {
    canvasId,
    data,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(entry);
    request.onsuccess = async () => {
      // Enforce max 5 canvases — evict oldest
      await evictOldestCanvases(store);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/** Evict oldest cached canvases if > MAX_CACHED_CANVASES */
async function evictOldestCanvases(store: IDBObjectStore): Promise<void> {
  return new Promise((resolve, reject) => {
    const getAllReq = store.index('cachedAt').getAll();
    getAllReq.onsuccess = () => {
      const all: CachedCanvasData[] = getAllReq.result;
      if (all.length <= MAX_CACHED_CANVASES) {
        resolve();
        return;
      }
      const toEvict = all
        .sort((a, b) => a.cachedAt - b.cachedAt)
        .slice(0, all.length - MAX_CACHED_CANVASES);

      let pending = toEvict.length;
      for (const item of toEvict) {
        const delReq = store.delete(item.canvasId);
        delReq.onsuccess = () => {
          pending--;
          if (pending === 0) resolve();
        };
        delReq.onerror = () => {
          pending--;
          if (pending === 0) resolve();
        };
      }
    };
    getAllReq.onerror = () => reject(getAllReq.error);
  });
}

/** Get a cached canvas by ID (returns null if expired or not found) */
export async function getCachedCanvasData(
  canvasId: string
): Promise<CachedCanvasData | null> {
  const db = await openCanvasDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CANVAS_STORE_NAME, 'readonly');
    const store = tx.objectStore(CANVAS_STORE_NAME);
    const req = store.get(canvasId);
    req.onsuccess = () => {
      const entry: CachedCanvasData | undefined = req.result;
      if (!entry) {
        resolve(null);
        return;
      }
      if (Date.now() > entry.expiresAt) {
        // Expired — delete and return null
        const delTx = db.transaction(CANVAS_STORE_NAME, 'readwrite');
        delTx.objectStore(CANVAS_STORE_NAME).delete(canvasId);
        resolve(null);
      } else {
        resolve(entry);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/** Get all valid (non-expired) cached canvases */
export async function getAllCachedCanvases(): Promise<CachedCanvasData[]> {
  const db = await openCanvasDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CANVAS_STORE_NAME, 'readonly');
    const store = tx.objectStore(CANVAS_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const now = Date.now();
      const valid = (req.result as CachedCanvasData[]).filter(
        (e) => e.expiresAt > now
      );
      resolve(valid);
    };
    req.onerror = () => reject(req.error);
  });
}

// ==================== Feature Flag ====================

/** Whether offline queue is enabled (read from window env) */
export function isOfflineQueueEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // Default to true in development
  if (process.env.NODE_ENV === 'development') return true;
  return process.env.NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE === 'true';
}

// ==================== S63-E3: Canvas Operation Queue ====================
// Separate IndexedDB store for canvas CRUD operations (card/edge add/update/delete).
// Triggered when offline; replayed when back online.
// D3.1

export interface CanvasOp {
  type: 'addNode' | 'updateNode' | 'deleteNode' | 'addEdge' | 'deleteEdge' | 'addCrossChapterEdge' | 'deleteCrossChapterEdge';
  payload: unknown;
  canvasId: string;
  chapter?: string;
  timestamp: number;
}

const CANVAS_OP_DB_NAME = 'vibex-canvas-ops';
const CANVAS_OP_DB_VERSION = 1;
const CANVAS_OP_STORE_NAME = 'canvas-op-queue';

function openCanvasOpDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CANVAS_OP_DB_NAME, CANVAS_OP_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CANVAS_OP_STORE_NAME)) {
        const store = db.createObjectStore(CANVAS_OP_STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('canvasId', 'canvasId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function canvasOpTransaction(mode: IDBTransactionMode): Promise<{ store: IDBObjectStore; db: IDBDatabase }> {
  return openCanvasOpDB().then((db) => {
    const tx = db.transaction(CANVAS_OP_STORE_NAME, mode);
    return { store: tx.objectStore(CANVAS_OP_STORE_NAME), db };
  });
}

/**
 * D3.1: Queue a canvas operation (addNode / updateNode / deleteNode / addEdge / deleteEdge / etc.)
 * for replay when back online.
 * The operation is NOT executed locally — it is queued for server sync.
 */
export async function queueCanvasOp(op: Omit<CanvasOp, 'timestamp'>): Promise<string> {
  const { store, db } = await canvasOpTransaction('readwrite');
  const id = `${op.type}-${op.canvasId}-${Date.now()}`;
  const record: CanvasOp & { id: string } = { ...op, id, timestamp: Date.now() };
  return new Promise((resolve, reject) => {
    const request = store.add(record);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
    db.close();
  });
}

/**
 * D3.1: Get the number of pending canvas operations in the queue.
 */
export async function getQueueSize(): Promise<number> {
  const { store, db } = await canvasOpTransaction('readonly');
  return new Promise((resolve, reject) => {
    const request = store.count();
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

/** Dispatch canvas-op-conflict event when a conflict is detected during replay */
function dispatchCanvasConflict(op: CanvasOp, remoteData: unknown): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('canvas-op-conflict', { detail: { op, remoteData } }));
  }
}

/**
 * D3.1 + D3.3 + D3.4: Replay all queued canvas operations when back online.
 * Calls the appropriate API endpoint for each operation type.
 * On conflict (HTTP 409), dispatches 'canvas-op-conflict' event for E2 ConflictDialog integration.
 * Returns { completed, failed, conflicts } counts.
 */
export async function syncOfflineQueue(): Promise<{
  completed: number;
  failed: number;
  conflicts: number;
}> {
  const { store, db } = await canvasOpTransaction('readonly');
  const ops: (CanvasOp & { id: string })[] = await new Promise((resolve, reject) => {
    const req = store.index('timestamp').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();

  let completed = 0;
  let failed = 0;
  let conflicts = 0;

  for (const op of ops) {
    try {
      const endpoint = buildCanvasOpEndpoint(op);
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op.payload),
        cache: 'no-cache',
        credentials: 'include',
      });

      if (response.ok) {
        // Success — remove from queue
        await removeCanvasOp(op.id);
        completed++;
      } else if (response.status === 409) {
        // Conflict — keep in queue, dispatch event for ConflictDialog
        conflicts++;
        const remoteData = await response.json().catch(() => null);
        dispatchCanvasConflict(op, remoteData);
        failed++;
      } else {
        // Other error — keep in queue for retry
        failed++;
      }
    } catch {
      // Network error — keep in queue for retry
      failed++;
    }
  }

  return { completed, failed, conflicts };
}

/** Build fetch URL/method for a canvas operation */
function buildCanvasOpEndpoint(op: CanvasOp): { url: string; method: string } {
  const base = '/api/canvas';
  switch (op.type) {
    case 'addNode':
      return { url: `${base}/${op.canvasId}/nodes`, method: 'POST' };
    case 'updateNode':
      return { url: `${base}/${op.canvasId}/nodes/${(op.payload as { nodeId: string }).nodeId}`, method: 'PATCH' };
    case 'deleteNode':
      return { url: `${base}/${op.canvasId}/nodes/${(op.payload as { nodeId: string }).nodeId}`, method: 'DELETE' };
    case 'addEdge':
      return { url: `${base}/${op.canvasId}/edges`, method: 'POST' };
    case 'deleteEdge':
      return { url: `${base}/${op.canvasId}/edges/${(op.payload as { edgeId: string }).edgeId}`, method: 'DELETE' };
    case 'addCrossChapterEdge':
      return { url: `${base}/${op.canvasId}/cross-chapter-edges`, method: 'POST' };
    case 'deleteCrossChapterEdge':
      return { url: `${base}/${op.canvasId}/cross-chapter-edges/${(op.payload as { edgeId: string }).edgeId}`, method: 'DELETE' };
    default:
      return { url: `${base}/${op.canvasId}/ops`, method: 'POST' };
  }
}

/** Remove a canvas op from the queue (after successful replay or user resolution) */
async function removeCanvasOp(id: string): Promise<void> {
  const { store, db } = await canvasOpTransaction('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => { db.close(); resolve(); };
    req.onerror = () => reject(req.error);
  });
}

/** Check if navigator.onLine */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}
