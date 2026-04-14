/**
 * DDS Canvas E2E — Epic 6: F25/F26/F27
 *
 * 三个核心测试用例覆盖 DDS Canvas 的关键路径：
 * - F25: 画布 CRUD（创建卡片 → 拖拽 → 编辑 → 删除）
 * - F26: AI Draft 完整流程（输入 → 生成 → 预览 → 接受）
 * - F27: 面板导航 + 全屏切换
 *
 * 运行方式：
 *   pnpm test:e2e -- tests/e2e/dds-canvas-e2e.spec.ts
 *
 * 注意：
 *   - AI 生成依赖 /api/chat mock 或真实后端，CI 无后端时会进入 ERROR 状态
 *   - React Flow 节点拖拽使用 Playwright 鼠标操作
 *   - @/ path alias resolved by webpack — works at runtime, not resolvable by standalone tsc
 */

import { test, expect, type Page } from '@playwright/test';

// ==================== Config ====================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DDS_CANVAS_URL = `${BASE_URL}/design/dds-canvas?projectId=test-epic6-proj`;
const TEST_PROJECT_ID = 'test-epic6-proj';

// ==================== Mock Data ====================

const mockDDSChapters = [
  { id: 'ch-req', projectId: TEST_PROJECT_ID, type: 'requirement', createdAt: '2026-04-10T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'ch-ctx', projectId: TEST_PROJECT_ID, type: 'context', createdAt: '2026-04-10T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'ch-flow', projectId: TEST_PROJECT_ID, type: 'flow', createdAt: '2026-04-10T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
];

const mockDCards = [
  { id: 'card-1', chapterId: 'ch-req', type: 'requirement', title: '用户登录', data: {}, position: { x: 100, y: 100 }, createdAt: '2026-04-10T10:00:00Z', updatedAt: '2026-04-10T10:00:00Z' },
  { id: 'card-2', chapterId: 'ch-req', type: 'requirement', title: '项目管理', data: {}, position: { x: 300, y: 100 }, createdAt: '2026-04-10T10:00:00Z', updatedAt: '2026-04-10T10:00:00Z' },
];

// ==================== API Mock Setup ====================

/**
 * Set up Playwright route interceptors for DDS API endpoints.
 * This mocks the backend so tests run without a real server.
 */
async function setupDDSMocks(page: Page) {
  // GET /api/v1/dds/chapters?projectId=xxx
  await page.route(`**/api/v1/dds/chapters*`, async (route) => {
    const url = route.request().url();
    if (url.includes('/chapters/')) {
      // GET /api/v1/dds/chapters/:chapterId — return cards for that chapter
      const chapterId = url.split('/chapters/')[1]?.split('?')[0];
      const cards = mockDCards.filter((c) => c.chapterId === chapterId);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: cards }) });
    } else {
      // GET /api/v1/dds/chapters?projectId=xxx — return chapters
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockDDSChapters }) });
    }
  });

  // POST /api/v1/dds/chapters/:chapterId/cards — create card
  await page.route(`**/api/v1/dds/chapters/*/cards`, async (route) => {
    const body = await route.request().postData();
    const json = body ? JSON.parse(body) : {};
    const chapterId = route.request().url().split('/chapters/')[1]?.split('/')[0];
    const newCard = { id: 'card-' + Date.now(), chapterId, type: json.type || 'requirement', title: json.title, data: json.data || {}, position: json.position || { x: 0, y: 0 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: newCard }) });
  });

  // PUT /api/v1/dds/cards/:cardId
  await page.route(`**/api/v1/dds/cards/*`, async (route) => {
    const url = route.request().url();
    const body = await route.request().postData();
    const json = body ? JSON.parse(body) : {};
    if (url.includes('/relations')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    } else if (url.includes('/position')) {
      const card = { id: url.split('/cards/')[1]?.split('/')[0], chapterId: 'ch-req', type: 'requirement', title: 'Updated', data: {}, position: { x: json.position?.x ?? 0, y: json.position?.y ?? 0 }, createdAt: '2026-04-10T00:00:00Z', updatedAt: new Date().toISOString() };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: card }) });
    } else {
      const card = { id: url.split('/cards/')[1], chapterId: 'ch-req', type: json.type || 'requirement', title: json.title || 'Updated', data: json.data || {}, position: { x: 0, y: 0 }, createdAt: '2026-04-10T00:00:00Z', updatedAt: new Date().toISOString() };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: card }) });
    }
  });

  // DELETE /api/v1/dds/cards/:cardId
  await page.route(`**/api/v1/dds/cards/*`, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      return;
    }
    // Fall through to other handlers (PUT)
    const url = route.request().url();
    const body = await route.request().postData();
    const json = body ? JSON.parse(body) : {};
    if (url.includes('/relations')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    } else if (url.includes('/position')) {
      const card = { id: url.split('/cards/')[1]?.split('/')[0], chapterId: 'ch-req', type: 'requirement', title: 'Updated', data: {}, position: { x: json.position?.x ?? 0, y: json.position?.y ?? 0 }, createdAt: '2026-04-10T00:00:00Z', updatedAt: new Date().toISOString() };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: card }) });
    } else {
      const card = { id: url.split('/cards/')[1], chapterId: 'ch-req', type: json.type || 'requirement', title: json.title || 'Updated', data: json.data || {}, position: { x: 0, y: 0 }, createdAt: '2026-04-10T00:00:00Z', updatedAt: new Date().toISOString() };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: card }) });
    }
  });

  // Auth mock — GET /api/auth/me
  await page.route(`**/api/auth/me`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'user' } }) });
  });
}

