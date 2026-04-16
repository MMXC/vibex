/**
 * DDS Persistence Service — localStorage + IndexedDB dual-track
 *
 * Epic6: 数据持久化
 * - localStorage: fast sync for UI state and recent data
 * - IndexedDB: large data (snapshots, full exports)
 * - Export/Import: JSON file download/upload
 *
 * @module services/dds/ddsPersistence
 */

import type {
  ChapterType,
  DDSCard,
  DDSEdge,
  ChatMessage,
} from '@/types/dds';

// ============================================
// Type Definitions
// ============================================

export interface DDSPersistenceProject {
  projectId: string;
  projectName: string;
  chapters: Record<ChapterType, DDSPersistenceChapter>;
  chatHistory: ChatMessage[];
  savedAt: string; // ISO 8601
  version: 1;
}

export interface DDSPersistenceChapter {
  cards: DDSCard[];
  edges: DDSEdge[];
}

export interface DDSPersistenceMeta {
  projectId: string;
  projectName: string;
  savedAt: string;
  cardCount: number;
}

export interface DDSExportData {
  version: 1;
  projectId: string;
  projectName: string;
  chapters: Record<ChapterType, DDSPersistenceChapter>;
  chatHistory: ChatMessage[];
  exportedAt: string;
  source: 'dds-canvas';
}

// ============================================
// Constants
// ============================================

const LOCAL_STORAGE_KEY = 'vibex-dds-state';
const IDB_NAME = 'vibex-dds';
const IDB_VERSION = 1;
const IDB_STORE_SNAPSHOTS = 'snapshots';
const IDB_STORE_META = 'meta';
const MAX_LOCALSTORAGE_ITEMS = 10;

// ============================================
// localStorage Helpers
// ============================================

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return true;
  } catch {
    return false;
  }
}

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

// ============================================
// IndexedDB
// ============================================

let _idb: IDBDatabase | null = null;

function openIDB(): Promise<IDBDatabase> {
  if (_idb) return Promise.resolve(_idb);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));

    request.onsuccess = () => {
      _idb = request.result;
      resolve(_idb);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Snapshots store: key = snapshotId, value = DDSPersistenceProject
      if (!db.objectStoreNames.contains(IDB_STORE_SNAPSHOTS)) {
        const snapshotStore = db.createObjectStore(IDB_STORE_SNAPSHOTS, { keyPath: 'snapshotId' });
        snapshotStore.createIndex('projectId', 'projectId', { unique: false });
        snapshotStore.createIndex('savedAt', 'savedAt', { unique: false });
      }

      // Meta store: key = projectId, value = DDSPersistenceMeta
      if (!db.objectStoreNames.contains(IDB_STORE_META)) {
        db.createObjectStore(IDB_STORE_META, { keyPath: 'projectId' });
      }
    };
  });
}

function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    openIDB()
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

function idbPut(storeName: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    openIDB()
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

function idbDelete(storeName: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    openIDB()
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

function idbGetAll<T>(storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    openIDB()
      .then((db) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result ?? []);
        request.onerror = () => reject(new Error(`IDB getAll failed: ${request.error}`));
      })
      .catch(reject);
  });
}

// ============================================
// localStorage Persistence (fast sync)
// ============================================

function localStorageSave(projectId: string, data: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    // Maintain a list of recent project IDs (LRU-like eviction)
    const indexKey = `${LOCAL_STORAGE_KEY}-index`;
    let index: string[] = [];
    try {
      const raw = localStorage.getItem(indexKey);
      if (raw) index = JSON.parse(raw);
    } catch {
      index = [];
    }

    // Add/update this project at front
    index = index.filter((id) => id !== projectId);
    index.unshift(projectId);

    // Evict oldest if over limit
    while (index.length > MAX_LOCALSTORAGE_ITEMS) {
      const removed = index.pop();
      if (removed) localStorage.removeItem(`${LOCAL_STORAGE_KEY}-${removed}`);
    }

    localStorage.setItem(`${LOCAL_STORAGE_KEY}-${projectId}`, data);
    localStorage.setItem(indexKey, JSON.stringify(index));
  } catch (err) {
    // localStorage full or disabled — silently fail, IDB still works
    console.warn('[ddsPersistence] localStorage save failed:', err);
  }
}

