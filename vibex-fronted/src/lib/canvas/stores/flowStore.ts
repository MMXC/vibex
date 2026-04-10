/**
 * VibeX flowStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 3 slice extraction.
 *
 * Responsibilities:
 * - BusinessFlowNode state (flowNodes, flowDraft)
 * - CRUD operations on flow nodes and their steps
 * - Step-level confirm/edit/delete/reorder
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BusinessFlowNode, BusinessFlowDraft, FlowStep, BoundedContextNode } from '../types';
import { getHistoryStore } from '../historySlice';
import { useSessionStore } from './sessionStore';
import { canvasApi } from '../api/canvasApi';

import { generateId } from '../id';

// E1-S2: Collaboration sync helpers
function safeBroadcastCreate(treeType: 'flow', nodeId: string, data: Record<string, unknown>) {
  import('../collaborationSync').then(mod => mod.broadcastNodeCreate(treeType, nodeId, data)).catch(() => {});
}
function safeBroadcastUpdate(treeType: 'flow', nodeId: string, data: Record<string, unknown>) {
  import('../collaborationSync').then(mod => mod.broadcastNodeUpdate(treeType, nodeId, data)).catch(() => {});
}
function safeBroadcastDelete(treeType: 'flow', nodeId: string) {
  import('../collaborationSync').then(mod => mod.broadcastNodeDelete(treeType, nodeId)).catch(() => {});
}

interface FlowStore {
  // State
  flowNodes: BusinessFlowNode[];
  flowDraft: Partial<BusinessFlowNode> | null;
  flowGenerating: boolean;
  flowError: string | null;
  // Selection state (E2: TreeToolbar select/deselect for Flow panel)
  selectedNodeIds: Set<string>;

  // Node CRUD
  setFlowNodes: (nodes: BusinessFlowNode[]) => void;
  addFlowNode: (data: BusinessFlowDraft) => void;
  editFlowNode: (nodeId: string, data: Partial<BusinessFlowNode>) => void;
  deleteFlowNode: (nodeId: string) => void;
  confirmFlowNode: (nodeId: string) => void;
  toggleFlowNode: (nodeId: string) => void;
  autoGenerateFlows: (contextNodes: BoundedContextNode[]) => void;
  // Selection (E2: TreeToolbar buttons)
  selectAllNodes: () => void;
  clearNodeSelection: () => void;
  deleteSelectedNodes: () => void;
  clearFlowCanvas: () => void;

  // Step CRUD
  confirmStep: (flowNodeId: string, stepId: string) => void;
  addStepToFlow: (flowNodeId: string, data: { name: string; actor?: string; description?: string }) => void;
  editStep: (flowNodeId: string, stepId: string, data: Partial<FlowStep>) => void;
  deleteStep: (flowNodeId: string, stepId: string) => void;
  reorderSteps: (flowNodeId: string, fromIndex: number, toIndex: number) => void;

  // Draft
  setFlowDraft: (draft: Partial<BusinessFlowNode> | null) => void;

  // Error
  setFlowError: (error: string | null) => void;
}

export const useFlowStore = create<FlowStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        flowNodes: [],
        flowDraft: null,
        flowGenerating: false,
        flowError: null,
        // Selection (E2)
        selectedNodeIds: new Set<string>(),

        setFlowNodes: (nodes) => set({ flowNodes: nodes }),

        autoGenerateFlows: async (contextNodes) => {
          const confirmedCtxs = contextNodes.filter((c) => c.status === 'confirmed' || c.isActive !== false);
          if (confirmedCtxs.length === 0) return;

          set({ flowGenerating: true, flowError: null });

          try {
            const sessionId = useSessionStore.getState().projectId ?? 'default';
            const result = await canvasApi.generateFlows({
              contexts: confirmedCtxs.map((ctx) => ({
                id: ctx.nodeId,
                name: ctx.name,
                description: (ctx as never as { description?: string }).description ?? '',
                type: (ctx as never as { type?: string }).type ?? 'bounded_context',
              })),
              sessionId,
            });

            const newFlows: BusinessFlowNode[] = result.flows.map((f) => ({
              nodeId: generateId(),
              contextId: f.contextId,
              name: f.name,
              steps: f.steps.map((s, i) => ({
                stepId: generateId(),
                name: s.name,
                actor: s.actor,
                description: (s as never as { description?: string }).description ?? '',
                order: i,
                isActive: false,
                status: 'pending' as const,
              })),
              isActive: false,
              status: 'pending' as const,
              children: [],
            }));

            set((s) => {
              const allFlows = [...s.flowNodes, ...newFlows];
              getHistoryStore().recordSnapshot('flow', allFlows);
              return { flowNodes: allFlows, flowGenerating: false };
            });
            useSessionStore.getState().addMessage({ type: 'user_action', content: `自动生成了 ${newFlows.length} 个流程节点` });
          } catch (err) {
            const msg = err instanceof Error ? err.message : '生成流程失败';
            set({ flowGenerating: false, flowError: msg });
            useSessionStore.getState().addMessage({ type: 'system', content: msg });
          }
        },

        addFlowNode: (data) => {
          const nodeId = generateId();
          const newNode: BusinessFlowNode = {
            nodeId,
            contextId: data.contextId,
            name: data.name,
            steps: data.steps.map((s, i) => ({
              ...s,
              stepId: generateId(),
              status: 'pending' as const,
              isActive: false,
              order: i,
            })),
            isActive: false,
            status: 'pending',
            children: [],
          };
          set((s) => {
            const newNodes = [...s.flowNodes, newNode];
            getHistoryStore().recordSnapshot('flow', newNodes);
            return { flowNodes: newNodes };
          });
          // E1-S2: 广播节点创建
          safeBroadcastCreate('flow', nodeId, newNode as unknown as Record<string, unknown>);
          useSessionStore.getState().addMessage({ type: 'user_action', content: `添加了流程节点`, meta: data.name });
        },

        editFlowNode: (nodeId, data) => {
          set((s) => {
            const newNodes = s.flowNodes.map((n) =>
              n.nodeId === nodeId ? { ...n, ...data, status: 'pending' as const } : n
            );
            getHistoryStore().recordSnapshot('flow', newNodes);
            return { flowNodes: newNodes };
          });
          // E1-S2: 广播节点更新
          safeBroadcastUpdate('flow', nodeId, data as Record<string, unknown>);
        },

        deleteFlowNode: (nodeId) => {
          const nodeToDelete = get().flowNodes.find((n) => n.nodeId === nodeId);
          const deletedName = nodeToDelete?.name ?? nodeId;
          set((s) => {
            const newNodes = s.flowNodes.filter((n) => n.nodeId !== nodeId);
            getHistoryStore().recordSnapshot('flow', newNodes);
            return { flowNodes: newNodes };
          });
          // E1-S2: 广播节点删除
          safeBroadcastDelete('flow', nodeId);
          useSessionStore.getState().addMessage({ type: 'user_action', content: `删除了流程节点`, meta: deletedName });
        },

        confirmFlowNode: (nodeId) => {
          set((s) => {
            const newNodes = s.flowNodes.map((n) => {
              if (n.nodeId !== nodeId) return n;
              // Toggle: if already confirmed, unconfirm; otherwise confirm
              const isConfirmed = n.status === 'confirmed';
              return {
                ...n,
                isActive: !isConfirmed,
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map((step) => ({
                  ...step,
                  isActive: !isConfirmed,
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                })),
              };
            });
            return { flowNodes: newNodes };
          });
        },

        toggleFlowNode: (nodeId) => {
          set((s) => {
            const newNodes = s.flowNodes.map((n) => {
              if (n.nodeId !== nodeId) return n;
              const isConfirmed = n.status === 'confirmed';
              return {
                ...n,
                isActive: !isConfirmed,
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map((step) => ({
                  ...step,
                  isActive: !isConfirmed,
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                })),
              };
            });
            return { flowNodes: newNodes };
          });
        },

        confirmStep: (flowNodeId, stepId) => {
          set((s) => {
            const newNodes = s.flowNodes.map((n) =>
              n.nodeId === flowNodeId
                ? {
                    ...n,
                    steps: n.steps.map((step) =>
                      step.stepId === stepId
                        ? { ...step, isActive: true, status: 'confirmed' as const }
                        : step
                    ),
                  }
                : n
            );
            return { flowNodes: newNodes };
          });
        },

        addStepToFlow: (flowNodeId, data) => {
          set((s) => {
            const newNodes = s.flowNodes.map((n) => {
              if (n.nodeId !== flowNodeId) return n;
              const newStep: FlowStep = {
                stepId: generateId(),
                name: data.name,
                actor: data.actor ?? '待定',
                description: data.description ?? '',
                order: n.steps.length,
                isActive: false,
                status: 'pending' as const,
              };
              return { ...n, steps: [...n.steps, newStep], status: 'pending' as const };
            });
            getHistoryStore().recordSnapshot('flow', newNodes);
            return { flowNodes: newNodes };
          });
        },

        editStep: (flowNodeId, stepId, data) => {
          set((s) => {
            const newNodes = s.flowNodes.map((n) =>
              n.nodeId === flowNodeId
                ? {
                    ...n,
                    status: 'pending' as const,
                    steps: n.steps.map((st) =>
                      st.stepId === stepId ? { ...st, ...data, status: 'pending' as const } : st
                    ),
                  }
                : n
            );
            getHistoryStore().recordSnapshot('flow', newNodes);
            return { flowNodes: newNodes };
          });
        },

        deleteStep: (flowNodeId, stepId) => {
          set((s) => {
            const newNodes = s.flowNodes.map((n) =>
              n.nodeId === flowNodeId
                ? { ...n, steps: n.steps.filter((st) => st.stepId !== stepId) }
                : n
            );
            getHistoryStore().recordSnapshot('flow', newNodes);
            return { flowNodes: newNodes };
          });
        },

        reorderSteps: (flowNodeId, fromIndex, toIndex) => {
          set((s) => {
            const newNodes = s.flowNodes.map((n) => {
              if (n.nodeId !== flowNodeId) return n;
              const steps = [...n.steps];
              const [moved] = steps.splice(fromIndex, 1);
              steps.splice(toIndex, 0, moved);
              return {
                ...n,
                steps: steps.map((st, i) => ({ ...st, order: i })),
                status: 'pending' as const,
              };
            });
            getHistoryStore().recordSnapshot('flow', newNodes);
            return { flowNodes: newNodes };
          });
        },

        setFlowDraft: (draft) => set({ flowDraft: draft }),

        setFlowError: (error) => set({ flowError: error }),

        // E2: Selection methods for Flow panel TreeToolbar
        selectAllNodes: () =>
          set((s) => ({
            selectedNodeIds: new Set(s.flowNodes.map((n) => n.nodeId)),
          })),

        clearNodeSelection: () => set({ selectedNodeIds: new Set() }),

        deleteSelectedNodes: () =>
          set((s) => {
            const selected = s.selectedNodeIds;
            if (selected.size === 0) return {};
            const remaining = s.flowNodes.filter((n) => !selected.has(n.nodeId));
            getHistoryStore().recordSnapshot('flow', remaining);
            return { flowNodes: remaining, selectedNodeIds: new Set() };
          }),

        clearFlowCanvas: () => {
          getHistoryStore().recordSnapshot('flow', []);
          set({ flowNodes: [], selectedNodeIds: new Set() });
        },
      }),
      { name: 'vibex-flow-store' }
    ),
    { name: 'FlowStore' }
  )
);
