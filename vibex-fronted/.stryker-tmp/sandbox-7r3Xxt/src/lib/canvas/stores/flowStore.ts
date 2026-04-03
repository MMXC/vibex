/**
 * VibeX flowStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 3 slice extraction.
 *
 * Responsibilities:
 * - BusinessFlowNode state (flowNodes, flowDraft)
 * - CRUD operations on flow nodes and their steps
 * - Step-level confirm/edit/delete/reorder
 * - autoGenerateFlows (cross-store: calls canvasApi, reads contextNodes)
 *
 * E4 migration: Added autoGenerateFlows, removed circular useCanvasStore import.
 */
// @ts-nocheck

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BusinessFlowNode, BusinessFlowDraft, FlowStep } from '../types';
import { getHistoryStore } from '../historySlice';
import { canvasApi } from '../api/canvasApi';
import { postContextActionMessage } from './messageBridge';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface FlowStore {
  // State
  flowNodes: BusinessFlowNode[];
  flowDraft: Partial<BusinessFlowNode> | null;

  // Node CRUD
  setFlowNodes: (nodes: BusinessFlowNode[]) => void;
  addFlowNode: (data: BusinessFlowDraft) => void;
  editFlowNode: (nodeId: string, data: Partial<BusinessFlowNode>) => void;
  deleteFlowNode: (nodeId: string) => void;
  confirmFlowNode: (nodeId: string) => void;
  toggleFlowNode: (nodeId: string) => void;

  // Step CRUD
  confirmStep: (flowNodeId: string, stepId: string) => void;
  addStepToFlow: (flowNodeId: string, data: { name: string; actor?: string; description?: string }) => void;
  editStep: (flowNodeId: string, stepId: string, data: Partial<FlowStep>) => void;
  deleteStep: (flowNodeId: string, stepId: string) => void;
  reorderSteps: (flowNodeId: string, fromIndex: number, toIndex: number) => void;

  // Draft
  setFlowDraft: (draft: Partial<BusinessFlowNode> | null) => void;

  // Auto-generation (cross-store: reads from contextStore)
  autoGenerateFlows: (contexts: BusinessFlowNode[]) => Promise<void>;
}

export const useFlowStore = create<FlowStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        flowNodes: [],
        flowDraft: null,

        setFlowNodes: (nodes) => set({ flowNodes: nodes }),

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
          postContextActionMessage(`添加了流程节点`, data.name);
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
          postContextActionMessage(`删除了流程节点`, deletedName);
        },

        confirmFlowNode: (nodeId) => {
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

        // === Auto-generation (Epic 3 S3.1) ===
        autoGenerateFlows: async (contexts) => {
          const { useSessionStore } = require('./sessionStore');
          const { useContextStore } = require('./contextStore');

          useSessionStore.getState().setFlowGenerating(true, '正在生成流程树...');

          try {
            const { projectId } = useSessionStore.getState();
            const sessionId = projectId ?? `session-${Date.now()}`;

            // Map context nodes to API format (user-edited data)
            const mappedContexts = contexts.map((ctx: any) => ({
              id: ctx.nodeId,
              name: ctx.name,
              description: ctx.description ?? '',
              type: ctx.type,
            }));

            const result = await canvasApi.generateFlows({
              contexts: mappedContexts,
              sessionId,
            });

            if (result.success && result.flows && result.flows.length > 0) {
              const flows: BusinessFlowNode[] = result.flows.map((f: any) => ({
                nodeId: generateId(),
                contextId: f.contextId,
                name: f.name,
                steps: f.steps.map((step: any, idx: number) => ({
                  stepId: generateId(),
                  name: step.name,
                  actor: step.actor,
                  description: step.description,
                  order: step.order ?? idx,
                  isActive: false,
                  status: 'pending' as const,
                })),
                isActive: false,
                status: 'pending' as const,
                children: [],
              }));

              get().setFlowNodes(flows);
              useContextStore.getState().setPhase('flow');
            } else {
              console.error('[flowStore] generateFlows: API returned no flows', result.error);
            }
          } catch (err) {
            console.error('[flowStore] autoGenerateFlows error:', err);
          } finally {
            useSessionStore.getState().setFlowGenerating(false, null);
          }
        },
      }),
      {
        name: 'vibex-flow-store',
        partialize: (state) => ({
          flowNodes: state.flowNodes,
        }),
      }
    ),
    { name: 'FlowStore' }
  )
);
