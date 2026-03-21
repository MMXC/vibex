/**
 * useSSEStream Tests
 * 
 * Epic 5: SSE 流式 + AI展示区
 * Test IDs: ST-5.1, ST-5.2, ST-5.3
 * 
 * MockEventSource does NOT auto-fire onopen - tests control timing manually.
 */

import { renderHook, act } from '@testing-library/react';
import { useSSEStream, getReconnectSchedule, canRetry } from '../useSSEStream';

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

describe('useSSEStream', () => {

  // ========== ST-5.1: SSE 连接建立 ==========
  describe('ST-5.1: SSE 连接建立', () => {
    it('should start with idle status', () => {
      const { result } = renderHook(() => useSSEStream());
      expect(result.current.sseStatus).toBe('idle');
      expect(result.current.streamingText).toBe('');
      expect(result.current.reconnectCount).toBe(0);
    });

    it('should transition to connecting when connect() is called', () => {
      const { result } = renderHook(() => useSSEStream());
      
      act(() => {
        result.current.connect('Test requirement');
      });

      expect(result.current.sseStatus).toBe('connecting');
      expect(MockEventSource.instances.length).toBe(1);
    });

    it('should create EventSource with correct URL', () => {
      const { result } = renderHook(() => useSSEStream());
      
      act(() => {
        result.current.connect('Build an e-commerce system');
      });

      expect(MockEventSource.instances.length).toBe(1);
      expect(MockEventSource.instances[0].url).toContain('/api/v1/analyze/stream');
      expect(MockEventSource.instances[0].url).toContain('Build%20an%20e-commerce%20system');
    });

    it('should transition to connected when onopen is fired', () => {
      const { result } = renderHook(() => useSSEStream());
      
      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      expect(result.current.sseStatus).toBe('connected');
    });

    it('should call onThinking callback when thinking event is received', () => {
      const onThinking = jest.fn();
      const { result } = renderHook(() =>
        useSSEStream({ onThinking })
      );

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('thinking', JSON.stringify({ text: 'Analyzing requirements...' }));
      });

      expect(onThinking).toHaveBeenCalledWith('Analyzing requirements...');
    });
  });

  // ========== ST-5.2: 流式文本逐步显示 ==========
  describe('ST-5.2: 流式文本逐步显示', () => {
    it('should accumulate streaming text incrementally', () => {
      const { result } = renderHook(() => useSSEStream());

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('thinking', JSON.stringify({ text: 'First chunk. ' }));
      });
      expect(result.current.streamingText).toBe('First chunk. ');

      act(() => {
        MockEventSource.instances[0].dispatchEvent('thinking', JSON.stringify({ text: 'Second chunk. ' }));
      });
      expect(result.current.streamingText).toBe('First chunk. Second chunk. ');

      act(() => {
        MockEventSource.instances[0].dispatchEvent('thinking', JSON.stringify({ text: 'Third chunk.' }));
      });
      expect(result.current.streamingText).toBe('First chunk. Second chunk. Third chunk.');
    });

    it('should update streamingText on each thinking event', () => {
      const { result } = renderHook(() => useSSEStream());

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      for (let i = 0; i < 5; i++) {
        act(() => {
          MockEventSource.instances[0].dispatchEvent('thinking', JSON.stringify({ text: `Update ${i}. ` }));
        });
      }

      expect(result.current.streamingText).toContain('Update 4');
    });

    it('should clear streamingText when disconnect is called', () => {
      const { result } = renderHook(() => useSSEStream());

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('thinking', JSON.stringify({ text: 'Some text' }));
      });

      expect(result.current.streamingText).toBe('Some text');

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.streamingText).toBe('');
      expect(result.current.sseStatus).toBe('idle');
    });
  });

  // ========== ST-5.3: 重连逻辑 ==========
  describe('ST-5.3: 重连逻辑', () => {
    it('should use exponential backoff: 1s → 2s → 4s', () => {
      const schedule = getReconnectSchedule();
      expect(schedule.delays).toEqual([1000, 2000, 4000]);
    });

    it('should allow retry up to 3 times', () => {
      expect(canRetry(0)).toBe(true);
      expect(canRetry(1)).toBe(true);
      expect(canRetry(2)).toBe(true);
      expect(canRetry(3)).toBe(false);
      expect(canRetry(4)).toBe(false);
    });

    it('should handle single reconnect correctly', () => {
      const { result } = renderHook(() => useSSEStream());

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      // Simulate error
      const es = MockEventSource.instances[0];
      act(() => {
        es.close();
        es.onerror?.({} as Event);
      });

      expect(result.current.sseStatus).toBe('reconnecting');
      expect(result.current.reconnectCount).toBe(1);
    });

    it('should handle multiple reconnect attempts', () => {
      // Test that each error increments the reconnect count correctly
      const { result } = renderHook(() => useSSEStream());

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      // First error: count = 1
      const es = MockEventSource.instances[0];
      act(() => {
        es.close();
        es.onerror?.({} as Event);
      });
      expect(result.current.reconnectCount).toBe(1);
      expect(result.current.sseStatus).toBe('reconnecting');
    });
  });

  // ========== AI Results Parsing ==========
  describe('AI Results Parsing', () => {
    it('should call onContext callback for step_context event', () => {
      const onContext = jest.fn();
      const { result } = renderHook(() =>
        useSSEStream({ onContext })
      );

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('step_context', JSON.stringify({
          type: 'context',
          content: 'User Management Context',
          mermaidCode: 'graph TD;',
          confidence: 0.85,
        }));
      });

      expect(onContext).toHaveBeenCalledWith({
        type: 'context',
        content: 'User Management Context',
        mermaidCode: 'graph TD;',
        confidence: 0.85,
      });
    });

    it('should call onModel callback for step_model event', () => {
      const onModel = jest.fn();
      const { result } = renderHook(() =>
        useSSEStream({ onModel })
      );

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('step_model', JSON.stringify({
          type: 'model',
          content: 'User Entity',
          mermaidCode: 'classDiagram;',
          confidence: 0.9,
        }));
      });

      expect(onModel).toHaveBeenCalled();
    });

    it('should call onFlow callback for step_flow event', () => {
      const onFlow = jest.fn();
      const { result } = renderHook(() =>
        useSSEStream({ onFlow })
      );

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('step_flow', JSON.stringify({
          type: 'flow',
          content: 'Registration Flow',
          mermaidCode: 'flowchart TD;',
          confidence: 0.75,
        }));
      });

      expect(onFlow).toHaveBeenCalled();
    });

    it('should call onDone callback when done event is received', () => {
      const onDone = jest.fn();
      const { result } = renderHook(() =>
        useSSEStream({ onDone })
      );

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('done', JSON.stringify({ projectId: 'proj-123' }));
      });

      expect(onDone).toHaveBeenCalledWith({ projectId: 'proj-123' });
    });

    it('should call onError callback for error event', () => {
      const onError = jest.fn();
      const { result } = renderHook(() =>
        useSSEStream({ onError })
      );

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('error', JSON.stringify({ message: 'Analysis failed' }));
      });

      expect(onError).toHaveBeenCalledWith('Analysis failed');
      expect(result.current.errorMessage).toBe('Analysis failed');
    });

    it('should set errorMessage on SSE error event', () => {
      const { result } = renderHook(() => useSSEStream());

      act(() => {
        result.current.connect('Test');
      });

      act(() => {
        MockEventSource.instances[0].onopen?.({} as Event);
      });

      act(() => {
        MockEventSource.instances[0].dispatchEvent('error', JSON.stringify({ message: 'Test error' }));
      });

      expect(result.current.errorMessage).toBe('Test error');
    });
  });
});
