/**
 * VibeX Canvas Store — Zustand State Management
 * 三树并行画布状态管理（按 slice 划分）
 *
 * 遵守 AGENTS.md ADR-002 约束：
 * - 不在 confirmationStore 上扩展，新建 canvasStore
 * - 状态分片按 context/flow/component/phase/queue 严格划分
 * - CascadeUpdateManager 内聚在 store 内
 */
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type {
  Phase,
  TreeType,
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
  PrototypePage,
  BoundedContextDraft,
  BusinessFlowDraft,
  FlowStep,
  CascadeUpstream,
  CascadeResult,
} from './types';

// =============================================================================
// Helpers
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function markAllPending<T extends { status: string; confirmed: boolean }>(nodes: T[]): T[] {
  return nodes.map(n => ({ ...n, status: 'pending' as const, confirmed: false }));
}

// =============================================================================
// CascadeUpdateManager (内聚在 store)
// =============================================================================

class CascadeUpdateManager {
  constructor(private get: () => CanvasStore) {}

  /**
   * 上游变更时，级联标记下游为 pending
   * - context 变更 → flow + component pending
   * - flow 变更 → component pending
   */
  markDownstreamPending(upstream: CascadeUpstream): CascadeResult {
    const store = this.get();

    if (upstream === 'context') {
      const updatedFlows = markAllPending(store.flowNodes);
      const updatedComponents = markAllPending(store.componentNodes);

      // Use Object.assign to trigger Zustand reactivity via setState
      return {
        flowNodesMarked: updatedFlows.length,
        componentNodesMarked: updatedComponents.length,
      };
    }

    if (upstream === 'flow') {
      const updatedComponents = markAllPending(store.componentNodes);
      return {
        flowNodesMarked: 0,
        componentNodesMarked: updatedComponents.length,
      };
    }

    return { flowNodesMarked: 0, componentNodesMarked: 0 };
  }

  /**
   * 检查是否所有节点都已确认
   */
  areAllConfirmed(nodes: Array<{ confirmed: boolean }>): boolean {
    return nodes.length > 0 && nodes.every(n => n.confirmed);
  }
}

// =============================================================================
// Store Interface
// =============================================================================

interface CanvasStore {
  // === Phase Slice ===
  phase: Phase;
  activeTree: TreeType | null;

  // === Panel Collapse Slice ===
  contextPanelCollapsed: boolean;
  flowPanelCollapsed: boolean;
  componentPanelCollapsed: boolean;

  // === Context Slice ===
  contextNodes: BoundedContextNode[];
  contextDraft: Partial<BoundedContextNode> | null;

  // === Flow Slice ===
  flowNodes: BusinessFlowNode[];
  flowDraft: Partial<BusinessFlowNode> | null;

  // === Component Slice ===
  componentNodes: ComponentNode[];
  componentDraft: Partial<ComponentNode> | null;

  // === Queue Slice ===
  projectId: string | null;
  prototypeQueue: PrototypePage[];
  isPolling: boolean;

  // === Phase Actions ===
  setPhase: (phase: Phase) => void;
  advancePhase: () => void;
  setActiveTree: (tree: TreeType) => void;

  // === Panel Actions ===
  toggleContextPanel: () => void;
  toggleFlowPanel: () => void;
  toggleComponentPanel: () => void;

  // === Context Slice Actions ===
  setContextNodes: (nodes: BoundedContextNode[]) => void;
  addContextNode: (data: BoundedContextDraft) => void;
  editContextNode: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  deleteContextNode: (nodeId: string) => void;
  confirmContextNode: (nodeId: string) => void;
  setContextDraft: (draft: Partial<BoundedContextNode> | null) => void;

  // === Flow Slice Actions ===
  setFlowNodes: (nodes: BusinessFlowNode[]) => void;
  addFlowNode: (data: BusinessFlowDraft) => void;
  editFlowNode: (nodeId: string, data: Partial<BusinessFlowNode>) => void;
  deleteFlowNode: (nodeId: string) => void;
  confirmFlowNode: (nodeId: string) => void;
  setFlowDraft: (draft: Partial<BusinessFlowNode> | null) => void;
  // === Step Actions (Epic 3) ===
  confirmStep: (flowNodeId: string, stepId: string) => void;
  editStep: (flowNodeId: string, stepId: string, data: Partial<FlowStep>) => void;
  deleteStep: (flowNodeId: string, stepId: string) => void;
  reorderSteps: (flowNodeId: string, fromIndex: number, toIndex: number) => void;
  // === Auto-generation (Epic 3) ===
  autoGenerateFlows: (contexts: BoundedContextNode[]) => void;

