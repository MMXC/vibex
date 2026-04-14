/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * Analytics API — v1 REST Routes
 *
 * E2-S1:  GET /api/v1/health  — returns latency P50/P95/P99 (no DB, no auth)
 * E3-S3: POST /api/v1/analytics — accepts analytics events with 7-day TTL
 *
 * Endpoints:
 * GET  /api/v1/health        — latency stats (public, no auth, no DB)
 * POST /api/v1/analytics     — ingest analytics events (public, no auth)
 * GET  /api/v1/analytics     — query analytics (protected, E3-S3 scope)
 */

import { Hono } from 'hono';
import { queryDB, executeDB, generateId, Env } from '@/lib/db';
import { metricsStore, type LatencyStats } from '@/middleware/metrics';
import { safeError } from '@/lib/log-sanitizer';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const analytics = new Hono<{ Bindings: Env }>();

// ============================================================
// GET /api/v1/health — latency stats (public, no DB, <50ms)
// ============================================================

analytics.get('/health', (c) => {
  const stats: LatencyStats = metricsStore.getStats();

  return c.json({
    status: 'healthy',
    latency: {
      p50: stats.p50,
      p95: stats.p95,
      p99: stats.p99,
      window: stats.window,
      sampleCount: stats.sampleCount,
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// POST /api/v1/analytics — ingest events (public, E3-S3 scope)
// ============================================================

// Simple schema validation without zod to keep deps light
interface AnalyticsEvent {
  event: string;
  sessionId?: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

analytics.post('/', async (c) => {
  try {
    const env = c.env;
    const body = await c.req.json();
    const events: AnalyticsEvent[] = Array.isArray(body) ? body : [body];

    if (!Array.isArray(events) || events.length === 0) {
      return         c.json(apiError('events array required', ERROR_CODES.BAD_REQUEST), 400);
    }

    const ids: string[] = [];
    const now = Date.now();
    // E2-S3: 7-day expiry
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    for (const event of events) {
      if (!event.event || typeof event.event !== 'string') {
        return         c.json(apiError('event.name required', ERROR_CODES.BAD_REQUEST), 400);
      }

      const id = generateId();
      ids.push(id);

      await executeDB(
        env,
        `INSERT INTO analytics_events (id, event, session_id, user_id, properties, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          event.event,
          event.sessionId ?? null,
          event.userId ?? null, // no PII — userId only if provided
          JSON.stringify(event.properties ?? {}),
          event.timestamp ?? now,
          expiresAt,
        ]
      );
    }

    // E2-S3: async cleanup of expired events (best-effort, non-blocking)
    cleanupExpiredEvents(env).catch(() => {/* swallow — non-critical */});

    return c.json({ received: ids.length, ids });
  } catch (err) {
    safeError('[analytics] POST error:', err);
    return         c.json(apiError('Internal server error', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================================
// GET /api/v1/analytics — query events (protected, E3-S3)
// ============================================================

analytics.get('/', async (c) => {
  try {
    const env = c.env;
    const event = c.req.query('event');
    const limit = Math.min(1000, Math.max(1, parseInt(c.req.query('limit') ?? '100', 10)));

    let whereClause = 'WHERE expires_at > ?';
    const params: (string | number)[] = [Date.now()];

    if (event) {
      whereClause += ' AND event = ?';
      params.push(event);
    }

    const rows = await queryDB<{
      id: string;
      event: string;
      session_id: string | null;
      user_id: string | null;
      properties: string;
      created_at: number;
      expires_at: number;
    }>(env, `SELECT * FROM analytics_events ${whereClause} ORDER BY created_at DESC LIMIT ?`, [
      ...params,
      limit,
    ]);

    return c.json({
      events: rows.map((r) => ({
        id: r.id,
        event: r.event,
        sessionId: r.session_id,
        userId: r.user_id,
        properties: JSON.parse(r.properties ?? '{}'),
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      })),
      count: rows.length,
    });
  } catch (err) {
    safeError('[analytics] GET error:', err);
    return         c.json(apiError('Internal server error', ERROR_CODES.INTERNAL_ERROR), 500);
  }
});

// ============================================================
// Internal: cleanup expired events (E2-S3)
// ============================================================

async function cleanupExpiredEvents(env: Env): Promise<void> {
  const now = Date.now();
  await executeDB(env, 'DELETE FROM analytics_events WHERE expires_at < ?', [now]);
}

export default analytics;
