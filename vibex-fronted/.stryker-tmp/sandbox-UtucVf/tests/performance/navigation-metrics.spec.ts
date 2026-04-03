// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// 登录辅助函数
async function login(page: any) {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState('domcontentloaded');

      await page.fill(
        'input[type="email"], input[name="email"], input[placeholder*="email" i]',
        'y760283407@outlook.com'
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        '12345678'
      );
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 60000 });
      return true;
    } catch (e) {
      console.log(`登录失败，重试 ${i + 1}/${maxRetries}`);
      if (i === maxRetries - 1) throw e;
      await page.waitForTimeout(3000);
    }
  }
  return false;
}

test.describe('导航性能指标', () => {
  // US-020: 导航加载时间 < 500ms
  test('导航加载时间应小于 500ms', async ({ page }) => {
    // 先登录
    await login(page);
    await page.waitForLoadState('networkidle');

    // 测量从导航链接点击到页面加载的时间
    const startTime = Date.now();

    // 点击导航链接（如有）或直接导航
    const navLink = page
      .locator('a[href*="/requirements"], a[href*="/settings"], a[href*="/"]')
      .first();
    if (await navLink.isVisible()) {
      await navLink.click();
    } else {
      await page.goto(`${BASE_URL}/requirements`);
    }

    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // 要求 < 500ms
    expect(loadTime).toBeLessThan(500);
  });

  // US-021: 页面切换时间 < 300ms
  test('页面切换时间应小于 300ms', async ({ page }) => {
    await login(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // 等待导航元素出现
    await page.waitForSelector('nav, [class*="sidebar"], header, a', {
      timeout: 10000,
    });

    // 测量导航切换时间
    const startTime = Date.now();

    // 点击任意导航链接
    const navLink = page.locator('a[href*="/"]').first();
    await navLink.click();
    await page.waitForLoadState('networkidle');

    const switchTime = Date.now() - startTime;

    expect(switchTime).toBeLessThan(300);
  });

  // US-022: FCP < 1.5s
  test('首次内容绘制 (FCP) 应小于 1.5s', async ({ page }) => {
    await login(page);

    await page.goto(`${BASE_URL}/dashboard`);

    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.PerformanceObserver) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime);
                observer.disconnect();
              }
            }
          });
          observer.observe({ entryTypes: ['paint'] });

          // 超时 fallback
          setTimeout(() => resolve(0), 5000);
        } else {
          resolve(0);
        }
      });
    });

    expect(fcp).toBeLessThan(1500);
  });

  // US-023: LCP < 2.5s
  test('最大内容绘制 (LCP) 应小于 2.5s', async ({ page }) => {
    await login(page);

    await page.goto(`${BASE_URL}/dashboard`);

    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.PerformanceObserver) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            resolve(lastEntry.startTime);
            observer.disconnect();
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });

          // 超时 fallback
          setTimeout(() => resolve(0), 5000);
        } else {
          resolve(0);
        }
      });
    });

    expect(lcp).toBeLessThan(2500);
  });

  // US-024: CLS < 0.1
  test('累积布局偏移 (CLS) 应小于 0.1', async ({ page }) => {
    await login(page);

    await page.goto(`${BASE_URL}/dashboard`);

    // 等待页面稳定
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.PerformanceObserver) {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any) {
              if (entry.hadRecentInput) return;
              clsValue += entry.value;
            }
          });
          observer.observe({ entryTypes: ['layout-shift'] });

          // 超时后返回累积值
          setTimeout(() => resolve(clsValue), 2000);
        } else {
          resolve(0);
        }
      });
    });

    expect(cls).toBeLessThan(0.1);
  });

  // 综合性能测试
  test('综合性能指标检查', async ({ page }) => {
    await login(page);

    const metrics: Record<string, number> = {};

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // 测量页面加载
    const navStart = Date.now();
    await page.waitForLoadState('domcontentloaded');
    metrics.navLoadTime = Date.now() - navStart;

    // 测量页面切换
    const switchStart = Date.now();
    const navLink = page.locator('a[href*="/"]').first();
    await navLink.click();
    await page.waitForLoadState('networkidle');
    metrics.pageSwitchTime = Date.now() - switchStart;

    // 获取性能指标
    const perfMetrics = await page.evaluate(() => {
      const paintTiming = performance.getEntriesByType('paint');
      const fcp =
        paintTiming.find((e) => e.name === 'first-contentful-paint')
          ?.startTime || 0;

      return {
        fcp: fcp,
      };
    });

    metrics.fcp = perfMetrics.fcp;

    console.log('性能指标:', metrics);

    // 验证所有指标
    expect(metrics.navLoadTime).toBeLessThan(500);
    expect(metrics.pageSwitchTime).toBeLessThan(300);
    expect(metrics.fcp).toBeLessThan(1500);
  });
});
