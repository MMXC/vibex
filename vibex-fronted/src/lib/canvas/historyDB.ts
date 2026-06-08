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
 *
 * E1 (Sprint58): 画布版本分支管理
 * - 新增 snapshots objectStore (DB_VERSION=2)
 * - saveSnapshotToDB/loadSnapshotFromDB/listSnapshotsFromDB/deleteSnapshotFromDB
 * - snapshots 表按 canvasId + snapshotId 复合主键
 *
 * E1 (Sprint60): 画布版本历史 UI 增强
 * - DB_VERSION=3：snapshots 表新增 branchName / isStarred 字段
 * - updateSnapshotMetadataInDB()：更新快照元数据
 *
 * E4 (Sprint73): 画布分支命名与保护
 * - DB_VERSION=5：新增 branchMeta objectStore (canvasId + branchName compound key)
 * - setBranchMeta/getBranchMeta/listBranchMetas/deleteBranchMeta
 * - BranchMeta: canvasId / branchName / name / isProtected / createdAt
 *
 * E3 (Sprint75): 分支对比历史记录
 * - DB_VERSION=6：新增 branchDiffHistory objectStore (canvasId + id compound key)
 * - saveBranchDiffHistoryToDB/listBranchDiffHistoryFromDB/clearBranchDiffHistoryFromDB
 * - BranchDiffHistoryEntry: canvasId / id / branchA / branchB / summary / timestamp
 */

import type { Command } from '@/stores/dds/canvasHistoryStore';
import { RevisionMismatchError } from '@/stores/dds/canvasHistoryStore';
import type { Snapshot } from '@/stores/dds/canvasHistoryStore';
import type { Notification } from '@/stores/notificationStore';

// ============================================
// Constants
// ============================================

const DB_NAME = 'vibex-canvas-history';
const DB_VERSION = 11; // E1 (Sprint80): notification_prefs objectStore
const STORE_NAME = 'history';
const SNAPSHOTS_STORE_NAME = 'snapshots';
const BRANCH_META_STORE_NAME = 'branchMeta';
const BRANCH_DIFF_HISTORY_STORE_NAME = 'branchDiffHistory';
const NOTIFICATIONS_STORE_NAME = 'notifications';
const CANVAS_CHANGE_LOG_STORE_NAME = 'canvasChangeLog';
const MERGE_HISTORY_STORE_NAME = 'mergeHistory';
const NOTIFICATION_PREFS_STORE_NAME = 'notification_prefs';

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
// E4 (Sprint73): Branch Metadata Types
// ============================================

/** Branch metadata record — stored in the branchMeta objectStore
 * E3 (Sprint77): extended with branchOwner field for permission control
 */
export interface BranchMeta {
  /** Canvas identifier */
  canvasId: string;
  /** Branch name (e.g., 'main', 'feature-xyz') */
  branchName: string;
  /** Human-readable display name (editable by user) */
  name: string;
  /** Whether this branch is protected from deletion */
  isProtected: boolean;
  /** When this branch was first created */
  createdAt: number;
  /** Owner user ID — only owner (or admin) can delete/merge branches */
  branchOwner: string;
}

// ============================================
// E3 (Sprint75): Branch Diff History Types
// ============================================

/** E3 (Sprint75): Summary snapshot of a branch diff result */
export interface BranchDiffHistorySummary {
  totalChanges: number;
  contextsAdded: number;
  contextsRemoved: number;
  contextsModified: number;
  edgesAdded: number;
  edgesRemoved: number;
  edgesModified: number;
}

