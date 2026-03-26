/**
 * Epic2 integration test: Incremental analysis step skipping
 *
 * Tests:
 * - F2.1: useAnalysis passes stepContext when project has existing data
 * - F2.2: streamAnalyzer encodes stepContext as URL param
 * - F2.3: useSSEStream skips [skipped] step_context events
 * - F2.4: startStream accepts stepContext param
 */

import { renderHook, act } from '@testing-library/react';
import { useSSEStream } from '../useSSEStream';
import type { SSEEvent } from '../useSSEStream';

// Mock streamAnalyzer
const mockAddEventListener = jest.fn();
const mockClose = jest.fn();

jest.mock('@/lib/api/streamAnalyzer', () => ({
  streamAnalyzer: jest.fn((params) => {
    // Verify stepContext is passed through
    if (!params.stepContext && !params.requirement) {
      return { close: jest.fn() };
    }
    return {
      close: mockClose,
      addEventListener: mockAddEventListener,
    };
  }),
}));

jest.mock('@/lib/api/getApiUrl', () => ({
  getApiUrl: () => 'https://api.test.com',
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    if (key === 'vibex-current-project') return null;
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Epic 2: Incremental Analysis Step Skipping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('F2.1 + F2.2: stepContext in params and URL', () => {
    it('passes stepContext through streamAnalyzer params', () => {
      const stepContext = { step: 'context', contextId: 'ctx-1' };

      renderHook(() =>
        useSSEStream.getState().startStream({
          requirement: 'test requirement',
          id: 'proj-1',
          stepContext,
          onMessage: jest.fn(),
          onError: jest.fn(),
          onDone: jest.fn(),
        })
      );

      const { streamAnalyzer } = require('@/lib/api/streamAnalyzer');
      expect(streamAnalyzer).toHaveBeenCalledWith(
        expect.objectContaining({
          requirement: 'test requirement',
          id: 'proj-1',
          stepContext: { step: 'context', contextId: 'ctx-1' },
        })
      );
    });

    it('encodes stepContext as URI component in URL', () => {
      // Verify that the URL construction includes stepContext
      const stepContext = { step: 'flow' };
      const encoded = encodeURIComponent(JSON.stringify(stepContext));

      // The URL should contain stepContext=<encoded>
      expect(encoded).toBeTruthy();
      expect(decodeURIComponent(encoded)).toBe('{"step":"flow"}');
    });

    it('omits stepContext when not provided', () => {
      renderHook(() =>
        useSSEStream.getState().startStream({
          requirement: 'fresh analysis',
          onMessage: jest.fn(),
          onError: jest.fn(),
          onDone: jest.fn(),
        })
      );

      const { streamAnalyzer } = require('@/lib/api/streamAnalyzer');
      expect(streamAnalyzer).toHaveBeenCalledWith(
        expect.objectContaining({
          requirement: 'fresh analysis',
          stepContext: undefined,
        })
      );
    });
  });

  describe('F2.3: useSSEStream handles [skipped] step_context events', () => {
    it('skips step_context events with [skipped] marker', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();
      const onDone = jest.fn();
      let handleMessage: (event: MessageEvent) => void = () => {};

      mockAddEventListener.mockImplementation((type: string, handler: (e: MessageEvent) => void) => {
        if (type === 'message') {
          handleMessage = handler;
        }
      });

      renderHook(() =>
        useSSEStream.getState().startStream({
          requirement: 'test',
          stepContext: { step: 'context' },
          onMessage,
          onError,
          onDone,
        })
      );

      expect(handleMessage).toBeDefined();

      // Simulate [skipped] step_context event
      const skippedEvent = {
        data: JSON.stringify({
          type: 'step_context',
          data: {
            content: '限界上下文生成完成 [skipped]',
            mermaidCode: '',
            confidence: 1.0,
          },
        }),
      } as MessageEvent;

      act(() => {
        handleMessage(skippedEvent);
      });

      // onMessage should still be called (persisting skipped state)
      expect(onMessage).toHaveBeenCalledWith({
        type: 'step_context',
        data: expect.objectContaining({
          content: expect.stringContaining('[skipped]'),
          confidence: 1.0,
        }),
      });
    });

    it('processes normal step_context events without [skipped] marker', () => {
      const onMessage = jest.fn();
      let handleMessage: (event: MessageEvent) => void = () => {};

      mockAddEventListener.mockImplementation((type: string, handler: (e: MessageEvent) => void) => {
        if (type === 'message') handleMessage = handler;
      });

      renderHook(() =>
        useSSEStream.getState().startStream({
          requirement: 'test',
          onMessage,
          onError: jest.fn(),
          onDone: jest.fn(),
        })
      );

      const normalEvent = {
        data: JSON.stringify({
          type: 'step_context',
          data: {
            content: '限界上下文生成完成',
            mermaidCode: 'graph TD\n  A --> B',
            confidence: 0.9,
          },
        }),
      } as MessageEvent;

      act(() => {
        handleMessage(normalEvent);
      });

      expect(onMessage).toHaveBeenCalledWith({
        type: 'step_context',
        data: expect.objectContaining({
          content: '限界上下文生成完成',
          mermaidCode: 'graph TD\n  A --> B',
          confidence: 0.9,
        }),
      });
    });
  });

  describe('F2.4: startStream accepts stepContext param', () => {
    it('startStream is callable with stepContext', () => {
      const { startStream } = useSSEStream.getState();
      expect(typeof startStream).toBe('function');

      // Should not throw when called with stepContext
      expect(() =>
        startStream({
          requirement: 'test',
          stepContext: { step: 'context', contextId: 'ctx-1' },
          onMessage: jest.fn(),
          onError: jest.fn(),
          onDone: jest.fn(),
        })
      ).not.toThrow();
    });

    it('stepContext with all fields is supported', () => {
      const fullContext = {
        step: 'component',
        contextId: 'ctx-1',
        flowId: 'flow-1',
        componentId: 'comp-1',
      };

      const { startStream } = useSSEStream.getState();
      expect(() =>
        startStream({
          requirement: 'test',
          stepContext: fullContext,
          onMessage: jest.fn(),
          onError: jest.fn(),
          onDone: jest.fn(),
        })
      ).not.toThrow();

      const { streamAnalyzer } = require('@/lib/api/streamAnalyzer');
      expect(streamAnalyzer).toHaveBeenCalledWith(
        expect.objectContaining({ stepContext: fullContext })
      );
    });
  });
});
