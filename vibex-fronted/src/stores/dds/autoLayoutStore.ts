/**
 * autoLayoutStore — Zustand store for canvas auto-layout state
 *
 * Manages the auto-layout feature (S50-E2):
 * - `isLayouting`: whether a layout computation is in progress
 * - `fitViewRequested`: flag to trigger fitView after layout applied
 * - `lastLayoutDirection`: last used layout direction (TB or LR)
 *
 * S50-E2: 画布节点自动布局
 */

import { create } from 'zustand';
import type { LayoutDirection } from '@/lib/canvas/dagreLayout';

interface AutoLayoutState {
  isLayouting: boolean;
  fitViewRequested: number; // incremented to trigger fitView observer
  lastLayoutDirection: LayoutDirection;
}

interface AutoLayoutActions {
  startLayout: (direction: LayoutDirection) => void;
  endLayout: () => void;
  requestFitView: () => void;
  reset: () => void;
}

type AutoLayoutStore = AutoLayoutState & AutoLayoutActions;

export const useAutoLayoutStore = create<AutoLayoutStore>((set) => ({
  isLayouting: false,
  fitViewRequested: 0,
  lastLayoutDirection: 'TB',

  startLayout: (direction) =>
    set({ isLayouting: true, lastLayoutDirection: direction }),

  endLayout: () =>
    set((state) => ({ isLayouting: false, fitViewRequested: state.fitViewRequested + 1 })),

  requestFitView: () =>
    set((state) => ({ fitViewRequested: state.fitViewRequested + 1 })),

  reset: () =>
    set({ isLayouting: false, fitViewRequested: 0, lastLayoutDirection: 'TB' }),
}));
