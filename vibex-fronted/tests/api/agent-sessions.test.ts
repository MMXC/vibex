/**
 * agent-sessions.test.ts — Frontend Agent Sessions Route (P006)
 *
 * Tests the Next.js App Router handler that proxies to vibex-backend.
 * Mocks fetch and the agentStore to avoid real network and state calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock agentStore ──────────────────────────────────────────────────────────
const mockAddSession = vi.fn();
const mockUseAgentStore = {
  getState: vi.fn(() => ({
    sessions: [],
    addSession: mockAddSession,
  })),
};

vi.mock('@/stores/agentStore', () => ({
  useAgentStore: mockUseAgentStore,
}));

// ── Helper: build mock fetch that records calls ───────────────────────────────
const recordedCalls: Array<{ url: string; options?: RequestInit }> = [];
let mockFetchResponse: Response | null = null;
let mockFetchStatus = 200;
let mockFetchBody: unknown = { sessionKey: 'frontend-session-1', status: 'starting', createdAt: '2026-01-01T00:00:00Z' };
let mockFetchHeaders: Record<string, string> = { 'content-type': 'application/json' };

function buildMockFetch() {
  recordedCalls.length = 0;
  return vi.fn(async (url: string, options?: RequestInit) => {
    recordedCalls.push({ url, options });
    const body = typeof mockFetchBody === 'string' ? mockFetchBody : JSON.stringify(mockFetchBody);
    return {
      ok: mockFetchStatus >= 200 && mockFetchStatus < 300,
      status: mockFetchStatus,
      headers: { get: (k: string) => mockFetchHeaders[k] },
      json: () => Promise.resolve(mockFetchBody),
      text: () => Promise.resolve(typeof mockFetchBody === 'string' ? mockFetchBody : JSON.stringify(mockFetchBody)),
    } as unknown as Response;
  });
}

// Use a module-level fetch mock so GET/POST handler can both use it
let globalFetchMock: ReturnType<typeof vi.fn>;
globalFetchMock = buildMockFetch();
global.fetch = globalFetchMock;

// ── Re-import route handlers so they pick up the mocks ──────────────────────
vi.resetModules();

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/agent/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalFetchMock = buildMockFetch();
    global.fetch = globalFetchMock;
    mockFetchStatus = 200;
    mockFetchBody = { sessions: [] };
    mockFetchHeaders = { 'content-type': 'application/json' };
    // Reset store state
    mockUseAgentStore.getState.mockReturnValueOnce({
      sessions: [],
      addSession: mockAddSession,
    });
  });

  it('returns 200 with sessions from backend', async () => {
    const { GET } = await import('@/app/api/agent/sessions/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('sessions');
    expect(Array.isArray(data.sessions)).toBe(true);
  });

  it('proxies to correct backend URL', async () => {
    const { GET } = await import('@/app/api/agent/sessions/route');
    await GET();

    const call = recordedCalls.find((c) => c.options?.method === undefined || !c.options.method);
    expect(call?.url).toMatch(/\/api\/agent\/sessions$/);
  });

  it('returns 503 when backend is unavailable', async () => {
    globalFetchMock.mockRejectedValueOnce(new Error('Network failure'));
    const { GET } = await import('@/app/api/agent/sessions/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.error).toBeDefined();
  });

  it('returns backend error status when backend returns non-OK', async () => {
    mockFetchStatus = 500;
    mockFetchBody = { error: 'Internal error' };
    const { GET } = await import('@/app/api/agent/sessions/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to fetch sessions');
  });
});

describe('POST /api/agent/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalFetchMock = buildMockFetch();
    global.fetch = globalFetchMock;
    mockFetchStatus = 201;
    mockFetchBody = { sessionKey: 'session-abc', status: 'starting', createdAt: '2026-01-01T00:00:00Z' };
    mockFetchHeaders = { 'content-type': 'application/json' };
    mockAddSession.mockClear();
    mockUseAgentStore.getState.mockReturnValue({
      sessions: [],
      addSession: mockAddSession,
    });
  });

  it('returns 201 with sessionKey for valid task', async () => {
    const { POST } = await import('@/app/api/agent/sessions/route');
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'Build a form' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.sessionKey).toBe('session-abc');
    expect(data.status).toBe('starting');
  });

  it('calls backend with correct payload', async () => {
    const { POST } = await import('@/app/api/agent/sessions/route');
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'Test task' }),
    });
    await POST(req);

    const postCall = recordedCalls.find((c) => c.options?.method === 'POST');
    expect(postCall).toBeDefined();
    expect(postCall?.url).toMatch(/\/api\/agent\/sessions$/);
    const body = JSON.parse(postCall?.options?.body as string);
    expect(body.task).toBe('Test task');
  });

  it('trims whitespace from task', async () => {
    const { POST } = await import('@/app/api/agent/sessions/route');
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: '  Build something  ' }),
    });
    await POST(req);

    const postCall = recordedCalls.find((c) => c.options?.method === 'POST');
    const body = JSON.parse(postCall?.options?.body as string);
    expect(body.task).toBe('Build something');
  });

  it('returns 400 when task is missing', async () => {
    const { POST } = await import('@/app/api/agent/sessions/route');
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('task is required');
  });

  it('returns 400 when task is empty string', async () => {
    const { POST } = await import('@/app/api/agent/sessions/route');
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: '' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when task is whitespace-only', async () => {
    const { POST } = await import('@/app/api/agent/sessions/route');
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: '   ' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('adds session to agentStore after successful spawn', async () => {
    const { POST } = await import('@/app/api/agent/sessions/route');
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'Build a login page' }),
    });
    await POST(req);

    expect(mockAddSession).toHaveBeenCalledTimes(1);
    expect(mockAddSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionKey: 'session-abc',
        task: 'Build a login page',
        status: 'starting',
      })
    );
  });

  it('returns 500 when backend returns error', async () => {
    mockFetchStatus = 500;
    mockFetchBody = { error: 'RUNTIME_UNAVAILABLE' };
    const { POST } = await import('@/app/api/agent/sessions/route');
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'test' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(mockAddSession).not.toHaveBeenCalled();
  });
});