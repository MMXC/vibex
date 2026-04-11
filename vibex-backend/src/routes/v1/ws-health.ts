/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 */
/**
 * WebSocket Health Endpoint
 * E2-S3: Health check for WebSocket connection pool
 * GET /api/v1/ws/health
 * Returns: { activeConnections, maxConnections, uptime, timestamp }
 */

import { Hono } from 'hono';
import { getConnectionPool } from '@/services/websocket/connectionPool';

const wsHealth = new Hono();

wsHealth.get('/health', (c) => {
  const pool = getConnectionPool();

  return c.json({
    activeConnections: pool.getSize(),
    maxConnections: 100, // MAX_CONNECTIONS constant
    uptime: Math.floor(process.uptime?.() ?? 0),
    timestamp: new Date().toISOString(),
  });
});

export default wsHealth;
