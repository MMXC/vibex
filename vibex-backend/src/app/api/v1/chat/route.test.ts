import { NextRequest } from 'next/server';

// Mock fetch for external API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn().mockReturnValue({ userId: 'test-user', email: 'test@test.com' }),
}));

jest.mock('@/lib/authFromGateway', () => ({
  getAuthUserFromRequest: jest.fn().mockReturnValue({ userId: 'test-user', email: 'test@test.com' }),
}));

jest.mock('@/lib/high-risk-validation', () => ({
  parseBody: jest.fn().mockResolvedValue({
    data: {
      message: 'Hello',
      conversationId: null,
      history: [],
    },
  }),
}));

jest.mock('@/schemas/security', () => ({
  chatMessageSchema: jest.fn(),
}));

import { GET as ChatStatusGET, POST as ChatPOST } from './route';

describe('GET /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return API status', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat');
    const response = await ChatStatusGET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });
});

describe('[F2.3] conversationId first event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends conversationId in the first SSE event', async () => {
    // Mock a fast MiniMax response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
            })
            .mockResolvedValueOnce({
              done: true,
              value: new Uint8Array(),
            }),
          releaseLock: jest.fn(),
        }),
      },
    });

    const request = new NextRequest('http://localhost:3000/api/v1/chat', {
      method: 'POST',
    });

    const response = await ChatPOST(request);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');

    // Read the stream to verify first event has conversationId
    const reader = response.body!.getReader();
    const { value } = await reader.read();
    const firstEvent = JSON.parse(new TextDecoder().decode(value).replace('data: ', ''));

    expect(firstEvent.conversationId).toBeDefined();
    expect(typeof firstEvent.conversationId).toBe('string');
    expect(firstEvent.conversationId.length).toBeGreaterThan(0);

    await reader.cancel();
  });
});

describe('[F2.1] timeout behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('times out after 30 seconds and closes stream', async () => {
    // Track the abort signal passed to fetch so we can control it
    let capturedSignal: AbortSignal | undefined;
    mockFetch.mockImplementationOnce((_url: string, options?: RequestInit) => {
      capturedSignal = options?.signal as AbortSignal | undefined;
      // Return a Response with a body that will throw AbortError when signal is aborted
      const body = new ReadableStream({
        start(controller) {
          // Controller will be closed when signal aborts
        },
        cancel() {},
      });
      // Wrap in a Response that won't resolve until abort
      return new Promise<never>((_, reject) => {
        capturedSignal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    const request = new NextRequest('http://localhost:3000/api/v1/chat', {
      method: 'POST',
    });

    const responsePromise = ChatPOST(request);

    // Advance fake timers by 31s — should trigger setTimeout → abortController.abort()
    jest.advanceTimersByTime(31_000);
    await jest.runAllTimersAsync();

    // Verify the abort signal was triggered
    expect(capturedSignal?.aborted).toBe(true);

    const response = await responsePromise;
    const reader = response.body!.getReader();

    // Read events until stream closes
    const events: string[] = [];
    let streamDone = false;
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) {
        streamDone = true;
        break;
      }
      const text = new TextDecoder().decode(value);
      events.push(text);
    }

    // Stream should have emitted the conversationId event, then error/closed
    expect(events.length).toBeGreaterThanOrEqual(1);
    reader.releaseLock();
  });

  it('cleans up timeout on normal completion', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout').mockImplementation(() => {});

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: [DONE]\n'),
            })
            .mockResolvedValueOnce({
              done: true,
              value: new Uint8Array(),
            }),
          releaseLock: jest.fn(),
        }),
      },
    });

    const request = new NextRequest('http://localhost:3000/api/v1/chat', {
      method: 'POST',
    });

    const response = await ChatPOST(request);
    const reader = response.body!.getReader();

    // Read all
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    // finally block should have cleared timeout
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
