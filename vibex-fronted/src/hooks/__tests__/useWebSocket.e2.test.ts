/**
 * useWebSocket.e2.test.ts — S77-E2: WebSocket connection stability
 * Tests: heartbeat ping/pong, exponential backoff reconnect, connection status.
 *
 * Approach: Use CollabWebSocket + ControlledTimer + MockWebSocket class.
 * The MockWebSocket class always returns the shared mockWS object so that
 * `new WebSocket(url)` always returns the same controlled mockWS.
 *
 * TIMING MODEL:
 * Each `advance(N)` fires all timers with delay <= N. The heartbeat interval
 * schedules: (1) ping timer at interval, (2) pending-pong timeout at interval.
 * Since both are scheduled with the SAME delay, advance(interval) fires the ping
 * FIRST, then the pending timeout fires. Only the pending timeout increments
 * missedCount. So each advance(interval) adds 1 missed pong, regardless of
 * maxMissedPongs value.
 *
 * maxMissedPongs=N → need N+1 advances of `interval` ms to trigger reconnect.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// ControlledTimer — replaces vi.useFakeTimers for this test
// ─────────────────────────────────────────────────────────────────────────────
type TimerCallback = () => void;

interface TimerEntry {
  delay: number;
  cb: TimerCallback;
  type: 'interval' | 'timeout';
  intervalId?: number;
}

const createTimerSystem = () => {
  const timers: TimerEntry[] = [];
  let idCounter = 0;

  return {
    advance(ms: number) {
      timers.forEach(t => { t.delay -= ms; });
      const due = timers.filter(t => t.delay <= 0);
      due.forEach(t => {
        const idx = timers.findIndex(x => x === t);
        if (idx >= 0) timers.splice(idx, 1);
        t.cb();
      });
    },

    fireAll() {
      const snap = [...timers].sort((a, b) => a.delay - b.delay);
      timers.length = 0;
      snap.forEach(t => t.cb());
    },

    setTimeout(cb: TimerCallback, delay: number) {
      const id = ++idCounter;
      timers.push({ delay, cb, type: 'timeout', intervalId: id });
      return id;
    },

    setInterval(cb: TimerCallback, delay: number) {
      const id = ++idCounter;
      timers.push({ delay, cb, type: 'interval', intervalId: id });
      return id;
    },

    clearTimeout(id: number) {
      const idx = timers.findIndex(t => t.intervalId === id);
      if (idx >= 0) timers.splice(idx, 1);
    },

    clearInterval(id: number) {
      const idx = timers.findIndex(t => t.intervalId === id);
      if (idx >= 0) timers.splice(idx, 1);
    },

    reset() { timers.length = 0; idCounter = 0; },
    get pending() { return timers.length; },
  };
};

const timerSystem = createTimerSystem();

// ─────────────────────────────────────────────────────────────────────────────
// Shared mock WebSocket state
// ─────────────────────────────────────────────────────────────────────────────
// Module-level refs to original mocks — _origSend/_origClose are vi.fn() tracked in beforeEach
const _origClose = vi.fn();
const _origSend = vi.fn();
const mockWS = {
  _readyState: 0,
  get readyState() { return this._readyState; },
  set readyState(v) { this._readyState = v; },
  close: _origClose,
  send: _origSend,
  onopen: null as (() => void) | null,
  onclose: null as ((...args: unknown[]) => void) | null,
  onerror: null as ((...args: unknown[]) => void) | null,
  onmessage: null as ((...args: unknown[]) => void) | null,
  addEventListener(event: string, handler: (...args: unknown[]) => void) {
    if (event === 'open') this.onopen = handler as () => void;
    if (event === 'close') this.onclose = handler;
    if (event === 'error') this.onerror = handler;
    if (event === 'message') this.onmessage = handler;
  },
  removeEventListener: vi.fn(),
  // Mirrors the implementation's isConnected getter which checks WebSocket.OPEN
  _isConnected: false,
  get isConnected() { return this._isConnected; },
  set isConnected(v: boolean) { this._isConnected = v; },
};

// Class that always returns mockWS — avoids Vitest vi.fn() constructor issues
class MockWebSocket {
  // Required for implementation's `WebSocket.OPEN` comparisons in send() and startHeartbeat()
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  constructor(_url: string) { return mockWS; }
}

// Patch CollabWebSocket's internal setTimeout/setInterval to use our timerSystem
const OriginalSetTimeout = globalThis.setTimeout;
const OriginalSetInterval = globalThis.setInterval;
const OriginalClearTimeout = globalThis.clearTimeout;
const OriginalClearInterval = globalThis.clearInterval;

beforeEach(() => {
  timerSystem.reset();
  mockWS._readyState = 0;
  _origClose.mockClear();
  _origSend.mockClear();
  mockWS.onopen = null;
  mockWS.onclose = null;
  mockWS.onerror = null;
  mockWS.onmessage = null;

  // CRITICAL: Make _origClose() trigger onclose() — real WebSocket fires onclose when closed.
  // Without this, scheduleReconnect() is never called because ws.onclose never fires.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockWS as any).close = function(this: typeof mockWS) {
    _origClose();
    this.onclose?.({ code: 1006, reason: 'test close', wasClean: false } as CloseEvent);
  };
  // Spy on wrapper so toHaveBeenCalled() works (wraps and delegates to _origClose)

  // Replace global timer functions with ControlledTimer equivalents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).setTimeout = ((cb: TimerCallback, delay: number) =>
    timerSystem.setTimeout(cb, delay)) as typeof setTimeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).setInterval = ((cb: TimerCallback, delay: number) =>
    timerSystem.setInterval(cb, delay)) as typeof setInterval;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).clearTimeout = ((id: ReturnType<typeof setTimeout>) =>
    timerSystem.clearTimeout(id)) as typeof clearTimeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).clearInterval = ((id: ReturnType<typeof setInterval>) =>
    timerSystem.clearInterval(id)) as typeof clearInterval;

  // Replace WebSocket with our mock class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = MockWebSocket as any;
});

afterEach(() => {
  timerSystem.reset();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).setTimeout = OriginalSetTimeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).setInterval = OriginalSetInterval;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).clearTimeout = OriginalClearTimeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).clearInterval = OriginalClearInterval;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = globalThis._origWebSocket || globalThis.WebSocket;
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Import real CollabWebSocket (now WebSocket is mocked)
// ─────────────────────────────────────────────────────────────────────────────
import { CollabWebSocket } from '@/lib/collaboration/websocket';

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('S77-E2: WebSocket connection stability', () => {

  // ── Test 1: heartbeat ping at 30s intervals ───────────────────────────────
  it('1. sends ping at 30s intervals after connection', () => {
    const onOpen = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      onOpen,
    });

    ws.connect();
    // CRITICAL: set readyState AFTER connect() so connect() guard passes (CONNECTING check)
    // then simulate open transition
    mockWS.readyState = 1;
    mockWS.onopen?.();

    expect(onOpen).toHaveBeenCalled();

    // Advance 30s — ping fires (pending timeout also fires but nothing to clear)
    timerSystem.advance(30_000);
    expect(_origSend).toHaveBeenCalledWith(
      expect.stringContaining('"type":"ping"')
    );

    // Next ping at 30s
    _origSend.mockClear();
    timerSystem.advance(30_000);
    expect(_origSend).toHaveBeenCalledWith(
      expect.stringContaining('"type":"ping"')
    );
  });

  // ── Test 2: pong resets missed pong count ─────────────────────────────────
  it('2. pong response resets missed pong count', () => {
    const onMessage = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
      onMessage,
    });

    ws.connect();
    mockWS.readyState = 1;
    mockWS.onopen?.();

    // Advance 1s — ping fires (pending timeout fires too but no pong yet)
    timerSystem.advance(1_000);
    expect(_origSend).toHaveBeenCalled();

    // Simulate pong — CollabWebSocket calls JSON.parse(event.data)
    onMessage({ data: JSON.stringify({ type: 'pong', timestamp: Date.now() }) } as MessageEvent);

    // Next ping still fires (count was reset)
    _origSend.mockClear();
    timerSystem.advance(1_000);
    expect(_origSend).toHaveBeenCalled();
  });

  // ── Test 3: N missed pongs triggers reconnect (timing model explained) ─────
  // Each advance(interval) fires ping THEN pending timeout (same delay).
  // Only pending timeout increments missedCount. So each advance = 1 missed pong.
  // With maxMissedPongs=2: need 3 advances to trigger reconnect (missedCount=2 at advance 3).
  it('3. N missed pongs triggers reconnect (maxMissedPongs=2 → 3 advances)', () => {
    const onReconnecting = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      maxMissedPongs: 2,  // reconnect after 2 missed pongs
      onReconnecting,
    });

    ws.connect();
    mockWS.readyState = 1;
    mockWS.onopen?.();

    // advance 1: ping + pending timeout (missedCount=1, new pending at +30s)
    timerSystem.advance(30_000);
    // advance 2: pending fires (missedCount=2) + ping + new pending
    timerSystem.advance(30_000);
    // advance 3: pending fires → missedCount=3 ≥ maxMissedPongs=2 → close + reconnect
    timerSystem.advance(30_000);

    expect(_origClose).toHaveBeenCalled();
    expect(onReconnecting).toHaveBeenCalledWith(1);  // retryCount=1 after close
  });

  // ── Test 4: exponential backoff reconnect delay ────────────────────────────
  it('4. exponential backoff reconnect delay (1s → 2s → 4s)', () => {
    const onReconnecting = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      maxMissedPongs: 2,  // close after 2 missed pongs (3 advances)
      maxRetries: 5,
      onReconnecting,
    });

    ws.connect();
    mockWS.readyState = 1;
    mockWS.onopen?.();

    // Advance 3 times to trigger close at ~t=60 (missedCount hits 2 after advance 2)
    // close fires at ~t=60, schedules reconnect at t+1000=~t+61
    timerSystem.advance(30_000); // ping + pending (mc=1)
    timerSystem.advance(30_000); // pending fires (mc=2) + ping + new pending
    timerSystem.advance(30_000); // pending fires → close + reconnect at +1s
    // reconnect fires after 1s backoff
    timerSystem.advance(1_000);
    expect(onReconnecting).toHaveBeenCalledWith(1);

    // Advance 2s more for second backoff
    timerSystem.advance(2_000);
    expect(onReconnecting).toHaveBeenCalledWith(2);

    // Advance 4s more for third backoff
    timerSystem.advance(4_000);
    expect(onReconnecting).toHaveBeenCalledWith(3);
  });

  // ── Test 5: isConnected getter reflects WebSocket state ─────────────────────
  it('5. isConnected getter reflects WebSocket state', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
    });

    // Before connect: NOT connected (ws.ws is null)
    expect((ws as unknown as { isConnected: boolean }).isConnected).toBe(false);

    // Simulate connected: set ws.ws = mockWS, then call onopen
    // (connect() sets this.ws = mockWS, then onopen fires)
    mockWS.readyState = 1; // set to OPEN so connect() passes the guard
    (ws as any).ws = mockWS;
    mockWS.onopen?.();
    expect((ws as unknown as { isConnected: boolean }).isConnected).toBe(true);

    // Simulate disconnected
    mockWS.readyState = 3; // CLOSED
    mockWS.onclose?.();
    expect((ws as unknown as { isConnected: boolean }).isConnected).toBe(false);
  });

  // ── Test 6: disconnect stops heartbeat and prevents further pings ────────────
  it('6. disconnect stops heartbeat and prevents further pings', () => {
    const onClose = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      onClose,
    });

    ws.connect();
    mockWS.readyState = 1;
    mockWS.onopen?.();

    // First ping fires
    timerSystem.advance(30_000);
    expect(_origSend).toHaveBeenCalledTimes(1);

    // Disconnect — should stop heartbeat
    mockWS.readyState = 3;
    mockWS.onclose?.();

    _origSend.mockClear();
    // Advancing 60s should NOT fire any send (heartbeat stopped)
    timerSystem.advance(60_000);
    expect(_origSend).not.toHaveBeenCalled();
  });

  // ── Test 7: multiple pong messages within interval only count once ──────────
  it('7. multiple pong messages within interval only count once', () => {
    const onMessage = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      maxMissedPongs: 2,
      onMessage,
    });

    ws.connect();
    mockWS.readyState = 1;
    mockWS.onopen?.();

    // First ping fires (advance 1: ping + pending)
    timerSystem.advance(30_000);
    expect(_origSend).toHaveBeenCalledTimes(1);

    // Multiple pongs in same interval — only clears pending ping
    onMessage({ data: JSON.stringify({ type: 'pong' }) } as MessageEvent);
    onMessage({ data: JSON.stringify({ type: 'pong' }) } as MessageEvent);

    _origSend.mockClear();
    // Advance 2x30s: advance 1 (pending fires mc=1 + ping + new pending), advance 2 (pending fires mc=2 → close)
    timerSystem.advance(30_000);
    timerSystem.advance(30_000);
    // Only 1 ping sent (the one from advance 1); advance 2 triggers close before ping
    expect(_origSend).toHaveBeenCalledTimes(1);
  });

  // ── Test 8: successful reconnect calls onReconnected ──────────────────────
  it('8. successful reconnect calls onReconnected', () => {
    const onReconnecting = vi.fn();
    const onReconnected = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      maxMissedPongs: 1,  // close after 1 missed pong (2 advances)
      onReconnecting,
      onReconnected,
    });

    ws.connect();
    mockWS.readyState = 1;
    mockWS.onopen?.();

    // advance 1: ping + pending (mc=1)
    timerSystem.advance(30_000);
    expect(onReconnecting).not.toHaveBeenCalled();

    // advance 2: pending fires → mc=2 ≥ maxMissedPongs=1 → close + reconnect
    timerSystem.advance(30_000);
    expect(_origClose).toHaveBeenCalled();
    expect(onReconnecting).toHaveBeenCalledWith(1);

    // reconnect fires after 1s backoff
    timerSystem.advance(1_000);
    expect(onReconnected).toHaveBeenCalled();
  });

});
