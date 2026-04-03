/**
 * VibeX Canvas — Types
 * 三树并行画布核心类型定义
 */
// @ts-nocheck


// =============================================================================
// Phase & Tree State
// =============================================================================

/** 画布阶段枚举 */
export type Phase = 'input' | 'context' | 'flow' | 'component' | 'prototype';

/** 树类型枚举 */
export type TreeType = 'context' | 'flow' | 'component';

/** 节点确认状态 */
export type NodeStatus = 'pending' | 'generating' | 'confirmed' | 'error';

// =============================================================================
// Bounded Context
// =============================================================================

/**
 * Context Relationship (Epic 1: 三树增强 - 领域关系)
 * Represents a directed relationship between two bounded contexts.
 */
export interface ContextRelationship {
  sourceId?: string;
  targetId: string;
  type: 'dependency' | 'aggregate' | 'calls';
  label?: string;
}

export interface BoundedContextNode {
  nodeId: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  /** Whether node is active (participates in generation). Default true. */
  isActive?: boolean;
  /** E1: Whether node is selected in UI (persisted to JSON) */
  selected?: boolean;
  status: NodeStatus;
  parentId?: string;
  children: string[];
  /** Inferred relationships to other bounded contexts (Epic 1) */
  relationships?: ContextRelationship[];
}

/** Inferred relationship between two context nodes */
export interface InferredRelationship {
  sourceId: string;
  targetId: string;
  type: ContextRelationship['type'];
  label?: string;
}

export interface BoundedContextDraft {
  name: string;
  description: string;
  type: BoundedContextNode['type'];
}

// =============================================================================
// Business Flow
// =============================================================================

export interface FlowStep {
  stepId: string;
  name: string;
  actor: string;
  description?: string;
  order: number;
  /** Whether step is active (participates in generation). Default true. */
  isActive?: boolean;
  status: NodeStatus;
  /** 步骤类型：normal/branch/loop */
  type?: 'normal' | 'branch' | 'loop';
  /** F2.2: 节点类型：start/end/process（用于 UI 标记） */
  nodeType?: 'start' | 'end' | 'process';
}

export interface BusinessFlowNode {
  nodeId: string;
  contextId: string;
  name: string;
  steps: FlowStep[];
  /** Whether node is active (participates in generation). Default true. */
  isActive?: boolean;
  /** E1: Whether node is selected in UI (persisted to JSON) */
  selected?: boolean;
  status: NodeStatus;
  parentId?: string;
  children: string[];
  /** E3-F13: Relationships to other flow nodes */
  relationships?: FlowRelationship[];
}

/** E3-F13: Relationship between flow nodes */
export interface FlowRelationship {
  sourceId?: string;
  targetId: string;
  type: 'sequence' | 'parallel' | 'conditional';
  label?: string;
}

export interface BusinessFlowDraft {
  name: string;
  contextId: string;
  steps: Omit<FlowStep, 'stepId' | 'status'>[];
}

// =============================================================================
// Component
// =============================================================================

export type ComponentType = 'page' | 'form' | 'list' | 'detail' | 'modal';

export interface ComponentApi {
  method: 'GET' | 'POST';
  path: string;
  params: string[];
}

export interface ComponentNode {
  nodeId: string;
  flowId: string;
  name: string;
  type: ComponentType;
  props: Record<string, unknown>;
  api: ComponentApi;
  children: string[];
  parentId?: string;
  /** Whether node is active (participates in generation). Default true. */
  isActive?: boolean;
  /** E1: Whether node is selected in UI (persisted to JSON) */
  selected?: boolean;
  status: NodeStatus;
  previewUrl?: string;
  /** E3-F13: Relationships to other component nodes */
  relationships?: ComponentRelationship[];
}

/** E3-F13: Relationship between component nodes */
export interface ComponentRelationship {
  sourceId?: string;
  targetId: string;
  type: 'calls' | 'includes' | 'references';
  label?: string;
}

// =============================================================================
// Prototype Queue
// =============================================================================

export type PrototypeStatus = 'queued' | 'generating' | 'done' | 'error';

export interface PrototypePage {
  pageId: string;
  componentId: string;
  name: string;
  status: PrototypeStatus;
  progress: number; // 0-100
  retryCount: number;
  errorMessage?: string;
  generatedAt?: number;
}

// =============================================================================
// Canvas Store Types
// =============================================================================

export interface CanvasSlice {
  // Phase
  phase: Phase;
  activeTree: TreeType | null;

  // Tree collapse state
  contextPanelCollapsed: boolean;
  flowPanelCollapsed: boolean;
  componentPanelCollapsed: boolean;
}

export interface ContextSlice {
  contextNodes: BoundedContextNode[];
  contextDraft: Partial<BoundedContextNode> | null;
}

