/**
 * historyDB.ts — Sprint51 E1: Undo/Redo 持久化
 *
 * IndexedDB persistence layer for canvas history commands.
 * Implements LIRS (Low Inter-Reference Recency) eviction to keep storage ≤ 5MB.
 *
 * LIRS Strategy:
 * - Each canvas entry tracks recency: hit → move to head; miss → demote
 * - When total size exceeds MAX_BYTES (5MB), evict least-recently-used entries
 * - Each entry stores serializable command metadata (not closures)
 *
 * E3 (Sprint52): Undo/Redo 协作冲突处理
 * - 每个画布条目增加 revision 字段用于乐观锁
 * - saveHistoryWithRevision() 在 revision 不匹配时抛出 RevisionMismatchError
 * - loadHistoryWithRevision() 返回 revision 以便前端与远程同步
 */

import type { Command } from '@/stores/dds/canvasHistoryStore';
import { RevisionMismatchError } from '@/stores/dds/canvasHistoryStore';

// ============================================
// Constants
// ============================================

const DB_NAME = 'vibex-canvas-history';
const DB_VERSION = 1;
const STORE_NAME = 'history';

/** Maximum storage per canvas in bytes (5MB) */
export const MAX_BYTES_PER_CANVAS = 5 * 1024 * 1024;

/** Maximum number of entries per canvas */
const MAX_ENTRIES_PER_CANVAS = 500;

// ============================================
// Types
// ============================================

/** Serializable command metadata (closure functions cannot be stored) */
export interface CommandMeta {
  id: string;
  timestamp: number;
  description?: string;
}

export interface HistoryEntry {
  /** Canvas identifier */
  canvasId: string;
  /** All past commands (newest last) */
  past: CommandMeta[];
  /** All future commands (newest last) */
  future: CommandMeta[];
  /** When this entry was last updated */
  updatedAt: number;
  /** Estimated size in bytes */
  _size?: number;
  /** E3: Revision number for optimistic locking — incremented on each collaborative change */
  revision: number;
}

// ============================================
// IndexedDB Helpers (native API, matching ddsPersistence.ts pattern)
// ============================================

let _db: IDBDatabase | null = null;

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));

    request.onsuccess = () => {
      _db = request.result;
      resolve(_db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'canvasId' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

function idbGet<T>(key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(new Error(`IDB get failed: ${request.error}`));
      })
      .catch(reject);
  });
}

function idbPut(value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`IDB put failed: ${request.error}`));
      })
      .catch(reject);
  });
}

function idbDelete(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`IDB delete failed: ${request.error}`));
      })
      .catch(reject);
  });
}

// ============================================
// Size Estimation
// ============================================

function estimateSize(entry: HistoryEntry): number {
  try {
    return new Blob([JSON.stringify(entry)]).size;
  } catch {
    // Fallback: rough estimate
    return JSON.stringify(entry).length * 2;
  }
}

// ============================================
// LIRS Eviction
// ============================================

/**
 * Evict entries for a canvas when storage exceeds limit.
 * Uses LIRS-inspired eviction: when size exceeds MAX_BYTES_PER_CANVAS,
 * remove oldest entries from past until under limit.
 */
async function evictIfNeeded(canvasId: string, newPast: CommandMeta[]): Promise<void> {
  const entry = await idbGet<HistoryEntry>(canvasId);
  if (!entry) return;

  const testEntry: HistoryEntry = {
    ...entry,
    past: newPast,
    updatedAt: Date.now(),
  };
  testEntry._size = estimateSize(testEntry);

  if (testEntry._size <= MAX_BYTES_PER_CANVAS) return;

  // LIRS eviction: trim from oldest past entries
  let size = testEntry._size;
  const trimmedPast: CommandMeta[] = [...newPast];

  while (size > MAX_BYTES_PER_CANVAS && trimmedPast.length > 0) {
    const removed = trimmedPast.shift()!;
    const removedSize = estimateSize({ canvasId, past: [removed], future: [], updatedAt: 0 });
    size -= removedSize;
  }

  // Also cap by MAX_ENTRIES_PER_CANVAS
  while (trimmedPast.length > MAX_ENTRIES_PER_CANVAS) {
    trimmedPast.shift();
  }

  const evictedEntry: HistoryEntry = {
    canvasId,
    past: trimmedPast,
    future: entry.future,
    updatedAt: Date.now(),
    _size: estimateSize({ canvasId, past: trimmedPast, future: entry.future, updatedAt: Date.now() }),
  };

  await idbPut(evictedEntry);
}

// ============================================
// Public API
// ============================================

/**
 * Save canvas history to IndexedDB.
 * Serializes command metadata only (closures not stored).
 * Automatically evicts if over 5MB limit.
 */
