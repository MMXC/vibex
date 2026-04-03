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
import type { Phase, TreeType, BoundedContextNode, BusinessFlowNode, ComponentNode, PrototypePage, BoundedContextDraft, BusinessFlowDraft, FlowStep, CascadeUpstream, CascadeResult, PanelExpandState, BoundedGroup, BoundedEdge, FlowEdge } from './types';
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
    if (stryMutAct_9fa48("60")) {
      {}
    } else {
      stryCov_9fa48("60");
      const store = this.get();
      if (stryMutAct_9fa48("63") ? upstream !== 'context' : stryMutAct_9fa48("62") ? false : stryMutAct_9fa48("61") ? true : (stryCov_9fa48("61", "62", "63"), upstream === (stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), 'context')))) {
        if (stryMutAct_9fa48("65")) {
          {}
        } else {
          stryCov_9fa48("65");
          const updatedFlows = markAllPending(store.flowNodes);
          const updatedComponents = markAllPending(store.componentNodes);

          // Use Object.assign to trigger Zustand reactivity via setState
          return stryMutAct_9fa48("66") ? {} : (stryCov_9fa48("66"), {
            flowNodesMarked: updatedFlows.length,
            componentNodesMarked: updatedComponents.length
          });
        }
      }
      if (stryMutAct_9fa48("69") ? upstream !== 'flow' : stryMutAct_9fa48("68") ? false : stryMutAct_9fa48("67") ? true : (stryCov_9fa48("67", "68", "69"), upstream === (stryMutAct_9fa48("70") ? "" : (stryCov_9fa48("70"), 'flow')))) {
        if (stryMutAct_9fa48("71")) {
          {}
        } else {
          stryCov_9fa48("71");
          const updatedComponents = markAllPending(store.componentNodes);
          return stryMutAct_9fa48("72") ? {} : (stryCov_9fa48("72"), {
            flowNodesMarked: 0,
            componentNodesMarked: updatedComponents.length
          });
        }
      }
      return stryMutAct_9fa48("73") ? {} : (stryCov_9fa48("73"), {
        flowNodesMarked: 0,
        componentNodesMarked: 0
      });
    }
  }

  /**
   * 检查是否所有节点都已激活（isActive=true 或 undefined）
   * @deprecated use hasNodes instead
   */
  areAllConfirmed(nodes: Array<{
    isActive?: boolean;
  }>): boolean {
    if (stryMutAct_9fa48("74")) {
      {}
    } else {
      stryCov_9fa48("74");
      return stryMutAct_9fa48("77") ? nodes.length > 0 || nodes.every(n => n.isActive !== false) : stryMutAct_9fa48("76") ? false : stryMutAct_9fa48("75") ? true : (stryCov_9fa48("75", "76", "77"), (stryMutAct_9fa48("80") ? nodes.length <= 0 : stryMutAct_9fa48("79") ? nodes.length >= 0 : stryMutAct_9fa48("78") ? true : (stryCov_9fa48("78", "79", "80"), nodes.length > 0)) && (stryMutAct_9fa48("81") ? nodes.some(n => n.isActive !== false) : (stryCov_9fa48("81"), nodes.every(stryMutAct_9fa48("82") ? () => undefined : (stryCov_9fa48("82"), n => stryMutAct_9fa48("85") ? n.isActive === false : stryMutAct_9fa48("84") ? false : stryMutAct_9fa48("83") ? true : (stryCov_9fa48("83", "84", "85"), n.isActive !== (stryMutAct_9fa48("86") ? true : (stryCov_9fa48("86"), false))))))));
    }
  }

  /**
   * 检查是否有激活节点（isActive=true 或 undefined）
   */
  hasActiveNodes(nodes: Array<{
    isActive?: boolean;
  }>): boolean {
    if (stryMutAct_9fa48("87")) {
      {}
    } else {
      stryCov_9fa48("87");
      return stryMutAct_9fa48("88") ? nodes.every(n => n.isActive !== false) : (stryCov_9fa48("88"), nodes.some(stryMutAct_9fa48("89") ? () => undefined : (stryCov_9fa48("89"), n => stryMutAct_9fa48("92") ? n.isActive === false : stryMutAct_9fa48("91") ? false : stryMutAct_9fa48("90") ? true : (stryCov_9fa48("90", "91", "92"), n.isActive !== (stryMutAct_9fa48("93") ? true : (stryCov_9fa48("93"), false))))));
    }
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

  // === Internal ===
  _cascade: CascadeUpdateManager;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useCanvasStore = create<CanvasStore>()(devtools(persist((set, get) => {
  if (stryMutAct_9fa48("94")) {
    {}
  } else {
    stryCov_9fa48("94");
    const cascade = new CascadeUpdateManager(stryMutAct_9fa48("95") ? () => undefined : (stryCov_9fa48("95"), () => get()));
    return stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
      // === Phase Slice ===
      phase: stryMutAct_9fa48("97") ? "" : (stryCov_9fa48("97"), 'input'),
      activeTree: null,
      // === Panel Collapse Slice ===
      contextPanelCollapsed: stryMutAct_9fa48("98") ? true : (stryCov_9fa48("98"), false),
      flowPanelCollapsed: stryMutAct_9fa48("99") ? true : (stryCov_9fa48("99"), false),
      componentPanelCollapsed: stryMutAct_9fa48("100") ? true : (stryCov_9fa48("100"), false),
      // === Context Slice (source of truth in useContextStore, synced via subscription) ===
      contextNodes: stryMutAct_9fa48("101") ? ["Stryker was here"] : (stryCov_9fa48("101"), []),
      contextDraft: null,
      // === Flow Slice ===
      flowNodes: stryMutAct_9fa48("102") ? ["Stryker was here"] : (stryCov_9fa48("102"), []),
      flowDraft: null,
      // === Component Slice ===
      componentNodes: stryMutAct_9fa48("103") ? ["Stryker was here"] : (stryCov_9fa48("103"), []),
      componentDraft: null,
      // === Multi-Select Slice (F3-F10) ===
      selectedNodeIds: stryMutAct_9fa48("104") ? {} : (stryCov_9fa48("104"), {
        context: stryMutAct_9fa48("105") ? ["Stryker was here"] : (stryCov_9fa48("105"), []),
        flow: stryMutAct_9fa48("106") ? ["Stryker was here"] : (stryCov_9fa48("106"), []),
        component: stryMutAct_9fa48("107") ? ["Stryker was here"] : (stryCov_9fa48("107"), [])
      }),
      toggleNodeSelect: (tree, nodeId) => {
        if (stryMutAct_9fa48("108")) {
          {}
        } else {
          stryCov_9fa48("108");
          set(s => {
            if (stryMutAct_9fa48("109")) {
              {}
            } else {
              stryCov_9fa48("109");
              const current = s.selectedNodeIds[tree];
              const exists = current.includes(nodeId);
              return stryMutAct_9fa48("110") ? {} : (stryCov_9fa48("110"), {
                selectedNodeIds: stryMutAct_9fa48("111") ? {} : (stryCov_9fa48("111"), {
                  ...s.selectedNodeIds,
                  [tree]: exists ? stryMutAct_9fa48("112") ? current : (stryCov_9fa48("112"), current.filter(stryMutAct_9fa48("113") ? () => undefined : (stryCov_9fa48("113"), id => stryMutAct_9fa48("116") ? id === nodeId : stryMutAct_9fa48("115") ? false : stryMutAct_9fa48("114") ? true : (stryCov_9fa48("114", "115", "116"), id !== nodeId)))) : stryMutAct_9fa48("117") ? [] : (stryCov_9fa48("117"), [...current, nodeId])
                })
              });
            }
          });
        }
      },
      selectNode: (tree, nodeId) => {
        if (stryMutAct_9fa48("118")) {
          {}
        } else {
          stryCov_9fa48("118");
          set(stryMutAct_9fa48("119") ? () => undefined : (stryCov_9fa48("119"), s => stryMutAct_9fa48("120") ? {} : (stryCov_9fa48("120"), {
            selectedNodeIds: stryMutAct_9fa48("121") ? {} : (stryCov_9fa48("121"), {
              ...s.selectedNodeIds,
              [tree]: stryMutAct_9fa48("122") ? [] : (stryCov_9fa48("122"), [nodeId])
            })
          })));
        }
      },
      clearNodeSelection: tree => {
        if (stryMutAct_9fa48("123")) {
          {}
        } else {
          stryCov_9fa48("123");
          set(stryMutAct_9fa48("124") ? () => undefined : (stryCov_9fa48("124"), s => stryMutAct_9fa48("125") ? {} : (stryCov_9fa48("125"), {
            selectedNodeIds: stryMutAct_9fa48("126") ? {} : (stryCov_9fa48("126"), {
              ...s.selectedNodeIds,
              [tree]: stryMutAct_9fa48("127") ? ["Stryker was here"] : (stryCov_9fa48("127"), [])
            })
          })));
        }
      },
      selectAllNodes: tree => {
        if (stryMutAct_9fa48("128")) {
          {}
        } else {
          stryCov_9fa48("128");
          set(s => {
            if (stryMutAct_9fa48("129")) {
              {}
            } else {
              stryCov_9fa48("129");
              const nodeIds = s[stryMutAct_9fa48("130") ? `` : (stryCov_9fa48("130"), `${tree}Nodes`)].map(stryMutAct_9fa48("131") ? () => undefined : (stryCov_9fa48("131"), (n: BoundedContextNode | BusinessFlowNode | ComponentNode) => n.nodeId));
              return stryMutAct_9fa48("132") ? {} : (stryCov_9fa48("132"), {
                selectedNodeIds: stryMutAct_9fa48("133") ? {} : (stryCov_9fa48("133"), {
                  ...s.selectedNodeIds,
                  [tree]: nodeIds
                })
              });
            }
          });
        }
      },
      deleteSelectedNodes: tree => {
        if (stryMutAct_9fa48("134")) {
          {}
        } else {
          stryCov_9fa48("134");
          const {
            selectedNodeIds
          } = get();
          const toDelete = new Set(selectedNodeIds[tree]);
          if (stryMutAct_9fa48("137") ? toDelete.size !== 0 : stryMutAct_9fa48("136") ? false : stryMutAct_9fa48("135") ? true : (stryCov_9fa48("135", "136", "137"), toDelete.size === 0)) return;
          const deleteActions: Record<TreeType, (id: string) => void> = stryMutAct_9fa48("138") ? {} : (stryCov_9fa48("138"), {
            context: get().deleteContextNode,
            flow: get().deleteFlowNode,
            component: get().deleteComponentNode
          });

          // Record undo snapshot before batch delete
          const historyStore = getHistoryStore();
          const nodes = get()[stryMutAct_9fa48("139") ? `` : (stryCov_9fa48("139"), `${tree}Nodes`)];
          historyStore.recordSnapshot(tree, nodes);

          // Delete each selected node
          toDelete.forEach(stryMutAct_9fa48("140") ? () => undefined : (stryCov_9fa48("140"), id => deleteActions[tree](id)));

          // Clear selection after delete
          set(stryMutAct_9fa48("141") ? () => undefined : (stryCov_9fa48("141"), s => stryMutAct_9fa48("142") ? {} : (stryCov_9fa48("142"), {
            selectedNodeIds: stryMutAct_9fa48("143") ? {} : (stryCov_9fa48("143"), {
              ...s.selectedNodeIds,
              [tree]: stryMutAct_9fa48("144") ? ["Stryker was here"] : (stryCov_9fa48("144"), [])
            })
          })));
        }
      },
      // === Queue Slice ===
      projectId: null,
      prototypeQueue: stryMutAct_9fa48("145") ? ["Stryker was here"] : (stryCov_9fa48("145"), []),
      isPolling: stryMutAct_9fa48("146") ? true : (stryCov_9fa48("146"), false),
      // === AI Thinking Slice (Epic 1) ===
      aiThinking: stryMutAct_9fa48("147") ? true : (stryCov_9fa48("147"), false),
      aiThinkingMessage: null,
      requirementText: stryMutAct_9fa48("148") ? "Stryker was here!" : (stryCov_9fa48("148"), ''),
      // === Left/Right Persistent Drawer Slice (Epic 1 S1.1) ===
      leftDrawerOpen: stryMutAct_9fa48("149") ? true : (stryCov_9fa48("149"), false),
      rightDrawerOpen: stryMutAct_9fa48("150") ? true : (stryCov_9fa48("150"), false),
      // Epic 6: Message slice initial state
      messages: stryMutAct_9fa48("151") ? ["Stryker was here"] : (stryCov_9fa48("151"), []),
      leftDrawerWidth: 200,
      rightDrawerWidth: 200,
      // === SSE Status Slice (Epic 1 S1.3) ===
      sseStatus: stryMutAct_9fa48("152") ? "" : (stryCov_9fa48("152"), 'idle'),
      sseError: null,
      abortControllerRef: null,
      // === Flow Generation Slice ===
      flowGenerating: stryMutAct_9fa48("153") ? true : (stryCov_9fa48("153"), false),
      flowGeneratingMessage: null,
      // === Phase Actions ===
      setPhase: phase => {
        if (stryMutAct_9fa48("154")) {
          {}
        } else {
          stryCov_9fa48("154");
          set(stryMutAct_9fa48("155") ? {} : (stryCov_9fa48("155"), {
            phase
          }));
          get().recomputeActiveTree();
        }
      },
      advancePhase: () => {
        if (stryMutAct_9fa48("156")) {
          {}
        } else {
          stryCov_9fa48("156");
          const {
            phase
          } = get();
          const phaseOrder: Phase[] = stryMutAct_9fa48("157") ? [] : (stryCov_9fa48("157"), [stryMutAct_9fa48("158") ? "" : (stryCov_9fa48("158"), 'input'), stryMutAct_9fa48("159") ? "" : (stryCov_9fa48("159"), 'context'), stryMutAct_9fa48("160") ? "" : (stryCov_9fa48("160"), 'flow'), stryMutAct_9fa48("161") ? "" : (stryCov_9fa48("161"), 'component'), stryMutAct_9fa48("162") ? "" : (stryCov_9fa48("162"), 'prototype')]);
          const idx = phaseOrder.indexOf(phase);
          if (stryMutAct_9fa48("166") ? idx >= phaseOrder.length - 1 : stryMutAct_9fa48("165") ? idx <= phaseOrder.length - 1 : stryMutAct_9fa48("164") ? false : stryMutAct_9fa48("163") ? true : (stryCov_9fa48("163", "164", "165", "166"), idx < (stryMutAct_9fa48("167") ? phaseOrder.length + 1 : (stryCov_9fa48("167"), phaseOrder.length - 1)))) {
            if (stryMutAct_9fa48("168")) {
              {}
            } else {
              stryCov_9fa48("168");
              set(stryMutAct_9fa48("169") ? {} : (stryCov_9fa48("169"), {
                phase: phaseOrder[stryMutAct_9fa48("170") ? idx - 1 : (stryCov_9fa48("170"), idx + 1)]
              }));
              get().recomputeActiveTree();
            }
          }
        }
      },
      setActiveTree: stryMutAct_9fa48("171") ? () => undefined : (stryCov_9fa48("171"), activeTree => set(stryMutAct_9fa48("172") ? () => undefined : (stryCov_9fa48("172"), s => stryMutAct_9fa48("173") ? {} : (stryCov_9fa48("173"), {
        activeTree,
        _prevActiveTree: s.activeTree
      })))),
      // === Panel Actions ===
      toggleContextPanel: stryMutAct_9fa48("174") ? () => undefined : (stryCov_9fa48("174"), () => set(stryMutAct_9fa48("175") ? () => undefined : (stryCov_9fa48("175"), s => stryMutAct_9fa48("176") ? {} : (stryCov_9fa48("176"), {
        contextPanelCollapsed: stryMutAct_9fa48("177") ? s.contextPanelCollapsed : (stryCov_9fa48("177"), !s.contextPanelCollapsed)
      })))),
      toggleFlowPanel: stryMutAct_9fa48("178") ? () => undefined : (stryCov_9fa48("178"), () => set(stryMutAct_9fa48("179") ? () => undefined : (stryCov_9fa48("179"), s => stryMutAct_9fa48("180") ? {} : (stryCov_9fa48("180"), {
        flowPanelCollapsed: stryMutAct_9fa48("181") ? s.flowPanelCollapsed : (stryCov_9fa48("181"), !s.flowPanelCollapsed)
      })))),
      toggleComponentPanel: stryMutAct_9fa48("182") ? () => undefined : (stryCov_9fa48("182"), () => set(stryMutAct_9fa48("183") ? () => undefined : (stryCov_9fa48("183"), s => stryMutAct_9fa48("184") ? {} : (stryCov_9fa48("184"), {
        componentPanelCollapsed: stryMutAct_9fa48("185") ? s.componentPanelCollapsed : (stryCov_9fa48("185"), !s.componentPanelCollapsed)
      })))),
      // === Left/Right Persistent Drawer Actions (Epic 1 S1.1) ===
      toggleLeftDrawer: stryMutAct_9fa48("186") ? () => undefined : (stryCov_9fa48("186"), () => set(stryMutAct_9fa48("187") ? () => undefined : (stryCov_9fa48("187"), s => stryMutAct_9fa48("188") ? {} : (stryCov_9fa48("188"), {
        leftDrawerOpen: stryMutAct_9fa48("189") ? s.leftDrawerOpen : (stryCov_9fa48("189"), !s.leftDrawerOpen)
      })))),
      toggleRightDrawer: stryMutAct_9fa48("190") ? () => undefined : (stryCov_9fa48("190"), () => set(stryMutAct_9fa48("191") ? () => undefined : (stryCov_9fa48("191"), s => stryMutAct_9fa48("192") ? {} : (stryCov_9fa48("192"), {
        rightDrawerOpen: stryMutAct_9fa48("193") ? s.rightDrawerOpen : (stryCov_9fa48("193"), !s.rightDrawerOpen)
      })))),
      // [E2] 打开右侧抽屉
      openRightDrawer: stryMutAct_9fa48("194") ? () => undefined : (stryCov_9fa48("194"), () => set(stryMutAct_9fa48("195") ? {} : (stryCov_9fa48("195"), {
        rightDrawerOpen: stryMutAct_9fa48("196") ? false : (stryCov_9fa48("196"), true)
      }))),
      // [E2] 提交画布 — 触发 /submit 命令事件
      submitCanvas: () => {
        if (stryMutAct_9fa48("197")) {
          {}
        } else {
          stryCov_9fa48("197");
          console.log(stryMutAct_9fa48("198") ? "" : (stryCov_9fa48("198"), '[Command] /submit triggered'));
        }
      },
      setLeftDrawerWidth: stryMutAct_9fa48("199") ? () => undefined : (stryCov_9fa48("199"), (width: number) => set(stryMutAct_9fa48("200") ? {} : (stryCov_9fa48("200"), {
        leftDrawerWidth: stryMutAct_9fa48("201") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("201"), Math.min(400, stryMutAct_9fa48("202") ? Math.min(100, width) : (stryCov_9fa48("202"), Math.max(100, width))))
      }))),
      setRightDrawerWidth: stryMutAct_9fa48("203") ? () => undefined : (stryCov_9fa48("203"), (width: number) => set(stryMutAct_9fa48("204") ? {} : (stryCov_9fa48("204"), {
        rightDrawerWidth: stryMutAct_9fa48("205") ? Math.max(400, Math.max(100, width)) : (stryCov_9fa48("205"), Math.min(400, stryMutAct_9fa48("206") ? Math.min(100, width) : (stryCov_9fa48("206"), Math.max(100, width))))
      }))),
      // === Epic 6: Message Slice Actions ===
      addMessage: stryMutAct_9fa48("207") ? () => undefined : (stryCov_9fa48("207"), (msg: Omit<MessageItem, 'id' | 'timestamp'>) => set(stryMutAct_9fa48("208") ? () => undefined : (stryCov_9fa48("208"), s => stryMutAct_9fa48("209") ? {} : (stryCov_9fa48("209"), {
        messages: stryMutAct_9fa48("210") ? [] : (stryCov_9fa48("210"), [...s.messages, stryMutAct_9fa48("211") ? {} : (stryCov_9fa48("211"), {
          ...msg,
          id: newMessageId(),
          timestamp: Date.now()
        })])
      })))),
      clearMessages: stryMutAct_9fa48("212") ? () => undefined : (stryCov_9fa48("212"), () => set(stryMutAct_9fa48("213") ? {} : (stryCov_9fa48("213"), {
        messages: stryMutAct_9fa48("214") ? ["Stryker was here"] : (stryCov_9fa48("214"), [])
      }))),
      // === SSE Status Actions (Epic 1 S1.3) ===
      setSseStatus: stryMutAct_9fa48("215") ? () => undefined : (stryCov_9fa48("215"), (status, error) => set(stryMutAct_9fa48("216") ? {} : (stryCov_9fa48("216"), {
        sseStatus: status,
        sseError: stryMutAct_9fa48("217") ? error && null : (stryCov_9fa48("217"), error ?? null)
      }))),
      abortGeneration: () => {
        if (stryMutAct_9fa48("218")) {
          {}
        } else {
          stryCov_9fa48("218");
          const {
            abortControllerRef
          } = get();
          if (stryMutAct_9fa48("220") ? false : stryMutAct_9fa48("219") ? true : (stryCov_9fa48("219", "220"), abortControllerRef)) {
            if (stryMutAct_9fa48("221")) {
              {}
            } else {
              stryCov_9fa48("221");
              abortControllerRef.abort();
              set(stryMutAct_9fa48("222") ? {} : (stryCov_9fa48("222"), {
                abortControllerRef: null,
                sseStatus: stryMutAct_9fa48("223") ? "" : (stryCov_9fa48("223"), 'idle'),
                flowGenerating: stryMutAct_9fa48("224") ? true : (stryCov_9fa48("224"), false),
                aiThinking: stryMutAct_9fa48("225") ? true : (stryCov_9fa48("225"), false)
              }));
            }
          }
        }
      },
      // === Expand Slice (E2) ===
      leftExpand: stryMutAct_9fa48("226") ? "" : (stryCov_9fa48("226"), 'default'),
      centerExpand: stryMutAct_9fa48("227") ? "" : (stryCov_9fa48("227"), 'default'),
      rightExpand: stryMutAct_9fa48("228") ? "" : (stryCov_9fa48("228"), 'default'),
      getGridTemplate: () => {
        if (stryMutAct_9fa48("229")) {
          {}
        } else {
          stryCov_9fa48("229");
          // F1.4: Old 1.5fr logic removed — always 1fr for three-column layout
          return stryMutAct_9fa48("230") ? "" : (stryCov_9fa48("230"), '1fr 1fr 1fr');
        }
      },
      setLeftExpand: stryMutAct_9fa48("231") ? () => undefined : (stryCov_9fa48("231"), state => set(stryMutAct_9fa48("232") ? {} : (stryCov_9fa48("232"), {
        leftExpand: state
      }))),
      setCenterExpand: stryMutAct_9fa48("233") ? () => undefined : (stryCov_9fa48("233"), state => set(stryMutAct_9fa48("234") ? {} : (stryCov_9fa48("234"), {
        centerExpand: state
      }))),
      setRightExpand: stryMutAct_9fa48("235") ? () => undefined : (stryCov_9fa48("235"), state => set(stryMutAct_9fa48("236") ? {} : (stryCov_9fa48("236"), {
        rightExpand: state
      }))),
      togglePanel: panel => {
        if (stryMutAct_9fa48("237")) {
          {}
        } else {
          stryCov_9fa48("237");
          if (stryMutAct_9fa48("240") ? panel !== 'left' : stryMutAct_9fa48("239") ? false : stryMutAct_9fa48("238") ? true : (stryCov_9fa48("238", "239", "240"), panel === (stryMutAct_9fa48("241") ? "" : (stryCov_9fa48("241"), 'left')))) {
            if (stryMutAct_9fa48("242")) {
              {}
            } else {
              stryCov_9fa48("242");
              const {
                leftExpand
              } = get();
              const next = (stryMutAct_9fa48("245") ? leftExpand !== 'default' : stryMutAct_9fa48("244") ? false : stryMutAct_9fa48("243") ? true : (stryCov_9fa48("243", "244", "245"), leftExpand === (stryMutAct_9fa48("246") ? "" : (stryCov_9fa48("246"), 'default')))) ? stryMutAct_9fa48("247") ? "" : (stryCov_9fa48("247"), 'expand-right') : (stryMutAct_9fa48("250") ? leftExpand !== 'expand-right' : stryMutAct_9fa48("249") ? false : stryMutAct_9fa48("248") ? true : (stryCov_9fa48("248", "249", "250"), leftExpand === (stryMutAct_9fa48("251") ? "" : (stryCov_9fa48("251"), 'expand-right')))) ? stryMutAct_9fa48("252") ? "" : (stryCov_9fa48("252"), 'default') : leftExpand;
              set(stryMutAct_9fa48("253") ? {} : (stryCov_9fa48("253"), {
                leftExpand: next as PanelExpandState
              }));
            }
          } else if (stryMutAct_9fa48("256") ? panel !== 'center' : stryMutAct_9fa48("255") ? false : stryMutAct_9fa48("254") ? true : (stryCov_9fa48("254", "255", "256"), panel === (stryMutAct_9fa48("257") ? "" : (stryCov_9fa48("257"), 'center')))) {
            if (stryMutAct_9fa48("258")) {
              {}
            } else {
              stryCov_9fa48("258");
              const {
                centerExpand
              } = get();
              // 循环: default → expand-left → expand-right → default
              const next = (stryMutAct_9fa48("261") ? centerExpand !== 'default' : stryMutAct_9fa48("260") ? false : stryMutAct_9fa48("259") ? true : (stryCov_9fa48("259", "260", "261"), centerExpand === (stryMutAct_9fa48("262") ? "" : (stryCov_9fa48("262"), 'default')))) ? stryMutAct_9fa48("263") ? "" : (stryCov_9fa48("263"), 'expand-left') : (stryMutAct_9fa48("266") ? centerExpand !== 'expand-left' : stryMutAct_9fa48("265") ? false : stryMutAct_9fa48("264") ? true : (stryCov_9fa48("264", "265", "266"), centerExpand === (stryMutAct_9fa48("267") ? "" : (stryCov_9fa48("267"), 'expand-left')))) ? stryMutAct_9fa48("268") ? "" : (stryCov_9fa48("268"), 'expand-right') : (stryMutAct_9fa48("271") ? centerExpand !== 'expand-right' : stryMutAct_9fa48("270") ? false : stryMutAct_9fa48("269") ? true : (stryCov_9fa48("269", "270", "271"), centerExpand === (stryMutAct_9fa48("272") ? "" : (stryCov_9fa48("272"), 'expand-right')))) ? stryMutAct_9fa48("273") ? "" : (stryCov_9fa48("273"), 'default') : stryMutAct_9fa48("274") ? "" : (stryCov_9fa48("274"), 'default');
              set(stryMutAct_9fa48("275") ? {} : (stryCov_9fa48("275"), {
                centerExpand: next as PanelExpandState
              }));
            }
          } else {
            if (stryMutAct_9fa48("276")) {
              {}
            } else {
              stryCov_9fa48("276");
              const {
                rightExpand
              } = get();
              const next = (stryMutAct_9fa48("279") ? rightExpand !== 'default' : stryMutAct_9fa48("278") ? false : stryMutAct_9fa48("277") ? true : (stryCov_9fa48("277", "278", "279"), rightExpand === (stryMutAct_9fa48("280") ? "" : (stryCov_9fa48("280"), 'default')))) ? stryMutAct_9fa48("281") ? "" : (stryCov_9fa48("281"), 'expand-left') : (stryMutAct_9fa48("284") ? rightExpand !== 'expand-left' : stryMutAct_9fa48("283") ? false : stryMutAct_9fa48("282") ? true : (stryCov_9fa48("282", "283", "284"), rightExpand === (stryMutAct_9fa48("285") ? "" : (stryCov_9fa48("285"), 'expand-left')))) ? stryMutAct_9fa48("286") ? "" : (stryCov_9fa48("286"), 'default') : rightExpand;
              set(stryMutAct_9fa48("287") ? {} : (stryCov_9fa48("287"), {
                rightExpand: next as PanelExpandState
              }));
            }
          }
        }
      },
      resetExpand: stryMutAct_9fa48("288") ? () => undefined : (stryCov_9fa48("288"), () => set(stryMutAct_9fa48("289") ? {} : (stryCov_9fa48("289"), {
        leftExpand: stryMutAct_9fa48("290") ? "" : (stryCov_9fa48("290"), 'default'),
        centerExpand: stryMutAct_9fa48("291") ? "" : (stryCov_9fa48("291"), 'default'),
        rightExpand: stryMutAct_9fa48("292") ? "" : (stryCov_9fa48("292"), 'default'),
        expandMode: stryMutAct_9fa48("293") ? "" : (stryCov_9fa48("293"), 'normal')
      }))),
      // === F1: New expand mode ===
      expandMode: stryMutAct_9fa48("294") ? "" : (stryCov_9fa48("294"), 'normal'),
      setExpandMode: mode => {
        if (stryMutAct_9fa48("295")) {
          {}
        } else {
          stryCov_9fa48("295");
          set(stryMutAct_9fa48("296") ? {} : (stryCov_9fa48("296"), {
            expandMode: mode
          }));
          // Persist to localStorage
          try {
            if (stryMutAct_9fa48("297")) {
              {}
            } else {
              stryCov_9fa48("297");
              localStorage.setItem(stryMutAct_9fa48("298") ? "" : (stryCov_9fa48("298"), 'canvas-expand-mode'), mode);
            }
          } catch {
            // ignore quota errors
          }
        }
      },
      toggleMaximize: () => {
        if (stryMutAct_9fa48("299")) {
          {}
        } else {
          stryCov_9fa48("299");
          const next = (stryMutAct_9fa48("302") ? get().expandMode !== 'maximize' : stryMutAct_9fa48("301") ? false : stryMutAct_9fa48("300") ? true : (stryCov_9fa48("300", "301", "302"), get().expandMode === (stryMutAct_9fa48("303") ? "" : (stryCov_9fa48("303"), 'maximize')))) ? stryMutAct_9fa48("304") ? "" : (stryCov_9fa48("304"), 'normal') : stryMutAct_9fa48("305") ? "" : (stryCov_9fa48("305"), 'maximize');
          set(stryMutAct_9fa48("306") ? {} : (stryCov_9fa48("306"), {
            expandMode: next
          }));
          try {
            if (stryMutAct_9fa48("307")) {
              {}
            } else {
              stryCov_9fa48("307");
              localStorage.setItem(stryMutAct_9fa48("308") ? "" : (stryCov_9fa48("308"), 'canvas-expand-mode'), next);
            }
          } catch {
            // ignore
          }
        }
      },
      // === Context Slice Actions ===
      setContextNodes: nodes => {
        if (stryMutAct_9fa48("309")) {
          {}
        } else {
          stryCov_9fa48("309");
          set(stryMutAct_9fa48("310") ? {} : (stryCov_9fa48("310"), {
            contextNodes: nodes
          }));
          useContextStore.getState().setContextNodes(nodes);
        }
      },
      addContextNode: data => {
        if (stryMutAct_9fa48("311")) {
          {}
        } else {
          stryCov_9fa48("311");
          const newNode: BoundedContextNode = stryMutAct_9fa48("312") ? {} : (stryCov_9fa48("312"), {
            nodeId: generateId(),
            name: data.name,
            description: data.description,
            type: data.type,
            isActive: stryMutAct_9fa48("313") ? true : (stryCov_9fa48("313"), false),
            status: stryMutAct_9fa48("314") ? "" : (stryCov_9fa48("314"), 'pending'),
            children: stryMutAct_9fa48("315") ? ["Stryker was here"] : (stryCov_9fa48("315"), [])
          });
          set(s => {
            if (stryMutAct_9fa48("316")) {
              {}
            } else {
              stryCov_9fa48("316");
              const newNodes = stryMutAct_9fa48("317") ? [] : (stryCov_9fa48("317"), [...s.contextNodes, stryMutAct_9fa48("318") ? {} : (stryCov_9fa48("318"), {
                ...newNode
              })]);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("319") ? "" : (stryCov_9fa48("319"), 'context'), newNodes);
              return stryMutAct_9fa48("320") ? {} : (stryCov_9fa48("320"), {
                contextNodes: newNodes
              });
            }
          });
          useContextStore.getState().addContextNode(data);
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("321") ? {} : (stryCov_9fa48("321"), {
            type: stryMutAct_9fa48("322") ? "" : (stryCov_9fa48("322"), 'user_action'),
            content: stryMutAct_9fa48("323") ? `` : (stryCov_9fa48("323"), `添加了上下文节点`),
            meta: data.name
          }));
        }
      },
      editContextNode: (nodeId, data) => {
        if (stryMutAct_9fa48("324")) {
          {}
        } else {
          stryCov_9fa48("324");
          set(s => {
            if (stryMutAct_9fa48("325")) {
              {}
            } else {
              stryCov_9fa48("325");
              const newNodes = s.contextNodes.map(stryMutAct_9fa48("326") ? () => undefined : (stryCov_9fa48("326"), n => (stryMutAct_9fa48("329") ? n.nodeId !== nodeId : stryMutAct_9fa48("328") ? false : stryMutAct_9fa48("327") ? true : (stryCov_9fa48("327", "328", "329"), n.nodeId === nodeId)) ? stryMutAct_9fa48("330") ? {} : (stryCov_9fa48("330"), {
                ...n,
                ...data,
                status: 'pending' as const
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("331") ? "" : (stryCov_9fa48("331"), 'context'), newNodes);
              return stryMutAct_9fa48("332") ? {} : (stryCov_9fa48("332"), {
                contextNodes: newNodes
              });
            }
          });
          useContextStore.getState().editContextNode(nodeId, data);
        }
      },
      deleteContextNode: nodeId => {
        if (stryMutAct_9fa48("333")) {
          {}
        } else {
          stryCov_9fa48("333");
          const nodeToDelete = get().contextNodes.find(stryMutAct_9fa48("334") ? () => undefined : (stryCov_9fa48("334"), n => stryMutAct_9fa48("337") ? n.nodeId !== nodeId : stryMutAct_9fa48("336") ? false : stryMutAct_9fa48("335") ? true : (stryCov_9fa48("335", "336", "337"), n.nodeId === nodeId)));
          const deletedName = stryMutAct_9fa48("338") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("338"), (stryMutAct_9fa48("339") ? nodeToDelete.name : (stryCov_9fa48("339"), nodeToDelete?.name)) ?? nodeId);
          set(s => {
            if (stryMutAct_9fa48("340")) {
              {}
            } else {
              stryCov_9fa48("340");
              const newNodes = stryMutAct_9fa48("341") ? s.contextNodes : (stryCov_9fa48("341"), s.contextNodes.filter(stryMutAct_9fa48("342") ? () => undefined : (stryCov_9fa48("342"), n => stryMutAct_9fa48("345") ? n.nodeId === nodeId : stryMutAct_9fa48("344") ? false : stryMutAct_9fa48("343") ? true : (stryCov_9fa48("343", "344", "345"), n.nodeId !== nodeId))));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("346") ? "" : (stryCov_9fa48("346"), 'context'), newNodes);
              return stryMutAct_9fa48("347") ? {} : (stryCov_9fa48("347"), {
                contextNodes: newNodes
              });
            }
          });
          useContextStore.getState().deleteContextNode(nodeId);
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("348") ? {} : (stryCov_9fa48("348"), {
            type: stryMutAct_9fa48("349") ? "" : (stryCov_9fa48("349"), 'user_action'),
            content: stryMutAct_9fa48("350") ? `` : (stryCov_9fa48("350"), `删除了上下文节点`),
            meta: deletedName
          }));
        }
      },
      confirmContextNode: nodeId => {
        if (stryMutAct_9fa48("351")) {
          {}
        } else {
          stryCov_9fa48("351");
          set(s => {
            if (stryMutAct_9fa48("352")) {
              {}
            } else {
              stryCov_9fa48("352");
              const newNodes = s.contextNodes.map(stryMutAct_9fa48("353") ? () => undefined : (stryCov_9fa48("353"), n => (stryMutAct_9fa48("356") ? n.nodeId !== nodeId : stryMutAct_9fa48("355") ? false : stryMutAct_9fa48("354") ? true : (stryCov_9fa48("354", "355", "356"), n.nodeId === nodeId)) ? stryMutAct_9fa48("357") ? {} : (stryCov_9fa48("357"), {
                ...n,
                isActive: stryMutAct_9fa48("358") ? false : (stryCov_9fa48("358"), true),
                status: 'confirmed' as const
              }) : n));
              return stryMutAct_9fa48("359") ? {} : (stryCov_9fa48("359"), {
                contextNodes: newNodes
              });
            }
          });
          useContextStore.getState().confirmContextNode(nodeId);
        }
      },
      toggleContextNode: nodeId => {
        if (stryMutAct_9fa48("360")) {
          {}
        } else {
          stryCov_9fa48("360");
          set(s => {
            if (stryMutAct_9fa48("361")) {
              {}
            } else {
              stryCov_9fa48("361");
              const node = s.contextNodes.find(stryMutAct_9fa48("362") ? () => undefined : (stryCov_9fa48("362"), n => stryMutAct_9fa48("365") ? n.nodeId !== nodeId : stryMutAct_9fa48("364") ? false : stryMutAct_9fa48("363") ? true : (stryCov_9fa48("363", "364", "365"), n.nodeId === nodeId)));
              if (stryMutAct_9fa48("368") ? false : stryMutAct_9fa48("367") ? true : stryMutAct_9fa48("366") ? node : (stryCov_9fa48("366", "367", "368"), !node)) return {};
              const isConfirmed = stryMutAct_9fa48("371") ? node.status !== 'confirmed' : stryMutAct_9fa48("370") ? false : stryMutAct_9fa48("369") ? true : (stryCov_9fa48("369", "370", "371"), node.status === (stryMutAct_9fa48("372") ? "" : (stryCov_9fa48("372"), 'confirmed')));
              const newNodes = s.contextNodes.map(stryMutAct_9fa48("373") ? () => undefined : (stryCov_9fa48("373"), n => (stryMutAct_9fa48("376") ? n.nodeId !== nodeId : stryMutAct_9fa48("375") ? false : stryMutAct_9fa48("374") ? true : (stryCov_9fa48("374", "375", "376"), n.nodeId === nodeId)) ? stryMutAct_9fa48("377") ? {} : (stryCov_9fa48("377"), {
                ...n,
                isActive: isConfirmed ? stryMutAct_9fa48("378") ? true : (stryCov_9fa48("378"), false) : stryMutAct_9fa48("379") ? false : (stryCov_9fa48("379"), true),
                status: isConfirmed ? 'pending' as const : 'confirmed' as const
              }) : n));
              return stryMutAct_9fa48("380") ? {} : (stryCov_9fa48("380"), {
                contextNodes: newNodes
              });
            }
          });
        }
      },
      setContextDraft: draft => {
        if (stryMutAct_9fa48("381")) {
          {}
        } else {
          stryCov_9fa48("381");
          set(stryMutAct_9fa48("382") ? {} : (stryCov_9fa48("382"), {
            contextDraft: draft
          }));
          useContextStore.getState().setContextDraft(draft);
        }
      },
      // === Flow Slice Actions ===
      setFlowNodes: stryMutAct_9fa48("383") ? () => undefined : (stryCov_9fa48("383"), nodes => set(stryMutAct_9fa48("384") ? {} : (stryCov_9fa48("384"), {
        flowNodes: nodes
      }))),
      addFlowNode: data => {
        if (stryMutAct_9fa48("385")) {
          {}
        } else {
          stryCov_9fa48("385");
          const newNode: BusinessFlowNode = stryMutAct_9fa48("386") ? {} : (stryCov_9fa48("386"), {
            nodeId: generateId(),
            contextId: data.contextId,
            name: data.name,
            steps: data.steps.map(stryMutAct_9fa48("387") ? () => undefined : (stryCov_9fa48("387"), (s, i) => stryMutAct_9fa48("388") ? {} : (stryCov_9fa48("388"), {
              ...s,
              stepId: generateId(),
              status: 'pending' as const,
              isActive: stryMutAct_9fa48("389") ? true : (stryCov_9fa48("389"), false),
              order: i
            }))),
            isActive: stryMutAct_9fa48("390") ? true : (stryCov_9fa48("390"), false),
            status: stryMutAct_9fa48("391") ? "" : (stryCov_9fa48("391"), 'pending'),
            children: stryMutAct_9fa48("392") ? ["Stryker was here"] : (stryCov_9fa48("392"), [])
          });
          set(s => {
            if (stryMutAct_9fa48("393")) {
              {}
            } else {
              stryCov_9fa48("393");
              const newNodes = stryMutAct_9fa48("394") ? [] : (stryCov_9fa48("394"), [...s.flowNodes, newNode]);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("395") ? "" : (stryCov_9fa48("395"), 'flow'), newNodes);
              return stryMutAct_9fa48("396") ? {} : (stryCov_9fa48("396"), {
                flowNodes: newNodes
              });
            }
          });
          // Epic 4: auto-append user_action message
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("397") ? {} : (stryCov_9fa48("397"), {
            type: stryMutAct_9fa48("398") ? "" : (stryCov_9fa48("398"), 'user_action'),
            content: stryMutAct_9fa48("399") ? `` : (stryCov_9fa48("399"), `添加了流程节点`),
            meta: data.name
          }));
        }
      },
      editFlowNode: (nodeId, data) => {
        if (stryMutAct_9fa48("400")) {
          {}
        } else {
          stryCov_9fa48("400");
          set(s => {
            if (stryMutAct_9fa48("401")) {
              {}
            } else {
              stryCov_9fa48("401");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("402") ? () => undefined : (stryCov_9fa48("402"), n => (stryMutAct_9fa48("405") ? n.nodeId !== nodeId : stryMutAct_9fa48("404") ? false : stryMutAct_9fa48("403") ? true : (stryCov_9fa48("403", "404", "405"), n.nodeId === nodeId)) ? stryMutAct_9fa48("406") ? {} : (stryCov_9fa48("406"), {
                ...n,
                ...data,
                status: 'pending' as const
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("407") ? "" : (stryCov_9fa48("407"), 'flow'), newNodes);
              return stryMutAct_9fa48("408") ? {} : (stryCov_9fa48("408"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      // [E1] 确认流程节点
      confirmFlowNode: nodeId => {
        if (stryMutAct_9fa48("409")) {
          {}
        } else {
          stryCov_9fa48("409");
          set(s => {
            if (stryMutAct_9fa48("410")) {
              {}
            } else {
              stryCov_9fa48("410");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("411") ? () => undefined : (stryCov_9fa48("411"), n => (stryMutAct_9fa48("414") ? n.nodeId !== nodeId : stryMutAct_9fa48("413") ? false : stryMutAct_9fa48("412") ? true : (stryCov_9fa48("412", "413", "414"), n.nodeId === nodeId)) ? stryMutAct_9fa48("415") ? {} : (stryCov_9fa48("415"), {
                ...n,
                isActive: stryMutAct_9fa48("416") ? false : (stryCov_9fa48("416"), true),
                status: 'confirmed' as const
              }) : n));
              return stryMutAct_9fa48("417") ? {} : (stryCov_9fa48("417"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      // [E1] 切换流程节点确认状态
      toggleFlowNode: nodeId => {
        if (stryMutAct_9fa48("418")) {
          {}
        } else {
          stryCov_9fa48("418");
          set(s => {
            if (stryMutAct_9fa48("419")) {
              {}
            } else {
              stryCov_9fa48("419");
              const newNodes = s.flowNodes.map(n => {
                if (stryMutAct_9fa48("420")) {
                  {}
                } else {
                  stryCov_9fa48("420");
                  if (stryMutAct_9fa48("423") ? n.nodeId === nodeId : stryMutAct_9fa48("422") ? false : stryMutAct_9fa48("421") ? true : (stryCov_9fa48("421", "422", "423"), n.nodeId !== nodeId)) return n;
                  const isConfirmed = stryMutAct_9fa48("426") ? n.status !== 'confirmed' : stryMutAct_9fa48("425") ? false : stryMutAct_9fa48("424") ? true : (stryCov_9fa48("424", "425", "426"), n.status === (stryMutAct_9fa48("427") ? "" : (stryCov_9fa48("427"), 'confirmed')));
                  return stryMutAct_9fa48("428") ? {} : (stryCov_9fa48("428"), {
                    ...n,
                    isActive: stryMutAct_9fa48("429") ? isConfirmed : (stryCov_9fa48("429"), !isConfirmed),
                    status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                  });
                }
              });
              return stryMutAct_9fa48("430") ? {} : (stryCov_9fa48("430"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      // [E1] 确认步骤 — 在流程节点内设置指定 stepId 的步骤为 confirmed
      confirmStep: (flowNodeId, stepId) => {
        if (stryMutAct_9fa48("431")) {
          {}
        } else {
          stryCov_9fa48("431");
          set(s => {
            if (stryMutAct_9fa48("432")) {
              {}
            } else {
              stryCov_9fa48("432");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("433") ? () => undefined : (stryCov_9fa48("433"), n => (stryMutAct_9fa48("436") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("435") ? false : stryMutAct_9fa48("434") ? true : (stryCov_9fa48("434", "435", "436"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("437") ? {} : (stryCov_9fa48("437"), {
                ...n,
                steps: n.steps.map(stryMutAct_9fa48("438") ? () => undefined : (stryCov_9fa48("438"), step => (stryMutAct_9fa48("441") ? step.stepId !== stepId : stryMutAct_9fa48("440") ? false : stryMutAct_9fa48("439") ? true : (stryCov_9fa48("439", "440", "441"), step.stepId === stepId)) ? stryMutAct_9fa48("442") ? {} : (stryCov_9fa48("442"), {
                  ...step,
                  isActive: stryMutAct_9fa48("443") ? false : (stryCov_9fa48("443"), true),
                  status: 'confirmed' as const
                }) : step))
              }) : n));
              return stryMutAct_9fa48("444") ? {} : (stryCov_9fa48("444"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      deleteFlowNode: nodeId => {
        if (stryMutAct_9fa48("445")) {
          {}
        } else {
          stryCov_9fa48("445");
          const nodeToDelete = get().flowNodes.find(stryMutAct_9fa48("446") ? () => undefined : (stryCov_9fa48("446"), n => stryMutAct_9fa48("449") ? n.nodeId !== nodeId : stryMutAct_9fa48("448") ? false : stryMutAct_9fa48("447") ? true : (stryCov_9fa48("447", "448", "449"), n.nodeId === nodeId)));
          const deletedName = stryMutAct_9fa48("450") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("450"), (stryMutAct_9fa48("451") ? nodeToDelete.name : (stryCov_9fa48("451"), nodeToDelete?.name)) ?? nodeId);
          set(s => {
            if (stryMutAct_9fa48("452")) {
              {}
            } else {
              stryCov_9fa48("452");
              const newNodes = stryMutAct_9fa48("453") ? s.flowNodes : (stryCov_9fa48("453"), s.flowNodes.filter(stryMutAct_9fa48("454") ? () => undefined : (stryCov_9fa48("454"), n => stryMutAct_9fa48("457") ? n.nodeId === nodeId : stryMutAct_9fa48("456") ? false : stryMutAct_9fa48("455") ? true : (stryCov_9fa48("455", "456", "457"), n.nodeId !== nodeId))));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("458") ? "" : (stryCov_9fa48("458"), 'flow'), newNodes);
              return stryMutAct_9fa48("459") ? {} : (stryCov_9fa48("459"), {
                flowNodes: newNodes
              });
            }
          });
          // Epic 4: auto-append user_action message
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("460") ? {} : (stryCov_9fa48("460"), {
            type: stryMutAct_9fa48("461") ? "" : (stryCov_9fa48("461"), 'user_action'),
            content: stryMutAct_9fa48("462") ? `` : (stryCov_9fa48("462"), `删除了流程节点`),
            meta: deletedName
          }));
        }
      },
      setFlowDraft: stryMutAct_9fa48("463") ? () => undefined : (stryCov_9fa48("463"), draft => set(stryMutAct_9fa48("464") ? {} : (stryCov_9fa48("464"), {
        flowDraft: draft
      }))),
      // === Step Actions (Epic 3) ===
      addStepToFlow: (flowNodeId, data) => {
        if (stryMutAct_9fa48("465")) {
          {}
        } else {
          stryCov_9fa48("465");
          set(s => {
            if (stryMutAct_9fa48("466")) {
              {}
            } else {
              stryCov_9fa48("466");
              const newNodes = s.flowNodes.map(n => {
                if (stryMutAct_9fa48("467")) {
                  {}
                } else {
                  stryCov_9fa48("467");
                  if (stryMutAct_9fa48("470") ? n.nodeId === flowNodeId : stryMutAct_9fa48("469") ? false : stryMutAct_9fa48("468") ? true : (stryCov_9fa48("468", "469", "470"), n.nodeId !== flowNodeId)) return n;
                  const newStep: FlowStep = stryMutAct_9fa48("471") ? {} : (stryCov_9fa48("471"), {
                    stepId: generateId(),
                    name: data.name,
                    actor: stryMutAct_9fa48("472") ? data.actor && '待定' : (stryCov_9fa48("472"), data.actor ?? (stryMutAct_9fa48("473") ? "" : (stryCov_9fa48("473"), '待定'))),
                    description: stryMutAct_9fa48("474") ? data.description && '' : (stryCov_9fa48("474"), data.description ?? (stryMutAct_9fa48("475") ? "Stryker was here!" : (stryCov_9fa48("475"), ''))),
                    order: n.steps.length,
                    isActive: stryMutAct_9fa48("476") ? true : (stryCov_9fa48("476"), false),
                    status: 'pending' as const
                  });
                  return stryMutAct_9fa48("477") ? {} : (stryCov_9fa48("477"), {
                    ...n,
                    steps: stryMutAct_9fa48("478") ? [] : (stryCov_9fa48("478"), [...n.steps, newStep]),
                    status: 'pending' as const
                  });
                }
              });
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("479") ? "" : (stryCov_9fa48("479"), 'flow'), newNodes);
              return stryMutAct_9fa48("480") ? {} : (stryCov_9fa48("480"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      editStep: (flowNodeId, stepId, data) => {
        if (stryMutAct_9fa48("481")) {
          {}
        } else {
          stryCov_9fa48("481");
          set(s => {
            if (stryMutAct_9fa48("482")) {
              {}
            } else {
              stryCov_9fa48("482");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("483") ? () => undefined : (stryCov_9fa48("483"), n => (stryMutAct_9fa48("486") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("485") ? false : stryMutAct_9fa48("484") ? true : (stryCov_9fa48("484", "485", "486"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("487") ? {} : (stryCov_9fa48("487"), {
                ...n,
                status: 'pending' as const,
                steps: n.steps.map(stryMutAct_9fa48("488") ? () => undefined : (stryCov_9fa48("488"), st => (stryMutAct_9fa48("491") ? st.stepId !== stepId : stryMutAct_9fa48("490") ? false : stryMutAct_9fa48("489") ? true : (stryCov_9fa48("489", "490", "491"), st.stepId === stepId)) ? stryMutAct_9fa48("492") ? {} : (stryCov_9fa48("492"), {
                  ...st,
                  ...data,
                  status: 'pending' as const
                }) : st))
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("493") ? "" : (stryCov_9fa48("493"), 'flow'), newNodes);
              return stryMutAct_9fa48("494") ? {} : (stryCov_9fa48("494"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      deleteStep: (flowNodeId, stepId) => {
        if (stryMutAct_9fa48("495")) {
          {}
        } else {
          stryCov_9fa48("495");
          set(s => {
            if (stryMutAct_9fa48("496")) {
              {}
            } else {
              stryCov_9fa48("496");
              const newNodes = s.flowNodes.map(stryMutAct_9fa48("497") ? () => undefined : (stryCov_9fa48("497"), n => (stryMutAct_9fa48("500") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("499") ? false : stryMutAct_9fa48("498") ? true : (stryCov_9fa48("498", "499", "500"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("501") ? {} : (stryCov_9fa48("501"), {
                ...n,
                steps: stryMutAct_9fa48("502") ? n.steps : (stryCov_9fa48("502"), n.steps.filter(stryMutAct_9fa48("503") ? () => undefined : (stryCov_9fa48("503"), st => stryMutAct_9fa48("506") ? st.stepId === stepId : stryMutAct_9fa48("505") ? false : stryMutAct_9fa48("504") ? true : (stryCov_9fa48("504", "505", "506"), st.stepId !== stepId))))
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("507") ? "" : (stryCov_9fa48("507"), 'flow'), newNodes);
              return stryMutAct_9fa48("508") ? {} : (stryCov_9fa48("508"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      reorderSteps: (flowNodeId, fromIndex, toIndex) => {
        if (stryMutAct_9fa48("509")) {
          {}
        } else {
          stryCov_9fa48("509");
          set(s => {
            if (stryMutAct_9fa48("510")) {
              {}
            } else {
              stryCov_9fa48("510");
              const newNodes = s.flowNodes.map(n => {
                if (stryMutAct_9fa48("511")) {
                  {}
                } else {
                  stryCov_9fa48("511");
                  if (stryMutAct_9fa48("514") ? n.nodeId === flowNodeId : stryMutAct_9fa48("513") ? false : stryMutAct_9fa48("512") ? true : (stryCov_9fa48("512", "513", "514"), n.nodeId !== flowNodeId)) return n;
                  const steps = stryMutAct_9fa48("515") ? [] : (stryCov_9fa48("515"), [...n.steps]);
                  const [moved] = steps.splice(fromIndex, 1);
                  const insertAt = (stryMutAct_9fa48("519") ? fromIndex >= toIndex : stryMutAct_9fa48("518") ? fromIndex <= toIndex : stryMutAct_9fa48("517") ? false : stryMutAct_9fa48("516") ? true : (stryCov_9fa48("516", "517", "518", "519"), fromIndex < toIndex)) ? stryMutAct_9fa48("520") ? toIndex + 1 : (stryCov_9fa48("520"), toIndex - 1) : toIndex;
                  steps.splice(insertAt, 0, moved);
                  return stryMutAct_9fa48("521") ? {} : (stryCov_9fa48("521"), {
                    ...n,
                    steps: steps.map(stryMutAct_9fa48("522") ? () => undefined : (stryCov_9fa48("522"), (st, i) => stryMutAct_9fa48("523") ? {} : (stryCov_9fa48("523"), {
                      ...st,
                      order: i
                    }))),
                    status: 'pending' as const
                  });
                }
              });
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("524") ? "" : (stryCov_9fa48("524"), 'flow'), newNodes);
              return stryMutAct_9fa48("525") ? {} : (stryCov_9fa48("525"), {
                flowNodes: newNodes
              });
            }
          });
        }
      },
      // === Auto-generation (Epic 3 S3.1) ===
      autoGenerateFlows: async contexts => {
        if (stryMutAct_9fa48("526")) {
          {}
        } else {
          stryCov_9fa48("526");
          const {
            setFlowGenerating,
            setPhase
          } = get();
          setFlowGenerating(stryMutAct_9fa48("527") ? false : (stryCov_9fa48("527"), true), stryMutAct_9fa48("528") ? "" : (stryCov_9fa48("528"), '正在生成流程树...'));
          try {
            if (stryMutAct_9fa48("529")) {
              {}
            } else {
              stryCov_9fa48("529");
              const {
                projectId
              } = get();
              const sessionId = stryMutAct_9fa48("530") ? projectId && `session-${Date.now()}` : (stryCov_9fa48("530"), projectId ?? (stryMutAct_9fa48("531") ? `` : (stryCov_9fa48("531"), `session-${Date.now()}`)));

              // Map context nodes to API format (user-edited data)
              const mappedContexts = contexts.map(stryMutAct_9fa48("532") ? () => undefined : (stryCov_9fa48("532"), ctx => stryMutAct_9fa48("533") ? {} : (stryCov_9fa48("533"), {
                id: ctx.nodeId,
                name: ctx.name,
                description: stryMutAct_9fa48("534") ? ctx.description && '' : (stryCov_9fa48("534"), ctx.description ?? (stryMutAct_9fa48("535") ? "Stryker was here!" : (stryCov_9fa48("535"), ''))),
                type: ctx.type
              })));
              const result = await canvasApi.generateFlows(stryMutAct_9fa48("536") ? {} : (stryCov_9fa48("536"), {
                contexts: mappedContexts,
                sessionId
              }));
              if (stryMutAct_9fa48("539") ? result.success && result.flows || result.flows.length > 0 : stryMutAct_9fa48("538") ? false : stryMutAct_9fa48("537") ? true : (stryCov_9fa48("537", "538", "539"), (stryMutAct_9fa48("541") ? result.success || result.flows : stryMutAct_9fa48("540") ? true : (stryCov_9fa48("540", "541"), result.success && result.flows)) && (stryMutAct_9fa48("544") ? result.flows.length <= 0 : stryMutAct_9fa48("543") ? result.flows.length >= 0 : stryMutAct_9fa48("542") ? true : (stryCov_9fa48("542", "543", "544"), result.flows.length > 0)))) {
                if (stryMutAct_9fa48("545")) {
                  {}
                } else {
                  stryCov_9fa48("545");
                  const flows: BusinessFlowNode[] = result.flows.map(stryMutAct_9fa48("546") ? () => undefined : (stryCov_9fa48("546"), f => stryMutAct_9fa48("547") ? {} : (stryCov_9fa48("547"), {
                    nodeId: generateId(),
                    contextId: f.contextId,
                    name: f.name,
                    steps: f.steps.map(stryMutAct_9fa48("548") ? () => undefined : (stryCov_9fa48("548"), (step, idx) => stryMutAct_9fa48("549") ? {} : (stryCov_9fa48("549"), {
                      stepId: generateId(),
                      name: step.name,
                      actor: step.actor,
                      description: step.description,
                      order: stryMutAct_9fa48("550") ? step.order && idx : (stryCov_9fa48("550"), step.order ?? idx),
                      isActive: stryMutAct_9fa48("551") ? true : (stryCov_9fa48("551"), false),
                      status: 'pending' as const
                    }))),
                    isActive: stryMutAct_9fa48("552") ? true : (stryCov_9fa48("552"), false),
                    status: 'pending' as const,
                    children: stryMutAct_9fa48("553") ? ["Stryker was here"] : (stryCov_9fa48("553"), [])
                  })));
                  set(stryMutAct_9fa48("554") ? {} : (stryCov_9fa48("554"), {
                    flowNodes: flows
                  }));
                  setPhase(stryMutAct_9fa48("555") ? "" : (stryCov_9fa48("555"), 'flow'));
                }
              } else {
                if (stryMutAct_9fa48("556")) {
                  {}
                } else {
                  stryCov_9fa48("556");
                  console.error(stryMutAct_9fa48("557") ? "" : (stryCov_9fa48("557"), '[canvasStore] generateFlows: API returned no flows'), result.error);
                }
              }
            }
          } catch (err) {
            if (stryMutAct_9fa48("558")) {
              {}
            } else {
              stryCov_9fa48("558");
              console.error(stryMutAct_9fa48("559") ? "" : (stryCov_9fa48("559"), '[canvasStore] autoGenerateFlows error:'), err);
            }
          } finally {
            if (stryMutAct_9fa48("560")) {
              {}
            } else {
              stryCov_9fa48("560");
              setFlowGenerating(stryMutAct_9fa48("561") ? true : (stryCov_9fa48("561"), false), null);
            }
          }
        }
      },
      // === Manual Component Generation (Epic 4) ===
      generateComponentFromFlow: async () => {
        if (stryMutAct_9fa48("562")) {
          {}
        } else {
          stryCov_9fa48("562");
          const {
            contextNodes,
            flowNodes
          } = get();
          if (stryMutAct_9fa48("565") ? flowNodes.length !== 0 : stryMutAct_9fa48("564") ? false : stryMutAct_9fa48("563") ? true : (stryCov_9fa48("563", "564", "565"), flowNodes.length === 0)) {
            if (stryMutAct_9fa48("566")) {
              {}
            } else {
              stryCov_9fa48("566");
              console.warn(stryMutAct_9fa48("567") ? "" : (stryCov_9fa48("567"), '[canvasStore] generateComponentFromFlow: no flow nodes'));
              return;
            }
          }
          try {
            if (stryMutAct_9fa48("568")) {
              {}
            } else {
              stryCov_9fa48("568");
              // E2: Only send confirmed nodes to the API
              const confirmedContexts = stryMutAct_9fa48("569") ? contextNodes : (stryCov_9fa48("569"), contextNodes.filter(stryMutAct_9fa48("570") ? () => undefined : (stryCov_9fa48("570"), ctx => stryMutAct_9fa48("573") ? ctx.status !== 'confirmed' : stryMutAct_9fa48("572") ? false : stryMutAct_9fa48("571") ? true : (stryCov_9fa48("571", "572", "573"), ctx.status === (stryMutAct_9fa48("574") ? "" : (stryCov_9fa48("574"), 'confirmed'))))));
              const confirmedFlows = stryMutAct_9fa48("575") ? flowNodes : (stryCov_9fa48("575"), flowNodes.filter(stryMutAct_9fa48("576") ? () => undefined : (stryCov_9fa48("576"), f => stryMutAct_9fa48("579") ? f.status !== 'confirmed' : stryMutAct_9fa48("578") ? false : stryMutAct_9fa48("577") ? true : (stryCov_9fa48("577", "578", "579"), f.status === (stryMutAct_9fa48("580") ? "" : (stryCov_9fa48("580"), 'confirmed'))))));
              const mappedContexts = confirmedContexts.map(stryMutAct_9fa48("581") ? () => undefined : (stryCov_9fa48("581"), ctx => stryMutAct_9fa48("582") ? {} : (stryCov_9fa48("582"), {
                id: ctx.nodeId,
                name: ctx.name,
                description: stryMutAct_9fa48("583") ? ctx.description && '' : (stryCov_9fa48("583"), ctx.description ?? (stryMutAct_9fa48("584") ? "Stryker was here!" : (stryCov_9fa48("584"), ''))),
                type: ctx.type
              })));
              const mappedFlows = confirmedFlows.map(stryMutAct_9fa48("585") ? () => undefined : (stryCov_9fa48("585"), f => stryMutAct_9fa48("586") ? {} : (stryCov_9fa48("586"), {
                name: f.name,
                contextId: f.contextId,
                steps: f.steps.map(stryMutAct_9fa48("587") ? () => undefined : (stryCov_9fa48("587"), s => stryMutAct_9fa48("588") ? {} : (stryCov_9fa48("588"), {
                  name: s.name,
                  actor: s.actor
                })))
              })));
              const {
                projectId
              } = get();
              const sessionId = stryMutAct_9fa48("589") ? projectId && `session-${Date.now()}` : (stryCov_9fa48("589"), projectId ?? (stryMutAct_9fa48("590") ? `` : (stryCov_9fa48("590"), `session-${Date.now()}`)));
              const result = await canvasApi.generateComponents(stryMutAct_9fa48("591") ? {} : (stryCov_9fa48("591"), {
                contexts: mappedContexts,
                flows: mappedFlows,
                sessionId
              }));
              if (stryMutAct_9fa48("594") ? result.success || result.components : stryMutAct_9fa48("593") ? false : stryMutAct_9fa48("592") ? true : (stryCov_9fa48("592", "593", "594"), result.success && result.components)) {
                if (stryMutAct_9fa48("595")) {
                  {}
                } else {
                  stryCov_9fa48("595");
                  // E1: Defensive parsing — validate and sanitize each component
                  const validTypes = ['page', 'form', 'list', 'detail', 'modal'] as const;
                  const validMethods = ['GET', 'POST'] as const;
                  const newNodes: ComponentNode[] = result.components.map(c => {
                    if (stryMutAct_9fa48("596")) {
                      {}
                    } else {
                      stryCov_9fa48("596");
                      const type = (stryMutAct_9fa48("599") ? c.type || validTypes.includes(c.type as typeof validTypes[number]) : stryMutAct_9fa48("598") ? false : stryMutAct_9fa48("597") ? true : (stryCov_9fa48("597", "598", "599"), c.type && validTypes.includes(c.type as typeof validTypes[number]))) ? c.type as ComponentNode['type'] : stryMutAct_9fa48("600") ? "" : (stryCov_9fa48("600"), 'page');
                      const method = (stryMutAct_9fa48("603") ? c.api?.method || validMethods.includes(c.api.method as typeof validMethods[number]) : stryMutAct_9fa48("602") ? false : stryMutAct_9fa48("601") ? true : (stryCov_9fa48("601", "602", "603"), (stryMutAct_9fa48("604") ? c.api.method : (stryCov_9fa48("604"), c.api?.method)) && validMethods.includes(c.api.method as typeof validMethods[number]))) ? c.api.method : stryMutAct_9fa48("605") ? "" : (stryCov_9fa48("605"), 'GET');
                      const flowId = (stryMutAct_9fa48("608") ? c.flowId || c.flowId !== 'unknown' : stryMutAct_9fa48("607") ? false : stryMutAct_9fa48("606") ? true : (stryCov_9fa48("606", "607", "608"), c.flowId && (stryMutAct_9fa48("610") ? c.flowId === 'unknown' : stryMutAct_9fa48("609") ? true : (stryCov_9fa48("609", "610"), c.flowId !== (stryMutAct_9fa48("611") ? "" : (stryCov_9fa48("611"), 'unknown')))))) ? c.flowId : stryMutAct_9fa48("612") ? "Stryker was here!" : (stryCov_9fa48("612"), '');
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
                  set(stryMutAct_9fa48("613") ? {} : (stryCov_9fa48("613"), {
                    componentNodes: newNodes
                  }));
                  get().setPhase(stryMutAct_9fa48("614") ? "" : (stryCov_9fa48("614"), 'component'));
                  useCanvasStore.getState().addMessage(stryMutAct_9fa48("615") ? {} : (stryCov_9fa48("615"), {
                    type: stryMutAct_9fa48("616") ? "" : (stryCov_9fa48("616"), 'user_action'),
                    content: stryMutAct_9fa48("617") ? `` : (stryCov_9fa48("617"), `生成了 ${newNodes.length} 个组件节点`)
                  }));
                }
              } else {
                if (stryMutAct_9fa48("618")) {
                  {}
                } else {
                  stryCov_9fa48("618");
                  console.error(stryMutAct_9fa48("619") ? "" : (stryCov_9fa48("619"), '[canvasStore] generateComponentFromFlow: no components'), result.error);
                }
              }
            }
          } catch (err) {
            if (stryMutAct_9fa48("620")) {
              {}
            } else {
              stryCov_9fa48("620");
              // E2: Re-throw ZodError and other errors so React components can show toast
              console.error(stryMutAct_9fa48("621") ? "" : (stryCov_9fa48("621"), '[canvasStore] generateComponentFromFlow error:'), err);
              throw err;
            }
          }
        }
      },
      // === Example Data (F-1.2) ===
      loadExampleData: () => {
        if (stryMutAct_9fa48("622")) {
          {}
        } else {
          stryCov_9fa48("622");
          const data = exampleCanvasData as {
            contextNodes: BoundedContextNode[];
            flowNodes: BusinessFlowNode[];
            componentNodes: ComponentNode[];
          };
          set(stryMutAct_9fa48("623") ? () => undefined : (stryCov_9fa48("623"), s => stryMutAct_9fa48("624") ? {} : (stryCov_9fa48("624"), {
            contextNodes: data.contextNodes,
            flowNodes: data.flowNodes,
            componentNodes: data.componentNodes,
            phase: stryMutAct_9fa48("625") ? "" : (stryCov_9fa48("625"), 'context'),
            activeTree: stryMutAct_9fa48("626") ? "" : (stryCov_9fa48("626"), 'flow'),
            _prevActiveTree: s.activeTree
          })));
          // Initialize history for all three trees with example data
          getHistoryStore().initAllHistories(data.contextNodes, data.flowNodes, data.componentNodes);
        }
      },
      // === Component Slice Actions ===
      setComponentNodes: stryMutAct_9fa48("627") ? () => undefined : (stryCov_9fa48("627"), nodes => set(stryMutAct_9fa48("628") ? {} : (stryCov_9fa48("628"), {
        componentNodes: nodes
      }))),
      clearComponentCanvas: () => {
        if (stryMutAct_9fa48("629")) {
          {}
        } else {
          stryCov_9fa48("629");
          const nodes = get().componentNodes;
          if (stryMutAct_9fa48("632") ? nodes.length !== 0 : stryMutAct_9fa48("631") ? false : stryMutAct_9fa48("630") ? true : (stryCov_9fa48("630", "631", "632"), nodes.length === 0)) return;
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("633") ? "" : (stryCov_9fa48("633"), 'component'), nodes);
          set(stryMutAct_9fa48("634") ? {} : (stryCov_9fa48("634"), {
            componentNodes: stryMutAct_9fa48("635") ? ["Stryker was here"] : (stryCov_9fa48("635"), [])
          }));
        }
      },
      addComponentNode: data => {
        if (stryMutAct_9fa48("636")) {
          {}
        } else {
          stryCov_9fa48("636");
          const newNode: ComponentNode = stryMutAct_9fa48("637") ? {} : (stryCov_9fa48("637"), {
            ...data,
            nodeId: generateId(),
            status: stryMutAct_9fa48("638") ? "" : (stryCov_9fa48("638"), 'pending'),
            isActive: stryMutAct_9fa48("639") ? true : (stryCov_9fa48("639"), false),
            children: stryMutAct_9fa48("640") ? ["Stryker was here"] : (stryCov_9fa48("640"), [])
          });
          set(s => {
            if (stryMutAct_9fa48("641")) {
              {}
            } else {
              stryCov_9fa48("641");
              const newNodes = stryMutAct_9fa48("642") ? [] : (stryCov_9fa48("642"), [...s.componentNodes, newNode]);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("643") ? "" : (stryCov_9fa48("643"), 'component'), newNodes);
              return stryMutAct_9fa48("644") ? {} : (stryCov_9fa48("644"), {
                componentNodes: newNodes
              });
            }
          });
          // Epic 4: auto-append user_action message
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("645") ? {} : (stryCov_9fa48("645"), {
            type: stryMutAct_9fa48("646") ? "" : (stryCov_9fa48("646"), 'user_action'),
            content: stryMutAct_9fa48("647") ? `` : (stryCov_9fa48("647"), `添加了组件节点`),
            meta: data.name
          }));
        }
      },
      editComponentNode: (nodeId, data) => {
        if (stryMutAct_9fa48("648")) {
          {}
        } else {
          stryCov_9fa48("648");
          set(s => {
            if (stryMutAct_9fa48("649")) {
              {}
            } else {
              stryCov_9fa48("649");
              const newNodes = s.componentNodes.map(stryMutAct_9fa48("650") ? () => undefined : (stryCov_9fa48("650"), n => (stryMutAct_9fa48("653") ? n.nodeId !== nodeId : stryMutAct_9fa48("652") ? false : stryMutAct_9fa48("651") ? true : (stryCov_9fa48("651", "652", "653"), n.nodeId === nodeId)) ? stryMutAct_9fa48("654") ? {} : (stryCov_9fa48("654"), {
                ...n,
                ...data,
                status: 'pending' as const
              }) : n));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("655") ? "" : (stryCov_9fa48("655"), 'component'), newNodes);
              return stryMutAct_9fa48("656") ? {} : (stryCov_9fa48("656"), {
                componentNodes: newNodes
              });
            }
          });
        }
      },
      deleteComponentNode: nodeId => {
        if (stryMutAct_9fa48("657")) {
          {}
        } else {
          stryCov_9fa48("657");
          const nodeToDelete = get().componentNodes.find(stryMutAct_9fa48("658") ? () => undefined : (stryCov_9fa48("658"), n => stryMutAct_9fa48("661") ? n.nodeId !== nodeId : stryMutAct_9fa48("660") ? false : stryMutAct_9fa48("659") ? true : (stryCov_9fa48("659", "660", "661"), n.nodeId === nodeId)));
          const deletedName = stryMutAct_9fa48("662") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("662"), (stryMutAct_9fa48("663") ? nodeToDelete.name : (stryCov_9fa48("663"), nodeToDelete?.name)) ?? nodeId);
          set(s => {
            if (stryMutAct_9fa48("664")) {
              {}
            } else {
              stryCov_9fa48("664");
              const newNodes = stryMutAct_9fa48("665") ? s.componentNodes : (stryCov_9fa48("665"), s.componentNodes.filter(stryMutAct_9fa48("666") ? () => undefined : (stryCov_9fa48("666"), n => stryMutAct_9fa48("669") ? n.nodeId === nodeId : stryMutAct_9fa48("668") ? false : stryMutAct_9fa48("667") ? true : (stryCov_9fa48("667", "668", "669"), n.nodeId !== nodeId))));
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("670") ? "" : (stryCov_9fa48("670"), 'component'), newNodes);
              return stryMutAct_9fa48("671") ? {} : (stryCov_9fa48("671"), {
                componentNodes: newNodes
              });
            }
          });
          // Epic 4: auto-append user_action message
          useCanvasStore.getState().addMessage(stryMutAct_9fa48("672") ? {} : (stryCov_9fa48("672"), {
            type: stryMutAct_9fa48("673") ? "" : (stryCov_9fa48("673"), 'user_action'),
            content: stryMutAct_9fa48("674") ? `` : (stryCov_9fa48("674"), `删除了组件节点`),
            meta: deletedName
          }));
        }
      },
      setComponentDraft: stryMutAct_9fa48("675") ? () => undefined : (stryCov_9fa48("675"), draft => set(stryMutAct_9fa48("676") ? {} : (stryCov_9fa48("676"), {
        componentDraft: draft
      }))),
      // === Queue Slice Actions ===
      setProjectId: stryMutAct_9fa48("677") ? () => undefined : (stryCov_9fa48("677"), id => set(stryMutAct_9fa48("678") ? {} : (stryCov_9fa48("678"), {
        projectId: id
      }))),
      setIsPolling: stryMutAct_9fa48("679") ? () => undefined : (stryCov_9fa48("679"), polling => set(stryMutAct_9fa48("680") ? {} : (stryCov_9fa48("680"), {
        isPolling: polling
      }))),
      addToQueue: stryMutAct_9fa48("681") ? () => undefined : (stryCov_9fa48("681"), pages => set(stryMutAct_9fa48("682") ? () => undefined : (stryCov_9fa48("682"), s => stryMutAct_9fa48("683") ? {} : (stryCov_9fa48("683"), {
        prototypeQueue: stryMutAct_9fa48("684") ? [] : (stryCov_9fa48("684"), [...s.prototypeQueue, ...pages])
      })))),
      updateQueueItem: stryMutAct_9fa48("685") ? () => undefined : (stryCov_9fa48("685"), (pageId, update) => set(stryMutAct_9fa48("686") ? () => undefined : (stryCov_9fa48("686"), s => stryMutAct_9fa48("687") ? {} : (stryCov_9fa48("687"), {
        prototypeQueue: s.prototypeQueue.map(stryMutAct_9fa48("688") ? () => undefined : (stryCov_9fa48("688"), p => (stryMutAct_9fa48("691") ? p.pageId !== pageId : stryMutAct_9fa48("690") ? false : stryMutAct_9fa48("689") ? true : (stryCov_9fa48("689", "690", "691"), p.pageId === pageId)) ? stryMutAct_9fa48("692") ? {} : (stryCov_9fa48("692"), {
          ...p,
          ...update
        }) : p))
      })))),
      removeFromQueue: stryMutAct_9fa48("693") ? () => undefined : (stryCov_9fa48("693"), pageId => set(stryMutAct_9fa48("694") ? () => undefined : (stryCov_9fa48("694"), s => stryMutAct_9fa48("695") ? {} : (stryCov_9fa48("695"), {
        prototypeQueue: stryMutAct_9fa48("696") ? s.prototypeQueue : (stryCov_9fa48("696"), s.prototypeQueue.filter(stryMutAct_9fa48("697") ? () => undefined : (stryCov_9fa48("697"), p => stryMutAct_9fa48("700") ? p.pageId === pageId : stryMutAct_9fa48("699") ? false : stryMutAct_9fa48("698") ? true : (stryCov_9fa48("698", "699", "700"), p.pageId !== pageId))))
      })))),
      clearQueue: stryMutAct_9fa48("701") ? () => undefined : (stryCov_9fa48("701"), () => set(stryMutAct_9fa48("702") ? {} : (stryCov_9fa48("702"), {
        prototypeQueue: stryMutAct_9fa48("703") ? ["Stryker was here"] : (stryCov_9fa48("703"), []),
        projectId: null
      }))),
      // === AI Thinking Actions (Epic 1) ===
      setAiThinking: stryMutAct_9fa48("704") ? () => undefined : (stryCov_9fa48("704"), (thinking, message = null) => set(stryMutAct_9fa48("705") ? {} : (stryCov_9fa48("705"), {
        aiThinking: thinking,
        aiThinkingMessage: message
      }))),
      setFlowGenerating: stryMutAct_9fa48("706") ? () => undefined : (stryCov_9fa48("706"), (generating, message = null) => set(stryMutAct_9fa48("707") ? {} : (stryCov_9fa48("707"), {
        flowGenerating: generating,
        flowGeneratingMessage: message
      }))),
      setRequirementText: stryMutAct_9fa48("708") ? () => undefined : (stryCov_9fa48("708"), text => set(stryMutAct_9fa48("709") ? {} : (stryCov_9fa48("709"), {
        requirementText: text
      }))),
      generateContextsFromRequirement: async (text: string) => {
        if (stryMutAct_9fa48("710")) {
          {}
        } else {
          stryCov_9fa48("710");
          const {
            setAiThinking,
            setRequirementText,
            setPhase,
            addContextNode
          } = get();

          // Reset state
          setAiThinking(stryMutAct_9fa48("711") ? false : (stryCov_9fa48("711"), true), stryMutAct_9fa48("712") ? "" : (stryCov_9fa48("712"), '正在连接...'));
          setRequirementText(text);
          setPhase(stryMutAct_9fa48("713") ? "" : (stryCov_9fa48("713"), 'context'));

          // Import dynamically to avoid circular deps
          const {
            canvasSseAnalyze
          } = require('./api/canvasSseApi') as typeof import('./api/canvasSseApi');
          canvasSseAnalyze(text, stryMutAct_9fa48("714") ? {} : (stryCov_9fa48("714"), {
            timeoutMs: 30000,
            onThinking: (content: string) => {
              if (stryMutAct_9fa48("715")) {
                {}
              } else {
                stryCov_9fa48("715");
                setAiThinking(stryMutAct_9fa48("716") ? false : (stryCov_9fa48("716"), true), content);
              }
            },
            onStepContext: (content: string, _mermaidCode: string | undefined, confidence: number | undefined, boundedContexts) => {
              if (stryMutAct_9fa48("717")) {
                {}
              } else {
                stryCov_9fa48("717");
                setAiThinking(stryMutAct_9fa48("718") ? false : (stryCov_9fa48("718"), true), content);
                // Map backend type to valid BoundedContextNode type
                const mapContextType = (type: string): BoundedContextNode['type'] => {
                  if (stryMutAct_9fa48("719")) {
                    {}
                  } else {
                    stryCov_9fa48("719");
                    const validTypes = stryMutAct_9fa48("720") ? [] : (stryCov_9fa48("720"), [stryMutAct_9fa48("721") ? "" : (stryCov_9fa48("721"), 'core'), stryMutAct_9fa48("722") ? "" : (stryCov_9fa48("722"), 'supporting'), stryMutAct_9fa48("723") ? "" : (stryCov_9fa48("723"), 'generic'), stryMutAct_9fa48("724") ? "" : (stryCov_9fa48("724"), 'external')]);
                    return validTypes.includes(type) ? type as BoundedContextNode['type'] : stryMutAct_9fa48("725") ? "" : (stryCov_9fa48("725"), 'core');
                  }
                };
                const MAX_CONTEXT_NODES = 10;
                const MAX_NAME_LENGTH = 30;
                const truncateName = (name: string): string => {
                  if (stryMutAct_9fa48("726")) {
                    {}
                  } else {
                    stryCov_9fa48("726");
                    if (stryMutAct_9fa48("730") ? name.length > MAX_NAME_LENGTH : stryMutAct_9fa48("729") ? name.length < MAX_NAME_LENGTH : stryMutAct_9fa48("728") ? false : stryMutAct_9fa48("727") ? true : (stryCov_9fa48("727", "728", "729", "730"), name.length <= MAX_NAME_LENGTH)) return name;
                    return (stryMutAct_9fa48("731") ? name : (stryCov_9fa48("731"), name.substring(0, stryMutAct_9fa48("732") ? MAX_NAME_LENGTH + 3 : (stryCov_9fa48("732"), MAX_NAME_LENGTH - 3)))) + (stryMutAct_9fa48("733") ? "" : (stryCov_9fa48("733"), '...'));
                  }
                };
                // Loop through boundedContexts and add each one (max 10)
                if (stryMutAct_9fa48("736") ? boundedContexts || boundedContexts.length > 0 : stryMutAct_9fa48("735") ? false : stryMutAct_9fa48("734") ? true : (stryCov_9fa48("734", "735", "736"), boundedContexts && (stryMutAct_9fa48("739") ? boundedContexts.length <= 0 : stryMutAct_9fa48("738") ? boundedContexts.length >= 0 : stryMutAct_9fa48("737") ? true : (stryCov_9fa48("737", "738", "739"), boundedContexts.length > 0)))) {
                  if (stryMutAct_9fa48("740")) {
                    {}
                  } else {
                    stryCov_9fa48("740");
                    const nodesToAdd = stryMutAct_9fa48("741") ? boundedContexts : (stryCov_9fa48("741"), boundedContexts.slice(0, MAX_CONTEXT_NODES));
                    nodesToAdd.forEach(ctx => {
                      if (stryMutAct_9fa48("742")) {
                        {}
                      } else {
                        stryCov_9fa48("742");
                        addContextNode(stryMutAct_9fa48("743") ? {} : (stryCov_9fa48("743"), {
                          name: truncateName(ctx.name),
                          description: ctx.description,
                          type: mapContextType(ctx.type)
                        }));
                      }
                    });
                  }
                } else if (stryMutAct_9fa48("746") ? confidence !== undefined || confidence > 0.5 : stryMutAct_9fa48("745") ? false : stryMutAct_9fa48("744") ? true : (stryCov_9fa48("744", "745", "746"), (stryMutAct_9fa48("748") ? confidence === undefined : stryMutAct_9fa48("747") ? true : (stryCov_9fa48("747", "748"), confidence !== undefined)) && (stryMutAct_9fa48("751") ? confidence <= 0.5 : stryMutAct_9fa48("750") ? confidence >= 0.5 : stryMutAct_9fa48("749") ? true : (stryCov_9fa48("749", "750", "751"), confidence > 0.5)))) {
                  if (stryMutAct_9fa48("752")) {
                    {}
                  } else {
                    stryCov_9fa48("752");
                    // Fallback: single node if no boundedContexts
                    addContextNode(stryMutAct_9fa48("753") ? {} : (stryCov_9fa48("753"), {
                      name: stryMutAct_9fa48("754") ? "" : (stryCov_9fa48("754"), 'AI 分析上下文'),
                      description: content,
                      type: stryMutAct_9fa48("755") ? "" : (stryCov_9fa48("755"), 'core')
                    }));
                  }
                }
              }
            },
            onStepModel: (content: string) => {
              if (stryMutAct_9fa48("756")) {
                {}
              } else {
                stryCov_9fa48("756");
                setAiThinking(stryMutAct_9fa48("757") ? false : (stryCov_9fa48("757"), true), content);
              }
            },
            onStepFlow: (content: string) => {
              if (stryMutAct_9fa48("758")) {
                {}
              } else {
                stryCov_9fa48("758");
                setAiThinking(stryMutAct_9fa48("759") ? false : (stryCov_9fa48("759"), true), content);
              }
            },
            onStepComponents: (content: string) => {
              if (stryMutAct_9fa48("760")) {
                {}
              } else {
                stryCov_9fa48("760");
                setAiThinking(stryMutAct_9fa48("761") ? false : (stryCov_9fa48("761"), true), content);
              }
            },
            onDone: () => {
              if (stryMutAct_9fa48("762")) {
                {}
              } else {
                stryCov_9fa48("762");
                setAiThinking(stryMutAct_9fa48("763") ? true : (stryCov_9fa48("763"), false), null);
              }
            },
            onError: () => {
              if (stryMutAct_9fa48("764")) {
                {}
              } else {
                stryCov_9fa48("764");
                setAiThinking(stryMutAct_9fa48("765") ? true : (stryCov_9fa48("765"), false), null);
              }
            }
          })).catch((err: unknown) => {
            if (stryMutAct_9fa48("766")) {
              {}
            } else {
              stryCov_9fa48("766");
              setAiThinking(stryMutAct_9fa48("767") ? true : (stryCov_9fa48("767"), false), null);
              console.error(stryMutAct_9fa48("768") ? "" : (stryCov_9fa48("768"), '[canvasStore] generateContextsFromRequirement error:'), err);
            }
          });
        }
      },
      // === Drag Slice (E3) ===
      draggedNodeId: null,
      dragOverNodeId: null,
      draggedPositions: {},
      isDragging: stryMutAct_9fa48("769") ? true : (stryCov_9fa48("769"), false),
      startDrag: stryMutAct_9fa48("770") ? () => undefined : (stryCov_9fa48("770"), nodeId => set(stryMutAct_9fa48("771") ? {} : (stryCov_9fa48("771"), {
        draggedNodeId: nodeId,
        isDragging: stryMutAct_9fa48("772") ? false : (stryCov_9fa48("772"), true)
      }))),
      endDrag: (nodeId, position) => {
        if (stryMutAct_9fa48("773")) {
          {}
        } else {
          stryCov_9fa48("773");
          set(stryMutAct_9fa48("774") ? () => undefined : (stryCov_9fa48("774"), s => stryMutAct_9fa48("775") ? {} : (stryCov_9fa48("775"), {
            draggedPositions: stryMutAct_9fa48("776") ? {} : (stryCov_9fa48("776"), {
              ...s.draggedPositions,
              [nodeId]: position
            }),
            draggedNodeId: null,
            isDragging: stryMutAct_9fa48("777") ? true : (stryCov_9fa48("777"), false)
          })));
        }
      },
      setDragOver: stryMutAct_9fa48("778") ? () => undefined : (stryCov_9fa48("778"), nodeId => set(stryMutAct_9fa48("779") ? {} : (stryCov_9fa48("779"), {
        dragOverNodeId: nodeId
      }))),
      updateDraggedPosition: (nodeId, position) => {
        if (stryMutAct_9fa48("780")) {
          {}
        } else {
          stryCov_9fa48("780");
          set(stryMutAct_9fa48("781") ? () => undefined : (stryCov_9fa48("781"), s => stryMutAct_9fa48("782") ? {} : (stryCov_9fa48("782"), {
            draggedPositions: stryMutAct_9fa48("783") ? {} : (stryCov_9fa48("783"), {
              ...s.draggedPositions,
              [nodeId]: position
            })
          })));
        }
      },
      clearDragPositions: stryMutAct_9fa48("784") ? () => undefined : (stryCov_9fa48("784"), () => set(stryMutAct_9fa48("785") ? {} : (stryCov_9fa48("785"), {
        draggedPositions: {},
        draggedNodeId: null,
        dragOverNodeId: null,
        isDragging: stryMutAct_9fa48("786") ? true : (stryCov_9fa48("786"), false)
      }))),
      clearDragPosition: nodeId => {
        if (stryMutAct_9fa48("787")) {
          {}
        } else {
          stryCov_9fa48("787");
          set(s => {
            if (stryMutAct_9fa48("788")) {
              {}
            } else {
              stryCov_9fa48("788");
              const next = stryMutAct_9fa48("789") ? {} : (stryCov_9fa48("789"), {
                ...s.draggedPositions
              });
              delete next[nodeId];
              return stryMutAct_9fa48("790") ? {} : (stryCov_9fa48("790"), {
                draggedPositions: next
              });
            }
          });
        }
      },
      // === Bounded Group Slice (E4) ===
      boundedGroups: stryMutAct_9fa48("791") ? ["Stryker was here"] : (stryCov_9fa48("791"), []),
      addBoundedGroup: groupData => {
        if (stryMutAct_9fa48("792")) {
          {}
        } else {
          stryCov_9fa48("792");
          const newGroup: BoundedGroup = stryMutAct_9fa48("793") ? {} : (stryCov_9fa48("793"), {
            ...groupData,
            groupId: generateId()
          });
          set(stryMutAct_9fa48("794") ? () => undefined : (stryCov_9fa48("794"), s => stryMutAct_9fa48("795") ? {} : (stryCov_9fa48("795"), {
            boundedGroups: stryMutAct_9fa48("796") ? [] : (stryCov_9fa48("796"), [...s.boundedGroups, newGroup])
          })));
        }
      },
      removeBoundedGroup: groupId => {
        if (stryMutAct_9fa48("797")) {
          {}
        } else {
          stryCov_9fa48("797");
          set(stryMutAct_9fa48("798") ? () => undefined : (stryCov_9fa48("798"), s => stryMutAct_9fa48("799") ? {} : (stryCov_9fa48("799"), {
            boundedGroups: stryMutAct_9fa48("800") ? s.boundedGroups : (stryCov_9fa48("800"), s.boundedGroups.filter(stryMutAct_9fa48("801") ? () => undefined : (stryCov_9fa48("801"), g => stryMutAct_9fa48("804") ? g.groupId === groupId : stryMutAct_9fa48("803") ? false : stryMutAct_9fa48("802") ? true : (stryCov_9fa48("802", "803", "804"), g.groupId !== groupId))))
          })));
        }
      },
      toggleBoundedGroupVisibility: groupId => {
        if (stryMutAct_9fa48("805")) {
          {}
        } else {
          stryCov_9fa48("805");
          set(stryMutAct_9fa48("806") ? () => undefined : (stryCov_9fa48("806"), s => stryMutAct_9fa48("807") ? {} : (stryCov_9fa48("807"), {
            boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("808") ? () => undefined : (stryCov_9fa48("808"), g => (stryMutAct_9fa48("811") ? g.groupId !== groupId : stryMutAct_9fa48("810") ? false : stryMutAct_9fa48("809") ? true : (stryCov_9fa48("809", "810", "811"), g.groupId === groupId)) ? stryMutAct_9fa48("812") ? {} : (stryCov_9fa48("812"), {
              ...g,
              visible: (stryMutAct_9fa48("815") ? g.visible === undefined && g.visible === true : stryMutAct_9fa48("814") ? false : stryMutAct_9fa48("813") ? true : (stryCov_9fa48("813", "814", "815"), (stryMutAct_9fa48("817") ? g.visible !== undefined : stryMutAct_9fa48("816") ? false : (stryCov_9fa48("816", "817"), g.visible === undefined)) || (stryMutAct_9fa48("819") ? g.visible !== true : stryMutAct_9fa48("818") ? false : (stryCov_9fa48("818", "819"), g.visible === (stryMutAct_9fa48("820") ? false : (stryCov_9fa48("820"), true)))))) ? stryMutAct_9fa48("821") ? true : (stryCov_9fa48("821"), false) : stryMutAct_9fa48("822") ? false : (stryCov_9fa48("822"), true)
            }) : g))
          })));
        }
      },
      updateBoundedGroupLabel: (groupId, label) => {
        if (stryMutAct_9fa48("823")) {
          {}
        } else {
          stryCov_9fa48("823");
          set(stryMutAct_9fa48("824") ? () => undefined : (stryCov_9fa48("824"), s => stryMutAct_9fa48("825") ? {} : (stryCov_9fa48("825"), {
            boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("826") ? () => undefined : (stryCov_9fa48("826"), g => (stryMutAct_9fa48("829") ? g.groupId !== groupId : stryMutAct_9fa48("828") ? false : stryMutAct_9fa48("827") ? true : (stryCov_9fa48("827", "828", "829"), g.groupId === groupId)) ? stryMutAct_9fa48("830") ? {} : (stryCov_9fa48("830"), {
              ...g,
              label
            }) : g))
          })));
        }
      },
      addNodeToGroup: (groupId, nodeId) => {
        if (stryMutAct_9fa48("831")) {
          {}
        } else {
          stryCov_9fa48("831");
          set(stryMutAct_9fa48("832") ? () => undefined : (stryCov_9fa48("832"), s => stryMutAct_9fa48("833") ? {} : (stryCov_9fa48("833"), {
            boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("834") ? () => undefined : (stryCov_9fa48("834"), g => (stryMutAct_9fa48("837") ? g.groupId === groupId || !g.nodeIds.includes(nodeId) : stryMutAct_9fa48("836") ? false : stryMutAct_9fa48("835") ? true : (stryCov_9fa48("835", "836", "837"), (stryMutAct_9fa48("839") ? g.groupId !== groupId : stryMutAct_9fa48("838") ? true : (stryCov_9fa48("838", "839"), g.groupId === groupId)) && (stryMutAct_9fa48("840") ? g.nodeIds.includes(nodeId) : (stryCov_9fa48("840"), !g.nodeIds.includes(nodeId))))) ? stryMutAct_9fa48("841") ? {} : (stryCov_9fa48("841"), {
              ...g,
              nodeIds: stryMutAct_9fa48("842") ? [] : (stryCov_9fa48("842"), [...g.nodeIds, nodeId])
            }) : g))
          })));
        }
      },
      removeNodeFromGroup: (groupId, nodeId) => {
        if (stryMutAct_9fa48("843")) {
          {}
        } else {
          stryCov_9fa48("843");
          set(stryMutAct_9fa48("844") ? () => undefined : (stryCov_9fa48("844"), s => stryMutAct_9fa48("845") ? {} : (stryCov_9fa48("845"), {
            boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("846") ? () => undefined : (stryCov_9fa48("846"), g => (stryMutAct_9fa48("849") ? g.groupId !== groupId : stryMutAct_9fa48("848") ? false : stryMutAct_9fa48("847") ? true : (stryCov_9fa48("847", "848", "849"), g.groupId === groupId)) ? stryMutAct_9fa48("850") ? {} : (stryCov_9fa48("850"), {
              ...g,
              nodeIds: stryMutAct_9fa48("851") ? g.nodeIds : (stryCov_9fa48("851"), g.nodeIds.filter(stryMutAct_9fa48("852") ? () => undefined : (stryCov_9fa48("852"), id => stryMutAct_9fa48("855") ? id === nodeId : stryMutAct_9fa48("854") ? false : stryMutAct_9fa48("853") ? true : (stryCov_9fa48("853", "854", "855"), id !== nodeId))))
            }) : g))
          })));
        }
      },
      clearBoundedGroups: stryMutAct_9fa48("856") ? () => undefined : (stryCov_9fa48("856"), () => set(stryMutAct_9fa48("857") ? {} : (stryCov_9fa48("857"), {
        boundedGroups: stryMutAct_9fa48("858") ? ["Stryker was here"] : (stryCov_9fa48("858"), [])
      }))),
      // === F2: BoundedEdge Slice ===
      boundedEdges: stryMutAct_9fa48("859") ? ["Stryker was here"] : (stryCov_9fa48("859"), []),
      addBoundedEdge: edgeData => {
        if (stryMutAct_9fa48("860")) {
          {}
        } else {
          stryCov_9fa48("860");
          const newEdge: BoundedEdge = stryMutAct_9fa48("861") ? {} : (stryCov_9fa48("861"), {
            ...edgeData,
            id: generateId()
          });
          set(stryMutAct_9fa48("862") ? () => undefined : (stryCov_9fa48("862"), s => stryMutAct_9fa48("863") ? {} : (stryCov_9fa48("863"), {
            boundedEdges: stryMutAct_9fa48("864") ? [] : (stryCov_9fa48("864"), [...s.boundedEdges, newEdge])
          })));
        }
      },
      removeBoundedEdge: id => {
        if (stryMutAct_9fa48("865")) {
          {}
        } else {
          stryCov_9fa48("865");
          set(stryMutAct_9fa48("866") ? () => undefined : (stryCov_9fa48("866"), s => stryMutAct_9fa48("867") ? {} : (stryCov_9fa48("867"), {
            boundedEdges: stryMutAct_9fa48("868") ? s.boundedEdges : (stryCov_9fa48("868"), s.boundedEdges.filter(stryMutAct_9fa48("869") ? () => undefined : (stryCov_9fa48("869"), e => stryMutAct_9fa48("872") ? e.id === id : stryMutAct_9fa48("871") ? false : stryMutAct_9fa48("870") ? true : (stryCov_9fa48("870", "871", "872"), e.id !== id))))
          })));
        }
      },
      clearBoundedEdges: stryMutAct_9fa48("873") ? () => undefined : (stryCov_9fa48("873"), () => set(stryMutAct_9fa48("874") ? {} : (stryCov_9fa48("874"), {
        boundedEdges: stryMutAct_9fa48("875") ? ["Stryker was here"] : (stryCov_9fa48("875"), [])
      }))),
      setBoundedEdges: stryMutAct_9fa48("876") ? () => undefined : (stryCov_9fa48("876"), edges => set(stryMutAct_9fa48("877") ? {} : (stryCov_9fa48("877"), {
        boundedEdges: edges
      }))),
      // === F2: FlowEdge Slice ===
      flowEdges: stryMutAct_9fa48("878") ? ["Stryker was here"] : (stryCov_9fa48("878"), []),
      addFlowEdge: edgeData => {
        if (stryMutAct_9fa48("879")) {
          {}
        } else {
          stryCov_9fa48("879");
          const newEdge: FlowEdge = stryMutAct_9fa48("880") ? {} : (stryCov_9fa48("880"), {
            ...edgeData,
            id: generateId()
          });
          set(stryMutAct_9fa48("881") ? () => undefined : (stryCov_9fa48("881"), s => stryMutAct_9fa48("882") ? {} : (stryCov_9fa48("882"), {
            flowEdges: stryMutAct_9fa48("883") ? [] : (stryCov_9fa48("883"), [...s.flowEdges, newEdge])
          })));
        }
      },
      removeFlowEdge: id => {
        if (stryMutAct_9fa48("884")) {
          {}
        } else {
          stryCov_9fa48("884");
          set(stryMutAct_9fa48("885") ? () => undefined : (stryCov_9fa48("885"), s => stryMutAct_9fa48("886") ? {} : (stryCov_9fa48("886"), {
            flowEdges: stryMutAct_9fa48("887") ? s.flowEdges : (stryCov_9fa48("887"), s.flowEdges.filter(stryMutAct_9fa48("888") ? () => undefined : (stryCov_9fa48("888"), e => stryMutAct_9fa48("891") ? e.id === id : stryMutAct_9fa48("890") ? false : stryMutAct_9fa48("889") ? true : (stryCov_9fa48("889", "890", "891"), e.id !== id))))
          })));
        }
      },
      clearFlowEdges: stryMutAct_9fa48("892") ? () => undefined : (stryCov_9fa48("892"), () => set(stryMutAct_9fa48("893") ? {} : (stryCov_9fa48("893"), {
        flowEdges: stryMutAct_9fa48("894") ? ["Stryker was here"] : (stryCov_9fa48("894"), [])
      }))),
      setFlowEdges: stryMutAct_9fa48("895") ? () => undefined : (stryCov_9fa48("895"), edges => set(stryMutAct_9fa48("896") ? {} : (stryCov_9fa48("896"), {
        flowEdges: edges
      }))),
      // === Internal tracking ===
      _prevActiveTree: null as TreeType | null,
      // === Tree Activation Logic ===
      recomputeActiveTree: () => {
        if (stryMutAct_9fa48("897")) {
          {}
        } else {
          stryCov_9fa48("897");
          const {
            contextNodes,
            flowNodes,
            phase,
            _prevActiveTree
          } = get();
          let newActiveTree: TreeType | null = null;

          // Activation rules based on phase
          if (stryMutAct_9fa48("900") ? phase !== 'input' : stryMutAct_9fa48("899") ? false : stryMutAct_9fa48("898") ? true : (stryCov_9fa48("898", "899", "900"), phase === (stryMutAct_9fa48("901") ? "" : (stryCov_9fa48("901"), 'input')))) {
            if (stryMutAct_9fa48("902")) {
              {}
            } else {
              stryCov_9fa48("902");
              newActiveTree = null;
            }
          } else if (stryMutAct_9fa48("905") ? phase !== 'context' : stryMutAct_9fa48("904") ? false : stryMutAct_9fa48("903") ? true : (stryCov_9fa48("903", "904", "905"), phase === (stryMutAct_9fa48("906") ? "" : (stryCov_9fa48("906"), 'context')))) {
            if (stryMutAct_9fa48("907")) {
              {}
            } else {
              stryCov_9fa48("907");
              const allConfirmed = cascade.areAllConfirmed(contextNodes);
              newActiveTree = (stryMutAct_9fa48("910") ? allConfirmed || contextNodes.length > 0 : stryMutAct_9fa48("909") ? false : stryMutAct_9fa48("908") ? true : (stryCov_9fa48("908", "909", "910"), allConfirmed && (stryMutAct_9fa48("913") ? contextNodes.length <= 0 : stryMutAct_9fa48("912") ? contextNodes.length >= 0 : stryMutAct_9fa48("911") ? true : (stryCov_9fa48("911", "912", "913"), contextNodes.length > 0)))) ? stryMutAct_9fa48("914") ? "" : (stryCov_9fa48("914"), 'flow') : stryMutAct_9fa48("915") ? "" : (stryCov_9fa48("915"), 'context');
            }
          } else if (stryMutAct_9fa48("918") ? phase !== 'flow' : stryMutAct_9fa48("917") ? false : stryMutAct_9fa48("916") ? true : (stryCov_9fa48("916", "917", "918"), phase === (stryMutAct_9fa48("919") ? "" : (stryCov_9fa48("919"), 'flow')))) {
            if (stryMutAct_9fa48("920")) {
              {}
            } else {
              stryCov_9fa48("920");
              const flowReady = cascade.areAllConfirmed(flowNodes);
              const contextReady = cascade.areAllConfirmed(contextNodes);
              newActiveTree = (stryMutAct_9fa48("923") ? flowReady || flowNodes.length > 0 : stryMutAct_9fa48("922") ? false : stryMutAct_9fa48("921") ? true : (stryCov_9fa48("921", "922", "923"), flowReady && (stryMutAct_9fa48("926") ? flowNodes.length <= 0 : stryMutAct_9fa48("925") ? flowNodes.length >= 0 : stryMutAct_9fa48("924") ? true : (stryCov_9fa48("924", "925", "926"), flowNodes.length > 0)))) ? stryMutAct_9fa48("927") ? "" : (stryCov_9fa48("927"), 'component') : stryMutAct_9fa48("928") ? "" : (stryCov_9fa48("928"), 'flow');
              if (stryMutAct_9fa48("931") ? contextReady && flowReady || flowNodes.length > 0 : stryMutAct_9fa48("930") ? false : stryMutAct_9fa48("929") ? true : (stryCov_9fa48("929", "930", "931"), (stryMutAct_9fa48("933") ? contextReady || flowReady : stryMutAct_9fa48("932") ? true : (stryCov_9fa48("932", "933"), contextReady && flowReady)) && (stryMutAct_9fa48("936") ? flowNodes.length <= 0 : stryMutAct_9fa48("935") ? flowNodes.length >= 0 : stryMutAct_9fa48("934") ? true : (stryCov_9fa48("934", "935", "936"), flowNodes.length > 0)))) {
                if (stryMutAct_9fa48("937")) {
                  {}
                } else {
                  stryCov_9fa48("937");
                  set(stryMutAct_9fa48("938") ? {} : (stryCov_9fa48("938"), {
                    activeTree: newActiveTree,
                    _prevActiveTree: newActiveTree,
                    phase: stryMutAct_9fa48("939") ? "" : (stryCov_9fa48("939"), 'component')
                  }));
                  get().setCenterExpand(stryMutAct_9fa48("940") ? "" : (stryCov_9fa48("940"), 'expand-left'));
                  return;
                }
              }
            }
          } else if (stryMutAct_9fa48("943") ? phase !== 'component' : stryMutAct_9fa48("942") ? false : stryMutAct_9fa48("941") ? true : (stryCov_9fa48("941", "942", "943"), phase === (stryMutAct_9fa48("944") ? "" : (stryCov_9fa48("944"), 'component')))) {
            if (stryMutAct_9fa48("945")) {
              {}
            } else {
              stryCov_9fa48("945");
              newActiveTree = stryMutAct_9fa48("946") ? "" : (stryCov_9fa48("946"), 'component');
            }
          } else {
            if (stryMutAct_9fa48("947")) {
              {}
            } else {
              stryCov_9fa48("947");
              // prototype
              newActiveTree = null;
            }
          }

          // E2-1: Auto-expand center panel based on activeTree transition
          if (stryMutAct_9fa48("950") ? newActiveTree === _prevActiveTree : stryMutAct_9fa48("949") ? false : stryMutAct_9fa48("948") ? true : (stryCov_9fa48("948", "949", "950"), newActiveTree !== _prevActiveTree)) {
            if (stryMutAct_9fa48("951")) {
              {}
            } else {
              stryCov_9fa48("951");
              if (stryMutAct_9fa48("954") ? newActiveTree === 'flow' && newActiveTree === 'component' : stryMutAct_9fa48("953") ? false : stryMutAct_9fa48("952") ? true : (stryCov_9fa48("952", "953", "954"), (stryMutAct_9fa48("956") ? newActiveTree !== 'flow' : stryMutAct_9fa48("955") ? false : (stryCov_9fa48("955", "956"), newActiveTree === (stryMutAct_9fa48("957") ? "" : (stryCov_9fa48("957"), 'flow')))) || (stryMutAct_9fa48("959") ? newActiveTree !== 'component' : stryMutAct_9fa48("958") ? false : (stryCov_9fa48("958", "959"), newActiveTree === (stryMutAct_9fa48("960") ? "" : (stryCov_9fa48("960"), 'component')))))) {
                if (stryMutAct_9fa48("961")) {
                  {}
                } else {
                  stryCov_9fa48("961");
                  set(stryMutAct_9fa48("962") ? {} : (stryCov_9fa48("962"), {
                    activeTree: newActiveTree,
                    _prevActiveTree: newActiveTree
                  }));
                  get().setCenterExpand(stryMutAct_9fa48("963") ? "" : (stryCov_9fa48("963"), 'expand-left'));
                }
              } else if (stryMutAct_9fa48("966") ? newActiveTree !== null : stryMutAct_9fa48("965") ? false : stryMutAct_9fa48("964") ? true : (stryCov_9fa48("964", "965", "966"), newActiveTree === null)) {
                if (stryMutAct_9fa48("967")) {
                  {}
                } else {
                  stryCov_9fa48("967");
                  set(stryMutAct_9fa48("968") ? {} : (stryCov_9fa48("968"), {
                    activeTree: newActiveTree,
                    _prevActiveTree: newActiveTree
                  }));
                  get().setCenterExpand(stryMutAct_9fa48("969") ? "" : (stryCov_9fa48("969"), 'default'));
                }
              } else {
                if (stryMutAct_9fa48("970")) {
                  {}
                } else {
                  stryCov_9fa48("970");
                  set(stryMutAct_9fa48("971") ? {} : (stryCov_9fa48("971"), {
                    activeTree: newActiveTree,
                    _prevActiveTree: newActiveTree
                  }));
                }
              }
            }
          } else {
            if (stryMutAct_9fa48("972")) {
              {}
            } else {
              stryCov_9fa48("972");
              // No change, just update prev (protect user手动展开)
              set(stryMutAct_9fa48("973") ? {} : (stryCov_9fa48("973"), {
                activeTree: newActiveTree,
                _prevActiveTree: newActiveTree
              }));
            }
          }
        }
      },
      _cascade: cascade
    });
  }
}, stryMutAct_9fa48("974") ? {} : (stryCov_9fa48("974"), {
  name: stryMutAct_9fa48("975") ? "" : (stryCov_9fa48("975"), 'vibex-canvas-storage'),
  storage: stryMutAct_9fa48("976") ? {} : (stryCov_9fa48("976"), {
    getItem: (name: string) => {
      if (stryMutAct_9fa48("977")) {
        {}
      } else {
        stryCov_9fa48("977");
        const value = localStorage.getItem(name);
        if (stryMutAct_9fa48("980") ? value !== null : stryMutAct_9fa48("979") ? false : stryMutAct_9fa48("978") ? true : (stryCov_9fa48("978", "979", "980"), value === null)) return null;
        try {
          if (stryMutAct_9fa48("981")) {
            {}
          } else {
            stryCov_9fa48("981");
            const parsed = JSON.parse(value);
            // Apply migrations if needed
            const migrated = runMigrations(stryMutAct_9fa48("982") ? parsed.state && {} : (stryCov_9fa48("982"), parsed.state ?? {}));
            // Update version
            localStorage.setItem(CANVAS_STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
            return stryMutAct_9fa48("983") ? {} : (stryCov_9fa48("983"), {
              ...parsed,
              state: migrated
            });
          }
        } catch {
          if (stryMutAct_9fa48("984")) {
            {}
          } else {
            stryCov_9fa48("984");
            return value ? stryMutAct_9fa48("985") ? {} : (stryCov_9fa48("985"), {
              state: JSON.parse(value)
            }) : null;
          }
        }
      }
    },
    setItem: (name: string, newValue: {
      state: Record<string, unknown>;
    }) => {
      if (stryMutAct_9fa48("986")) {
        {}
      } else {
        stryCov_9fa48("986");
        localStorage.setItem(name, JSON.stringify(newValue));
        localStorage.setItem(CANVAS_STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
      }
    },
    removeItem: (name: string) => {
      if (stryMutAct_9fa48("987")) {
        {}
      } else {
        stryCov_9fa48("987");
        localStorage.removeItem(name);
        localStorage.removeItem(CANVAS_STORAGE_VERSION_KEY);
      }
    }
  }),
  partialize: stryMutAct_9fa48("988") ? () => undefined : (stryCov_9fa48("988"), state => stryMutAct_9fa48("989") ? {} : (stryCov_9fa48("989"), {
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
})), stryMutAct_9fa48("990") ? {} : (stryCov_9fa48("990"), {
  name: stryMutAct_9fa48("991") ? "" : (stryCov_9fa48("991"), 'canvasStore')
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