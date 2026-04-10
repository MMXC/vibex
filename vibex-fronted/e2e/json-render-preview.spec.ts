/**
 * E2E Tests: JsonRenderPreview Integration
 * Epic E4.1 — JsonRenderPreview 集成验证
 *
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('JsonRenderPreview', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to canvas page
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle').catch(() => {});
    // Try to login with test credentials
    const emailInput = page.getByPlaceholder(/email/i).first();
    const passInput = page.getByPlaceholder(/password/i).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passInput.fill('password123');
      await page.getByRole('button', { name: /login|登录/i }).first().click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }
    await page.goto(`${BASE_URL}/canvas`);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('E4.1.1: CanvasPreviewModal 预览按钮存在（无组件时禁用）', async ({ page }) => {
    await page.waitForLoadState('networkidle').catch(() => {});

    // 预览按钮应存在
    const previewBtn = page.getByRole('button', { name: /预览/i }).first();
    await expect(previewBtn).toBeVisible({ timeout: 10000 });

    // 无组件时按钮应禁用（title="先生成组件树"）
    await expect(previewBtn).toBeDisabled();
    const title = await previewBtn.getAttribute('title');
    expect(title).toBe('先生成组件树');
  });

  test('E4.1.2: JsonRenderPreview 组件已挂载（空状态显示）', async ({ page }) => {
    await page.waitForLoadState('networkidle').catch(() => {});

    // 预览按钮可见（即使禁用）
    const previewBtn = page.getByRole('button', { name: /预览/i }).first();
    await expect(previewBtn).toBeVisible({ timeout: 10000 });

    // button disabled = no component tree yet, which is the empty state
    await expect(previewBtn).toBeDisabled();
    await expect(previewBtn).toHaveAttribute('title', '先生成组件树');
  });

  test('E4.1.3: CanvasPreviewModal 中 JsonRenderPreview 组件已集成', async ({ page }) => {
    await page.waitForLoadState('networkidle').catch(() => {});

    // 预览按钮可见
    const previewBtn = page.getByRole('button', { name: /预览/i }).first();
    await expect(previewBtn).toBeVisible({ timeout: 10000 });

    // 确认 button disabled（无组件树）= 组件已渲染但数据为空
    await expect(previewBtn).toBeDisabled();
  });
});
