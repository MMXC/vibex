/**
 * VibeX Canvas — Types
 * 三树并行画布核心类型定义
 */

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
  confirmed: boolean;
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
  confirmed: boolean;
  status: NodeStatus;
}

export interface BusinessFlowNode {
  nodeId: string;
  contextId: string;
  name: string;
  steps: FlowStep[];
  confirmed: boolean;
  status: NodeStatus;
  parentId?: string;
  children: string[];
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
  confirmed: boolean;
  status: NodeStatus;
  previewUrl?: string;
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

export type CanvasStore = CanvasSlice & ContextSlice & FlowSlice & ComponentSlice & QueueSlice & ExpandSlice;

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
  confirmed: boolean;
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
