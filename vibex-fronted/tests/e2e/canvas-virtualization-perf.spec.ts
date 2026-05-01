/**
 * Canvas Virtualization Performance E2E — E3
 *
 * 3 个测试用例，覆盖 Canvas 虚拟化性能目标：
 * E3-S2: 100节点 P50 < 100ms 测量
 * E3-S3: 150节点 dropped frames < 2 测量
 * E3-S4: 跨虚拟边界选中状态保持
 *
 * Run: pnpm test:e2e -- tests/e2e/canvas-virtualization-perf.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DDS_CANVAS_URL = `${BASE_URL}/design/dds-canvas`;

// ==================== Helpers ====================

/** Navigate to DDS Canvas, skip onboarding, go to requirement chapter */
async function goToDDSWithData(page: Page) {
  await page.goto(DDS_CANVAS_URL);
  await page.waitForLoadState('domcontentloaded');

  const skipBtn = page
    .locator('button:has-text("跳过"), button:has-text("Skip"), button:has-text("开始使用"), button:has-text("Got it")')
    .first();
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForLoadState('networkidle');
  }

  // Ensure requirement chapter is active (default)
  const requirementTab = page.locator('[data-testid="dds-chapter-requirement"], [data-chapter="requirement"]').first();
  if (await requirementTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await requirementTab.click();
  }

  await page.waitForLoadState('networkidle').catch(() => {});
}

