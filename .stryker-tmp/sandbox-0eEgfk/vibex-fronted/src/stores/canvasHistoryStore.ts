/**
 * canvasHistoryStore — Bridge to canvas history slice
 *
 * E3-T1: Exposes the three-tree undo/redo history through @/stores interface.
 * Delegates to @/lib/canvas/historySlice which contains the actual implementation.
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 console.log
 */
// @ts-nocheck

export {
  useHistoryStore,
  getHistoryStore,
} from '@/lib/canvas/historySlice';

export type {
  HistoryStack,
  HistoryState,
  HistorySlice,
} from '@/lib/canvas/historySlice';
