/**
 * Debug test for send not being called
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── ControlledTimer (same as test file) ────────────────────────────────────
type TimerCallback = () => void;
interface TimerEntry { delay: number; cb: TimerCallback; type: 'interval' | 'timeout'; intervalId?: number; }

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
    setTimeout(cb: TimerCallback, delay: number) { const id = ++idCounter; timers.push({ delay, cb, type: 'timeout', intervalId: id }); return id; },
    clearTimeout(id: number) { const idx = timers.findIndex(t => t.intervalId === id); if (idx >= 0) timers.splice(idx, 1); },
    get pending() { return timers.length; },
  };
};

// ── Mock CollabWebSocket (minimal) ─────────────────────────────────────────
const _origSend = vi.fn();

const mockWS = {
  readyState: 0, // CONNECTING
  send: _origSend,
  close: vi.fn(),
  onopen: null as ((e: Event) => void) | null,
  onclose: null as ((e: CloseEvent) => void) | null,
  onmessage: null as ((e: MessageEvent) => void) | null,
};

class CollabWebSocket {
  private ws: typeof mockWS | null = null;
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPingTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatIntervalMs: number;

  constructor(opts: { url: string; heartbeatIntervalMs: number; onOpen?: () => void; onMessage?: () => void; onReconnecting?: () => void; }) {
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs;
    this.ws = mockWS;
    if (opts.onOpen) opts.onOpen();
  }

  connect() { /* no-op for this test */ }

  private scheduleNextPing(): void {
    if (this.pingTimer) { clearTimeout(this.pingTimer); this.pingTimer = null; }
    if (this.pendingPingTimer) { clearTimeout(this.pendingPingTimer); this.pendingPingTimer = null; }

    this.pingTimer = setTimeout(() => {
      console.log('[DEBUG] ping timer fired, ws:', this.ws, 'readyState:', this.ws?.readyState);
      if (!this.ws || this.ws.readyState !== 1 /* OPEN */) return;
      const timestamp = Date.now();
      this.ws.send(`ping:${timestamp}`);
    }, this.heartbeatIntervalMs);
  }

  private handleOpen(): void {
    this.scheduleNextPing();
  }
}

describe('Debug send', () => {
  let timerSystem: ReturnType<typeof createTimerSystem>;

  beforeEach(() => {
    timerSystem = createTimerSystem();
    (globalThis as any).setTimeout = (cb: TimerCallback, delay: number) => timerSystem.setTimeout(cb, delay);
    (globalThis as any).clearTimeout = (id: number) => timerSystem.clearTimeout(id);
    _origSend.mockClear();
    mockWS.readyState = 0;
  });

  it('should call send after advance', () => {
    const ws = new CollabWebSocket({ url: 'wss://test', heartbeatIntervalMs: 30_000 });
    ws.connect();
    mockWS.readyState = 1; // OPEN
    // Manually call scheduleNextPing (equivalent to handleOpen)
    (ws as any).scheduleNextPing();

    console.log('Before advance, pending timers:', timerSystem.pending);
    timerSystem.advance(30_000);
    console.log('After advance, pending timers:', timerSystem.pending);
    console.log('send calls:', _origSend.mock.calls);
    expect(_origSend).toHaveBeenCalled();
  });
});