export interface FlowSlice {
  flowNodes: BusinessFlowNode[];
  flowDraft: Partial<BusinessFlowNode> | null;
}

export interface ComponentSlice {
  componentNodes: ComponentNode[];
  componentDraft: Partial<ComponentNode> | null;
}

export interface QueueSlice {
  projectId: string | null;
  prototypeQueue: PrototypePage[];
  isPolling: boolean;
}

// =============================================================================
// Canvas Expand State Slice (E2)
// =============================================================================

/**
 * 三栏展开状态：
 * - default: 等分
 * - expand-left: 左侧栏扩展（收缩右侧）
 * - expand-right: 右侧栏扩展（收缩左侧）
 */
export type PanelExpandState = 'default' | 'expand-left' | 'expand-right';

/**
 * Grid template 计算常量（fr 单位）
 */
export const EXPAND_GRID = {
  DEFAULT_WIDTH: 1,
  EXPANDED_WIDTH: 1.5,
  COLLAPSED_WIDTH: 0,
} as const;

export interface ExpandSlice {
  /** 三栏展开状态 */
  leftExpand: PanelExpandState;
  centerExpand: PanelExpandState;
  rightExpand: PanelExpandState;
  /** 计算当前 grid-template-columns 值 */
  getGridTemplate: () => string;
  /** Actions */
  setLeftExpand: (state: PanelExpandState) => void;
  setCenterExpand: (state: PanelExpandState) => void;
  setRightExpand: (state: PanelExpandState) => void;
  togglePanel: (panel: 'left' | 'center' | 'right') => void;
  resetExpand: () => void;
}

export type CanvasStore = CanvasSlice & ContextSlice & FlowSlice & ComponentSlice & QueueSlice & ExpandSlice & DragSlice;

// =============================================================================
// Drag State (E3)
// =============================================================================

/** 节点拖拽位置 */
export interface Position {
  x: number;
  y: number;
}

/** 拖拽状态切片 */
export interface DragSlice {
  /** 当前正在拖拽的节点 ID */
  draggedNodeId: string | null;
  /** 拖拽目标覆盖节点 ID */
  dragOverNodeId: string | null;
  /**
   * 用户手动拖拽的节点位置映射
   * key: nodeId, value: Position
   * 优先级高于自动布局
   */
  draggedPositions: Record<string, Position>;
  /** 是否正在拖拽中（禁用面板展开热区） */
  isDragging: boolean;
  /** 开始拖拽 */
  startDrag: (nodeId: string) => void;
  /** 结束拖拽并记录位置 */
  endDrag: (nodeId: string, position: Position) => void;
  /** 设置拖拽覆盖目标 */
  setDragOver: (nodeId: string | null) => void;
  /** 更新拖拽位置（实时同步） */
  updateDraggedPosition: (nodeId: string, position: Position) => void;
  /** 清除所有拖拽位置 */
  clearDragPositions: () => void;
  /** 清除单个节点拖拽位置 */
  clearDragPosition: (nodeId: string) => void;
}

// =============================================================================
// Bounded Group — SVG Dashed Rect (E4)
// =============================================================================

/** Tree type → default stroke color for the group border */
export const BOUNDED_GROUP_COLORS: Record<TreeType, string> = {
  context: '#f59e0b',    // amber for bounded contexts
  flow: '#3b82f6',       // blue for business flows
  component: '#10b981',  // green for components
} as const;

export const DEFAULT_GROUP_STROKE_DASHARRAY = '5 3';
export const DEFAULT_GROUP_STROKE_WIDTH = 1.5;
export const DEFAULT_GROUP_PADDING = 12; // px padding inside the rect

/**
 * A bounded group — SVG dashed rectangle that wraps a set of related nodes.
 *
 * In the VibeX DDD context, a group corresponds to a "bounded context".
 * Multiple cards that belong to the same bounded context are visually grouped
 * by a dashed rect, making the domain boundaries immediately visible.
 */
export interface BoundedGroup {
  /** Unique group ID */
  groupId: string;
  /** Human-readable label shown in the top-right of the rect */
  label: string;
  /** Which tree this group belongs to */
  treeType: TreeType;
  /** IDs of the ReactFlow nodes that belong to this group */
  nodeIds: string[];
  /** CSS color for the dashed border. Defaults to tree-type color. */
  color?: string;
  /** Whether the group is currently visible */
  visible?: boolean;
}

/** Computed bounding box for a group — derived from node positions + dimensions */
export interface BoundedGroupBBox {
  groupId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Nodes inside this bounding box */
  nodeIds: string[];
}

// =============================================================================
// API Types
// =============================================================================

export interface CreateProjectInput {
  requirementText: string;
  contexts: BoundedContextNode[];
  flows: BusinessFlowNode[];
  components: ComponentNode[];
}

export interface CreateProjectOutput {
  projectId: string;
  status: 'created';
}

