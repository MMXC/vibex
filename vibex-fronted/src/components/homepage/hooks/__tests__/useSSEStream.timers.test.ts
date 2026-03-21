/**
 * useSSEStream Timer Tests
 * 
 * Epic 5: SSE 流式 + AI展示区
 * Test IDs: ST-5.3
 * 
 * MockEventSource does NOT auto-fire onopen.
 * Tests use real timers.
 */

import { renderHook, act } from '@testing-library/react';
import { useSSEStream } from '../useSSEStream';

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  readyState: number = MockEventSource.CONNECTING;
  onopen: ((e: Event) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  private listeners: Map<string, (e: MessageEvent) => void> = new Map();
  private _closed = false;
  url: string;

  static instances: MockEventSource[] = [];

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(eventType: string, handler: (e: MessageEvent) => void) {
    this.listeners.set(eventType, handler);
  }

  removeEventListener(_eventType: string) {}

  dispatchEvent(type: string, data: unknown) {
    const handler = this.listeners.get(type);
    if (handler) {
      handler({ data: typeof data === 'string' ? data : JSON.stringify(data) } as MessageEvent);
    }
  }

  close() {
    this._closed = true;
    this.readyState = MockEventSource.CLOSED;
    MockEventSource.instances = MockEventSource.instances.filter(e => e !== this);
  }
}

beforeAll(() => {
  Object.defineProperty(global, 'EventSource', {
    writable: true,
    value: MockEventSource,
  });
});

afterAll(() => {
  delete (global as unknown as Record<string, unknown>).EventSource;
});

beforeEach(() => {
  MockEventSource.instances = [];
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
});

describe('useSSEStream Timer Tests', () => {
  describe('ST-5.3: 重连逻辑 (指数退避)', () => {
    it('should fire onerror only once per EventSource', () => {
      const { result } = renderHook(() => useSSEStream());

      act(() => {
        result.current.connect('Test');
      });

      const es = MockEventSource.instances[0];
      act(() => {
        es.onerror?.({} as Event);
        es.onerror?.({} as Event);
        es.onerror?.({} as Event);
      });

      // Should only count once due to errorHandled flag
      expect(result.current.reconnectCount).toBe(1);
    });
  });
});
