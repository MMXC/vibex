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
// Cascade
// =============================================================================

export type CascadeUpstream = 'context' | 'flow';

export interface CascadeResult {
  flowNodesMarked: number;
  componentNodesMarked: number;
}
