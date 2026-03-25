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

export interface BoundedContextNode {
  nodeId: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  confirmed: boolean;
  status: NodeStatus;
  parentId?: string;
  children: string[];
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

export type CanvasStore = CanvasSlice & ContextSlice & FlowSlice & ComponentSlice & QueueSlice;

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
// Cascade
// =============================================================================

export type CascadeUpstream = 'context' | 'flow';

export interface CascadeResult {
  flowNodesMarked: number;
  componentNodesMarked: number;
}
