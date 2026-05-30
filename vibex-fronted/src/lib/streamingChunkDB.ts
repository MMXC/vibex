/**
 * streamingChunkDB.ts — Sprint45 P001-E1: AI 断线重连
 *
 * IndexedDB persistence layer for SSE streaming chunks.
 * When a stream disconnects mid-transfer, partial chunks are stored so
 * the next retry can recover and continue without losing progress.
 *
 * Uses the `idb` library (already in package.json).
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'vibex-streaming-chunks';
const DB_VERSION = 1;
const STORE = 'chunks';

interface ChunkRecord {
  /** Unique key for this stream session */
  sessionKey: string;
  /** Accumulated content so far */
  content: string;
  /** Updated timestamp */
  updatedAt: number;
}

let _db: IDBPDatabase | null = null;

async function initDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'sessionKey' });
      }
    },
  });
  return _db;
}

/**
 * Persist accumulated chunks for a given stream session.
 * Call this after each batch of SSE chunks is processed.
 */
export async function persistStreamingChunk(
  sessionKey: string,
  content: string
): Promise<void> {
  const db = await initDB();
  await db.put(STORE, {
    sessionKey,
    content,
    updatedAt: Date.now(),
  } as ChunkRecord);
}

/**
 * Load previously persisted chunks for a stream session.
 * Returns empty string if no record exists.
 */
export async function loadStreamingChunk(sessionKey: string): Promise<string> {
  const db = await initDB();
  const record = await db.get(STORE, sessionKey);
  return record?.content ?? '';
}

/**
 * Clear persisted chunks after a successful stream completion.
 */
export async function clearStreamingChunk(sessionKey: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE, sessionKey);
}
