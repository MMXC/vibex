/**
 * batchOpsStore.ts — Sprint60 E2: Batch Operations UI State
 *
 * 职责：管理批量操作的浮层状态（确认对话框、重命名对话框、选中的画布 ID 列表）。
 * 不直接操作 IndexedDB —— 实际的删除/重命名由 canvasListStore.batchDeleteCanvas / batchRenameCanvas 执行。
 */

import { create } from 'zustand';

// ============================================
// Types
// ============================================

export type RenameMode = 'prefix' | 'suffix';

export interface BatchOpsState {
  /** Whether the delete confirmation dialog is open */
  isDeleteDialogOpen: boolean;
  /** Whether the rename dialog is open */
  isRenameDialogOpen: boolean;
  /** Current rename mode: prefix or suffix replacement */
  renameMode: RenameMode;
  /** Current prefix text in rename dialog */
  renamePrefix: string;
  /** Current suffix text in rename dialog */
  renameSuffix: string;
  /** Whether a batch operation is in progress (shows loading state) */
  isOperating: boolean;

  // Actions
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  openRenameDialog: () => void;
  closeRenameDialog: () => void;
  setRenameMode: (mode: RenameMode) => void;
  setRenamePrefix: (value: string) => void;
  setRenameSuffix: (value: string) => void;
  setIsOperating: (value: boolean) => void;
  reset: () => void;
}

// ============================================
// Store
// ============================================

export const useBatchOpsStore = create<BatchOpsState>((set) => ({
  isDeleteDialogOpen: false,
  isRenameDialogOpen: false,
  renameMode: 'suffix',
  renamePrefix: '',
  renameSuffix: '',
  isOperating: false,

  openDeleteDialog: () => set({ isDeleteDialogOpen: true }),
  closeDeleteDialog: () => set({ isDeleteDialogOpen: false }),
  openRenameDialog: () => set({ isRenameDialogOpen: true }),
  closeRenameDialog: () =>
    set({ isRenameDialogOpen: false, renamePrefix: '', renameSuffix: '', renameMode: 'suffix' }),
  setRenameMode: (mode) => set({ renameMode: mode }),
  setRenamePrefix: (value) => set({ renamePrefix: value }),
  setRenameSuffix: (value) => set({ renameSuffix: value }),
  setIsOperating: (value) => set({ isOperating: value }),
  reset: () =>
    set({
      isDeleteDialogOpen: false,
      isRenameDialogOpen: false,
      renameMode: 'suffix',
      renamePrefix: '',
      renameSuffix: '',
      isOperating: false,
    }),
}));
