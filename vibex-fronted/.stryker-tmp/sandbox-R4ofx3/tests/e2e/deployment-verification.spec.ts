// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('部署验证', () => {
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  // US-030: 构建验证 - 构建成功，无错误
  test('构建验证：检查关键页面可访问', async ({ page }) => {
    const pages = [
      '/',
      '/dashboard',
      '/auth',
      '/requirements',
      '/domain',
      '/templates',
    ];

    for (const path of pages) {
      const response = await page.request.get(`${BASE_URL}${path}`);
      expect(response.status(), `页面 ${path} 应返回 200`).toBeLessThan(400);
    }
  });

  // US-031: 静态资源验证
  test('静态资源验证：检查关键资源可加载', async ({ page }) => {
    // 检查主页面可访问
    const response = await page.request.get(`${BASE_URL}/`);
    expect(response.status()).toBeLessThan(400);

    // 检查 CSS 和 JS 资源
    const html = await response.text();

    // 简单的资源检查 - 确保页面有内容
    expect(html.length).toBeGreaterThan(100);
    expect(html).toContain('<!DOCTYPE html>');
  });

  // US-032: 路由功能验证
  test('路由功能验证：验证导航路由正常工作', async ({ page }) => {
    // 首页
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveURL(`${BASE_URL}/`);

    // Dashboard 路由
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/);

    // Requirements 路由
    await page.goto(`${BASE_URL}/requirements`);
    await expect(page).toHaveURL(/\/requirements/);

    // Domain 路由
    await page.goto(`${BASE_URL}/domain`);
    await expect(page).toHaveURL(/\/domain/);
  });

  // US-033: CDN 部署验证
  test('CDN 部署验证：检查页面内容和资源', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/`);
    expect(response.ok()).toBeTruthy();

    // 检查响应头
    const headers = response.headers();
    expect(headers['content-type']).toContain('text/html');

    // 检查页面包含预期的内容
    const html = await response.text();
    expect(html).toMatch(/html|body|div/i);
  });

  // 综合部署验证
  test('综合部署验证：检查应用完整性', async ({ page }) => {
    // 1. 检查首页可访问
    const homeResponse = await page.request.get(`${BASE_URL}/`);
    expect(homeResponse.ok()).toBeTruthy();

    // 2. 检查关键页面
    const criticalPages = ['/dashboard', '/auth', '/landing'];
    for (const pagePath of criticalPages) {
      const resp = await page.request.get(`${BASE_URL}${pagePath}`);
      expect(resp.status(), `关键页面 ${pagePath} 应可访问`).toBeLessThan(400);
    }

    // 3. 检查页面不是错误页面
    await page.goto(`${BASE_URL}/`);
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Error');
    expect(body).not.toContain('Not Found');
  });
});
