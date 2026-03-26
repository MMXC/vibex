/**
 * useVisualization — Unified visualization hook
 *
 * Provides a single entry point for all three visualization modes:
 * - 'flow': ReactFlow diagram
 * - 'mermaid': Mermaid diagram
 * - 'json': JSON tree viewer
 *
 * Integrates with visualizationStore for shared state and URL sync.
 */

'use client';

import { useCallback, useMemo } from 'react';
import type {
  VisualizationType,
  FlowVisualizationRaw,
  FlowNodeData,
  FlowEdgeData,
  JsonTreeNode,
  AnyVisualizationData,
} from '@/types/visualization';
import { useVisualizationStore } from '@/stores/visualizationStore';

// ==================== Return Type ====================

export interface UseVisualizationReturn {
  /** Current visualization type */
  currentType: VisualizationType;
  /** Switch to a different visualization type */
  switchType: (type: VisualizationType) => void;
  /** Transition animation duration in ms */
  transitionTime: number;
  /** Current error, if any */
  error: Error | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Current state summary */
  state: {
    /** Flow nodes (only valid when currentType === 'flow') */
    nodes?: import('@xyflow/react').Node<FlowNodeData>[];
    /** Flow edges (only valid when currentType === 'flow') */
    edges?: import('@xyflow/react').Edge<FlowEdgeData>[];
    /** Mermaid code (only valid when currentType === 'mermaid') */
    code?: string;
    /** JSON data (only valid when currentType === 'json') */
    json?: unknown;
    /** Parsed visualization data */
    data: AnyVisualizationData | null;
  };
  /** Raw data reference */
  rawData: unknown | null;
  /** Store options snapshot */
  options: {
    zoom: number;
    selectedNodeId: string | null;
    searchQuery: string;
    showMinimap: boolean;
  };
  /** Clear all state */
  clear: () => void;
}

// ==================== Hook ====================

/**
 * useVisualization — Unified visualization entry point
 *
 * Reads currentType from the store and returns state for the active mode.
 * Use switchType to change modes (triggers CSS transition).
 *
 * @example
 * ```tsx
 * const viz = useVisualization();
 * console.log(viz.currentType); // 'flow' | 'mermaid' | 'json'
 * return <button onClick={() => viz.switchType('mermaid')}>Switch</button>;
 * ```
 */
export function useVisualization(): UseVisualizationReturn {
  const store = useVisualizationStore();

  const { currentType, rawData, visualizationData, isLoading, error, options, setType, clear } =
    store;

  const switchType = useCallback(
    (type: VisualizationType) => {
      setType(type);
    },
    [setType]
  );

  const state = useMemo(() => {
    const base = {
      data: visualizationData,
    };

    switch (currentType) {
      case 'flow': {
        const flowRaw = rawData as FlowVisualizationRaw | null;
        const nodes = (flowRaw?.nodes ?? []) as import('@xyflow/react').Node<FlowNodeData>[];
        const edges = (flowRaw?.edges ?? []) as import('@xyflow/react').Edge<FlowEdgeData>[];
        return { ...base, nodes, edges };
      }
      case 'mermaid': {
        const code = typeof rawData === 'string' ? rawData : '';
        return { ...base, code };
      }
      case 'json': {
        return { ...base, json: rawData };
      }
      default:
        return base;
    }
  }, [currentType, rawData, visualizationData]);

  return {
    currentType,
    switchType,
    transitionTime: 150,
    error,
    isLoading,
    state,
    rawData,
    options,
    clear,
  };
}

export default useVisualization;
