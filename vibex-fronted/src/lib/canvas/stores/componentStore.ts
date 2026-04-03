/**
 * VibeX componentStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 4 slice extraction.
 *
 * Responsibilities:
 * - ComponentNode state (componentNodes, componentDraft)
 * - CRUD operations on component nodes
 * - Multi-select for component tree
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ComponentNode } from '../types';
import { getHistoryStore } from '../historySlice';

import { generateId } from '../id';

interface ComponentStore {
  // State
  componentNodes: ComponentNode[];
  componentDraft: Partial<ComponentNode> | null;
  selectedNodeIds: string[];

  // Node CRUD
  setComponentNodes: (nodes: ComponentNode[]) => void;
  addComponentNode: (data: Omit<ComponentNode, 'nodeId' | 'status' | 'isActive' | 'children'>) => void;
  editComponentNode: (nodeId: string, data: Partial<ComponentNode>) => void;
  deleteComponentNode: (nodeId: string) => void;

  // Draft
  setComponentDraft: (draft: Partial<ComponentNode> | null) => void;

  // Multi-select
  toggleNodeSelect: (nodeId: string) => void;
  selectNode: (nodeId: string) => void;
  clearNodeSelection: () => void;
  selectAllNodes: () => void;
  deleteSelectedNodes: () => void;
  clearComponentCanvas: () => void;
}

export const useComponentStore = create<ComponentStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        componentNodes: [],
        componentDraft: null,
        selectedNodeIds: [],

        setComponentNodes: (nodes) => set({ componentNodes: nodes }),

        addComponentNode: (data) => {
          const newNode: ComponentNode = {
            ...data,
            nodeId: generateId(),
            status: 'pending',
            isActive: false,
            children: [],
          };
          set((s) => {
            const newNodes = [...s.componentNodes, newNode];
            return { componentNodes: newNodes };
          });
        },

        editComponentNode: (nodeId, data) => {
          set((s) => ({
            componentNodes: s.componentNodes.map((n) =>
              n.nodeId === nodeId ? { ...n, ...data, status: 'pending' as const } : n
            ),
          }));
        },

        deleteComponentNode: (nodeId) => {
          set((s) => ({
            componentNodes: s.componentNodes.filter((n) => n.nodeId !== nodeId),
          }));
        },

        setComponentDraft: (draft) => set({ componentDraft: draft }),

        // Multi-select
        toggleNodeSelect: (nodeId) => {
          set((s) => {
            const exists = s.selectedNodeIds.includes(nodeId);
            return {
              selectedNodeIds: exists
                ? s.selectedNodeIds.filter((id) => id !== nodeId)
                : [...s.selectedNodeIds, nodeId],
            };
          });
        },

        selectNode: (nodeId) => set({ selectedNodeIds: [nodeId] }),

        clearNodeSelection: () => set({ selectedNodeIds: [] }),

        selectAllNodes: () =>
          set((s) => ({
            selectedNodeIds: s.componentNodes.map((n) => n.nodeId),
          })),

        deleteSelectedNodes: () => {
          const { selectedNodeIds, componentNodes } = get();
          if (selectedNodeIds.length === 0) return;
          const toDelete = new Set(selectedNodeIds);
          set({ componentNodes: componentNodes.filter((n) => !toDelete.has(n.nodeId)), selectedNodeIds: [] });
        },

        clearComponentCanvas: () => {
          getHistoryStore().recordSnapshot('component', []);
          set({ componentNodes: [], selectedNodeIds: [], componentDraft: null });
        },
      }),
      { name: 'vibex-component-store' }
    ),
    { name: 'ComponentStore' }
  )
);
