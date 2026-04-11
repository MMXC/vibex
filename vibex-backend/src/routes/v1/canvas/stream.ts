/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * Canvas Stream API - SSE Streaming Endpoint (Hono Version)
 * GET /v1/canvas/stream?requirement=xxx
 *
 * Ported from: src/app/api/v1/canvas/stream/route.ts (Next.js → Hono)
 *
 * Canvas-specific SSE streaming endpoint, publicly accessible.
 * Emits 7 event types in order:
 *   thinking → step_context → step_model → step_flow → step_components → done (or error)
 *
 * @module routes/v1/canvas/stream
 */

import { Hono } from 'hono';
import { CloudflareEnv } from '../../../lib/env';

const canvasStream = new Hono<{ Bindings: CloudflareEnv }>();

canvasStream.get('/', async (c) => {
  const requirement = c.req.query('requirement');

  if (!requirement || requirement.trim().length === 0) {
    return c.json(
      { error: 'requirement query parameter is required' },
      { status: 400 }
    );
  }

  const env = c.env as CloudflareEnv;

  // Dynamically import to avoid circular dependency issues
  const { buildSSEStream } = await import('../../../lib/sse-stream-lib');

  // Wire client-disconnect abort signal so the stream closes promptly when
  // the client drops the connection. The built-in 10s AI-call timeout within
  // buildSSEStream handles the other failure mode.
  const stream = buildSSEStream({ requirement, env, requestSignal: c.req.raw.signal });

  // @ts-expect-error timeout is a Cloudflare Workers Response extension
  return new Response(stream, {
    headers: {
      'X-Bounded-Test': 'DEPLOYED_V2',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
    timeout: 30_000,
  });
});

export default canvasStream;