/** E3 (Sprint75): Branch diff history entry — stored in the branchDiffHistory objectStore */
export interface BranchDiffHistoryEntry {
  /** Canvas identifier */
  canvasId: string;
  /** Unique ID for this entry (timestamp-based) */
  id: string;
  /** First branch name */
  branchA: string;
  /** Second branch name */
  branchB: string;
  /** Timestamp when comparison was made */
  timestamp: number;
  /** Summary of changes (for list display without loading full diff) */
  summary: BranchDiffHistorySummary;
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
      const oldVersion = event.oldVersion;
      // history store (v1)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'canvasId' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      // snapshots store (v2 — E1)
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE_NAME)) {
        // Compound key: canvasId + snapshotId
        const snapshotStore = db.createObjectStore(SNAPSHOTS_STORE_NAME, { keyPath: ['canvasId', 'snapshotId'] });
        snapshotStore.createIndex('canvasId', 'canvasId', { unique: false });
        snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
        snapshotStore.createIndex('branchName', 'branchName', { unique: false }); // E1 (Sprint66)
        snapshotStore.createIndex('parentSnapshotId', 'parentSnapshotId', { unique: false }); // E1 (Sprint66)
      } else if (oldVersion < 4) {
        // E1 (Sprint66): Add indexes for branch operations
        const snapshotStore = db.transaction(SNAPSHOTS_STORE_NAME, 'versionchange').objectStore(SNAPSHOTS_STORE_NAME);
        if (!snapshotStore.indexNames.contains('branchName')) {
          snapshotStore.createIndex('branchName', 'branchName', { unique: false });
        }
        if (!snapshotStore.indexNames.contains('parentSnapshotId')) {
          snapshotStore.createIndex('parentSnapshotId', 'parentSnapshotId', { unique: false });
        }
      }
      // E4 (Sprint73): branchMeta objectStore
      if (!db.objectStoreNames.contains(BRANCH_META_STORE_NAME)) {
        const metaStore = db.createObjectStore(BRANCH_META_STORE_NAME, { keyPath: ['canvasId', 'branchName'] });
        metaStore.createIndex('canvasId', 'canvasId', { unique: false });
        metaStore.createIndex('branchName', 'branchName', { unique: false });
        metaStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      // E3 (Sprint75): branchDiffHistory objectStore
      if (!db.objectStoreNames.contains(BRANCH_DIFF_HISTORY_STORE_NAME)) {
        const histStore = db.createObjectStore(BRANCH_DIFF_HISTORY_STORE_NAME, { keyPath: ['canvasId', 'id'] });
        histStore.createIndex('canvasId', 'canvasId', { unique: false });
        histStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // E1 (Sprint77): notifications objectStore
      if (!db.objectStoreNames.contains(NOTIFICATIONS_STORE_NAME)) {
        const notifStore = db.createObjectStore(NOTIFICATIONS_STORE_NAME, { keyPath: 'id' });
        notifStore.createIndex('userId', 'userId', { unique: false });
        notifStore.createIndex('canvasId', 'canvasId', { unique: false });
        notifStore.createIndex('isRead', 'isRead', { unique: false });
        notifStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // E4 (Sprint77): CanvasChangeLog objectStore
      if (!db.objectStoreNames.contains(CANVAS_CHANGE_LOG_STORE_NAME)) {
        const changeLogStore = db.createObjectStore(CANVAS_CHANGE_LOG_STORE_NAME, { keyPath: 'id' });
        changeLogStore.createIndex('canvasId', 'canvasId', { unique: false });
        changeLogStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // E5 (Sprint79): mergeHistory objectStore
      if (!db.objectStoreNames.contains(MERGE_HISTORY_STORE_NAME)) {
        const mergeStore = db.createObjectStore(MERGE_HISTORY_STORE_NAME, { keyPath: ['canvasId', 'id'] });
        mergeStore.createIndex('canvasId', 'canvasId', { unique: false });
        mergeStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // E1 (Sprint80): notification_prefs objectStore
      if (!db.objectStoreNames.contains(NOTIFICATION_PREFS_STORE_NAME)) {
        const prefsStore = db.createObjectStore(NOTIFICATION_PREFS_STORE_NAME, { keyPath: 'key' });
        prefsStore.createIndex('key', 'key', { unique: true });
      } else if (oldVersion < 11) {
        // Migration: recreate with unique key index
        db.deleteObjectStore(NOTIFICATION_PREFS_STORE_NAME);
        const prefsStore = db.createObjectStore(NOTIFICATION_PREFS_STORE_NAME, { keyPath: 'key' });
        prefsStore.createIndex('key', 'key', { unique: true });
      }
    };
  });
}

function idbGet<T>(key: string, storeName = STORE_NAME): Promise<T | null> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(new Error(`IDB get failed: ${request.error}`));
      })
      .catch(reject);
  });
}

function idbPut(value: unknown, storeName = STORE_NAME): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(value);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`IDB put failed: ${request.error}`));
      })
      .catch(reject);
  });
}

function idbDelete(key: IDBValidKey, storeName = STORE_NAME): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
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
// Public API — History Commands
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

// ============================================
// E1: Snapshot Persistence
// ============================================

/**
 * E1: Snapshot stored in IndexedDB with compound key (canvasId, snapshotId)
 * E1 (Sprint60): extended with branchName / isStarred
 * E1 (Sprint65): extended with parentSnapshotId for branch lineage
 */
