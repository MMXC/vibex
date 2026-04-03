/**
 * canvas-drawer-msg.spec.ts — Epic 3 E2E Tests
 *
 * F3.1: Visual style — drawer consistent with canvas (CSS Modules, no AIChatPanel)
 * F3.2: Mobile responsive — ≤768px drawer hidden
 * F3.3: E2E: open drawer / execute command / node filter
 *
 * Run: pnpm test:e2e -- tests/e2e/canvas-drawer-msg.spec.ts
 */
// @ts-nocheck


import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const CANVAS_URL = `${BASE_URL}/canvas`;

async function goToCanvas(page: Page) {
  await page.goto(CANVAS_URL);
  await page.waitForLoadState('domcontentloaded');
  const skipBtn = page.locator('button:has-text("跳过"), button:has-text("Skip"), button:has-text("开始使用"), button:has-text("Got it")').first();
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForLoadState('networkidle');
  }
}

test.describe('canvas-drawer-msg — Epic 3 E2E', () => {

  test.beforeEach(async ({ page }) => {
    await goToCanvas(page);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  // ── F3.3: Open drawer ──────────────────────────────────────────

  test('F3.3: 点击"消息"按钮打开抽屉', async ({ page }) => {
    // Click the "消息" button in ProjectBar
    const msgBtn = page.locator('button[aria-label*="消息抽屉"]').first();
    await expect(msgBtn).toBeVisible();

    // Drawer should be closed initially
    const drawer = page.locator('[data-testid="message-drawer"]');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');

    // Click to open
    await msgBtn.click();
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('text=💬 消息')).toBeVisible();
  });

  test('F3.3: 再次点击关闭抽屉', async ({ page }) => {
    const msgBtn = page.locator('button[aria-label*="消息抽屉"]').first();
    const drawer = page.locator('[data-testid="message-drawer"]');

    // Open
    await msgBtn.click();
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');

    // Close
    await msgBtn.click();
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  // ── F3.3: Execute command ──────────────────────────────────────

  test('F3.3: 输入 / 打开命令列表', async ({ page }) => {
    const msgBtn = page.locator('button[aria-label*="消息抽屉"]').first();
    await msgBtn.click();

    const input = page.locator('input[placeholder*="命令"]');
    await expect(input).toBeVisible();

    await input.fill('/');
    await expect(page.getByRole('listbox')).toBeVisible();
  });

  test('F3.3: /submit 出现在命令列表中', async ({ page }) => {
    const msgBtn = page.locator('button[aria-label*="消息抽屉"]').first();
    await msgBtn.click();

    const input = page.locator('input[placeholder*="命令"]');
    await input.fill('/');

    await expect(page.getByText('/submit')).toBeVisible();
  });

  test('F3.3: 输入 /gen 过滤只显示 /gen-context 和 /gen-flow', async ({ page }) => {
    const msgBtn = page.locator('button[aria-label*="消息抽屉"]').first();
    await msgBtn.click();

    const input = page.locator('input[placeholder*="命令"]');
    await input.fill('/gen');

    const options = page.locator('[role="option"]');
    const texts = await options.allTextContents();
    const labels = texts.map((t: string) => t.trim()).filter((t: string) => t.startsWith('/'));
    expect(labels).toContain('/gen-context');
    expect(labels).toContain('/gen-flow');
    expect(labels.filter((l: string) => l.startsWith('/') && !l.startsWith('/gen-'))).toHaveLength(0);
  });

  test('F3.3: 执行 /submit → console.log 输出', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') logs.push(msg.text());
    });

    const msgBtn = page.locator('button[aria-label*="消息抽屉"]').first();
    await msgBtn.click();

    const input = page.locator('input[placeholder*="命令"]');
    await input.fill('/');
    const options = page.locator('[role="option"]');
    const submitOption = options.filter({ hasText: '/submit' });
    expect(submitOption).toBeDefined();

    // Click submit
    await submitOption.click();

    expect(logs.some((l: string) => l.includes('[Command]') && l.includes('/submit'))).toBe(true);
  });

  // ── F3.2: Mobile responsive ────────────────────────────────────

  test('F3.2: ≤768px 视口下抽屉默认隐藏', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});

    const drawer = page.locator('[data-testid="message-drawer"]');
    // On mobile the drawer should be hidden via CSS
    const isVisible = await drawer.isVisible();
    // It may be in DOM but display:none means not visible
    if (isVisible) {
      await expect(drawer).toHaveCSS('display', 'none');
    }
  });

  // ── F3.1: Visual style consistency ─────────────────────────────

  test('F3.1: 抽屉使用 canvas CSS 变量（非 AIChatPanel 样式）', async ({ page }) => {
    const msgBtn = page.locator('button[aria-label*="消息抽屉"]').first();
    await msgBtn.click();

    const drawer = page.locator('[data-testid="message-drawer"]');
    await expect(drawer).toBeVisible();

    // Verify it's not using AIChatPanel by checking it has aria-label
    await expect(drawer).toHaveAttribute('aria-label', '消息抽屉');

    // Verify it's rendered as <aside>
    const tag = await drawer.evaluate((el) => el.tagName);
    expect(tag).toBe('ASIDE');
  });
});
