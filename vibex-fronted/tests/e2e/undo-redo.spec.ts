// @ci-blocking
/**
 * Undo/Redo E2E Tests
 *
 * E3-T4: End-to-end tests for undo/redo functionality.
 * Tests the UndoBar UI component and keyboard shortcuts.
 *
 * Run: npx playwright test tests/e2e/undo-redo.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to canvas page
    await page.goto('/canvas');
    // Wait for canvas to load
    await page.waitForSelector('[data-testid="undo-bar"]', { timeout: 10000 });
  });

  test('undo bar is visible on canvas', async ({ page }) => {
    const undoBar = page.getByTestId('undo-bar');
    await expect(undoBar).toBeVisible();
  });

  // @ci-blocking
  test('undo button is disabled when no history', async ({ page }) => {
    const undoBtn = page.locator('button').filter({ hasText: '撤销' }).first();
    await expect(undoBtn).toBeDisabled();
  });

  // @ci-blocking
  test('redo button is disabled when no history', async ({ page }) => {
    const redoBtn = page.locator('button').filter({ hasText: '重做' }).first();
    await expect(redoBtn).toBeDisabled();
  });

  // @ci-blocking
  test('undo bar has both undo and redo buttons', async ({ page }) => {
    const undoBar = page.getByTestId('undo-bar');
    await expect(undoBar.getByText('撤销')).toBeVisible();
    await expect(undoBar.getByText('重做')).toBeVisible();
  });

  // @ci-blocking
  test('Ctrl+Z does not crash when no history', async ({ page }) => {
    await page.keyboard.press('Control+z');
    // Should not crash, undo button should still be disabled
    const undoBtn = page.locator('button').filter({ hasText: '撤销' }).first();
    await expect(undoBtn).toBeDisabled();
  });

  // @ci-blocking
  test('Ctrl+Y / Ctrl+Shift+Z does not crash when no history', async ({ page }) => {
    await page.keyboard.press('Control+y');
    // Should not crash, redo button should still be disabled
    const redoBtn = page.locator('button').filter({ hasText: '重做' }).first();
    await expect(redoBtn).toBeDisabled();
  });
});