interface SnapshotEntry {
  canvasId: string;
  snapshotId: string;
  name: string;
  timestamp: number;
  data: { nodes: unknown[]; edges: unknown[] };
  /** E1 (Sprint60): Branch name for version branching */
  branchName?: string;
  /** E1 (Sprint60): Whether this snapshot is starred */
  isStarred?: boolean;
  /** E1 (Sprint65): Parent snapshot ID for branch lineage */
  parentSnapshotId?: string | null;
}

function estimateSnapshotSize(entry: SnapshotEntry): number {
  try {
    return new Blob([JSON.stringify(entry)]).size;
  } catch {
    return JSON.stringify(entry).length * 2;
  }
}

/**
 * E1: Save a snapshot to IndexedDB snapshots store.
 * Compound key: [canvasId, snapshotId]
 * E1 (Sprint60): includes branchName / isStarred
 * E1 (Sprint65): includes parentSnapshotId
 */
export async function saveSnapshotToDB(canvasId: string, snapshot: Snapshot): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  const entry: SnapshotEntry = {
    canvasId,
    snapshotId: snapshot.id,
    name: snapshot.name,
    timestamp: snapshot.timestamp,
    data: snapshot.data,
    branchName: snapshot.branchName,
    isStarred: snapshot.isStarred,
    parentSnapshotId: snapshot.parentSnapshotId,
  };

  await idbPut(entry, SNAPSHOTS_STORE_NAME);
}

/**
 * E1: Load a specific snapshot from IndexedDB by canvasId + snapshotId.
 * Returns null if not found.
 */
export async function loadSnapshotFromDB(
  canvasId: string,
  snapshotId: string
): Promise<Snapshot | null> {
  if (!isIndexedDBAvailable()) return null;

  const entry = await idbGet<SnapshotEntry>([canvasId, snapshotId], SNAPSHOTS_STORE_NAME);
  if (!entry) return null;

  return {
    id: entry.snapshotId,
    name: entry.name,
    timestamp: entry.timestamp,
    data: entry.data,
    branchName: entry.branchName,
    isStarred: entry.isStarred,
    parentSnapshotId: entry.parentSnapshotId,
  };
}

/** E1 (Sprint61): Filter options for listSnapshotsFromDB */
export interface SnapshotListFilters {
  branch?: string;
  starred?: boolean;
}

/**
 * E1 (Sprint61): List all snapshots for a canvas, sorted by timestamp descending.
 * Uses the canvasId index to query efficiently.
 * Supports optional branch/starred filtering.
 */
