/**
 * VibeX Canvas Store — Zustand State Management
 * 三树并行画布状态管理（按 slice 划分）
 *
 * 遵守 AGENTS.md ADR-002 约束：
 * - 不在 confirmationStore 上扩展，新建 canvasStore
 * - 状态分片按 context/flow/component/phase/queue 严格划分
 * - CascadeUpdateManager 内聚在 store 内
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Phase, TreeType, BoundedContextNode, BusinessFlowNode, ComponentNode, PrototypePage, BoundedContextDraft, BusinessFlowDraft, FlowStep, PanelExpandState, BoundedGroup, BoundedEdge, FlowEdge } from './types';
// Epic 5: Import session types from sessionStore
import type { SSEStatus, MessageItem } from './stores/sessionStore';
// Epic 2: Re-export ClarificationRound from canvasStore (single source from confirmationTypes)
export type { ClarificationRound } from '@/stores/confirmationTypes';

// Epic 1: Import + re-export contextStore (extracted slice for modular state management)
import { useContextStore } from './stores/contextStore';
export { useContextStore };

// Epic 2: Re-export uiStore (extracted UI slice — panels, expand, drag, drawers)
export { useUIStore } from './stores/uiStore';

// Epic 3: Re-export flowStore (extracted flow slice — flowNodes CRUD, steps)
export { useFlowStore } from './stores/flowStore';

// Epic 4: Re-export componentStore (extracted component slice — componentNodes CRUD, multi-select)
export { useComponentStore } from './stores/componentStore';

// Epic 5: Re-export sessionStore (extracted session slice — SSE, AI thinking, messages, queue)
export { useSessionStore } from './stores/sessionStore';

/** F1: Canvas expand mode — replaces old leftExpand/centerExpand/rightExpand logic */
export type CanvasExpandMode = 'normal' | 'expand-both' | 'maximize';
import exampleCanvasData from '@/data/example-canvas.json';
import { canvasApi } from './api/canvasApi';
import { areAllConfirmed } from './cascade';
import { getHistoryStore } from './historySlice';

// MessageSlice types now re-exported from sessionStore

// =============================================================================
// Helpers
// =============================================================================

// =============================================================================
// Helpers
// =============================================================================

const CANVAS_STORAGE_KEY = stryMutAct_9fa48("0") ? "" : (stryCov_9fa48("0"), 'vibex-canvas-storage');
const CANVAS_STORAGE_VERSION_KEY = stryMutAct_9fa48("1") ? `` : (stryCov_9fa48("1"), `${CANVAS_STORAGE_KEY}-version`);
const CURRENT_STORAGE_VERSION = 4;

/**
 * Epic 5: Migration
 * Manual migration for Zustand persist state.
 * Handles upgrading from unversioned state to version 1.
 * When schema changes, increment CURRENT_STORAGE_VERSION and add migration handlers.
 */
function runMigrations(storedState: Record<string, unknown>): Record<string, unknown> {
  if (stryMutAct_9fa48("2")) {
    {}
  } else {
    stryCov_9fa48("2");
    const storedVersion = localStorage.getItem(CANVAS_STORAGE_VERSION_KEY);
    const version = storedVersion ? parseInt(storedVersion, 10) : 0;
    let migrated = stryMutAct_9fa48("3") ? {} : (stryCov_9fa48("3"), {
      ...storedState
    });
    if (stryMutAct_9fa48("7") ? version >= 1 : stryMutAct_9fa48("6") ? version <= 1 : stryMutAct_9fa48("5") ? false : stryMutAct_9fa48("4") ? true : (stryCov_9fa48("4", "5", "6", "7"), version < 1)) {
      if (stryMutAct_9fa48("8")) {
        {}
      } else {
        stryCov_9fa48("8");
        // Migration 0→1: Add panel collapse state with defaults
        migrated = stryMutAct_9fa48("9") ? {} : (stryCov_9fa48("9"), {
          ...migrated,
          contextPanelCollapsed: stryMutAct_9fa48("10") ? migrated.contextPanelCollapsed as boolean | undefined && false : (stryCov_9fa48("10"), migrated.contextPanelCollapsed as boolean | undefined ?? (stryMutAct_9fa48("11") ? true : (stryCov_9fa48("11"), false))),
          flowPanelCollapsed: stryMutAct_9fa48("12") ? migrated.flowPanelCollapsed as boolean | undefined && false : (stryCov_9fa48("12"), migrated.flowPanelCollapsed as boolean | undefined ?? (stryMutAct_9fa48("13") ? true : (stryCov_9fa48("13"), false))),
          componentPanelCollapsed: stryMutAct_9fa48("14") ? migrated.componentPanelCollapsed as boolean | undefined && false : (stryCov_9fa48("14"), migrated.componentPanelCollapsed as boolean | undefined ?? (stryMutAct_9fa48("15") ? true : (stryCov_9fa48("15"), false)))
        });
      }
    }
    if (stryMutAct_9fa48("19") ? version >= 2 : stryMutAct_9fa48("18") ? version <= 2 : stryMutAct_9fa48("17") ? false : stryMutAct_9fa48("16") ? true : (stryCov_9fa48("16", "17", "18", "19"), version < 2)) {
      if (stryMutAct_9fa48("20")) {
        {}
      } else {
        stryCov_9fa48("20");
        // Migration 1→2: Add messages array (Epic 6 merge)
        migrated = stryMutAct_9fa48("21") ? {} : (stryCov_9fa48("21"), {
          ...migrated,
          messages: stryMutAct_9fa48("22") ? migrated.messages as unknown[] && [] : (stryCov_9fa48("22"), migrated.messages as unknown[] ?? (stryMutAct_9fa48("23") ? ["Stryker was here"] : (stryCov_9fa48("23"), [])))
        });
      }
    }
    if (stryMutAct_9fa48("27") ? version >= 3 : stryMutAct_9fa48("26") ? version <= 3 : stryMutAct_9fa48("25") ? false : stryMutAct_9fa48("24") ? true : (stryCov_9fa48("24", "25", "26", "27"), version < 3)) {
      if (stryMutAct_9fa48("28")) {
        {}
      } else {
        stryCov_9fa48("28");
        // Migration 2→3: confirmed → isActive AND status (Epic 3)
        // Fix: also set status='confirmed' when confirmed=true to preserve confirmation state
        const migrateNodes = stryMutAct_9fa48("29") ? () => undefined : (stryCov_9fa48("29"), (() => {
          const migrateNodes = (nodes: any[]): any[] => nodes.map((n: any) => {
            if (stryMutAct_9fa48("30")) {
              {}
            } else {
              stryCov_9fa48("30");
              const confirmed = n.confirmed;
              const {
                confirmed: _confirmed,
                ...rest
              } = n;
              return stryMutAct_9fa48("31") ? {} : (stryCov_9fa48("31"), {
                ...rest,
                isActive: stryMutAct_9fa48("32") ? confirmed && true : (stryCov_9fa48("32"), confirmed ?? (stryMutAct_9fa48("33") ? false : (stryCov_9fa48("33"), true))),
                // E1 fix: preserve confirmation state in status field
                status: confirmed ? stryMutAct_9fa48("34") ? "" : (stryCov_9fa48("34"), 'confirmed') : stryMutAct_9fa48("35") ? n.status && 'pending' : (stryCov_9fa48("35"), n.status ?? (stryMutAct_9fa48("36") ? "" : (stryCov_9fa48("36"), 'pending')))
              });
            }
          });
          return migrateNodes;
        })());
        migrated = stryMutAct_9fa48("37") ? {} : (stryCov_9fa48("37"), {
          ...migrated,
          contextNodes: migrateNodes(stryMutAct_9fa48("38") ? migrated.contextNodes as unknown[] && [] : (stryCov_9fa48("38"), migrated.contextNodes as unknown[] ?? (stryMutAct_9fa48("39") ? ["Stryker was here"] : (stryCov_9fa48("39"), [])))),
          flowNodes: migrateNodes(stryMutAct_9fa48("40") ? migrated.flowNodes as unknown[] && [] : (stryCov_9fa48("40"), migrated.flowNodes as unknown[] ?? (stryMutAct_9fa48("41") ? ["Stryker was here"] : (stryCov_9fa48("41"), [])))),
          componentNodes: migrateNodes(stryMutAct_9fa48("42") ? migrated.componentNodes as unknown[] && [] : (stryCov_9fa48("42"), migrated.componentNodes as unknown[] ?? (stryMutAct_9fa48("43") ? ["Stryker was here"] : (stryCov_9fa48("43"), []))))
        });
      }
    }

    // E1-S2: Migration 3→4 — add 'generating' to status enum for new nodes
    if (stryMutAct_9fa48("47") ? version >= 4 : stryMutAct_9fa48("46") ? version <= 4 : stryMutAct_9fa48("45") ? false : stryMutAct_9fa48("44") ? true : (stryCov_9fa48("44", "45", "46", "47"), version < 4)) {
      if (stryMutAct_9fa48("48")) {
        {}
      } else {
        stryCov_9fa48("48");
        // Migration 3→4: ensure status values are valid (no-op since schema accepts any)
        // This version bump ensures fresh localStorage gets version 4
        migrated = stryMutAct_9fa48("49") ? {} : (stryCov_9fa48("49"), {
          ...migrated
        });
      }
    }

    // Future migrations go here:
    // if (version < 2) { migrated = migrateV1toV2(migrated); }

    return migrated;
  }
}
function generateId(): string {
  if (stryMutAct_9fa48("50")) {
    {}
  } else {
    stryCov_9fa48("50");
    return stryMutAct_9fa48("51") ? `` : (stryCov_9fa48("51"), `${Date.now()}-${stryMutAct_9fa48("52") ? Math.random().toString(36) : (stryCov_9fa48("52"), Math.random().toString(36).slice(2, 9))}`);
  }
}
let _msgIdCounter = 0;
function newMessageId(): string {
  if (stryMutAct_9fa48("53")) {
    {}
  } else {
    stryCov_9fa48("53");
    return stryMutAct_9fa48("54") ? `` : (stryCov_9fa48("54"), `msg-${Date.now()}-${stryMutAct_9fa48("55") ? --_msgIdCounter : (stryCov_9fa48("55"), ++_msgIdCounter)}`);
  }
}
function markAllPending<T extends {
  status: string;
  isActive?: boolean;
}>(nodes: T[]): T[] {
  if (stryMutAct_9fa48("56")) {
    {}
  } else {
    stryCov_9fa48("56");
    return nodes.map(stryMutAct_9fa48("57") ? () => undefined : (stryCov_9fa48("57"), n => stryMutAct_9fa48("58") ? {} : (stryCov_9fa48("58"), {
      ...n,
      status: 'pending' as const,
      isActive: stryMutAct_9fa48("59") ? true : (stryCov_9fa48("59"), false)
    })));
  }
}

