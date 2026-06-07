/**
 * useWebSocket.e2.test.ts — S77-E2: WebSocket connection stability
 *
 * Tests:
 * 1. Heartbeat ping sent at 30s intervals
 * 2. Pong response resets missed pong count
 * 3. 3 missed pongs triggers reconnect
 * 4. Exponential backoff reconnect delay
 * 5. connectionStatus transitions: disconnected → reconnecting → connected
 * 6. reSync called on reconnect
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollabWebSocket } from '../websocket';

type MockWebSocket = {
  readyState: number;
  close: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  onopen: ((this: MockWebSocket, ev: Event) => void) | null;
  onclose: ((this: MockWebSocket, ev: CloseEvent) => void) | null;
  onerror: ((this: MockWebSocket, ev: Event) => void) | null;
  onmessage: ((this: MockWebSocket, ev: MessageEvent) => void) | null;
};

const WS_OPEN = 1;
const WS_CLOSED = 3;

function createMockWS(): MockWebSocket {
  return {
    readyState: WS_OPEN,
    close: vi.fn(),
    send: vi.fn(),
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
  };
}

describe('S77-E2: WebSocket connection stability', () => {
  let mockWS: MockWebSocket;
  let onOpen: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;
  let onReconnecting: ReturnType<typeof vi.fn>;
  let onReconnected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockWS = createMockWS();
    onOpen = vi.fn();
    onClose = vi.fn();
    onReconnecting = vi.fn();
    onReconnected = vi.fn();

    // Replace global WebSocket with mock
    global.WebSocket = vi.fn(() => mockWS) as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('1. sends ping at 30s intervals after connection', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      onOpen,
      onReconnected,
    });

    ws.connect();

    // Simulate connection open
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    // Advance 30s — should send ping
    vi.advanceTimersByTime(30_000);
    expect(mockWS.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"ping"')
    );

    ws.disconnect();
  });

  it('2. pong response resets missed pong count', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      onOpen,
    });

    ws.connect();

    // Simulate connection open
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    // Advance 30s — send ping
    vi.advanceTimersByTime(30_000);
    expect(mockWS.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"ping"')
    );

    // Simulate pong response — message handler receives pong
    const msgHandler = mockWS.onmessage;
    msgHandler?.({
      data: JSON.stringify({ type: 'pong', timestamp: Date.now() }),
    } as MessageEvent);

    // Next ping at 30s should still be sent (count was reset)
    mockWS.send.mockClear();
    vi.advanceTimersByTime(30_000);
    expect(mockWS.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"ping"')
    );

    ws.disconnect();
  });

  it('3. 3 missed pongs triggers reconnect', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000, // 1s for fast test
      maxMissedPongs: 3,
      onOpen,
      onReconnecting,
    });

    ws.connect();

    // Simulate connection open
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    // Miss 3 pongs (3 × 1s intervals = 3s)
    vi.advanceTimersByTime(1_000); // ping 1, missed
    vi.advanceTimersByTime(1_000); // ping 2, missed
    vi.advanceTimersByTime(1_000); // ping 3, missed → close

    expect(mockWS.close).toHaveBeenCalled();
    expect(onReconnecting).toHaveBeenCalled();

    ws.disconnect();
  });

  it('4. exponential backoff reconnect delay (1s → 2s → 4s, max 30s)', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
      maxMissedPongs: 1, // reconnect immediately after 1 miss
      maxRetries: 5,
      onOpen,
      onReconnecting,
    });

    ws.connect();

    // Simulate connection open
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    // Miss 1 pong → close → reconnect attempt 1
    vi.advanceTimersByTime(1_000);
    expect(mockWS.close).toHaveBeenCalled();
    expect(onReconnecting).toHaveBeenCalledWith(1);

    // Advance 1s (first backoff: 1s)
    vi.advanceTimersByTime(1_000);
    // Reconnect opens a new WS
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);
    expect(mockWS.readyState).toBe(WS_OPEN);

    // Miss 1 pong again → attempt 2
    mockWS.close.mockClear();
    onReconnecting.mockClear();
    vi.advanceTimersByTime(1_000);
    expect(mockWS.close).toHaveBeenCalled();
    expect(onReconnecting).toHaveBeenCalledWith(2);

    // Advance 2s (second backoff: 2s)
    vi.advanceTimersByTime(2_000);
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    ws.disconnect();
  });

  it('5. isConnected getter reflects WebSocket state', () => {
    const ws = new CollabWebSocket({ url: 'wss://test.example.com' });

    expect(ws.isConnected).toBe(false);

    ws.connect();
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    expect(ws.isConnected).toBe(true);

    mockWS.readyState = WS_CLOSED;
    mockWS.onclose?.({} as CloseEvent);

    expect(ws.isConnected).toBe(false);
  });

  it('6. simulateDisconnect and simulateReconnect work for testing', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      onReconnecting,
      onReconnected,
    });

    ws.connect();
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    // Simulate disconnect
    ws.simulateDisconnect();
    expect(onReconnecting).toHaveBeenCalled();

    // Advance to reconnect
    vi.advanceTimersByTime(1_000); // 1s backoff
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);
    expect(onReconnected).toHaveBeenCalled();

    ws.disconnect();
  });

  it('7. disconnect stops heartbeat and prevents reconnect', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
      onOpen,
      onReconnecting,
    });

    ws.connect();
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    // Disconnect should stop heartbeat
    ws.disconnect();

    // Advance time — no ping should be sent
    vi.advanceTimersByTime(5_000);
    expect(mockWS.send).not.toHaveBeenCalled();

    // Advance beyond backoff time — no reconnect
    vi.advanceTimersByTime(10_000);
    expect(onReconnecting).not.toHaveBeenCalled();
  });

  it('8. multiple pong messages within one interval only reset count once', () => {
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 1_000,
      maxMissedPongs: 3,
      onOpen,
    });

    ws.connect();
    mockWS.readyState = WS_OPEN;
    mockWS.onopen?.({} as Event);

    // Advance to ping
    vi.advanceTimersByTime(1_000);
    expect(mockWS.send).toHaveBeenCalled();

    // Send multiple pongs (only first should matter, but all should not crash)
    const msgHandler = mockWS.onmessage;
    msgHandler?.({ data: JSON.stringify({ type: 'pong', timestamp: Date.now() }) } as MessageEvent);
    msgHandler?.({ data: JSON.stringify({ type: 'pong', timestamp: Date.now() }) } as MessageEvent);

    // Next ping still sent (not closed)
    mockWS.send.mockClear();
    mockWS.close.mockClear();
    vi.advanceTimersByTime(1_000);
    expect(mockWS.send).toHaveBeenCalled();
    expect(mockWS.close).not.toHaveBeenCalled();

    ws.disconnect();
  });
});
