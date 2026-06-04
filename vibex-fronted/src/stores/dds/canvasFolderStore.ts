/**
 * canvasFolderStore — Zustand Store for Canvas Folder Management
 *
 * 职责：管理画布文件夹的 CRUD 操作及画布-文件夹映射
 * E2 DoD: D2.1 (CRUD) + D2.2 (移动) + D2.5 (删除确认)
 * S63-E5 DoD: D5.1 (moveFolder) + D5.5 (batchMoveToFolder already existed)
 */

import { create } from 'zustand';
import { generateId } from '@/lib/canvas/id';

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  parentId: string | null; // null = root level
  /** Sort order within same parent (lower = higher in list) */
  order: number;
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

  // Move — canvas operations
  moveCanvasToFolder: (canvasId: string, folderId: string | null) => void;
  batchMoveToFolder: (canvasIds: string[], folderId: string | null) => void;

  // S63-E5: Folder drag-sort (D5.1)
  moveFolder: (folderId: string, targetParentId: string | null, insertIndex: number) => void;

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
    const siblings = parentId === null
      ? get().getRootFolders()
      : get().getChildFolders(parentId);
    // Append at end
    const order = siblings.length > 0 ? Math.max(...siblings.map(f => f.order)) + 1 : 0;
    set((state) => ({
      folders: [
        ...state.folders,
        { id, name: name.trim(), createdAt: Date.now(), parentId, order },
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

  // ---- Move — canvas operations ----

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

  // ---- S63-E5: Folder drag-sort (D5.1) ----

  moveFolder: (folderId, targetParentId, insertIndex) => {
    set((state) => {
      const folder = state.folders.find(f => f.id === folderId);
      if (!folder) return state;

      // Determine target siblings (same parent level)
      const targetSiblings = state.folders
        .filter(f => f.parentId === targetParentId && f.id !== folderId)
        .sort((a, b) => a.order - b.order);

      // If moving within same parent, remove from current position first
      const siblingsAfterRemoval = targetSiblings; // already filtered out folderId

      // Clamp insertIndex
      const clampedIndex = Math.max(0, Math.min(insertIndex, siblingsAfterRemoval.length));

      // Re-assign orders:
      // 1. All folders before insertIndex keep their order
      // 2. The moved folder gets the order of the item at clampedIndex (or 0 if empty)
      // 3. All folders from clampedIndex onward shift up
      const newFolders = state.folders.map(f => {
        if (f.id === folderId) {
          // Determine new order value
          let newOrder: number;
          if (siblingsAfterRemoval.length === 0) {
            newOrder = 0;
          } else if (clampedIndex === 0) {
            // Insert at beginning: give order < current first sibling's order
            newOrder = siblingsAfterRemoval[0].order - 1;
          } else if (clampedIndex >= siblingsAfterRemoval.length) {
            // Insert at end: give order > current last sibling's order
            newOrder = siblingsAfterRemoval[siblingsAfterRemoval.length - 1].order + 1;
          } else {
            // Insert between two siblings: midpoint between them
            const before = siblingsAfterRemoval[clampedIndex - 1].order;
            const after = siblingsAfterRemoval[clampedIndex].order;
            newOrder = (before + after) / 2;
          }
          return { ...f, parentId: targetParentId, order: newOrder };
        }
        return f;
      });

      // Re-normalize orders if they get too close (within 0.001)
      const allSorted = [...newFolders]
        .filter(f => f.parentId === targetParentId)
        .sort((a, b) => a.order - b.order);

      if (allSorted.length > 0) {
        let needsNorm = false;
        for (let i = 1; i < allSorted.length; i++) {
          if (allSorted[i].order - allSorted[i - 1].order < 0.001) {
            needsNorm = true;
            break;
          }
        }
        if (needsNorm) {
          const normalized = allSorted.map((f, i) => ({ ...f, order: i * 100 }));
          const normIds = new Set(normalized.map(f => f.id));
          return {
            folders: newFolders.map(f =>
              normIds.has(f.id)
                ? normalized.find(n => n.id === f.id)!
                : f
            ),
          };
        }
      }

      return { folders: newFolders };
    });
  },

  // ---- Query ----

  getFolderById: (folderId) => {
    return get().folders.find((f) => f.id === folderId);
  },

  getRootFolders: () => {
    return get().folders
      .filter((f) => f.parentId === null)
      .sort((a, b) => a.order - b.order);
  },

  getChildFolders: (parentId) => {
    return get().folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.order - b.order);
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
