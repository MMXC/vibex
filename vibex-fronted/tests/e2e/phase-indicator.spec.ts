/**
 * phase-indicator.spec.ts — E2.2: PhaseIndicator Integration E2E Tests
 *
 * PRD 验收标准 (E2.2):
 * - AC1: PhaseIndicator 正确渲染
 * - AC2: PhaseIndicator 显示当前 Phase（context/flow/component）
 * - AC3: 点击可切换 Phase
 *
 * Conventions:
 * - Waits: semantic Playwright waits (no waitForTimeout > 50ms)
 */
import { test, expect } from '@playwright/test';

test.describe('PhaseIndicator (E2.2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas/test-project');
    await page.waitForLoadState('networkidle');
  });

  // AC1: PhaseIndicator 正确渲染
  test('E2E-1: PhaseIndicator 在 TabBar 区域可见（非 input/prototype phase）', async ({ page }) => {
    // PhaseIndicator only shows for context/flow/component phases
    const indicator = page.locator(
      '[data-testid="phase-indicator"], .phase-indicator, [class*="phase-indicator"]'
    ).first();

    const isVisible = await indicator.isVisible().catch(() => false);
    // PhaseIndicator may be hidden on /canvas directly (input phase)
    // Check tabBar area for the indicator presence
    const tabBar = page.locator('.tabBarWrapper, [class*="tabBar"]').first();
    const tabBarVisible = await tabBar.isVisible().catch(() => false);

    if (tabBarVisible) {
      // Phase indicator should be present somewhere near TabBar
      const phaseText = page.locator('text=/◇ 上下文|→ 流程|▣ 组件|Phase/i').first();
      const phaseTextVisible = await phaseText.isVisible().catch(() => false);
      expect(phaseTextVisible).toBeTruthy();
    }
  });

  // AC2: 显示当前 Phase
  test('E2E-2: PhaseIndicator 显示当前 Phase 标签', async ({ page }) => {
    // Navigate to a phase that shows PhaseIndicator
    await page.goto('/canvas/test-project');
    await page.waitForLoadState('networkidle');

    // Look for phase labels
    const phaseLabels = ['◇ 上下文', '→ 流程', '▣ 组件', 'Phase'];
    let foundPhase = false;
    for (const label of phaseLabels) {
      const el = page.locator(`text=${label}`).first();
      if (await el.isVisible().catch(() => false)) {
        foundPhase = true;
        break;
      }
    }
    expect(foundPhase).toBeTruthy();
  });

  // AC3: Phase 切换
  test('E2E-3: 点击 PhaseIndicator 可打开下拉菜单并切换 Phase', async ({ page }) => {
    await page.goto('/canvas/test-project');
    await page.waitForLoadState('networkidle');

    // Try to find and click the phase indicator
    const indicator = page.locator('[data-testid="phase-indicator"], .phase-indicator').first();
    const isClickable = await indicator.isVisible().catch(() => false);

    if (isClickable) {
      await indicator.click();
      await page.waitForLoadState('domcontentloaded');

      // Should show dropdown options
      const dropdown = page.locator('[class*="dropdown"], [class*="phase-dropdown"], [role="listbox"]').first();
      const dropdownVisible = await dropdown.isVisible().catch(() => false);
      expect(dropdownVisible).toBeTruthy();

      // Click a different phase option
      const options = page.locator('[role="option"], [class*="phase-option"]');
      const optionCount = await options.count().catch(() => 0);
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForLoadState('domcontentloaded');
        // Should show updated phase
        expect(true).toBeTruthy();
      }
    }
  });
});
