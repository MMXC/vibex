/**
 * VibeX Context Store — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 1 slice extraction.
 *
 * Responsibilities:
 * - BoundedContextNode CRUD operations
 * - Context draft state
 * - History recording on mutations
 * - User action messages via canvasStore.addMessage
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BoundedContextNode, BoundedContextDraft, Phase, TreeType } from '../types';
import { getHistoryStore } from '../historySlice';
import { postContextActionMessage } from './messageBridge';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface SelectedNodeIds {
  context: string[];
  flow: string[];
}

interface ContextStore {
  // Phase state
  phase: Phase;
  setPhase: (phase: Phase) => void;
  // Active tree
  activeTree: TreeType | null;
  setActiveTree: (tree: TreeType | null) => void;
  recomputeActiveTree: () => void;
  // Multi-select
  selectedNodeIds: SelectedNodeIds;
  selectAllNodes: (tree: TreeType) => void;
  clearNodeSelection: (tree: TreeType) => void;
  deleteSelectedNodes: (tree: TreeType) => void;
  // Context nodes
  contextNodes: BoundedContextNode[];
  contextDraft: Partial<BoundedContextNode> | null;
  setContextNodes: (nodes: BoundedContextNode[]) => void;
  addContextNode: (data: BoundedContextDraft) => void;
  editContextNode: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  deleteContextNode: (nodeId: string) => void;
  confirmContextNode: (nodeId: string) => void;
  toggleContextSelection: (nodeId: string) => void;
  setContextDraft: (draft: Partial<BoundedContextNode> | null) => void;
}

export const useContextStore = create<ContextStore>()(
  devtools(
    persist(
      (set, get) => ({
        // E3 S3.1: Phase state — drives the PhaseIndicator component
        phase: 'input',
        setPhase: (phase) => set({ phase }),
        // E3 S3.1: Active tree
        activeTree: null,
        setActiveTree: (tree) => set({ activeTree: tree }),
        recomputeActiveTree: () => {
          const ctxs = get().contextNodes.filter((n) => n.isActive !== false);
          const flows = []; // accessed via flowStore
          const currentTree = get().activeTree;
          if (!currentTree && ctxs.length > 0) set({ activeTree: 'context' });
        },
        // E3 S3.1: Multi-select
        selectedNodeIds: { context: [], flow: [] },
        selectAllNodes: (tree) =>
          set((s) => {
            if (tree === 'context') {
              return { selectedNodeIds: { ...s.selectedNodeIds, context: s.contextNodes.map((n) => n.nodeId) } };
            }
            return s;
          }),
        clearNodeSelection: (tree) =>
          set((s) => {
            if (tree === 'context') {
              return { selectedNodeIds: { ...s.selectedNodeIds, context: [] } };
            }
            return s;
          }),
        deleteSelectedNodes: (tree) => {
          const { selectedNodeIds, contextNodes } = get();
          if (tree === 'context' && selectedNodeIds.context.length > 0) {
            const ids = new Set(selectedNodeIds.context);
            const remaining = contextNodes.filter((n) => !ids.has(n.nodeId));
            const newSelected = { context: [], flow: selectedNodeIds.flow };
            getHistoryStore().recordSnapshot('context', remaining);
            set({ contextNodes: remaining, selectedNodeIds: newSelected });
            selectedNodeIds.context.forEach((id) => {
              const node = contextNodes.find((n) => n.nodeId === id);
              postContextActionMessage(`删除了上下文节点`, node?.name ?? id);
            });
          }
        },
        // Existing fields
        contextNodes: [],
        contextDraft: null,

        setContextNodes: (nodes) => set({ contextNodes: nodes }),

        addContextNode: (data) => {
          const newNode: BoundedContextNode = {
            nodeId: generateId(),
            name: data.name,
            description: data.description,
            type: data.type,
            isActive: false,
            status: 'pending',
            children: [],
          };
          set((s) => {
            const newNodes = [...s.contextNodes, { ...newNode }];
            getHistoryStore().recordSnapshot('context', newNodes);
            return { contextNodes: newNodes };
          });
          // Side effect: record user action message
          postContextActionMessage(`添加了上下文节点`, data.name);
        },

        editContextNode: (nodeId, data) => {
          set((s) => {
            const newNodes = s.contextNodes.map((n) =>
              n.nodeId === nodeId ? { ...n, ...data, status: 'pending' as const } : n
            );
            getHistoryStore().recordSnapshot('context', newNodes);
            return { contextNodes: newNodes };
          });
        },

        deleteContextNode: (nodeId) => {
          const nodeToDelete = get().contextNodes.find((n) => n.nodeId === nodeId);
          const deletedName = nodeToDelete?.name ?? nodeId;
          set((s) => {
            const newNodes = s.contextNodes.filter((n) => n.nodeId !== nodeId);
            getHistoryStore().recordSnapshot('context', newNodes);
            return { contextNodes: newNodes };
          });
          // Side effect: record user action message
          postContextActionMessage(`删除了上下文节点`, deletedName);
        },

        confirmContextNode: (nodeId) => {
          set((s) => {
            const newNodes = s.contextNodes.map((n) =>
              n.nodeId === nodeId
                ? { ...n, isActive: true, status: 'confirmed' as const }
                : n
            );
            return { contextNodes: newNodes };
          });
        },

        toggleContextSelection: (nodeId) =>
          set((state) => ({
            contextNodes: state.contextNodes.map((node) =>
              node.nodeId === nodeId
                ? { ...node, selected: !node.selected }
                : node
            ),
          })),

        setContextDraft: (draft) => set({ contextDraft: draft }),
      }),
      { name: 'vibex-context-store' }
    ),
    { name: 'ContextStore' }
  )
);
