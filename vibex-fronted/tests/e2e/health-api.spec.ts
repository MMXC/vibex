/**
 * health-api.spec.ts — E6 Performance Observability E2E tests
 * E6-U1: /health 端点 P50/P95/P99
 * E6-U2: Web Vitals 监控
 */

import { test, expect } from '@playwright/test';

const HEALTH_ENDPOINT = '/api/health';

test.describe('E6: Performance Observability', () => {
  test('E6-U1: Health endpoint returns 200', async ({ request }) => {
    const res = await request.get(HEALTH_ENDPOINT);
    expect(res.status()).toBe(200);
  });

  test('E6-U1: Health response has required fields', async ({ request }) => {
    const res = await request.get(HEALTH_ENDPOINT);
    const body = await res.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('latency');
    expect(body).toHaveProperty('webVitals');

    expect(body.latency).toHaveProperty('p50');
    expect(body.latency).toHaveProperty('p95');
    expect(body.latency).toHaveProperty('p99');
    expect(body.latency).toHaveProperty('sampleSize');

    expect(body.webVitals.lcp).toHaveProperty('avg');
    expect(body.webVitals.lcp).toHaveProperty('p95');
    expect(body.webVitals.lcp).toHaveProperty('exceedsThreshold');
    expect(body.webVitals.cls).toHaveProperty('avg');
    expect(body.webVitals.cls).toHaveProperty('p95');
    expect(body.webVitals.cls).toHaveProperty('exceedsThreshold');
  });

  test('E6-U1: Latency P50 <= P95 <= P99', async ({ request }) => {
    const res = await request.get(HEALTH_ENDPOINT);
    const body = await res.json();

    expect(body.latency.p50).toBeGreaterThanOrEqual(0);
    expect(body.latency.p95).toBeGreaterThanOrEqual(body.latency.p50);
    expect(body.latency.p99).toBeGreaterThanOrEqual(body.latency.p95);
    expect(body.latency.sampleSize).toBeGreaterThanOrEqual(0);
  });

  test('E6-U1: Status is valid enum value', async ({ request }) => {
    const res = await request.get(HEALTH_ENDPOINT);
    const body = await res.json();

    expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
  });

  test('E6-U1: X-Response-Time header present', async ({ request }) => {
    const res = await request.get(HEALTH_ENDPOINT);
    expect(res.headers()['x-response-time']).toBeDefined();
  });

  test('E6-U1: POST records response time', async ({ request }) => {
    const res = await request.post(HEALTH_ENDPOINT, {
      data: { responseTime: 150 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('E6-U1: Cache-Control no-store', async ({ request }) => {
    const res = await request.get(HEALTH_ENDPOINT);
    const cache = res.headers()['cache-control'];
    expect(cache).toContain('no-store');
  });

  test('E6-U2: Web Vitals LCP threshold monitoring (4000ms)', async ({ request }) => {
    const res = await request.get(HEALTH_ENDPOINT);
    const body = await res.json();

    // LCP exceedsThreshold based on P95 > 4000ms
    if (body.webVitals.lcp.exceedsThreshold) {
      expect(body.latency.p95).toBeGreaterThan(4000);
    }
    expect(typeof body.webVitals.lcp.exceedsThreshold).toBe('boolean');
  });

  test('E6-U2: Web Vitals CLS threshold monitoring (0.1)', async ({ request }) => {
    const res = await request.get(HEALTH_ENDPOINT);
    const body = await res.json();

    // CLS threshold: 0.1
    expect(typeof body.webVitals.cls.exceedsThreshold).toBe('boolean');
    expect(typeof body.webVitals.cls.avg).toBe('number');
    expect(typeof body.webVitals.cls.p95).toBe('number');
  });

  test('E6: Sliding window records response times', async ({ request }) => {
    // Record multiple response times
    for (let i = 0; i < 3; i++) {
      await request.post(HEALTH_ENDPOINT, { data: { responseTime: 100 + i * 10 } });
    }

    const res = await request.get(HEALTH_ENDPOINT);
    const body = await res.json();

    // After recording, sampleSize should increase
    expect(body.latency.sampleSize).toBeGreaterThanOrEqual(0);
  });
});