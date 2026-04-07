/**
 * canvasPreviewStore — Zustand store for canvas preview state management
 * 
 * Responsibilities:
 * - Track active node selected in preview (activeNodeId)
 * - Track the current preview schema (previewSchema)
 * - Manage sync toggle between preview and editor (syncEnabled)
 * - Sync selection to componentStore when syncEnabled is true
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useComponentStore } from './componentStore';

interface CanvasPreviewState {
  // Currently selected node in preview (clicked by user)
  activeNodeId: string | null;
  // The schema being previewed
  previewSchema: Record<string, unknown> | null;
  // Whether edit↔preview sync is enabled
  syncEnabled: boolean;

  // Actions
  setActiveNode: (nodeId: string | null) => void;
  setPreviewSchema: (schema: Record<string, unknown> | null) => void;
  toggleSync: () => void;
  setSyncEnabled: (enabled: boolean) => void;
  clearActiveNode: () => void;
}

export const useCanvasPreviewStore = create<CanvasPreviewState>()(
  devtools(
    (set, get) => ({
      activeNodeId: null,
      previewSchema: null,
      syncEnabled: true,

      setActiveNode: (nodeId) => {
        set({ activeNodeId: nodeId });
        // When a node is selected in preview, sync to componentStore selection
        if (get().syncEnabled && nodeId) {
          const componentStore = useComponentStore.getState();
          // Add to selectedNodeIds (multi-select) or replace with single selection
          if (!componentStore.selectedNodeIds.includes(nodeId)) {
            componentStore.setSelectedNodeIds([nodeId]);
          }
        }
      },

      setPreviewSchema: (schema) => set({ previewSchema: schema }),

      toggleSync: () => set((s) => ({ syncEnabled: !s.syncEnabled })),

      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),

      clearActiveNode: () => set({ activeNodeId: null }),
    }),
    { name: 'CanvasPreviewStore' }
  )
);