export interface GenerateInput {
  projectId: string;
  pageIds: string[];
  mode: 'parallel' | 'sequential';
}

export interface GenerateOutput {
  queueId: string;
  pages: Array<{ pageId: string; status: string }>;
}

export interface StatusOutput {
  projectId: string;
  pages: PrototypePage[];
  overallProgress: number;
}

// =============================================================================
// P1-T5: Domain & Step Type Derivation Utilities
// =============================================================================

/**
 * P1-T5: deriveDomainType — 从节点名称推断领域类型
 *
 * 规则：
 * - 名称包含 "用户" / "user" / "账户" / "账户" → core
 * - 名称包含 "日志" / "log" / "审计" / "audit" / "通用" / "generic" → generic
 * - 名称包含 "集成" / "integration" / "外部" / "external" / "第三方" / "3rd-party" → external
 * - 默认 → supporting
 */
export function deriveDomainType(name: string): BoundedContextNode['type'] {
  const lower = name.toLowerCase();
  if (/用户|user|账户|account|会员|member/.test(lower)) return 'core';
  if (/日志|log|审计|audit|通用|generic|配置|config|设置|settings/.test(lower)) return 'generic';
  if (/集成|integration|外部|external|第三方|3rd.party|webhook/i.test(lower)) return 'external';
  return 'supporting';
}

/**
 * P1-T5: deriveStepType — 从步骤名称推断步骤类型
 *
 * 规则：
 * - 名称包含 "判断" / "判断" / "if" / "条件" / "branch" / "分支" → branch
 * - 名称包含 "循环" / "loop" / "遍历" / "迭代" / "retry" / "重试" → loop
 * - 默认 → normal
 */
export function deriveStepType(name: string): FlowStep['type'] {
  const lower = name.toLowerCase();
  if (/判断|条件|if|branch|分支|switch/.test(lower)) return 'branch';
  if (/循环|loop|遍历|迭代|retry|重试|repeat/.test(lower)) return 'loop';
  return 'normal';
}

/**
 * P1-T5: Flow step type display configuration
 */
export const FLOW_STEP_TYPE_CONFIG: Record<
  NonNullable<FlowStep['type']>,
  { label: string; color: string; bgColor: string }
