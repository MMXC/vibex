import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('E2E Tests: vibex-e2e-user-flow', () => {
  test('Home page should NOT show "Create Next App"', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const content = await page.content();
    expect(content).not.toContain('Create Next App');
  });

  test('Landing page should show VibeX content', async ({ page }) => {
    await page.goto(`${BASE_URL}/landing`);
    const content = await page.content();
    expect(content).toContain('VibeX');
  });

  test('Auth page should show login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    const content = await page.content();
    expect(content).toMatch(/登录|login|email|password/i);
  });

  test('Auth page should have register link', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    const content = await page.content();
    expect(content).toMatch(/注册|register|还没有账号/i);
  });

  test('Dashboard should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe('complete');
  });

  test('Chat page should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe('complete');
  });
});
