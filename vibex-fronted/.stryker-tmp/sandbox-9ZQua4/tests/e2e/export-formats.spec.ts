// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Export Formats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/export');
  });

  test('export panel contains PNG option', async ({ page }) => {
    const pngOption = page.locator('[data-testid="format-card-png"]');
    await expect(pngOption).toBeVisible();
  });

  test('export panel contains SVG option', async ({ page }) => {
    const svgOption = page.locator('[data-testid="format-card-svg"]');
    await expect(svgOption).toBeVisible();
  });

  test('export panel contains ZIP option', async ({ page }) => {
    const zipOption = page.locator('[data-testid="format-card-zip"]');
    await expect(zipOption).toBeVisible();
  });

  test('PNG format card is selectable', async ({ page }) => {
    const pngCard = page.locator('[data-testid="format-card-png"]');
    await pngCard.click();
    // Verify selection by checking for selectedBadge
    await expect(page.locator('[data-testid="format-card-png"] .selectedBadge')).toBeVisible();
  });

  test('SVG format card is selectable', async ({ page }) => {
    const svgCard = page.locator('[data-testid="format-card-svg"]');
    await svgCard.click();
    await expect(page.locator('[data-testid="format-card-svg"] .selectedBadge')).toBeVisible();
  });

  test('ZIP format card is selectable', async ({ page }) => {
    const zipCard = page.locator('[data-testid="format-card-zip"]');
    await zipCard.click();
    await expect(page.locator('[data-testid="format-card-zip"] .selectedBadge')).toBeVisible();
  });

  test('export panel contains React Native option', async ({ page }) => {
    const rnOption = page.locator('[data-testid="format-card-react-native"]');
    await expect(rnOption).toBeVisible();
  });

  test('export panel contains WebP option', async ({ page }) => {
    const webpOption = page.locator('[data-testid="format-card-webp"]');
    await expect(webpOption).toBeVisible();
  });

  test('React Native format card is selectable', async ({ page }) => {
    const rnCard = page.locator('[data-testid="format-card-react-native"]');
    await rnCard.click();
    await expect(page.locator('[data-testid="format-card-react-native"] .selectedBadge')).toBeVisible();
  });

  test('WebP format card is selectable', async ({ page }) => {
    const webpCard = page.locator('[data-testid="format-card-webp"]');
    await webpCard.click();
    await expect(page.locator('[data-testid="format-card-webp"] .selectedBadge')).toBeVisible();
  });
});
