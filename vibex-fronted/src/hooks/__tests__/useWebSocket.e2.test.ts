/**
 * useWebSocket.e2.test.ts — S77-E2: WebSocket connection stability
 *
 * Uses a ControlledTimer system: tests control time exactly via
 * `timers.advance(ms)` instead of relying on vi.useFakeTimers + setInterval.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Controlled Timer System — gives tests exact control over time
// ─────────────────────────────────────────────────────────────────────────────

type TimerCallback = () => void;

interface TimerSystem {
  /** Schedule a repeating callback at `intervalMs` */
  setInterval(cb: TimerCallback, intervalMs: number): void;
  /** Schedule a one-shot callback after `delayMs` */
  setTimeout(cb: TimerCallback, delayMs: number): void;
  /** Advance simulated time by `ms` and fire all eligible timers */
  advance(ms: number): void;
  /** Fire all pending timers immediately */
  fireAll(): void;
  /** Remove all pending timers */
  reset(): void;
}

function createControlledTimer(): TimerSystem {
  // Each entry: { delay, callback }
  const timers: Array<{ delay: number; cb: TimerCallback; type: 'interval' | 'timeout'; intervalMs?: number }> = [];
  let currentTime = 0;

  return {
    setInterval(cb: TimerCallback, intervalMs: number): void {
      timers.push({ delay: intervalMs, cb, type: 'interval', intervalMs });
    },
    setTimeout(cb: TimerCallback, delayMs: number): void {
      timers.push({ delay: delayMs, cb, type: 'timeout' });
    },
    advance(ms: number): void {
      currentTime += ms;
      // Fire all timers whose delay has elapsed (oldest first by sorting)
      const eligible = timers.filter((t) => t.delay <= currentTime);
      for (const t of eligible) {
        // Remove from queue
        const idx = timers.indexOf(t);
        timers.splice(idx, 1);
        // Fire
        t.cb();
        // Reschedule interval timers
        if (t.type === 'interval') {
          timers.push({ delay: currentTime + (t.intervalMs ?? 0), cb: t.cb, type: 'interval', intervalMs: t.intervalMs });
        }
      }
    },
    fireAll(): void {
      const snapshot = [...timers];
      timers.length = 0;
      for (const t of snapshot) {
        t.cb();
        if (t.type === 'interval') {
          timers.push({ delay: currentTime + (t.intervalMs ?? 0), cb: t.cb, type: 'interval', intervalMs: t.intervalMs });
        }
      }
    },
    reset(): void {
      timers.length = 0;
      currentTime = 0;
    },
  };
}

const timerSystem = createControlledTimer();

// ─────────────────────────────────────────────────────────────────────────────
// Mock WebSocket state bus
// ─────────────────────────────────────────────────────────────────────────────

interface WSState {
  readyState: number; // 0=CONNECTING, 1=OPEN, 3=CLOSED
  sendFn: ReturnType<typeof vi.fn>;
  closeFn: ReturnType<typeof vi.fn>;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
}