export async function listSnapshotsFromDB(
  canvasId: string,
  filters?: SnapshotListFilters
): Promise<Snapshot[]> {
  if (!isIndexedDBAvailable()) return [];

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(SNAPSHOTS_STORE_NAME, 'readonly');
        const store = tx.objectStore(SNAPSHOTS_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.getAll(canvasId);

        request.onsuccess = () => {
          let results: Snapshot[] = (request.result as SnapshotEntry[]).map((entry) => ({
            id: entry.snapshotId,
            name: entry.name,
            timestamp: entry.timestamp,
            data: entry.data,
            branchName: entry.branchName,
            isStarred: entry.isStarred,
            parentSnapshotId: entry.parentSnapshotId,
          }));
          // E1 (Sprint61): Apply optional filters
          if (filters) {
            if (filters.branch !== undefined) {
              results = results.filter((s) => s.branchName === filters.branch);
            }
            if (filters.starred !== undefined) {
              results = results.filter((s) => s.isStarred === filters.starred);
            }
          }
          resolve(results);
        };
        request.onerror = () =>
          reject(new Error(`listSnapshotsFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}


/**
 * E1 (Sprint67): Get the latest (most recent) snapshot for a specific branch.
 * @param canvasId - Canvas ID
 * @param branchName - Branch name to filter by (default: 'main')
 * @returns The most recent snapshot for the branch, or null if none exists
 */
export async function getLatestSnapshotFromDB(
  canvasId: string,
  branchName: string = 'main'
): Promise<Snapshot | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;
  return new Promise((resolve, reject) => {
    const dbOpen = indexedDB.open(DB_NAME, DB_VERSION);
    dbOpen.onerror = () => reject(new Error(`getLatestSnapshotFromDB: open failed`));
    dbOpen.onsuccess = () => {
      const db = dbOpen.result;
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE_NAME)) {
        resolve(null);
        return;
      }
      const tx = db.transaction(SNAPSHOTS_STORE_NAME, 'readonly');
      const store = tx.objectStore(SNAPSHOTS_STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry = cursor.value;
          if ((entry.branchName ?? 'main') === branchName) {
            const snapshot: Snapshot = {
              id: entry.snapshotId,
              name: entry.name,
              timestamp: entry.timestamp,
              data: entry.data,
              branchName: entry.branchName,
              isStarred: entry.isStarred,
              parentSnapshotId: entry.parentSnapshotId,
            };
            resolve(snapshot);
            return;
          }
          cursor.continue();
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error(`getLatestSnapshotFromDB failed: ${request.error}`));
    };
  });
}

/**
 * E1: Delete a snapshot from IndexedDB by canvasId + snapshotId.
 */
export async function deleteSnapshotFromDB(canvasId: string, snapshotId: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  await idbDelete([canvasId, snapshotId], SNAPSHOTS_STORE_NAME);
}

/**
 * E5 (Sprint75): Batch delete multiple snapshots from IndexedDB.
 */
export async function deleteSnapshotsFromDB(canvasId: string, snapshotIds: string[]): Promise<void> {
  if (!isIndexedDBAvailable() || snapshotIds.length === 0) return;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error(`deleteSnapshotsFromDB: open failed`));
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(SNAPSHOTS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(SNAPSHOTS_STORE_NAME);
      let errors = 0;
      for (const snapshotId of snapshotIds) {
        store.delete([canvasId, snapshotId]);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        errors++;
        if (errors === snapshotIds.length) reject(new Error(`deleteSnapshotsFromDB: ${errors} errors`));
      };
    };
  });
}

/**
 * E1 (Sprint60): Update snapshot metadata (name, branchName, isStarred) in IndexedDB.
 * @param snapshotId - ID of the snapshot to update
 * @param meta - Metadata fields to update
 * @param canvasId - Optional; loaded from existing snapshot if not provided
 */
export async function updateSnapshotMetadataInDB(
  snapshotId: string,
  meta: { name?: string; branchName?: string; isStarred?: boolean },
  canvasId?: string
): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  // canvasId is optional: if not provided, try to find snapshot via list
  if (!canvasId) {
    console.warn('[historyDB] updateSnapshotMetadataInDB: canvasId not provided, skipping');
    return;
  }

  const existing = await loadSnapshotFromDB(canvasId, snapshotId);
  if (!existing) return;

  const updated: Snapshot = {
    ...existing,
    ...(meta.name !== undefined ? { name: meta.name } : {}),
    ...(meta.branchName !== undefined ? { branchName: meta.branchName } : {}),
    ...(meta.isStarred !== undefined ? { isStarred: meta.isStarred } : {}),
  };

  await idbPut(
    {
      canvasId,
      snapshotId,
      name: updated.name,
      timestamp: updated.timestamp,
      data: updated.data,
      branchName: updated.branchName,
      isStarred: updated.isStarred,
      parentSnapshotId: updated.parentSnapshotId,
    },
    SNAPSHOTS_STORE_NAME
  );
}

/**
 * E1: Delete all snapshots for a canvas.
 */
export async function clearSnapshotsFromDB(canvasId: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(SNAPSHOTS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(SNAPSHOTS_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.getAllKeys(canvasId);

        request.onsuccess = () => {
          const keys = request.result as IDBValidKey[];
          let pending = keys.length;
          if (pending === 0) {
            resolve();
            return;
          }
          for (const key of keys) {
            const delReq = store.delete(key);
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
        request.onerror = () => reject(new Error(`clearSnapshotsFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

// ============================================
// E1 (Sprint66): Branch Operations
// ============================================

/**
 * E1 (Sprint66): Rename all snapshots in a branch (bulk update branchName).
 */
export async function renameBranchInDB(
  canvasId: string,
  oldBranchName: string,
  newBranchName: string
): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  const snapshots = await listSnapshotsFromDB(canvasId, { branch: oldBranchName });
  const pending = snapshots.length;
  if (pending === 0) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(SNAPSHOTS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(SNAPSHOTS_STORE_NAME);
        let done = 0;
        let errors = 0;

        for (const snap of snapshots) {
          const entry: SnapshotEntry = {
            canvasId,
            snapshotId: snap.id,
            name: snap.name,
            timestamp: snap.timestamp,
            data: snap.data,
            branchName: newBranchName,
            isStarred: snap.isStarred,
            parentSnapshotId: snap.parentSnapshotId,
          };
          const req = store.put(entry);
          req.onsuccess = () => {
            done++;
            if (done + errors === pending) done === pending ? resolve() : reject(new Error(`${errors} renameBranch errors`));
          };
          req.onerror = () => {
            errors++;
            done++;
            if (done === pending) reject(new Error(`${errors} renameBranch errors`));
          };
        }
      })
      .catch(reject);
  });
}

