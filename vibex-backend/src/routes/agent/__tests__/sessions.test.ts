/**
 * sessions.test.ts — AI Agent Sessions API (P006)
 *
 * Tests the in-memory sessions store API routes.
 * spawnAgent is mocked to avoid real HTTP calls.
 *
 * Run: pnpm exec jest src/routes/agent/__tests__/sessions.test.ts --no-coverage
 */

import { Hono } from 'hono';
import sessionsRouter from '../sessions';

// ── Mock OpenClawBridge before importing sessions ────────────────────────────
jest.mock('@/services/OpenClawBridge', () => ({
  spawnAgent: jest.fn().mockResolvedValue({
    sessionKey: 'mock-session-key',
    status: 'spawned',
    createdAt: '2026-01-01T00:00:00Z',
  }),
  isRuntimeUnavailable: jest.fn().mockReturnValue(false),
}));

const buildApp = () => {
  const app = new Hono();
  return app.route('/api/agent/sessions', sessionsRouter);
};

const validBody = { task: 'Write a hello world function' };

// ── POST /api/agent/sessions ─────────────────────────────────────────────────
describe('POST /api/agent/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 with sessionKey for valid task', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.sessionKey).toBeDefined();
    expect(data.sessionKey).toMatch(/^session-/);
    expect(data.status).toBe('starting');
    expect(data.createdAt).toBeDefined();
  });

  it('returns 400 with INVALID_TASK when task is missing', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.code).toBe('INVALID_TASK');
  });

  it('returns 400 with INVALID_TASK when task is null', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: null }),
    });
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('INVALID_TASK');
  });

  it('returns 400 with INVALID_TASK when task is empty string', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: '' }),
    });
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('INVALID_TASK');
  });

  it('returns 400 with INVALID_TASK when task is whitespace-only', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: '   ' }),
    });
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('INVALID_TASK');
  });

  it('calls spawnAgent with correct payload', async () => {
    const { spawnAgent } = jest.requireMock('@/services/OpenClawBridge') as {
      spawnAgent: jest.Mock;
    };
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'Do something', context: { projectId: 'p1' } }),
    });
    await app.fetch(req);

    expect(spawnAgent).toHaveBeenCalledTimes(1);
    expect(spawnAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        task: 'Do something',
        context: { projectId: 'p1' },
        sessionId: expect.stringMatching(/^session-/),
      })
    );
  });
});

// ── GET /api/agent/sessions ───────────────────────────────────────────────────
describe('GET /api/agent/sessions', () => {
  it('returns 200 with sessions array (empty initially)', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions');
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('sessions');
    expect(Array.isArray(data.sessions)).toBe(true);
  });
});

// ── GET /api/agent/sessions/:id ─────────────────────────────────────────────
describe('GET /api/agent/sessions/:id', () => {
  it('returns 200 with session data when session exists', async () => {
    const app = buildApp();

    // Create a session first
    const createReq = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const createRes = await app.fetch(createReq);
    const { sessionKey } = await createRes.json() as { sessionKey: string };

    // Fetch it
    const getReq = new Request(`http://localhost/api/agent/sessions/${sessionKey}`);
    const getRes = await app.fetch(getReq);
    const data = await getRes.json();

    // Note: mock spawnAgent resolves immediately, updating sessionKey to 'mock-session-key'
    expect(getRes.status).toBe(200);
    expect(data.sessionKey).toBeDefined();
    expect(data.task).toBe(validBody.task);
    expect(data.status).toBeDefined();
    expect(data.messages).toBeDefined();
  });

  it('returns 404 when session not found', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions/nonexistent-id');
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe('SESSION_NOT_FOUND');
  });
});

// ── GET /api/agent/sessions/:id/status ────────────────────────────────────────
describe('GET /api/agent/sessions/:id/status', () => {
  it('returns 200 with status field when session exists', async () => {
    const app = buildApp();

    // Create a session first
    const createReq = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const createRes = await app.fetch(createReq);
    const { sessionKey } = await createRes.json() as { sessionKey: string };

    // Get status
    const statusReq = new Request(`http://localhost/api/agent/sessions/${sessionKey}/status`);
    const statusRes = await app.fetch(statusReq);
    const data = await statusRes.json();

    expect(statusRes.status).toBe(200);
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('sessionKey'); // value updated to mock-session-key after spawnAgent resolves
  });

  it('returns 404 when session not found', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions/nonexistent-id/status');
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe('SESSION_NOT_FOUND');
  });
});

// ── DELETE /api/agent/sessions/:id ──────────────────────────────────────────
describe('DELETE /api/agent/sessions/:id', () => {
  it('returns 204 when session is deleted', async () => {
    const app = buildApp();

    // Create a session
    const createReq = new Request('http://localhost/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const createRes = await app.fetch(createReq);
    const { sessionKey } = await createRes.json() as { sessionKey: string };

    // Delete it
    const deleteReq = new Request(`http://localhost/api/agent/sessions/${sessionKey}`, {
      method: 'DELETE',
    });
    const deleteRes = await app.fetch(deleteReq);

    expect(deleteRes.status).toBe(204);

    // Verify it's gone
    const getReq = new Request(`http://localhost/api/agent/sessions/${sessionKey}`);
    const getRes = await app.fetch(getReq);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when session not found', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/agent/sessions/nonexistent-id', {
      method: 'DELETE',
    });
    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe('SESSION_NOT_FOUND');
  });
});