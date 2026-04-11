/**
/**
 * @deprecated Legacy Cloudflare Workers route. Migrated to App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * Tests for Gateway CORS Preflight - E1-OPTIONS顺序调整
 *
 * Verifies that OPTIONS preflight requests to protected routes:
 * 1. Return 204 (not 401) — proving options() is registered before authMiddleware
 * 2. Include CORS headers
 */

import { Hono } from 'hono';
import { Next } from 'hono/context';
import * as fs from 'fs';
import * as path from 'path';

// ─── Mock authMiddleware ──────────────────────────────────────────────────────
// Auth middleware returns 401 for any request without a valid Bearer token
const mockAuthMiddleware = async (
  c: { req: { header: (name: string) => string | null }; json: (body: unknown, status?: number) => Response; env: { JWT_SECRET?: string } },
  next: Next
) => {
  const authHeader = c.req.header('Authorization');
  const jwtSecret = c.env?.JWT_SECRET;

  if (!jwtSecret) {
    return c.json({ success: false, error: 'JWT_SECRET not configured' }, 500);
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }
  return next();
};

// ─── Mock rateLimit ──────────────────────────────────────────────────────────
const mockRateLimit = async (_c: unknown, next: Next) => {
  await next();
};

// ─── Test helper: build a protected app matching gateway structure ──────────────
const buildProtectedApp = () => {
  const app = new Hono<{ Bindings: { JWT_SECRET?: string; DB: unknown } }>();

  // Simulate the fixed gateway.ts structure:
  // protected_.options BEFORE protected_.use('*', authMiddleware)
  app.options('/*', (c) => {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return c.body(null, 204);
  });

  app.use('*', mockRateLimit);
  app.use('*', mockAuthMiddleware);

  // A dummy protected route
  app.get('/projects', (c) => c.json({ projects: [] }));

  return app;
};

// ─── Mock env ────────────────────────────────────────────────────────────────
const mockEnv = {
  JWT_SECRET: 'test-secret',
  DB: {},
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('E1: OPTIONS handler order — protected_ routes', () => {
  let app: ReturnType<typeof buildProtectedApp>;

  beforeEach(() => {
    app = buildProtectedApp();
  });

  // ── Core E1 test: OPTIONS returns 204 (not 401) ──────────────────────────
  it('OPTIONS /projects returns 204, not 401', async () => {
    const req = new Request('http://localhost/v1/projects', { method: 'OPTIONS' });
    const res = await app.fetch(req, mockEnv);

    expect(res.status).toBe(204);
  });

  it('OPTIONS /projects returns CORS headers', async () => {
    const req = new Request('http://localhost/v1/projects', { method: 'OPTIONS' });
    const res = await app.fetch(req, mockEnv);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
  });

  it('OPTIONS /flows returns 204', async () => {
    const req = new Request('http://localhost/v1/flows', { method: 'OPTIONS' });
    const res = await app.fetch(req, mockEnv);

    expect(res.status).toBe(204);
  });

  it('OPTIONS with preflight headers returns 204', async () => {
    const req = new Request('http://localhost/v1/projects', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization, Content-Type',
      },
    });
    const res = await app.fetch(req, mockEnv);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  // ── Verify auth still works for actual requests ──────────────────────────
  it('GET /projects without Authorization returns 401', async () => {
    // Request to /projects (matches the registered route)
    const req = new Request('http://localhost/projects', { method: 'GET' });
    const res = await app.fetch(req, mockEnv);

    expect(res.status).toBe(401);
  });

  it('GET /projects with no auth returns 401 (auth fires, not bypassed by OPTIONS)', async () => {
    // OPTIONS returns 204 → GET returns 401 → proves auth is registered AFTER options
    const req = new Request('http://localhost/projects', { method: 'GET' });
    const res = await app.fetch(req, mockEnv);

    expect(res.status).toBe(401);
  });
});

describe('E1 acceptance: gateway.ts structure verification', () => {
  it('options registration line comes before use() in gateway.ts', () => {
    // Read the actual gateway.ts to verify the fix
    const gatewayPath = path.join(__dirname, '../gateway.ts');
    const content = fs.readFileSync(gatewayPath, 'utf-8');

    const lines = content.split('\n');

    // Find the protected_ block
    const protectedBlockStart = lines.findIndex(l => l.includes('const protected_ = new Hono'));
    expect(protectedBlockStart).toBeGreaterThan(-1);

    // Find protected_.options and protected_.use lines within the block
    const optionsLine = lines.findIndex((l, i) => i > protectedBlockStart && l.includes("protected_.options('/*'"));
    const useLine = lines.findIndex((l, i) => i > protectedBlockStart && l.includes("protected_.use('*', authMiddleware)"));

    expect(optionsLine).toBeGreaterThan(-1);
    expect(useLine).toBeGreaterThan(-1);

    // OPTIONS must come BEFORE authMiddleware
    expect(optionsLine).toBeLessThan(useLine);
  });
});
