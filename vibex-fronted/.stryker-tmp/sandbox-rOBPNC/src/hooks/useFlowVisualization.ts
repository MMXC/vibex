/**
 * useFlowVisualization — Hook for Flow visualization data management
 *
 * Parses flow data into ReactFlow format and provides state management.
 * Integrates with visualizationStore for unified state.
 */
// @ts-nocheck


'use client';

import { useCallback, useMemo } from 'react';
import type { Node, Edge, NodeTypes, EdgeTypes } from '@xyflow/react';
import type { FlowVisualizationRaw, FlowNodeData, FlowEdgeData } from '@/types/visualization';
import { useVisualizationStore } from '@/stores/visualizationStore';

// ==================== Default Node Types ====================

/** Default node types used in FlowRenderer */
export const DEFAULT_NODE_TYPES: NodeTypes = {};

// ==================== Default Edge Types ====================

/** Default edge types used in FlowRenderer */
export const DEFAULT_EDGE_TYPES: EdgeTypes = {};

// ==================== Hook Return Type ====================

export interface UseFlowVisualizationReturn {
  /** Parsed ReactFlow nodes */
  nodes: Node<FlowNodeData>[];
  /** Parsed ReactFlow edges */
  edges: Edge<FlowEdgeData>[];
  /** Whether data is loaded */
  isReady: boolean;
  /** Total node count */
  nodeCount: number;
  /** Total edge count */
  edgeCount: number;
  /** Get connected edges for a node */
  getConnectedEdges: (nodeId: string) => Edge<FlowEdgeData>[];
  /** Get connected nodes for a node */
  getConnectedNodes: (nodeId: string) => Node<FlowNodeData>[];
  /** Get node by ID */
  getNode: (nodeId: string) => Node<FlowNodeData> | undefined;
}

// ==================== Helpers ====================

/**
 * Convert FlowVisualizationRaw to ReactFlow nodes/edges
 */
function parseFlowData(raw: FlowVisualizationRaw | null): {
  nodes: Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
} {
  if (!raw) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node<FlowNodeData>[] = (raw.nodes || []).map((n) => {
    // If already a ReactFlow Node (has position and id), return with defaults applied
    if ('position' in n && 'id' in n) {
      const rn = n as Node<FlowNodeData>;
      return {
        ...rn,
        data: rn.data ?? { label: 'Node' },
        type: rn.type ?? 'default',
      };
    }
    // Fallback: convert from a generic object
    const obj = n as Record<string, unknown>;
    const pos = (obj['position'] as { x?: number; y?: number }) || { x: 0, y: 0 };
    const labelValue = obj['label'];
    const dataValue = obj['data'] as FlowNodeData | undefined;
    return {
      id: String(obj['id'] ?? Math.random()),
      position: { x: pos.x ?? 0, y: pos.y ?? 0 },
      data: dataValue ?? { label: typeof labelValue === 'string' ? labelValue : 'Node' },
      type: String(obj['type'] ?? 'default'),
    };
  });

  const edges: Edge<FlowEdgeData>[] = (raw.edges || []).map((e) => {
    if ('source' in e && 'target' in e && 'id' in e) {
      const re = e as Edge<FlowEdgeData>;
      return {
        ...re,
        type: re.type ?? 'smoothstep',
      };
    }
    const obj = e as Record<string, unknown>;
    return {
      id: String(obj['id'] ?? Math.random()),
      source: String(obj['source'] ?? ''),
      target: String(obj['target'] ?? ''),
      label: typeof obj['label'] === 'string' ? obj['label'] : undefined,
      type: String(obj['type'] ?? 'smoothstep'),
      animated: Boolean(obj['animated']),
    };
  });

  return { nodes, edges };
}

// ==================== Hook ====================

/**
 * useFlowVisualization — Manages Flow visualization data
 *
 * @param rawData - FlowVisualizationRaw data (from store or props)
 * @returns Parsed nodes/edges and helper functions
 */
export function useFlowVisualization(
  rawData: FlowVisualizationRaw | null | undefined
): UseFlowVisualizationReturn {
  // Parse the raw data
  const parsed = useMemo(() => parseFlowData(rawData ?? null), [rawData]);

  const { nodes: parsedNodes, edges: parsedEdges } = parsed;

  // Helper: get connected edges for a node
  const getConnectedEdges = useCallback(
    (nodeId: string): Edge<FlowEdgeData>[] =>
      parsedEdges.filter((e) => e.source === nodeId || e.target === nodeId),
    [parsedEdges]
  );

  // Helper: get connected nodes for a node
  const getConnectedNodes = useCallback(
    (nodeId: string): Node<FlowNodeData>[] => {
      const connectedEdgeIds = new Set(
        parsedEdges
          .filter((e) => e.source === nodeId || e.target === nodeId)
          .flatMap((e) => [e.source, e.target])
      );
      return parsedNodes.filter(
        (n) => connectedEdgeIds.has(n.id) && n.id !== nodeId
      );
    },
    [parsedNodes, parsedEdges]
  );

  // Helper: get node by ID
  const getNode = useCallback(
    (nodeId: string): Node<FlowNodeData> | undefined =>
      parsedNodes.find((n) => n.id === nodeId),
    [parsedNodes]
  );

  return {
    nodes: parsedNodes,
    edges: parsedEdges,
    isReady: true,
    nodeCount: parsedNodes.length,
    edgeCount: parsedEdges.length,
    getConnectedEdges,
    getConnectedNodes,
    getNode,
  };
}

// ==================== Sync with Store ====================

/**
 * useFlowVisualizationWithStore — Hook that also syncs with visualizationStore
 *
 * Convenience hook that reads rawData from visualizationStore (with optional
 * prop fallback) and syncs UI state (selectedNodeId) back to the store.
 */
export function useFlowVisualizationWithStore(data?: FlowVisualizationRaw | null) {
  const { visualizationData, setOption, options } = useVisualizationStore();

  const rawData = useMemo(
    () =>
      visualizationData?.type === 'flow'
        ? (visualizationData.raw as FlowVisualizationRaw)
        : data ?? null,
    [visualizationData, data]
  );

  const flow = useFlowVisualization(rawData);

  // Sync selected node to store on click
  // Note: FlowEditor's onNodeClick prop is (node: Node) => void
  // ReactFlow's onNodeClick event is (event, node) => void
  const handleNodeClick = useCallback(
    (nodeOrEvent: Node | React.MouseEvent, maybeNode?: Node) => {
      const node = maybeNode ?? (nodeOrEvent as Node);
      if (node?.id) {
        setOption('selectedNodeId', node.id);
      }
    },
    [setOption]
  );

  return {
    ...flow,
    selectedNodeId: options.selectedNodeId,
    zoom: options.zoom,
    showMinimap: options.showMinimap,
    handleNodeClick,
  };
}
