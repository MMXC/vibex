/**
 * useViewportVirtualization — S71-E3: 大型画布性能优化
 *
 * Filters nodes to only those within the current viewport + padding,
 * to avoid rendering off-screen nodes in large canvases.
 *
 * Hook returns filtered nodes for ReactFlow to render.
 */
import { useMemo } from 'react';
import type { Node } from '@xyflow/react';

export interface ViewportBounds {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export interface VirtualizationOptions {
  /** Extra padding around viewport (px). Default 200. */
  padding?: number;
  /** Max visible nodes. Default 200. */
  maxVisible?: number;
}

/**
 * Filter nodes to those within the given viewport bounds.
 */
export function filterNodesByViewport(
  nodes: Node[],
  viewport: ViewportBounds,
  padding = 200
): Node[] {
  if (!nodes.length) return [];

  const { x, y, zoom, width, height } = viewport;
  const scale = zoom || 1;

  // Visible area in flow coordinates
  const left = -x / scale - padding;
  const top = -y / scale - padding;
  const right = (-x + width) / scale + padding;
  const bottom = (-y + height) / scale + padding;

  return nodes.filter(node => {
    const nx = node.position.x;
    const ny = node.position.y;
    // Node is within viewport if its top-left corner falls in visible area
    return nx >= left && nx <= right && ny >= top && ny <= bottom;
  });
}

/**
 * Main hook — returns filtered visible nodes based on current viewport.
 */
export function useViewportVirtualization(
  allNodes: Node[],
  viewport: ViewportBounds,
  options: VirtualizationOptions = {}
): Node[] {
  const { padding = 200, maxVisible = 200 } = options;

  return useMemo(() => {
    const filtered = filterNodesByViewport(allNodes, viewport, padding);
    // If still too many, take the closest ones to center
    if (filtered.length > maxVisible) {
      const cx = viewport.x / (viewport.zoom || 1) + viewport.width / 2;
      const cy = viewport.y / (viewport.zoom || 1) + viewport.height / 2;
      return filtered
        .sort((a, b) => {
          const da = Math.hypot(a.position.x - cx, a.position.y - cy);
          const db = Math.hypot(b.position.x - cx, b.position.y - cy);
          return da - db;
        })
        .slice(0, maxVisible);
    }
    return filtered;
  }, [allNodes, viewport, padding, maxVisible]);
}
