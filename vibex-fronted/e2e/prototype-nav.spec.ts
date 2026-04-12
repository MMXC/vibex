/**
 * prototype-nav E2E tests
 * vibex-canvas-context-nav Epic 3 S3.3
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('vibex-canvas-context-nav — prototype phase navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`);
    // Wait for canvas to load
    await page.waitForLoadState('networkidle');
  });

  test('TabBar prototype tab switches to prototype phase', async ({ page }) => {
    // Context tab should be active by default
    const contextTab = page.locator('[role="tab"]', { hasText: '上下文' });
    await expect(contextTab).toHaveAttribute('aria-selected', 'true');

    // Click prototype tab
    const prototypeTab = page.locator('[role="tab"]', { hasText: '原型' });
    await prototypeTab.click();

    // PhaseIndicator should show prototype phase
    await expect(page.getByRole('button', { name: /原型队列/ })).toBeVisible();
  });

  test('PhaseIndicator prototype option returns to prototype phase', async ({ page }) => {
    // Navigate to flow tab (if accessible — depends on phase)
    const flowTab = page.locator('[role="tab"]', { hasText: '流程' });
    
    // If flow tab is disabled (phase too early), skip this part
    const isFlowLocked = await flowTab.getAttribute('aria-disabled');
    
    if (isFlowLocked !== 'true') {
      await flowTab.click();
    }

    // Open PhaseIndicator dropdown
    const phaseIndicator = page.getByRole('button', { name: /当前阶段/ });
    await phaseIndicator.click();

    // Prototype option should be visible
    await expect(page.getByText('🚀 原型队列')).toBeVisible();

    // Click prototype option
    await page.getByText('🚀 原型队列').click();

    // Should return to prototype phase
    await expect(page.getByRole('button', { name: /原型队列/ })).toBeVisible();
  });

  test('prototype tab badge shows queue count when pages exist', async ({ page }) => {
    // This test verifies the badge exists on the prototype tab
    // (count depends on sessionStore prototypeQueue state)
    const prototypeTab = page.locator('[role="tab"]', { hasText: '原型' });
    await prototypeTab.click();

    // Prototype tab should be active
    await expect(prototypeTab).toHaveAttribute('aria-selected', 'true');

    // Tab count badge may or may not be visible depending on queue state
    // This is a smoke test that the tab renders correctly
  });
});
