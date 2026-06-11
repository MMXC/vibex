/**
 * batchCanvasStore.ts — Sprint87 E3: Canvas Node Batch Operations
 *
 * 职责：管理 ReactFlow 画布节点的批量选中状态。
 * 与 SelectionToolbar（card 批量操作）不同，本 store 针对 ReactFlow nodes。
 *
 * E3 功能：
 * - Shift+点击追加/取消选中
 * - onSelectionChange 更新选中列表
 * - 批量删除/复制/移动
 */

import { create } from 'zustand';

// ============================================
// Types
// ============================================

export interface BatchCanvasState {
  /** Currently selected ReactFlow node IDs */
  selectedNodeIds: Set<string>;
  /** Whether batch mode is active (selection >= 2) */
  isBatchMode: boolean;

  // ---- Selection Actions ----
  /** Set selection from ReactFlow onSelectionChange */
  setSelection: (ids: string[]) => void;
  /** Toggle a single node's selection */
  toggleNode: (nodeId: string) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Add a node to selection (for Shift+click) */
  addToSelection: (nodeId: string) => void;
  /** Remove a node from selection */
  removeFromSelection: (nodeId: string) => void;

  // ---- Derived ----
  /** Get selected count */
  getSelectedCount: () => number;
  /** Check if a node is selected */
  isSelected: (nodeId: string) => boolean;
}

// ============================================
// Store
// ============================================

export const useBatchCanvasStore = create<BatchCanvasState>((set, get) => ({
  selectedNodeIds: new Set<string>(),
  isBatchMode: false,

  setSelection: (ids) =>
    set({
      selectedNodeIds: new Set(ids),
      isBatchMode: ids.length >= 2,
    }),

  toggleNode: (nodeId) =>
    set((state) => {
      const next = new Set(state.selectedNodeIds);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return { selectedNodeIds: next, isBatchMode: next.size >= 2 };
    }),

  clearSelection: () =>
    set({ selectedNodeIds: new Set<string>(), isBatchMode: false }),

  addToSelection: (nodeId) =>
    set((state) => {
      const next = new Set(state.selectedNodeIds);
      next.add(nodeId);
      return { selectedNodeIds: next, isBatchMode: next.size >= 2 };
    }),

  removeFromSelection: (nodeId) =>
    set((state) => {
      const next = new Set(state.selectedNodeIds);
      next.delete(nodeId);
      return { selectedNodeIds: next, isBatchMode: next.size >= 2 };
    }),

  getSelectedCount: () => get().selectedNodeIds.size,

  isSelected: (nodeId) => get().selectedNodeIds.has(nodeId),
}));
