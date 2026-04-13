/**
 * VibeX UI Store — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 2 slice extraction.
 *
 * Responsibilities:
 * - Panel collapse state (context/flow/component)
 * - Expand/m maximize mode
 * - Drag state
 * - Left/right drawer state
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type PanelExpandState = 'default' | 'expand-left' | 'expand-right';
export type CanvasExpandMode = 'normal' | 'expand-both' | 'maximize';

interface UIStore {
  // Panel collapse
  contextPanelCollapsed: boolean;
  flowPanelCollapsed: boolean;
  componentPanelCollapsed: boolean;
  toggleContextPanel: () => void;
  toggleFlowPanel: () => void;
  toggleComponentPanel: () => void;

  // Expand state
  leftExpand: PanelExpandState;
  centerExpand: PanelExpandState;
  rightExpand: PanelExpandState;
  getGridTemplate: () => string;
  setLeftExpand: (state: PanelExpandState) => void;
  setCenterExpand: (state: PanelExpandState) => void;
  setRightExpand: (state: PanelExpandState) => void;
  togglePanel: (panel: 'left' | 'center' | 'right') => void;
  resetExpand: () => void;

  // Expand mode (F1)
  expandMode: CanvasExpandMode;
  setExpandMode: (mode: CanvasExpandMode) => void;
  toggleMaximize: () => void;

  // Drag state
  draggedNodeId: string | null;
  dragOverNodeId: string | null;
  draggedPositions: Record<string, { x: number; y: number }>;
  isDragging: boolean;
  startDrag: (nodeId: string) => void;
  endDrag: (nodeId: string, position: { x: number; y: number }) => void;
  setDragOver: (nodeId: string | null) => void;
  updateDraggedPosition: (nodeId: string, position: { x: number; y: number }) => void;
  clearDragPositions: () => void;
  clearDragPosition: (nodeId: string) => void;

  // Left/Right Drawer
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  leftDrawerWidth: number;
  rightDrawerWidth: number;
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  openRightDrawer: () => void;
  setLeftDrawerWidth: (width: number) => void;
  setRightDrawerWidth: (width: number) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Panel collapse
        contextPanelCollapsed: false,
        flowPanelCollapsed: false,
        componentPanelCollapsed: false,

        toggleContextPanel: () =>
          set((s) => ({ contextPanelCollapsed: !s.contextPanelCollapsed })),
        toggleFlowPanel: () =>
          set((s) => ({ flowPanelCollapsed: !s.flowPanelCollapsed })),
        toggleComponentPanel: () =>
          set((s) => ({ componentPanelCollapsed: !s.componentPanelCollapsed })),

        // Expand state
        leftExpand: 'default',
        centerExpand: 'default',
        rightExpand: 'default',

        getGridTemplate: () => '1fr 1fr 1fr',

        setLeftExpand: (state) => set({ leftExpand: state }),
        setCenterExpand: (state) => set({ centerExpand: state }),
        setRightExpand: (state) => set({ rightExpand: state }),

        togglePanel: (panel) => {
          if (panel === 'left') {
            const { leftExpand } = get();
            const next = leftExpand === 'default' ? 'expand-right'
              : leftExpand === 'expand-right' ? 'default'
              : leftExpand;
            set({ leftExpand: next as PanelExpandState });
          } else if (panel === 'center') {
            const { centerExpand } = get();
            const next = centerExpand === 'default' ? 'expand-left'
              : centerExpand === 'expand-left' ? 'expand-right'
              : centerExpand === 'expand-right' ? 'default'
              : 'default';
            set({ centerExpand: next as PanelExpandState });
          } else {
            const { rightExpand } = get();
            const next = rightExpand === 'default' ? 'expand-left'
              : rightExpand === 'expand-left' ? 'default'
              : rightExpand;
            set({ rightExpand: next as PanelExpandState });
          }
        },

        resetExpand: () => set({ leftExpand: 'default', centerExpand: 'default', rightExpand: 'default', expandMode: 'normal' as CanvasExpandMode }),

        // Expand mode
        expandMode: 'normal' as CanvasExpandMode,

        setExpandMode: (mode) => {
          set({ expandMode: mode });
          try { localStorage.setItem('canvas-expand-mode', mode); } catch { /* ignore */ }
        },

        toggleMaximize: () => {
          const next = get().expandMode === 'maximize' ? 'normal' : 'maximize';
          set({ expandMode: next as CanvasExpandMode });
          try { localStorage.setItem('canvas-expand-mode', next); } catch { /* ignore */ }
        },

        // Drag state
        draggedNodeId: null,
        dragOverNodeId: null,
        draggedPositions: {},
        isDragging: false,

        startDrag: (nodeId) => set({ draggedNodeId: nodeId, isDragging: true }),
        endDrag: (nodeId, position) =>
          set((s) => ({
            draggedNodeId: null,
            dragOverNodeId: null,
            isDragging: false,
            draggedPositions: { ...s.draggedPositions, [nodeId]: position },
          })),
        setDragOver: (nodeId) => set({ dragOverNodeId: nodeId }),
        updateDraggedPosition: (nodeId, position) =>
          set((s) => ({ draggedPositions: { ...s.draggedPositions, [nodeId]: position } })),
        clearDragPositions: () => set({ draggedPositions: {}, draggedNodeId: null, isDragging: false }),
        clearDragPosition: (nodeId) =>
          set((s) => {
            const { [nodeId]: _, ...rest } = s.draggedPositions;
            return { draggedPositions: rest };
          }),

        // Left/Right Drawer
        leftDrawerOpen: false,
        rightDrawerOpen: false,
        leftDrawerWidth: 300,
        rightDrawerWidth: 360,

        toggleLeftDrawer: () => set((s) => ({ leftDrawerOpen: !s.leftDrawerOpen })),
        toggleRightDrawer: () => set((s) => ({ rightDrawerOpen: !s.rightDrawerOpen })),
        openRightDrawer: () => set({ rightDrawerOpen: true }),
        setLeftDrawerWidth: (width) => set({ leftDrawerWidth: Math.min(400, Math.max(100, width)) }),
        setRightDrawerWidth: (width) => set({ rightDrawerWidth: Math.min(400, Math.max(100, width)) }),
      }),
      { name: 'vibex-ui-store', skipHydration: true }
    ),
    { name: 'UIStore' }
  )
);