// =============================================================================
// areAllConfirmed imported from cascade/ (E2 migration: class removed)

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
  draggedPositions: Record<string, {
    x: number;
    y: number;
  }>;
  isDragging: boolean;
  /** Begin dragging a node — sets draggedNodeId and isDragging */
  startDrag: (nodeId: string) => void;
  /** End dragging — saves position and clears drag state */
  endDrag: (nodeId: string, position: {
    x: number;
    y: number;
  }) => void;
  /** Track which node we're dragging over (drop target) */
  setDragOver: (nodeId: string | null) => void;
  /** Live update position during drag */
  updateDraggedPosition: (nodeId: string, position: {
    x: number;
    y: number;
  }) => void;
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
  /** Confirm a context node — sets isActive=true, status='confirmed' */
  confirmContextNode: (nodeId: string) => void;
  /** Toggle a context node confirmation status */
  toggleContextNode: (nodeId: string) => void;

  // === Flow Slice ===
  flowNodes: BusinessFlowNode[];
  flowDraft: Partial<BusinessFlowNode> | null;
  /** Confirm a flow node — sets status='confirmed' */
  confirmFlowNode: (nodeId: string) => void;
  toggleFlowNode: (nodeId: string) => void;

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
  // [E2] Open right drawer (sets to true)
  openRightDrawer: () => void;
  // [E2] Submit canvas event
  submitCanvas: () => void;
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
  addStepToFlow: (flowNodeId: string, data: {
    name: string;
    actor?: string;
    description?: string;
  }) => void;
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
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useCanvasStore = create<CanvasStore>()(devtools(persist((set, get) => {
  if (stryMutAct_9fa48("60")) {
    {}
  } else {
    stryCov_9fa48("60");
    return stryMutAct_9fa48("61") ? {} : (stryCov_9fa48("61"), {
      // === Phase Slice ===
      phase: stryMutAct_9fa48("62") ? "" : (stryCov_9fa48("62"), 'input'),
      activeTree: null,
      // === Panel Collapse Slice ===
      contextPanelCollapsed: stryMutAct_9fa48("63") ? true : (stryCov_9fa48("63"), false),
      flowPanelCollapsed: stryMutAct_9fa48("64") ? true : (stryCov_9fa48("64"), false),
      componentPanelCollapsed: stryMutAct_9fa48("65") ? true : (stryCov_9fa48("65"), false),
      // === Context Slice (source of truth in useContextStore, synced via subscription) ===
      contextNodes: stryMutAct_9fa48("66") ? ["Stryker was here"] : (stryCov_9fa48("66"), []),
      contextDraft: null,
      // === Flow Slice ===
      flowNodes: stryMutAct_9fa48("67") ? ["Stryker was here"] : (stryCov_9fa48("67"), []),
      flowDraft: null,
      // === Component Slice ===
      componentNodes: stryMutAct_9fa48("68") ? ["Stryker was here"] : (stryCov_9fa48("68"), []),
      componentDraft: null,
      // === Multi-Select Slice (F3-F10) ===
      selectedNodeIds: stryMutAct_9fa48("69") ? {} : (stryCov_9fa48("69"), {
        context: stryMutAct_9fa48("70") ? ["Stryker was here"] : (stryCov_9fa48("70"), []),
        flow: stryMutAct_9fa48("71") ? ["Stryker was here"] : (stryCov_9fa48("71"), []),
        component: stryMutAct_9fa48("72") ? ["Stryker was here"] : (stryCov_9fa48("72"), [])
      }),
      toggleNodeSelect: (tree, nodeId) => {
        if (stryMutAct_9fa48("73")) {
          {}
        } else {
          stryCov_9fa48("73");
          set(s => {
            if (stryMutAct_9fa48("74")) {
              {}
            } else {
              stryCov_9fa48("74");
              const current = s.selectedNodeIds[tree];
              const exists = current.includes(nodeId);
              return stryMutAct_9fa48("75") ? {} : (stryCov_9fa48("75"), {
                selectedNodeIds: stryMutAct_9fa48("76") ? {} : (stryCov_9fa48("76"), {
                  ...s.selectedNodeIds,
                  [tree]: exists ? stryMutAct_9fa48("77") ? current : (stryCov_9fa48("77"), current.filter(stryMutAct_9fa48("78") ? () => undefined : (stryCov_9fa48("78"), id => stryMutAct_9fa48("81") ? id === nodeId : stryMutAct_9fa48("80") ? false : stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79", "80", "81"), id !== nodeId)))) : stryMutAct_9fa48("82") ? [] : (stryCov_9fa48("82"), [...current, nodeId])
                })
              });
            }
          });
        }
      },
      selectNode: (tree, nodeId) => {
        if (stryMutAct_9fa48("83")) {
          {}
        } else {
          stryCov_9fa48("83");
          set(stryMutAct_9fa48("84") ? () => undefined : (stryCov_9fa48("84"), s => stryMutAct_9fa48("85") ? {} : (stryCov_9fa48("85"), {
            selectedNodeIds: stryMutAct_9fa48("86") ? {} : (stryCov_9fa48("86"), {
              ...s.selectedNodeIds,
              [tree]: stryMutAct_9fa48("87") ? [] : (stryCov_9fa48("87"), [nodeId])
            })
          })));
        }
      },
      clearNodeSelection: tree => {
        if (stryMutAct_9fa48("88")) {
          {}
        } else {
          stryCov_9fa48("88");
          set(stryMutAct_9fa48("89") ? () => undefined : (stryCov_9fa48("89"), s => stryMutAct_9fa48("90") ? {} : (stryCov_9fa48("90"), {
            selectedNodeIds: stryMutAct_9fa48("91") ? {} : (stryCov_9fa48("91"), {
              ...s.selectedNodeIds,
              [tree]: stryMutAct_9fa48("92") ? ["Stryker was here"] : (stryCov_9fa48("92"), [])
            })
          })));
        }
      },
      selectAllNodes: tree => {
        if (stryMutAct_9fa48("93")) {
          {}
        } else {
          stryCov_9fa48("93");
          set(s => {
            if (stryMutAct_9fa48("94")) {
              {}
            } else {
              stryCov_9fa48("94");
              const nodeIds = s[stryMutAct_9fa48("95") ? `` : (stryCov_9fa48("95"), `${tree}Nodes`)].map(stryMutAct_9fa48("96") ? () => undefined : (stryCov_9fa48("96"), (n: BoundedContextNode | BusinessFlowNode | ComponentNode) => n.nodeId));
              return stryMutAct_9fa48("97") ? {} : (stryCov_9fa48("97"), {
                selectedNodeIds: stryMutAct_9fa48("98") ? {} : (stryCov_9fa48("98"), {
                  ...s.selectedNodeIds,
                  [tree]: nodeIds
                })
              });
            }
          });
        }
      },
      deleteSelectedNodes: tree => {
        if (stryMutAct_9fa48("99")) {
          {}
        } else {
          stryCov_9fa48("99");
          const {
            selectedNodeIds
          } = get();
          const toDelete = new Set(selectedNodeIds[tree]);
          if (stryMutAct_9fa48("102") ? toDelete.size !== 0 : stryMutAct_9fa48("101") ? false : stryMutAct_9fa48("100") ? true : (stryCov_9fa48("100", "101", "102"), toDelete.size === 0)) return;
          const deleteActions: Record<TreeType, (id: string) => void> = stryMutAct_9fa48("103") ? {} : (stryCov_9fa48("103"), {
            context: get().deleteContextNode,
            flow: get().deleteFlowNode,
            component: get().deleteComponentNode
          });

          // Record undo snapshot before batch delete
          const historyStore = getHistoryStore();
          const nodes = get()[stryMutAct_9fa48("104") ? `` : (stryCov_9fa48("104"), `${tree}Nodes`)];
          historyStore.recordSnapshot(tree, nodes);

          // Delete each selected node
          toDelete.forEach(stryMutAct_9fa48("105") ? () => undefined : (stryCov_9fa48("105"), id => deleteActions[tree](id)));

          // Clear selection after delete
          set(stryMutAct_9fa48("106") ? () => undefined : (stryCov_9fa48("106"), s => stryMutAct_9fa48("107") ? {} : (stryCov_9fa48("107"), {
            selectedNodeIds: stryMutAct_9fa48("108") ? {} : (stryCov_9fa48("108"), {
              ...s.selectedNodeIds,
              [tree]: stryMutAct_9fa48("109") ? ["Stryker was here"] : (stryCov_9fa48("109"), [])
            })
          })));
        }
      },
      // === Queue Slice ===
      projectId: null,
      prototypeQueue: stryMutAct_9fa48("110") ? ["Stryker was here"] : (stryCov_9fa48("110"), []),
      isPolling: stryMutAct_9fa48("111") ? true : (stryCov_9fa48("111"), false),
      // === AI Thinking Slice (Epic 1) ===
      aiThinking: stryMutAct_9fa48("112") ? true : (stryCov_9fa48("112"), false),
      aiThinkingMessage: null,
      requirementText: stryMutAct_9fa48("113") ? "Stryker was here!" : (stryCov_9fa48("113"), ''),
      // === Left/Right Persistent Drawer Slice (Epic 1 S1.1) ===
      leftDrawerOpen: stryMutAct_9fa48("114") ? true : (stryCov_9fa48("114"), false),
      rightDrawerOpen: stryMutAct_9fa48("115") ? true : (stryCov_9fa48("115"), false),
      // Epic 6: Message slice initial state
      messages: stryMutAct_9fa48("116") ? ["Stryker was here"] : (stryCov_9fa48("116"), []),
      leftDrawerWidth: 200,
      rightDrawerWidth: 200,
      // === SSE Status Slice (Epic 1 S1.3) ===
      sseStatus: stryMutAct_9fa48("117") ? "" : (stryCov_9fa48("117"), 'idle'),
      sseError: null,
      abortControllerRef: null,
      // === Flow Generation Slice ===
      flowGenerating: stryMutAct_9fa48("118") ? true : (stryCov_9fa48("118"), false),
      flowGeneratingMessage: null,
      // === Phase Actions ===
      setPhase: phase => {
        if (stryMutAct_9fa48("119")) {
          {}
        } else {
          stryCov_9fa48("119");
          set(stryMutAct_9fa48("120") ? {} : (stryCov_9fa48("120"), {
            phase
          }));
          get().recomputeActiveTree();
        }
      },
      advancePhase: () => {
        if (stryMutAct_9fa48("121")) {
          {}
        } else {
          stryCov_9fa48("121");
          const {
            phase
          } = get();
          const phaseOrder: Phase[] = stryMutAct_9fa48("122") ? [] : (stryCov_9fa48("122"), [stryMutAct_9fa48("123") ? "" : (stryCov_9fa48("123"), 'input'), stryMutAct_9fa48("124") ? "" : (stryCov_9fa48("124"), 'context'), stryMutAct_9fa48("125") ? "" : (stryCov_9fa48("125"), 'flow'), stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), 'component'), stryMutAct_9fa48("127") ? "" : (stryCov_9fa48("127"), 'prototype')]);
          const idx = phaseOrder.indexOf(phase);
          if (stryMutAct_9fa48("131") ? idx >= phaseOrder.length - 1 : stryMutAct_9fa48("130") ? idx <= phaseOrder.length - 1 : stryMutAct_9fa48("129") ? false : stryMutAct_9fa48("128") ? true : (stryCov_9fa48("128", "129", "130", "131"), idx < (stryMutAct_9fa48("132") ? phaseOrder.length + 1 : (stryCov_9fa48("132"), phaseOrder.length - 1)))) {
            if (stryMutAct_9fa48("133")) {
              {}
            } else {
              stryCov_9fa48("133");
              set(stryMutAct_9fa48("134") ? {} : (stryCov_9fa48("134"), {
                phase: phaseOrder[stryMutAct_9fa48("135") ? idx - 1 : (stryCov_9fa48("135"), idx + 1)]
              }));
              get().recomputeActiveTree();
            }
          }
        }
      },
      setActiveTree: stryMutAct_9fa48("136") ? () => undefined : (stryCov_9fa48("136"), activeTree => set(stryMutAct_9fa48("137") ? () => undefined : (stryCov_9fa48("137"), s => stryMutAct_9fa48("138") ? {} : (stryCov_9fa48("138"), {
        activeTree,
        _prevActiveTree: s.activeTree
      })))),
      // === Panel Actions ===
      toggleContextPanel: stryMutAct_9fa48("139") ? () => undefined : (stryCov_9fa48("139"), () => set(stryMutAct_9fa48("140") ? () => undefined : (stryCov_9fa48("140"), s => stryMutAct_9fa48("141") ? {} : (stryCov_9fa48("141"), {
        contextPanelCollapsed: stryMutAct_9fa48("142") ? s.contextPanelCollapsed : (stryCov_9fa48("142"), !s.contextPanelCollapsed)
      })))),
      toggleFlowPanel: stryMutAct_9fa48("143") ? () => undefined : (stryCov_9fa48("143"), () => set(stryMutAct_9fa48("144") ? () => undefined : (stryCov_9fa48("144"), s => stryMutAct_9fa48("145") ? {} : (stryCov_9fa48("145"), {
        flowPanelCollapsed: stryMutAct_9fa48("146") ? s.flowPanelCollapsed : (stryCov_9fa48("146"), !s.flowPanelCollapsed)
      })))),
      toggleComponentPanel: stryMutAct_9fa48("147") ? () => undefined : (stryCov_9fa48("147"), () => set(stryMutAct_9fa48("148") ? () => undefined : (stryCov_9fa48("148"), s => stryMutAct_9fa48("149") ? {} : (stryCov_9fa48("149"), {
        componentPanelCollapsed: stryMutAct_9fa48("150") ? s.componentPanelCollapsed : (stryCov_9fa48("150"), !s.componentPanelCollapsed)
      })))),
      // === Left/Right Persistent Drawer Actions (Epic 1 S1.1) ===
      toggleLeftDrawer: stryMutAct_9fa48("151") ? () => undefined : (stryCov_9fa48("151"), () => set(stryMutAct_9fa48("152") ? () => undefined : (stryCov_9fa48("152"), s => stryMutAct_9fa48("153") ? {} : (stryCov_9fa48("153"), {
        leftDrawerOpen: stryMutAct_9fa48("154") ? s.leftDrawerOpen : (stryCov_9fa48("154"), !s.leftDrawerOpen)
      })))),
      toggleRightDrawer: stryMutAct_9fa48("155") ? () => undefined : (stryCov_9fa48("155"), () => set(stryMutAct_9fa48("156") ? () => undefined : (stryCov_9fa48("156"), s => stryMutAct_9fa48("157") ? {} : (stryCov_9fa48("157"), {
        rightDrawerOpen: stryMutAct_9fa48("158") ? s.rightDrawerOpen : (stryCov_9fa48("158"), !s.rightDrawerOpen)
      })))),
      // [E2] 打开右侧抽屉
      openRightDrawer: stryMutAct_9fa48("159") ? () => undefined : (stryCov_9fa48("159"), () => set(stryMutAct_9fa48("160") ? {} : (stryCov_9fa48("160"), {
        rightDrawerOpen: stryMutAct_9fa48("161") ? false : (stryCov_9fa48("161"), true)
      }))),
      // [E2] 提交画布 — 触发 /submit 命令事件
      submitCanvas: () => {
        if (stryMutAct_9fa48("162")) {
          {}
        } else {
          stryCov_9fa48("162");
          console.log(stryMutAct_9fa48("163") ? "" : (stryCov_9fa48("163"), '[Command] /submit triggered'));
        }
      },
      setLeftDrawerWidth: stryMutAct_9fa48("164") ? () => undefined : (stryCov_9fa48("164"), (width: number) => set(stryMutAct_9fa48("165") ? {} : (stryCov_9fa48("165"), {
        leftDrawerWidth: stryMutAct_9fa48("166") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("166"), Math.min(400, stryMutAct_9fa48("167") ? Math.min(100, width) : (stryCov_9fa48("167"), Math.max(100, width))))
      }))),
      setRightDrawerWidth: stryMutAct_9fa48("168") ? () => undefined : (stryCov_9fa48("168"), (width: number) => set(stryMutAct_9fa48("169") ? {} : (stryCov_9fa48("169"), {
        rightDrawerWidth: stryMutAct_9fa48("170") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("170"), Math.min(400, stryMutAct_9fa48("171") ? Math.min(100, width) : (stryCov_9fa48("171"), Math.max(100, width))))
      }))),
      // === Epic 6: Message Slice Actions ===
      addMessage: stryMutAct_9fa48("172") ? () => undefined : (stryCov_9fa48("172"), (msg: Omit<MessageItem, 'id' | 'timestamp'>) => set(stryMutAct_9fa48("173") ? () => undefined : (stryCov_9fa48("173"), s => stryMutAct_9fa48("174") ? {} : (stryCov_9fa48("174"), {
        messages: stryMutAct_9fa48("175") ? [] : (stryCov_9fa48("175"), [...s.messages, stryMutAct_9fa48("176") ? {} : (stryCov_9fa48("176"), {
          ...msg,
          id: newMessageId(),
          timestamp: Date.now()
        })])
      })))),
      clearMessages: stryMutAct_9fa48("177") ? () => undefined : (stryCov_9fa48("177"), () => set(stryMutAct_9fa48("178") ? {} : (stryCov_9fa48("178"), {
        messages: stryMutAct_9fa48("179") ? ["Stryker was here"] : (stryCov_9fa48("179"), [])
      }))),
      // === SSE Status Actions (Epic 1 S1.3) ===
      setSseStatus: stryMutAct_9fa48("180") ? () => undefined : (stryCov_9fa48("180"), (status, error) => set(stryMutAct_9fa48("181") ? {} : (stryCov_9fa48("181"), {
        sseStatus: status,
        sseError: stryMutAct_9fa48("182") ? error && null : (stryCov_9fa48("182"), error ?? null)
      }))),
      abortGeneration: () => {
        if (stryMutAct_9fa48("183")) {
          {}
        } else {
          stryCov_9fa48("183");
          const {
            abortControllerRef
          } = get();
          if (stryMutAct_9fa48("185") ? false : stryMutAct_9fa48("184") ? true : (stryCov_9fa48("184", "185"), abortControllerRef)) {
            if (stryMutAct_9fa48("186")) {
              {}
            } else {
              stryCov_9fa48("186");
              abortControllerRef.abort();
              set(stryMutAct_9fa48("187") ? {} : (stryCov_9fa48("187"), {
                abortControllerRef: null,
                sseStatus: stryMutAct_9fa48("188") ? "" : (stryCov_9fa48("188"), 'idle'),
                flowGenerating: stryMutAct_9fa48("189") ? true : (stryCov_9fa48("189"), false),
                aiThinking: stryMutAct_9fa48("190") ? true : (stryCov_9fa48("190"), false)
              }));
            }
          }
        }
      },
      // === Expand Slice (E2) ===
      leftExpand: stryMutAct_9fa48("191") ? "" : (stryCov_9fa48("191"), 'default'),
      centerExpand: stryMutAct_9fa48("192") ? "" : (stryCov_9fa48("192"), 'default'),
      rightExpand: stryMutAct_9fa48("193") ? "" : (stryCov_9fa48("193"), 'default'),
      getGridTemplate: () => {
        if (stryMutAct_9fa48("194")) {
          {}
        } else {
          stryCov_9fa48("194");
          // F1.4: Old 1.5fr logic removed — always 1fr for three-column layout
          return stryMutAct_9fa48("195") ? "" : (stryCov_9fa48("195"), '1fr 1fr 1fr');
        }
      },
      setLeftExpand: stryMutAct_9fa48("196") ? () => undefined : (stryCov_9fa48("196"), state => set(stryMutAct_9fa48("197") ? {} : (stryCov_9fa48("197"), {
        leftExpand: state
      }))),
      setCenterExpand: stryMutAct_9fa48("198") ? () => undefined : (stryCov_9fa48("198"), state => set(stryMutAct_9fa48("199") ? {} : (stryCov_9fa48("199"), {
        centerExpand: state
      }))),
      setRightExpand: stryMutAct_9fa48("200") ? () => undefined : (stryCov_9fa48("200"), state => set(stryMutAct_9fa48("201") ? {} : (stryCov_9fa48("201"), {
        rightExpand: state
      }))),
      togglePanel: panel => {
        if (stryMutAct_9fa48("202")) {
          {}
        } else {
          stryCov_9fa48("202");
          if (stryMutAct_9fa48("205") ? panel !== 'left' : stryMutAct_9fa48("204") ? false : stryMutAct_9fa48("203") ? true : (stryCov_9fa48("203", "204", "205"), panel === (stryMutAct_9fa48("206") ? "" : (stryCov_9fa48("206"), 'left')))) {
            if (stryMutAct_9fa48("207")) {
              {}
            } else {
              stryCov_9fa48("207");
              const {
                leftExpand
              } = get();
              const next = (stryMutAct_9fa48("210") ? leftExpand !== 'default' : stryMutAct_9fa48("209") ? false : stryMutAct_9fa48("208") ? true : (stryCov_9fa48("208", "209", "210"), leftExpand === (stryMutAct_9fa48("211") ? "" : (stryCov_9fa48("211"), 'default')))) ? stryMutAct_9fa48("212") ? "" : (stryCov_9fa48("212"), 'expand-right') : (stryMutAct_9fa48("215") ? leftExpand !== 'expand-right' : stryMutAct_9fa48("214") ? false : stryMutAct_9fa48("213") ? true : (stryCov_9fa48("213", "214", "215"), leftExpand === (stryMutAct_9fa48("216") ? "" : (stryCov_9fa48("216"), 'expand-right')))) ? stryMutAct_9fa48("217") ? "" : (stryCov_9fa48("217"), 'default') : leftExpand;
              set(stryMutAct_9fa48("218") ? {} : (stryCov_9fa48("218"), {
                leftExpand: next as PanelExpandState
              }));
            }
          } else if (stryMutAct_9fa48("221") ? panel !== 'center' : stryMutAct_9fa48("220") ? false : stryMutAct_9fa48("219") ? true : (stryCov_9fa48("219", "220", "221"), panel === (stryMutAct_9fa48("222") ? "" : (stryCov_9fa48("222"), 'center')))) {
            if (stryMutAct_9fa48("223")) {
              {}
            } else {
              stryCov_9fa48("223");
              const {
                centerExpand
              } = get();
              // 循环: default → expand-left → expand-right → default
              const next = (stryMutAct_9fa48("226") ? centerExpand !== 'default' : stryMutAct_9fa48("225") ? false : stryMutAct_9fa48("224") ? true : (stryCov_9fa48("224", "225", "226"), centerExpand === (stryMutAct_9fa48("227") ? "" : (stryCov_9fa48("227"), 'default')))) ? stryMutAct_9fa48("228") ? "" : (stryCov_9fa48("228"), 'expand-left') : (stryMutAct_9fa48("231") ? centerExpand !== 'expand-left' : stryMutAct_9fa48("230") ? false : stryMutAct_9fa48("229") ? true : (stryCov_9fa48("229", "230", "231"), centerExpand === (stryMutAct_9fa48("232") ? "" : (stryCov_9fa48("232"), 'expand-left')))) ? stryMutAct_9fa48("233") ? "" : (stryCov_9fa48("233"), 'expand-right') : (stryMutAct_9fa48("236") ? centerExpand !== 'expand-right' : stryMutAct_9fa48("235") ? false : stryMutAct_9fa48("234") ? true : (stryCov_9fa48("234", "235", "236"), centerExpand === (stryMutAct_9fa48("237") ? "" : (stryCov_9fa48("237"), 'expand-right')))) ? stryMutAct_9fa48("238") ? "" : (stryCov_9fa48("238"), 'default') : stryMutAct_9fa48("239") ? "" : (stryCov_9fa48("239"), 'default');
              set(stryMutAct_9fa48("240") ? {} : (stryCov_9fa48("240"), {
                centerExpand: next as PanelExpandState
              }));
            }
          } else {
            if (stryMutAct_9fa48("241")) {
              {}
            } else {
              stryCov_9fa48("241");
              const {
                rightExpand
              } = get();
              const next = (stryMutAct_9fa48("244") ? rightExpand !== 'default' : stryMutAct_9fa48("243") ? false : stryMutAct_9fa48("242") ? true : (stryCov_9fa48("242", "243", "244"), rightExpand === (stryMutAct_9fa48("245") ? "" : (stryCov_9fa48("245"), 'default')))) ? stryMutAct_9fa48("246") ? "" : (stryCov_9fa48("246"), 'expand-left') : (stryMutAct_9fa48("249") ? rightExpand !== 'expand-left' : stryMutAct_9fa48("248") ? false : stryMutAct_9fa48("247") ? true : (stryCov_9fa48("247", "248", "249"), rightExpand === (stryMutAct_9fa48("250") ? "" : (stryCov_9fa48("250"), 'expand-left')))) ? stryMutAct_9fa48("251") ? "" : (stryCov_9fa48("251"), 'default') : rightExpand;
              set(stryMutAct_9fa48("252") ? {} : (stryCov_9fa48("252"), {
                rightExpand: next as PanelExpandState
              }));
            }
          }
        }
      },
      resetExpand: stryMutAct_9fa48("253") ? () => undefined : (stryCov_9fa48("253"), () => set(stryMutAct_9fa48("254") ? {} : (stryCov_9fa48("254"), {
        leftExpand: stryMutAct_9fa48("255") ? "" : (stryCov_9fa48("255"), 'default'),
        centerExpand: stryMutAct_9fa48("256") ? "" : (stryCov_9fa48("256"), 'default'),
        rightExpand: stryMutAct_9fa48("257") ? "" : (stryCov_9fa48("257"), 'default'),
        expandMode: stryMutAct_9fa48("258") ? "" : (stryCov_9fa48("258"), 'normal')
      }))),
      // === F1: New expand mode ===
      expandMode: stryMutAct_9fa48("259") ? "" : (stryCov_9fa48("259"), 'normal'),
      setExpandMode: mode => {
        if (stryMutAct_9fa48("260")) {
          {}
        } else {
          stryCov_9fa48("260");
          set(stryMutAct_9fa48("261") ? {} : (stryCov_9fa48("261"), {
            expandMode: mode
          }));
          // Persist to localStorage
          try {
            if (stryMutAct_9fa48("262")) {
              {}
            } else {
              stryCov_9fa48("262");
              localStorage.setItem(stryMutAct_9fa48("263") ? "" : (stryCov_9fa48("263"), 'canvas-expand-mode'), mode);
            }
          } catch {
            // ignore quota errors
          }
        }
      },
      toggleMaximize: () => {
        if (stryMutAct_9fa48("264")) {
          {}
        } else {
          stryCov_9fa48("264");
          const next = (stryMutAct_9fa48("267") ? get().expandMode !== 'maximize' : stryMutAct_9fa48("266") ? false : stryMutAct_9fa48("265") ? true : (stryCov_9fa48("265", "266", "267"), get().expandMode === (stryMutAct_9fa48("268") ? "" : (stryCov_9fa48("268"), 'maximize')))) ? stryMutAct_9fa48("269") ? "" : (stryCov_9fa48("269"), 'normal') : stryMutAct_9fa48("270") ? "" : (stryCov_9fa48("270"), 'maximize');
          set(stryMutAct_9fa48("271") ? {} : (stryCov_9fa48("271"), {
            expandMode: next
          }));
          try {
            if (stryMutAct_9fa48("272")) {
              {}
            } else {
              stryCov_9fa48("272");
              localStorage.setItem(stryMutAct_9fa48("273") ? "" : (stryCov_9fa48("273"), 'canvas-expand-mode'), next);
            }
          } catch {
            // ignore
          }
        }
      },
      // === Context Slice Actions ===
      setContextNodes: nodes => {
        if (stryMutAct_9fa48("274")) {
          {}
        } else {
          stryCov_9fa48("274");
          set(stryMutAct_9fa48("275") ? {} : (stryCov_9fa48("275"), {
            contextNodes: nodes
          }));
          useContextStore.getState().setContextNodes(nodes);
        }
      },
      addContextNode: data => {
        if (stryMutAct_9fa48("276")) {
          {}
        } else {
          stryCov_9fa48("276");
          const newNode: BoundedContextNode = stryMutAct_9fa48("277") ? {} : (stryCov_9fa48("277"), {
            nodeId: generateId(),
            name: data.name,
            description: data.description,
            type: data.type,
            isActive: stryMutAct_9fa48("278") ? true : (stryCov_9fa48("278"), false),
            status: stryMutAct_9fa48("279") ? "" : (stryCov_9fa48("279"), 'pending'),
            children: stryMutAct_9fa48("280") ? ["Stryker was here"] : (stryCov_9fa48("280"), [])
          });
          set(s => {
            if (stryMutAct_9fa48("281")) {
              {}
            } else {
              stryCov_9fa48("281");
              const newNodes = stryMutAct_9fa48("282") ? [] : (stryCov_9fa48("282"), [...s.contextNodes, stryMutAct_9fa48("283") ? {} : (stryCov_9fa48("283"), {
                ...newNode
              })]);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("284") ? "" : (stryCov_9fa48("284"), 'context'), newNodes);
              return stryMutAct_9fa48("285") ? {} : (stryCov_9fa48("285"), {
                contextNodes: newNodes
              });
            }
          });
          useContextStore.getState().addContextNode(data);
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("286") ? {} : (stryCov_9fa48("286"), {
            type: stryMutAct_9fa48("287") ? "" : (stryCov_9fa48("287"), 'user_action'),
            content: stryMutAct_9fa48("288") ? `` : (stryCov_9fa48("288"), `添加了上下文节点`),
            meta: data.name
          }));
        }
      },
      editContextNode: (nodeId, data) => {
        if (stryMutAct_9fa48("289")) {
          {}
        } else {
          stryCov_9fa48("289");
          set(s => {
            if (stryMutAct_9fa48("290")) {
              {}
            } else {
              stryCov_9fa48("290");
              const newNodes = s.contextNodes.map(stryMutAct_9fa48("291") ? () => undefined : (stryCov_9fa48("291"), n => (stryMutAct_9fa48("294") ? n.nodeId !== nodeId : stryMutAct_9fa48("293") ? false : stryMutAct_9fa48("292") ? true : (stryCov_9fa48("292", "293", "294"), n.nodeId === nodeId)) ? stryMutAct_9fa48("295") ? {} : (stryCov_9fa48("295"), {
                ...n,
                ...data,
                status: 'pending' as const
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("296") ? "" : (stryCov_9fa48("296"), 'context'), newNodes);
              return stryMutAct_9fa48("297") ? {} : (stryCov_9fa48("297"), {
                contextNodes: newNodes
              });
            }
          });
          useContextStore.getState().editContextNode(nodeId, data);
        }
      },
      deleteContextNode: nodeId => {
        if (stryMutAct_9fa48("298")) {
          {}
        } else {
          stryCov_9fa48("298");
          const nodeToDelete = get().contextNodes.find(stryMutAct_9fa48("299") ? () => undefined : (stryCov_9fa48("299"), n => stryMutAct_9fa48("302") ? n.nodeId !== nodeId : stryMutAct_9fa48("301") ? false : stryMutAct_9fa48("300") ? true : (stryCov_9fa48("300", "301", "302"), n.nodeId === nodeId)));
          const deletedName = stryMutAct_9fa48("303") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("303"), (stryMutAct_9fa48("304") ? nodeToDelete.name : (stryCov_9fa48("304"), nodeToDelete?.name)) ?? nodeId);
          set(s => {
            if (stryMutAct_9fa48("305")) {
              {}
            } else {
              stryCov_9fa48("305");
              const newNodes = stryMutAct_9fa48("306") ? s.contextNodes : (stryCov_9fa48("306"), s.contextNodes.filter(stryMutAct_9fa48("307") ? () => undefined : (stryCov_9fa48("307"), n => stryMutAct_9fa48("310") ? n.nodeId === nodeId : stryMutAct_9fa48("309") ? false : stryMutAct_9fa48("308") ? true : (stryCov_9fa48("308", "309", "310"), n.nodeId !== nodeId))));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("311") ? "" : (stryCov_9fa48("311"), 'context'), newNodes);
              return stryMutAct_9fa48("312") ? {} : (stryCov_9fa48("312"), {
                contextNodes: newNodes
              });
            }
          });
          useContextStore.getState().deleteContextNode(nodeId);
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("313") ? {} : (stryCov_9fa48("313"), {
            type: stryMutAct_9fa48("314") ? "" : (stryCov_9fa48("314"), 'user_action'),
            content: stryMutAct_9fa48("315") ? `` : (stryCov_9fa48("315"), `删除了上下文节点`),
            meta: deletedName
          }));
        }
      },
      confirmContextNode: nodeId => {
        if (stryMutAct_9fa48("316")) {
          {}
        } else {
          stryCov_9fa48("316");
          set(s => {
            if (stryMutAct_9fa48("317")) {
              {}
            } else {
              stryCov_9fa48("317");
              const newNodes = s.contextNodes.map(stryMutAct_9fa48("318") ? () => undefined : (stryCov_9fa48("318"), n => (stryMutAct_9fa48("321") ? n.nodeId !== nodeId : stryMutAct_9fa48("320") ? false : stryMutAct_9fa48("319") ? true : (stryCov_9fa48("319", "320", "321"), n.nodeId === nodeId)) ? stryMutAct_9fa48("322") ? {} : (stryCov_9fa48("322"), {
                ...n,
                isActive: stryMutAct_9fa48("323") ? false : (stryCov_9fa48("323"), true),
                status: 'confirmed' as const
              }) : n));
              return stryMutAct_9fa48("324") ? {} : (stryCov_9fa48("324"), {
                contextNodes: newNodes
              });
            }
          });
          useContextStore.getState().confirmContextNode(nodeId);
        }
      },
      toggleContextNode: nodeId => {
        if (stryMutAct_9fa48("325")) {
          {}
        } else {
          stryCov_9fa48("325");
          set(s => {
            if (stryMutAct_9fa48("326")) {
              {}
            } else {
              stryCov_9fa48("326");
              const node = s.contextNodes.find(stryMutAct_9fa48("327") ? () => undefined : (stryCov_9fa48("327"), n => stryMutAct_9fa48("330") ? n.nodeId !== nodeId : stryMutAct_9fa48("329") ? false : stryMutAct_9fa48("328") ? true : (stryCov_9fa48("328", "329", "330"), n.nodeId === nodeId)));
              if (stryMutAct_9fa48("333") ? false : stryMutAct_9fa48("332") ? true : stryMutAct_9fa48("331") ? node : (stryCov_9fa48("331", "332", "333"), !node)) return {};
              const isConfirmed = stryMutAct_9fa48("336") ? node.status !== 'confirmed' : stryMutAct_9fa48("335") ? false : stryMutAct_9fa48("334") ? true : (stryCov_9fa48("334", "335", "336"), node.status === (stryMutAct_9fa48("337") ? "" : (stryCov_9fa48("337"), 'confirmed')));
              const newNodes = s.contextNodes.map(stryMutAct_9fa48("338") ? () => undefined : (stryCov_9fa48("338"), n => (stryMutAct_9fa48("341") ? n.nodeId !== nodeId : stryMutAct_9fa48("340") ? false : stryMutAct_9fa48("339") ? true : (stryCov_9fa48("339", "340", "341"), n.nodeId === nodeId)) ? stryMutAct_9fa48("342") ? {} : (stryCov_9fa48("342"), {
                ...n,
                isActive: isConfirmed ? stryMutAct_9fa48("343") ? true : (stryCov_9fa48("343"), false) : stryMutAct_9fa48("344") ? false : (stryCov_9fa48("344"), true),
                status: isConfirmed ? 'pending' as const : 'confirmed' as const
              }) : n));
              return stryMutAct_9fa48("345") ? {} : (stryCov_9fa48("345"), {
                contextNodes: newNodes
              });
            }
          });
        }
      },
      setContextDraft: draft => {
        if (stryMutAct_9fa48("346")) {
          {}
        } else {
          stryCov_9fa48("346");
          set(stryMutAct_9fa48("347") ? {} : (stryCov_9fa48("347"), {
            contextDraft: draft
          }));
          useContextStore.getState().setContextDraft(draft);
        }
      },
      // === Flow Slice Actions ===
      setFlowNodes: stryMutAct_9fa48("348") ? () => undefined : (stryCov_9fa48("348"), nodes => set(stryMutAct_9fa48("349") ? {} : (stryCov_9fa48("349"), {
        flowNodes: nodes
      }))),
      addFlowNode: data => {
        if (stryMutAct_9fa48("350")) {
          {}
        } else {
          stryCov_9fa48("350");
          const newNode: BusinessFlowNode = stryMutAct_9fa48("351") ? {} : (stryCov_9fa48("351"), {
            nodeId: generateId(),
            contextId: data.contextId,
            name: data.name,
            steps: data.steps.map(stryMutAct_9fa48("352") ? () => undefined : (stryCov_9fa48("352"), (s, i) => stryMutAct_9fa48("353") ? {} : (stryCov_9fa48("353"), {
              ...s,
              stepId: generateId(),
              status: 'pending' as const,
              isActive: stryMutAct_9fa48("354") ? true : (stryCov_9fa48("354"), false),
              order: i
            }))),
            isActive: stryMutAct_9fa48("355") ? true : (stryCov_9fa48("355"), false),
            status: stryMutAct_9fa48("356") ? "" : (stryCov_9fa48("356"), 'pending'),
            children: stryMutAct_9fa48("357") ? ["Stryker was here"] : (stryCov_9fa48("357"), [])
          });
          set(s => {
            if (stryMutAct_9fa48("358")) {
              {}
            } else {
              stryCov_9fa48("358");
              const newNodes = stryMutAct_9fa48("359") ? [] : (stryCov_9fa48("359"), [...s.flowNodes, newNode]);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("360") ? "" : (stryCov_9fa48("360"), 'flow'), newNodes);
              return stryMutAct_9fa48("361") ? {} : (stryCov_9fa48("361"), {
                flowNodes: newNodes
              });
            }
          });
          // Epic 4: auto-append user_action message
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("362") ? {} : (stryCov_9fa48("362"), {
            type: stryMutAct_9fa48("363") ? "" : (stryCov_9fa48("363"), 'user_action'),
            content: stryMutAct_9fa48("364") ? `` : (stryCov_9fa48("364"), `添加了流程节点`),
            meta: data.name
          }));
        }
      },
      editFlowNode: (nodeId, data) => {
        if (stryMutAct_9fa48("365")) {
          {}
        } else {
          stryCov_9fa48("365");
          set(s => {
            if (stryMutAct_9fa48("366")) {
              {}
            } else {
              stryCov_9fa48("366");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("367") ? () => undefined : (stryCov_9fa48("367"), n => (stryMutAct_9fa48("370") ? n.nodeId !== nodeId : stryMutAct_9fa48("369") ? false : stryMutAct_9fa48("368") ? true : (stryCov_9fa48("368", "369", "370"), n.nodeId === nodeId)) ? stryMutAct_9fa48("371") ? {} : (stryCov_9fa48("371"), {
                ...n,
                ...data,
                status: 'pending' as const
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("372") ? "" : (stryCov_9fa48("372"), 'flow'), newNodes);
              return stryMutAct_9fa48("373") ? {} : (stryCov_9fa48("373"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      // [E1] 确认流程节点
      confirmFlowNode: nodeId => {
        if (stryMutAct_9fa48("374")) {
          {}
        } else {
          stryCov_9fa48("374");
          set(s => {
            if (stryMutAct_9fa48("375")) {
              {}
            } else {
              stryCov_9fa48("375");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("376") ? () => undefined : (stryCov_9fa48("376"), n => (stryMutAct_9fa48("379") ? n.nodeId !== nodeId : stryMutAct_9fa48("378") ? false : stryMutAct_9fa48("377") ? true : (stryCov_9fa48("377", "378", "379"), n.nodeId === nodeId)) ? stryMutAct_9fa48("380") ? {} : (stryCov_9fa48("380"), {
                ...n,
                isActive: stryMutAct_9fa48("381") ? false : (stryCov_9fa48("381"), true),
                status: 'confirmed' as const
              }) : n));
              return stryMutAct_9fa48("382") ? {} : (stryCov_9fa48("382"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      // [E1] 切换流程节点确认状态
      toggleFlowNode: nodeId => {
        if (stryMutAct_9fa48("383")) {
          {}
        } else {
          stryCov_9fa48("383");
          set(s => {
            if (stryMutAct_9fa48("384")) {
              {}
            } else {
              stryCov_9fa48("384");
              const newNodes = s.flowNodes.map(n => {
                if (stryMutAct_9fa48("385")) {
                  {}
                } else {
                  stryCov_9fa48("385");
                  if (stryMutAct_9fa48("388") ? n.nodeId === nodeId : stryMutAct_9fa48("387") ? false : stryMutAct_9fa48("386") ? true : (stryCov_9fa48("386", "387", "388"), n.nodeId !== nodeId)) return n;
                  const isConfirmed = stryMutAct_9fa48("391") ? n.status !== 'confirmed' : stryMutAct_9fa48("390") ? false : stryMutAct_9fa48("389") ? true : (stryCov_9fa48("389", "390", "391"), n.status === (stryMutAct_9fa48("392") ? "" : (stryCov_9fa48("392"), 'confirmed')));
                  return stryMutAct_9fa48("393") ? {} : (stryCov_9fa48("393"), {
                    ...n,
                    isActive: stryMutAct_9fa48("394") ? isConfirmed : (stryCov_9fa48("394"), !isConfirmed),
                    status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                  });
                }
              });
              return stryMutAct_9fa48("395") ? {} : (stryCov_9fa48("395"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      // [E1] 确认步骤 — 在流程节点内设置指定 stepId 的步骤为 confirmed
      confirmStep: (flowNodeId, stepId) => {
        if (stryMutAct_9fa48("396")) {
          {}
        } else {
          stryCov_9fa48("396");
          set(s => {
            if (stryMutAct_9fa48("397")) {
              {}
            } else {
              stryCov_9fa48("397");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("398") ? () => undefined : (stryCov_9fa48("398"), n => (stryMutAct_9fa48("401") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("400") ? false : stryMutAct_9fa48("399") ? true : (stryCov_9fa48("399", "400", "401"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("402") ? {} : (stryCov_9fa48("402"), {
                ...n,
                steps: n.steps.map(stryMutAct_9fa48("403") ? () => undefined : (stryCov_9fa48("403"), step => (stryMutAct_9fa48("406") ? step.stepId !== stepId : stryMutAct_9fa48("405") ? false : stryMutAct_9fa48("404") ? true : (stryCov_9fa48("404", "405", "406"), step.stepId === stepId)) ? stryMutAct_9fa48("407") ? {} : (stryCov_9fa48("407"), {
                  ...step,
                  isActive: stryMutAct_9fa48("408") ? false : (stryCov_9fa48("408"), true),
                  status: 'confirmed' as const
                }) : step))
              }) : n));
              return stryMutAct_9fa48("409") ? {} : (stryCov_9fa48("409"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      deleteFlowNode: nodeId => {
        if (stryMutAct_9fa48("410")) {
          {}
        } else {
          stryCov_9fa48("410");
          const nodeToDelete = get().flowNodes.find(stryMutAct_9fa48("411") ? () => undefined : (stryCov_9fa48("411"), n => stryMutAct_9fa48("414") ? n.nodeId !== nodeId : stryMutAct_9fa48("413") ? false : stryMutAct_9fa48("412") ? true : (stryCov_9fa48("412", "413", "414"), n.nodeId === nodeId)));
          const deletedName = stryMutAct_9fa48("415") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("415"), (stryMutAct_9fa48("416") ? nodeToDelete.name : (stryCov_9fa48("416"), nodeToDelete?.name)) ?? nodeId);
          set(s => {
            if (stryMutAct_9fa48("417")) {
              {}
            } else {
              stryCov_9fa48("417");
              const newNodes = stryMutAct_9fa48("418") ? s.flowNodes : (stryCov_9fa48("418"), s.flowNodes.filter(stryMutAct_9fa48("419") ? () => undefined : (stryCov_9fa48("419"), n => stryMutAct_9fa48("422") ? n.nodeId === nodeId : stryMutAct_9fa48("421") ? false : stryMutAct_9fa48("420") ? true : (stryCov_9fa48("420", "421", "422"), n.nodeId !== nodeId))));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("423") ? "" : (stryCov_9fa48("423"), 'flow'), newNodes);
              return stryMutAct_9fa48("424") ? {} : (stryCov_9fa48("424"), {
                flowNodes: newNodes
              });
            }
          });
          // Epic 4: auto-append user_action message
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("425") ? {} : (stryCov_9fa48("425"), {
            type: stryMutAct_9fa48("426") ? "" : (stryCov_9fa48("426"), 'user_action'),
            content: stryMutAct_9fa48("427") ? `` : (stryCov_9fa48("427"), `删除了流程节点`),
            meta: deletedName
          }));
        }
      },
      setFlowDraft: stryMutAct_9fa48("428") ? () => undefined : (stryCov_9fa48("428"), draft => set(stryMutAct_9fa48("429") ? {} : (stryCov_9fa48("429"), {
        flowDraft: draft
      }))),
      // === Step Actions (Epic 3) ===
      addStepToFlow: (flowNodeId, data) => {
        if (stryMutAct_9fa48("430")) {
          {}
        } else {
          stryCov_9fa48("430");
          set(s => {
            if (stryMutAct_9fa48("431")) {
              {}
            } else {
              stryCov_9fa48("431");
              const newNodes = s.flowNodes.map(n => {
                if (stryMutAct_9fa48("432")) {
                  {}
                } else {
                  stryCov_9fa48("432");
                  if (stryMutAct_9fa48("435") ? n.nodeId === flowNodeId : stryMutAct_9fa48("434") ? false : stryMutAct_9fa48("433") ? true : (stryCov_9fa48("433", "434", "435"), n.nodeId !== flowNodeId)) return n;
                  const newStep: FlowStep = stryMutAct_9fa48("436") ? {} : (stryCov_9fa48("436"), {
                    stepId: generateId(),
                    name: data.name,
                    actor: stryMutAct_9fa48("437") ? data.actor && '待定' : (stryCov_9fa48("437"), data.actor ?? (stryMutAct_9fa48("438") ? "" : (stryCov_9fa48("438"), '待定'))),
                    description: stryMutAct_9fa48("439") ? data.description && '' : (stryCov_9fa48("439"), data.description ?? (stryMutAct_9fa48("440") ? "Stryker was here!" : (stryCov_9fa48("440"), ''))),
                    order: n.steps.length,
                    isActive: stryMutAct_9fa48("441") ? true : (stryCov_9fa48("441"), false),
                    status: 'pending' as const
                  });
                  return stryMutAct_9fa48("442") ? {} : (stryCov_9fa48("442"), {
                    ...n,
                    steps: stryMutAct_9fa48("443") ? [] : (stryCov_9fa48("443"), [...n.steps, newStep]),
                    status: 'pending' as const
                  });
                }
              });
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("444") ? "" : (stryCov_9fa48("444"), 'flow'), newNodes);
              return stryMutAct_9fa48("445") ? {} : (stryCov_9fa48("445"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      editStep: (flowNodeId, stepId, data) => {
        if (stryMutAct_9fa48("446")) {
          {}
        } else {
          stryCov_9fa48("446");
          set(s => {
            if (stryMutAct_9fa48("447")) {
              {}
            } else {
              stryCov_9fa48("447");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("448") ? () => undefined : (stryCov_9fa48("448"), n => (stryMutAct_9fa48("451") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("450") ? false : stryMutAct_9fa48("449") ? true : (stryCov_9fa48("449", "450", "451"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("452") ? {} : (stryCov_9fa48("452"), {
                ...n,
                status: 'pending' as const,
                steps: n.steps.map(stryMutAct_9fa48("453") ? () => undefined : (stryCov_9fa48("453"), st => (stryMutAct_9fa48("456") ? st.stepId !== stepId : stryMutAct_9fa48("455") ? false : stryMutAct_9fa48("454") ? true : (stryCov_9fa48("454", "455", "456"), st.stepId === stepId)) ? stryMutAct_9fa48("457") ? {} : (stryCov_9fa48("457"), {
                  ...st,
                  ...data,
                  status: 'pending' as const
                }) : st))
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("458") ? "" : (stryCov_9fa48("458"), 'flow'), newNodes);
              return stryMutAct_9fa48("459") ? {} : (stryCov_9fa48("459"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      deleteStep: (flowNodeId, stepId) => {
        if (stryMutAct_9fa48("460")) {
          {}
        } else {
          stryCov_9fa48("460");
          set(s => {
            if (stryMutAct_9fa48("461")) {
              {}
            } else {
              stryCov_9fa48("461");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("462") ? () => undefined : (stryCov_9fa48("462"), n => (stryMutAct_9fa48("465") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("464") ? false : stryMutAct_9fa48("463") ? true : (stryCov_9fa48("463", "464", "465"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("466") ? {} : (stryCov_9fa48("466"), {
                ...n,
                steps: stryMutAct_9fa48("467") ? n.steps : (stryCov_9fa48("467"), n.steps.filter(stryMutAct_9fa48("468") ? () => undefined : (stryCov_9fa48("468"), st => stryMutAct_9fa48("471") ? st.stepId === stepId : stryMutAct_9fa48("470") ? false : stryMutAct_9fa48("469") ? true : (stryCov_9fa48("469", "470", "471"), st.stepId !== stepId))))
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("472") ? "" : (stryCov_9fa48("472"), 'flow'), newNodes);
              return stryMutAct_9fa48("473") ? {} : (stryCov_9fa48("473"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      reorderSteps: (flowNodeId, fromIndex, toIndex) => {
        if (stryMutAct_9fa48("474")) {
          {}
        } else {
          stryCov_9fa48("474");
          set(s => {
            if (stryMutAct_9fa48("475")) {
              {}
            } else {
              stryCov_9fa48("475");
              const newNodes = s.flowNodes.map(n => {
                if (stryMutAct_9fa48("476")) {
                  {}
                } else {
                  stryCov_9fa48("476");
                  if (stryMutAct_9fa48("479") ? n.nodeId === flowNodeId : stryMutAct_9fa48("478") ? false : stryMutAct_9fa48("477") ? true : (stryCov_9fa48("477", "478", "479"), n.nodeId !== flowNodeId)) return n;
                  const steps = stryMutAct_9fa48("480") ? [] : (stryCov_9fa48("480"), [...n.steps]);
                  const [moved] = steps.splice(fromIndex, 1);
                  const insertAt = (stryMutAct_9fa48("484") ? fromIndex >= toIndex : stryMutAct_9fa48("483") ? fromIndex <= toIndex : stryMutAct_9fa48("482") ? false : stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481", "482", "483", "484"), fromIndex < toIndex)) ? stryMutAct_9fa48("485") ? toIndex + 1 : (stryCov_9fa48("485"), toIndex - 1) : toIndex;
                  steps.splice(insertAt, 0, moved);
                  return stryMutAct_9fa48("486") ? {} : (stryCov_9fa48("486"), {
                    ...n,
                    steps: steps.map(stryMutAct_9fa48("487") ? () => undefined : (stryCov_9fa48("487"), (st, i) => stryMutAct_9fa48("488") ? {} : (stryCov_9fa48("488"), {
                      ...st,
                      order: i
                    }))),
                    status: 'pending' as const
                  });
                }
              });
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("489") ? "" : (stryCov_9fa48("489"), 'flow'), newNodes);
              return stryMutAct_9fa48("490") ? {} : (stryCov_9fa48("490"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      // === Auto-generation (Epic 3 S3.1) ===
      autoGenerateFlows: async contexts => {
        if (stryMutAct_9fa48("491")) {
          {}
        } else {
          stryCov_9fa48("491");
          const {
            setFlowGenerating,
            setPhase
          } = get();
          setFlowGenerating(stryMutAct_9fa48("492") ? false : (stryCov_9fa48("492"), true), stryMutAct_9fa48("493") ? "" : (stryCov_9fa48("493"), '正在生成流程树...'));
          try {
            if (stryMutAct_9fa48("494")) {
              {}
            } else {
              stryCov_9fa48("494");
              const {
                projectId
              } = get();
              const sessionId = stryMutAct_9fa48("495") ? projectId && `session-${Date.now()}` : (stryCov_9fa48("495"), projectId ?? (stryMutAct_9fa48("496") ? `` : (stryCov_9fa48("496"), `session-${Date.now()}`)));

              // Map context nodes to API format (user-edited data)
              const mappedContexts = contexts.map(stryMutAct_9fa48("497") ? () => undefined : (stryCov_9fa48("497"), ctx => stryMutAct_9fa48("498") ? {} : (stryCov_9fa48("498"), {
                id: ctx.nodeId,
                name: ctx.name,
                description: stryMutAct_9fa48("499") ? ctx.description && '' : (stryCov_9fa48("499"), ctx.description ?? (stryMutAct_9fa48("500") ? "Stryker was here!" : (stryCov_9fa48("500"), ''))),
                type: ctx.type
              })));
              const result = await canvasApi.generateFlows(stryMutAct_9fa48("501") ? {} : (stryCov_9fa48("501"), {
                contexts: mappedContexts,
                sessionId
              }));
              if (stryMutAct_9fa48("504") ? result.success && result.flows || result.flows.length > 0 : stryMutAct_9fa48("503") ? false : stryMutAct_9fa48("502") ? true : (stryCov_9fa48("502", "503", "504"), (stryMutAct_9fa48("506") ? result.success || result.flows : stryMutAct_9fa48("505") ? true : (stryCov_9fa48("505", "506"), result.success && result.flows)) && (stryMutAct_9fa48("509") ? result.flows.length <= 0 : stryMutAct_9fa48("508") ? result.flows.length >= 0 : stryMutAct_9fa48("507") ? true : (stryCov_9fa48("507", "508", "509"), result.flows.length > 0)))) {
                if (stryMutAct_9fa48("510")) {
                  {}
                } else {
                  stryCov_9fa48("510");
                  const flows: BusinessFlowNode[] = result.flows.map(stryMutAct_9fa48("511") ? () => undefined : (stryCov_9fa48("511"), f => stryMutAct_9fa48("512") ? {} : (stryCov_9fa48("512"), {
                    nodeId: generateId(),
                    contextId: f.contextId,
                    name: f.name,
                    steps: f.steps.map(stryMutAct_9fa48("513") ? () => undefined : (stryCov_9fa48("513"), (step, idx) => stryMutAct_9fa48("514") ? {} : (stryCov_9fa48("514"), {
                      stepId: generateId(),
                      name: step.name,
                      actor: step.actor,
                      description: step.description,
                      order: stryMutAct_9fa48("515") ? step.order && idx : (stryCov_9fa48("515"), step.order ?? idx),
                      isActive: stryMutAct_9fa48("516") ? true : (stryCov_9fa48("516"), false),
                      status: 'pending' as const
                    }))),
                    isActive: stryMutAct_9fa48("517") ? true : (stryCov_9fa48("517"), false),
                    status: 'pending' as const,
                    children: stryMutAct_9fa48("518") ? ["Stryker was here"] : (stryCov_9fa48("518"), [])
                  })));
                  set(stryMutAct_9fa48("519") ? {} : (stryCov_9fa48("519"), {
                    flowNodes: flows
                  }));
                  setPhase(stryMutAct_9fa48("520") ? "" : (stryCov_9fa48("520"), 'flow'));
                }
              } else {
                if (stryMutAct_9fa48("521")) {
                  {}
                } else {
                  stryCov_9fa48("521");
                  console.error(stryMutAct_9fa48("522") ? "" : (stryCov_9fa48("522"), '[canvasStore] generateFlows: API returned no flows'), result.error);
                }
              }
            }
          } catch (err) {
            if (stryMutAct_9fa48("523")) {
              {}
            } else {
              stryCov_9fa48("523");
              console.error(stryMutAct_9fa48("524") ? "" : (stryCov_9fa48("524"), '[canvasStore] autoGenerateFlows error:'), err);
            }
          } finally {
            if (stryMutAct_9fa48("525")) {
              {}
            } else {
              stryCov_9fa48("525");
              setFlowGenerating(stryMutAct_9fa48("526") ? true : (stryCov_9fa48("526"), false), null);
            }
          }
        }
      },
      // === Manual Component Generation (Epic 4) ===
      generateComponentFromFlow: async () => {
        if (stryMutAct_9fa48("527")) {
          {}
        } else {
          stryCov_9fa48("527");
          const {
            contextNodes,
            flowNodes
          } = get();
          if (stryMutAct_9fa48("530") ? flowNodes.length !== 0 : stryMutAct_9fa48("529") ? false : stryMutAct_9fa48("528") ? true : (stryCov_9fa48("528", "529", "530"), flowNodes.length === 0)) {
            if (stryMutAct_9fa48("531")) {
              {}
            } else {
              stryCov_9fa48("531");
              console.warn(stryMutAct_9fa48("532") ? "" : (stryCov_9fa48("532"), '[canvasStore] generateComponentFromFlow: no flow nodes'));
              return;
            }
          }
          try {
            if (stryMutAct_9fa48("533")) {
              {}
            } else {
              stryCov_9fa48("533");
              // E2: Only send confirmed nodes to the API
              const confirmedContexts = stryMutAct_9fa48("534") ? contextNodes : (stryCov_9fa48("534"), contextNodes.filter(stryMutAct_9fa48("535") ? () => undefined : (stryCov_9fa48("535"), ctx => stryMutAct_9fa48("538") ? ctx.status !== 'confirmed' : stryMutAct_9fa48("537") ? false : stryMutAct_9fa48("536") ? true : (stryCov_9fa48("536", "537", "538"), ctx.status === (stryMutAct_9fa48("539") ? "" : (stryCov_9fa48("539"), 'confirmed'))))));
              const confirmedFlows = stryMutAct_9fa48("540") ? flowNodes : (stryCov_9fa48("540"), flowNodes.filter(stryMutAct_9fa48("541") ? () => undefined : (stryCov_9fa48("541"), f => stryMutAct_9fa48("544") ? f.status !== 'confirmed' : stryMutAct_9fa48("543") ? false : stryMutAct_9fa48("542") ? true : (stryCov_9fa48("542", "543", "544"), f.status === (stryMutAct_9fa48("545") ? "" : (stryCov_9fa48("545"), 'confirmed'))))));
              const mappedContexts = confirmedContexts.map(stryMutAct_9fa48("546") ? () => undefined : (stryCov_9fa48("546"), ctx => stryMutAct_9fa48("547") ? {} : (stryCov_9fa48("547"), {
                id: ctx.nodeId,
                name: ctx.name,
                description: stryMutAct_9fa48("548") ? ctx.description && '' : (stryCov_9fa48("548"), ctx.description ?? (stryMutAct_9fa48("549") ? "Stryker was here!" : (stryCov_9fa48("549"), ''))),
                type: ctx.type
              })));
              const mappedFlows = confirmedFlows.map(stryMutAct_9fa48("550") ? () => undefined : (stryCov_9fa48("550"), f => stryMutAct_9fa48("551") ? {} : (stryCov_9fa48("551"), {
                name: f.name,
                contextId: f.contextId,
                steps: f.steps.map(stryMutAct_9fa48("552") ? () => undefined : (stryCov_9fa48("552"), s => stryMutAct_9fa48("553") ? {} : (stryCov_9fa48("553"), {
                  name: s.name,
                  actor: s.actor
                })))
              })));
              const {
                projectId
              } = get();
              const sessionId = stryMutAct_9fa48("554") ? projectId && `session-${Date.now()}` : (stryCov_9fa48("554"), projectId ?? (stryMutAct_9fa48("555") ? `` : (stryCov_9fa48("555"), `session-${Date.now()}`)));
              const result = await canvasApi.generateComponents(stryMutAct_9fa48("556") ? {} : (stryCov_9fa48("556"), {
                contexts: mappedContexts,
                flows: mappedFlows,
                sessionId
              }));
              if (stryMutAct_9fa48("559") ? result.success || result.components : stryMutAct_9fa48("558") ? false : stryMutAct_9fa48("557") ? true : (stryCov_9fa48("557", "558", "559"), result.success && result.components)) {
                if (stryMutAct_9fa48("560")) {
                  {}
                } else {
                  stryCov_9fa48("560");
                  // E1: Defensive parsing — validate and sanitize each component
                  const validTypes = ['page', 'form', 'list', 'detail', 'modal'] as const;
                  const validMethods = ['GET', 'POST'] as const;
                  const newNodes: ComponentNode[] = result.components.map(c => {
                    if (stryMutAct_9fa48("561")) {
                      {}
                    } else {
                      stryCov_9fa48("561");
                      const type = (stryMutAct_9fa48("564") ? c.type || validTypes.includes(c.type as typeof validTypes[number]) : stryMutAct_9fa48("563") ? false : stryMutAct_9fa48("562") ? true : (stryCov_9fa48("562", "563", "564"), c.type && validTypes.includes(c.type as typeof validTypes[number]))) ? c.type as ComponentNode['type'] : stryMutAct_9fa48("565") ? "" : (stryCov_9fa48("565"), 'page');
                      const method = (stryMutAct_9fa48("568") ? c.api?.method || validMethods.includes(c.api.method as typeof validMethods[number]) : stryMutAct_9fa48("567") ? false : stryMutAct_9fa48("566") ? true : (stryCov_9fa48("566", "567", "568"), (stryMutAct_9fa48("569") ? c.api.method : (stryCov_9fa48("569"), c.api?.method)) && validMethods.includes(c.api.method as typeof validMethods[number]))) ? c.api.method : stryMutAct_9fa48("570") ? "" : (stryCov_9fa48("570"), 'GET');
                      const flowId = (stryMutAct_9fa48("573") ? c.flowId || c.flowId !== 'unknown' : stryMutAct_9fa48("572") ? false : stryMutAct_9fa48("571") ? true : (stryCov_9fa48("571", "572", "573"), c.flowId && (stryMutAct_9fa48("575") ? c.flowId === 'unknown' : stryMutAct_9fa48("574") ? true : (stryCov_9fa48("574", "575"), c.flowId !== (stryMutAct_9fa48("576") ? "" : (stryCov_9fa48("576"), 'unknown')))))) ? c.flowId : stryMutAct_9fa48("577") ? "Stryker was here!" : (stryCov_9fa48("577"), '');
                      return {
                        nodeId: generateId(),
                        flowId,
                        name: c.name ?? '未命名组件',
                        type,
                        props: {},
                        api: {
                          method,
                          path: c.api?.path ?? '/api/' + (c.name ?? 'component').toLowerCase(),
                          params: c.api?.params ?? []
                        },
                        status: 'pending' as const,
                        children: []
                      } as ComponentNode;
                    }
                  });
                  set(stryMutAct_9fa48("578") ? {} : (stryCov_9fa48("578"), {
                    componentNodes: newNodes
                  }));
                  get().setPhase(stryMutAct_9fa48("579") ? "" : (stryCov_9fa48("579"), 'component'));
                  useCanvasStore.getState().addMessage(stryMutAct_9fa48("580") ? {} : (stryCov_9fa48("580"), {
                    type: stryMutAct_9fa48("581") ? "" : (stryCov_9fa48("581"), 'user_action'),
                    content: stryMutAct_9fa48("582") ? `` : (stryCov_9fa48("582"), `生成了 ${newNodes.length} 个组件节点`)
                  }));
                }
              } else {
                if (stryMutAct_9fa48("583")) {
                  {}
                } else {
                  stryCov_9fa48("583");
                  console.error(stryMutAct_9fa48("584") ? "" : (stryCov_9fa48("584"), '[canvasStore] generateComponentFromFlow: no components'), result.error);
                }
              }
            }
          } catch (err) {
            if (stryMutAct_9fa48("585")) {
              {}
            } else {
              stryCov_9fa48("585");
              // E2: Re-throw ZodError and other errors so React components can show toast
              console.error(stryMutAct_9fa48("586") ? "" : (stryCov_9fa48("586"), '[canvasStore] generateComponentFromFlow error:'), err);
              throw err;
            }
          }
        }
      },
      // === Example Data (F-1.2) ===
      loadExampleData: () => {
        if (stryMutAct_9fa48("587")) {
          {}
        } else {
          stryCov_9fa48("587");
          const data = exampleCanvasData as {
            contextNodes: BoundedContextNode[];
            flowNodes: BusinessFlowNode[];
            componentNodes: ComponentNode[];
          };
          set(stryMutAct_9fa48("588") ? () => undefined : (stryCov_9fa48("588"), s => stryMutAct_9fa48("589") ? {} : (stryCov_9fa48("589"), {
            contextNodes: data.contextNodes,
            flowNodes: data.flowNodes,
            componentNodes: data.componentNodes,
            phase: stryMutAct_9fa48("590") ? "" : (stryCov_9fa48("590"), 'context'),
            activeTree: stryMutAct_9fa48("591") ? "" : (stryCov_9fa48("591"), 'flow'),
            _prevActiveTree: s.activeTree
          })));
          // Initialize history for all three trees with example data
          getHistoryStore().initAllHistories(data.contextNodes, data.flowNodes, data.componentNodes);
        }
      },
      // === Component Slice Actions ===
      setComponentNodes: stryMutAct_9fa48("592") ? () => undefined : (stryCov_9fa48("592"), nodes => set(stryMutAct_9fa48("593") ? {} : (stryCov_9fa48("593"), {
        componentNodes: nodes
      }))),
      clearComponentCanvas: () => {
        if (stryMutAct_9fa48("594")) {
          {}
        } else {
          stryCov_9fa48("594");
          const nodes = get().componentNodes;
          if (stryMutAct_9fa48("597") ? nodes.length !== 0 : stryMutAct_9fa48("596") ? false : stryMutAct_9fa48("595") ? true : (stryCov_9fa48("595", "596", "597"), nodes.length === 0)) return;
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("598") ? "" : (stryCov_9fa48("598"), 'component'), nodes);
          set(stryMutAct_9fa48("599") ? {} : (stryCov_9fa48("599"), {
            componentNodes: stryMutAct_9fa48("600") ? ["Stryker was here"] : (stryCov_9fa48("600"), [])
          }));
        }
      },
      addComponentNode: data => {
        if (stryMutAct_9fa48("601")) {
          {}
        } else {
          stryCov_9fa48("601");
          const newNode: ComponentNode = stryMutAct_9fa48("602") ? {} : (stryCov_9fa48("602"), {
            ...data,
            nodeId: generateId(),
            status: stryMutAct_9fa48("603") ? "" : (stryCov_9fa48("603"), 'pending'),
            isActive: stryMutAct_9fa48("604") ? true : (stryCov_9fa48("604"), false),
            children: stryMutAct_9fa48("605") ? ["Stryker was here"] : (stryCov_9fa48("605"), [])
          });
          set(s => {
            if (stryMutAct_9fa48("606")) {
              {}
            } else {
              stryCov_9fa48("606");
              const newNodes = stryMutAct_9fa48("607") ? [] : (stryCov_9fa48("607"), [...s.componentNodes, newNode]);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("608") ? "" : (stryCov_9fa48("608"), 'component'), newNodes);
              return stryMutAct_9fa48("609") ? {} : (stryCov_9fa48("609"), {
                componentNodes: newNodes
              });
            }
          });
          // Epic 4: auto-append user_action message
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("610") ? {} : (stryCov_9fa48("610"), {
            type: stryMutAct_9fa48("611") ? "" : (stryCov_9fa48("611"), 'user_action'),
            content: stryMutAct_9fa48("612") ? `` : (stryCov_9fa48("612"), `添加了组件节点`),
            meta: data.name
          }));
        }
      },
      editComponentNode: (nodeId, data) => {
        if (stryMutAct_9fa48("613")) {
          {}
        } else {
          stryCov_9fa48("613");
          set(s => {
            if (stryMutAct_9fa48("614")) {
              {}
            } else {
              stryCov_9fa48("614");
              const newNodes = s.componentNodes.map(stryMutAct_9fa48("615") ? () => undefined : (stryCov_9fa48("615"), n => (stryMutAct_9fa48("618") ? n.nodeId !== nodeId : stryMutAct_9fa48("617") ? false : stryMutAct_9fa48("616") ? true : (stryCov_9fa48("616", "617", "618"), n.nodeId === nodeId)) ? stryMutAct_9fa48("619") ? {} : (stryCov_9fa48("619"), {
                ...n,
                ...data,
                status: 'pending' as const
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("620") ? "" : (stryCov_9fa48("620"), 'component'), newNodes);
              return stryMutAct_9fa48("621") ? {} : (stryCov_9fa48("621"), {
                componentNodes: newNodes
              });
            }
          });
        }
      },
      deleteComponentNode: nodeId => {
        if (stryMutAct_9fa48("622")) {
          {}
        } else {
          stryCov_9fa48("622");
          const nodeToDelete = get().componentNodes.find(stryMutAct_9fa48("623") ? () => undefined : (stryCov_9fa48("623"), n => stryMutAct_9fa48("626") ? n.nodeId !== nodeId : stryMutAct_9fa48("625") ? false : stryMutAct_9fa48("624") ? true : (stryCov_9fa48("624", "625", "626"), n.nodeId === nodeId)));
          const deletedName = stryMutAct_9fa48("627") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("627"), (stryMutAct_9fa48("628") ? nodeToDelete.name : (stryCov_9fa48("628"), nodeToDelete?.name)) ?? nodeId);
          set(s => {
            if (stryMutAct_9fa48("629")) {
              {}
            } else {
              stryCov_9fa48("629");
              const newNodes = stryMutAct_9fa48("630") ? s.componentNodes : (stryCov_9fa48("630"), s.componentNodes.filter(stryMutAct_9fa48("631") ? () => undefined : (stryCov_9fa48("631"), n => stryMutAct_9fa48("634") ? n.nodeId === nodeId : stryMutAct_9fa48("633") ? false : stryMutAct_9fa48("632") ? true : (stryCov_9fa48("632", "633", "634"), n.nodeId !== nodeId))));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("635") ? "" : (stryCov_9fa48("635"), 'component'), newNodes);
              return stryMutAct_9fa48("636") ? {} : (stryCov_9fa48("636"), {
                componentNodes: newNodes
              });
            }
          });
          // Epic 4: auto-append user_action message
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("637") ? {} : (stryCov_9fa48("637"), {
            type: stryMutAct_9fa48("638") ? "" : (stryCov_9fa48("638"), 'user_action'),
            content: stryMutAct_9fa48("639") ? `` : (stryCov_9fa48("639"), `删除了组件节点`),
            meta: deletedName
          }));
        }
      },
      setComponentDraft: stryMutAct_9fa48("640") ? () => undefined : (stryCov_9fa48("640"), draft => set(stryMutAct_9fa48("641") ? {} : (stryCov_9fa48("641"), {
        componentDraft: draft
      }))),
      // === Queue Slice Actions ===
      setProjectId: stryMutAct_9fa48("642") ? () => undefined : (stryCov_9fa48("642"), id => set(stryMutAct_9fa48("643") ? {} : (stryCov_9fa48("643"), {
        projectId: id
      }))),
      setIsPolling: stryMutAct_9fa48("644") ? () => undefined : (stryCov_9fa48("644"), polling => set(stryMutAct_9fa48("645") ? {} : (stryCov_9fa48("645"), {
        isPolling: polling
      }))),
      addToQueue: stryMutAct_9fa48("646") ? () => undefined : (stryCov_9fa48("646"), pages => set(stryMutAct_9fa48("647") ? () => undefined : (stryCov_9fa48("647"), s => stryMutAct_9fa48("648") ? {} : (stryCov_9fa48("648"), {
        prototypeQueue: stryMutAct_9fa48("649") ? [] : (stryCov_9fa48("649"), [...s.prototypeQueue, ...pages])
      })))),
      updateQueueItem: stryMutAct_9fa48("650") ? () => undefined : (stryCov_9fa48("650"), (pageId, update) => set(stryMutAct_9fa48("651") ? () => undefined : (stryCov_9fa48("651"), s => stryMutAct_9fa48("652") ? {} : (stryCov_9fa48("652"), {
        prototypeQueue: s.prototypeQueue.map(stryMutAct_9fa48("653") ? () => undefined : (stryCov_9fa48("653"), p => (stryMutAct_9fa48("656") ? p.pageId !== pageId : stryMutAct_9fa48("655") ? false : stryMutAct_9fa48("654") ? true : (stryCov_9fa48("654", "655", "656"), p.pageId === pageId)) ? stryMutAct_9fa48("657") ? {} : (stryCov_9fa48("657"), {
          ...p,
          ...update
        }) : p))
      })))),
      removeFromQueue: stryMutAct_9fa48("658") ? () => undefined : (stryCov_9fa48("658"), pageId => set(stryMutAct_9fa48("659") ? () => undefined : (stryCov_9fa48("659"), s => stryMutAct_9fa48("660") ? {} : (stryCov_9fa48("660"), {
        prototypeQueue: stryMutAct_9fa48("661") ? s.prototypeQueue : (stryCov_9fa48("661"), s.prototypeQueue.filter(stryMutAct_9fa48("662") ? () => undefined : (stryCov_9fa48("662"), p => stryMutAct_9fa48("665") ? p.pageId === pageId : stryMutAct_9fa48("664") ? false : stryMutAct_9fa48("663") ? true : (stryCov_9fa48("663", "664", "665"), p.pageId !== pageId))))
      })))),
      clearQueue: stryMutAct_9fa48("666") ? () => undefined : (stryCov_9fa48("666"), () => set(stryMutAct_9fa48("667") ? {} : (stryCov_9fa48("667"), {
        prototypeQueue: stryMutAct_9fa48("668") ? ["Stryker was here"] : (stryCov_9fa48("668"), []),
        projectId: null
      }))),
      // === AI Thinking Actions (Epic 1) ===
      setAiThinking: stryMutAct_9fa48("669") ? () => undefined : (stryCov_9fa48("669"), (thinking, message = null) => set(stryMutAct_9fa48("670") ? {} : (stryCov_9fa48("670"), {
        aiThinking: thinking,
        aiThinkingMessage: message
      }))),
      setFlowGenerating: stryMutAct_9fa48("671") ? () => undefined : (stryCov_9fa48("671"), (generating, message = null) => set(stryMutAct_9fa48("672") ? {} : (stryCov_9fa48("672"), {
        flowGenerating: generating,
        flowGeneratingMessage: message
      }))),
      setRequirementText: stryMutAct_9fa48("673") ? () => undefined : (stryCov_9fa48("673"), text => set(stryMutAct_9fa48("674") ? {} : (stryCov_9fa48("674"), {
        requirementText: text
      }))),
      generateContextsFromRequirement: async (text: string) => {
        if (stryMutAct_9fa48("675")) {
          {}
        } else {
          stryCov_9fa48("675");
          const {
            setAiThinking,
            setRequirementText,
            setPhase,
            addContextNode
          } = get();

          // Reset state
          setAiThinking(stryMutAct_9fa48("676") ? false : (stryCov_9fa48("676"), true), stryMutAct_9fa48("677") ? "" : (stryCov_9fa48("677"), '正在连接...'));
          setRequirementText(text);
          setPhase(stryMutAct_9fa48("678") ? "" : (stryCov_9fa48("678"), 'context'));

          // Import dynamically to avoid circular deps
          const {
            canvasSseAnalyze
          } = require('./api/canvasSseApi') as typeof import('./api/canvasSseApi');
          canvasSseAnalyze(text, stryMutAct_9fa48("679") ? {} : (stryCov_9fa48("679"), {
            timeoutMs: 30000,
            onThinking: (content: string) => {
              if (stryMutAct_9fa48("680")) {
                {}
              } else {
                stryCov_9fa48("680");
                setAiThinking(stryMutAct_9fa48("681") ? false : (stryCov_9fa48("681"), true), content);
              }
            },
            onStepContext: (content: string, _mermaidCode: string | undefined, confidence: number | undefined, boundedContexts) => {
              if (stryMutAct_9fa48("682")) {
                {}
              } else {
                stryCov_9fa48("682");
                setAiThinking(stryMutAct_9fa48("683") ? false : (stryCov_9fa48("683"), true), content);
                // Map backend type to valid BoundedContextNode type
                const mapContextType = (type: string): BoundedContextNode['type'] => {
                  if (stryMutAct_9fa48("684")) {
                    {}
                  } else {
                    stryCov_9fa48("684");
                    const validTypes = stryMutAct_9fa48("685") ? [] : (stryCov_9fa48("685"), [stryMutAct_9fa48("686") ? "" : (stryCov_9fa48("686"), 'core'), stryMutAct_9fa48("687") ? "" : (stryCov_9fa48("687"), 'supporting'), stryMutAct_9fa48("688") ? "" : (stryCov_9fa48("688"), 'generic'), stryMutAct_9fa48("689") ? "" : (stryCov_9fa48("689"), 'external')]);
                    return validTypes.includes(type) ? type as BoundedContextNode['type'] : stryMutAct_9fa48("690") ? "" : (stryCov_9fa48("690"), 'core');
                  }
                };
                const MAX_CONTEXT_NODES = 10;
                const MAX_NAME_LENGTH = 30;
                const truncateName = (name: string): string => {
                  if (stryMutAct_9fa48("691")) {
                    {}
                  } else {
                    stryCov_9fa48("691");
                    if (stryMutAct_9fa48("695") ? name.length > MAX_NAME_LENGTH : stryMutAct_9fa48("694") ? name.length < MAX_NAME_LENGTH : stryMutAct_9fa48("693") ? false : stryMutAct_9fa48("692") ? true : (stryCov_9fa48("692", "693", "694", "695"), name.length <= MAX_NAME_LENGTH)) return name;
                    return (stryMutAct_9fa48("696") ? name : (stryCov_9fa48("696"), name.substring(0, stryMutAct_9fa48("697") ? MAX_NAME_LENGTH + 3 : (stryCov_9fa48("697"), MAX_NAME_LENGTH - 3)))) + (stryMutAct_9fa48("698") ? "" : (stryCov_9fa48("698"), '...'));
                  }
                };
                // Loop through boundedContexts and add each one (max 10)
                if (stryMutAct_9fa48("701") ? boundedContexts || boundedContexts.length > 0 : stryMutAct_9fa48("700") ? false : stryMutAct_9fa48("699") ? true : (stryCov_9fa48("699", "700", "701"), boundedContexts && (stryMutAct_9fa48("704") ? boundedContexts.length <= 0 : stryMutAct_9fa48("703") ? boundedContexts.length >= 0 : stryMutAct_9fa48("702") ? true : (stryCov_9fa48("702", "703", "704"), boundedContexts.length > 0)))) {
                  if (stryMutAct_9fa48("705")) {
                    {}
                  } else {
                    stryCov_9fa48("705");
                    const nodesToAdd = stryMutAct_9fa48("706") ? boundedContexts : (stryCov_9fa48("706"), boundedContexts.slice(0, MAX_CONTEXT_NODES));
                    nodesToAdd.forEach(ctx => {
                      if (stryMutAct_9fa48("707")) {
                        {}
                      } else {
                        stryCov_9fa48("707");
                        addContextNode(stryMutAct_9fa48("708") ? {} : (stryCov_9fa48("708"), {
                          name: truncateName(ctx.name),
                          description: ctx.description,
                          type: mapContextType(ctx.type)
                        }));
                      }
                    });
                  }
                } else if (stryMutAct_9fa48("711") ? confidence !== undefined || confidence > 0.5 : stryMutAct_9fa48("710") ? false : stryMutAct_9fa48("709") ? true : (stryCov_9fa48("709", "710", "711"), (stryMutAct_9fa48("713") ? confidence === undefined : stryMutAct_9fa48("712") ? true : (stryCov_9fa48("712", "713"), confidence !== undefined)) && (stryMutAct_9fa48("716") ? confidence <= 0.5 : stryMutAct_9fa48("715") ? confidence >= 0.5 : stryMutAct_9fa48("714") ? true : (stryCov_9fa48("714", "715", "716"), confidence > 0.5)))) {
                  if (stryMutAct_9fa48("717")) {
                    {}
                  } else {
                    stryCov_9fa48("717");
                    // Fallback: single node if no boundedContexts
                    addContextNode(stryMutAct_9fa48("718") ? {} : (stryCov_9fa48("718"), {
                      name: stryMutAct_9fa48("719") ? "" : (stryCov_9fa48("719"), 'AI 分析上下文'),
                      description: content,
                      type: stryMutAct_9fa48("720") ? "" : (stryCov_9fa48("720"), 'core')
                    }));
                  }
                }
              }
            },
            onStepModel: (content: string) => {
              if (stryMutAct_9fa48("721")) {
                {}
              } else {
                stryCov_9fa48("721");
                setAiThinking(stryMutAct_9fa48("722") ? false : (stryCov_9fa48("722"), true), content);
              }
            },
            onStepFlow: (content: string) => {
              if (stryMutAct_9fa48("723")) {
                {}
              } else {
                stryCov_9fa48("723");
                setAiThinking(stryMutAct_9fa48("724") ? false : (stryCov_9fa48("724"), true), content);
              }
            },
            onStepComponents: (content: string) => {
              if (stryMutAct_9fa48("725")) {
                {}
              } else {
                stryCov_9fa48("725");
                setAiThinking(stryMutAct_9fa48("726") ? false : (stryCov_9fa48("726"), true), content);
              }
            },
            onDone: () => {
              if (stryMutAct_9fa48("727")) {
                {}
              } else {
                stryCov_9fa48("727");
                setAiThinking(stryMutAct_9fa48("728") ? true : (stryCov_9fa48("728"), false), null);
              }
            },
            onError: () => {
              if (stryMutAct_9fa48("729")) {
                {}
              } else {
                stryCov_9fa48("729");
                setAiThinking(stryMutAct_9fa48("730") ? true : (stryCov_9fa48("730"), false), null);
              }
            }
          })).catch((err: unknown) => {
            if (stryMutAct_9fa48("731")) {
              {}
            } else {
              stryCov_9fa48("731");
              setAiThinking(stryMutAct_9fa48("732") ? true : (stryCov_9fa48("732"), false), null);
              console.error(stryMutAct_9fa48("733") ? "" : (stryCov_9fa48("733"), '[canvasStore] generateContextsFromRequirement error:'), err);
            }
          });
        }
      },
      // === Drag Slice (E3) ===
      draggedNodeId: null,
      dragOverNodeId: null,
      draggedPositions: {},
      isDragging: stryMutAct_9fa48("734") ? true : (stryCov_9fa48("734"), false),
      startDrag: stryMutAct_9fa48("735") ? () => undefined : (stryCov_9fa48("735"), nodeId => set(stryMutAct_9fa48("736") ? {} : (stryCov_9fa48("736"), {
        draggedNodeId: nodeId,
        isDragging: stryMutAct_9fa48("737") ? false : (stryCov_9fa48("737"), true)
      }))),
      endDrag: (nodeId, position) => {
        if (stryMutAct_9fa48("738")) {
          {}
        } else {
          stryCov_9fa48("738");
          set(stryMutAct_9fa48("739") ? () => undefined : (stryCov_9fa48("739"), s => stryMutAct_9fa48("740") ? {} : (stryCov_9fa48("740"), {
            draggedPositions: stryMutAct_9fa48("741") ? {} : (stryCov_9fa48("741"), {
              ...s.draggedPositions,
              [nodeId]: position
            }),
            draggedNodeId: null,
            isDragging: stryMutAct_9fa48("742") ? true : (stryCov_9fa48("742"), false)
          })));
        }
      },
      setDragOver: stryMutAct_9fa48("743") ? () => undefined : (stryCov_9fa48("743"), nodeId => set(stryMutAct_9fa48("744") ? {} : (stryCov_9fa48("744"), {
        dragOverNodeId: nodeId
      }))),
      updateDraggedPosition: (nodeId, position) => {
        if (stryMutAct_9fa48("745")) {
          {}
        } else {
          stryCov_9fa48("745");
          set(stryMutAct_9fa48("746") ? () => undefined : (stryCov_9fa48("746"), s => stryMutAct_9fa48("747") ? {} : (stryCov_9fa48("747"), {
            draggedPositions: stryMutAct_9fa48("748") ? {} : (stryCov_9fa48("748"), {
              ...s.draggedPositions,
              [nodeId]: position
            })
          })));
        }
      },
      clearDragPositions: stryMutAct_9fa48("749") ? () => undefined : (stryCov_9fa48("749"), () => set(stryMutAct_9fa48("750") ? {} : (stryCov_9fa48("750"), {
        draggedPositions: {},
        draggedNodeId: null,
        dragOverNodeId: null,
        isDragging: stryMutAct_9fa48("751") ? true : (stryCov_9fa48("751"), false)
      }))),
      clearDragPosition: nodeId => {
        if (stryMutAct_9fa48("752")) {
          {}
        } else {
          stryCov_9fa48("752");
          set(s => {
            if (stryMutAct_9fa48("753")) {
              {}
            } else {
              stryCov_9fa48("753");
              const next = stryMutAct_9fa48("754") ? {} : (stryCov_9fa48("754"), {
                ...s.draggedPositions
              });
              delete next[nodeId];
              return stryMutAct_9fa48("755") ? {} : (stryCov_9fa48("755"), {
                draggedPositions: next
              });
            }
          });
        }
      },
      // === Bounded Group Slice (E4) ===
      boundedGroups: stryMutAct_9fa48("756") ? ["Stryker was here"] : (stryCov_9fa48("756"), []),
      addBoundedGroup: groupData => {
        if (stryMutAct_9fa48("757")) {
          {}
        } else {
          stryCov_9fa48("757");
          const newGroup: BoundedGroup = stryMutAct_9fa48("758") ? {} : (stryCov_9fa48("758"), {
            ...groupData,
            groupId: generateId()
          });
          set(stryMutAct_9fa48("759") ? () => undefined : (stryCov_9fa48("759"), s => stryMutAct_9fa48("760") ? {} : (stryCov_9fa48("760"), {
            boundedGroups: stryMutAct_9fa48("761") ? [] : (stryCov_9fa48("761"), [...s.boundedGroups, newGroup])
          })));
        }
      },
      removeBoundedGroup: groupId => {
        if (stryMutAct_9fa48("762")) {
          {}
        } else {
          stryCov_9fa48("762");
          set(stryMutAct_9fa48("763") ? () => undefined : (stryCov_9fa48("763"), s => stryMutAct_9fa48("764") ? {} : (stryCov_9fa48("764"), {
            boundedGroups: stryMutAct_9fa48("765") ? s.boundedGroups : (stryCov_9fa48("765"), s.boundedGroups.filter(stryMutAct_9fa48("766") ? () => undefined : (stryCov_9fa48("766"), g => stryMutAct_9fa48("769") ? g.groupId === groupId : stryMutAct_9fa48("768") ? false : stryMutAct_9fa48("767") ? true : (stryCov_9fa48("767", "768", "769"), g.groupId !== groupId))))
          })));
        }
      },
      toggleBoundedGroupVisibility: groupId => {
        if (stryMutAct_9fa48("770")) {
          {}
        } else {
          stryCov_9fa48("770");
          set(stryMutAct_9fa48("771") ? () => undefined : (stryCov_9fa48("771"), s => stryMutAct_9fa48("772") ? {} : (stryCov_9fa48("772"), {
            boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("773") ? () => undefined : (stryCov_9fa48("773"), g => (stryMutAct_9fa48("776") ? g.groupId !== groupId : stryMutAct_9fa48("775") ? false : stryMutAct_9fa48("774") ? true : (stryCov_9fa48("774", "775", "776"), g.groupId === groupId)) ? stryMutAct_9fa48("777") ? {} : (stryCov_9fa48("777"), {
              ...g,
              visible: (stryMutAct_9fa48("780") ? g.visible === undefined && g.visible === true : stryMutAct_9fa48("779") ? false : stryMutAct_9fa48("778") ? true : (stryCov_9fa48("778", "779", "780"), (stryMutAct_9fa48("782") ? g.visible !== undefined : stryMutAct_9fa48("781") ? false : (stryCov_9fa48("781", "782"), g.visible === undefined)) || (stryMutAct_9fa48("784") ? g.visible !== true : stryMutAct_9fa48("783") ? false : (stryCov_9fa48("783", "784"), g.visible === (stryMutAct_9fa48("785") ? false : (stryCov_9fa48("785"), true)))))) ? stryMutAct_9fa48("786") ? true : (stryCov_9fa48("786"), false) : stryMutAct_9fa48("787") ? false : (stryCov_9fa48("787"), true)
            }) : g))
          })));
        }
      },
      updateBoundedGroupLabel: (groupId, label) => {
        if (stryMutAct_9fa48("788")) {
          {}
        } else {
          stryCov_9fa48("788");
          set(stryMutAct_9fa48("789") ? () => undefined : (stryCov_9fa48("789"), s => stryMutAct_9fa48("790") ? {} : (stryCov_9fa48("790"), {
            boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("791") ? () => undefined : (stryCov_9fa48("791"), g => (stryMutAct_9fa48("794") ? g.groupId !== groupId : stryMutAct_9fa48("793") ? false : stryMutAct_9fa48("792") ? true : (stryCov_9fa48("792", "793", "794"), g.groupId === groupId)) ? stryMutAct_9fa48("795") ? {} : (stryCov_9fa48("795"), {
              ...g,
              label
            }) : g))
          })));
        }
      },
      addNodeToGroup: (groupId, nodeId) => {
        if (stryMutAct_9fa48("796")) {
          {}
        } else {
          stryCov_9fa48("796");
          set(stryMutAct_9fa48("797") ? () => undefined : (stryCov_9fa48("797"), s => stryMutAct_9fa48("798") ? {} : (stryCov_9fa48("798"), {
            boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("799") ? () => undefined : (stryCov_9fa48("799"), g => (stryMutAct_9fa48("802") ? g.groupId === groupId || !g.nodeIds.includes(nodeId) : stryMutAct_9fa48("801") ? false : stryMutAct_9fa48("800") ? true : (stryCov_9fa48("800", "801", "802"), (stryMutAct_9fa48("804") ? g.groupId !== groupId : stryMutAct_9fa48("803") ? true : (stryCov_9fa48("803", "804"), g.groupId === groupId)) && (stryMutAct_9fa48("805") ? g.nodeIds.includes(nodeId) : (stryCov_9fa48("805"), !g.nodeIds.includes(nodeId))))) ? stryMutAct_9fa48("806") ? {} : (stryCov_9fa48("806"), {
              ...g,
              nodeIds: stryMutAct_9fa48("807") ? [] : (stryCov_9fa48("807"), [...g.nodeIds, nodeId])
            }) : g))
          })));
        }
      },
      removeNodeFromGroup: (groupId, nodeId) => {
        if (stryMutAct_9fa48("808")) {
          {}
        } else {
          stryCov_9fa48("808");
          set(stryMutAct_9fa48("809") ? () => undefined : (stryCov_9fa48("809"), s => stryMutAct_9fa48("810") ? {} : (stryCov_9fa48("810"), {
            boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("811") ? () => undefined : (stryCov_9fa48("811"), g => (stryMutAct_9fa48("814") ? g.groupId !== groupId : stryMutAct_9fa48("813") ? false : stryMutAct_9fa48("812") ? true : (stryCov_9fa48("812", "813", "814"), g.groupId === groupId)) ? stryMutAct_9fa48("815") ? {} : (stryCov_9fa48("815"), {
              ...g,
              nodeIds: stryMutAct_9fa48("816") ? g.nodeIds : (stryCov_9fa48("816"), g.nodeIds.filter(stryMutAct_9fa48("817") ? () => undefined : (stryCov_9fa48("817"), id => stryMutAct_9fa48("820") ? id === nodeId : stryMutAct_9fa48("819") ? false : stryMutAct_9fa48("818") ? true : (stryCov_9fa48("818", "819", "820"), id !== nodeId))))
            }) : g))
          })));
        }
      },
      clearBoundedGroups: stryMutAct_9fa48("821") ? () => undefined : (stryCov_9fa48("821"), () => set(stryMutAct_9fa48("822") ? {} : (stryCov_9fa48("822"), {
        boundedGroups: stryMutAct_9fa48("823") ? ["Stryker was here"] : (stryCov_9fa48("823"), [])
      }))),
      // === F2: BoundedEdge Slice ===
      boundedEdges: stryMutAct_9fa48("824") ? ["Stryker was here"] : (stryCov_9fa48("824"), []),
      addBoundedEdge: edgeData => {
        if (stryMutAct_9fa48("825")) {
          {}
        } else {
          stryCov_9fa48("825");
          const newEdge: BoundedEdge = stryMutAct_9fa48("826") ? {} : (stryCov_9fa48("826"), {
            ...edgeData,
            id: generateId()
          });
          set(stryMutAct_9fa48("827") ? () => undefined : (stryCov_9fa48("827"), s => stryMutAct_9fa48("828") ? {} : (stryCov_9fa48("828"), {
            boundedEdges: stryMutAct_9fa48("829") ? [] : (stryCov_9fa48("829"), [...s.boundedEdges, newEdge])
          })));
        }
      },
      removeBoundedEdge: id => {
        if (stryMutAct_9fa48("830")) {
          {}
        } else {
          stryCov_9fa48("830");
          set(stryMutAct_9fa48("831") ? () => undefined : (stryCov_9fa48("831"), s => stryMutAct_9fa48("832") ? {} : (stryCov_9fa48("832"), {
            boundedEdges: stryMutAct_9fa48("833") ? s.boundedEdges : (stryCov_9fa48("833"), s.boundedEdges.filter(stryMutAct_9fa48("834") ? () => undefined : (stryCov_9fa48("834"), e => stryMutAct_9fa48("837") ? e.id === id : stryMutAct_9fa48("836") ? false : stryMutAct_9fa48("835") ? true : (stryCov_9fa48("835", "836", "837"), e.id !== id))))
          })));
        }
      },
      clearBoundedEdges: stryMutAct_9fa48("838") ? () => undefined : (stryCov_9fa48("838"), () => set(stryMutAct_9fa48("839") ? {} : (stryCov_9fa48("839"), {
        boundedEdges: stryMutAct_9fa48("840") ? ["Stryker was here"] : (stryCov_9fa48("840"), [])
      }))),
      setBoundedEdges: stryMutAct_9fa48("841") ? () => undefined : (stryCov_9fa48("841"), edges => set(stryMutAct_9fa48("842") ? {} : (stryCov_9fa48("842"), {
        boundedEdges: edges
      }))),
      // === F2: FlowEdge Slice ===
      flowEdges: stryMutAct_9fa48("843") ? ["Stryker was here"] : (stryCov_9fa48("843"), []),
      addFlowEdge: edgeData => {
        if (stryMutAct_9fa48("844")) {
          {}
        } else {
          stryCov_9fa48("844");
          const newEdge: FlowEdge = stryMutAct_9fa48("845") ? {} : (stryCov_9fa48("845"), {
            ...edgeData,
            id: generateId()
          });
          set(stryMutAct_9fa48("846") ? () => undefined : (stryCov_9fa48("846"), s => stryMutAct_9fa48("847") ? {} : (stryCov_9fa48("847"), {
            flowEdges: stryMutAct_9fa48("848") ? [] : (stryCov_9fa48("848"), [...s.flowEdges, newEdge])
          })));
        }
      },
      removeFlowEdge: id => {
        if (stryMutAct_9fa48("849")) {
          {}
        } else {
          stryCov_9fa48("849");
          set(stryMutAct_9fa48("850") ? () => undefined : (stryCov_9fa48("850"), s => stryMutAct_9fa48("851") ? {} : (stryCov_9fa48("851"), {
            flowEdges: stryMutAct_9fa48("852") ? s.flowEdges : (stryCov_9fa48("852"), s.flowEdges.filter(stryMutAct_9fa48("853") ? () => undefined : (stryCov_9fa48("853"), e => stryMutAct_9fa48("856") ? e.id === id : stryMutAct_9fa48("855") ? false : stryMutAct_9fa48("854") ? true : (stryCov_9fa48("854", "855", "856"), e.id !== id))))
          })));
        }
      },
      clearFlowEdges: stryMutAct_9fa48("857") ? () => undefined : (stryCov_9fa48("857"), () => set(stryMutAct_9fa48("858") ? {} : (stryCov_9fa48("858"), {
        flowEdges: stryMutAct_9fa48("859") ? ["Stryker was here"] : (stryCov_9fa48("859"), [])
      }))),
      setFlowEdges: stryMutAct_9fa48("860") ? () => undefined : (stryCov_9fa48("860"), edges => set(stryMutAct_9fa48("861") ? {} : (stryCov_9fa48("861"), {
        flowEdges: edges
      }))),
      // === Internal tracking ===
      _prevActiveTree: null as TreeType | null,
      // === Tree Activation Logic ===
      recomputeActiveTree: () => {
        if (stryMutAct_9fa48("862")) {
          {}
        } else {
          stryCov_9fa48("862");
          const {
            contextNodes,
            flowNodes,
            phase,
            _prevActiveTree
          } = get();
          let newActiveTree: TreeType | null = null;

          // Activation rules based on phase
          if (stryMutAct_9fa48("865") ? phase !== 'input' : stryMutAct_9fa48("864") ? false : stryMutAct_9fa48("863") ? true : (stryCov_9fa48("863", "864", "865"), phase === (stryMutAct_9fa48("866") ? "" : (stryCov_9fa48("866"), 'input')))) {
            if (stryMutAct_9fa48("867")) {
              {}
            } else {
              stryCov_9fa48("867");
              newActiveTree = null;
            }
          } else if (stryMutAct_9fa48("870") ? phase !== 'context' : stryMutAct_9fa48("869") ? false : stryMutAct_9fa48("868") ? true : (stryCov_9fa48("868", "869", "870"), phase === (stryMutAct_9fa48("871") ? "" : (stryCov_9fa48("871"), 'context')))) {
            if (stryMutAct_9fa48("872")) {
              {}
            } else {
              stryCov_9fa48("872");
              const allConfirmed = areAllConfirmed(contextNodes);
              newActiveTree = (stryMutAct_9fa48("875") ? allConfirmed || contextNodes.length > 0 : stryMutAct_9fa48("874") ? false : stryMutAct_9fa48("873") ? true : (stryCov_9fa48("873", "874", "875"), allConfirmed && (stryMutAct_9fa48("878") ? contextNodes.length <= 0 : stryMutAct_9fa48("877") ? contextNodes.length >= 0 : stryMutAct_9fa48("876") ? true : (stryCov_9fa48("876", "877", "878"), contextNodes.length > 0)))) ? stryMutAct_9fa48("879") ? "" : (stryCov_9fa48("879"), 'flow') : stryMutAct_9fa48("880") ? "" : (stryCov_9fa48("880"), 'context');
            }
          } else if (stryMutAct_9fa48("883") ? phase !== 'flow' : stryMutAct_9fa48("882") ? false : stryMutAct_9fa48("881") ? true : (stryCov_9fa48("881", "882", "883"), phase === (stryMutAct_9fa48("884") ? "" : (stryCov_9fa48("884"), 'flow')))) {
            if (stryMutAct_9fa48("885")) {
              {}
            } else {
              stryCov_9fa48("885");
              const flowReady = areAllConfirmed(flowNodes);
              const contextReady = areAllConfirmed(contextNodes);
              newActiveTree = (stryMutAct_9fa48("888") ? flowReady || flowNodes.length > 0 : stryMutAct_9fa48("887") ? false : stryMutAct_9fa48("886") ? true : (stryCov_9fa48("886", "887", "888"), flowReady && (stryMutAct_9fa48("891") ? flowNodes.length <= 0 : stryMutAct_9fa48("890") ? flowNodes.length >= 0 : stryMutAct_9fa48("889") ? true : (stryCov_9fa48("889", "890", "891"), flowNodes.length > 0)))) ? stryMutAct_9fa48("892") ? "" : (stryCov_9fa48("892"), 'component') : stryMutAct_9fa48("893") ? "" : (stryCov_9fa48("893"), 'flow');
              if (stryMutAct_9fa48("896") ? contextReady && flowReady || flowNodes.length > 0 : stryMutAct_9fa48("895") ? false : stryMutAct_9fa48("894") ? true : (stryCov_9fa48("894", "895", "896"), (stryMutAct_9fa48("898") ? contextReady || flowReady : stryMutAct_9fa48("897") ? true : (stryCov_9fa48("897", "898"), contextReady && flowReady)) && (stryMutAct_9fa48("901") ? flowNodes.length <= 0 : stryMutAct_9fa48("900") ? flowNodes.length >= 0 : stryMutAct_9fa48("899") ? true : (stryCov_9fa48("899", "900", "901"), flowNodes.length > 0)))) {
                if (stryMutAct_9fa48("902")) {
                  {}
                } else {
                  stryCov_9fa48("902");
                  set(stryMutAct_9fa48("903") ? {} : (stryCov_9fa48("903"), {
                    activeTree: newActiveTree,
                    _prevActiveTree: newActiveTree,
                    phase: stryMutAct_9fa48("904") ? "" : (stryCov_9fa48("904"), 'component')
                  }));
                  get().setCenterExpand(stryMutAct_9fa48("905") ? "" : (stryCov_9fa48("905"), 'expand-left'));
                  return;
                }
              }
            }
          } else if (stryMutAct_9fa48("908") ? phase !== 'component' : stryMutAct_9fa48("907") ? false : stryMutAct_9fa48("906") ? true : (stryCov_9fa48("906", "907", "908"), phase === (stryMutAct_9fa48("909") ? "" : (stryCov_9fa48("909"), 'component')))) {
            if (stryMutAct_9fa48("910")) {
              {}
            } else {
              stryCov_9fa48("910");
              newActiveTree = stryMutAct_9fa48("911") ? "" : (stryCov_9fa48("911"), 'component');
            }
          } else {
            if (stryMutAct_9fa48("912")) {
              {}
            } else {
              stryCov_9fa48("912");
              // prototype
              newActiveTree = null;
            }
          }

          // E2-1: Auto-expand center panel based on activeTree transition
          if (stryMutAct_9fa48("915") ? newActiveTree === _prevActiveTree : stryMutAct_9fa48("914") ? false : stryMutAct_9fa48("913") ? true : (stryCov_9fa48("913", "914", "915"), newActiveTree !== _prevActiveTree)) {
            if (stryMutAct_9fa48("916")) {
              {}
            } else {
              stryCov_9fa48("916");
              if (stryMutAct_9fa48("919") ? newActiveTree === 'flow' && newActiveTree === 'component' : stryMutAct_9fa48("918") ? false : stryMutAct_9fa48("917") ? true : (stryCov_9fa48("917", "918", "919"), (stryMutAct_9fa48("921") ? newActiveTree !== 'flow' : stryMutAct_9fa48("920") ? false : (stryCov_9fa48("920", "921"), newActiveTree === (stryMutAct_9fa48("922") ? "" : (stryCov_9fa48("922"), 'flow')))) || (stryMutAct_9fa48("924") ? newActiveTree !== 'component' : stryMutAct_9fa48("923") ? false : (stryCov_9fa48("923", "924"), newActiveTree === (stryMutAct_9fa48("925") ? "" : (stryCov_9fa48("925"), 'component')))))) {
                if (stryMutAct_9fa48("926")) {
                  {}
                } else {
                  stryCov_9fa48("926");
                  set(stryMutAct_9fa48("927") ? {} : (stryCov_9fa48("927"), {
                    activeTree: newActiveTree,
                    _prevActiveTree: newActiveTree
                  }));
                  get().setCenterExpand(stryMutAct_9fa48("928") ? "" : (stryCov_9fa48("928"), 'expand-left'));
                }
              } else if (stryMutAct_9fa48("931") ? newActiveTree !== null : stryMutAct_9fa48("930") ? false : stryMutAct_9fa48("929") ? true : (stryCov_9fa48("929", "930", "931"), newActiveTree === null)) {
                if (stryMutAct_9fa48("932")) {
                  {}
                } else {
                  stryCov_9fa48("932");
                  set(stryMutAct_9fa48("933") ? {} : (stryCov_9fa48("933"), {
                    activeTree: newActiveTree,
                    _prevActiveTree: newActiveTree
                  }));
                  get().setCenterExpand(stryMutAct_9fa48("934") ? "" : (stryCov_9fa48("934"), 'default'));
                }
              } else {
                if (stryMutAct_9fa48("935")) {
                  {}
                } else {
                  stryCov_9fa48("935");
                  set(stryMutAct_9fa48("936") ? {} : (stryCov_9fa48("936"), {
                    activeTree: newActiveTree,
                    _prevActiveTree: newActiveTree
                  }));
                }
              }
            }
          } else {
            if (stryMutAct_9fa48("937")) {
              {}
            } else {
              stryCov_9fa48("937");
              // No change, just update prev (protect user手动展开)
              set(stryMutAct_9fa48("938") ? {} : (stryCov_9fa48("938"), {
                activeTree: newActiveTree,
                _prevActiveTree: newActiveTree
              }));
            }
          }
        }
      }
    });
  }
}, stryMutAct_9fa48("939") ? {} : (stryCov_9fa48("939"), {
  name: stryMutAct_9fa48("940") ? "" : (stryCov_9fa48("940"), 'vibex-canvas-storage'),
  storage: stryMutAct_9fa48("941") ? {} : (stryCov_9fa48("941"), {
    getItem: (name: string) => {
      if (stryMutAct_9fa48("942")) {
        {}
      } else {
        stryCov_9fa48("942");
        const value = localStorage.getItem(name);
        if (stryMutAct_9fa48("945") ? value !== null : stryMutAct_9fa48("944") ? false : stryMutAct_9fa48("943") ? true : (stryCov_9fa48("943", "944", "945"), value === null)) return null;
        try {
          if (stryMutAct_9fa48("946")) {
            {}
          } else {
            stryCov_9fa48("946");
            const parsed = JSON.parse(value);
            // Apply migrations if needed
            const migrated = runMigrations(stryMutAct_9fa48("947") ? parsed.state && {} : (stryCov_9fa48("947"), parsed.state ?? {}));
            // Update version
            localStorage.setItem(CANVAS_STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
            return stryMutAct_9fa48("948") ? {} : (stryCov_9fa48("948"), {
              ...parsed,
              state: migrated
            });
          }
        } catch {
          if (stryMutAct_9fa48("949")) {
            {}
          } else {
            stryCov_9fa48("949");
            return value ? stryMutAct_9fa48("950") ? {} : (stryCov_9fa48("950"), {
              state: JSON.parse(value)
            }) : null;
          }
        }
      }
    },
    setItem: (name: string, newValue: {
      state: Record<string, unknown>;
    }) => {
      if (stryMutAct_9fa48("951")) {
        {}
      } else {
        stryCov_9fa48("951");
        localStorage.setItem(name, JSON.stringify(newValue));
        localStorage.setItem(CANVAS_STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
      }
    },
    removeItem: (name: string) => {
      if (stryMutAct_9fa48("952")) {
        {}
      } else {
        stryCov_9fa48("952");
        localStorage.removeItem(name);
        localStorage.removeItem(CANVAS_STORAGE_VERSION_KEY);
      }
    }
  }),
  partialize: stryMutAct_9fa48("953") ? () => undefined : (stryCov_9fa48("953"), state => stryMutAct_9fa48("954") ? {} : (stryCov_9fa48("954"), {
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
    messages: state.messages
  }))
})), stryMutAct_9fa48("955") ? {} : (stryCov_9fa48("955"), {
  name: stryMutAct_9fa48("956") ? "" : (stryCov_9fa48("956"), 'canvasStore')
})));

// Register message bridge so extracted slices can post messages without circular deps
import { registerMessageBridge } from './stores/messageBridge';
registerMessageBridge(useCanvasStore.getState().addMessage as (msg: {
  type: string;
  content: string;
  meta?: string;
}) => void);

// Export for testing
export { markAllPending };