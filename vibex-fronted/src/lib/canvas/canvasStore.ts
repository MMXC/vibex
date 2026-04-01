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
import { devtools, persist } from 'zustand/middleware';
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
  BoundedEdge,
  FlowEdge,
} from './types';
// Epic 2: Re-export ClarificationRound from canvasStore (single source from confirmationTypes)
export type { ClarificationRound } from '@/stores/confirmationTypes';

// ── Epic 1: Left/Right Persistent Drawer State ──────────────────────────────────

export type SSEStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/** F1: Canvas expand mode — replaces old leftExpand/centerExpand/rightExpand logic */
export type CanvasExpandMode = 'normal' | 'expand-both' | 'maximize';

import exampleCanvasData from '@/data/example-canvas.json';
import { canvasApi } from './api/canvasApi';
import { getHistoryStore } from './historySlice';

// ── Epic 6: Message Slice Types ───────────────────────────────────────────────
export type MessageType = 'user_action' | 'ai_suggestion' | 'system' | 'command_executed';

export interface MessageItem {
  id: string;
  type: MessageType;
  content: string;
  meta?: string;
  timestamp: number;
}

let _messageIdCounter = 0;
function newMessageId(): string {
  return `msg-${Date.now()}-${++_messageIdCounter}`;
}

// ── Epic 6: Message Slice ─────────────────────────────────────────────────────
// Merges messageDrawerStore into canvasStore as a slice
export interface MessageSlice {
  // State
  messages: MessageItem[];
  // Actions
  addMessage: (msg: Omit<MessageItem, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

// =============================================================================
// Helpers
// =============================================================================

const CANVAS_STORAGE_KEY = 'vibex-canvas-storage';
const CANVAS_STORAGE_VERSION_KEY = `${CANVAS_STORAGE_KEY}-version`;
const CURRENT_STORAGE_VERSION = 3;

/**
 * Epic 5: Migration
 * Manual migration for Zustand persist state.
 * Handles upgrading from unversioned state to version 1.
 * When schema changes, increment CURRENT_STORAGE_VERSION and add migration handlers.
 */
function runMigrations(storedState: Record<string, unknown>): Record<string, unknown> {
  const storedVersion = localStorage.getItem(CANVAS_STORAGE_VERSION_KEY);
  const version = storedVersion ? parseInt(storedVersion, 10) : 0;

  let migrated = { ...storedState };

  if (version < 1) {
    // Migration 0→1: Add panel collapse state with defaults
    migrated = {
      ...migrated,
      contextPanelCollapsed: (migrated.contextPanelCollapsed as boolean | undefined) ?? false,
      flowPanelCollapsed: (migrated.flowPanelCollapsed as boolean | undefined) ?? false,
      componentPanelCollapsed: (migrated.componentPanelCollapsed as boolean | undefined) ?? false,
    };
  }
  if (version < 2) {
    // Migration 1→2: Add messages array (Epic 6 merge)
    migrated = {
      ...migrated,
      messages: (migrated.messages as unknown[]) ?? [],
    };
  }
  if (version < 3) {
    // Migration 2→3: confirmed → isActive (Epic 3)
    const migrateNodes = (nodes: any[]): any[] =>
      nodes.map((n: any) => {
        const confirmed = n.confirmed;
        const { confirmed: _confirmed, ...rest } = n;
        return { ...rest, isActive: confirmed ?? true };
      });
    migrated = {
      ...migrated,
      contextNodes: migrateNodes((migrated.contextNodes as unknown[]) ?? []),
      flowNodes: migrateNodes((migrated.flowNodes as unknown[]) ?? []),
      componentNodes: migrateNodes((migrated.componentNodes as unknown[]) ?? []),
    };
  }

  // Future migrations go here:
  // if (version < 2) { migrated = migrateV1toV2(migrated); }

  return migrated;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function markAllPending<T extends { status: string; isActive?: boolean }>(nodes: T[]): T[] {
  return nodes.map(n => ({ ...n, status: 'pending' as const, isActive: false }));
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
   * 检查是否所有节点都已激活（isActive=true 或 undefined）
   * @deprecated use hasNodes instead
   */
  areAllConfirmed(nodes: Array<{ isActive?: boolean }>): boolean {
    return nodes.length > 0 && nodes.every(n => n.isActive !== false);
  }

  /**
   * 检查是否有激活节点（isActive=true 或 undefined）
   */
  hasActiveNodes(nodes: Array<{ isActive?: boolean }>): boolean {
    return nodes.some(n => n.isActive !== false);
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

  // === Expand Slice (E2 → F1: 替换为 expandMode) ===
  leftExpand: PanelExpandState;
  centerExpand: PanelExpandState;
  rightExpand: PanelExpandState;
  getGridTemplate: () => string;
  setLeftExpand: (state: PanelExpandState) => void;
  setCenterExpand: (state: PanelExpandState) => void;
  setRightExpand: (state: PanelExpandState) => void;
  togglePanel: (panel: 'left' | 'center' | 'right') => void;
  resetExpand: () => void;

  // === F1: New expand mode (replaces old 1.5fr logic) ===
  /** Canvas expand mode: normal | expand-both | maximize */
  expandMode: CanvasExpandMode;
  /** Set expand mode */
  setExpandMode: (mode: CanvasExpandMode) => void;
  /** Toggle maximize mode */
  toggleMaximize: () => void;

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

  // === F2: BoundedEdge Slice (Epic 3 F3.1/F3.2) ===
  /** BoundedContext 连线列表 */
  boundedEdges: BoundedEdge[];
  /** Add a BoundedEdge */
  addBoundedEdge: (edge: Omit<BoundedEdge, 'id'>) => void;
  /** Remove a BoundedEdge by id */
  removeBoundedEdge: (id: string) => void;
  /** Clear all BoundedEdges */
  clearBoundedEdges: () => void;
  /** Set all BoundedEdges at once */
  setBoundedEdges: (edges: BoundedEdge[]) => void;

  // === F2: FlowEdge Slice (Epic 3 F3.3) ===
  /** Flow node 连线列表 */
  flowEdges: FlowEdge[];
  /** Add a FlowEdge */
  addFlowEdge: (edge: Omit<FlowEdge, 'id'>) => void;
  /** Remove a FlowEdge by id */
  removeFlowEdge: (id: string) => void;
  /** Clear all FlowEdges */
  clearFlowEdges: () => void;
  /** Set all FlowEdges at once */
  setFlowEdges: (edges: FlowEdge[]) => void;

  // === Context Slice ===
  contextNodes: BoundedContextNode[];
  contextDraft: Partial<BoundedContextNode> | null;

  // === Flow Slice ===
  flowNodes: BusinessFlowNode[];
  flowDraft: Partial<BusinessFlowNode> | null;

  // === Component Slice ===
  componentNodes: ComponentNode[];
  componentDraft: Partial<ComponentNode> | null;

  // === Multi-Select Slice (F3-F10) ===
  /** Selected node IDs per tree type */
  selectedNodeIds: Record<TreeType, string[]>;
  /** Toggle node selection (add/remove) */
  toggleNodeSelect: (tree: TreeType, nodeId: string) => void;
  /** Select a single node, clearing previous selection in same tree */
  selectNode: (tree: TreeType, nodeId: string) => void;
  /** Clear all selections in a tree */
  clearNodeSelection: (tree: TreeType) => void;
  /** Select all nodes in a tree */
  selectAllNodes: (tree: TreeType) => void;
  /** Delete all selected nodes in a tree (batch delete) */
  deleteSelectedNodes: (tree: TreeType) => void;

  // === Queue Slice ===
  projectId: string | null;
  prototypeQueue: PrototypePage[];
  isPolling: boolean;

  // === AI Thinking Slice (Epic 1) ===
  aiThinking: boolean;
  aiThinkingMessage: string | null;
  requirementText: string;

  // === Left/Right Persistent Drawer Slice (Epic 1 S1.1) ===
  /** Left drawer open state */
  leftDrawerOpen: boolean;
  /** Right drawer open state */
  rightDrawerOpen: boolean;
  // Epic 6: Message slice — merged from messageDrawerStore
  messages: MessageItem[];
  /** Left drawer width in px (100-400) */
  leftDrawerWidth: number;
  /** Right drawer width in px (100-400) */
  rightDrawerWidth: number;

  // === SSE Status Slice (Epic 1 S1.3) ===
  /** SSE connection status */
  sseStatus: SSEStatus;
  /** SSE error message when status is 'error' */
  sseError: string | null;
  /** AbortController ref for cancelling SSE/AI generation requests */
  abortControllerRef: AbortController | null;

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

  // === Left/Right Drawer Actions (Epic 1 S1.1) ===
  /** Toggle left drawer open/closed */
  toggleLeftDrawer: () => void;
  /** Toggle right drawer open/closed */
  toggleRightDrawer: () => void;
  /** Set left drawer width */
  setLeftDrawerWidth: (width: number) => void;
  /** Set right drawer width */
  setRightDrawerWidth: (width: number) => void;

  // === Epic 6: Message Slice Actions (merged from messageDrawerStore) ===
  /** Append a message to the session log */
  addMessage: (msg: Omit<MessageItem, 'id' | 'timestamp'>) => void;
  /** Clear all messages */
  clearMessages: () => void;

  // === SSE Status Actions (Epic 1 S1.3) ===
  /** Set SSE connection status */
  setSseStatus: (status: SSEStatus, error?: string) => void;
  /** Abort all in-flight SSE/AI generation requests */
  abortGeneration: () => void;

  // === Context Slice Actions ===
  setContextNodes: (nodes: BoundedContextNode[]) => void;
  addContextNode: (data: BoundedContextDraft) => void;
  editContextNode: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  deleteContextNode: (nodeId: string) => void;
  setContextDraft: (draft: Partial<BoundedContextNode> | null) => void;

  // === Flow Slice Actions ===
  setFlowNodes: (nodes: BusinessFlowNode[]) => void;
  addFlowNode: (data: BusinessFlowDraft) => void;
  editFlowNode: (nodeId: string, data: Partial<BusinessFlowNode>) => void;
  deleteFlowNode: (nodeId: string) => void;
  setFlowDraft: (draft: Partial<BusinessFlowNode> | null) => void;
  // === Step Actions (Epic 3) ===
  addStepToFlow: (flowNodeId: string, data: { name: string; actor?: string; description?: string }) => void;
  confirmStep: (flowNodeId: string, stepId: string) => void;
  editStep: (flowNodeId: string, stepId: string, data: Partial<FlowStep>) => void;
  deleteStep: (flowNodeId: string, stepId: string) => void;
  reorderSteps: (flowNodeId: string, fromIndex: number, toIndex: number) => void;
  // === Auto-generation (Epic 3) ===
  autoGenerateFlows: (contexts: BoundedContextNode[]) => Promise<void>;
  // === Manual Generation (Epic 4) ===
  /** 从 flow 节点手动生成 component 节点 */
  generateComponentFromFlow: () => Promise<void>;

  // === Example Data (F-1.2) ===
  /** Load example canvas data — sets all three trees + advances phase to context */
  loadExampleData: () => void;

  // === Component Slice Actions ===
  setComponentNodes: (nodes: ComponentNode[]) => void;
  clearComponentCanvas: () => void;
  addComponentNode: (data: Omit<ComponentNode, 'nodeId' | 'status' | 'isActive' | 'children'>) => void;
  editComponentNode: (nodeId: string, data: Partial<ComponentNode>) => void;
  deleteComponentNode: (nodeId: string) => void;
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

          // === Multi-Select Slice (F3-F10) ===
          selectedNodeIds: { context: [], flow: [], component: [] },

          toggleNodeSelect: (tree, nodeId) => {
            set((s) => {
              const current = s.selectedNodeIds[tree];
              const exists = current.includes(nodeId);
              return {
                selectedNodeIds: {
                  ...s.selectedNodeIds,
                  [tree]: exists
                    ? current.filter((id) => id !== nodeId)
                    : [...current, nodeId],
                },
              };
            });
          },

          selectNode: (tree, nodeId) => {
            set((s) => ({
              selectedNodeIds: {
                ...s.selectedNodeIds,
                [tree]: [nodeId],
              },
            }));
          },

          clearNodeSelection: (tree) => {
            set((s) => ({
              selectedNodeIds: {
                ...s.selectedNodeIds,
                [tree]: [],
              },
            }));
          },

          selectAllNodes: (tree) => {
            set((s) => {
              const nodeIds = s[`${tree}Nodes`].map((n: BoundedContextNode | BusinessFlowNode | ComponentNode) => n.nodeId);
              return {
                selectedNodeIds: {
                  ...s.selectedNodeIds,
                  [tree]: nodeIds,
                },
              };
            });
          },

          deleteSelectedNodes: (tree) => {
            const { selectedNodeIds } = get();
            const toDelete = new Set(selectedNodeIds[tree]);
            if (toDelete.size === 0) return;

            const deleteActions: Record<TreeType, (id: string) => void> = {
              context: get().deleteContextNode,
              flow: get().deleteFlowNode,
              component: get().deleteComponentNode,
            };

            // Record undo snapshot before batch delete
            const historyStore = getHistoryStore();
            const nodes = get()[`${tree}Nodes`];
            historyStore.recordSnapshot(tree, nodes);

            // Delete each selected node
            toDelete.forEach((id) => deleteActions[tree](id));

            // Clear selection after delete
            set((s) => ({
              selectedNodeIds: {
                ...s.selectedNodeIds,
                [tree]: [],
              },
            }));
          },

          // === Queue Slice ===
          projectId: null,
          prototypeQueue: [],
          isPolling: false,

          // === AI Thinking Slice (Epic 1) ===
          aiThinking: false,
          aiThinkingMessage: null,
          requirementText: '',

          // === Left/Right Persistent Drawer Slice (Epic 1 S1.1) ===
          leftDrawerOpen: false,
          rightDrawerOpen: false,
          // Epic 6: Message slice initial state
          messages: [],
          leftDrawerWidth: 200,
          rightDrawerWidth: 200,

          // === SSE Status Slice (Epic 1 S1.3) ===
          sseStatus: 'idle',
          sseError: null,
          abortControllerRef: null,

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

          // === Left/Right Persistent Drawer Actions (Epic 1 S1.1) ===
          toggleLeftDrawer: () =>
            set((s) => ({ leftDrawerOpen: !s.leftDrawerOpen })),
          toggleRightDrawer: () =>
            set((s) => ({ rightDrawerOpen: !s.rightDrawerOpen })),
          setLeftDrawerWidth: (width: number) =>
            set({ leftDrawerWidth: Math.min(400, Math.max(100, width)) }),
          setRightDrawerWidth: (width: number) =>
            set({ rightDrawerWidth: Math.min(400, Math.max(100, width)) }),

          // === Epic 6: Message Slice Actions ===
          addMessage: (msg: Omit<MessageItem, 'id' | 'timestamp'>) =>
            set((s) => ({
              messages: [
                ...s.messages,
                { ...msg, id: newMessageId(), timestamp: Date.now() },
              ],
            })),
          clearMessages: () => set({ messages: [] }),

          // === SSE Status Actions (Epic 1 S1.3) ===
          setSseStatus: (status, error) =>
            set({ sseStatus: status, sseError: error ?? null }),

          abortGeneration: () => {
            const { abortControllerRef } = get();
            if (abortControllerRef) {
              abortControllerRef.abort();
              set({ abortControllerRef: null, sseStatus: 'idle', flowGenerating: false, aiThinking: false });
            }
          },

          // === Expand Slice (E2) ===
          leftExpand: 'default',
          centerExpand: 'default',
          rightExpand: 'default',

          getGridTemplate: () => {
            // F1.4: Old 1.5fr logic removed — always 1fr for three-column layout
            return '1fr 1fr 1fr';
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

          resetExpand: () => set({ leftExpand: 'default', centerExpand: 'default', rightExpand: 'default', expandMode: 'normal' }),

          // === F1: New expand mode ===
          expandMode: 'normal',

          setExpandMode: (mode) => {
            set({ expandMode: mode });
            // Persist to localStorage
            try {
              localStorage.setItem('canvas-expand-mode', mode);
            } catch {
              // ignore quota errors
            }
          },

          toggleMaximize: () => {
            const next = get().expandMode === 'maximize' ? 'normal' : 'maximize';
            set({ expandMode: next });
            try {
              localStorage.setItem('canvas-expand-mode', next);
            } catch {
              // ignore
            }
          },

          // === Context Slice Actions ===
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
            // Epic 4: auto-append user_action message
            useCanvasStore.getState().addMessage({ type: 'user_action', content: `添加了上下文节点`, meta: data.name });
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
            // Epic 4: auto-append user_action message
            useCanvasStore.getState().addMessage({ type: 'user_action', content: `删除了上下文节点`, meta: deletedName });
          },

          // [E1] 确认上下文节点 — 设置 isActive=true, status='confirmed'
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
            // Epic 4: auto-append user_action message
            useCanvasStore.getState().addMessage({ type: 'user_action', content: `添加了流程节点`, meta: data.name });
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

          // [E1] 确认流程节点
          confirmFlowNode: (nodeId) => {
            set((s) => {
              const newNodes = s.flowNodes.map((n) =>
                n.nodeId === nodeId
                  ? { ...n, isActive: true, status: 'confirmed' as const }
                  : n
              );
              return { flowNodes: newNodes };
            });
          },

          // [E1] 确认步骤 — 在流程节点内设置指定 stepId 的步骤为 confirmed
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

          deleteFlowNode: (nodeId) => {
            const nodeToDelete = get().flowNodes.find((n) => n.nodeId === nodeId);
            const deletedName = nodeToDelete?.name ?? nodeId;
            set((s) => {
              const newNodes = s.flowNodes.filter((n) => n.nodeId !== nodeId);
              getHistoryStore().recordSnapshot('flow', newNodes);
              return { flowNodes: newNodes };
            });
            // Epic 4: auto-append user_action message
            useCanvasStore.getState().addMessage({ type: 'user_action', content: `删除了流程节点`, meta: deletedName });
          },



          setFlowDraft: (draft) => set({ flowDraft: draft }),

          // === Step Actions (Epic 3) ===
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
                return {
                  ...n,
                  steps: [...n.steps, newStep],
                  status: 'pending' as const,
                };
              });
              getHistoryStore().recordSnapshot('flow', newNodes);
              return { flowNodes: newNodes };
            });
          },

          confirmStep: (flowNodeId, stepId) => {
            set((s) => ({
              flowNodes: s.flowNodes.map((n) =>
                n.nodeId === flowNodeId
                  ? {
                      ...n,
                      steps: n.steps.map((st) =>
                        st.stepId === stepId
                          ? { ...st, isActive: true, status: 'confirmed' as const }
                          : st
                      ),
                    }
                  : n
              ),
            }));
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
                    isActive: false,
                    status: 'pending' as const,
                  })),
                  isActive: false,
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

          // === Manual Component Generation (Epic 4) ===
          generateComponentFromFlow: async () => {
            const { contextNodes, flowNodes } = get();
            if (flowNodes.length === 0) {
              console.warn('[canvasStore] generateComponentFromFlow: no flow nodes');
              return;
            }

            try {
              const mappedContexts = contextNodes.map((ctx) => ({
                id: ctx.nodeId,
                name: ctx.name,
                description: ctx.description ?? '',
                type: ctx.type,
              }));

              const mappedFlows = flowNodes.map((f) => ({
                name: f.name,
                contextId: f.contextId,
                steps: f.steps.map((s) => ({ name: s.name, actor: s.actor })),
              }));

              const { projectId } = get();
              const sessionId = projectId ?? `session-${Date.now()}`;

              const result = await canvasApi.generateComponents({
                contexts: mappedContexts,
                flows: mappedFlows,
                sessionId,
              });

              if (result.success && result.components) {
                const newNodes: ComponentNode[] = result.components.map((c) => ({
                  nodeId: generateId(),
                  flowId: c.flowId ?? '',
                  name: c.name,
                  type: c.type,
                  props: {},
                  api: c.api ? { ...c.api, params: c.api.params ?? [] } : { method: 'GET', path: '/api', params: [] },
                  children: [],
                  isActive: false,
                  status: 'pending' as const,
                }));

                set({ componentNodes: newNodes });
                get().setPhase('component');
                useCanvasStore.getState().addMessage({
                  type: 'user_action',
                  content: `生成了 ${newNodes.length} 个组件节点`,
                });
              } else {
                console.error('[canvasStore] generateComponentFromFlow: no components', result.error);
              }
            } catch (err) {
              console.error('[canvasStore] generateComponentFromFlow error:', err);
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
            // Initialize history for all three trees with example data
            getHistoryStore().initAllHistories(data.contextNodes, data.flowNodes, data.componentNodes);
          },

          // === Component Slice Actions ===
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
              getHistoryStore().recordSnapshot('component', newNodes);
              return { componentNodes: newNodes };
            });
            // Epic 4: auto-append user_action message
            useCanvasStore.getState().addMessage({ type: 'user_action', content: `添加了组件节点`, meta: data.name });
          },

          editComponentNode: (nodeId, data) => {
            set((s) => {
              const newNodes = s.componentNodes.map((n) =>
                n.nodeId === nodeId ? { ...n, ...data, status: 'pending' as const } : n
              );
              getHistoryStore().recordSnapshot('component', newNodes);
              return { componentNodes: newNodes };
            });
          },

          deleteComponentNode: (nodeId) => {
            const nodeToDelete = get().componentNodes.find((n) => n.nodeId === nodeId);
            const deletedName = nodeToDelete?.name ?? nodeId;
            set((s) => {
              const newNodes = s.componentNodes.filter((n) => n.nodeId !== nodeId);
              getHistoryStore().recordSnapshot('component', newNodes);
              return { componentNodes: newNodes };
            });
            // Epic 4: auto-append user_action message
            useCanvasStore.getState().addMessage({ type: 'user_action', content: `删除了组件节点`, meta: deletedName });
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
            const { canvasSseAnalyze } = require('./api/canvasSseApi') as typeof import('./api/canvasSseApi');

            canvasSseAnalyze(text, {
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

          // === F2: BoundedEdge Slice ===
          boundedEdges: [],
          addBoundedEdge: (edgeData) => {
            const newEdge: BoundedEdge = { ...edgeData, id: generateId() };
            set((s) => ({ boundedEdges: [...s.boundedEdges, newEdge] }));
          },
          removeBoundedEdge: (id) => {
            set((s) => ({ boundedEdges: s.boundedEdges.filter((e) => e.id !== id) }));
          },
          clearBoundedEdges: () => set({ boundedEdges: [] }),
          setBoundedEdges: (edges) => set({ boundedEdges: edges }),

          // === F2: FlowEdge Slice ===
          flowEdges: [],
          addFlowEdge: (edgeData) => {
            const newEdge: FlowEdge = { ...edgeData, id: generateId() };
            set((s) => ({ flowEdges: [...s.flowEdges, newEdge] }));
          },
          removeFlowEdge: (id) => {
            set((s) => ({ flowEdges: s.flowEdges.filter((e) => e.id !== id) }));
          },
          clearFlowEdges: () => set({ flowEdges: [] }),
          setFlowEdges: (edges) => set({ flowEdges: edges }),

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
                set({ activeTree: newActiveTree, _prevActiveTree: newActiveTree, phase: 'component' });
                get().setCenterExpand('expand-left');
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
        storage: {
          getItem: (name: string) => {
            const value = localStorage.getItem(name);
            if (value === null) return null;
            try {
              const parsed = JSON.parse(value);
              // Apply migrations if needed
              const migrated = runMigrations(parsed.state ?? {});
              // Update version
              localStorage.setItem(CANVAS_STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
              return { ...parsed, state: migrated };
            } catch {
              return value ? { state: JSON.parse(value) } : null;
            }
          },
          setItem: (name: string, newValue: { state: Record<string, unknown> }) => {
            localStorage.setItem(name, JSON.stringify(newValue));
            localStorage.setItem(CANVAS_STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
          },
          removeItem: (name: string) => {
            localStorage.removeItem(name);
            localStorage.removeItem(CANVAS_STORAGE_VERSION_KEY);
          },
        },
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
          // F2: persist edge layers
          boundedEdges: state.boundedEdges,
          flowEdges: state.flowEdges,
          // E5: persist UI state for E2E and user convenience
          phase: state.phase,
          leftExpand: state.leftExpand,
          centerExpand: state.centerExpand,
          rightExpand: state.rightExpand,
          // Epic 2: persist panel collapse state independently
          contextPanelCollapsed: state.contextPanelCollapsed,
          flowPanelCollapsed: state.flowPanelCollapsed,
          componentPanelCollapsed: state.componentPanelCollapsed,
          // Epic 6: persist messages in canvasStore (merged from messageDrawerStore)
          messages: state.messages,
        }),
      }
    ),
    { name: 'canvasStore' }
  )
);

// Export for testing
export { markAllPending };
