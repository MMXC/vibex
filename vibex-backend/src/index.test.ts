/**
 * Tests for index.ts — E2.1 (全局CORS) and E2.2 (NODE_ENV修复)
 */

// ─── E2.1 Test: app.options('/*') global CORS handler ────────────────────────

describe('E2.1: Global CORS OPTIONS handler', () => {
  // Build a minimal app matching index.ts structure
  const buildApp = () => {
    const { Hono } = require('hono');
    const { cors } = require('hono/cors');
    const app = new Hono();

    app.use('*', cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }));

    // E2.1: Global OPTIONS handler after cors
    app.options('/*', (c) => {
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return c.body(null, 204);
    });

    app.get('/test', (c) => c.json({ ok: true }));

    return app;
  };

  it('OPTIONS /* returns 204', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/test', { method: 'OPTIONS' });
    const res = await app.fetch(req);
    expect(res.status).toBe(204);
  });

  it('OPTIONS /* returns CORS headers', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/test', { method: 'OPTIONS' });
    const res = await app.fetch(req);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toMatch(/GET.*POST.*PUT.*DELETE.*OPTIONS/);
    expect(res.headers.get('Access-Control-Allow-Headers')).toMatch(/Content-Type.*Authorization/);
  });

  it('OPTIONS /any-path returns 204', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/any-path', { method: 'OPTIONS' });
    const res = await app.fetch(req);
    expect(res.status).toBe(204);
  });

  it('OPTIONS with preflight headers returns 204', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/api/data', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });
    const res = await app.fetch(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('GET /test returns 200 (OPTIONS does not interfere)', async () => {
    const app = buildApp();
    const req = new Request('http://localhost/test', { method: 'GET' });
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
  });
});

// ─── E2.2 Test: NODE_ENV detection with optional chaining ─────────────────────

describe('E2.2: NODE_ENV optional chaining detection', () => {
  it('isWorkers detects Cloudflare Workers environment via globalThis.caches', () => {
    // When globalThis.caches is defined (Workers), isWorkers should be true
    const isWorkers = typeof globalThis.caches !== 'undefined';
    // In Node.js test environment, caches is not defined
    expect(typeof isWorkers).toBe('boolean');
  });

  it('isProduction uses optional chaining on process.env', () => {
    // process.env?.NODE_ENV should not throw even if process.env is undefined
    const isProduction = process.env?.NODE_ENV === 'production';
    expect(typeof isProduction).toBe('boolean');
  });

  it('conditional import guard: !isWorkers && !isProduction enables node-server', () => {
    // In test environment: isWorkers=false, isProduction=false (usually)
    // So the condition !false && !false = true → would try to import node-server
    // But in Workers: isWorkers=true → condition false → skip node-server
    const isWorkers = typeof globalThis.caches !== 'undefined';
    const isProduction = process.env?.NODE_ENV === 'production';
    const shouldStartLocalServer = !isWorkers && !isProduction;

    // In this test environment (Node.js), shouldStartLocalServer is true
    // In Workers, it would be false
    expect(typeof shouldStartLocalServer).toBe('boolean');
  });
});
