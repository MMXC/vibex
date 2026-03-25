/**
 * dddApi.test.ts — DDD AI SSE Client Tests
 *
 * Epic 1 实现: F1.1-F1.4 测试覆盖
 */
import { analyzeRequirement, DDDApiCallbacks } from './dddApi';

describe('dddApi', () => {
  // Mock fetch and ReadableStream
  const mockFetch = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function createMockSSEStream(events: Array<{ event: string; data: string }>): Body {
    const encoder = new TextEncoder();
    const chunks = events.map(({ event, data }) => {
      return encoder.encode(`event: ${event}\ndata: ${data}\n\n`);
    });

    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(chunk));
        controller.close();
      },
    });

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      body: stream,
    } as unknown as Body;
  }

  describe('analyzeRequirement', () => {
    it('calls correct URL with encoded requirement', async () => {
      mockFetch.mockResolvedValueOnce(createMockSSEStream([
        { event: 'done', data: JSON.stringify({ projectId: 'p1', summary: 'Done' }) },
      ]));

      const callbacks: DDDApiCallbacks = {};
      await analyzeRequirement('Build a login system', callbacks);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/analyze/stream');
      expect(url).toContain('Build%20a%20login%20system');
      expect(options.method).toBe('GET');
    });

    it('parses thinking event correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockSSEStream([
        { event: 'thinking', data: JSON.stringify({ content: 'Analyzing...', delta: true }) },
        { event: 'done', data: JSON.stringify({ projectId: 'p1', summary: 'Done' }) },
      ]));

      const onThinking = jest.fn();
      await analyzeRequirement('test', { onThinking });

      expect(onThinking).toHaveBeenCalledWith('Analyzing...', true);
    });

    it('parses step_context event correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockSSEStream([
        { event: 'step_context', data: JSON.stringify({ content: 'Context A', mermaidCode: 'graph TD', confidence: 0.95 }) },
        { event: 'done', data: JSON.stringify({ projectId: 'p1', summary: 'Done' }) },
      ]));

      const onStepContext = jest.fn();
      await analyzeRequirement('test', { onStepContext });

      expect(onStepContext).toHaveBeenCalledWith('Context A', 'graph TD', 0.95);
    });

    it('parses step_model event correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockSSEStream([
        { event: 'step_model', data: JSON.stringify({ content: 'User Model', mermaidCode: 'class User{}', confidence: 0.9 }) },
        { event: 'done', data: JSON.stringify({ projectId: 'p1', summary: 'Done' }) },
      ]));

      const onStepModel = jest.fn();
      await analyzeRequirement('test', { onStepModel });

      expect(onStepModel).toHaveBeenCalledWith('User Model', 'class User{}', 0.9);
    });

    it('parses step_flow event correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockSSEStream([
        { event: 'step_flow', data: JSON.stringify({ content: 'Auth Flow', mermaidCode: 'flowchart', confidence: 0.88 }) },
        { event: 'done', data: JSON.stringify({ projectId: 'p1', summary: 'Done' }) },
      ]));

      const onStepFlow = jest.fn();
      await analyzeRequirement('test', { onStepFlow });

      expect(onStepFlow).toHaveBeenCalledWith('Auth Flow', 'flowchart', 0.88);
    });

    it('parses step_components event correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockSSEStream([
        { event: 'step_components', data: JSON.stringify({ content: 'Components', mermaidCode: 'comp', confidence: 0.85 }) },
        { event: 'done', data: JSON.stringify({ projectId: 'p1', summary: 'Done' }) },
      ]));

      const onStepComponents = jest.fn();
      await analyzeRequirement('test', { onStepComponents });

      expect(onStepComponents).toHaveBeenCalledWith('Components', 'comp', 0.85);
    });

    it('parses done event correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockSSEStream([
        { event: 'done', data: JSON.stringify({ projectId: 'proj-123', summary: 'Analysis complete' }) },
      ]));

      const onDone = jest.fn();
      await analyzeRequirement('test', { onDone });

      expect(onDone).toHaveBeenCalledWith('proj-123', 'Analysis complete');
    });

    it('parses error event correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockSSEStream([
        { event: 'error', data: JSON.stringify({ message: 'API rate limited', code: 'RATE_LIMIT' }) },
      ]));

      const onError = jest.fn();
      await analyzeRequirement('test', { onError });

      expect(onError).toHaveBeenCalledWith('API rate limited', 'RATE_LIMIT');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const onError = jest.fn();
      await expect(analyzeRequirement('test', { onError })).rejects.toThrow('HTTP 500');
    });

    it('throws on null body', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, body: null });

      await expect(analyzeRequirement('test', {})).rejects.toThrow('Response body is null');
    });

    it('respects timeout option', async () => {
      // Create a stream that never sends data
      const stream = new ReadableStream({
        start(controller) {
          // Never close or send data
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: stream,
      });

      const start = Date.now();
      await expect(
        analyzeRequirement('test', { timeoutMs: 500 })
      ).rejects.toThrow();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(400);
      expect(elapsed).toBeLessThan(2000);
    });

    it('handles malformed JSON gracefully', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`event: thinking\ndata: not-valid-json\n\n`));
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ projectId: 'p1', summary: 'ok' })}\n\n`));
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

      const onThinking = jest.fn();
      const onDone = jest.fn();
      // Should not throw on parse error
      await analyzeRequirement('test', { onThinking, onDone });
      // onThinking may or may not be called depending on parse failure
      expect(onDone).toHaveBeenCalledWith('p1', 'ok');
    });

    it('merges external AbortSignal with internal timeout', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ projectId: 'p1', summary: 'ok' })}\n\n`));
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

      const controller = new AbortController();
      await analyzeRequirement('test', { signal: controller.signal });

      // Should complete successfully
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
