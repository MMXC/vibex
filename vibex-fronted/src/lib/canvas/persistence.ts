/**
 * persistence.ts — IndexedDB Canvas Persistence Layer
 * S41-E4: Canvas 持久化 + IndexedDB
 *
 * Uses serialize.ts functions for data serialization:
 * - serializeThreeTrees(): captures current canvas state
 * - deserializeThreeTrees(): restores from JSON
 * - restoreStore(): applies state to Zustand stores
 * - serializeToJson(): converts to JSON string
 *
 * IndexedDB schema:
 * - DB name: vibex-canvas
 * - Store name: canvas-snapshots
 * - Key: canvas:{canvasId}
 * - Value: { canvasId, data, savedAt }
 */

import { openDB, type IDBPDatabase } from 'idb';
import {
  serializeThreeTrees,
  deserializeThreeTrees,
  restoreStore,
  serializeToJson,
  type CanvasSnapshotData,
} from './serialize';

const DB_NAME = 'vibex-canvas';
const DB_VERSION = 1;
const STORE_NAME = 'canvas-snapshots';

/** IndexedDB record structure */
export interface CanvasPersistenceRecord {
  canvasId: string;
  data: string; // JSON string of CanvasSnapshotData
  savedAt: string; // ISO timestamp
}

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Get or create the IndexedDB database connection
 */
async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'canvasId' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Get the IndexedDB key for a canvas
 */
function getKey(canvasId: string): string {
  return `canvas:${canvasId}`;
}

/**
 * Persist the current canvas state to IndexedDB
 * Called on canvas changes (debounced by caller)
 */
export async function persistCanvas(canvasId: string): Promise<void> {
  try {
    const snapshot = serializeThreeTrees();
    const jsonStr = serializeToJson(snapshot);
    const record: CanvasPersistenceRecord = {
      canvasId: getKey(canvasId),
      data: jsonStr,
      savedAt: new Date().toISOString(),
    };
    const db = await getDB();
    await db.put(STORE_NAME, record);
  } catch (error) {
    console.warn('[persistence] Failed to persist canvas:', error);
    // Don't throw — persistence failure shouldn't break the app
  }
}

/**
 * Load canvas state from IndexedDB
 * Returns true if data was found and restored, false otherwise
 */
export async function loadCanvas(canvasId: string): Promise<boolean> {
  try {
    const db = await getDB();
    const record = await db.get(STORE_NAME, getKey(canvasId)) as CanvasPersistenceRecord | undefined;
    if (!record) {
      return false;
    }
    const snapshot = deserializeThreeTrees(record.data);
    restoreStore(snapshot);
    return true;
  } catch (error) {
    console.warn('[persistence] Failed to load canvas:', error);
    return false;
  }
}

/**
 * Check if a canvas snapshot exists in IndexedDB
 */
export async function hasCanvasSnapshot(canvasId: string): Promise<boolean> {
  try {
    const db = await getDB();
    const record = await db.get(STORE_NAME, getKey(canvasId));
    return record !== undefined;
  } catch (error) {
    return false;
  }
}

/**
 * Delete a canvas snapshot from IndexedDB
 */
export async function deleteCanvasSnapshot(canvasId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, getKey(canvasId));
  } catch (error) {
    console.warn('[persistence] Failed to delete canvas snapshot:', error);
  }
}

/**
 * Get the savedAt timestamp for a canvas snapshot
 */
export async function getCanvasSavedAt(canvasId: string): Promise<string | null> {
  try {
    const db = await getDB();
    const record = await db.get(STORE_NAME, getKey(canvasId)) as CanvasPersistenceRecord | undefined;
    return record?.savedAt ?? null;
  } catch (error) {
    return null;
  }
}
