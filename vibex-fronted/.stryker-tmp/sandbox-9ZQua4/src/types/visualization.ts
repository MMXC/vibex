/**
 * Visualization Types — Unified visualization abstraction layer
 *
 * Supports three visualization modes:
 * - 'flow': ReactFlow-based flow diagram
 * - 'mermaid': Mermaid diagram rendering
 * - 'json': JSON tree viewer (virtual scrolling)
 */
// @ts-nocheck


import type { Node, Edge } from '@xyflow/react';

// ==================== Visualization Type System ====================

/** Supported visualization modes */
export type VisualizationType = 'flow' | 'mermaid' | 'json' | 'cardtree';

/** Visualization data — generic wrapper */
export interface VisualizationData<T = unknown> {
  type: VisualizationType;
  raw: T;
  parsedAt?: string;
}

// ==================== Flow Visualization Types ====================

/** Flow node data stored in ReactFlow */
export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  [key: string]: unknown;
}

/** Flow edge data stored in ReactFlow */
export interface FlowEdgeData extends Record<string, unknown> {
  label?: string;
  animated?: boolean;
  checked?: boolean;
  [key: string]: unknown;
}

/** Flow visualization data */
export interface FlowVisualizationData extends VisualizationData<FlowVisualizationRaw> {
  type: 'flow';
}

export interface FlowVisualizationRaw {
  nodes: Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
  projectId?: string;
  name?: string;
}

// ==================== Mermaid Visualization Types ====================

/** Mermaid visualization data */
export interface MermaidVisualizationData extends VisualizationData<string> {
  type: 'mermaid';
}

/** Mermaid node metadata for click interactions */
export interface MermaidNodeInfo {
  id: string;
  label: string;
  type: string;
  raw?: string;
}

// ==================== Card Tree Visualization Types ====================

/** CardTree child item (checkbox row) */
export interface CardTreeChild {
  id: string;
  label: string;
  checked: boolean;
  description?: string;
  /** Action triggered on click */
  action?: string;
  /** Children (nested sub-items) */
  children?: CardTreeChild[];
  /** Whether children are expanded */
  isExpanded?: boolean;
}

/** CardTree node data */
export interface CardTreeNodeData extends Record<string, unknown> {
  /** Card title (e.g., "业务流程分析") */
  title: string;
  /** Optional description */
  description?: string;
  /** Card status */
  status: 'pending' | 'in-progress' | 'done' | 'error';
  /** Child items with checkbox state */
  children: CardTreeChild[];
  /** Whether all children are expanded */
  isExpanded?: boolean;
  /** Icon/emoji */
  icon?: string;
  /** Timestamp of last update */
  updatedAt?: string;
  /** F9: Start node marker — true for the first card in the tree */
  isStart?: boolean;
  /** F9: End node marker — true for the last card in the tree */
  isEnd?: boolean;
}

/** Full ReactFlow node type for CardTreeNode */
export type CardTreeNodeFull = Node<CardTreeNodeData, 'cardTreeNode'>;

/** CardTree visualization data */
export interface CardTreeVisualizationData extends VisualizationData<CardTreeVisualizationRaw> {
  type: 'cardtree';
}

export interface CardTreeVisualizationRaw {
  nodes: CardTreeNodeData[];
  projectId?: string;
  name?: string;
}

// ==================== JSON Tree Visualization Types ====================

/** JSON tree node for virtualized rendering */
export interface JsonTreeNode {
  id: string;
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  depth: number;
  path: string[];
  children?: JsonTreeNode[];
  isExpanded?: boolean;
  isLeaf?: boolean;
}

/** JSON tree visualization data */
export interface JsonTreeVisualizationData extends VisualizationData<JsonTreeVisualizationRaw> {
  type: 'json';
}

export interface JsonTreeVisualizationRaw {
  root: JsonTreeNode;
  totalCount: number;
}

// ==================== Unified Visualization Data ====================

/** Discriminated union for all visualization data */
export type AnyVisualizationData =
  | FlowVisualizationData
  | MermaidVisualizationData
  | JsonTreeVisualizationData
  | CardTreeVisualizationData;

// ==================== useVisualization Options ====================

/** Options passed to useVisualization hook */
export interface UseVisualizationOptions {
  /** Enable auto-parse on data change */
  autoParse?: boolean;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback */
  onSuccess?: (data: AnyVisualizationData) => void;
  /** Virtual scrolling: max visible nodes */
  maxVisibleNodes?: number;
  /** JSON tree: default expanded depth */
  defaultExpandedDepth?: number;
}

// ==================== Visualization Store State ====================

export interface VisualizationState {
  /** Current visualization type */
  currentType: VisualizationType;
  /** Raw input data (string or object) */
  rawData: unknown | null;
  /** Parsed visualization data */
  visualizationData: AnyVisualizationData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** UI options */
  options: {
    zoom: number;
    selectedNodeId: string | null;
    searchQuery: string;
    showMinimap: boolean;
  };
}

// ==================== Visualization Actions ====================

export interface VisualizationActions {
  /** Set visualization type */
  setType: (type: VisualizationType) => void;
  /** Set raw data (triggers parsing) */
  setData: (data: unknown) => void;
  /** Clear all state */
  clear: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: Error | null) => void;
  /** Set parsed data directly */
  setVisualizationData: (data: AnyVisualizationData) => void;
  /** Update UI options */
  setOption: <K extends keyof VisualizationState['options']>(
    key: K,
    value: VisualizationState['options'][K]
  ) => void;
  /** Reset UI options to defaults */
  resetOptions: () => void;
}

export type VisualizationStore = VisualizationState & VisualizationActions;
