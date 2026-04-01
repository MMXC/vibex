import { test, expect } from '@playwright/test';

test.describe('Export Formats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/export');
  });

  test('export panel contains PNG option', async ({ page }) => {
    const pngOption = page.locator('text=PNG 图片');
    await expect(pngOption).toBeVisible();
  });

  test('export panel contains SVG option', async ({ page }) => {
    const svgOption = page.locator('text=SVG 矢量图');
    await expect(svgOption).toBeVisible();
  });

  test('export panel contains ZIP option', async ({ page }) => {
    const zipOption = page.locator('text=ZIP 压缩包');
    await expect(zipOption).toBeVisible();
  });

  test('PNG format card is selectable', async ({ page }) => {
    const pngCard = page.locator('text=PNG 图片').first();
    await pngCard.click();
    await expect(pngCard).toHaveClass(/selected/i);
  });

  test('SVG format card is selectable', async ({ page }) => {
    const svgCard = page.locator('text=SVG 矢量图').first();
    await svgCard.click();
    await expect(svgCard).toHaveClass(/selected/i);
  });

  test('ZIP format card is selectable', async ({ page }) => {
    const zipCard = page.locator('text=ZIP 压缩包').first();
    await zipCard.click();
    await expect(zipCard).toHaveClass(/selected/i);
  });
});
