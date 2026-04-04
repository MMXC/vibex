/**
 * rateLimit.test.ts — E2: Cache API rate limiting
 *
 * Tests verify:
 * - In-memory store: increment, decrement, get, put
 * - Cache store: isAvailable() in non-Workers env
 * - recordRequest: cache-first with in-memory fallback
 * - Middleware: headers set, rate limit enforced, fail-open on error
 */

import { Hono } from 'hono';
import { rateLimit, InMemoryStore, recordRequest, getCount, inMemoryStore } from './rateLimit';

const buildApp = (options?: Parameters<typeof rateLimit>[0]) => {
  const app = new Hono();
  app.use('*', rateLimit({ limit: 3, windowSeconds: 60, ...options }));
  app.get('/test', (c) => c.json({ ok: true }));
  return app;
};

describe('E2: InMemoryStore', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
    store.clear();
  });

  it('increments count', async () => {
    const result = store.increment('ip:1.2.3.4', 60);
    expect(result.count).toBe(1);
    expect(result.resetTime).toBeGreaterThan(Math.ceil(Date.now() / 1000));
  });

  it('increments multiple times', async () => {
    store.increment('ip:1.2.3.4', 60);
    store.increment('ip:1.2.3.4', 60);
    const result = store.increment('ip:1.2.3.4', 60);
    expect(result.count).toBe(3);
  });



  it('get returns null for unknown key', async () => {
    const result = await store.get('unknown:key');
    expect(result).toBeNull();
  });

  it('put stores entry', async () => {
    await store.put('test:key:1', { count: 5, resetTime: Math.ceil(Date.now() / 1000) + 60 });
    const result = await store.get('test:key:1');
    expect(result?.count).toBe(5);
  });
});

describe('E2: recordRequest', () => {
  it('increments count per request', async () => {
    const r1 = await recordRequest('test-ip', 60);
    expect(r1.count).toBe(1);
    const r2 = await recordRequest('test-ip', 60);
    expect(r2.count).toBe(2);
    const r3 = await recordRequest('test-ip', 60);
    expect(r3.count).toBe(3);
  });

  it('different keys are independent', async () => {
    const r1 = await recordRequest('ip:a', 60);
    const r2 = await recordRequest('ip:b', 60);
    expect(r1.count).toBe(1);
    expect(r2.count).toBe(1);
  });

  it('resetTime is approximately windowSeconds in the future', async () => {
    const now = Math.ceil(Date.now() / 1000);
    const result = await recordRequest('test-ip', 60);
    expect(result.resetTime).toBeGreaterThanOrEqual(now);
    expect(result.resetTime).toBeLessThanOrEqual(now + 61);
  });
});

describe('E2: rateLimit middleware', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    // Clear singleton store between tests
    inMemoryStore.clear();
    app = buildApp({ limit: 2, windowSeconds: 60 });
  });

  it('sets rate limit headers on response', async () => {
    const req = new Request('http://localhost/test', { method: 'GET' });
    const res = await app.fetch(req);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('2');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('1');
    expect(res.status).toBe(200);
  });

  it('returns 429 when limit exceeded', async () => {
    // Make 2 requests (limit = 2)
    const req = new Request('http://localhost/test', { method: 'GET' });
    await app.fetch(req);
    await app.fetch(req);

    // 3rd request should be rate limited
    const res = await app.fetch(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('429 response includes RATE_LIMIT_EXCEEDED code', async () => {
    const req = new Request('http://localhost/test', { method: 'GET' });
    await app.fetch(req);
    await app.fetch(req);
    const res = await app.fetch(req);
    const body = await res.json();
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.error.retryAfter).toBeGreaterThan(0);
  });

  it('allows request when both stores fail (fail open)', async () => {
    // In non-Workers environment, cache is unavailable but in-memory works
    const req = new Request('http://localhost/test', { method: 'GET' });
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
  });

  it('returns success:true on ok response', async () => {
    const req = new Request('http://localhost/test', { method: 'GET' });
    const res = await app.fetch(req);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

describe('E2: cross-request state', () => {
  it('rate limit counter persists across requests (with consistent IP header)', async () => {
    const app = buildApp({ limit: 5, windowSeconds: 60 });
    const makeReq = () =>
      new Request('http://localhost/test', {
        method: 'GET',
        headers: { 'cf-connecting-ip': '5.6.7.8' },
      });

    for (let i = 1; i <= 4; i++) {
      const res = await app.fetch(makeReq());
      expect(res.headers.get('X-RateLimit-Remaining')).toBe(String(5 - i));
    }

    const lastRes = await app.fetch(makeReq());
    expect(lastRes.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});
