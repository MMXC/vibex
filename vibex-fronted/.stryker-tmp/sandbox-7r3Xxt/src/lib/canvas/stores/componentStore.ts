/**
 * VibeX componentStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 4 slice extraction.
 *
 * Responsibilities:
 * - ComponentNode state (componentNodes, componentDraft)
 * - CRUD operations on component nodes
 * - Multi-select for component tree
 * - generateComponentFromFlow (cross-store: reads contextStore + flowStore)
 *
 * E4 migration: Added generateComponentFromFlow, clearComponentCanvas.
 */
// @ts-nocheck

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ComponentNode } from '../types';
import { canvasApi } from '../api/canvasApi';
import { getHistoryStore } from '../historySlice';
import { postContextActionMessage } from './messageBridge';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ComponentStore {
  // State
  componentNodes: ComponentNode[];
  componentDraft: Partial<ComponentNode> | null;
  selectedNodeIds: string[];

  // Node CRUD
  setComponentNodes: (nodes: ComponentNode[]) => void;
  clearComponentCanvas: () => void;
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

  // Manual Component Generation (cross-store)
  generateComponentFromFlow: () => Promise<void>;
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

        clearComponentCanvas: () => {
          const nodes = get().componentNodes;
          if (nodes.length === 0) return;
          getHistoryStore().recordSnapshot('component', nodes);
          set({ componentNodes: [] });
        },

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
          postContextActionMessage(`添加了组件节点`, data.name);
        },

        editComponentNode: (nodeId, data) => {
          set((s) => ({
            componentNodes: s.componentNodes.map((n) =>
              n.nodeId === nodeId ? { ...n, ...data, status: 'pending' as const } : n
            ),
          }));
        },

        deleteComponentNode: (nodeId) => {
          const nodeToDelete = get().componentNodes.find((n) => n.nodeId === nodeId);
          const deletedName = nodeToDelete?.name ?? nodeId;
          set((s) => ({
            componentNodes: s.componentNodes.filter((n) => n.nodeId !== nodeId),
          }));
          postContextActionMessage(`删除了组件节点`, deletedName);
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

        // === Manual Component Generation (Epic 4) ===
        generateComponentFromFlow: async () => {
          // Import from other stores to avoid circular deps
          const { useContextStore } = require('./contextStore');
          const { useFlowStore } = require('./flowStore');
          const { useSessionStore } = require('./sessionStore');

          const contextNodes = useContextStore.getState().contextNodes;
          const flowNodes = useFlowStore.getState().flowNodes;

          if (flowNodes.length === 0) {
            console.warn('[componentStore] generateComponentFromFlow: no flow nodes');
            return;
          }

          try {
            // E2: Only send confirmed nodes to the API
            const confirmedContexts = contextNodes.filter((ctx: any) => ctx.status === 'confirmed');
            const confirmedFlows = flowNodes.filter((f: any) => f.status === 'confirmed');

            const mappedContexts = confirmedContexts.map((ctx: any) => ({
              id: ctx.nodeId,
              name: ctx.name,
              description: ctx.description ?? '',
              type: ctx.type,
            }));

            const mappedFlows = confirmedFlows.map((f: any) => ({
              name: f.name,
              contextId: f.contextId,
              steps: f.steps.map((s: any) => ({ name: s.name, actor: s.actor })),
            }));

            const { projectId } = useSessionStore.getState();
            const sessionId = projectId ?? `session-${Date.now()}`;

            const result = await canvasApi.generateComponents({
              contexts: mappedContexts,
              flows: mappedFlows,
              sessionId,
            });

            if (result.success && result.components) {
              const validTypes = ['page', 'form', 'list', 'detail', 'modal'] as const;
              const validMethods = ['GET', 'POST'] as const;
              const newNodes: ComponentNode[] = result.components.map((c: any) => {
                const type = (c.type && validTypes.includes(c.type as typeof validTypes[number]))
                  ? c.type as ComponentNode['type']
                  : 'page';
                const method = (c.api?.method && validMethods.includes(c.api.method as typeof validMethods[number]))
                  ? c.api.method
                  : 'GET';
                const flowId = (c.flowId && c.flowId !== 'unknown')
                  ? c.flowId
                  : '';
                return {
                  nodeId: generateId(),
                  flowId,
                  name: c.name ?? '未命名组件',
                  type,
                  props: {},
                  api: {
                    method,
                    path: c.api?.path ?? '/api/' + (c.name ?? 'component').toLowerCase(),
                    params: c.api?.params ?? [],
                  },
                  status: 'pending' as const,
                  children: [],
                } as ComponentNode;
              });

              get().setComponentNodes(newNodes);
              useContextStore.getState().setPhase('component');
              postContextActionMessage(`生成了 ${newNodes.length} 个组件节点`);
            } else {
              console.error('[componentStore] generateComponentFromFlow: no components', result.error);
            }
          } catch (err) {
            console.error('[componentStore] generateComponentFromFlow error:', err);
            throw err;
          }
        },
      }),
      {
        name: 'vibex-component-store',
        partialize: (state) => ({
          componentNodes: state.componentNodes,
        }),
      }
    ),
    { name: 'ComponentStore' }
  )
);
