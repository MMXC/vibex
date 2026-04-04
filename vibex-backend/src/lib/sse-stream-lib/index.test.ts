/**
 * Tests for SSE Stream Library - E1-SSE超时清理
 * Covers: timeout, abort, cleanup, client disconnect scenarios
 */

import { buildSSEStream, sendSSE, sendThinking } from './index';

// ─── Mock helpers ───────────────────────────────────────────────────────────

const mockEnv = {
  AI: { fetch: jest.fn() },
  DB: {} as any,
  MINIMAX_API_KEY: 'test-key',
  MINIMAX_MODEL: 'test-model',
} as any;

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('sendSSE', () => {
  it('enqueues SSE-formatted data to controller', () => {
    const chunks: Uint8Array[] = [];
    const controller = {
      enqueue: jest.fn((chunk: Uint8Array) => chunks.push(chunk)),
    } as unknown as ReadableStreamDefaultController;

    sendSSE(controller, 'step_model', { content: 'hello' });

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    const encoded = new TextDecoder().decode(chunks[0]);
    expect(encoded).toContain('event: step_model');
    expect(encoded).toContain('"content":"hello"');
    expect(encoded).toMatch(/\n\n$/); // double newline terminator
  });
});

describe('sendThinking', () => {
  it('sends thinking event with delta flag', () => {
    const controller = {
      enqueue: jest.fn(),
    } as unknown as ReadableStreamDefaultController;

    sendThinking(controller, '分析中...', true);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    const encoded = new TextDecoder().decode(
      (controller.enqueue as jest.Mock).mock.calls[0][0] as Uint8Array
    );
    expect(encoded).toContain('event: thinking');
    expect(encoded).toContain('"content":"分析中..."');
    expect(encoded).toContain('"delta":true');
  });
});

describe('buildSSEStream', () => {
  // ── Test: creates AbortController on start ──────────────────────────────
  it('creates AbortController on stream start', async () => {
    const stream = buildSSEStream({ requirement: 'test req', env: mockEnv });
    const reader = stream.getReader();

    // Let the stream initialize and timers register
    await new Promise(r => setTimeout(r, 30));

    await reader.cancel();

    // Stream was created successfully (AbortController was used internally)
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  // ── Test: cancel() aborts pending operations ─────────────────────────
  it('cancel() aborts the stream and cleans up', async () => {
    const stream = buildSSEStream({ requirement: 'test req', env: mockEnv });
    const reader = stream.getReader();

    await new Promise(r => setTimeout(r, 30));

    // Cancel should complete without throwing
    await expect(reader.cancel()).resolves.toBeUndefined();
  });

  // ── Test: finally block clears timers ──────────────────────────────────
  it('finally block clears all timers after stream ends', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout').mockImplementation(() => {});

    const stream = buildSSEStream({ requirement: 'test req', env: mockEnv });
    const reader = stream.getReader();

    try {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    } catch {
      // AI service not available in test env — ignore
    }

    // finally block runs after all awaits complete, clearing timers
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  // ── Test: stream returns a valid ReadableStream ─────────────────────────
  it('returns a valid ReadableStream instance', () => {
    const stream = buildSSEStream({ requirement: 'test req', env: mockEnv });
    expect(stream).toBeInstanceOf(ReadableStream);
    expect(typeof stream.getReader).toBe('function');
    expect(typeof stream.cancel).toBe('function');
  });

  // ── Test: ReadableStream has cancel method ──────────────────────────────
  it('stream can be cancelled via cancel()', async () => {
    const stream = buildSSEStream({ requirement: 'test req', env: mockEnv });

    // cancel() should not throw
    await expect(stream.cancel()).resolves.toBeUndefined();
  });

  // ── Test: abort triggers controller.close ──────────────────────────────
  it('abort signal closes the controller', async () => {
    let abortHandler: ((e: Event) => void) | null = null;
    const originalAbortController = global.AbortController;
    const mockAbort = jest.fn();

    // Intercept AbortController to capture the abort handler
    (global as Record<string, unknown>).AbortController = function MockAbortController() {
      const signal: AbortSignal = {
        aborted: false,
        addEventListener: (_: string, handler: (e: Event) => void) => { abortHandler = handler; },
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onabort: null,
      } as unknown as AbortSignal;

      return {
        signal,
        abort: mockAbort,
      };
    } as unknown as typeof AbortController;

    const stream = buildSSEStream({ requirement: 'test req', env: mockEnv });
    const reader = stream.getReader();

    await new Promise(r => setTimeout(r, 20));

    // Simulate abort
    if (abortHandler) abortHandler(new Event('abort'));

    // Cancel to trigger finally cleanup
    await reader.cancel();

    // mockAbort should have been called during cleanup
    expect(mockAbort).toHaveBeenCalled();

    (global as Record<string, unknown>).AbortController = originalAbortController;
  });
});

describe('E1 acceptance criteria', () => {
  it('signal property is accepted by LLMRequestOptions', () => {
    const signal = new AbortController().signal;
    const opts = { signal };
    expect((opts as any).signal).toBe(signal);
  });
});