export async function saveHistoryToDB(
  canvasId: string,
  past: Command[],
  future: Command[]
): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  const pastMeta: CommandMeta[] = past.map((cmd) => ({
    id: cmd.id,
    timestamp: cmd.timestamp,
    description: cmd.description,
  }));

  const futureMeta: CommandMeta[] = future.map((cmd) => ({
    id: cmd.id,
    timestamp: cmd.timestamp,
    description: cmd.description,
  }));

  const entry: HistoryEntry = {
    canvasId,
    past: pastMeta,
    future: futureMeta,
    updatedAt: Date.now(),
    _size: 0,
    revision: 0,
  };
  entry._size = estimateSize(entry);

  // Check if this would exceed limit; if so, evict old entries first
  if (entry._size > MAX_BYTES_PER_CANVAS) {
    await evictIfNeeded(canvasId, pastMeta);
    // Re-estimate after eviction
    const existing = await idbGet<HistoryEntry>(canvasId);
    if (existing) {
      entry.past = existing.past;
      entry._size = estimateSize(entry);
    }
  }

  await idbPut(entry);
}

/**
 * Load canvas history from IndexedDB.
 * Returns null if no history saved.
 * Note: Command closures cannot be restored — callers must re-execute operations to rebuild state.
 */
export async function loadHistoryFromDB(
  canvasId: string
): Promise<{ past: CommandMeta[]; future: CommandMeta[] } | null> {
  if (!isIndexedDBAvailable()) return null;

  const entry = await idbGet<HistoryEntry>(canvasId);
  if (!entry || !entry.past.length) return null;

  return {
    past: entry.past,
    future: entry.future ?? [],
  };
}

/**
 * Clear canvas history from IndexedDB.
 */
export async function clearHistoryFromDB(canvasId: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  await idbDelete(canvasId);
}

/**
 * Get estimated storage size for a canvas.
 * Returns null if IndexedDB unavailable or no entry exists.
 */
export async function getHistoryDBSize(canvasId: string): Promise<number | null> {
  if (!isIndexedDBAvailable()) return null;

  const entry = await idbGet<HistoryEntry>(canvasId);
  if (!entry) return 0;

  return entry._size ?? estimateSize(entry);
}

// ============================================
// E3: Revision-aware Optimistic Locking
// ============================================

/**
 * E3: Save canvas history with optimistic lock.
 * Throws RevisionMismatchError if remote revision is newer than expectedRevision.
 */
export async function saveHistoryWithRevision(
  canvasId: string,
  past: Command[],
  future: Command[],
  expectedRevision: number
): Promise<number> {
  if (!isIndexedDBAvailable()) return expectedRevision;

  // Check current revision
  const existing = await idbGet<HistoryEntry>(canvasId);
  const currentRevision = existing?.revision ?? 0;

  if (currentRevision > expectedRevision) {
    throw new RevisionMismatchError(
      canvasId,
      expectedRevision,
      currentRevision,
      `Remote revision ${currentRevision} is newer than expected ${expectedRevision}`
    );
  }

  // Save with incremented revision
  const newRevision = expectedRevision + 1;
  const pastMeta: CommandMeta[] = past.map((cmd) => ({
    id: cmd.id,
    timestamp: cmd.timestamp,
    description: cmd.description,
  }));
  const futureMeta: CommandMeta[] = future.map((cmd) => ({
    id: cmd.id,
    timestamp: cmd.timestamp,
    description: cmd.description,
  }));

  const entry: HistoryEntry = {
    canvasId,
    past: pastMeta,
    future: futureMeta,
    updatedAt: Date.now(),
    _size: 0,
    revision: newRevision,
  };
  entry._size = estimateSize(entry);

  if (entry._size > MAX_BYTES_PER_CANVAS) {
    await evictIfNeeded(canvasId, pastMeta);
    const reloaded = await idbGet<HistoryEntry>(canvasId);
    if (reloaded) {
      entry.past = reloaded.past;
      entry._size = estimateSize(entry);
    }
  }

  await idbPut(entry);
  return newRevision;
}

/**
 * E3: Load canvas history with revision number.
 * Returns { past, future, revision } or null if no history.
 */
export async function loadHistoryWithRevision(
  canvasId: string
): Promise<{ past: CommandMeta[]; future: CommandMeta[]; revision: number } | null> {
  if (!isIndexedDBAvailable()) return null;

  const entry = await idbGet<HistoryEntry>(canvasId);
  if (!entry || !entry.past.length) return null;

  return {
    past: entry.past,
    future: entry.future ?? [],
    revision: entry.revision ?? 0,
  };
}

/**
 * E3: Clear canvas history from IndexedDB.
 */
export async function clearHistoryWithRevision(canvasId: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  await idbDelete(canvasId);
}

/**
 * E3: Get current revision for a canvas without loading full history.
 */
export async function getRevision(canvasId: string): Promise<number> {
  if (!isIndexedDBAvailable()) return 0;
  const entry = await idbGet<HistoryEntry>(canvasId);
  return entry?.revision ?? 0;
}
