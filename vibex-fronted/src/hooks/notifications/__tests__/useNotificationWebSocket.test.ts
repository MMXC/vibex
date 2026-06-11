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

// Mock WebSocket globally
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    MockWebSocket.instances.push(this);
    // Simulate connection after microtask
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  send(_data: string) {
    // noop
  }
}

const originalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = MockWebSocket;
  vi.clearAllMocks();
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = originalWebSocket;
});

describe('useNotificationWebSocket', () => {
  it('connects to WebSocket when userId is provided', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    expect(result.current.isConnected).toBe(false);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.isConnected).toBe(true);
    expect(wsNotificationHandler.wsNotificationHandler.activate).toHaveBeenCalled();
  });

  it('disconnects WebSocket on last hook unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.isConnected).toBe(true);

    unmount();

    expect(wsNotificationHandler.wsNotificationHandler.deactivate).toHaveBeenCalled();
    expect(MockWebSocket.instances[0]?.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('handles notification:new message via wsNotificationHandler', async () => {
    renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
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
      MockWebSocket.instances[0]?.onmessage?.({ data: JSON.stringify(msg) });
    });

    expect(wsNotificationHandler.wsNotificationHandler.handleMessage).toHaveBeenCalledWith(msg);
  });

  it('does not connect when enabled is false', async () => {
    renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: false })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(MockWebSocket.instances.length).toBe(0);
    expect(wsNotificationHandler.wsNotificationHandler.activate).not.toHaveBeenCalled();
  });

  it('does not connect when userId is null', async () => {
    renderHook(() =>
      useNotificationWebSocket({ userId: null, enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(MockWebSocket.instances.length).toBe(0);
  });

  it('schedules reconnect on close event', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.isConnected).toBe(true);
    const firstWs = MockWebSocket.instances[0];

    // Close the connection
    await act(async () => {
      firstWs.close();
      await new Promise((r) => setTimeout(r, 10));
    });

    // Should have reconnected (new WebSocket instance)
    expect(MockWebSocket.instances.length).toBe(2);
  });

  it('disconnect() stops reconnection', async () => {
    const { result } = renderHook(() =>
      useNotificationWebSocket({ userId: 'user-123', enabled: true })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);

    // Close should not trigger reconnect since we manually disconnected
    const ws = MockWebSocket.instances[0];
    await act(async () => {
      ws.close();
      await new Promise((r) => setTimeout(r, 200));
    });

    // Only one instance (the manual close), no auto-reconnect
    expect(MockWebSocket.instances.length).toBe(1);
  });
});
