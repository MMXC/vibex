/**
 * ProgressiveRenderer 组件测试
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { ProgressiveRenderer } from './ProgressiveRenderer';

// Mock stores
const mockAddBoundedContext = jest.fn();
const mockSetBoundedContexts = jest.fn();
const mockSetDomainModels = jest.fn();
const mockSetBusinessFlow = jest.fn();

jest.mock('@/stores/confirmation/contextStore', () => ({
  useContextStore: jest.fn((selector) => {
    const state = {
      boundedContexts: [],
      setBoundedContexts: mockSetBoundedContexts,
    };
    return selector(state);
  }),
}));

jest.mock('@/stores/confirmation/modelStore', () => ({
  useModelStore: jest.fn((selector) => {
    const state = {
      domainModels: [],
      setDomainModels: mockSetDomainModels,
    };
    return selector(state);
  }),
}));

jest.mock('@/stores/confirmation/flowStore', () => ({
  useFlowStore: jest.fn((selector) => {
    const state = {
      businessFlow: { states: [], transitions: [] },
      setBusinessFlow: mockSetBusinessFlow,
    };
    return selector(state);
  }),
}));

// Mock EventSource
let mockEventSourceInstance: {
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: (() => void) | null;
  close: () => void;
  url: string;
} | null = null;

class MockEventSource {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;

  constructor(url: string) {
    this.url = url;
    mockEventSourceInstance = this;
  }

  close() {
    mockEventSourceInstance = null;
  }
}

describe('ProgressiveRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.EventSource = MockEventSource as any;
  });

  afterEach(() => {
    mockEventSourceInstance = null as any;
  });

  it('should render with default props', () => {
    const { result } = renderHook(() =>
      ProgressiveRenderer({
        requirement: '',
        enabled: false,
      })
    );

    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() =>
      ProgressiveRenderer({
        requirement: 'test requirement',
        enabled: false,
      })
    );

    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.progressMessage).toBe('');
  });

  it('should return current state', () => {
    const { result } = renderHook(() =>
      ProgressiveRenderer({
        requirement: 'test',
        enabled: false,
      })
    );

    expect(result.current.state).toBeDefined();
    expect(result.current.progress).toBeDefined();
    expect(result.current.progressMessage).toBeDefined();
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('should handle enabled prop change', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        ProgressiveRenderer({
          requirement: 'test requirement',
          enabled,
        }),
      { initialProps: { enabled: false } }
    );

    expect(result.current.state).toBe('idle');

    rerender({ enabled: true });

    // After enabling, it should start connecting
    expect(result.current.state).toBe('connecting');
  });

  it('should call onProgress callback', () => {
    const onProgress = jest.fn();
    
    renderHook(() =>
      ProgressiveRenderer({
        requirement: 'test requirement',
        enabled: true,
        onProgress,
      })
    );

    // Simulate progress event
    act(() => {
      if (mockEventSourceInstance?.onmessage) {
        mockEventSourceInstance.onmessage({
          data: JSON.stringify({
            type: 'progress',
            data: { step: 'context', progress: 50, message: '分析中...' },
          }),
        });
      }
    });

    expect(onProgress).toHaveBeenCalledWith(50, '分析中...');
  });

  it('should call onComplete callback', () => {
    const onComplete = jest.fn();
    
    renderHook(() =>
      ProgressiveRenderer({
        requirement: 'test requirement',
        enabled: true,
        onComplete,
      })
    );

    // Simulate complete event
    act(() => {
      if (mockEventSourceInstance?.onmessage) {
        mockEventSourceInstance.onmessage({
          data: JSON.stringify({
            type: 'complete',
            data: {
              summary: '设计完成',
              stats: { entities: 5, relations: 3 },
            },
          }),
        });
      }
    });

    expect(onComplete).toHaveBeenCalledWith('设计完成', { entities: 5, relations: 3 });
  });

  it('should call onError callback', () => {
    const onError = jest.fn();
    
    renderHook(() =>
      ProgressiveRenderer({
        requirement: 'test requirement',
        enabled: true,
        onError,
      })
    );

    // Simulate error event
    act(() => {
      if (mockEventSourceInstance?.onmessage) {
        mockEventSourceInstance.onmessage({
          data: JSON.stringify({
            type: 'error',
            data: {
              code: 'EMPTY_REQUIREMENT',
              message: '请输入需求描述',
              recoverable: false,
            },
          }),
        });
      }
    });

    expect(onError).toHaveBeenCalledWith({
      code: 'EMPTY_REQUIREMENT',
      message: '请输入需求描述',
      recoverable: false,
    });
  });

  it('should update progress state on progress event', () => {
    const { result } = renderHook(() =>
      ProgressiveRenderer({
        requirement: 'test requirement',
        enabled: true,
      })
    );

    act(() => {
      if (mockEventSourceInstance?.onmessage) {
        mockEventSourceInstance.onmessage({
          data: JSON.stringify({
            type: 'progress',
            data: { step: 'entity', progress: 75, message: '生成实体...' },
          }),
        });
      }
    });

    expect(result.current.progress).toBe(75);
    expect(result.current.progressMessage).toBe('生成实体...');
  });

  it('should handle invalid JSON gracefully', () => {
    const { result } = renderHook(() =>
      ProgressiveRenderer({
        requirement: 'test requirement',
        enabled: true,
      })
    );

    act(() => {
      if (mockEventSourceInstance?.onmessage) {
        mockEventSourceInstance.onmessage({
          data: 'invalid json',
        });
      }
    });

    // Should not crash and state should remain unchanged
    expect(result.current.state).toBe('connecting');
  });

  it('should not connect when disabled', () => {
    renderHook(() =>
      ProgressiveRenderer({
        requirement: 'test requirement',
        enabled: false,
      })
    );

    // EventSource should not be created
    expect(mockEventSourceInstance).toBeNull();
  });
});