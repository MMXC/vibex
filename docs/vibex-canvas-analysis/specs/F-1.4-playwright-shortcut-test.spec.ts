// F-1.4: Playwright 快捷键交互验证
// Epic 1 | 快捷键面板统一

/**
 * 目标: Playwright 测试验证 ? 键行为正确（只打开一个面板）
 * 文件: specs/shortcut-panel.spec.ts
 */

import { test, expect } from '@playwright/test'

test.describe('F-1.4: 快捷键面板交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas')
  })

  test('按 ? 键只打开一个面板', async ({ page }) => {
    await page.keyboard.press('?')
    const panels = await page.locator('[data-testid="shortcut-panel"]').count()
    expect(panels).toBe(1)
  })

  test('按 ? 键打开面板，再按 ? 关闭', async ({ page }) => {
    await page.keyboard.press('?')
    await expect(page.locator('[data-testid="shortcut-panel"]')).toBeVisible()
    await page.keyboard.press('?')
    await expect(page.locator('[data-testid="shortcut-panel"]')).not.toBeVisible()
  })

  test('打开面板后按 Escape 关闭', async ({ page }) => {
    await page.keyboard.press('?')
    await expect(page.locator('[data-testid="shortcut-panel"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="shortcut-panel"]')).not.toBeVisible()
  })

  test('面板关闭时快捷键仍可正常使用（如 Ctrl+G）', async ({ page }) => {
    const panelClosed = page.locator('[data-testid="shortcut-panel"]')
    await expect(panelClosed).not.toBeVisible()
    // Ctrl+G 不应打开面板（只 ? 键打开面板）
    await page.keyboard.press('Control+g')
    await expect(panelClosed).not.toBeVisible()
  })
})