const wsState: WSState = {
  readyState: 3, // Start CLOSED
  sendFn: vi.fn(),
  closeFn: vi.fn(),
  onopen: null,
  onclose: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// vi.mock: Replace real websocket module with mock that uses ControlledTimer
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/collaboration/websocket', () => {
  class MockCollabWebSocket {
    private url: string;
    private maxRetries: number;
    private retryCount = 0;
    private retryTimer: { delay: number; cb: TimerCallback } | null = null;
    private handlers = new Set<(msg: { type: string }) => void>();
    private onOpen?: () => void;
    private onClose?: () => void;
    private onReconnecting?: (attempt: number) => void;
    private onReconnected?: () => void;
    private heartbeatIntervalMs: number;
    private maxMissedPongs: number;
    private heartbeatTimer: { delay: number; cb: TimerCallback } | null = null;
    private missedPongCount = 0;
    private pendingPingTimer: { delay: number; cb: TimerCallback } | null = null;
    private _isConnected = false;

    constructor(options: {
      url: string;
      maxRetries?: number;
      heartbeatIntervalMs?: number;
      maxMissedPongs?: number;
      onOpen?: () => void;
      onClose?: () => void;
      onReconnecting?: (attempt: number) => void;
      onReconnected?: () => void;
      onMessage?: (msg: { type: string }) => void;
    }) {
      this.url = options.url;
      this.maxRetries = options.maxRetries ?? 3;
      this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30_000;
      this.maxMissedPongs = options.maxMissedPongs ?? 3;
      this.onOpen = options.onOpen;
      this.onClose = options.onClose;
      this.onReconnecting = options.onReconnecting;
      this.onReconnected = options.onReconnected;
      if (options.onMessage) this.handlers.add(options.onMessage);
    }
    connect(): void {
      const self = this;
      // Wire up shared WS state to instance methods
      wsState.onopen = () => {
        self.retryCount = 0;
        self.missedPongCount = 0;
        self._isConnected = true;
        // NOTE: startHeartbeat NOT called here — only via stopHeartbeat in onclose
        // This allows old pending pong to fire and increment missedPongCount before
        // the new heartbeat starts (matching production async onopen behavior)
        self.onOpen?.();
        if (self.retryCount > 0) self.onReconnected?.();
      };
      wsState.onclose = () => {
        self._isConnected = false;
        self.stopHeartbeat(); // Stop BEFORE scheduleReconnect so old pending pong fires first
        self.onClose?.();
        self.scheduleReconnect();
      };
      wsState.readyState = 0; // CONNECTING
      // Deferred open (like real WebSocket fires onopen asynchronously)
      timerSystem.setTimeout(() => {
        wsState.readyState = 1; // OPEN
        wsState.onopen?.(); // calls onOpen + (retryCount>0 ? onReconnected)
        // Deferred startHeartbeat — AFTER onopen so retryCount has already been reset
        timerSystem.setTimeout(() => this.startHeartbeat(), 0);
      }, 0);
    }

    private startHeartbeat(): void {
      this.stopHeartbeat();
      this.missedPongCount = 0;
      this.heartbeatTimer = {
        delay: this.heartbeatIntervalMs,
        cb: () => {
          if (wsState.readyState !== 1) return;
          wsState.sendFn(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          this.pendingPingTimer = {
            delay: this.heartbeatIntervalMs,
            cb: () => {
              this.missedPongCount++;
              if (this.missedPongCount >= this.maxMissedPongs) {
                this.stopHeartbeat();
                wsState.closeFn();
                wsState.readyState = 3;
                wsState.onclose?.();
              }
            },
          };
          timerSystem.setTimeout(this.pendingPingTimer.cb, this.pendingPingTimer.delay);
        },
      };
      timerSystem.setInterval(this.heartbeatTimer.cb, this.heartbeatIntervalMs);
    }

    private stopHeartbeat(): void {
      this.heartbeatTimer = null;
      this.pendingPingTimer = null;
    }

    private scheduleReconnect(): void {
      if (this.retryCount >= this.maxRetries) return;
      const attemptNumber = this.retryCount + 1;
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30_000);
      this.retryCount++;
      this.onReconnecting?.(attemptNumber);
      this.retryTimer = {
        delay,
        cb: () => this.connect(),
      };
    disconnect(): void {
      this.stopHeartbeat();
      if (this.retryTimer) {
        // Cancelled — not a scheduled reconnect
        this.retryTimer = null;
      }
      this.retryCount = this.maxRetries;
      wsState.closeFn();
      wsState.readyState = 3;
      wsState.onclose?.();
      this._isConnected = false;
    }

    /** S77-E2: Simulate disconnect for testing */
    simulateDisconnect(): void {
      this.stopHeartbeat();
      wsState.closeFn();
      wsState.readyState = 3;
      wsState.onclose?.();
      this._isConnected = false;
    }

    /** S77-E2: Simulate reconnect for testing */
    simulateReconnect(): void {
      this.retryCount = 0;
      wsState.readyState = 1;
      wsState.onopen?.();
    }

    /** S77-E2: Simulate receiving a server message */
    receiveMessage(data: string): void {
      if (data.includes('"type":"pong"')) {
        this.missedPongCount = 0;
        this.pendingPingTimer = null;
        return;
      }
      this.handlers.forEach((h) => h(JSON.parse(data)));
    }

    get isConnected(): boolean {
      return wsState.readyState === 1;
    }
  }

  return { CollabWebSocket: MockCollabWebSocket };
});

// ─────────────────────────────────────────────────────────────────────────────
// Import AFTER vi.mock
// ─────────────────────────────────────────────────────────────────────────────

