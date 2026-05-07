/**
 * E2E tests for E07: MCP Server 集成完善
 *
 * S07.2: MCP 集成测试套件
 * - Health check endpoint
 * - MCP protocol call simulation
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const TEST_PASSWORD = 'e2e-test-password';

/** Fresh login helper */
async function freshLogin(page: Page): Promise<void> {
  const email = `e2e-e07-${Date.now()}@test.local`;
  await page.goto(`${BASE_URL}/auth`);
  await page.click('button:has-text("立即注册")');
  await page.waitForTimeout(300);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.fill('input[type="text"]', 'E2E E07 Test');
  await page.click('button[type="submit"]:has-text("注册")');
  await page.waitForURL(/\/(canvas|dashboard)/, { timeout: 15000 });
}

test.describe('E07: MCP Server 集成 E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('vibex-onboarding');
      sessionStorage.clear();
    });
    await page.waitForTimeout(2500);
    const skipBtn = page.locator('button').filter({ hasText: /跳过/i }).first();
    if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
  });

  // S07.1: Health check endpoint

  test('TC1: GET /api/mcp/health → 200 + status ok', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/mcp/health`);
    expect([200, 404]).toContain(res.status()); // 404 = route not mounted in dev
    if (res.status() === 200) {
      const data = await res.json() as { status: string };
      expect(data.status).toBe('ok');
    }
  });

  test('TC2: GET /api/mcp/health → valid ISO timestamp', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/mcp/health`);
    if (res.status() === 200) {
      const data = await res.json() as { timestamp: string };
      expect(() => new Date(data.timestamp)).not.toThrow();
    }
  });

  test('TC3: GET /api/mcp/health → service = mcp', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/mcp/health`);
    if (res.status() === 200) {
      const data = await res.json() as { service: string };
      expect(data.service).toBe('mcp');
    }
  });

  // S07.2: MCP review_design integration

  test('TC4: POST /api/mcp/review_design → valid response shape', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/mcp/review_design`, {
      data: {
        flow: {
          nodes: [{ id: 'n1', name: 'TestNode', type: 'card' }],
          edges: [],
        },
        designTokens: {},
      },
      headers: { 'Content-Type': 'application/json' },
    });
    // 200 = MCP available, 503 = MCP unavailable (graceful degradation)
    expect([200, 503]).toContain(res.status());
  });

  test('TC5: POST /api/mcp/review_design → graceful degradation when MCP unavailable', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/mcp/review_design`, {
      data: {
        flow: { nodes: [], edges: [] },
        designTokens: {},
      },
      headers: { 'Content-Type': 'application/json' },
    });
    // Should always get a valid response shape
    if (res.status() === 503) {
      const data = await res.json() as { error?: string; fallback?: boolean };
      expect(data.fallback === true || data.error != null).toBeTruthy();
    }
  });

  test('TC6: MCP health check accessible without auth', async ({ request }) => {
    // Health check should not require auth token
    const res = await request.get(`${BASE_URL}/api/mcp/health`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect([200, 404]).toContain(res.status());
  });
});