  // === Component Slice Actions ===
  setComponentNodes: (nodes: ComponentNode[]) => void;
  addComponentNode: (data: Omit<ComponentNode, 'nodeId' | 'status' | 'confirmed' | 'children'>) => void;
  editComponentNode: (nodeId: string, data: Partial<ComponentNode>) => void;
  deleteComponentNode: (nodeId: string) => void;
  confirmComponentNode: (nodeId: string) => void;
  setComponentDraft: (draft: Partial<ComponentNode> | null) => void;

  // === Queue Slice Actions ===
  setProjectId: (id: string | null) => void;
  addToQueue: (pages: PrototypePage[]) => void;
  updateQueueItem: (pageId: string, update: Partial<PrototypePage>) => void;
  removeFromQueue: (pageId: string) => void;
  setIsPolling: (polling: boolean) => void;
  clearQueue: () => void;

  // === Cascade Actions ===
  cascadeContextChange: (nodeId: string) => void;
  cascadeFlowChange: (nodeId: string) => void;

  // === Tree Activation Logic ===
  recomputeActiveTree: () => void;

  // === Internal ===
  _cascade: CascadeUpdateManager;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    persist(
      (set, get) => {
        const cascade = new CascadeUpdateManager(() => get());

        return {
          // === Phase Slice ===
          phase: 'input',
          activeTree: null,

          // === Panel Collapse Slice ===
          contextPanelCollapsed: false,
          flowPanelCollapsed: false,
          componentPanelCollapsed: false,

          // === Context Slice ===
          contextNodes: [],
          contextDraft: null,

          // === Flow Slice ===
          flowNodes: [],
          flowDraft: null,

          // === Component Slice ===
          componentNodes: [],
          componentDraft: null,

          // === Queue Slice ===
          projectId: null,
          prototypeQueue: [],
          isPolling: false,

          // === Phase Actions ===
          setPhase: (phase) => {
            set({ phase });
            get().recomputeActiveTree();
          },

          advancePhase: () => {
            const { phase } = get();
            const phaseOrder: Phase[] = ['input', 'context', 'flow', 'component', 'prototype'];
            const idx = phaseOrder.indexOf(phase);
            if (idx < phaseOrder.length - 1) {
              set({ phase: phaseOrder[idx + 1] });
              get().recomputeActiveTree();
            }
          },

          setActiveTree: (activeTree) => set({ activeTree }),

          // === Panel Actions ===
          toggleContextPanel: () =>
            set((s) => ({ contextPanelCollapsed: !s.contextPanelCollapsed })),
          toggleFlowPanel: () =>
            set((s) => ({ flowPanelCollapsed: !s.flowPanelCollapsed })),
          toggleComponentPanel: () =>
            set((s) => ({ componentPanelCollapsed: !s.componentPanelCollapsed })),

          // === Context Slice Actions ===
          setContextNodes: (nodes) => set({ contextNodes: nodes }),

          addContextNode: (data) => {
            const newNode: BoundedContextNode = {
              nodeId: generateId(),
              name: data.name,
              description: data.description,
              type: data.type,
              confirmed: false,
              status: 'pending',
              children: [],
            };
            set((s) => ({ contextNodes: [...s.contextNodes, { ...newNode }] }));
          },

          editContextNode: (nodeId, data) => {
            set((s) => ({
              contextNodes: s.contextNodes.map((n) =>
                n.nodeId === nodeId ? { ...n, ...data, status: 'pending' as const } : n
              ),
            }));
            get().cascadeContextChange(nodeId);
          },

          deleteContextNode: (nodeId) => {
            set((s) => ({ contextNodes: s.contextNodes.filter((n) => n.nodeId !== nodeId) }));
            get().cascadeContextChange(nodeId);
          },

          confirmContextNode: (nodeId) => {
            const newContextNodes = get().contextNodes.map((n) =>
              n.nodeId === nodeId ? { ...n, confirmed: true, status: 'confirmed' as const } : n
            );
            set({ contextNodes: newContextNodes });
            // Cascade: context confirmed → downstream trees may activate
            get().recomputeActiveTree();
            // Epic 3 S3.1: auto-generate flow tree when ALL contexts confirmed
            const allConfirmed = cascade.areAllConfirmed(newContextNodes);
            if (allConfirmed && newContextNodes.length > 0 && get().flowNodes.length === 0) {
              get().autoGenerateFlows(newContextNodes);
            }
          },

          setContextDraft: (draft) => set({ contextDraft: draft }),

          // === Flow Slice Actions ===
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
                confirmed: false,
                order: i,
              })),
              confirmed: false,
              status: 'pending',
              children: [],
            };
            set((s) => ({ flowNodes: [...s.flowNodes, newNode] }));
          },

          editFlowNode: (nodeId, data) => {
            set((s) => ({
              flowNodes: s.flowNodes.map((n) =>
                n.nodeId === nodeId ? { ...n, ...data, status: 'pending' as const } : n
              ),
            }));
            get().cascadeFlowChange(nodeId);
          },

          deleteFlowNode: (nodeId) => {
            set((s) => ({ flowNodes: s.flowNodes.filter((n) => n.nodeId !== nodeId) }));
            get().cascadeFlowChange(nodeId);
          },

          confirmFlowNode: (nodeId) => {
            set((s) => ({
              flowNodes: s.flowNodes.map((n) =>
                n.nodeId === nodeId ? { ...n, confirmed: true, status: 'confirmed' as const } : n
              ),
            }));
            get().recomputeActiveTree();
          },

          setFlowDraft: (draft) => set({ flowDraft: draft }),

          // === Step Actions (Epic 3) ===
          confirmStep: (flowNodeId, stepId) => {
            set((s) => ({
              flowNodes: s.flowNodes.map((n) =>
                n.nodeId === flowNodeId
                  ? {
                      ...n,
                      steps: n.steps.map((st) =>
                        st.stepId === stepId
                          ? { ...st, confirmed: true, status: 'confirmed' as const }
                          : st
                      ),
                    }
                  : n
              ),
            }));
          },

          editStep: (flowNodeId, stepId, data) => {
            set((s) => ({
              flowNodes: s.flowNodes.map((n) =>
                n.nodeId === flowNodeId
                  ? {
                      ...n,
                      status: 'pending' as const,
                      steps: n.steps.map((st) =>
                        st.stepId === stepId ? { ...st, ...data, status: 'pending' as const } : st
                      ),
                    }
                  : n
              ),
            }));
            get().cascadeFlowChange(flowNodeId);
          },

          deleteStep: (flowNodeId, stepId) => {
            set((s) => ({
              flowNodes: s.flowNodes.map((n) =>
                n.nodeId === flowNodeId
                  ? { ...n, steps: n.steps.filter((st) => st.stepId !== stepId) }
                  : n
              ),
            }));
          },

          reorderSteps: (flowNodeId, fromIndex, toIndex) => {
            set((s) => ({
              flowNodes: s.flowNodes.map((n) => {
                if (n.nodeId !== flowNodeId) return n;
                const steps = [...n.steps];
                const [moved] = steps.splice(fromIndex, 1);
                // Insert before toIndex (splice inserts AT the index, so use toIndex - 1
                // so that moved ends up in the position where toIndex currently is)
                const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
                steps.splice(insertAt, 0, moved);
                return {
                  ...n,
                  steps: steps.map((st, i) => ({ ...st, order: i })),
                  status: 'pending' as const,
                };
              }),
            }));
            get().cascadeFlowChange(flowNodeId);
          },

          // === Auto-generation (Epic 3 S3.1) ===
          autoGenerateFlows: (contexts) => {
            const flows: BusinessFlowNode[] = contexts.map((ctx) => ({
              nodeId: generateId(),
              contextId: ctx.nodeId,
              name: `${ctx.name}业务流程`,
              steps: [
                { stepId: generateId(), name: '需求收集', actor: '用户', description: `收集${ctx.name}相关需求`, order: 0, confirmed: false, status: 'pending' },
                { stepId: generateId(), name: '数据处理', actor: '系统', description: `处理${ctx.name}核心数据`, order: 1, confirmed: false, status: 'pending' },
                { stepId: generateId(), name: '结果输出', actor: '系统', description: `输出${ctx.name}处理结果`, order: 2, confirmed: false, status: 'pending' },
              ],
              confirmed: false,
              status: 'pending',
              children: [],
            }));
            set({ flowNodes: flows });
          },

          // === Component Slice Actions ===
          setComponentNodes: (nodes) => set({ componentNodes: nodes }),

          addComponentNode: (data) => {
            const newNode: ComponentNode = {
              ...data,
              nodeId: generateId(),
              status: 'pending',
              confirmed: false,
              children: [],
            };
            set((s) => ({ componentNodes: [...s.componentNodes, newNode] }));
          },

          editComponentNode: (nodeId, data) => {
            set((s) => ({
              componentNodes: s.componentNodes.map((n) =>
                n.nodeId === nodeId ? { ...n, ...data, status: 'pending' as const } : n
              ),
            }));
          },

          deleteComponentNode: (nodeId) => {
            set((s) => ({ componentNodes: s.componentNodes.filter((n) => n.nodeId !== nodeId) }));
          },

          confirmComponentNode: (nodeId) => {
            set((s) => ({
              componentNodes: s.componentNodes.map((n) =>
                n.nodeId === nodeId ? { ...n, confirmed: true, status: 'confirmed' as const } : n
              ),
            }));
          },

          setComponentDraft: (draft) => set({ componentDraft: draft }),

          // === Queue Slice Actions ===
          setProjectId: (id) => set({ projectId: id }),
          setIsPolling: (polling) => set({ isPolling: polling }),

          addToQueue: (pages) =>
            set((s) => ({ prototypeQueue: [...s.prototypeQueue, ...pages] })),

          updateQueueItem: (pageId, update) =>
            set((s) => ({
              prototypeQueue: s.prototypeQueue.map((p) =>
                p.pageId === pageId ? { ...p, ...update } : p
              ),
            })),

          removeFromQueue: (pageId) =>
            set((s) => ({ prototypeQueue: s.prototypeQueue.filter((p) => p.pageId !== pageId) })),

          clearQueue: () => set({ prototypeQueue: [], projectId: null }),

          // === Cascade Actions ===
          cascadeContextChange: (_nodeId) => {
            // Apply cascade to store: context change → mark flow + component pending
            set((s) => ({
              flowNodes: markAllPending(s.flowNodes),
              componentNodes: markAllPending(s.componentNodes),
            }));
          },

          cascadeFlowChange: (_nodeId) => {
            // Apply cascade to store: flow change → mark component pending
            set((s) => ({
              componentNodes: markAllPending(s.componentNodes),
            }));
          },

          // === Tree Activation Logic ===
          recomputeActiveTree: () => {
            const { contextNodes, flowNodes, phase } = get();

            // Activation rules based on phase
            if (phase === 'input') {
              set({ activeTree: null });
              return;
            }

            if (phase === 'context') {
              const allConfirmed = cascade.areAllConfirmed(contextNodes);
              set({
                activeTree: allConfirmed && contextNodes.length > 0 ? 'flow' : 'context',
              });
              return;
            }

            if (phase === 'flow') {
              const flowReady = cascade.areAllConfirmed(flowNodes);
              const contextReady = cascade.areAllConfirmed(contextNodes);
              set({
                activeTree: flowReady && flowNodes.length > 0 ? 'component' : 'flow',
                phase: contextReady && flowReady && flowNodes.length > 0 ? 'component' : phase,
              });
              return;
            }

            if (phase === 'component') {
              set({ activeTree: 'component' });
              return;
            }

            if (phase === 'prototype') {
              set({ activeTree: null });
            }
          },

          _cascade: cascade,
        };
      },
      {
        name: 'vibex-canvas-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist project-scoped data, not UI state
          projectId: state.projectId,
          prototypeQueue: state.prototypeQueue,
          contextNodes: state.contextNodes,
          flowNodes: state.flowNodes,
          componentNodes: state.componentNodes,
        }),
      }
    ),
    { name: 'canvasStore' }
  )
);

// Export for testing
export { markAllPending };
