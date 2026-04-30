/**
 * agent/sessions.ts — AI Agent Sessions API
 *
 * REST API for managing AI coding agent sessions.
 * Spawns real OpenClaw subagents via OpenClawBridge.
 *
 * Routes:
 *   POST   /api/agent/sessions        — create new session (spawns agent)
 *   GET    /api/agent/sessions        — list sessions
 *   GET    /api/agent/sessions/:id    — get session detail (status + messages)
 *   GET    /api/agent/sessions/:id/status — get session status
 *   DELETE /api/agent/sessions/:id    — terminate/delete session
 */

import { Hono } from 'hono';
import { spawnAgent, isRuntimeUnavailable } from '@/services/OpenClawBridge';

const agent = new Hono();

// In-memory session store (MVP — replace with DB/Redis in future)
interface SessionRecord {
  sessionKey: string;
  task: string;
  status: 'idle' | 'starting' | 'running' | 'complete' | 'error' | 'terminated';
  createdAt: number;
  updatedAt: number;
  messages: unknown[];
  error?: string;
}

const sessionStore = new Map<string, SessionRecord>();

// ── POST /api/agent/sessions ──────────────────────────────────────
agent.post('/', async (c) => {
  const body = await c.req.json<{ task?: string; context?: Record<string, unknown> }>();

  if (!body.task || typeof body.task !== 'string' || body.task.trim() === '') {
    return c.json(
      { error: 'task is required and must be a non-empty string', code: 'INVALID_TASK' },
      400,
      { 'Content-Type': 'application/json' }
    );
  }

  const task = body.task.trim();
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Pre-store session as starting
  const record: SessionRecord = {
    sessionKey: sessionId,
    task,
    status: 'starting',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: task,
        timestamp: Date.now(),
      },
    ],
  };
  sessionStore.set(sessionId, record);

  // Spawn agent (non-blocking for now — real async handling future)
  spawnAgent({ task, context: body.context, sessionId })
    .then((result) => {
      record.sessionKey = result.sessionKey;
      record.status = 'running';
      record.updatedAt = Date.now();
    })
    .catch((err) => {
      if (isRuntimeUnavailable(err)) {
        record.status = 'error';
        record.error = 'RUNTIME_UNAVAILABLE';
      } else {
        record.status = 'error';
        record.error = err instanceof Error ? err.message : String(err);
      }
      record.updatedAt = Date.now();
    });

  return c.json(
    { sessionKey: sessionId, status: 'starting', createdAt: new Date().toISOString() },
    201,
    { 'Content-Type': 'application/json' }
  );
});

// ── GET /api/agent/sessions ─────────────────────────────────────
agent.get('/', async (c) => {
  const sessions = Array.from(sessionStore.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  return c.json(
    {
      sessions: sessions.map((s) => ({
        sessionKey: s.sessionKey,
        task: s.task,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        error: s.error,
      })),
    },
    200,
    { 'Content-Type': 'application/json' }
  );
});

// ── GET /api/agent/sessions/:id ──────────────────────────────────
agent.get('/:id', async (c) => {
  const id = c.req.param('id');
  const record = sessionStore.get(id);

  if (!record) {
    return c.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      404,
      { 'Content-Type': 'application/json' }
    );
  }

  return c.json(
    {
      sessionKey: record.sessionKey,
      task: record.task,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      messages: record.messages,
      error: record.error,
    },
    200,
    { 'Content-Type': 'application/json' }
  );
});

// ── GET /api/agent/sessions/:id/status ────────────────────────────
agent.get('/:id/status', async (c) => {
  const id = c.req.param('id');
  const record = sessionStore.get(id);

  if (!record) {
    return c.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      404,
      { 'Content-Type': 'application/json' }
    );
  }

  return c.json(
    {
      sessionKey: record.sessionKey,
      status: record.status,
      progress: record.status === 'running' ? 50 : record.status === 'complete' ? 100 : 0,
      result: null,
      error: record.error ?? null,
      updatedAt: record.updatedAt,
    },
    200,
    { 'Content-Type': 'application/json' }
  );
});

// ── DELETE /api/agent/sessions/:id ────────────────────────────────
agent.delete('/:id', async (c) => {
  const id = c.req.param('id');

  if (!sessionStore.has(id)) {
    return c.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      404,
      { 'Content-Type': 'application/json' }
    );
  }

  sessionStore.delete(id);
  return c.body(null, 204);
});

export default agent;