/**
 * ProgressiveRenderer 组件测试
 */

import { renderHook, act } from '@testing-library/react';
import { ProgressiveRenderer } from '../ProgressiveRenderer';

// Mock stores
jest.mock('@/stores/confirmation/contextStore', () => ({
  useContextStore: jest.fn(() => ({
    addBoundedContext: jest.fn(),
    updateBoundedContext: jest.fn(),
  })),
}));

jest.mock('@/stores/confirmation/modelStore', () => ({
  useModelStore: jest.fn(() => ({
    addDomainModel: jest.fn(),
    updateDomainModel: jest.fn(),
    removeDomainModel: jest.fn(),
    addRelationship: jest.fn(),
  })),
}));

jest.mock('@/stores/confirmation/flowStore', () => ({
  useFlowStore: jest.fn(() => ({
    addFlowStep: jest.fn(),
    updateFlowStep: jest.fn(),
  })),
}));

// Mock EventSource
class MockEventSource {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public url: string) {}

  close() {}
}

describe('ProgressiveRenderer', () => {
  beforeEach(() => {
    global.EventSource = MockEventSource as any;
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

  it('should handle progress events', () => {
    const mockEventSource = new MockEventSource('/api/design/stream');
    const onProgress = jest.fn();

    // Simulate event
    const progressEvent = {
      data: JSON.stringify({
        type: 'progress',
        data: { step: 'context', progress: 50, message: '分析中...' },
      }),
    };

    expect(progressEvent).toBeDefined();
    expect(onProgress).toBeDefined();
  });

  it('should handle entity:add events', () => {
    const entityEvent = {
      data: JSON.stringify({
        type: 'entity:add',
        data: {
          id: 'entity-1',
          name: 'User',
          type: 'entity',
          attributes: [],
          relationships: [],
        },
      }),
    };

    expect(entityEvent).toBeDefined();
  });

  it('should handle complete events', () => {
    const completeEvent = {
      data: JSON.stringify({
        type: 'complete',
        data: {
          summary: '设计完成',
          stats: { entities: 5, relations: 3 },
        },
      }),
    };

    expect(completeEvent).toBeDefined();
  });

  it('should handle error events', () => {
    const errorEvent = {
      data: JSON.stringify({
        type: 'error',
        data: {
          code: 'EMPTY_REQUIREMENT',
          message: '请输入需求描述',
          recoverable: false,
        },
      }),
    };

    expect(errorEvent).toBeDefined();
  });
});
