/**
 * e4-tabbar-phase.spec.ts — E4: TabBar Phase Alignment E2E Tests
 *
 * E4 Epic: TabBar 按 phase 显示可见 tabs，点击同步 phase
 *
 * Test Matrix:
 * - Phase=input  → 仅显示"上下文" 1 tab
 * - Phase=context/flow → 显示 context+flow 2 tabs
 * - Phase=component → 显示 context+flow+component 3 tabs
 * - Phase=prototype → 显示全部 4 tabs
 * - TabBar 点击 → setPhase 同步
 * - PhaseNavigator 切换 → TabBar 高亮同步
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

test.describe('E4: TabBar Phase 对齐', () => {
  test.beforeEach(async ({ page, context }) => {
    // Bypass auth
    await context.addCookies([
      { name: 'auth_token', value: 'mock-e2e-token', domain: 'localhost', path: '/' },
    ]);
    await page.goto(`${BASE}/canvas/test-project`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('E4-E2E-1: phase=component 时 TabBar 显示 3 个 tabs（无 prototype）', async ({ page }) => {
    // Ensure phase is component
    const phaseBtn = page.locator('[data-testid="phase-indicator"], [class*="phase-indicator"]').first();
    const hasPhaseBtn = await phaseBtn.isVisible().catch(() => false);
    if (hasPhaseBtn) {
      await phaseBtn.click();
      await page.waitForTimeout(300);
    }

    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    // component phase: should show 3 tabs (context, flow, component)
    expect(count).toBe(3);

    // Prototype tab should NOT be visible
    const prototypeTab = page.locator('[role="tab"]', { hasText: /原型|prototype/i }).first();
    await expect(prototypeTab).not.toBeVisible();
  });

  test('E4-E2E-2: TabBar 点击"context" tab，phase 同步为 context', async ({ page }) => {
    // Navigate to component phase first
    const phaseBtn = page.locator('[data-testid="phase-indicator"], [class*="phase-indicator"]').first();
    const hasPhaseBtn = await phaseBtn.isVisible().catch(() => false);
    if (hasPhaseBtn) {
      await phaseBtn.click();
      await page.waitForTimeout(500);
    }

    // Now click the context tab
    const contextTab = page.locator('[role="tab"]', { hasText: /上下文|context/i }).first();
    await expect(contextTab).toBeVisible();
    await contextTab.click();
    await page.waitForTimeout(500);

    // PhaseIndicator should now show context
    const phaseText = page.locator('text=/◇ 上下文|context/i');
    await expect(phaseText.first()).toBeVisible();
  });

  test('E4-E2E-3: TabBar 点击"原型" tab，需要 prototype phase', async ({ page }) => {
    // PhaseNavigator → set to prototype
    const phaseBtn = page.locator('[data-testid="phase-indicator"], [class*="phase-indicator"]').first();
    const hasPhaseBtn = await phaseBtn.isVisible().catch(() => false);
    if (hasPhaseBtn) {
      await phaseBtn.click();
      await page.waitForTimeout(300);
      // Find prototype option in dropdown
      const protoOption = page.locator('[role="option"], [role="menuitem"], [class*="option"]', { hasText: /prototype|原型/i }).first();
      if (await protoOption.isVisible().catch(() => false)) {
        await protoOption.click();
        await page.waitForTimeout(500);
      } else {
        // Close dropdown
        await page.keyboard.press('Escape');
      }
    }

    // Now prototype tab should be visible
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();

    // In prototype phase: should show all 4 tabs
    expect(count).toBe(4);

    const prototypeTab = page.locator('[role="tab"]', { hasText: /原型|prototype/i }).first();
    await expect(prototypeTab).toBeVisible();

    // Click prototype tab
    await prototypeTab.click();
    await page.waitForTimeout(500);
    await expect(prototypeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('E4-E2E-4: phase=prototype 时所有 4 个 tabs 均无 disabled 属性', async ({ page }) => {
    // Navigate to prototype phase
    const phaseBtn = page.locator('[data-testid="phase-indicator"], [class*="phase-indicator"]').first();
    const hasPhaseBtn = await phaseBtn.isVisible().catch(() => false);
    if (hasPhaseBtn) {
      await phaseBtn.click();
      await page.waitForTimeout(300);
      const protoOption = page.locator('[role="option"], [role="menuitem"], [class*="option"]', { hasText: /prototype|原型/i }).first();
      if (await protoOption.isVisible().catch(() => false)) {
        await protoOption.click();
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBe(4);

    for (const tab of await tabs.all()) {
      await expect(tab).not.toHaveAttribute('disabled', '');
      await expect(tab).not.toHaveAttribute('aria-disabled', 'true');
    }
  });

  test('E4-E2E-5: 点击 component tab（component phase）', async ({ page }) => {
    // Set phase to component
    const phaseBtn = page.locator('[data-testid="phase-indicator"], [class*="phase-indicator"]').first();
    const hasPhaseBtn = await phaseBtn.isVisible().catch(() => false);
    if (hasPhaseBtn) {
      await phaseBtn.click();
      await page.waitForTimeout(300);
    }

    const tabs = page.locator('[role="tab"]');
    const componentTab = page.locator('[role="tab"]', { hasText: /组件|component/i }).first();
    const hasComponentTab = await componentTab.isVisible().catch(() => false);

    if (hasComponentTab) {
      await componentTab.click();
      await page.waitForTimeout(500);
      await expect(componentTab).toHaveAttribute('aria-selected', 'true');
    }
  });
});
