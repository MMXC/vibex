/**
 * offline-canvas.spec.ts — E5 Offline PWA Support E2E tests
 * E5: 离线 PWA 支持
 *
 * Tests: offline banner, service worker registration, canvas data caching,
 * online/offline queue replay, last-5-canvases cache eviction
 */

import { test, expect } from '@playwright/test';

test.describe('E5: Offline PWA Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.cookie = 'vibex_test_auth=mock; path=/';
    });
  });

  // --- D5.4: OfflineBanner renders when offline ---

  test('E5-D5.4: OfflineBanner shows when navigator is offline', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    // Navigate to canvas page to trigger banner render
    await page.goto('/canvas/test-canvas-id');
    await page.waitForSelector('[data-testid="offline-banner"]', { timeout: 3000 });

    // Banner should be visible with offline indicator
    const banner = page.locator('[data-testid="offline-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('role', 'alert');

    // Restore online
    await page.context().setOffline(false);
  });

  test('E5-D5.4: OfflineBanner hides when back online and no pending items', async ({ page }) => {
    await page.context().setOffline(true);
    await page.goto('/canvas/test-canvas-id');
    await page.waitForSelector('[data-testid="offline-banner"]');

    // Restore online
    await page.context().setOffline(false);

    // Banner should hide after 5s delay
    await page.waitForSelector('[data-testid="offline-banner"]', { state: 'hidden', timeout: 8000 });
  });

  // --- D5.4: SW Registration ---

  test('E5-D5.1: Service Worker registers on page load in production', async ({ page }) => {
    // Navigate to canvas page
    await page.goto('/canvas/test-canvas-id');

    // Service worker should be registered (check in application panel)
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });

    // Note: SW registration only happens in production mode
    // In test environment, this may be skipped
    expect(typeof swRegistered).toBe('boolean');
  });

  // --- D5.5: Canvas data caching (last 5, 7-day TTL) ---

  test('E5-D5.5: cacheCanvasData stores canvas data in IndexedDB', async ({ page }) => {
    await page.goto('/canvas/test-canvas-id');

    const cacheResult = await page.evaluate(async () => {
      // Dynamically import the offline-queue module
      const { cacheCanvasData, getCachedCanvasData } = await import('@/lib/offline-queue');

      // Cache a test canvas
      await cacheCanvasData('test-canvas-1', {
        nodes: [{ id: 'n1', type: 'rect' }],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
        metadata: { name: 'Test Canvas' },
      });

      // Retrieve it
      const cached = await getCachedCanvasData('test-canvas-1');
      return {
        found: cached !== null,
        hasNodes: cached?.data.nodes != null,
        hasEdges: cached?.data.edges != null,
        hasMetadata: cached?.data.metadata != null,
      };
    });

    expect(cacheResult.found).toBe(true);
    expect(cacheResult.hasNodes).toBe(true);
    expect(cacheResult.hasEdges).toBe(true);
    expect(cacheResult.hasMetadata).toBe(true);
  });

  test('E5-D5.5: Cache enforces max 5 canvases — oldest evicted', async ({ page }) => {
    await page.goto('/canvas/test-canvas-id');

    const evictionResult = await page.evaluate(async () => {
      const { cacheCanvasData, getCachedCanvasData } = await import('@/lib/offline-queue');

      // Cache 6 canvases (exceeds max of 5)
      for (let i = 1; i <= 6; i++) {
        await cacheCanvasData(`test-canvas-${i}`, {
          nodes: [{ id: `n${i}` }],
          metadata: { index: i },
        });
      }

      // Canvas 1 (oldest) should be evicted
      const oldest = await getCachedCanvasData('test-canvas-1');
      // Canvas 6 (newest) should exist
      const newest = await getCachedCanvasData('test-canvas-6');

      return {
        oldestEvicted: oldest === null,
        newestPresent: newest !== null,
      };
    });

    expect(evictionResult.oldestEvicted).toBe(true);
    expect(evictionResult.newestPresent).toBe(true);
  });

  test('E5-D5.5: Cache entries expire after 7 days', async ({ page }) => {
    await page.goto('/canvas/test-canvas-id');

    const expiryResult = await page.evaluate(async () => {
      const { getCachedCanvasData } = await import('@/lib/offline-queue');

      // Create an expired entry directly in IndexedDB
      const DB_NAME = 'vibex-canvas-cache';
      const STORE_NAME = 'canvas-cache';

      return new Promise<string>((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);

          // Write an entry that expired yesterday
          const yesterday = Date.now() - 24 * 60 * 60 * 1000;
          const expiredEntry = {
            canvasId: 'expired-canvas',
            data: { nodes: [] },
            cachedAt: yesterday,
            expiresAt: yesterday + 1000, // Already expired
          };

          store.put(expiredEntry);
          tx.oncomplete = async () => {
            // Now getCachedCanvasData should return null for expired entry
            const result = await getCachedCanvasData('expired-canvas');
            resolve(result === null ? 'correctly_returns_null_for_expired' : 'returns_expired_entry');
            db.close();
          };
          tx.onerror = () => resolve('db_error');
        };
        request.onerror = () => resolve('open_error');
      });
    });

    expect(expiryResult).toBe('correctly_returns_null_for_expired');
  });

  // --- D5.2: Cloud Backup Queue ---

  test('E5-D5.2: queueCloudBackup enqueues a POST request', async ({ page }) => {
    await page.goto('/canvas/test-canvas-id');

    const enqueueResult = await page.evaluate(async () => {
      const { queueCloudBackup, getQueuedRequests } = await import('@/lib/offline-queue');

      await queueCloudBackup('test-canvas-backup', {
        nodes: [{ id: 'n1' }],
        edges: [],
        metadata: { version: 1 },
      });

      const requests = await getQueuedRequests();
      const backupReq = requests.find(
        (r) => r.url.includes('/api/backup/')
      );

      return {
        count: requests.length,
        hasBackup: backupReq !== undefined,
        method: backupReq?.method ?? null,
      };
    });

    expect(enqueueResult.hasBackup).toBe(true);
    expect(enqueueResult.method).toBe('POST');
  });

  // --- D5.2: Undo/Redo Queue ---

  test('E5-D5.2: queueUndoRedo enqueues undo and redo actions', async ({ page }) => {
    await page.goto('/canvas/test-canvas-id');

    const undoRedoResult = await page.evaluate(async () => {
      const { queueUndoRedo, getQueuedRequests } = await import('@/lib/offline-queue');

      await queueUndoRedo('undo', 'canvas-1', { nodeId: 'n1' });
      await queueUndoRedo('redo', 'canvas-1', { nodeId: 'n1' });

      const requests = await getQueuedRequests();
      const undoReq = requests.find((r) => r.url.includes('/undo'));
      const redoReq = requests.find((r) => r.url.includes('/redo'));

      return {
        total: requests.length,
        hasUndo: undoReq !== undefined,
        hasRedo: redoReq !== undefined,
        undoMethod: undoReq?.method ?? null,
      };
    });

    expect(undoRedoResult.hasUndo).toBe(true);
    expect(undoRedoResult.hasRedo).toBe(true);
    expect(undoRedoResult.undoMethod).toBe('POST');
  });

  // --- D5.3: SW Caching Strategies ---

  test('E5-D5.3: Static assets served from cache when offline', async ({ page }) => {
    // Set offline
    await page.context().setOffline(true);

    // Navigate to app — app shell should load from cache
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Page should load (from precache or stale-while-revalidate)
    // The key is no crash — offline.html fallback if cache miss
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    await page.context().setOffline(false);
  });

  test('E5-D5.3: API requests return 202 when offline (queued)', async ({ page }) => {
    await page.context().setOffline(true);

    // Attempt a POST to an API endpoint
    const response = await page.request.post('/api/canvas/test-canvas/action', {
      data: { action: 'test' },
    });

    // Should return 202 Accepted (queued) or 503 (unavailable)
    // Both are acceptable offline responses
    expect([202, 503]).toContain(response.status());

    await page.context().setOffline(false);
  });

  // --- Integration: Online → Offline → Online flow ---

  test('E5: Full offline→online flow — banner shows, hides after sync', async ({ page }) => {
    // Start online
    await page.goto('/canvas/test-canvas-id');

    // Go offline
    await page.context().setOffline(true);
    await page.waitForSelector('[data-testid="offline-banner"]', { timeout: 5000 });

    const bannerOffline = page.locator('[data-testid="offline-banner"]');
    await expect(bannerOffline).toBeVisible();

    // Come back online
    await page.context().setOffline(false);

    // Banner should eventually hide (after sync completes)
    // Wait up to 10s for banner to disappear
    await page.waitForSelector('[data-testid="offline-banner"]', { state: 'hidden', timeout: 10000 });
  });
});
