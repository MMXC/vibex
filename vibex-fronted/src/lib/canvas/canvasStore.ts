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
  PanelExpandState,
  BoundedGroup,
} from './types';

import exampleCanvasData from '@/data/example-canvas.json';
import { canvasApi } from './api/canvasApi';

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

  // === Expand Slice (E2) ===
  leftExpand: PanelExpandState;
  centerExpand: PanelExpandState;
  rightExpand: PanelExpandState;
  getGridTemplate: () => string;
  setLeftExpand: (state: PanelExpandState) => void;
  setCenterExpand: (state: PanelExpandState) => void;
  setRightExpand: (state: PanelExpandState) => void;
  togglePanel: (panel: 'left' | 'center' | 'right') => void;
  resetExpand: () => void;

  // === Drag Slice (E3) ===
  draggedNodeId: string | null;
  dragOverNodeId: string | null;
  draggedPositions: Record<string, { x: number; y: number }>;
  isDragging: boolean;
  /** Begin dragging a node — sets draggedNodeId and isDragging */
  startDrag: (nodeId: string) => void;
  /** End dragging — saves position and clears drag state */
  endDrag: (nodeId: string, position: { x: number; y: number }) => void;
  /** Track which node we're dragging over (drop target) */
  setDragOver: (nodeId: string | null) => void;
  /** Live update position during drag */
  updateDraggedPosition: (nodeId: string, position: { x: number; y: number }) => void;
  /** Clear all drag state and positions */
  clearDragPositions: () => void;
  /** Clear single node's dragged position */
  clearDragPosition: (nodeId: string) => void;

  // === Bounded Group Slice (E4) ===
  /** All bounded groups for the current tree */
  boundedGroups: BoundedGroup[];
  /** Add a new bounded group */
  addBoundedGroup: (group: Omit<BoundedGroup, 'groupId'>) => void;
  /** Remove a bounded group by id */
  removeBoundedGroup: (groupId: string) => void;
  /** Toggle visibility of a bounded group */
  toggleBoundedGroupVisibility: (groupId: string) => void;
  /** Update group label */
  updateBoundedGroupLabel: (groupId: string, label: string) => void;
  /** Assign a node to a group */
  addNodeToGroup: (groupId: string, nodeId: string) => void;
  /** Remove a node from a group */
  removeNodeFromGroup: (groupId: string, nodeId: string) => void;
  /** Clear all bounded groups */
  clearBoundedGroups: () => void;

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

  // === AI Thinking Slice (Epic 1) ===
  aiThinking: boolean;
  aiThinkingMessage: string | null;
  requirementText: string;

  // === Flow Generation Slice ===
  flowGenerating: boolean;
  flowGeneratingMessage: string | null;

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
  autoGenerateFlows: (contexts: BoundedContextNode[]) => Promise<void>;

  // === Example Data (F-1.2) ===
  /** Load example canvas data — sets all three trees + advances phase to context */
  loadExampleData: () => void;

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

  // === AI Thinking Actions (Epic 1) ===
  setAiThinking: (thinking: boolean, message?: string | null) => void;
  setRequirementText: (text: string) => void;
  generateContextsFromRequirement: (text: string) => Promise<void>;

  // === Flow Generation Actions ===
  setFlowGenerating: (generating: boolean, message?: string | null) => void;

  // === Cascade Actions ===
  cascadeContextChange: (nodeId: string) => void;
  cascadeFlowChange: (nodeId: string) => void;

  // === Tree Activation Logic ===
  recomputeActiveTree: () => void;

  // === Internal tracking (not exposed in public API) ===
  _prevActiveTree: TreeType | null;

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

          // === AI Thinking Slice (Epic 1) ===
          aiThinking: false,
          aiThinkingMessage: null,
          requirementText: '',

          // === Flow Generation Slice ===
          flowGenerating: false,
          flowGeneratingMessage: null,

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

          setActiveTree: (activeTree) => set((s) => ({ activeTree, _prevActiveTree: s.activeTree })),

          // === Panel Actions ===
          toggleContextPanel: () =>
            set((s) => ({ contextPanelCollapsed: !s.contextPanelCollapsed })),
          toggleFlowPanel: () =>
            set((s) => ({ flowPanelCollapsed: !s.flowPanelCollapsed })),
          toggleComponentPanel: () =>
            set((s) => ({ componentPanelCollapsed: !s.componentPanelCollapsed })),

          // === Expand Slice (E2) ===
          leftExpand: 'default',
          centerExpand: 'default',
          rightExpand: 'default',

          getGridTemplate: () => {
            const { leftExpand, centerExpand, rightExpand } = get();
            const D = 1; const X = 1.5; const C = 0;

            const leftFr = leftExpand === 'expand-right' ? X : leftExpand === 'expand-left' ? C : D;
            const centerFr = centerExpand === 'expand-left' ? X : centerExpand === 'expand-right' ? C : D;
            const rightFr = rightExpand === 'expand-left' ? X : rightExpand === 'expand-right' ? C : D;

            return `${leftFr}fr ${centerFr}fr ${rightFr}fr`;
          },

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
              // 循环: default → expand-left → expand-right → default
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

          resetExpand: () => set({ leftExpand: 'default', centerExpand: 'default', rightExpand: 'default' }),

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
          autoGenerateFlows: async (contexts) => {
            const { setFlowGenerating, setPhase } = get();

            setFlowGenerating(true, '正在生成流程树...');

            try {
              const { projectId } = get();
              const sessionId = projectId ?? `session-${Date.now()}`;

              // Map context nodes to API format (user-edited data)
              const mappedContexts = contexts.map((ctx) => ({
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
                const flows: BusinessFlowNode[] = result.flows.map((f) => ({
                  nodeId: generateId(),
                  contextId: f.contextId,
                  name: f.name,
                  steps: f.steps.map((step, idx) => ({
                    stepId: generateId(),
                    name: step.name,
                    actor: step.actor,
                    description: step.description,
                    order: step.order ?? idx,
                    confirmed: false,
                    status: 'pending' as const,
                  })),
                  confirmed: false,
                  status: 'pending' as const,
                  children: [],
                }));

                set({ flowNodes: flows });
                setPhase('flow');
              } else {
                console.error('[canvasStore] generateFlows: API returned no flows', result.error);
              }
            } catch (err) {
              console.error('[canvasStore] autoGenerateFlows error:', err);
            } finally {
              setFlowGenerating(false, null);
            }
          },

          // === Example Data (F-1.2) ===
          loadExampleData: () => {
            const data = exampleCanvasData as {
              contextNodes: BoundedContextNode[];
              flowNodes: BusinessFlowNode[];
              componentNodes: ComponentNode[];
            };
            set((s) => ({
              contextNodes: data.contextNodes,
              flowNodes: data.flowNodes,
              componentNodes: data.componentNodes,
              phase: 'context',
              activeTree: 'flow',
              _prevActiveTree: s.activeTree,
            }));
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

          // === AI Thinking Actions (Epic 1) ===
          setAiThinking: (thinking, message = null) => set({ aiThinking: thinking, aiThinkingMessage: message }),

          setFlowGenerating: (generating, message = null) => set({ flowGenerating: generating, flowGeneratingMessage: message }),

          setRequirementText: (text) => set({ requirementText: text }),

          generateContextsFromRequirement: async (text: string) => {
            const { setAiThinking, setRequirementText, setPhase, addContextNode } = get();

            // Reset state
            setAiThinking(true, '正在连接...');
            setRequirementText(text);
            setPhase('context');

            // Import dynamically to avoid circular deps
            const { analyzeRequirement } = require('./api/dddApi') as typeof import('./api/dddApi');

            analyzeRequirement(text, {
              timeoutMs: 30000,
              onThinking: (content: string) => {
                setAiThinking(true, content);
              },
              onStepContext: (content: string, _mermaidCode: string | undefined, confidence: number | undefined, boundedContexts) => {
                setAiThinking(true, content);
                // Map backend type to valid BoundedContextNode type
                const mapContextType = (type: string): BoundedContextNode['type'] => {
                  const validTypes = ['core', 'supporting', 'generic', 'external'];
                  return validTypes.includes(type) ? type as BoundedContextNode['type'] : 'core';
                };
                const MAX_CONTEXT_NODES = 10;
                const MAX_NAME_LENGTH = 30;
                const truncateName = (name: string): string => {
                  if (name.length <= MAX_NAME_LENGTH) return name;
                  return name.substring(0, MAX_NAME_LENGTH - 3) + '...';
                };
                // Loop through boundedContexts and add each one (max 10)
                if (boundedContexts && boundedContexts.length > 0) {
                  const nodesToAdd = boundedContexts.slice(0, MAX_CONTEXT_NODES);
                  nodesToAdd.forEach((ctx) => {
                    addContextNode({
                      name: truncateName(ctx.name),
                      description: ctx.description,
                      type: mapContextType(ctx.type),
                    });
                  });
                } else if (confidence !== undefined && confidence > 0.5) {
                  // Fallback: single node if no boundedContexts
                  addContextNode({
                    name: 'AI 分析上下文',
                    description: content,
                    type: 'core',
                  });
                }
              },
              onStepModel: (content: string) => {
                setAiThinking(true, content);
              },
              onStepFlow: (content: string) => {
                setAiThinking(true, content);
              },
              onStepComponents: (content: string) => {
                setAiThinking(true, content);
              },
              onDone: () => {
                setAiThinking(false, null);
              },
              onError: () => {
                setAiThinking(false, null);
              },
            }).catch((err: unknown) => {
              setAiThinking(false, null);
              console.error('[canvasStore] generateContextsFromRequirement error:', err);
            });
          },

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

          // === Drag Slice (E3) ===
          draggedNodeId: null,
          dragOverNodeId: null,
          draggedPositions: {},
          isDragging: false,

          startDrag: (nodeId) => set({ draggedNodeId: nodeId, isDragging: true }),

          endDrag: (nodeId, position) => {
            set((s) => ({
              draggedPositions: { ...s.draggedPositions, [nodeId]: position },
              draggedNodeId: null,
              isDragging: false,
            }));
          },

          setDragOver: (nodeId) => set({ dragOverNodeId: nodeId }),

          updateDraggedPosition: (nodeId, position) => {
            set((s) => ({
              draggedPositions: { ...s.draggedPositions, [nodeId]: position },
            }));
          },

          clearDragPositions: () => set({ draggedPositions: {}, draggedNodeId: null, dragOverNodeId: null, isDragging: false }),

          clearDragPosition: (nodeId) => {
            set((s) => {
              const next = { ...s.draggedPositions };
              delete next[nodeId];
              return { draggedPositions: next };
            });
          },

          // === Bounded Group Slice (E4) ===
          boundedGroups: [],

          addBoundedGroup: (groupData) => {
            const newGroup: BoundedGroup = {
              ...groupData,
              groupId: generateId(),
            };
            set((s) => ({ boundedGroups: [...s.boundedGroups, newGroup] }));
          },

          removeBoundedGroup: (groupId) => {
            set((s) => ({ boundedGroups: s.boundedGroups.filter((g) => g.groupId !== groupId) }));
          },

          toggleBoundedGroupVisibility: (groupId) => {
            set((s) => ({
              boundedGroups: s.boundedGroups.map((g) =>
                g.groupId === groupId
                  ? { ...g, visible: g.visible === undefined || g.visible === true ? false : true }
                  : g
              ),
            }));
          },

          updateBoundedGroupLabel: (groupId, label) => {
            set((s) => ({
              boundedGroups: s.boundedGroups.map((g) =>
                g.groupId === groupId ? { ...g, label } : g
              ),
            }));
          },

          addNodeToGroup: (groupId, nodeId) => {
            set((s) => ({
              boundedGroups: s.boundedGroups.map((g) =>
                g.groupId === groupId && !g.nodeIds.includes(nodeId)
                  ? { ...g, nodeIds: [...g.nodeIds, nodeId] }
                  : g
              ),
            }));
          },

          removeNodeFromGroup: (groupId, nodeId) => {
            set((s) => ({
              boundedGroups: s.boundedGroups.map((g) =>
                g.groupId === groupId
                  ? { ...g, nodeIds: g.nodeIds.filter((id) => id !== nodeId) }
                  : g
              ),
            }));
          },

          clearBoundedGroups: () => set({ boundedGroups: [] }),

          // === Internal tracking ===
          _prevActiveTree: null as TreeType | null,

          // === Tree Activation Logic ===
          recomputeActiveTree: () => {
            const { contextNodes, flowNodes, phase, _prevActiveTree } = get();
            let newActiveTree: TreeType | null = null;

            // Activation rules based on phase
            if (phase === 'input') {
              newActiveTree = null;
            } else if (phase === 'context') {
              const allConfirmed = cascade.areAllConfirmed(contextNodes);
              newActiveTree = allConfirmed && contextNodes.length > 0 ? 'flow' : 'context';
            } else if (phase === 'flow') {
              const flowReady = cascade.areAllConfirmed(flowNodes);
              const contextReady = cascade.areAllConfirmed(contextNodes);
              newActiveTree = flowReady && flowNodes.length > 0 ? 'component' : 'flow';
              if (contextReady && flowReady && flowNodes.length > 0) {
                set({ activeTree: newActiveTree, _prevActiveTree: _prevActiveTree, phase: 'component' });
                return;
              }
            } else if (phase === 'component') {
              newActiveTree = 'component';
            } else {
              // prototype
              newActiveTree = null;
            }

            // E2-1: Auto-expand center panel based on activeTree transition
            if (newActiveTree !== _prevActiveTree) {
              if (newActiveTree === 'flow' || newActiveTree === 'component') {
                set({ activeTree: newActiveTree, _prevActiveTree: newActiveTree });
                get().setCenterExpand('expand-left');
              } else if (newActiveTree === null) {
                set({ activeTree: newActiveTree, _prevActiveTree: newActiveTree });
                get().setCenterExpand('default');
              } else {
                set({ activeTree: newActiveTree, _prevActiveTree: newActiveTree });
              }
            } else {
              // No change, just update prev (protect user手动展开)
              set({ activeTree: newActiveTree, _prevActiveTree: newActiveTree });
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
          // E3: persist dragged positions so drag state survives page refresh
          draggedPositions: state.draggedPositions,
          // E4: persist bounded groups
          boundedGroups: state.boundedGroups,
          // E5: persist UI state for E2E and user convenience
          phase: state.phase,
          leftExpand: state.leftExpand,
          centerExpand: state.centerExpand,
          rightExpand: state.rightExpand,
        }),
      }
    ),
    { name: 'canvasStore' }
  )
);

// Export for testing
export { markAllPending };
