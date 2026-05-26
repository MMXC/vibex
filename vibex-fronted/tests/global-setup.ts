import { chromium } from '@playwright/test';

/**
 * P004-E1: Playwright global setup
 *
 * Runs once before all test projects. Cleans localStorage and IndexedDB
 * to ensure a clean state for every E2E test run.
 *
 * @see IMPLEMENTATION_PLAN.md § P004-E1
 */
export default async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  try {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Clean localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Clean all IndexedDB databases
    await page.evaluate(async () => {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(
          (db) =>
            new Promise<void>((resolve, reject) => {
              const request = indexedDB.deleteDatabase(db.name!);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            })
        )
      );
    });

    console.log('[global-setup] localStorage and IndexedDB cleaned successfully');
  } finally {
    await browser.close();
  }
};
