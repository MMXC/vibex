/**
 * Analyze Stream API - SSE Streaming Endpoint
 * GET /api/v1/analyze/stream?requirement=xxx
 *
 * Streams a step-by-step requirement analysis via Server-Sent Events.
 * Emits 7 event types in order:
 *   thinking → step_context → step_model → step_flow → step_components → done (or error)
 *
 * Business logic shared via lib/sse-stream-lib/index.ts
 *
 * @module app/api/v1/analyze/stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildSSEStream } from '@/lib/sse-stream-lib';
import { getLocalEnv } from '@/lib/env';
import jwt from 'jsonwebtoken';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

export const dynamic = 'force-dynamic';

// Auth helper
function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { auth: null, error: 'Unauthorized: authentication required' };
  }
  const token = authHeader.substring(7);
  try {
    const auth = getAuthUserFromRequest(request);
    return { auth, error: null };
  } catch {
    return { auth: null, error: 'Invalid or expired token' };
  }
}

export async function GET(request: NextRequest) {
  // E1: Authentication check
  const { auth, error } = checkAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error, code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requirement = searchParams.get('requirement');

  if (!requirement || requirement.trim().length === 0) {
    return NextResponse.json(
      { error: 'requirement query parameter is required' },
      { status: 400 }
    );
  }

  const env = getLocalEnv();
  const stream = buildSSEStream({ requirement, env, requestSignal: request.signal });

  return new Response(stream, {
    headers: {
      'X-Bounded-Test': 'DEPLOYED_V2',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
    // @ts-expect-error timeout is a Cloudflare Workers Response extension
    // Hard timeout: if stream doesn't complete within 30s, terminate the Worker.
    // Combined with the built-in 10s AI-call timeout inside buildSSEStream,
    // this ensures resources are always released even on catastrophic failures.
    timeout: 30_000,
  });
}
