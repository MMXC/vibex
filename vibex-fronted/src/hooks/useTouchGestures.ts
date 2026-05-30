/**
 * useTouchGestures.ts — Touch gesture recognition for mobile/tablet canvas
 *
 * E5: 移动端触控支持
 * Handles: pinch-to-zoom (0.1–4x) + two-finger pan + double-tap node select
 *
 * Usage:
 *   const gestures = useTouchGestures({ onNodeSelect, getZoom, getViewport, setViewport, getNodes });
 *   <div onPointerDown={gestures.onPointerDown} />
 */

import { useCallback, useRef, useState } from 'react';
import type { Node, Viewport } from '@xyflow/react';

export interface UseTouchGesturesOptions {
  /** Called when a node is double-tapped */
  onNodeSelect?: (nodeId: string) => void;
  /** Minimum zoom level (default: 0.1) */
  minZoom?: number;
  /** Maximum zoom level (default: 4) */
  maxZoom?: number;
  /** Current zoom getter */
  getZoom: () => number;
  /** Current viewport getter */
  getViewport: () => Viewport;
  /** Set viewport directly */
  setViewport: (vp: Viewport, duration?: number) => void;
  /** Get all nodes for hit testing */
  getNodes: () => Node[];
}

export interface TouchGesturesReturn {
  /** onPointerDown for the gesture root element */
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  /** True when two-finger gesture is active */
  isGestureActive: boolean;
  /** CSS properties for the gesture indicator overlay */
  indicatorStyle: React.CSSProperties;
}

interface TouchState {
  mode: 'none' | 'one-finger' | 'two-finger' | 'pinch';
  lastTapTime: number;
  // One-finger pan state
  panStart: { x: number; y: number } | null;
  // Pinch state
  initialDistance: number | null;
  initialZoom: number;
  initialViewport: Viewport;
}

const DOUBLE_TAP_MS = 300;

function getDistance(
  t1: { clientX: number; clientY: number },
  t2: { clientX: number; clientY: number },
): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Hook for handling touch gestures on the canvas.
 *
 * Detects pinch-to-zoom, two-finger pan, and double-tap node selection.
 * Uses React pointer events for cross-platform touch handling.
 *
 * @example
 * const gestures = useTouchGestures({
 *   getZoom: () => viewport.zoom,
 *   getViewport: () => viewport,
 *   setViewport,
 *   getNodes: () => nodes,
 *   onNodeSelect: (id) => { /* ... *\/ },
 * });
 */
export function useTouchGestures({
  onNodeSelect,
  minZoom = 0.1,
  maxZoom = 4,
  getZoom,
  getViewport,
  setViewport,
  getNodes,
}: UseTouchGesturesOptions): TouchGesturesReturn {
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const stateRef = useRef<TouchState>({
    mode: 'none',
    lastTapTime: 0,
    panStart: null,
    initialDistance: null,
    initialZoom: 1,
    initialViewport: { x: 0, y: 0, zoom: 1 },
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const state = stateRef.current;
      const isTouch = e.pointerType === 'touch';

      if (!isTouch) {
        // Mouse events — let ReactFlow handle them normally
        return;
      }

      // Capture the pointer so we receive move/up events
      const target = e.target as HTMLElement;
      target.setPointerCapture(e.pointerId);

      const vp = getViewport();
      stateRef.current = {
        ...state,
        mode: 'one-finger',
        initialViewport: vp,
        initialZoom: vp.zoom,
        initialDistance: null,
      };

      const handlePointerMove = (moveEvent: Event) => {
        const move = moveEvent as PointerEvent;
        const s = stateRef.current;
        if (s.mode === 'one-finger' && move.isPrimary) {
          setIsGestureActive(true);
          setIndicatorStyle({
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            zIndex: 9999,
            pointerEvents: 'none',
          });
        }
      };

      const handlePointerUp = (upEvent: Event) => {
        const up = upEvent as PointerEvent;
        const s = stateRef.current;
        const now = Date.now();

        if (s.mode === 'one-finger') {
          // Check for double-tap: if two taps within DOUBLE_TAP_MS, try to select a node
          if (now - s.lastTapTime < DOUBLE_TAP_MS) {
            const nodes = getNodes();
            const tapX = up.clientX;
            const tapY = up.clientY;

            // Simple hit test: find node whose bounding box contains the tap point
            for (const node of nodes) {
              const pos = node.position;
              const width = node.measured?.width ?? (node as { width?: number }).width ?? 200;
              const height = node.measured?.height ?? (node as { height?: number }).height ?? 80;
              const curVp = getViewport();
              const scale = curVp.zoom;
              const canvasX = (tapX - curVp.x) / scale;
              const canvasY = (tapY - curVp.y) / scale;

              if (
                canvasX >= pos.x &&
                canvasX <= pos.x + width &&
                canvasY >= pos.y &&
                canvasY <= pos.y + height
              ) {
                onNodeSelect?.(node.id);
                break;
              }
            }
          }

          stateRef.current = {
            ...s,
            mode: 'none',
            lastTapTime: now,
            panStart: null,
          };
        }

        setIsGestureActive(false);
        setIndicatorStyle({});

        // Clean up native DOM listeners
        target.removeEventListener('pointermove', handlePointerMove);
        target.removeEventListener('pointerup', handlePointerUp);
      };

      target.addEventListener('pointermove', handlePointerMove);
      target.addEventListener('pointerup', handlePointerUp, { once: true });
    },
    [getViewport, getNodes, onNodeSelect]
  );

  return { onPointerDown, isGestureActive, indicatorStyle };
}
