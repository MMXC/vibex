/**
 * conflictStore.ts — Sprint58 E5: 协作冲突增强
 *
 * 管理协作冲突状态：
 * - conflictData: 当前冲突的本地/远程数据
 * - resolvedStrategy: 用户选择的解决策略
 * - manualMergeContent: 手动合并编辑器内容
 *
 * 由 wsConflictHandler.ts 写入，ConflictDialog.tsx 读取。
 */

'use client';

import { create } from 'zustand';

export type ConflictResolution = 'local' | 'remote' | 'manual';

export interface ConflictData {
  local: unknown;
  remote: unknown;
  canvasId: string;
  localRevision: number;
  remoteRevision: number;
}

export interface ConflictState {
  /** 当前冲突数据，null 表示无冲突 */
  conflictData: ConflictData | null;
  /** 用户选择的解决策略 */
  resolvedStrategy: ConflictResolution | null;
  /** 手动合并编辑器内容 */
  manualMergeContent: string;
  /** 是否正在显示手动合并编辑器 */
  isManualMergeEditing: boolean;

  /** 设置冲突数据（由 wsConflictHandler 调用） */
  setConflict: (data: ConflictData) => void;
  /** 设置解决策略 */
  resolveConflict: (strategy: ConflictResolution) => void;
  /** 设置手动合并内容 */
  setManualMergeContent: (content: string) => void;
  /** 切换到手动合并编辑模式 */
  startManualMerge: () => void;
  /** 清除冲突状态 */
  clearConflict: () => void;
}

export const useConflictStore = create<ConflictState>((set) => ({
  conflictData: null,
  resolvedStrategy: null,
  manualMergeContent: '',
  isManualMergeEditing: false,

  setConflict: (data) =>
    set({ conflictData: data, resolvedStrategy: null, manualMergeContent: '', isManualMergeEditing: false }),

  resolveConflict: (strategy) => set({ resolvedStrategy: strategy }),

  setManualMergeContent: (content) => set({ manualMergeContent: content }),

  startManualMerge: () => set({ isManualMergeEditing: true }),

  clearConflict: () =>
    set({ conflictData: null, resolvedStrategy: null, manualMergeContent: '', isManualMergeEditing: false }),
}));
