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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface FlowStore {
  // State
  flowNodes: BusinessFlowNode[];
  flowDraft: Partial<BusinessFlowNode> | null;
  flowGenerating: boolean;

  // Node CRUD
  setFlowNodes: (nodes: BusinessFlowNode[]) => void;
  addFlowNode: (data: BusinessFlowDraft) => void;
  editFlowNode: (nodeId: string, data: Partial<BusinessFlowNode>) => void;
  deleteFlowNode: (nodeId: string) => void;
  confirmFlowNode: (nodeId: string) => void;
  toggleFlowNode: (nodeId: string) => void;
  autoGenerateFlows: (contextNodes: BoundedContextNode[]) => void;

  // Step CRUD
  confirmStep: (flowNodeId: string, stepId: string) => void;
  addStepToFlow: (flowNodeId: string, data: { name: string; actor?: string; description?: string }) => void;
  editStep: (flowNodeId: string, stepId: string, data: Partial<FlowStep>) => void;
  deleteStep: (flowNodeId: string, stepId: string) => void;
  reorderSteps: (flowNodeId: string, fromIndex: number, toIndex: number) => void;

  // Draft
  setFlowDraft: (draft: Partial<BusinessFlowNode> | null) => void;
}

export const useFlowStore = create<FlowStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        flowNodes: [],
        flowDraft: null,
        flowGenerating: false,

        setFlowNodes: (nodes) => set({ flowNodes: nodes }),

        autoGenerateFlows: async (contextNodes) => {
          const confirmedCtxs = contextNodes.filter((c) => c.status === 'confirmed' || c.isActive !== false);
          if (confirmedCtxs.length === 0) return;

          set({ flowGenerating: true });

          // Mock AI generation: simulate API delay
          await new Promise((r) => setTimeout(r, 1500));

          const newFlows: BusinessFlowNode[] = confirmedCtxs.map((ctx) => {
            const defaultSteps: FlowStep[] = [
              { stepId: generateId(), name: '需求收集', actor: '用户', description: '', order: 0, isActive: false, status: 'pending' },
              { stepId: generateId(), name: '信息录入', actor: '用户', description: '', order: 1, isActive: false, status: 'pending' },
              { stepId: generateId(), name: '提交确认', actor: '用户', description: '', order: 2, isActive: false, status: 'pending' },
            ];
            return {
              nodeId: generateId(),
              contextId: ctx.nodeId,
              name: `${ctx.name}业务流程`,
              steps: defaultSteps,
              isActive: false,
              status: 'pending' as const,
              children: [],
            };
          });

          set((s) => {
            const allFlows = [...s.flowNodes, ...newFlows];
            getHistoryStore().recordSnapshot('flow', allFlows);
            return { flowNodes: allFlows, flowGenerating: false };
          });
          useSessionStore.getState().addMessage({ type: 'user_action', content: `自动生成了 ${newFlows.length} 个流程节点` });
        },

        addFlowNode: (data) => {
          const newNode: BusinessFlowNode = {
            nodeId: generateId(),
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
        },

        deleteFlowNode: (nodeId) => {
          const nodeToDelete = get().flowNodes.find((n) => n.nodeId === nodeId);
          const deletedName = nodeToDelete?.name ?? nodeId;
          set((s) => {
            const newNodes = s.flowNodes.filter((n) => n.nodeId !== nodeId);
            getHistoryStore().recordSnapshot('flow', newNodes);
            return { flowNodes: newNodes };
          });
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
              getHistoryStore().recordSnapshot('flow', [...s.flowNodes]);
              return { ...n, steps: [...n.steps, newStep], status: 'pending' as const };
            });
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
              const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
              steps.splice(insertAt, 0, moved);
              getHistoryStore().recordSnapshot('flow', [...s.flowNodes]);
              return {
                ...n,
                steps: steps.map((st, i) => ({ ...st, order: i })),
                status: 'pending' as const,
              };
            });
            return { flowNodes: newNodes };
          });
        },

        setFlowDraft: (draft) => set({ flowDraft: draft }),
      }),
      { name: 'vibex-flow-store' }
    ),
    { name: 'FlowStore' }
  )
);
