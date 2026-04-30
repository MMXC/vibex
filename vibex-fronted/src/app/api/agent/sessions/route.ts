/**
 * GET /api/agent/sessions — list sessions from server-side store
 * POST /api/agent/sessions — create a new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessions, createAgentSession } from '@/server/agentSessionStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessions = getSessions();
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { task?: string };

    if (!body.task || typeof body.task !== 'string' || body.task.trim() === '') {
      return NextResponse.json({ error: 'task is required' }, { status: 400 });
    }

    const sessionKey = createAgentSession(body.task.trim());

    return NextResponse.json({ sessionKey }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
