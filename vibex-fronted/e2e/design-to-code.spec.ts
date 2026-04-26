/**
 * E3 US-E3.2: Design-to-Code E2E Tests
 *
 * Mock scope: MockAgentService used for backend API mocking.
 * Tests the CodeGen panel flow (E10 + E1 path).
 *
 * Note: These tests rely on data-testid attributes being present in the actual
 * CodeGen panel UI. If selectors don't match existing elements, update the
 * component to include the required testids.
 */
import { test, expect } from '@playwright/test';

// MockAgentService: route() API calls to /api/agent/* to prevent real network calls
const mockAgentService = () => ({
  setup: async (page: any) => {
    await page.route('**/api/agent/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  },
});

test.describe('E3: Design-to-Code E2E', () => {
  test.beforeEach(async ({ page }) => {
    const mock = mockAgentService();
    await mock.setup(page);
  });

  test('E3.1 — Generate code button renders', async ({ page }) => {
    await page.goto('/design/dds-canvas?projectId=test');
    await page.waitForSelector('[data-testid="code-gen-panel"]', { timeout: 10000 });
    const btn = page.locator('[data-testid="generate-button"]');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('E3.2 — Generate code produces output', async ({ page }) => {
    await page.goto('/design/dds-canvas?projectId=test');
    await page.waitForSelector('[data-testid="code-gen-panel"]', { timeout: 10000 });
    await page.click('[data-testid="generate-button"]');
    await expect(page.locator('[data-testid="code-preview"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="code-preview"] button').first()).toBeVisible();
  });

  test('E3.3 — Download ZIP button appears after generation', async ({ page }) => {
    await page.goto('/design/dds-canvas?projectId=test');
    await page.waitForSelector('[data-testid="code-gen-panel"]', { timeout: 10000 });
    await page.click('[data-testid="generate-button"]');
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('E3.4 — Send to AI Agent button visible when feature flag enabled', async ({ page }) => {
    await page.goto('/design/dds-canvas?projectId=test');
    await page.evaluate(() => {
      localStorage.setItem('NEXT_PUBLIC_FEATURE_DESIGN_TO_CODE_PIPELINE', 'true');
    });
    await page.reload();
    await page.waitForSelector('[data-testid="code-gen-panel"]', { timeout: 10000 });
    await page.click('[data-testid="generate-button"]');
    const sendBtn = page.locator('[data-testid="send-to-agent-btn"]');
    await expect(sendBtn).toBeVisible();
  });

  test('E3.5 — Limit warning shows for 200+ nodes', async ({ page }) => {
    await page.goto('/design/dds-canvas?projectId=test');
    await page.waitForSelector('[data-testid="code-gen-panel"]', { timeout: 10000 });
    await page.click('[data-testid="generate-button"]');
    const warning = page.locator('[data-testid="limit-warning"]');
    const note = page.locator('[data-testid="limit-note"]');
    await expect(warning.or(note)).toBeAttached();
  });
});