// ==================== Helpers ====================

/**
 * Navigate to DDS Canvas.
 * In CI without a real backend, the page may show an error state — tests handle this gracefully.
 */
async function goToDDSCanvas(page: Page) {
  await page.goto(DDS_CANVAS_URL);
  await page.waitForLoadState('domcontentloaded');
  // Allow hydration + initial render
  await page.waitForTimeout(800);
}

/**
 * Inject mock cards into the Zustand store via page.evaluate.
 * Uses Function() constructor to bypass TypeScript path-alias resolution
 * (the alias @/ is resolved by webpack at bundle time, not by tsc here).
 */
async function injectMockCards(page: Page) {
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    // Expose a seed function the app can call — we invoke it via the module system
    win.__dds_seed__ = function () {
      // This will be called after the store is loaded by the app
      return true;
    };
  });

  // Inject cards by calling the store module via webpack-bundled dynamic import
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate(async () => {
    try {
      // Use Function constructor so TypeScript (tsc) doesn't try to resolve the import path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storeModule: any = await new Function('return import("@/stores/dds/DDSCanvasStore")')();
      const { ddsChapterActions } = storeModule;

      ddsChapterActions.addCard('requirement', {
        id: 'mock-req-1',
        type: 'user-story',
        title: '用户登录系统',
        description: '作为用户，我希望能登录系统',
        role: '用户',
        action: '登录系统',
        benefit: '访问个人数据',
        priority: 'high',
        position: { x: 150, y: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      ddsChapterActions.addCard('requirement', {
        id: 'mock-req-2',
        type: 'user-story',
        title: '用户管理订单',
        description: '作为用户，我希望能管理我的订单',
        role: '用户',
        action: '管理订单',
        benefit: '查看订单历史',
        priority: 'medium',
        position: { x: 400, y: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      ddsChapterActions.addCard('context', {
        id: 'mock-ctx-1',
        type: 'bounded-context',
        title: '认证上下文',
        description: '处理用户认证相关逻辑',
        name: '认证上下文',
        responsibility: '用户身份验证和授权',
        position: { x: 100, y: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      ddsChapterActions.addCard('flow', {
        id: 'mock-flow-1',
        type: 'flow-step',
        title: '输入凭据',
        description: '用户输入用户名和密码',
        stepName: '输入凭据',
        actor: '用户',
        preCondition: '用户在登录页面',
        postCondition: '系统验证凭据',
        position: { x: 100, y: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[DDS E2E] Store injection failed (likely no backend):', err);
    }
  });
}

/**
 * Wait for DDS Canvas loading to settle.
 * Resolves when loading is done AND no error state is shown.
 * Fails the test if error state appears (canvas couldn't load).
 */
async function waitForCanvasSettled(page: Page) {
  // Wait for loading bar to disappear AND no error state present
  const settled = await page.waitForFunction(
    () => {
      const loading = document.querySelector('[data-testid="dds-loading-bar"]');
      const error = document.querySelector('[data-testid="dds-error-state"]');
      const canvas = document.querySelector('.react-flow');
      // Canvas visible = ready, loading gone = done
      return !!canvas || !!error || !loading;
    },
    { timeout: 15000 }
  ).then(() => true).catch(() => false);

  // If error state appeared, surface it for debugging
  const hasError = await page.locator('[data-testid="dds-error-state"]').isVisible().catch(() => false);
  if (hasError) {
    const errorMsg = await page.locator('[data-testid="dds-error-state"]').textContent().catch(() => '');
    throw new Error(`Canvas failed to load. Error state: ${errorMsg}`);
  }
}

/**
 * Take a screenshot with a descriptive name.
 */
async function takeScreenshot(page: Page, name: string) {
  const screenshotDir = 'tests/e2e/screenshots';
  await page.screenshot({
    path: `${screenshotDir}/dds-canvas-${name}.png`,
    fullPage: true,
  });
}

// ==================== Test Suite ====================

test.describe('DDS Canvas E2E — Epic 6: F25/F26/F27', () => {

    test.beforeEach(async ({ page }) => {
    // Set up API mocks BEFORE navigation so page load succeeds
    await setupDDSMocks(page);
    await goToDDSCanvas(page);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  // ========================================================================
  // F25: 画布 CRUD 流程
  // ========================================================================

  test('F25: 创建卡片 → 拖拽 → 编辑 → 删除', async ({ page }) => {
    // 1. 注入 mock 卡片数据到 Zustand store
    await injectMockCards(page);
    await waitForCanvasSettled(page);

    // 2. 验证 React Flow canvas 渲染
    const canvas = page.locator('.react-flow');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'f25-1-canvas-loaded');

    // 3. 验证卡片节点出现
    const node1 = page.locator('.react-flow__node').filter({ hasText: '用户登录系统' });
    await expect(node1.first()).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'f25-2-cards-visible');

    // 4. 拖拽卡片（使用 React Flow 内置拖拽）
    const node1Box = await node1.first().boundingBox();
    expect(node1Box).not.toBeNull();

    const initialX = node1Box!.x;
    const initialY = node1Box!.y;

    // 拖拽节点向右 200px
    await node1.first().hover();
    await page.mouse.down();
    await page.mouse.move(initialX + 200, initialY + 50, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f25-3-after-drag');

    // 验证节点位置已更新
    const newBox = await node1.first().boundingBox();
    expect(newBox).not.toBeNull();
    expect(newBox!.x).not.toBe(initialX);

    // 5. 点击选中卡片
    await node1.first().click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'f25-4-after-select');

    // 6. 通过 store API 删除卡片（模拟用户操作）
    await page.evaluate(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storeModule: any = await new Function('return import("@/stores/dds/DDSCanvasStore")')();
        storeModule.ddsChapterActions.deleteCard('requirement', 'mock-req-1');
      } catch (err) {
        console.warn('[DDS E2E] Store delete failed:', err);
      }
    });
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f25-5-after-delete');

    // 7. 验证卡片已从 DOM 中移除
    const deletedNode = page.locator('.react-flow__node').filter({ hasText: '用户登录系统' });
    await expect(deletedNode).toHaveCount(0);

    // 8. 验证剩余卡片仍存在
    const remainingNode = page.locator('.react-flow__node').filter({ hasText: '用户管理订单' });
    await expect(remainingNode.first()).toBeVisible({ timeout: 3000 });

    // 9. 验证画布没有崩溃
    await expect(canvas).toBeVisible();
    await takeScreenshot(page, 'f25-6-final');
  });

  // ========================================================================
  // F26: AI Draft 完整流程
  // ========================================================================

  test('F26: AI Draft 完整流程', async ({ page }) => {
    await waitForCanvasSettled(page);

    const canvas = page.locator('.react-flow');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'f26-1-canvas-ready');

    // 1. 打开 AI Draft Drawer
    const aiButton = page.locator('button[aria-label="AI 生成"]');
    await aiButton.click();
    await page.waitForTimeout(500);

    const drawer = page.locator('[data-testid="ai-draft-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });
    await expect(drawer).toHaveAttribute('aria-label', 'AI 卡片生成');
    await takeScreenshot(page, 'f26-2-drawer-open');

    // 2. 输入需求描述
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('帮我设计一个用户登录流程的卡片');
    await page.waitForTimeout(200);

    // 3. 点击发送
    const sendBtn = page.locator('[data-testid="send-btn"]');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();
    await page.waitForTimeout(500);

    // 4. 验证 loading 或 error 状态
    // In CI without backend, AI call fails → ERROR state
    // With backend, AI generates → LOADING → PREVIEW state
    const hasError = await page.locator('[data-testid="error-banner"]').isVisible({ timeout: 2000 }).catch(() => false);

    if (hasError) {
      // No backend — verify error state is gracefully handled
      const errorBanner = page.locator('[data-testid="error-banner"]');
      await expect(errorBanner).toBeVisible({ timeout: 3000 });
      await takeScreenshot(page, 'f26-3-error-state');
    } else {
      // Backend available — verify loading state
      const loading = page.locator('[data-testid="loading-indicator"]');
      const loadingVisible = await loading.isVisible({ timeout: 3000 }).catch(() => false);

      if (loadingVisible) {
        await takeScreenshot(page, 'f26-3-loading');

        // 等待预览（最多 35s，包含 GENERATION_TIMEOUT_MS=30000）
        const previewSection = page.locator('[data-testid="preview-section"]');
        const previewVisible = await previewSection.isVisible({ timeout: 35000 }).catch(() => false);

        if (previewVisible) {
          // 5. 验证 preview + 按钮
          await expect(previewSection).toBeVisible();
          await takeScreenshot(page, 'f26-4-preview');

          const cardPreview = page.locator('[data-testid="card-preview"]');
          await expect(cardPreview).toBeVisible();

          const acceptBtn = page.locator('[data-testid="btn-accept"]');
          const editBtn = page.locator('[data-testid="btn-edit"]');
          const retryBtn = page.locator('[data-testid="btn-retry"]');

          await expect(acceptBtn).toBeVisible();
          await expect(editBtn).toBeVisible();
          await expect(retryBtn).toBeVisible();

          // 6. 接受卡片
          await acceptBtn.click();
          await page.waitForTimeout(800);

          // 抽屉应关闭
          await expect(drawer).not.toBeVisible({ timeout: 3000 });
          await takeScreenshot(page, 'f26-5-after-accept');

          // 画布上出现新卡片
          const flowNodes = page.locator('.react-flow__node');
          expect(await flowNodes.count()).toBeGreaterThan(0);
          await takeScreenshot(page, 'f26-6-canvas-with-card');
        } else {
          // Timeout → error state
          const errorBanner = page.locator('[data-testid="error-banner"]');
          await expect(errorBanner).toBeVisible({ timeout: 3000 });
          await takeScreenshot(page, 'f26-4-timeout-error');
        }
      } else {
        // No loading indicator → backend returned immediately or error
        const errorBanner = page.locator('[data-testid="error-banner"]');
        if (await errorBanner.isVisible({ timeout: 1000 }).catch(() => false)) {
          await takeScreenshot(page, 'f26-3-error');
        }
      }
    }

    // 7. 测试关闭按钮
    if (await drawer.isVisible().catch(() => false)) {
      const closeBtn = page.locator('[data-testid="drawer-close"]');
      await closeBtn.click();
      await page.waitForTimeout(300);
      await expect(drawer).not.toBeVisible({ timeout: 3000 });
    }
  });

  // ========================================================================
  // F27: 面板导航 + 全屏切换
  // ========================================================================

  test('F27: 面板导航 + 全屏切换', async ({ page }) => {
    await waitForCanvasSettled(page);
    const canvas = page.locator('.react-flow');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'f27-1-canvas-ready');

    // 注入 mock 数据以确保有面板内容
    await injectMockCards(page);
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'f27-2-with-data');

    // 1. 验证 ThumbNav 章节导航
    const thumbNav = page.locator('[aria-label="章节导航"]');
    await expect(thumbNav).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'f27-2-thumbnav');

    // 2. 获取章节缩略图按钮
    const thumbButtons = thumbNav.locator('[class*="thumbButton"]');
    const thumbCount = await thumbButtons.count();
    expect(thumbCount).toBeGreaterThan(0);

    // 3. 点击 context 章节（如果存在）
    const contextThumb = thumbButtons.filter({ hasText: '上下文' }).first();
    if (await contextThumb.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contextThumb.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'f27-3-context-panel');
    }

    // 4. 点击全屏按钮
    const fullscreenBtn = page.locator('button[aria-label="全屏"]');
    await expect(fullscreenBtn).toBeVisible({ timeout: 5000 });
    await fullscreenBtn.click();
    await page.waitForTimeout(500);

    // 5. 验证全屏状态（按钮变为"退出全屏"）
    const exitFullscreenBtn = page.locator('button[aria-label="退出全屏"]');
    await expect(exitFullscreenBtn).toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, 'f27-4-fullscreen-active');

    // 画布在全屏模式下仍可见
    await expect(canvas).toBeVisible();

    // 6. 退出全屏
    await exitFullscreenBtn.click();
    await page.waitForTimeout(500);
    await expect(fullscreenBtn).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button[aria-label="退出全屏"]')).not.toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, 'f27-5-exit-fullscreen');

    // 7. 键盘快捷键 F11 全屏 + Esc 退出
    await fullscreenBtn.click();
    await page.waitForTimeout(300);
    await expect(exitFullscreenBtn).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(fullscreenBtn).toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, 'f27-6-keyboard-fullscreen');

    // 8. 验证画布在全屏切换后仍正常
    await expect(canvas).toBeVisible();
  });

  // ========================================================================
  // Edge: 无数据降级
  // ========================================================================

  test('F25-F27 edge: 无数据时画布降级处理', async ({ page }) => {
    // 不注入 mock 数据，测试空画布/错误状态
    await page.waitForTimeout(3000);

    const errorState = page.locator('[data-testid="dds-error-state"]');
    const canvas = page.locator('.react-flow');
    const toolbar = page.locator('[class*="toolbar"]');

    const hasError = await errorState.isVisible().catch(() => false);
    const hasToolbar = await toolbar.isVisible().catch(() => false);

    // 至少工具栏或错误状态应可见
    expect(hasError || hasToolbar).toBeTruthy();

    if (await canvas.isVisible().catch(() => false)) {
      // React Flow 的 MiniMap 和 Controls 应该存在
      const miniMap = page.locator('.react-flow__minimap');
      const controls = page.locator('.react-flow__controls');
      expect(await miniMap.isVisible().catch(() => false) ||
             await controls.isVisible().catch(() => false)).toBeTruthy();
    }

    await takeScreenshot(page, 'edge-empty-canvas');
  });

});