/**
 * E1 (Sprint66): Delete all snapshots in a branch (bulk delete).
 */
export async function deleteBranchFromDB(canvasId: string, branchName: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  const snapshots = await listSnapshotsFromDB(canvasId, { branch: branchName });
  if (snapshots.length === 0) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(SNAPSHOTS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(SNAPSHOTS_STORE_NAME);
        let done = 0;
        let errors = 0;

        for (const snap of snapshots) {
          const req = store.delete([canvasId, snap.id]);
          req.onsuccess = () => {
            done++;
            if (done + errors === snapshots.length) done === snapshots.length ? resolve() : reject(new Error(`${errors} deleteBranch errors`));
          };
          req.onerror = () => {
            errors++;
            done++;
            if (done === snapshots.length) reject(new Error(`${errors} deleteBranch errors`));
          };
        }
      })
      .catch(reject);
  });
}

/**
 * E1 (Sprint66): Merge source branch into target branch.
 * All source snapshots get branchName → targetBranch and parentSnapshotId → targetTipId.
 * targetTipId = snapshot with latest timestamp in target branch (null if target has no snapshots).
 */
export async function mergeBranchInDB(
  canvasId: string,
  sourceBranch: string,
  targetBranch: string,
  targetTipSnapshotId: string | null
): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  const sourceSnaps = await listSnapshotsFromDB(canvasId, { branch: sourceBranch });
  if (sourceSnaps.length === 0) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(SNAPSHOTS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(SNAPSHOTS_STORE_NAME);
        let done = 0;
        let errors = 0;

        for (const snap of sourceSnaps) {
          const entry: SnapshotEntry = {
            canvasId,
            snapshotId: snap.id,
            name: snap.name,
            timestamp: snap.timestamp,
            data: snap.data,
            branchName: targetBranch,
            isStarred: snap.isStarred,
            parentSnapshotId: targetTipSnapshotId,
          };
          const req = store.put(entry);
          req.onsuccess = () => {
            done++;
            if (done + errors === sourceSnaps.length) done === sourceSnaps.length ? resolve() : reject(new Error(`${errors} mergeBranch errors`));
          };
          req.onerror = () => {
            errors++;
            done++;
            if (done === sourceSnaps.length) reject(new Error(`${errors} mergeBranch errors`));
          };
        }
      })
      .catch(reject);
  });
}

/**
 * E1 (Sprint66): List all unique branch names for a canvas.
 */
export async function listBranchesFromDB(canvasId: string): Promise<string[]> {
  if (!isIndexedDBAvailable()) return [];

  const snapshots = await listSnapshotsFromDB(canvasId);
  const branchSet = new Set<string>(['main']); // always include 'main'
  for (const snap of snapshots) {
    if (snap.branchName) branchSet.add(snap.branchName);
  }
  return Array.from(branchSet);
}

// ============================================
// E4 (Sprint73): Branch Metadata CRUD
// ============================================

/**
 * Save or update branch metadata.
 */
