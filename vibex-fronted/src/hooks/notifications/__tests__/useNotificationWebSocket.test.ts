/**
 * useNotificationWebSocket — S86-E4 tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationWebSocket } from '../useNotificationWebSocket';
import * as wsNotificationHandler from '@/services/wsNotificationHandler';

// Mock dependencies
vi.mock('@/services/wsNotificationHandler', () => ({
  wsNotificationHandler: {
    activate: vi.fn(),
    deactivate: vi.fn(),
    handleMessage: vi.fn(() => true),
  },
}));

// Full MockWebSocket using addEventListener (matches how the hook wires events)
type WsEventType = 'open' | 'message' | 'close' | 'error';
type WsListener = (event: Event | MessageEvent) => void;

class MockWS {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWS.CONNECTING;
  url: string;
  private _listeners: Map<WsEventType, Set<WsListener>> = new Map();

  // Support both onX properties AND addEventListener
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWS.OPEN;
      this._dispatch('open', new Event('open'));
    }, 0);
  }

  addEventListener(type: WsEventType, listener: WsListener): void {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(type: WsEventType, listener: WsListener): void {
    this._listeners.get(type)?.delete(listener);
  }

  // Dispatch to both addEventListener listeners AND onX properties
  private _dispatch(type: WsEventType, event: Event | MessageEvent): void {
    this._listeners.get(type)?.forEach((fn) => fn(event));
    if (type === 'open') this.onopen?.();
    if (type === 'message') this.onmessage?.(event as MessageEvent);
    if (type === 'close') this.onclose?.();
    if (type === 'error') this.onerror?.();
  }

  close(): void {
    this.readyState = MockWS.CLOSED;
    this._dispatch('close', new CloseEvent('close'));
  }

  send(_data: string): void {
    // noop
  }

  // Helper to simulate incoming message from server
  _simulateMessage(data: string): void {
    this._dispatch('message', new MessageEvent('message', { data }));
  }
}

vi.stubGlobal('WebSocket', MockWS);

let globalWs: MockWS | null = null;
beforeEach(() => {
  globalWs = null;
  vi.clearAllMocks();
  // Capture the WS instance created by the hook
  const origCtor = MockWS;
  // We access via the vi.stubGlobal
  vi.mocked(MockWS).prototype.readyState; // noop
});

afterEach(() => {
  if (globalWs) {
    globalWs.readyState = MockWS.CLOSED;
    globalWs = null;
  }
});

describe('useNotificationWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('connects to WebSocket when userId is provided', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    expect(result.current.isConnected).toBe(false);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.isConnected).toBe(true);
    expect(wsNotificationHandler.wsNotificationHandler.activate).toHaveBeenCalled();
  });

  it('does not connect when userId is null', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: null, enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.isConnected).toBe(false);
    expect(wsNotificationHandler.wsNotificationHandler.activate).not.toHaveBeenCalled();
  });

  it('activates handler when connection opens', async () => {
    renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    // addEventListener fires → activate() called
    expect(
      wsNotificationHandler.wsNotificationHandler.activate
    ).toHaveBeenCalled();
  });

  it('disconnect() closes the WebSocket and deactivates handler', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(wsNotificationHandler.wsNotificationHandler.activate).toHaveBeenCalled();

    await act(async () => {
      result.current.disconnect();
    });

    expect(
      wsNotificationHandler.wsNotificationHandler.deactivate
    ).toHaveBeenCalled();
  });

  it('forwards notification:new messages to handleMessage', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const msg = {
      type: 'notification:new',
      payload: {
        senderId: 'alice',
        senderName: 'Alice',
        message: 'New comment on your canvas',
        targetUserId: 'user-123',
        timestamp: Date.now(),
      },
    };

    await act(async () => {
      (result.current._ws as MockWS)?._simulateMessage(JSON.stringify(msg));
    });

    expect(
      wsNotificationHandler.wsNotificationHandler.handleMessage
    ).toHaveBeenCalledWith(msg);
  });

  it('forwards notification:ack messages to handleMessage', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const msg = { type: 'notification:ack', payload: { ackId: 'ack-001' } };

    await act(async () => {
      (result.current._ws as MockWS)?._simulateMessage(JSON.stringify(msg));
    });

    expect(
      wsNotificationHandler.wsNotificationHandler.handleMessage
    ).toHaveBeenCalledWith(msg);
  });

  it('does not reconnect after manual disconnect when ws closes', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    // The disconnect() call sets reconnectAttempts = MAX_RECONNECT_ATTEMPTS
    // so scheduleReconnect returns early on any subsequent close
    await act(async () => {
      result.current.disconnect();
    });

    // Manually close — should NOT create new WS (reconnect disabled)
    await act(async () => {
      result.current._ws?.close();
      await new Promise((r) => setTimeout(r, 100));
    });

    // No new connection
    expect(result.current._ws).toBeNull();
  });
});
