/**
 * Coordinate transformation utilities for ReactFlow canvas
 *
 * E3: 协作者 Cursor 同步完善
 * Provides screen→flow coordinate conversion using ReactFlow's screenToFlowPosition.
 *
 * @module lib/canvas/coords
 */

import { screenToFlowPosition, type XYPosition } from '@xyflow/react';

/**
 * Viewport bounds from ReactFlow's getViewport()
 */
export interface ViewportBounds {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Convert screen coordinates (clientX/clientY) to flow canvas coordinates.
 *
 * This is a thin wrapper around @xyflow/react's `screenToFlowPosition`
 * that accepts viewport info explicitly, making it easier to test and use
 * outside the React component tree.
 *
 * @param screenX - clientX from mouse event
 * @param screenY - clientY from mouse event
 * @param viewport - current viewport from useReactFlow().getViewport()
 * @returns flow coordinates (XYPosition)
 *
 * @example
 * const viewport = useReactFlow().getViewport();
 * const { x, y } = screenToFlowCoords(e.clientX, e.clientY, viewport);
 */
export function screenToFlowCoords(
  screenX: number,
  screenY: number,
  viewport: ViewportBounds
): XYPosition {
  // screenToFlowPosition accepts {x, y} in screen space
  // and converts to flow canvas coordinates using the viewport
  return screenToFlowPosition({ x: screenX, y: screenY }, viewport);
}

/**
 * Convert a flow coordinate back to screen coordinate.
 *
 * @param flowX - x in flow canvas space
 * @param flowY - y in flow canvas space
 * @param viewport - current viewport
 * @returns screen coordinates
 */
export function flowToScreenCoords(
  flowX: number,
  flowY: number,
  viewport: ViewportBounds
): XYPosition {
  // Apply inverse of the viewport transform:
  // screen = flow * zoom + viewport_offset
  return {
    x: flowX * viewport.zoom + viewport.x,
    y: flowY * viewport.zoom + viewport.y,
  };
}
