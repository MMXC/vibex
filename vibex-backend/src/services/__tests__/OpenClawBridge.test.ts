/**
 * OpenClawBridge.test.ts — OpenClawBridge unit tests (P006)
 *
 * Tests spawnAgent URL construction, error handling, and isRuntimeUnavailable.
 * Uses jest.mock + jest.spyOn to stub global fetch.
 *
 * Run: pnpm exec jest src/services/__tests__/OpenClawBridge.test.ts --no-coverage
 */

// Store original fetch
const originalFetch = global.fetch;

beforeEach(() => {
  jest.restoreAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('spawnAgent', () => {
  let spawnAgent: (...args: unknown[]) => Promise<unknown>;
  let isRuntimeUnavailable: (...args: unknown[]) => boolean;

  beforeEach(async () => {
    jest.resetModules();
    global.fetch = jest.fn();
    const bridge = await import('../OpenClawBridge');
    spawnAgent = bridge.spawnAgent;
    isRuntimeUnavailable = bridge.isRuntimeUnavailable;
  });

  it('calls the correct URL with correct payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ sessionKey: 'sk-123' }),
    });

    const result = await spawnAgent({
      task: 'Build a login form',
      context: { projectId: 'p1' },
      sessionId: 'session-abc',
    }) as { sessionKey: string; status: string; createdAt: string };

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:18789/api/sessions/spawn',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-OpenClaw-Session-Id': 'session-abc',
        }),
        body: JSON.stringify({
          task: 'Build a login form',
          context: { projectId: 'p1' },
          runtime: 'subagent',
          timeoutSeconds: 30,
        }),
        signal: expect.any(AbortSignal),
      })
    );

    expect(result.sessionKey).toBe('sk-123');
    expect(result.status).toBe('spawned');
  });

  it('uses OPENCLAW_GATEWAY_URL env var when set', async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, OPENCLAW_GATEWAY_URL: 'http://custom:9999' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ sessionKey: 'sk-456' }),
    });

    jest.resetModules();
    const bridge = await import('../OpenClawBridge');
    spawnAgent = bridge.spawnAgent;

    await spawnAgent({ task: 'test', sessionId: 's1' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://custom:9999/api/sessions/spawn',
      expect.any(Object)
    );

    process.env = originalEnv;
  });

  it('falls back to sessionId when response has no sessionKey', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const result = await spawnAgent({ task: 'test', sessionId: 'fallback-id' }) as { sessionKey: string };
    expect(result.sessionKey).toBe('fallback-id');
  });

  it('throws when gateway returns non-OK', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    await expect(spawnAgent({ task: 'test', sessionId: 's1' })).rejects.toThrow(
      'OpenClaw gateway error: HTTP 500'
    );
  });

  it('throws TimeoutError when fetch aborts', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => {
      const err = new Error('The user aborted a request.');
      (err as unknown as { name: string }).name = 'AbortError';
      throw err;
    });

    await expect(spawnAgent({ task: 'test', sessionId: 's1' })).rejects.toMatchObject({
      name: 'TimeoutError',
      message: expect.stringContaining('timeout'),
    });
  });

  it('re-throws generic errors as-is', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => {
      throw new Error('ENOTFOUND');
    });

    await expect(spawnAgent({ task: 'test', sessionId: 's1' })).rejects.toThrow('ENOTFOUND');
  });
});

describe('isRuntimeUnavailable', () => {
  let isRuntimeUnavailable: (err: unknown) => boolean;

  beforeEach(async () => {
    jest.resetModules();
    const bridge = await import('../OpenClawBridge');
    isRuntimeUnavailable = bridge.isRuntimeUnavailable;
  });

  it('returns true for ECONNREFUSED errors', () => {
    expect(isRuntimeUnavailable(new Error('ECONNREFUSED 127.0.0.1:18789'))).toBe(true);
  });

  it('returns true for "connection refused" (lowercase)', () => {
    expect(isRuntimeUnavailable(new Error('connection refused'))).toBe(true);
  });

  it('returns true for "connect ECONNREFUSED"', () => {
    expect(isRuntimeUnavailable(new Error('connect ECONNREFUSED 127.0.0.1:9999'))).toBe(true);
  });

  it('returns true for "fetch failed"', () => {
    expect(isRuntimeUnavailable(new Error('fetch failed'))).toBe(true);
  });

  it('returns true for "service unavailable"', () => {
    expect(isRuntimeUnavailable(new Error('service unavailable'))).toBe(true);
  });

  it('returns true for AbortError', () => {
    const err = new Error('aborted');
    (err as unknown as { name: string }).name = 'AbortError';
    expect(isRuntimeUnavailable(err)).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isRuntimeUnavailable(new Error('something went wrong'))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isRuntimeUnavailable(null)).toBe(false);
    expect(isRuntimeUnavailable(undefined)).toBe(false);
  });

  it('returns false for non-Error objects', () => {
    expect(isRuntimeUnavailable('ECONNREFUSED')).toBe(false);
    expect(isRuntimeUnavailable({ message: 'ECONNREFUSED' })).toBe(false);
  });
});