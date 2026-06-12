/**
 * annotationStore — Sprint90 E4
 *
 * Canvas Annotation Layer state. Distinguishes from commentStore:
 * - annotations are free-floating marks at canvas coordinates (x, y)
 * - not bound to nodes
 * - render via AnnotationLayer which inherits CSS transform from canvas grid
 *
 * Design:
 * - Zustand store with IndexedDB persistence (offline-first)
 * - CRUD: add, update (content/position), resolve, delete
 * - Optimistic updates: local state changes immediately, syncs to backend async
 * - Reuses commentStore's idb open pattern; unique DB name to avoid collision
 */

import { create } from 'zustand';
import { openDB } from 'idb';

// ==================== Types ====================

export type AnnotationStatus = 'active' | 'resolved';

export type AnnotationType = 'point' | 'highlight' | 'note';

export interface Annotation {
  id: string;
  canvasId: string;
  content: string;
  x: number;
  y: number;
  type: AnnotationType;
  authorId: string;
  authorName?: string;
  color?: string;
  status: AnnotationStatus;
  createdAt: number;
  updatedAt: number;
}

/** Input payload for creating an annotation (id/timestamps auto-generated). */
export type AnnotationCreateInput = Omit<Annotation, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

/** Input payload for updating an annotation (only mutable fields). */
export interface AnnotationUpdateInput {
  content?: string;
  status?: AnnotationStatus;
  x?: number;
  y?: number;
}

export interface AnnotationStoreState {
  annotations: Annotation[];
  initialized: boolean;
  loadingCanvasId: string | null;

  // Initialization
  loadForCanvas: (canvasId: string) => Promise<void>;
  clear: () => void;

  // CRUD — local first; caller decides sync strategy
  addAnnotation: (input: AnnotationCreateInput) => Annotation;
  updateAnnotation: (id: string, patch: AnnotationUpdateInput) => void;
  resolveAnnotation: (id: string) => void;
  unresolveAnnotation: (id: string) => void;
  deleteAnnotation: (id: string) => void;

  // Queries
  getById: (id: string) => Annotation | undefined;
  getActive: () => Annotation[];
  getResolved: () => Annotation[];
  getByAuthor: (authorId: string) => Annotation[];
}

// ==================== IndexedDB ====================

const DB_NAME = 'vibex-annotations';
const DB_VERSION = 1;
const STORE = 'annotations';

let _db: Awaited<ReturnType<typeof openDB>> | null = null;

async function initDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('by-canvas', 'canvasId');
        store.createIndex('by-status', 'status');
        store.createIndex('by-author', 'authorId');
        store.createIndex('by-created', 'createdAt');
      }
    },
  });
  return _db;
}

async function loadAnnotationsForCanvas(canvasId: string): Promise<Annotation[]> {
  const db = await initDB();
  const tx = db.transaction(STORE, 'readonly');
  const idx = tx.store.index('by-canvas');
  const rows = await idx.getAll(canvasId);
  await tx.done;
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

async function saveAnnotation(annotation: Annotation): Promise<void> {
  const db = await initDB();
  await db.put(STORE, annotation);
}

async function deleteAnnotationFromDB(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE, id);
}

// ==================== Helpers ====================

function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `ann_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ==================== Store ====================

export const useAnnotationStore = create<AnnotationStoreState>((set, get) => ({
  annotations: [],
  initialized: false,
  loadingCanvasId: null,

  loadForCanvas: async (canvasId: string) => {
    set({ loadingCanvasId: canvasId });
    try {
      const rows = await loadAnnotationsForCanvas(canvasId);
      set({
        annotations: rows,
        initialized: true,
        loadingCanvasId: null,
      });
    } catch (err) {
      // Persistence is best-effort; mark initialized so UI proceeds
      // eslint-disable-next-line no-console
      console.error('[annotationStore] loadForCanvas failed:', err);
      set({ initialized: true, loadingCanvasId: null });
    }
  },

  clear: () => {
    set({ annotations: [], initialized: false, loadingCanvasId: null });
  },

  addAnnotation: (input) => {
    const now = Date.now();
    const annotation: Annotation = {
      id: generateLocalId(),
      canvasId: input.canvasId,
      content: input.content,
      x: input.x,
      y: input.y,
      type: input.type,
      authorId: input.authorId,
      authorName: input.authorName,
      color: input.color,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ annotations: [...state.annotations, annotation] }));
    // Fire-and-forget persistence
    saveAnnotation(annotation).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[annotationStore] persist addAnnotation failed:', err);
    });
    return annotation;
  },

  updateAnnotation: (id, patch) => {
    let updated: Annotation | undefined;
    set((state) => ({
      annotations: state.annotations.map((a) => {
        if (a.id !== id) return a;
        updated = {
          ...a,
          ...patch,
          updatedAt: Date.now(),
        };
        return updated;
      }),
    }));
    if (updated) {
      saveAnnotation(updated).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[annotationStore] persist updateAnnotation failed:', err);
      });
    }
  },

  resolveAnnotation: (id) => {
    get().updateAnnotation(id, { status: 'resolved' });
  },

  unresolveAnnotation: (id) => {
    get().updateAnnotation(id, { status: 'active' });
  },

  deleteAnnotation: (id) => {
    set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) }));
    deleteAnnotationFromDB(id).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[annotationStore] persist deleteAnnotation failed:', err);
    });
  },

  getById: (id) => get().annotations.find((a) => a.id === id),
  getActive: () => get().annotations.filter((a) => a.status === 'active'),
  getResolved: () => get().annotations.filter((a) => a.status === 'resolved'),
  getByAuthor: (authorId) => get().annotations.filter((a) => a.authorId === authorId),
}));