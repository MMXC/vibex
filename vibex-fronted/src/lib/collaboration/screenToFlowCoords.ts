/**
 * screenToFlowCoords — Convert screen coordinates to ReactFlow internal coordinates
 * Sprint 54 E3: 协作者 Cursor 实时同步
 *
 * ReactFlow stores node positions in flow-coordinate space.
 * mousemove events give screen coordinates relative to the viewport.
 * This utility converts between the two spaces.
 */
'use client';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

/**
 * Convert screen-relative coordinates to ReactFlow flow coordinates.
 *
 * ReactFlow viewport transform:
 *   screen_x = flow_x * zoom + viewport_x
 *   screen_y = flow_y * zoom + viewport_y
 *
 * Inverse:
 *   flow_x = (screen_x - viewport_x) / zoom
 *   flow_y = (screen_y - viewport_y) / zoom
 */
export function screenToFlowCoords(
  screenX: number,
  screenY: number,
  viewport: ViewportBounds
): { x: number; y: number } {
  const { x: vpX, y: vpY, zoom = 1 } = viewport;
  if (zoom === 0) return { x: screenX, y: screenY };
  return {
    x: (screenX - vpX) / zoom,
    y: (screenY - vpY) / zoom,
  };
}

/**
 * Convert ReactFlow flow coordinates back to screen coordinates.
 */
export function flowToScreenCoords(
  flowX: number,
  flowY: number,
  viewport: ViewportBounds
): { x: number; y: number } {
  const { x: vpX, y: vpY, zoom = 1 } = viewport;
  return {
    x: flowX * zoom + vpX,
    y: flowY * zoom + vpY,
  };
}
