/**
 * workbench-journey.spec.ts — P003 E2E tests
 *
 * Coverage:
 * - API: POST/GET /api/agent/sessions
 * - UI: Feature flag 404 behavior (env-controlled)
 *
 * Note: Browser-level feature flag tests require the dev server to be started
 * with NEXT_PUBLIC_WORKBENCH_ENABLED=true. The API tests validate the route
 * behavior independently.
 */

import { test, expect } from '@playwright/test';

test.describe('Workbench API — /api/agent/sessions', () => {
  test('POST creates a session and returns 201 with sessionKey', async ({ request }) => {
    const res = await request.post('/api/agent/sessions', {
      data: { task: 'Test task from E2E' },
    });

    expect(res.status()).toBe(201);
    const body = await res.json() as { sessionKey: string };
    expect(typeof body.sessionKey).toBe('string');
    expect(body.sessionKey.length).toBeGreaterThan(0);
  });

  test('POST with missing task returns 400', async ({ request }) => {
    const res = await request.post('/api/agent/sessions', {
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeTruthy();
  });

  test('POST with empty task returns 400', async ({ request }) => {
    const res = await request.post('/api/agent/sessions', {
      data: { task: '   ' },
    });

    expect(res.status()).toBe(400);
  });

  test('GET returns session list', async ({ request }) => {
    const res = await request.get('/api/agent/sessions');
    expect(res.status()).toBe(200);
    const body = await res.json() as { sessions: unknown[] };
    expect(Array.isArray(body.sessions)).toBe(true);
  });
});

test.describe('Workbench UI — Chromium only', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('with WORKBENCH_ENABLED=false → /workbench returns 404', async ({ page }) => {
    // NEXT_PUBLIC_WORKBENCH_ENABLED is not set → notFound() is called
    const res = await page.goto('/workbench');
    // notFound() renders the Next.js 404 page
    expect(res?.status()).toBe(404);
    // Verify the 404 content is rendered
    await expect(page.locator('h1.next-error-h1')).toBeVisible({ timeout: 10000 });
  });
});
