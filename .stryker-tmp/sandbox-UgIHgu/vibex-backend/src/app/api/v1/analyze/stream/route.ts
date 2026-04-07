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
// @ts-nocheck


import { NextRequest, NextResponse } from 'next/server';
import { buildSSEStream } from '@/lib/sse-stream-lib';
import { getLocalEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requirement = searchParams.get('requirement');

  if (!requirement || requirement.trim().length === 0) {
    return NextResponse.json(
      { error: 'requirement query parameter is required' },
      { status: 400 }
    );
  }

  const env = getLocalEnv();
  const stream = buildSSEStream({ requirement, env });

  return new Response(stream, {
    headers: {
      'X-Bounded-Test': 'DEPLOYED_V2',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
