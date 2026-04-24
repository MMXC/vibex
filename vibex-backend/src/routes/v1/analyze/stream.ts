/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * Analyze Stream API - SSE Streaming Endpoint
 * GET /v1/analyze/stream?requirement=xxx
 *
 * Streams a step-by-step requirement analysis via Server-Sent Events.
 * Emits 7 event types in order:
 *   thinking → step_context → step_model → step_flow → step_components → done (or error)
 *
 * Uses the shared buildSSEStream builder (route consolidation):
 * - 10s AI-call timeout via AbortController
 * - Client-disconnect abort via request.signal
 * - 30s hard Response timeout
 *
 * Ported from: src/app/api/v1/analyze/stream/route.ts (Next.js → Hono)
 *
 * @module routes/v1/analyze/stream
 */

import { Hono } from 'hono';
import { CloudflareEnv } from '../../../lib/env';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const stream_ = new Hono<{ Bindings: CloudflareEnv }>();

stream_.get('/', async (c) => {
  const requirement = c.req.query('requirement');

  if (!requirement || requirement.trim().length === 0) {
    return         c.json(apiError('requirement query parameter is required', ERROR_CODES.BAD_REQUEST), 400);
  }

  const env = c.env as CloudflareEnv;

  // Dynamically import to avoid circular dependency issues
  const { buildSSEStream } = await import('../../../lib/sse-stream-lib');

  // Wire client-disconnect abort signal; buildSSEStream adds 10s AI-call timeout internally.
  const stream = buildSSEStream({ requirement, env, requestSignal: c.req.raw.signal });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
    // @ts-expect-error timeout is a Cloudflare Workers Response extension
    timeout: 30_000,
  });
});

export default stream_;
