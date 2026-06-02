/**
 * useViewportCulling — Hook for viewport culling of ReactFlow nodes
 * S54-E4: Canvas Performance Optimization
 *
 * Integrates viewportBoundsStore with ViewportCulling utility.
 * Provides the list of node IDs that are within the current viewport.
 *
 * Usage:
 *   const visibleNodeIds = useViewportCulling(allNodes);
 *   <ReactFlow nodes={allNodes.filter(n => visibleNodeIds.includes(n.id))} ... />
 */
import { useMemo } from 'react';
import type { Node } from '@xyflow/react';
import { useViewportBoundsStore } from '@/lib/canvas/stores/viewportBoundsStore';
import { getVisibleNodes } from './ViewportCulling';

export interface UseViewportCullingOptions {
  /** Threshold: if visible ratio > threshold, skip culling (render all) */
  threshold?: number;
}

/**
 * Returns the list of visible node IDs based on current viewport.
 *
 * @param nodes - All ReactFlow nodes (useMemo'd by caller to avoid re-renders)
 * @param options - Optional culling configuration
 */
export function useViewportCulling(
  nodes: Node[],
  options: UseViewportCullingOptions = {}
): string[] {
  const { threshold = 0.8 } = options;
  const viewportBounds = useViewportBoundsStore((s) => s.viewportBounds);

  const visibleNodeIds = useMemo(() => {
    // If no viewport data yet, all nodes are "visible"
    if (viewportBounds.width === 0 || viewportBounds.height === 0) {
      return nodes.map((n) => n.id);
    }

    const visible = getVisibleNodes(nodes, viewportBounds);

    // If >threshold% of nodes are visible, skip culling overhead
    if (nodes.length > 0 && visible.length / nodes.length >= threshold) {
      return nodes.map((n) => n.id);
    }

    return visible;
  }, [nodes, viewportBounds, threshold]);

  return visibleNodeIds;
}
