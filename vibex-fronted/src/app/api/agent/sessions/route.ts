/**
 * GET /api/agent/sessions — list sessions (proxies to vibex-backend)
 * POST /api/agent/sessions — create a new session (proxies to vibex-backend)
 */

import { NextRequest, NextResponse } from 'next/server';
import { useAgentStore } from '@/stores/agentStore';

const BACKEND_URL = process.env.VIBEX_BACKEND_URL ?? 'http://localhost:3000';

export const dynamic = 'force-dynamic';

function mapBackendStatus(s: string): 'idle' | 'starting' | 'running' | 'complete' | 'error' | 'terminated' {
  switch (s) {
    case 'starting': return 'starting';
    case 'running': return 'running';
    case 'complete': return 'complete';
    case 'terminated': return 'terminated';
    case 'error': return 'error';
    default: return 'idle';
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/agent/sessions`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: res.status });
    }

    const data = await res.json() as { sessions: Array<{ sessionKey: string; task: string; status: string; createdAt: number }> };

    // Sync into Zustand store
    const store = useAgentStore.getState();
    for (const s of data.sessions ?? []) {
      const existing = store.sessions.find((x) => x.sessionKey === s.sessionKey);
      if (!existing) {
        store.addSession({
          sessionKey: s.sessionKey,
          task: s.task,
          status: mapBackendStatus(s.status),
          createdAt: s.createdAt,
          messages: [],
        });
      }
    }

    return NextResponse.json({ sessions: data.sessions });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { task?: string };

    if (!body.task || typeof body.task !== 'string' || body.task.trim() === '') {
      return NextResponse.json({ error: 'task is required' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/agent/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: body.task.trim() }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Spawn failed' }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json() as { sessionKey: string; status: string; createdAt: string };

    // Store in Zustand
    const store = useAgentStore.getState();
    store.addSession({
      sessionKey: data.sessionKey,
      task: body.task.trim(),
      status: mapBackendStatus(data.status),
      createdAt: new Date(data.createdAt).getTime(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: body.task.trim(),
          timestamp: Date.now(),
          codeBlocks: [],
        },
      ],
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Spawn failed';
    return NextResponse.json({ error: msg, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}