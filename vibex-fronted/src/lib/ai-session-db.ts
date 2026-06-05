/**
 * ai-session-db.ts — Sprint64 E3: AI Session Persistence
 *
 * IndexedDB persistence layer for AI session history.
 * Stores completed sessions (prompt + response summary + metadata)
 * for cross-page-refresh persistence.
 *
 * DB: vibex-ai-sessions  v1
 * Store: history
 */

'use client';

// ==================== Constants ====================

const DB_NAME = 'vibex-ai-sessions';
const DB_VERSION = 1;
const STORE_NAME = 'history';

// ==================== Types ====================

export interface AISessionHistory {
  /** Unique session ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** First user prompt (truncated to 200 chars for display) */
  promptSummary: string;
  /** Last AI response content (truncated to 300 chars for display) */
  responseSummary: string;
  /** Canvas context summary if attached */
  canvasContextSummary: string | null;
  /** Session creation timestamp */
  createdAt: string;
  /** When session was archived to history */
  archivedAt: string;
}

// ==================== DB Helpers ====================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('archivedAt', 'archivedAt', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => {
    const tx = db.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
  });
}

// ==================== Core API ====================

/**
 * Save/archive a session to IndexedDB history.
 * Called when a streaming session ends.
 */
export async function saveSessionToHistory(session: AISessionHistory): Promise<void> {
  const store = await transaction('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(session);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Load all sessions from history, sorted by archivedAt descending (newest first).
 */
export async function loadSessionsFromHistory(): Promise<AISessionHistory[]> {
  const store = await transaction('readonly');
  return new Promise((resolve, reject) => {
    const req = store.indexOpen('archivedAt', null);
    const results: AISessionHistory[] = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results.reverse()); // indexOpen iterates ascending; reverse to get newest first
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a session from history by ID.
 */
export async function deleteSessionFromHistory(id: string): Promise<void> {
  const store = await transaction('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all history entries.
 */
export async function clearAllHistory(): Promise<void> {
  const store = await transaction('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
