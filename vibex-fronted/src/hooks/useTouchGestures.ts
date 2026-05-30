/**
 * useTouchGestures.ts — Touch gesture recognition for mobile/tablet canvas
 *
 * E5: 移动端触控支持 (Sprint44 — completed implementation)
 * Handles: pinch-to-zoom (0.1–4x) + two-finger pan + double-tap node select
 *
 * Usage:
 *   const gestures = useTouchGestures({ onNodeSelect, getZoom, getViewport, setViewport, getNodes });
 *   <div onPointerDown={gestures.onPointerDown} onTouchStart={gestures.onTouchStart} />
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
  setViewport: (vp: Viewport) => void;
  /** Get all nodes for hit testing */
  getNodes: () => Node[];
}

export interface TouchGesturesReturn {
  /** Attach to element's onPointerDown */
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to element's onTouchStart */
  onTouchStart: (e: React.TouchEvent<HTMLElement>) => void;
  /** True when touch gesture is active */
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
  initialMidpoint: { x: number; y: number } | null;
  initialZoom: number;
  initialViewport: Viewport;
  // Track active touch identifiers
  activeTouches: Map<number, { x: number; y: number }>;
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

function getMidpoint(
  t1: { clientX: number; clientY: number },
  t2: { clientX: number; clientY: number },
): { x: number; y: number } {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

/**
 * Hook for handling touch gestures on the canvas.
 *
 * Detects pinch-to-zoom, two-finger pan, and double-tap node selection.
 * Uses native touch events for reliable multi-touch detection.
 *
 * @example
 * const gestures = useTouchGestures({
 *   getZoom: () => viewport.zoom,
 *   getViewport: () => viewport,
 *   setViewport,
 *   getNodes: () => nodes,
 *   onNodeSelect: (id) => { /* ... *\\/ },
 * });
 * <div onTouchStart={gestures.onTouchStart} />
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
    initialMidpoint: null,
    initialZoom: 1,
    initialViewport: { x: 0, y: 0, zoom: 1 },
    activeTouches: new Map(),
  });

  // ─── Gesture indicator helper ────────────────────────────────────────────────
  const showIndicator = useCallback(
    (text: string, subtext?: string) => {
      setIndicatorStyle({
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: subtext ? '8px 16px' : '6px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        zIndex: 9999,
        pointerEvents: 'none',
        textAlign: 'center' as const,
        minWidth: '120px',
      });
      // Store the text for display
      (stateRef.current as unknown as { _indicatorText?: string })._indicatorText = text;
    },
    [],
  );

  const hideIndicator = useCallback(() => {
    setIndicatorStyle({});
  }, []);

  const showGestureMode = useCallback(
    (mode: 'pan' | 'zoom') => {
      setIsGestureActive(true);
      const text =
        mode === 'zoom' ? '🤏 双指缩放' : '✋ 双指平移';
      showIndicator(text);
    },
    [showIndicator],
  );

  // ─── Native touch event handlers ────────────────────────────────────────────
  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const state = stateRef.current;
      const touches = Array.from(e.touches);

      // Store all active touches
      for (const t of touches) {
        state.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }

      if (touches.length === 1) {
        // ── One finger: prepare for pan or double-tap ────────────────────────
        const t0 = touches[0];
        const vp = getViewport();
        stateRef.current = {
          ...state,
          mode: 'one-finger',
          panStart: { x: t0.clientX, y: t0.clientY },
          initialViewport: vp,
          initialZoom: vp.zoom,
          initialDistance: null,
          initialMidpoint: null,
          activeTouches: state.activeTouches,
        };
        setIsGestureActive(true);
        showIndicator('✋ 单指拖动');
      } else if (touches.length === 2) {
        // ── Two fingers: determine pinch vs pan ──────────────────────────────
        const t0 = touches[0];
        const t1 = touches[1];
        const dist = getDistance(t0, t1);
        const mid = getMidpoint(t0, t1);
        const vp = getViewport();

        // Initial distance between two fingers determines if we start in pan or zoom mode
        stateRef.current = {
          ...state,
          mode: 'two-finger',
          panStart: { x: mid.x, y: mid.y },
          initialDistance: dist,
          initialMidpoint: mid,
          initialViewport: vp,
          initialZoom: vp.zoom,
          activeTouches: state.activeTouches,
        };
      }
    },
    [getViewport, showIndicator],
  );

  // Use passive: false to allow preventDefault on touchmove
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      const state = stateRef.current;
      const touches = Array.from(e.touches);

      // Update active touches
      for (const t of touches) {
        state.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }

      if (state.mode === 'one-finger' && touches.length === 1) {
        // ── One-finger pan ─────────────────────────────────────────────────
        const t0 = touches[0];
        if (!state.panStart) return;
        const dx = t0.clientX - state.panStart.x;
        const dy = t0.clientY - state.panStart.y;
        const zoom = getZoom();
        // Convert screen delta to canvas delta (account for zoom)
        const newVp: Viewport = {
          ...state.initialViewport,
          x: state.initialViewport.x + dx / zoom,
          y: state.initialViewport.y + dy / zoom,
        };
        setViewport(newVp);
      } else if (
        (state.mode === 'two-finger' || state.mode === 'pinch') &&
        touches.length === 2
      ) {
        // ── Two-finger pan + pinch-to-zoom ───────────────────────────────────
        const t0 = touches[0];
        const t1 = touches[1];
        const dist = getDistance(t0, t1);
        const mid = getMidpoint(t0, t1);

        if (!state.initialDistance || !state.initialMidpoint) {
          // First move with two fingers — switch to pinch mode
          const vp = getViewport();
          stateRef.current = {
            ...state,
            mode: 'pinch',
            initialDistance: dist,
            initialMidpoint: mid,
            initialViewport: vp,
            initialZoom: vp.zoom,
            activeTouches: state.activeTouches,
          };
          return;
        }

        const scale = dist / state.initialDistance;
        const dx = mid.x - state.initialMidpoint.x;
        const dy = mid.y - state.initialMidpoint.y;
        const zoom = Math.min(maxZoom, Math.max(minZoom, state.initialZoom * scale));
        const zoomRatio = zoom / state.initialZoom;

        // Pan: move viewport opposite to finger movement, accounting for current zoom
        const panX = state.initialViewport.x + dx / zoom;
        const panY = state.initialViewport.y + dy / zoom;

        const newVp: Viewport = {
          x: panX,
          y: panY,
          zoom,
        };
        setViewport(newVp);

        // Show appropriate indicator
        const zoomPercent = Math.round(zoom * 100);
        if (Math.abs(scale - 1) > 0.05) {
          showGestureMode('zoom');
          // Update indicator with zoom level
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
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const state = stateRef.current;
      const remainingTouches = Array.from(e.touches);

      // Remove ended touches
      for (const t of Array.from(state.activeTouches.keys())) {
        const found = remainingTouches.find((rt) => rt.identifier === t);
        if (!found) {
          state.activeTouches.delete(t);
        }
      }

      const now = Date.now();

      if (state.mode === 'one-finger' && e.touches.length === 0) {
        // Single tap or double-tap end
        const wasTap = !state.panStart ||
          (Math.abs(e.changedTouches[0].clientX - (state.panStart?.x ?? 0)) < 10 &&
           Math.abs(e.changedTouches[0].clientY - (state.panStart?.y ?? 0)) < 10);

        if (wasTap && now - state.lastTapTime < DOUBLE_TAP_MS) {
          // Double-tap: try to select a node
          const tapX = e.changedTouches[0].clientX;
          const tapY = e.changedTouches[0].clientY;
          const curVp = getViewport();
          const nodes = getNodes();

          for (const node of nodes) {
            const pos = node.position;
            const width = (node as { width?: number }).width ?? (node as { measured?: { width: number } }).measured?.width ?? 200;
            const height = (node as { height?: number }).height ?? (node as { measured?: { height: number } }).measured?.height ?? 80;
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
          ...state,
          mode: 'none',
          lastTapTime: now,
          panStart: null,
          activeTouches: state.activeTouches,
        };
        setIsGestureActive(false);
        hideIndicator();
      } else if (
        (state.mode === 'two-finger' || state.mode === 'pinch') &&
        e.touches.length < 2
      ) {
        // Two-finger gesture ended
        stateRef.current = {
          ...state,
          mode: 'none',
          initialDistance: null,
          initialMidpoint: null,
          activeTouches: state.activeTouches,
        };
        setIsGestureActive(false);
        hideIndicator();
      }
    };

    // Attach to the document since we can't attach to the element reliably
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    getViewport,
    getNodes,
    getZoom,
    maxZoom,
    minZoom,
    onNodeSelect,
    setViewport,
    showGestureMode,
    hideIndicator,
  ]);

  // ─── Pointer event handler (fallback / desktop) ─────────────────────────────
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
        initialMidpoint: null,
        panStart: { x: e.clientX, y: e.clientY },
        lastTapTime: state.lastTapTime,
        activeTouches: new Map([[e.pointerId, { x: e.clientX, y: e.clientY }]]),
      };

      const handlePointerMove = (moveEvent: Event) => {
        const move = moveEvent as PointerEvent;
        const s = stateRef.current;
        if (s.mode === 'one-finger' && move.isPrimary) {
          setIsGestureActive(true);
          showIndicator('✋ 单指拖动');
        }
      };

      const handlePointerUp = (upEvent: Event) => {
        const up = upEvent as PointerEvent;
        const s = stateRef.current;
        const now = Date.now();

        if (s.mode === 'one-finger') {
          if (now - s.lastTapTime < DOUBLE_TAP_MS) {
            const nodes = getNodes();
            const tapX = up.clientX;
            const tapY = up.clientY;
            const curVp = getViewport();

            for (const node of nodes) {
              const pos = node.position;
              const width = (node as { width?: number }).width ?? (node as { measured?: { width: number } }).measured?.width ?? 200;
              const height = (node as { height?: number }).height ?? (node as { measured?: { height: number } }).measured?.height ?? 80;
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
        hideIndicator();
        target.removeEventListener('pointermove', handlePointerMove);
        target.removeEventListener('pointerup', handlePointerUp);
      };

      target.addEventListener('pointermove', handlePointerMove);
      target.addEventListener('pointerup', handlePointerUp, { once: true });
    },
    [getViewport, getNodes, onNodeSelect, showIndicator, hideIndicator],
  );

  return { onPointerDown, onTouchStart, isGestureActive, indicatorStyle };
}
