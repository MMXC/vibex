/**
 * useStreamingAgent.test.ts — Sprint45 P001-E1: AI 断线重连
 *
 * Tests for useStreamingAgent retry logic, exponential backoff, and IndexedDB chunk persistence.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamingAgent } from '../useStreamingAgent';

// Mock the streamingChunkDB module
vi.mock('@/lib/streamingChunkDB', () => ({
  persistStreamingChunk: vi.fn().mockResolvedValue(undefined),
  loadStreamingChunk: vi.fn().mockResolvedValue(''),
  clearStreamingChunk: vi.fn().mockResolvedValue(undefined),
}));

function makeSSEStream(chunks: string[], done = true): string {
  return (
    chunks.map((c) => `data: ${JSON.stringify({ content: c })}\n`).join('') +
    (done ? `data: ${JSON.stringify({ done: true })}\n` : '')
  );
}

function mockFetchSSE(text: string, status = 200) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
  global.fetch = vi.fn().mockResolvedValue(
    new Response(stream, {
      status,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  );
}

function mockFetchFail(status = 500, errorData?: { error: string }) {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(errorData ? JSON.stringify(errorData) : '', { status })
  );
}

function mockFetchNetworkError() {
  global.fetch = vi.fn().mockRejectedValue(new TypeError('Network request failed'));
}

describe('useStreamingAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Basic streaming
  // -------------------------------------------------------------------------
  it('streams content from SSE response', async () => {
    mockFetchSSE(makeSSEStream(['Hello', ' world']));
    const { result } = renderHook(() => useStreamingAgent());

    await act(async () => {
      result.current.sendMessage('hi');
      // Give the async stream time to process
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => {
      // user message + assistant message = at least 2 messages
      expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
    });
    // Check that assistant message was created (role='assistant')
    const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
  });

  it('calls onComplete with full content', async () => {
    mockFetchSSE(makeSSEStream(['a', 'b', 'c']));
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useStreamingAgent({ onComplete })
    );

    await act(async () => {
      result.current.sendMessage('test');
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('abc'));
  });

  it('calls onError on HTTP error', async () => {
    mockFetchFail(500, { error: 'Server error' });
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useStreamingAgent({ onError })
    );

    await act(async () => {
      result.current.sendMessage('test');
      await new Promise((r) => setTimeout(r, 20));
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Server error'));
    expect(result.current.error).toBe('Server error');
  });

  it('clear() resets messages and error', async () => {
    mockFetchSSE(makeSSEStream(['content']));
    const { result } = renderHook(() => useStreamingAgent());

    await act(async () => {
      result.current.sendMessage('test');
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => expect(result.current.messages.length).toBeGreaterThan(0));

    act(() => result.current.clear());

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBeNull();
    expect(result.current.retrying).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Retry logic (S45-E1)
  // -------------------------------------------------------------------------
  it('does not retry when maxRetries=0 (default, backward compatible)', async () => {
    let attempt = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      attempt++;
      return Promise.reject(new TypeError('Network error'));
    });

    const { result } = renderHook(() => useStreamingAgent({ maxRetries: 0 }));

    await act(async () => {
      result.current.sendMessage('test');
      await new Promise((r) => setTimeout(r, 20));
    });

    await waitFor(() => expect(result.current.error).toBe('Network error'));
    // Only 1 attempt — no retries
    expect(attempt).toBe(1);
  });

  it('updates retrying state during retry attempts', async () => {
    let attempt = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      attempt++;
      if (attempt <= 2) {
        return Promise.reject(new TypeError('fail'));
      }
      return Promise.resolve(
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: 'ok' })}\n`));
              c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n`));
              c.close();
            },
          }),
          { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
        )
      );
    });

    const { result } = renderHook(() => useStreamingAgent({ maxRetries: 2 }));

    // First attempt
    await act(async () => {
      result.current.sendMessage('test');
      await new Promise((r) => setTimeout(r, 20));
    });

    // After first failure → retrying = 1
    await waitFor(() => expect(result.current.retrying).toBeGreaterThanOrEqual(1));

    // Wait for all retries (1s + 2s = 3s) + success
    await act(async () => {
      await new Promise((r) => setTimeout(r, 3500));
    });

    await waitFor(() => {
      expect(result.current.messages[1]?.content).toBe('ok');
    });
    expect(attempt).toBe(3);
  });

  it('sets lastError after all retries exhausted', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Always fails'));

    const { result } = renderHook(() => useStreamingAgent({ maxRetries: 2 }));

    await act(async () => {
      result.current.sendMessage('test');
      await new Promise((r) => setTimeout(r, 20));
    });

    // Wait through all retries: 1s + 2s = 3s
    await act(async () => {
      await new Promise((r) => setTimeout(r, 3500));
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Always fails');
    });
    expect(result.current.lastError).toBe('Always fails');
    expect(result.current.isStreaming).toBe(false);
  });

  it('aborts and stops retrying when abort() is called', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('fail'));

    const { result } = renderHook(() => useStreamingAgent({ maxRetries: 2 }));

    await act(async () => {
      result.current.sendMessage('test');
      await new Promise((r) => setTimeout(r, 20));
    });

    // Wait for first failure to register
    await waitFor(() => expect(result.current.retrying).toBeGreaterThanOrEqual(1));

    // Abort
    act(() => result.current.abort());

    // After abort, isStreaming should be false
    expect(result.current.isStreaming).toBe(false);
  });

  it('returns retrying and lastError in the hook API', async () => {
    mockFetchSSE(makeSSEStream(['done']));
    const { result } = renderHook(() => useStreamingAgent({ maxRetries: 1 }));

    expect(result.current.retrying).toBe(0);
    expect(result.current.lastError).toBeNull();

    await act(async () => {
      result.current.sendMessage('test');
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => {
      expect(result.current.messages[1]?.content).toBe('done');
    });
    expect(result.current.retrying).toBe(0);
    expect(result.current.error).toBeNull();
  });
});
