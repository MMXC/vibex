/**
 * throttleCursorBroadcast — Throttled cursor position broadcast utility
 * Sprint 54 E3: 协作者 Cursor 实时同步
 *
 * Throttles mousemove events to avoid flooding the WebSocket channel.
 * Default interval: 100ms.
 */
'use client';

export interface ThrottleOptions {
  /** Throttle interval in ms (default: 100) */
  intervalMs?: number;
}

/**
 * Creates a throttled cursor broadcast function.
 * Only calls the underlying send function at most once per interval.
 */
export function createThrottledCursorBroadcast(
  send: (x: number, y: number) => void,
  options: ThrottleOptions = {}
): (x: number, y: number) => void {
  const { intervalMs = 100 } = options;
  let lastTime = 0;
  let pending: { x: number; y: number } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (pending !== null) {
      lastTime = Date.now();
      send(pending.x, pending.y);
      pending = null;
    }
    timer = null;
  };

  return (x: number, y: number) => {
    const now = Date.now();
    if (now - lastTime >= intervalMs) {
      lastTime = now;
      send(x, y);
    } else {
      pending = { x, y };
      if (timer === null) {
        timer = setTimeout(flush, intervalMs - (now - lastTime));
      }
    }
  };
}
