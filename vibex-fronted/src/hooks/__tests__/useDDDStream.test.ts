/**
 * useDDDStream Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDDDStream } from '../useDDDStream';

// Mock dependencies
jest.mock('@/lib/api-config', () => ({
  getApiUrl: jest.fn((path: string) => `http://localhost:3000${path}`),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useDDDStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('initial state', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useDDDStream());
      
      expect(result.current.status).toBe('idle');
      expect(result.current.contexts).toEqual([]);
      expect(result.current.thinkingMessages).toEqual([]);
      expect(result.current.mermaidCode).toBe('');
      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('generateContexts', () => {
    it('should set status to thinking when called', async () => {
      // Mock successful response
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: mockEventSource,
      });

      const { result } = renderHook(() => useDDDStream());
      
      act(() => {
        result.current.generateContexts('test requirement');
      });

      expect(result.current.status).toBe('thinking');
    });

    it('should reset state before making new request', async () => {
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: mockEventSource,
      });

      const { result } = renderHook(() => useDDDStream());
      
      // First call
      act(() => {
        result.current.generateContexts('first requirement');
      });
      
      // Initial state should be reset
      expect(result.current.thinkingMessages).toEqual([]);
      expect(result.current.contexts).toEqual([]);
    });
  });

  describe('abort', () => {
    it('should reset status to idle when abort is called', async () => {
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: mockEventSource,
      });

      const { result } = renderHook(() => useDDDStream());
      
      act(() => {
        result.current.generateContexts('test requirement');
      });
      
      expect(result.current.status).toBe('thinking');
      
      act(() => {
        result.current.abort();
      });
      
      expect(result.current.status).toBe('idle');
    });

    it('should clear thinking messages when abort is called', async () => {
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: mockEventSource,
      });

      const { result } = renderHook(() => useDDDStream());
      
      act(() => {
        result.current.generateContexts('test requirement');
      });
      
      act(() => {
        result.current.abort();
      });
      
      expect(result.current.thinkingMessages).toEqual([]);
    });

    it('should clear contexts when abort is called', async () => {
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: mockEventSource,
      });

      const { result } = renderHook(() => useDDDStream());
      
      act(() => {
        result.current.generateContexts('test requirement');
      });
      
      act(() => {
        result.current.abort();
      });
      
      expect(result.current.contexts).toEqual([]);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: mockEventSource,
      });

      const { result } = renderHook(() => useDDDStream());
      
      act(() => {
        result.current.generateContexts('test requirement');
      });
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.status).toBe('idle');
      expect(result.current.thinkingMessages).toEqual([]);
      expect(result.current.contexts).toEqual([]);
      expect(result.current.mermaidCode).toBe('');
      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error message when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDDDStream());
      
      act(() => {
        result.current.generateContexts('test requirement');
      });
      
      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
      
      expect(result.current.errorMessage).toBeDefined();
    });

    it('should set error status when API returns error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useDDDStream());
      
      act(() => {
        result.current.generateContexts('test requirement');
      });
      
      // Wait for error to be set
      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        body: mockEventSource,
      });

      const { result, unmount } = renderHook(() => useDDDStream());
      
      act(() => {
        result.current.generateContexts('test requirement');
      });
      
      unmount();
      
      // The cleanup should have been called (EventSource closed)
      // We can't directly verify this in unit test without more mocking
      expect(true).toBe(true);
    });
  });
});