function localStorageLoad(projectId: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY}-${projectId}`);
  } catch {
    return null;
  }
}

function localStorageRemove(projectId: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}-${projectId}`);
    const indexKey = `${LOCAL_STORAGE_KEY}-index`;
    const raw = localStorage.getItem(indexKey);
    if (raw) {
      const index: string[] = JSON.parse(raw).filter((id: string) => id !== projectId);
      localStorage.setItem(indexKey, JSON.stringify(index));
    }
  } catch {
    // ignore
  }
}

// ============================================
// Snapshot Management (IndexedDB)
// ============================================

export interface SnapshotMeta {
  snapshotId: string;
  projectId: string;
  projectName: string;
  savedAt: string;
  cardCount: number;
  edgeCount: number;
}

function makeSnapshotId(): string {
  return `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Save a full project snapshot to IndexedDB.
 * Used for periodic auto-save and manual save points.
 */
export async function saveSnapshot(
  projectId: string,
  projectName: string,
  chapters: Record<ChapterType, { cards: DDSCard[]; edges: DDSEdge[] }>,
  chatHistory: ChatMessage[]
): Promise<string> {
  const snapshotId = makeSnapshotId();
  const cardCount = Object.values(chapters).reduce((sum, ch) => sum + ch.cards.length, 0);
  const edgeCount = Object.values(chapters).reduce((sum, ch) => sum + ch.edges.length, 0);

  const snapshot: DDSPersistenceProject & { snapshotId: string } = {
    snapshotId,
    projectId,
    projectName,
    chapters: {
      requirement: { cards: chapters.requirement.cards, edges: chapters.requirement.edges },
      context: { cards: chapters.context.cards, edges: chapters.context.edges },
      flow: { cards: chapters.flow.cards, edges: chapters.flow.edges },
    },
    chatHistory,
    savedAt: new Date().toISOString(),
    version: 1,
  };

  await idbPut(IDB_STORE_SNAPSHOTS, snapshot);

  // Also update meta
  const meta: DDSPersistenceMeta & { projectId: string } = {
    projectId,
    projectName,
    savedAt: new Date().toISOString(),
    cardCount,
  };
  await idbPut(IDB_STORE_META, meta);

  return snapshotId;
}

/**
 * Load the latest snapshot for a project from IndexedDB.
 */
export async function loadLatestSnapshot(projectId: string): Promise<DDSPersistenceProject | null> {
  const all = await idbGetAll<DDSPersistenceProject & { snapshotId: string }>(IDB_STORE_SNAPSHOTS);
  const projectSnapshots = all
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

  return projectSnapshots[0] ?? null;
}

/**
 * Load a specific snapshot by ID.
 */
export async function loadSnapshot(snapshotId: string): Promise<DDSPersistenceProject | null> {
  return (await idbGet<DDSPersistenceProject & { snapshotId: string }>(IDB_STORE_SNAPSHOTS, snapshotId)) as DDSPersistenceProject | null;
}

/**
 * List all snapshots for a project (newest first).
 */
export async function listSnapshots(projectId: string): Promise<SnapshotMeta[]> {
  const all = await idbGetAll<DDSPersistenceProject & { snapshotId: string }>(IDB_STORE_SNAPSHOTS);
  return all
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .map((s) => ({
      snapshotId: s.snapshotId,
      projectId: s.projectId,
      projectName: s.projectName,
      savedAt: s.savedAt,
      cardCount: s.chapters.requirement.cards.length +
        s.chapters.context.cards.length +
        s.chapters.flow.cards.length,
      edgeCount: s.chapters.requirement.edges.length +
        s.chapters.context.edges.length +
        s.chapters.flow.edges.length,
    }));
}

/**
 * Delete a snapshot.
 */
export async function deleteSnapshot(snapshotId: string): Promise<void> {
  await idbDelete(IDB_STORE_SNAPSHOTS, snapshotId);
}

/**
 * Quick-save current state to localStorage (for fast sync, < 5MB).
 */
export function quickSave(
  projectId: string,
  projectName: string,
  chapters: Record<ChapterType, { cards: DDSCard[]; edges: DDSEdge[] }>,
  chatHistory: ChatMessage[]
): void {
  const data: DDSPersistenceProject = {
    projectId,
    projectName,
    chapters: {
      requirement: { cards: chapters.requirement.cards, edges: chapters.requirement.edges },
      context: { cards: chapters.context.cards, edges: chapters.context.edges },
      flow: { cards: chapters.flow.cards, edges: chapters.flow.edges },
    },
    chatHistory,
    savedAt: new Date().toISOString(),
    version: 1,
  };
  localStorageSave(projectId, JSON.stringify(data));
}

/**
 * Quick-load from localStorage.
 */
export function quickLoad(projectId: string): DDSPersistenceProject | null {
  const raw = localStorageLoad(projectId);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as DDSPersistenceProject;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Clear all localStorage data for a project.
 */
export function clearLocalStorage(projectId: string): void {
  localStorageRemove(projectId);
}

// ============================================
// Export / Import
// ============================================

/**
 * Export project data as a downloadable JSON file.
 */
export function exportToJSON(
  projectId: string,
  projectName: string,
  chapters: Record<ChapterType, { cards: DDSCard[]; edges: DDSEdge[] }>,
  chatHistory: ChatMessage[]
): void {
  const data: DDSExportData = {
    version: 1,
    projectId,
    projectName,
    chapters: {
      requirement: { cards: chapters.requirement.cards, edges: chapters.requirement.edges },
      context: { cards: chapters.context.cards, edges: chapters.context.edges },
      flow: { cards: chapters.flow.cards, edges: chapters.flow.edges },
    },
    chatHistory,
    exportedAt: new Date().toISOString(),
    source: 'dds-canvas',
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = `${projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.vibex-dds.json`;

  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported JSON data.
 */
export function validateImportData(data: unknown): data is DDSExportData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (typeof d.projectId !== 'string') return false;
  if (typeof d.chapters !== 'object' || d.chapters === null) return false;
  if (!Array.isArray(d.chatHistory)) return false;
  return true;
}

/**
 * Parse and validate an imported JSON file.
 * Throws on invalid data.
 */
export function parseImportFile(file: File): Promise<DDSExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (!validateImportData(data)) {
          reject(new Error('Invalid DDS export file format'));
          return;
        }
        resolve(data);
      } catch (err) {
        reject(new Error(`Failed to parse import file: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ============================================
// Storage Info
// ============================================

export interface StorageInfo {
  localStorageAvailable: boolean;
  indexedDBAvailable: boolean;
  localStorageProjectIds: string[];
  indexedDBSnapshotCount: number;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const localStorageAvailable = isLocalStorageAvailable();
  let localStorageProjectIds: string[] = [];
  if (localStorageAvailable) {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}-index`);
      if (raw) localStorageProjectIds = JSON.parse(raw);
    } catch {
      localStorageProjectIds = [];
    }
  }

  const indexedDBAvailable = isIndexedDBAvailable();
  let indexedDBSnapshotCount = 0;
  if (indexedDBAvailable) {
    try {
      const all = await idbGetAll<unknown>(IDB_STORE_SNAPSHOTS);
      indexedDBSnapshotCount = all.length;
    } catch {
      indexedDBSnapshotCount = 0;
    }
  }

  return { localStorageAvailable, indexedDBAvailable, localStorageProjectIds, indexedDBSnapshotCount };
}
