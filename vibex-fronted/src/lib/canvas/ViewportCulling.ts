/**
 * ViewportCulling — Pure utility for AABB-based viewport culling
 * S54-E4: Canvas Performance Optimization
 *
 * Filters ReactFlow nodes to only those visible within the current viewport bounds.
 * Uses Axis-Aligned Bounding Box (AABB) intersection detection.
 */
import type { Node } from '@xyflow/react';
import type { ViewportBounds } from '../stores/viewportBoundsStore';

/**
 * Check if two rectangles intersect (AABB intersection)
 */
export function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Get the bounding box of a ReactFlow node.
 * ReactFlow nodes have `position: { x, y }` and optionally `style: { width, height }`.
 * If width/height are not set in style, uses default dimensions (200x80).
 */
export function getNodeBounds(node: Node): { x: number; y: number; width: number; height: number } {
  const style = node.style ?? {};
  const width = typeof style.width === 'number' ? style.width : 200;
  const height = typeof style.height === 'number' ? style.height : 80;
  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height,
  };
}

/**
 * Get the visible nodes based on viewport bounds.
 * A node is visible if its bounding box intersects with the viewport rectangle.
 *
 * @param nodes - All ReactFlow nodes
 * @param viewport - Current viewport bounds (screen coordinates)
 * @returns Array of node IDs that are within the viewport
 */
export function getVisibleNodes(nodes: Node[], viewport: ViewportBounds): string[] {
  if (viewport.width === 0 || viewport.height === 0) {
    // No viewport data yet — all nodes visible
    return nodes.map((n) => n.id);
  }

  // Viewport bounds in screen coordinates (x, y are top-left of viewport)
  const viewportRect = {
    x: viewport.x,
    y: viewport.y,
    width: viewport.width,
    height: viewport.height,
  };

  return nodes
    .filter((node) => rectsIntersect(getNodeBounds(node), viewportRect))
    .map((n) => n.id);
}

/**
 * Compute the ratio of visible nodes to total nodes.
 * Useful for performance monitoring.
 */
export function getVisibilityRatio(nodes: Node[], viewport: ViewportBounds): number {
  if (nodes.length === 0) return 1;
  return getVisibleNodes(nodes, viewport).length / nodes.length;
}
