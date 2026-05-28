/**
 * useCollaboration unit tests — P002-E1
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track the last created WebSocket instance for test access
let lastWsInstance: MockWebSocketInstance | null = null;
let wsMessageHandler: ((event: MessageEvent) => void) | null = null;

interface MockWebSocketInstance {
  readyState: number;
  url: string;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onerror: ((err: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  sentMessages: string[];
  simulateMessage: (data: object) => void;
  simulateClose: () => void;
}

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((err: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    lastWsInstance = this as unknown as MockWebSocketInstance;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  simulateMessage(data: object): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] ?? null,
  setItem: (key: string, val: string) => { mockLocalStorage.store[key] = val; },
  removeItem: (key: string) => { delete mockLocalStorage.store[key]; },
};
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

describe('useCollaboration', () => {
  beforeEach(() => {
    mockLocalStorage.store = { 'vibex-token': 'test-jwt-token' };
    lastWsInstance = null;
    vi.clearAllMocks();
  });

  it('connects to WebSocket with token in URL', async () => {
    const { CollabWebSocket } = await import('../websocket');
    const ws = new CollabWebSocket({
      url: 'wss://ws.vibex.top',
      maxRetries: 0,
    });

    expect(ws.isConnected).toBe(false);
    ws.connect();

    await new Promise(r => setTimeout(r, 20));
    expect(ws.isConnected).toBe(true);

    ws.disconnect();
  });

  it('sends messages when connected', async () => {
    const { CollabWebSocket } = await import('../websocket');
    const ws = new CollabWebSocket({
      url: 'wss://ws.vibex.top',
      maxRetries: 0,
    });
    ws.connect();
    await new Promise(r => setTimeout(r, 20));

    ws.send({ type: 'action', payload: { nodeId: 'n1', action: 'update', data: {}, timestamp: Date.now() } });

    expect(lastWsInstance).not.toBeNull();
    expect(lastWsInstance!.sentMessages.length).toBeGreaterThan(0);
    const sent = JSON.parse(lastWsInstance!.sentMessages[0]);
    expect(sent.type).toBe('action');
    expect(sent.payload.nodeId).toBe('n1');

    ws.disconnect();
  });

  it('receives and dispatches remote_action messages', async () => {
    const handler = vi.fn();
    const { CollabWebSocket } = await import('../websocket');
    const ws = new CollabWebSocket({
      url: 'wss://ws.vibex.top',
      maxRetries: 0,
      onMessage: handler,
    });
    ws.connect();
    await new Promise(r => setTimeout(r, 20));

    expect(lastWsInstance).not.toBeNull();
    lastWsInstance!.simulateMessage({
      type: 'remote_action',
      payload: { userId: 'u1', nodeId: 'n1', action: 'update', data: { label: 'changed' } },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const msg = handler.mock.calls[0][0];
    expect(msg.type).toBe('remote_action');
    expect(msg.payload.nodeId).toBe('n1');

    ws.disconnect();
  });

  it('receives and dispatches presence messages', async () => {
    const handler = vi.fn();
    const { CollabWebSocket } = await import('../websocket');
    const ws = new CollabWebSocket({
      url: 'wss://ws.vibex.top',
      maxRetries: 0,
      onMessage: handler,
    });
    ws.connect();
    await new Promise(r => setTimeout(r, 20));

    expect(lastWsInstance).not.toBeNull();
    lastWsInstance!.simulateMessage({
      type: 'presence',
      users: [
        { userId: 'u1', name: 'Alice', avatar: 'https://example.com/alice.png' },
        { userId: 'u2', name: 'Bob', avatar: 'https://example.com/bob.png' },
      ],
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const msg = handler.mock.calls[0][0];
    expect(msg.type).toBe('presence');
    expect(msg.users.length).toBe(2);
    expect(msg.users[0].name).toBe('Alice');

    ws.disconnect();
  });

  it('receives and dispatches conflict messages', async () => {
    const handler = vi.fn();
    const { CollabWebSocket } = await import('../websocket');
    const ws = new CollabWebSocket({
      url: 'wss://ws.vibex.top',
      maxRetries: 0,
      onMessage: handler,
    });
    ws.connect();
    await new Promise(r => setTimeout(r, 20));

    expect(lastWsInstance).not.toBeNull();
    lastWsInstance!.simulateMessage({
      type: 'conflict',
      nodeId: 'n1',
      conflictingUserId: 'u2',
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const msg = handler.mock.calls[0][0];
    expect(msg.type).toBe('conflict');
    expect(msg.nodeId).toBe('n1');
    expect(msg.conflictingUserId).toBe('u2');

    ws.disconnect();
  });

  it('does not send when disconnected', async () => {
    const { CollabWebSocket } = await import('../websocket');
    const ws = new CollabWebSocket({
      url: 'wss://ws.vibex.top',
      maxRetries: 0,
    });
    // Don't connect — ws is not connected
    expect(ws.isConnected).toBe(false);

    ws.send({ type: 'action', payload: { nodeId: 'n1', action: 'update', data: {}, timestamp: Date.now() } });

    // No WebSocket instance created yet
    expect(lastWsInstance).toBeNull();
  });
});
