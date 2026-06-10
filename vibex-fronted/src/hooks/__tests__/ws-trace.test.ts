
import { describe, it, expect, vi, beforeEach } from 'vitest';

// First, let me verify vi.mock's importOriginal actually resolves
// by checking if the mocked CollabWebSocket has connect() method
import { describe, it, expect, vi } from 'vitest';

const mockWS = {
  _readyState: 0,
  get readyState() { return this._readyState; },
  set readyState(v) { this._readyState = v; },
  send: vi.fn(),
  close: vi.fn(),
  onopen: null as (() => void) | null,
};

class MockWebSocket {
  static OPEN = 1;
  constructor(_url: string) { return mockWS; }
}

vi.mock('@/lib/collaboration/websocket', async (importOriginal) => {
  const actual = await importOriginal();
  console.log('[MOCK] actual keys:', Object.keys(actual));
  console.log('[MOCK] actual.CollabWebSocket:', typeof actual.CollabWebSocket);
  return {
    ...actual,
    CollabWebSocket: class extends actual.CollabWebSocket {
      connect() {
        console.log('[MOCK] Overridden connect() called');
        const OrigWS = globalThis.WebSocket;
        (globalThis as any).WebSocket = MockWebSocket as any;
        try {
          console.log('[MOCK] globalThis.WebSocket before super.connect():', 
            globalThis.WebSocket === MockWebSocket ? 'MockWebSocket' : 'other');
          super.connect();
          console.log('[MOCK] this.ws after super.connect():', (this as any).ws);
          console.log('[MOCK] this.ws.send:', (this as any).ws?.send);
        } finally {
          (globalThis as any).WebSocket = OrigWS;
        }
      }
    },
  };
});

import { CollabWebSocket } from '@/lib/collaboration/websocket';

describe('debug vi.mock', () => {
  it('trace connect flow', () => {
    const onOpen = vi.fn();
    const ws = new CollabWebSocket({
      url: 'wss://test.example.com',
      heartbeatIntervalMs: 30_000,
      onOpen,
    });
    console.log('[TEST] ws created');
    ws.connect();
    console.log('[TEST] connect() returned');
    mockWS.readyState = 1;
    console.log('[TEST] readyState = 1, calling onopen');
    mockWS.onopen?.();
    console.log('[TEST] onopen called, onOpen calls =', onOpen.mock.calls.length);
    expect(onOpen.mock.calls.length).toBe(1);
  });
});