> = {
  normal: { label: '普通', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
  branch: { label: '分支', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  loop: { label: '循环', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
} as const;

/**
 * P1-T5: Domain type display configuration
 */
export const DOMAIN_TYPE_CONFIG: Record<
  BoundedContextNode['type'],
  { label: string; color: string; bgColor: string }
> = {
  core: { label: '核心域', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.05)' },
  supporting: { label: '支撑域', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.05)' },
  generic: { label: '通用域', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.05)' },
  external: { label: '外部域', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.05)' },
} as const;

/**
 * F2.2: deriveNodeType — 从步骤在列表中的位置推断节点类型
 */
export function deriveNodeType(index: number, total: number): FlowStep['nodeType'] {
  if (index === 0) return 'start';
  if (index === total - 1) return 'end';
  return 'process';
}

/**
 * F2.2: Flow node type display configuration
 */
export const FLOW_NODE_TYPE_CONFIG: Record<
  NonNullable<FlowStep['nodeType']>,
  { label: string; color: string }
> = {
  start: { label: '起点', color: '#22c55e' },
  end: { label: '终点', color: '#ef4444' },
  process: { label: '过程', color: '#6b7280' },
} as const;

// =============================================================================
// Canvas Generate API Types (Epic 1)
// =============================================================================

export interface GenerateContextsOutput {
  success: boolean;
  contexts: Array<{
    id: string;
    name: string;
    description: string;
    type: 'core' | 'supporting' | 'generic' | 'external';
  }>;
  sessionId: string;
  confidence: number;
  error?: string;
}

export interface GenerateFlowsOutput {
  success: boolean;
  flows: Array<{
    name: string;
    contextId: string;
    description?: string;
    steps: Array<{
      name: string;
      actor: string;
      description: string;
      order: number;
    }>;
  }>;
  confidence: number;
  error?: string;
}

export interface GenerateComponentsOutput {
  success: boolean;
  components: Array<{
    name: string;
    flowId: string;
    type: ComponentType;
    description?: string;
    api?: {
      method: 'GET' | 'POST';
      path: string;
      params: string[];
    };
  }>;
  confidence: number;
  error?: string;
}

// =============================================================================
// Tree Node (unified, for renderer)
// =============================================================================

export interface TreeNode {
  id: string;
  label: string;
  type: TreeType;
  status: NodeStatus;
  isActive?: boolean;
  parentId?: string;
  children: string[];
  data: BoundedContextNode | BusinessFlowNode | ComponentNode;
}

// =============================================================================
// Flow Gateway (Epic 2: 流程树分支与循环增强)
// =============================================================================

/** Gateway type for branching flows */
export type GatewayType = 'xor' | 'or';

/** Flow gateway node — represents a branch point in the business flow */
export interface FlowGateway {
  /** Unique gateway ID */
  gatewayId: string;
  /** Gateway type */
  type: GatewayType;
  /** Human-readable label shown inside the diamond */
  label?: string;
  /** Condition expression for XOR (e.g., "user.role === 'admin'") */
  condition?: string;
  /** Source step ID where this gateway branches from */
  sourceStepId: string;
  /** Target step IDs (branches from this gateway) */
  targetStepIds: string[];
  /** Whether this gateway has a loop-back path */
  hasLoop?: boolean;
  /** Step ID that this loop points back to */
  loopTargetStepId?: string;
}

/** ReactFlow node data for gateway nodes */
export interface GatewayNodeData extends Record<string, unknown> {
  gatewayType: GatewayType;
  label?: string;
  condition?: string;
  /** Visual size */
  width?: number;
  height?: number;
}

/** ReactFlow edge data for loop edges */
export interface LoopEdgeData extends Record<string, unknown> {
  isLoop: true;
  loopLabel?: string;
  condition?: string;
}

/** ReactFlow edge data for relationship edges */
export interface RelationshipEdgeData extends Record<string, unknown> {
  relationshipType: 'dependency' | 'aggregate' | 'calls';
  label?: string;
}

// =============================================================================
// Cascade
// =============================================================================

export type CascadeUpstream = 'context' | 'flow';

export interface CascadeResult {
  flowNodesMarked: number;
  componentNodesMarked: number;
}

// =============================================================================
// F2: BoundedEdge — 限界上下文连线（Epic 3 F3.1/F3.2）
// =============================================================================

/** BoundedEdge 连线类型 */
export type BoundedEdgeType = 'dependency' | 'composition' | 'association';

/**
 * BoundedEdge — 限界上下文卡片之间的连线
 *
 * from/to 指向 groupId（限界上下文组），可选 nodeId 指向组内具体节点
 * type 决定连线颜色和样式
 */
export interface BoundedEdge {
  id: string;
  from: { groupId: string; nodeId?: string };
  to: { groupId: string; nodeId?: string };
  type: BoundedEdgeType;
  label?: string;
}

/**
 * FlowEdge 连线类型
 *
 * from/to 指向 nodeId（流程节点 ID）
 * type 决定连线样式：sequence=实线, branch=虚线, loop=回环曲线
 */
export type FlowEdgeType = 'sequence' | 'branch' | 'loop';

/** FlowEdge — 流程节点之间的连线 */
export interface FlowEdge {
  id: string;
  from: string; // nodeId
  to: string;   // nodeId
  type: FlowEdgeType;
  label?: string;
}

/**
 * NodeRect — 带位置的矩形（用于连线定位计算）
 *
 * 从 ReactFlow Node[] 提取，供 BoundedEdgeLayer / FlowEdgeLayer 使用
 */
export interface NodeRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// ReactFlow v12 Full Node/Edge Types
// =============================================================================
// In v12, NodeProps<T> expects T to be a full Node type, not just data.
// We define the full types here for use in custom components.

import type { Node, Edge } from '@xyflow/react';

/** Full ReactFlow node type for GatewayNode */
export type GatewayNodeFull = Node<GatewayNodeData, 'gateway'>;

/** Full ReactFlow edge type for LoopEdge */
export type LoopEdgeFull = Edge<LoopEdgeData, 'loop'>;

/** Full ReactFlow edge type for RelationshipEdge */
export type RelationshipEdgeFull = Edge<RelationshipEdgeData, 'relationship'>;

// =============================================================================
// E4-F11: Version History — Canvas Snapshots
// =============================================================================

/** Canvas snapshot — a point-in-time capture of all three trees */
export interface CanvasSnapshot {
  snapshotId: string;
  projectId: string | null;
  /** Human-readable label for this snapshot */
  label: string;
  /** What triggered this snapshot */
  trigger: 'manual' | 'ai_complete' | 'auto';
  /** Snapshot creation timestamp (ISO string) */
  createdAt: string;
  /** Number of nodes in each tree at snapshot time */
  contextCount: number;
  flowCount: number;
  componentCount: number;
  /** Compact data — only stored if local-only mode */
  contextNodes?: BoundedContextNode[];
  flowNodes?: BusinessFlowNode[];
  componentNodes?: ComponentNode[];
}

export interface CreateSnapshotInput {
  projectId?: string | null;
  label: string;
  trigger: CanvasSnapshot['trigger'];
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
}

export interface CreateSnapshotOutput {
  success: boolean;
  snapshot: CanvasSnapshot;
}

export interface ListSnapshotsOutput {
  success: boolean;
  snapshots: CanvasSnapshot[];
}

export interface RestoreSnapshotOutput {
  success: boolean;
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
}
