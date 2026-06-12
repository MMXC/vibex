/** useTouchGestures.ts — S92-E4 */
import { useCallback, useRef } from "react";

const LONG_PRESS_DURATION = 500;
const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.3;

export interface TouchGesturesCallbacks {
  onNodeLongPress?: (nodeId: string) => void;
  onNodeDragMove?: (nodeId: string, dx: number, dy: number, x: number, y: number) => void;
  onNodeDragEnd?: (nodeId: string, x: number, y: number) => void;
  onNodeSwipeDelete?: (nodeId: string) => void;
  onViewportPan?: (dx: number, dy: number) => void;
  onViewportPinch?: (scale: number, centerX: number, centerY: number) => void;
}

interface GestureState {
  mode: "none" | "viewport" | "node";
  nodeId: string | null;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
  lastTouchDistance: number | null;
}

export function useTouchGestures(callbacks: TouchGesturesCallbacks) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gs = useRef<GestureState>({
    mode: "none", nodeId: null, startX: 0, startY: 0,
    lastX: 0, lastY: 0, startTime: Date.now(), lastTouchDistance: null,
  });

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  const getDist = (t: TouchList) => {
    if (t.length < 2) return 0;
    const dx = t[0].clientX - t[1].clientX; const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx*dx + dy*dy);
  };

  const getCenter = (t: TouchList) => {
    if (t.length < 2) return { x: t[0].clientX, y: t[0].clientY };
    return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 };
  };

  const registerNodeTouch = useCallback((nodeId: string, x: number, y: number) => {
    clearLongPress();
    gs.current = { mode: "node", nodeId, startX: x, startY: y, lastX: x, lastY: y, startTime: Date.now(), lastTouchDistance: null };
    longPressTimer.current = setTimeout(() => { callbacks.onNodeLongPress?.(nodeId); }, LONG_PRESS_DURATION);
  }, [clearLongPress, callbacks]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    clearLongPress();
    if (e.touches.length === 2) {
      const c = getCenter(e.touches);
      gs.current = { mode: "viewport", nodeId: null, startX: c.x, startY: c.y, lastX: c.x, lastY: c.y, startTime: Date.now(), lastTouchDistance: getDist(e.touches) };
    } else if (e.touches.length === 1) {
      gs.current = { mode: "viewport", nodeId: null, startX: e.touches[0].clientX, startY: e.touches[0].clientY, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY, startTime: Date.now(), lastTouchDistance: null };
    }
  }, [clearLongPress]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (gs.current.mode === "none") return;
    if (e.touches.length === 2 && gs.current.mode === "viewport") {
      const d = getDist(e.touches); const c = getCenter(e.touches);
      if (gs.current.lastTouchDistance !== null) callbacks.onViewportPinch?.(d / gs.current.lastTouchDistance, c.x, c.y);
      gs.current.lastTouchDistance = d; gs.current.lastX = c.x; gs.current.lastY = c.y;
    } else if (e.touches.length === 1) {
      const x = e.touches[0].clientX; const y = e.touches[0].clientY;
      const dx = x - gs.current.lastX; const dy = y - gs.current.lastY;
      if (gs.current.mode === "node" && gs.current.nodeId) {
        const tdx = x - gs.current.startX; const tdy = y - gs.current.startY;
        if (Math.sqrt(tdx*tdx + tdy*tdy) > 8) clearLongPress();
        callbacks.onNodeDragMove?.(gs.current.nodeId, dx, dy, x, y);
      } else if (gs.current.mode === "viewport") {
        callbacks.onViewportPan?.(dx, dy);
      }
      gs.current.lastX = x; gs.current.lastY = y;
    }
  }, [clearLongPress, callbacks]);

  const onTouchEnd = useCallback(() => {
    const elapsed = Date.now() - gs.current.startTime;
    const dx = gs.current.lastX - gs.current.startX;
    const dy = gs.current.lastY - gs.current.startY;
    const vel = Math.sqrt(dx*dx + dy*dy) / Math.max(elapsed, 1);
    if (gs.current.mode === "node" && gs.current.nodeId) {
      if (dx < -SWIPE_THRESHOLD && vel > VELOCITY_THRESHOLD) {
        callbacks.onNodeSwipeDelete?.(gs.current.nodeId);
      } else {
        callbacks.onNodeDragEnd?.(gs.current.nodeId, gs.current.lastX, gs.current.lastY);
      }
    }
    clearLongPress();
    gs.current = { mode: "none", nodeId: null, startX: 0, startY: 0, lastX: 0, lastY: 0, startTime: Date.now(), lastTouchDistance: null };
  }, [clearLongPress, callbacks]);

  return { registerNodeTouch, onTouchStart, onTouchMove, onTouchEnd };
}