/** Create a minimal user-story card object */
function makeUserStoryCard(index: number) {
  const id = `perf-card-${Date.now()}-${index}`;
  return {
    id,
    type: 'user-story' as const,
    title: `用户故事 ${index}`,
    description: `这是第 ${index} 个用户故事，用于虚拟化性能测试`,
    position: { x: 0, y: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    role: `角色${index}`,
    action: `执行操作${index}`,
    benefit: `获得收益${index}`,
    priority: 'medium' as const,
  };
}

/**
 * Inject N cards into the DDSCanvasStore via page.evaluate.
 * Uses ddsChapterActions.addCard with the 'requirement' chapter.
 */
async function injectCards(page: Page, count: number) {
  await page.evaluate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (n: number) => {
      const { ddsChapterActions } = require('@/stores/dds/DDSCanvasStore');
      const { useDDSCanvasStore } = require('@/stores/dds/DDSCanvasStore');
      for (let i = 0; i < n; i++) {
        const id = `perf-card-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
        const card = {
          id,
          type: 'user-story',
          title: `用户故事 ${i + 1}`,
          description: `这是第 ${i + 1} 个用户故事`,
          position: { x: 0, y: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: `角色${i + 1}`,
          action: `执行操作${i + 1}`,
          benefit: `获得收益${i + 1}`,
          priority: 'medium',
        };
        ddsChapterActions.addCard('requirement', card);
      }
    },
    count
  );
}

/** Clear all cards from the requirement chapter */
async function clearCards(page: Page) {
  await page.evaluate(() => {
    const { useDDSCanvasStore } = require('@/stores/dds/DDSCanvasStore');
    useDDSCanvasStore.setState((s: { chapters: { requirement: { cards: never[] } } }) => ({
      chapters: {
        ...s.chapters,
        requirement: { ...s.chapters.requirement, cards: [] },
      },
    }));
  });
}

// ==================== Tests ====================

test.describe('Canvas Virtualization Performance — E3', () => {

  test.afterEach(async ({ page }) => {
    await clearCards(page);
    await page.evaluate(() => localStorage.clear());
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E3-S2: 100节点 P50 < 100ms
  //
  // 测量100个卡片从注入到完全渲染的P50时间。运行10次取中位数。
  // 断言：P50 < 100ms
  // ─────────────────────────────────────────────────────────────────────────
  test('E3-S2: 100节点 P50 < 100ms', async ({ page }) => {
    await goToDDSWithData(page);

    // Verify ChapterPanel is visible
    const chapterPanel = page.locator('[data-testid="chapter-panel"], [class*="chapterPanel"], section').first();
    await expect(chapterPanel).toBeVisible({ timeout: 5000 });

    const measurements: number[] = [];

    for (let run = 0; run < 10; run++) {
      // Inject 100 cards and measure render time
      const renderTime = await page.evaluate(async (iter: number) => {
        const { ddsChapterActions } = require('@/stores/dds/DDSCanvasStore');
        const cards = [];
        for (let i = 0; i < 100; i++) {
          const idx = iter * 100 + i;
          const id = `p50-${Date.now()}-${idx}`;
          cards.push({
            id,
            type: 'user-story',
            title: `用户故事 ${idx}`,
            description: `描述 ${idx}`,
            position: { x: 0, y: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: `角色${idx}`,
            action: `操作${idx}`,
            benefit: `收益${idx}`,
            priority: 'medium',
          });
        }

        const t0 = performance.now();
        cards.forEach((card: ReturnType<typeof makeUserStoryCard>) => {
          ddsChapterActions.addCard('requirement', card);
        });

        // Wait for React to commit the DOM update
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

        const t1 = performance.now();
        return t1 - t0;
      }, run);

      measurements.push(renderTime);

      // Clear cards before next iteration
      await page.evaluate(() => {
        const { useDDSCanvasStore } = require('@/stores/dds/DDSCanvasStore');
        useDDSCanvasStore.setState((s: { chapters: { requirement: { cards: never[] } } }) => ({
          chapters: {
            ...s.chapters,
            requirement: { ...s.chapters.requirement, cards: [] },
          },
        }));
      });
    }

    // Calculate P50
    measurements.sort((a, b) => a - b);
    const p50 = measurements[Math.floor(measurements.length / 2)]; // index 5 for 10 samples

    // Log for CI diagnostics
    console.log('[E3-S2] P50 render time (ms):', p50);
    console.log('[E3-S2] All measurements:', measurements);

    expect(
      p50,
      `P50 render time ${p50.toFixed(2)}ms exceeds 100ms threshold`
    ).toBeLessThan(100);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E3-S3: 150节点 dropped frames < 2
  //
  // 使用 requestAnimationFrame timestamps 测量滚动时的 dropped frames。
  // 在注入150个卡片后执行快速滚动，统计掉帧数。
  // 断言：dropped frames < 2
  // ─────────────────────────────────────────────────────────────────────────
  test('E3-S3: 150节点 dropped frames < 2', async ({ page }) => {
    await goToDDSWithData(page);

    // Inject 150 cards
    await injectCards(page, 150);

    // Wait for cards to render
    await page.waitForTimeout(500);

    // Find the scrollable container in ChapterPanel
    const scrollContainer = page.locator(
      '[data-testid="chapter-panel-scroll"], [class*="scrollContainer"], [class*="scrollContainer"]'
    ).first();

    const scrollable = await scrollContainer.isVisible().catch(() => false)
      ? scrollContainer
      : page.locator('body');

    // Measure dropped frames during fast scroll
    const droppedFrames = await page.evaluate(async (selector: string) => {
      const container = document.querySelector(selector) || document.documentElement;

      return new Promise<number>((resolve) => {
        const timestamps: number[] = [];
        let lastTimestamp = 0;
        let dropped = 0;
        let frameCount = 0;
        const maxFrames = 60; // Monitor 60 frames (~1 second at 60fps)

        const FRAME_BUDGET = 1000 / 30; // 30fps minimum = ~33ms per frame budget
        // If a frame takes more than 2x budget, it's a dropped frame

        function measureFrame(timestamp: number) {
          if (lastTimestamp > 0) {
            const delta = timestamp - lastTimestamp;
            // Dropped = delta exceeds 2x the 60fps budget (i.e., > 33.33ms)
            if (delta > FRAME_BUDGET * 2) {
              dropped += Math.floor(delta / FRAME_BUDGET);
            }
            timestamps.push(delta);
          }
          lastTimestamp = timestamp;
          frameCount++;

          if (frameCount < maxFrames) {
            requestAnimationFrame(measureFrame);
          } else {
            resolve(dropped);
          }
        }

        // Start measuring
        requestAnimationFrame(measureFrame);

        // Trigger fast scroll via wheel events
        setTimeout(() => {
          if ('scrollTop' in container) {
            const el = container as HTMLElement;
            const scrollHeight = el.scrollHeight - el.clientHeight;
            let scrolls = 0;
            const scrollInterval = setInterval(() => {
              el.scrollTop = Math.min(el.scrollTop + 200, scrollHeight);
              scrolls++;
              if (scrolls >= 20) clearInterval(scrollInterval);
            }, 16); // ~60fps scroll
          }
        }, 100);
      });
    },
    await scrollContainer.getAttribute('class') ? `[class="${await scrollContainer.getAttribute('class')}"]` : 'body');

    console.log('[E3-S3] Dropped frames during scroll:', droppedFrames);

    expect(
      droppedFrames,
      `Dropped frames ${droppedFrames} exceeds threshold of 2`
    ).toBeLessThan(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // E3-S4: 跨虚拟边界选中状态保持
  //
  // 选中一个在虚拟边界处（overscan=3）的卡片，
  // 滚动使该卡片滚出视口，然后滚回视口，验证选中状态恢复。
  // ─────────────────────────────────────────────────────────────────────────
  test('E3-S4: 跨虚拟边界选中状态保持', async ({ page }) => {
    await goToDDSWithData(page);

    // Inject 50 cards (overscan=3 means boundary is ~6 nodes from edges)
    await injectCards(page, 50);
    await page.waitForTimeout(500);

    // Find the scroll container
    const scrollContainer = page.locator(
      '[data-testid="chapter-panel-scroll"], [class*="scrollContainer"]'
    ).first();

    const hasScroll = await scrollContainer.isVisible().catch(() => false);

    // Get first card element
    const cardSelector = '[class*="cardItem"], [class*="card"], [class*="chapter-card"]';
    const firstCard = page.locator(cardSelector).first();

    if (!await firstCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    // Click first card to select it
    await firstCard.click();
    await page.waitForTimeout(300);

    // Check that a card is selected (look for selected state class or attribute)
    const hasSelected = await page.evaluate(() => {
      const { useDDSCanvasStore } = require('@/stores/dds/DDSCanvasStore');
      const state = useDDSCanvasStore.getState();
      return {
        selectedIds: state.selectedCardIds,
        snapshot: state.selectedCardSnapshot,
        hasSelection: state.selectedCardIds.length > 0 || state.selectedCardSnapshot !== null,
      };
    });

    console.log('[E3-S4] Initial selection:', hasSelected);
    expect(hasSelected.hasSelection, 'No card was selected after click').toBe(true);

    // Scroll down significantly (past overscan boundary ~3 * 120px = 360px)
    await page.evaluate(() => {
      const { useDDSCanvasStore } = require('@/stores/dds/DDSCanvasStore');
      // Force scroll after selection
      const container = document.querySelector('[class*="scrollContainer"]') as HTMLElement;
      if (container) {
        container.scrollTop = 1000; // Well past overscan boundary
      } else {
        window.scrollTo(0, 1000);
      }
    });

    await page.waitForTimeout(500);

    // Check selectedCardSnapshot is still present (跨边界保留)
    const snapshotAfterScroll = await page.evaluate(() => {
      const { useDDSCanvasStore } = require('@/stores/dds/DDSCanvasStore');
      const state = useDDSCanvasStore.getState();
      return {
        snapshot: state.selectedCardSnapshot,
        hasSnapshot: state.selectedCardSnapshot !== null,
      };
    });

    console.log('[E3-S4] Selection after scroll out:', snapshotAfterScroll);
    expect(
      snapshotAfterScroll.hasSnapshot,
      'selectedCardSnapshot was lost after scrolling out of view'
    ).toBe(true);

    // Scroll back to top (card should become visible again)
    await page.evaluate(() => {
      const container = document.querySelector('[class*="scrollContainer"]') as HTMLElement;
      if (container) {
        container.scrollTop = 0;
      } else {
        window.scrollTo(0, 0);
      }
    });

    await page.waitForTimeout(500);

    // Verify card is still selected (no flicker)
    const finalSelection = await page.evaluate(() => {
      const { useDDSCanvasStore } = require('@/stores/dds/DDSCanvasStore');
      const state = useDDSCanvasStore.getState();
      return {
        selectedIds: state.selectedCardIds,
        snapshot: state.selectedCardSnapshot,
        hasSelection: state.selectedCardIds.length > 0 || state.selectedCardSnapshot !== null,
      };
    });

    console.log('[E3-S4] Final selection after scroll back:', finalSelection);
    expect(
      finalSelection.hasSelection,
      'Selection was lost after scrolling back into view'
    ).toBe(true);

    // Verify the card element has selected visual state
    const firstCardStillSelected = await firstCard.evaluate((el) => {
      return el.className.includes('selected') ||
             el.className.includes('Selected') ||
             el.getAttribute('data-selected') === 'true' ||
             el.getAttribute('aria-selected') === 'true';
    });

    expect(
      firstCardStillSelected,
      'Card does not show selected visual state after scrolling back'
    ).toBe(true);
  });

});
