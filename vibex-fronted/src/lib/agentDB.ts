/**
 * agentDB.ts — Sprint44 P001-E1: AI Multi-Session Management
 *
 * IndexedDB persistence layer for AgentSession objects.
 * Uses the `idb` library (already in package.json).
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { AgentSession } from '@/services/agent/CodingAgentService';

const DB_NAME = 'vibex-agent-sessions';
const DB_VERSION = 2;
const STORE = 'sessions';

let _db: IDBPDatabase | null = null;

/**
 * Initialize the IndexedDB database.
 * Safe to call multiple times — returns existing instance if already open.
 * S46-E1: Bumped to v2, adds searchableText index for session search.
 */
export async function initAgentDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'sessionKey' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('status', 'status');
        }
      }
      // S46-E1: Add searchableText index
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'sessionKey' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('status', 'status');
        } else {
          const store = db.transaction(STORE).objectStore(STORE);
          if (!store.indexNames.contains('searchableText')) {
            store.createIndex('searchableText', 'searchableText');
          }
        }
      }
    },
  });
  return _db;
}

/**
 * Persist a session to IndexedDB.
 * Called whenever a session is created or updated.
 */
export async function persistSession(session: AgentSession): Promise<void> {
  const db = await initAgentDB();
  await db.put(STORE, session);
}

/**
 * Load all sessions from IndexedDB, sorted by createdAt descending.
 */
export async function loadSessionList(): Promise<AgentSession[]> {
  const db = await initAgentDB();
  const all = await db.getAllFromIndex(STORE, 'createdAt');
  // Return newest first
  return all.reverse();
}

/**
 * Delete a session from IndexedDB.
 */
export async function deleteSession(sessionKey: string): Promise<void> {
  const db = await initAgentDB();
  await db.delete(STORE, sessionKey);
}