export async function setBranchMeta(
  canvasId: string,
  branchName: string,
  meta: Omit<BranchMeta, 'canvasId' | 'branchName'>
): Promise<boolean> {
  if (!isIndexedDBAvailable()) return false;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(BRANCH_META_STORE_NAME, 'readwrite');
        const store = tx.objectStore(BRANCH_META_STORE_NAME);
        const entry: BranchMeta = { canvasId, branchName, ...meta };
        const request = store.put(entry);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error(`setBranchMeta failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * Load branch metadata for a specific canvas + branch.
 */
export async function getBranchMeta(
  canvasId: string,
  branchName: string
): Promise<BranchMeta | null> {
  if (!isIndexedDBAvailable()) return null;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(BRANCH_META_STORE_NAME, 'readonly');
        const store = tx.objectStore(BRANCH_META_STORE_NAME);
        const request = store.get([canvasId, branchName]);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(new Error(`getBranchMeta failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * List all branch metadata records for a canvas.
 */
export async function listBranchMetas(canvasId: string): Promise<BranchMeta[]> {
  if (!isIndexedDBAvailable()) return [];

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(BRANCH_META_STORE_NAME, 'readonly');
        const store = tx.objectStore(BRANCH_META_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.getAll(canvasId);
        request.onsuccess = () => resolve((request.result ?? []) as BranchMeta[]);
        request.onerror = () => reject(new Error(`listBranchMetas failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * Delete branch metadata for a specific canvas + branch.
 */
export async function deleteBranchMeta(
  canvasId: string,
  branchName: string
): Promise<boolean> {
  if (!isIndexedDBAvailable()) return false;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(BRANCH_META_STORE_NAME, 'readwrite');
        const store = tx.objectStore(BRANCH_META_STORE_NAME);
        const request = store.delete([canvasId, branchName]);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error(`deleteBranchMeta failed: ${request.error}`));
      })
      .catch(reject);
  });
}

// ============================================
// E3 (Sprint75): Branch Diff History DB Functions
// ============================================

/** Maximum number of branch diff history entries per canvas */
const MAX_BRANCH_DIFF_HISTORY = 20;

/**
 * Save a branch diff history entry to IndexedDB.
 * If adding would exceed MAX_BRANCH_DIFF_HISTORY, removes oldest entries first.
 */
export async function saveBranchDiffHistoryToDB(
  entry: BranchDiffHistoryEntry
): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(BRANCH_DIFF_HISTORY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(BRANCH_DIFF_HISTORY_STORE_NAME);

        // First, count existing entries for this canvas
        const countReq = store.index('canvasId').count(entry.canvasId);
        countReq.onsuccess = () => {
          const count = countReq.result as number;
          if (count >= MAX_BRANCH_DIFF_HISTORY) {
            // Fetch and delete oldest entries
            const fetchReq = store.index('canvasId').getAll(entry.canvasId);
            fetchReq.onsuccess = () => {
              const entries = fetchReq.result as BranchDiffHistoryEntry[];
              // Sort by timestamp ascending (oldest first)
              entries.sort((a, b) => a.timestamp - b.timestamp);
              const toDelete = entries.slice(0, count - MAX_BRANCH_DIFF_HISTORY + 1);
              for (const old of toDelete) {
                store.delete([old.canvasId, old.id]);
              }
              // Now add the new entry
              const addReq = store.put(entry);
              addReq.onsuccess = () => resolve();
              addReq.onerror = () => reject(new Error(`saveBranchDiffHistoryToDB put failed: ${addReq.error}`));
            };
            fetchReq.onerror = () => reject(new Error(`saveBranchDiffHistoryToDB count/fetch failed: ${fetchReq.error}`));
          } else {
            const addReq = store.put(entry);
            addReq.onsuccess = () => resolve();
            addReq.onerror = () => reject(new Error(`saveBranchDiffHistoryToDB put failed: ${addReq.error}`));
          }
        };
        countReq.onerror = () => reject(new Error(`saveBranchDiffHistoryToDB count failed: ${countReq.error}`));
      })
      .catch(reject);
  });
}

/**
 * List all branch diff history entries for a canvas, sorted by timestamp descending (newest first).
 */
export async function listBranchDiffHistoryFromDB(
  canvasId: string
): Promise<BranchDiffHistoryEntry[]> {
  if (!isIndexedDBAvailable()) return [];

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(BRANCH_DIFF_HISTORY_STORE_NAME, 'readonly');
        const store = tx.objectStore(BRANCH_DIFF_HISTORY_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.getAll(canvasId);
        request.onsuccess = () => {
          const entries = (request.result ?? []) as BranchDiffHistoryEntry[];
          // Sort by timestamp descending (newest first)
          entries.sort((a, b) => b.timestamp - a.timestamp);
          resolve(entries.slice(0, MAX_BRANCH_DIFF_HISTORY));
        };
        request.onerror = () => reject(new Error(`listBranchDiffHistoryFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * Clear all branch diff history entries for a canvas.
 */
export async function clearBranchDiffHistoryFromDB(canvasId: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(BRANCH_DIFF_HISTORY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(BRANCH_DIFF_HISTORY_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.getAllKeys(canvasId);
        request.onsuccess = () => {
          const keys = request.result as Array<[string, string]>;
          for (const key of keys) {
            store.delete(key);
          }
          resolve();
        };
        request.onerror = () => reject(new Error(`clearBranchDiffHistoryFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

// ============================================
// E1 (Sprint77): Notification Persistence
// ============================================

/**
 * E1 (Sprint77): Save a notification to IndexedDB notifications store.
 * Called whenever a new notification arrives (from WS or addNotification).
 */
export async function saveNotificationToDB(notification: Notification): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  await idbPut(notification, NOTIFICATIONS_STORE_NAME);
}

/**
 * E1 (Sprint77): Load all notifications from IndexedDB for a given user.
 * Returns notifications sorted by timestamp descending (newest first).
 */
export async function getNotificationsFromDB(userId?: string): Promise<Notification[]> {
  if (!isIndexedDBAvailable()) return [];

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readonly');
        const store = tx.objectStore(NOTIFICATIONS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          let results = (request.result as Notification[]).map((entry) => entry as Notification);
          // Filter by userId if provided
          if (userId) {
            results = results.filter((n) => n.targetUserId === userId);
          }
          // Sort by timestamp descending (newest first)
          results.sort((a, b) => b.timestamp - a.timestamp);
          resolve(results);
        };
        request.onerror = () => reject(new Error(`getNotificationsFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * E1 (Sprint77): Mark a notification as read in IndexedDB.
 * Returns the updated notification or null if not found.
 */
export async function markAsReadInDB(id: string): Promise<Notification | null> {
  if (!isIndexedDBAvailable()) return null;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(NOTIFICATIONS_STORE_NAME);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
          const entry = getReq.result as Notification | undefined;
          if (!entry) {
            resolve(null);
            return;
          }
          const updated: Notification = { ...entry, isRead: true };
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve(updated);
          putReq.onerror = () => reject(new Error(`markAsReadInDB put failed: ${putReq.error}`));
        };
        getReq.onerror = () => reject(new Error(`markAsReadInDB get failed: ${getReq.error}`));
      })
      .catch(reject);
  });
}

/**
 * E1 (Sprint77): Get unread notification count from IndexedDB.
 * Optionally scoped to a userId.
 */
export async function getUnreadCountFromDB(userId?: string): Promise<number> {
  if (!isIndexedDBAvailable()) return 0;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readonly');
        const store = tx.objectStore(NOTIFICATIONS_STORE_NAME);
        const index = store.index('isRead');
        const request = index.getAll(IDBKeyRange.only(false));

        request.onsuccess = () => {
          let results = request.result as Notification[];
          if (userId) {
            results = results.filter((n) => n.targetUserId === userId);
          }
          resolve(results.length);
        };
        request.onerror = () => reject(new Error(`getUnreadCountFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * E1 (Sprint77): Bulk save notifications from server response.
 * Merges server notifications with local IndexedDB — server wins on id collision.
 */
export async function saveNotificationsFromServer(notifications: Notification[]): Promise<void> {
  if (!isIndexedDBAvailable() || notifications.length === 0) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(NOTIFICATIONS_STORE_NAME);
        let pending = notifications.length;
        let errors = 0;

        for (const notif of notifications) {
          const req = store.put(notif);
          req.onsuccess = () => {
            pending--;
            if (pending === 0) {
              if (errors > 0) reject(new Error(`${errors} saveNotificationsFromServer errors`));
              else resolve();
            }
          };
          req.onerror = () => {
            errors++;
            pending--;
            if (pending === 0 && errors > 0) reject(new Error(`${errors} saveNotificationsFromServer errors`));
          };
        }
      })
      .catch(reject);
  });
}

// ============================================
// E4 (Sprint77): Canvas Change Log CRUD
// ============================================

/**
 * E4 (Sprint77): Save a canvas change to the offline change log.
 */
export async function saveCanvasChangeToDB(change: CanvasChangeLogEntry): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(CANVAS_CHANGE_LOG_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CANVAS_CHANGE_LOG_STORE_NAME);
        const request = store.put(change);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`saveCanvasChangeToDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * E4 (Sprint77): Load all pending canvas changes for a canvas (oldest first).
 */
export async function loadCanvasChangesFromDB(canvasId: string): Promise<CanvasChangeLogEntry[]> {
  if (!isIndexedDBAvailable()) return [];

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(CANVAS_CHANGE_LOG_STORE_NAME, 'readonly');
        const store = tx.objectStore(CANVAS_CHANGE_LOG_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.getAll(IDBKeyRange.only(canvasId));
        request.onsuccess = () => {
          const results = request.result as CanvasChangeLogEntry[];
          // Sort by timestamp ascending (oldest first)
          results.sort((a, b) => a.timestamp - b.timestamp);
          resolve(results);
        };
        request.onerror = () => reject(new Error(`loadCanvasChangesFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * E4 (Sprint77): Clear all canvas changes for a canvas (after replay).
 */
export async function clearCanvasChangesFromDB(canvasId: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(CANVAS_CHANGE_LOG_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CANVAS_CHANGE_LOG_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.getAllKeys(IDBKeyRange.only(canvasId));
        request.onsuccess = () => {
          let pending = request.result.length;
          if (pending === 0) { resolve(); return; }
          for (const key of request.result) {
            const delReq = store.delete(key);
            delReq.onsuccess = () => {
              pending--;
              if (pending === 0) resolve();
            };
            delReq.onerror = () => {
              pending--;
              if (pending === 0) resolve(); // Best effort
            };
          }
        };
        request.onerror = () => reject(new Error(`clearCanvasChangesFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}


/**
 * E1 (Sprint77): Clear all notifications from IndexedDB.
 */
export async function clearNotificationsFromDB(): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(NOTIFICATIONS_STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`clearNotificationsFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

// ============================================
// E5 (Sprint79): Merge History
// ============================================

import type { MergeHistoryEntry } from '@/stores/dds/canvasHistoryStore';

/**
 * E5 (Sprint79): Save a merge history entry to IndexedDB.
 * Keeps only the 20 most recent entries per canvas.
 */
export async function saveMergeHistoryToDB(entry: MergeHistoryEntry): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(MERGE_HISTORY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(MERGE_HISTORY_STORE_NAME);
        // First put the new entry
        const putReq = store.put(entry);
        putReq.onerror = () => reject(new Error(`saveMergeHistoryToDB put failed: ${putReq.error}`));

        // Then trim to keep only 20 most recent per canvas
        tx.oncomplete = async () => {
          try {
            const entries = await listMergeHistoryFromDB(entry.canvasId);
            if (entries.length > 20) {
              const toDelete = entries.slice(20);
              const deleteTx = db.transaction(MERGE_HISTORY_STORE_NAME, 'readwrite');
              const deleteStore = deleteTx.objectStore(MERGE_HISTORY_STORE_NAME);
              for (const oldEntry of toDelete) {
                deleteStore.delete([oldEntry.canvasId, oldEntry.id]);
              }
            }
          } catch {
            // Non-fatal: trimming is best-effort
          }
          resolve();
        };
        tx.onerror = () => reject(new Error(`saveMergeHistoryToDB transaction failed: ${tx.error}`));
      })
      .catch(reject);
  });
}

/**
 * E5 (Sprint79): List all merge history entries for a canvas, sorted by timestamp desc.
 */
export async function listMergeHistoryFromDB(canvasId: string): Promise<MergeHistoryEntry[]> {
  if (!isIndexedDBAvailable()) return [];

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(MERGE_HISTORY_STORE_NAME, 'readonly');
        const store = tx.objectStore(MERGE_HISTORY_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.getAll(canvasId);
        request.onsuccess = () => {
          const entries: MergeHistoryEntry[] = request.result ?? [];
          // Sort by timestamp desc
          entries.sort((a, b) => b.timestamp - a.timestamp);
          resolve(entries);
        };
        request.onerror = () => reject(new Error(`listMergeHistoryFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

/**
 * E5 (Sprint79): Clear all merge history entries for a canvas.
 */
export async function clearMergeHistoryFromDB(canvasId: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(MERGE_HISTORY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(MERGE_HISTORY_STORE_NAME);
        const index = store.index('canvasId');
        const request = index.openCursor(IDBKeyRange.only(canvasId));
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(new Error(`clearMergeHistoryFromDB failed: ${request.error}`));
      })
      .catch(reject);
  });
}

// ============================================
// E1 (Sprint80): Notification Preferences IndexedDB
// ============================================

/**
 * E1 (Sprint80): Save notification preferences to IndexedDB.
 * Stores the full NotificationPreferences object under key 'preferences'.
 */
export async function savePreferencesToDB(prefs: import('@/stores/notificationStore').NotificationPreferences): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  await idbPut({ key: 'preferences', ...prefs }, NOTIFICATION_PREFS_STORE_NAME);
}

/**
 * E1 (Sprint80): Load notification preferences from IndexedDB.
 * Returns null if no preferences are stored yet.
 */
export async function getPreferencesFromDB(): Promise<import('@/stores/notificationStore').NotificationPreferences | null> {
  if (!isIndexedDBAvailable()) return null;
  const result = await idbGet<{ key: string; channels: import('@/stores/notificationStore').NotificationPreferences['channels']; types: import('@/stores/notificationStore').NotificationPreferences['types'] }>('preferences', NOTIFICATION_PREFS_STORE_NAME);
  if (!result) return null;
  const { key: _ignored, ...prefs } = result;
  return prefs as import('@/stores/notificationStore').NotificationPreferences;
}
