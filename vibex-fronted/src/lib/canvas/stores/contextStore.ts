/**
 * VibeX Context Store — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 1 slice extraction.
 *
 * Responsibilities:
 * - BoundedContextNode CRUD operations
 * - Context draft state
 * - History recording on mutations
 * - User action messages via canvasStore.addMessage
 *
 * E1-S2: Collaboration sync — broadcasts node changes via collaborationSync
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BoundedContextNode, BoundedContextDraft, Phase, TreeType, BoundedGroup } from '../types';
import { getHistoryStore } from '../historySlice';
import { postContextActionMessage } from './messageBridge';

import { generateId } from '../id';
const getFlowStore = () => require('./flowStore').useFlowStore;

interface SelectedNodeIds {
  context: string[];
  flow: string[];
}

interface ContextStore {
  // Phase state
  phase: Phase;
  setPhase: (phase: Phase) => void;
  advancePhase: () => void;
  // Active tree
  activeTree: TreeType | null;
  setActiveTree: (tree: TreeType | null) => void;
  recomputeActiveTree: () => void;
  // Multi-select
  selectedNodeIds: SelectedNodeIds;
  toggleNodeSelect: (tree: TreeType, nodeId: string) => void;
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
  deleteAllNodes: () => void;
  confirmContextNode: (nodeId: string) => void;
  toggleContextNode: (nodeId: string) => void;
  toggleContextSelection: (nodeId: string) => void;
  setContextDraft: (draft: Partial<BoundedContextNode> | null) => void;
  // Bounded groups
  boundedGroups: BoundedGroup[];
  setBoundedGroups: (groups: BoundedGroup[]) => void;
}

// E1-S2: Lazy collaboration sync import (avoid circular dependency)
let _broadcastCreate: ((treeType: TreeType, nodeId: string, data: Record<string, unknown>) => void) | null = null;
let _broadcastUpdate: ((treeType: TreeType, nodeId: string, data: Record<string, unknown>) => void) | null = null;
let _broadcastDelete: ((treeType: TreeType, nodeId: string) => void) | null = null;
let _mergeHandlerRegistered = false;

async function getBroadcastFns() {
  if (!_broadcastCreate) {
    try {
      const mod = await import('../collaborationSync');
      _broadcastCreate = mod.broadcastNodeCreate;
      _broadcastUpdate = mod.broadcastNodeUpdate;
      _broadcastDelete = mod.broadcastNodeDelete;
    } catch {
      // collaborationSync not yet loaded — skip broadcast
    }
  }
  return { broadcastCreate: _broadcastCreate, broadcastUpdate: _broadcastUpdate, broadcastDelete: _broadcastDelete };
}

function safeBroadcastCreate(treeType: TreeType, nodeId: string, data: Record<string, unknown>) {
  getBroadcastFns().then(fn => fn.broadcastCreate?.(treeType, nodeId, data));
}
function safeBroadcastUpdate(treeType: TreeType, nodeId: string, data: Record<string, unknown>) {
  getBroadcastFns().then(fn => fn.broadcastUpdate?.(treeType, nodeId, data));
}
function safeBroadcastDelete(treeType: TreeType, nodeId: string) {
  getBroadcastFns().then(fn => fn.broadcastDelete?.(treeType, nodeId));
}

export const useContextStore = create<ContextStore>()(
  devtools(
    persist(
      (set, get) => ({
        // E3 S3.1: Phase state — drives the PhaseIndicator component
        phase: 'context',
        setPhase: (phase) => set({ phase }),
        advancePhase: () => {
          const phases: Phase[] = ['input', 'context', 'flow', 'component', 'prototype'];
          const idx = phases.indexOf(get().phase);
          if (idx < phases.length - 1) {
            const next = phases[idx + 1] as Phase;
            set({ phase: next });
            // Sync activeTree
            if (next === 'flow') set({ activeTree: 'flow' });
            else if (next === 'component') set({ activeTree: 'component' });
          }
        },
        // E3 S3.1: Active tree
        activeTree: null,
        setActiveTree: (tree) => set({ activeTree: tree }),
        recomputeActiveTree: () => {
          const ctxs = get().contextNodes.filter((n) => n.isActive !== false);
          const currentTree = get().activeTree;
          if (!currentTree && ctxs.length > 0) set({ activeTree: 'context' });
        },
        // E3 S3.1: Multi-select
        selectedNodeIds: { context: [], flow: [] },
        toggleNodeSelect: (tree, nodeId) =>
          set((s) => {
            if (tree === 'context') {
              const exists = s.selectedNodeIds.context.includes(nodeId);
              return {
                selectedNodeIds: {
                  ...s.selectedNodeIds,
                  context: exists
                    ? s.selectedNodeIds.context.filter((id) => id !== nodeId)
                    : [...s.selectedNodeIds.context, nodeId],
                },
              };
            }
            if (tree === 'flow') {
              const exists = s.selectedNodeIds.flow.includes(nodeId);
              return {
                selectedNodeIds: {
                  ...s.selectedNodeIds,
                  flow: exists
                    ? s.selectedNodeIds.flow.filter((id) => id !== nodeId)
                    : [...s.selectedNodeIds.flow, nodeId],
                },
              };
            }
            return s;
          }),
        selectAllNodes: (tree) =>
          set((s) => {
            if (tree === 'context') {
              return { selectedNodeIds: { ...s.selectedNodeIds, context: s.contextNodes.map((n) => n.nodeId) } };
            }
            if (tree === 'flow') {
              // flow selection managed by flowStore; contextStore tracks flow selection via selectedNodeIds
              return s;
            }
            return s;
          }),
        clearNodeSelection: (tree) =>
          set((s) => {
            if (tree === 'context') {
              return { selectedNodeIds: { ...s.selectedNodeIds, context: [] } };
            }
            if (tree === 'flow') {
              return { selectedNodeIds: { ...s.selectedNodeIds, flow: [] } };
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
          // E1: flow branch — delegate to flowStore for actual deletion (includes recordSnapshot)
          if (tree === 'flow' && selectedNodeIds.flow.length > 0) {
            getFlowStore().getState().deleteSelectedNodes();
            return;
          }
        },
        // Existing fields
        contextNodes: [],
        contextDraft: null,

        setContextNodes: (nodes) => set({ contextNodes: nodes }),

        addContextNode: (data) => {
          const nodeId = generateId();
          const newNode: BoundedContextNode = {
            nodeId,
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
          // E1-S2: 广播节点创建
          safeBroadcastCreate('context', nodeId, newNode as unknown as Record<string, unknown>);
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
          // E1-S2: 广播节点更新
          safeBroadcastUpdate('context', nodeId, data as Record<string, unknown>);
        },

        deleteContextNode: (nodeId) => {
          const nodeToDelete = get().contextNodes.find((n) => n.nodeId === nodeId);
          const deletedName = nodeToDelete?.name ?? nodeId;
          set((s) => {
            const newNodes = s.contextNodes.filter((n) => n.nodeId !== nodeId);
            getHistoryStore().recordSnapshot('context', newNodes);
            return { contextNodes: newNodes };
          });
          // E1-S2: 广播节点删除
          safeBroadcastDelete('context', nodeId);
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

        // E4: Batch delete all context nodes with single snapshot
        deleteAllNodes: () => {
          const ctxs = get().contextNodes;
          if (ctxs.length === 0) return;
          getHistoryStore().recordSnapshot('context', []);
          set({ contextNodes: [], selectedNodeIds: { ...get().selectedNodeIds, context: [] } });
          // E1-S2: 广播所有节点删除
          ctxs.forEach((n) => safeBroadcastDelete('context', n.nodeId));
        },

        toggleContextNode: (nodeId) => {
          const node = get().contextNodes.find((n) => n.nodeId === nodeId);
          if (!node) return;
          if (node.status === 'confirmed') {
            // Unconfirm
            set((s) => ({
              contextNodes: s.contextNodes.map((n) =>
                n.nodeId === nodeId ? { ...n, isActive: false, status: 'pending' as const } : n
              ),
            }));
          } else {
            // Confirm
            set((s) => ({
              contextNodes: s.contextNodes.map((n) =>
                n.nodeId === nodeId ? { ...n, isActive: true, status: 'confirmed' as const } : n
              ),
            }));
          }
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

        boundedGroups: [],
        setBoundedGroups: (groups) => set({ boundedGroups: groups }),
      }),
      { name: 'vibex-context-store', skipHydration: true }
    ),
    { name: 'ContextStore' }
  )
);
