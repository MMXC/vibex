// F-2.1 + F-2.2: ShortcutBar 与 ShortcutPanel 协同
// Epic 2 | ShortcutBar 与快捷键面板协同

/**
 * F-2.1: ShortcutBar 与 ShortcutPanel 快捷键描述一致
 * F-2.2: 按 ? 打开面板时 ShortcutBar 自动隐藏
 */

import { test, expect } from '@playwright/test'

test.describe('F-2.1: 快捷键描述一致性', () => {
  test('ShortcutBar 与 ShortcutPanel 的 Ctrl+G 描述一致', async ({ page }) => {
    // 获取 ShortcutBar 中的 Ctrl+G 描述
    const barEntry = page.locator('[data-testid="shortcut-bar-item"]', { hasText: 'Ctrl+G' })
    const barDescription = await barEntry.getAttribute('title')

    // 打开 ShortcutPanel 获取描述
    await page.keyboard.press('?')
    const panelEntry = page.locator('[data-testid="shortcut-panel-item"]', { hasText: 'Ctrl+G' })
    const panelDescription = await panelEntry.getAttribute('title')

    expect(panelDescription).toBe(barDescription)
  })
})

test.describe('F-2.2: 面板打开时 ShortcutBar 隐藏', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas')
  })

  test('按 ? 打开快捷键面板后 ShortcutBar 不可见', async ({ page }) => {
    await page.keyboard.press('?')
    // ShortcutBar 应该隐藏或折叠
    const bar = page.locator('[data-testid="shortcut-bar"]')
    await expect(bar).not.toBeVisible()
  })

  test('关闭快捷键面板后 ShortcutBar 恢复可见', async ({ page }) => {
    await page.keyboard.press('?')
    await page.keyboard.press('?') // 关闭面板
    const bar = page.locator('[data-testid="shortcut-bar"]')
    await expect(bar).toBeVisible()
  })

  test('按其他快捷键不触发 ShortcutBar 隐藏（只有 ? 触发）', async ({ page }) => {
    await page.keyboard.press('Control+g')
    const bar = page.locator('[data-testid="shortcut-bar"]')
    await expect(bar).toBeVisible() // Bar 仍可见
  })
})