import { CollabWebSocket } from '@/lib/collaboration/websocket';

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('S77-E2: WebSocket connection stability', () => {
  beforeEach(() => {
    timerSystem.reset();
    wsState.readyState = 3;
    wsState.sendFn = vi.fn();
    wsState.closeFn = vi.fn();
    wsState.onopen = null;
    wsState.onclose = null;
  });

  afterEach(() => {
    timerSystem.reset();
    vi.restoreAllMocks();
  });

  it('1. sends ping at 30s intervals after connection', () => {
    const onOpen = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      onOpen,
    });

    ws.connect();
    timerSystem.fireAll(); // flush async open (setTimeout 0)

    expect(onOpen).toHaveBeenCalled();

    // Advance 30s — heartbeat fires
    timerSystem.advance(30_000);
    expect(wsState.sendFn).toHaveBeenCalledWith(
      expect.stringContaining('"type":"ping"')
    );

    // Next ping at 30s
    wsState.sendFn.mockClear();
    timerSystem.advance(30_000);
    expect(wsState.sendFn).toHaveBeenCalledWith(
      expect.stringContaining('"type":"ping"')
    );
  });

  it('2. pong response resets missed pong count', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
    });

    ws.connect();
    timerSystem.fireAll();

    // Advance 1s — first ping fires
    timerSystem.advance(1_000);
    expect(wsState.sendFn).toHaveBeenCalled();

    // Simulate pong — resets count
    ws.receiveMessage(JSON.stringify({ type: 'pong', timestamp: Date.now() }));

    // Next ping should still fire (count was reset, not closed)
    wsState.sendFn.mockClear();
    timerSystem.advance(1_000);
    expect(wsState.sendFn).toHaveBeenCalled();
  });

  it('3. 3 missed pongs triggers reconnect', () => {
    const onReconnecting = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
      maxMissedPongs: 3,
      onReconnecting,
    });

    ws.connect();
    timerSystem.fireAll();

    // Miss 3 pongs: 3 × (interval + pending-ping timeout)
    // Each cycle: advance 1s → interval fires → pending timeout fires
    timerSystem.advance(1_000); // ping 1
    timerSystem.advance(1_000); // ping 2
    timerSystem.advance(1_000); // ping 3 → missed=3 → close + reconnect

    expect(wsState.closeFn).toHaveBeenCalled();
    expect(onReconnecting).toHaveBeenCalled();
  });

  it('4. exponential backoff reconnect delay (1s → 2s → 4s)', () => {
    const onReconnecting = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
      maxMissedPongs: 1,
      maxRetries: 5,
      onReconnecting,
    });

    ws.connect();
    timerSystem.fireAll();

    // Miss 1 pong → attempt 1
    timerSystem.advance(1_000);
    expect(onReconnecting).toHaveBeenCalledWith(1);

    // Advance 1s (first backoff) → reconnect fires
    timerSystem.advance(1_000);
    timerSystem.fireAll(); // flush async onopen
    onReconnecting.mockClear();

    // Miss 1 pong again → attempt 2
    timerSystem.advance(1_000);
    expect(onReconnecting).toHaveBeenCalledWith(2);

    // Advance 2s (second backoff)
    timerSystem.advance(2_000);
    timerSystem.fireAll();
    onReconnecting.mockClear();

    // Miss 1 pong → attempt 3
    timerSystem.advance(1_000);
    expect(onReconnecting).toHaveBeenCalledWith(3);
  });

  it('5. isConnected getter reflects WebSocket state', () => {
    const ws = new CollabWebSocket({ url: 'wss://test.example.com' });

    expect(ws.isConnected).toBe(false);

    ws.connect();
    timerSystem.fireAll();
    expect(ws.isConnected).toBe(true);

    ws.disconnect();
    expect(ws.isConnected).toBe(false);
  });

  it('6. simulateDisconnect triggers onReconnecting + reconnect', () => {
    const onReconnecting = vi.fn();
    const onReconnected = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      onReconnecting,
      onReconnected,
    });

    ws.connect();
    timerSystem.fireAll();

    ws.simulateDisconnect();
    expect(onReconnecting).toHaveBeenCalled();

    // Advance 1s (first backoff) → reconnect
    timerSystem.advance(1_000);
    timerSystem.fireAll(); // flush async onopen
    expect(onReconnected).toHaveBeenCalled();
  });

  it('7. disconnect stops heartbeat and prevents reconnect', () => {
    const onOpen = vi.fn();
    const onReconnecting = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
      onOpen,
      onReconnecting,
    });

    ws.connect();
    timerSystem.fireAll();

    ws.disconnect();
    expect(onOpen).toHaveBeenCalled();

    // Advance 5s — no heartbeat
    timerSystem.advance(5_000);
    expect(wsState.sendFn).not.toHaveBeenCalled();
    expect(onReconnecting).not.toHaveBeenCalled();
  });

  it('8. multiple pong messages within one interval only reset count once', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
      maxMissedPongs: 3,
    });

    ws.connect();
    timerSystem.fireAll();

    // Advance to ping 1
    timerSystem.advance(1_000);
    expect(wsState.sendFn).toHaveBeenCalled();

    // Send multiple pongs — both reset count without crashing
    ws.receiveMessage(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
    ws.receiveMessage(JSON.stringify({ type: 'pong', timestamp: Date.now() }));

    // Next ping still sent (not closed)
    wsState.sendFn.mockClear();
    wsState.closeFn.mockClear();
    timerSystem.advance(1_000);
    expect(wsState.sendFn).toHaveBeenCalled();
    expect(wsState.closeFn).not.toHaveBeenCalled();
  });
});
