/**
 * canvasFolderStore — Zustand Store for Canvas Folder Management
 *
 * 职责：管理画布文件夹的 CRUD 操作及画布-文件夹映射
 * E2 DoD: D2.1 (CRUD) + D2.2 (移动) + D2.5 (删除确认)
 */

import { create } from 'zustand';
import { generateId } from '@/lib/canvas/id';

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  parentId: string | null; // null = root level
}

export interface CanvasFolderStoreState {
  folders: Folder[];
  /** canvasId → folderId (null = root) */
  canvasFolderMap: Record<string, string | null>;
  pendingDeleteFolderId: string | null; // for confirmation dialog

  // CRUD
  createFolder: (name: string, parentId?: string | null) => string;
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string) => { orphanedCanvases: string[] } | null;
  setPendingDeleteFolder: (folderId: string | null) => void;

  // Move
  moveCanvasToFolder: (canvasId: string, folderId: string | null) => void;
  batchMoveToFolder: (canvasIds: string[], folderId: string | null) => void;

  // Query
  getFolderById: (folderId: string) => Folder | undefined;
  getRootFolders: () => Folder[];
  getChildFolders: (parentId: string) => Folder[];
  getCanvasesInFolder: (folderId: string | null) => string[];
  isFolderNameTaken: (name: string, parentId?: string | null, excludeId?: string) => boolean;
}

export const useCanvasFolderStore = create<CanvasFolderStoreState>((set, get) => ({
  folders: [],
  canvasFolderMap: {},
  pendingDeleteFolderId: null,

  // ---- CRUD ----

  createFolder: (name, parentId = null) => {
    const id = generateId('folder');
    set((state) => ({
      folders: [
        ...state.folders,
        { id, name: name.trim(), createdAt: Date.now(), parentId },
      ],
    }));
    return id;
  },

  renameFolder: (folderId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === folderId ? { ...f, name: trimmed } : f
      ),
    }));
  },

  deleteFolder: (folderId) => {
    if (!get().folders.some((f) => f.id === folderId)) return null;
    const state = get();
    const orphanedCanvases = state.getCanvasesInFolder(folderId);

    set((state) => {
      // Move canvases back to root
      const newMap = { ...state.canvasFolderMap };
      for (const canvasId of orphanedCanvases) {
        newMap[canvasId] = null;
      }

      // Remove folder and all child folders recursively
      const idsToRemove = new Set<string>([folderId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of state.folders) {
          if (f.parentId && idsToRemove.has(f.parentId) && !idsToRemove.has(f.id)) {
            idsToRemove.add(f.id);
            changed = true;
          }
        }
      }

      return {
        folders: state.folders.filter((f) => !idsToRemove.has(f.id)),
        canvasFolderMap: newMap,
        pendingDeleteFolderId: null,
      };
    });

    return { orphanedCanvases };
  },

  setPendingDeleteFolder: (folderId) => {
    set({ pendingDeleteFolderId: folderId });
  },

  // ---- Move ----

  moveCanvasToFolder: (canvasId, folderId) => {
    set((state) => ({
      canvasFolderMap: { ...state.canvasFolderMap, [canvasId]: folderId },
    }));
  },

  batchMoveToFolder: (canvasIds, folderId) => {
    set((state) => {
      const newMap = { ...state.canvasFolderMap };
      for (const id of canvasIds) {
        newMap[id] = folderId;
      }
      return { canvasFolderMap: newMap };
    });
  },

  // ---- Query ----

  getFolderById: (folderId) => {
    return get().folders.find((f) => f.id === folderId);
  },

  getRootFolders: () => {
    return get().folders.filter((f) => f.parentId === null);
  },

  getChildFolders: (parentId) => {
    return get().folders.filter((f) => f.parentId === parentId);
  },

  getCanvasesInFolder: (folderId) => {
    const map = get().canvasFolderMap;
    return Object.entries(map)
      .filter(([, fId]) => fId === folderId)
      .map(([canvasId]) => canvasId);
  },

  isFolderNameTaken: (name, parentId = null, excludeId) => {
    const trimmed = name.trim();
    return get().folders.some(
      (f) =>
        f.id !== excludeId &&
        f.name === trimmed &&
        f.parentId === parentId
    );
  },
}));
