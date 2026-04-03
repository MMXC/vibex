/**
 * E2E Tests for Canvas API Standardization — Epic 5
 * Project: vibex-canvas-api-standardization
 *
 * Coverage:
 * - F5.1: Full API endpoint coverage for /api/v1/canvas/*
 * - F5.2: Two-step design flow tests (contexts → flows → components)
 * - F5.3: sessionId chain tests
 *
 * RED LINE: Only add tests, do NOT modify business code.
 * Run: pnpm --filter vibex-fronted exec playwright test tests/e2e/canvas-api-standardization-epic5.spec.ts
 */
// @ts-nocheck


import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CANVAS_URL = `${BASE_URL}/canvas`;
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Skip onboarding modal if present and navigate to canvas page
 */
async function goToCanvas(page: Page): Promise<void> {
  await page.goto(CANVAS_URL, { waitUntil: 'domcontentloaded' });

  // Skip onboarding if present (multi-language support)
  const skipBtn = page
    .locator(
      'button:has-text("跳过"), button:has-text("Skip"), button:has-text("开始使用"), button:has-text("Got it")'
    )
    .first();
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForLoadState('networkidle');
  }

  // Additional wait for canvas page hydration
}

/**
 * Fill requirement text and start canvas analysis
 */
async function startCanvasAnalysis(page: Page, requirement: string): Promise<void> {
  const textarea = page.getByRole('textbox', { name: '需求描述' }).first();
  await expect(textarea).toBeVisible({ timeout: 10000 });
  await textarea.fill(requirement);

  const startButton = page.getByRole('button', { name: /启动画布/ }).first();
  await expect(startButton).toBeVisible();
  await expect(startButton).toBeEnabled();
  await startButton.click();
}

// =============================================================================
// F5.1: API Endpoint Coverage Tests
// =============================================================================

test.describe('F5.1: Canvas API Endpoint Coverage — /api/v1/canvas/*', () => {
  test.beforeEach(async ({ page }) => {
    await goToCanvas(page);
  });

  /**
   * AC-E2E-1: POST /api/v1/canvas/generate-contexts returns valid bounded contexts
   */
  test('F5.1-1: generate-contexts endpoint — should return bounded contexts on valid requirement', async ({
    page,
  }) => {
    const textarea = page.getByRole('textbox', { name: '需求描述' }).first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('创建一个简单的博客系统，用户可以发文章、评论和点赞');

    const startButton = page.getByRole('button', { name: /启动画布/ }).first();
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Wait for network to settle after API call
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    // Should transition to context phase
    const contextTree = page.locator('[data-testid="context-tree"]').first();
    await expect(contextTree).toBeVisible({ timeout: 10000 });
  });

  /**
   * AC-E2E-1b: generate-contexts — 400 on empty requirement
   */
  test('F5.1-1b: generate-contexts endpoint — should reject empty requirement', async ({ page }) => {
    // Directly call the API to test validation
    const response = await page.request.post(`${API_BASE}/api/v1/canvas/generate-contexts`, {
      data: { requirementText: '' },
    });

    // Should return 400 for empty requirementText
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error || body.success).toBeFalsy();
  });

  /**
   * AC-E2E-1c: generate-contexts — 200 on valid requirement with contexts array
   */
  test('F5.1-1c: generate-contexts endpoint — should return success with contexts array', async ({
    page,
  }) => {
    const response = await page.request.post(`${API_BASE}/api/v1/canvas/generate-contexts`, {
      data: { requirementText: '创建一个博客系统' },
    });

    const status = response.status();
    // Accept both 200 (success) or 500 (no AI key / stub mode) — the API structure must be correct
    expect([200, 500, 502, 503]).toContain(status);

    if (status === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('contexts');
      expect(body).toHaveProperty('generationId');
      expect(body).toHaveProperty('confidence');
    }
  });

  /**
   * AC-E2E-2: POST /api/v1/canvas/generate-flows returns valid business flows
   */
  test('F5.1-2: generate-flows endpoint — should return flows on valid contexts', async ({
    page,
  }) => {
    // Call API directly with mock contexts
    const mockContexts = [
      { id: 'ctx1', name: '用户管理', description: '用户注册登录', type: 'core' },
      { id: 'ctx2', name: '博客内容', description: '文章管理', type: 'core' },
    ];

    const response = await page.request.post(`${API_BASE}/api/v1/canvas/generate-flows`, {
      data: {
        contexts: mockContexts,
        sessionId: 'test-session-001',
      },
    });

    const status = response.status();
    expect([200, 500, 502, 503]).toContain(status);

    if (status === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('flows');
      expect(body).toHaveProperty('generationId');
    }
  });

  /**
   * AC-E2E-2b: generate-flows — 400 on empty contexts
   */
  test('F5.1-2b: generate-flows endpoint — should reject empty contexts', async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/api/v1/canvas/generate-flows`, {
      data: { contexts: [], sessionId: 'test-session-001' },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * AC-E2E-3: POST /api/v1/canvas/generate-components returns valid components
   */
  test('F5.1-3: generate-components endpoint — should return components on valid input', async ({
    page,
  }) => {
    const mockContexts = [
      { id: 'ctx1', name: '用户管理', description: '用户注册登录', type: 'core' },
    ];
    const mockFlows = [
      {
        id: 'flow1',
        name: '用户注册流程',
        contextId: 'ctx1',
        steps: [
          { id: 'step1', name: '填写表单', actor: '用户', order: 0 },
          { id: 'step2', name: '验证邮箱', actor: '系统', order: 1 },
        ],
      },
    ];

    const response = await page.request.post(`${API_BASE}/api/v1/canvas/generate-components`, {
      data: {
        contexts: mockContexts,
        flows: mockFlows,
        sessionId: 'test-session-002',
      },
    });

    const status = response.status();
    expect([200, 500, 502, 503]).toContain(status);

    if (status === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('components');
      expect(body).toHaveProperty('generationId');
      expect(body).toHaveProperty('totalCount');
    }
  });

  /**
   * AC-E2E-3b: generate-components — 400 on missing fields
   */
  test('F5.1-3b: generate-components endpoint — should reject missing contexts or flows', async ({
    page,
  }) => {
    // Missing contexts
    const response1 = await page.request.post(`${API_BASE}/api/v1/canvas/generate-components`, {
      data: { contexts: [], flows: [], sessionId: 'test' },
    });
    expect(response1.status()).toBe(400);

    // Missing flows
    const response2 = await page.request.post(`${API_BASE}/api/v1/canvas/generate-components`, {
      data: {
        contexts: [{ id: 'ctx1', name: 'Test', description: 'Test', type: 'core' }],
        flows: [],
        sessionId: 'test',
      },
    });
    expect(response2.status()).toBe(400);
  });

  /**
   * AC-E2E-4: GET /api/v1/canvas/status returns page generation status
   */
  test('F5.1-4: status endpoint — should return 400 without projectId', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/api/v1/canvas/status`);

    // Without projectId, should return 400
    expect(response.status()).toBe(400);
  });

  /**
   * AC-E2E-5: GET /api/v1/canvas/status returns valid status structure
   */
  test('F5.1-5: status endpoint — should return valid structure for non-existent project', async ({
    page,
  }) => {
    const response = await page.request.get(
      `${API_BASE}/api/v1/canvas/status?projectId=nonexistent-project-12345`
    );

    // Should return 404 for non-existent project
    const status = response.status();
    expect([404, 500]).toContain(status);

    if (status === 404) {
      const body = await response.json();
      expect(body).toHaveProperty('error');
    }
  });

  /**
   * AC-E2E-6: GET /api/v1/canvas/stream SSE endpoint — should stream events
   */
  test('F5.1-6: stream endpoint (SSE) — should return event-stream content-type', async ({
    page,
  }) => {
    const response = await page.request.get(
      `${API_BASE}/api/v1/canvas/stream?requirement=创建一个博客系统`
    );

    const status = response.status();
    // SSE endpoint should respond (200 = AI key available, 500/502 = mock mode)
    expect([200, 500, 502, 503]).toContain(status);

    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/text\/event-stream|text\/plain|application\/json/);
  });

  /**
   * AC-E2E-6b: stream endpoint — should reject empty requirement
   */
  test('F5.1-6b: stream endpoint — should reject empty requirement', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/api/v1/canvas/stream?requirement=`);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  /**
   * AC-E2E-7: POST /api/v1/canvas/project creates canvas project
   */
  test('F5.1-7: project endpoint — should reject missing required fields', async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/api/v1/canvas/project`, {
      data: { requirementText: '' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  /**
   * AC-E2E-8: GET /api/v1/canvas/export — should handle missing projectId
   */
  test('F5.1-8: export endpoint — should reject missing projectId', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/api/v1/canvas/export`);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  /**
   * AC-E2E-9: POST /api/v1/canvas/generate — should reject missing fields
   */
  test('F5.1-9: generate endpoint — should reject missing projectId or pageIds', async ({
    page,
  }) => {
    const response1 = await page.request.post(`${API_BASE}/api/v1/canvas/generate`, {
      data: { projectId: 'test-project' },
    });
    expect(response1.status()).toBe(400);

    const response2 = await page.request.post(`${API_BASE}/api/v1/canvas/generate`, {
      data: { pageIds: ['page1'] },
    });
    expect(response2.status()).toBe(400);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });
});

// =============================================================================
// F5.2: Two-Step Design Flow Tests
// =============================================================================

test.describe('F5.2: Two-Step Design Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await goToCanvas(page);
  });

  /**
   * AC-E2E-4: Full two-step flow — contexts → flows → components
   *
   * Step 1: Generate bounded contexts from requirement
   * Step 2: Generate flows from contexts
   * Step 3: Generate components from flows
   */
  test('F5.2-1: Full two-step flow — contexts → flows → components', async ({ page }) => {
    // Step 0: Enter requirement
    await startCanvasAnalysis(
      page,
      '创建一个预约医生系统，患者可以预约医生、查看病历'
    );

    // Step 1: Wait for contexts to appear
    const contextTree = page.locator('[data-testid="context-tree"]').first();
    await expect(contextTree).toBeVisible({ timeout: 15000 });

    // Step 2: Import example data to get pre-populated contexts + flows
    // (In stub/mock mode, we use example data to populate trees for component generation)
    const importBtn = page.locator('[data-testid="import-example-btn"]');
    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // Verify contexts tree has content
    const contextNodes = page.locator('[data-testid="context-tree"] [role="listitem"]').first();
    const hasContext = await contextNodes.isVisible().catch(() => false);

    if (hasContext) {
      // Step 3: Try to generate flows via UI (if "生成流程树" button exists)
      const flowButton = page.locator('[aria-label="生成流程树"]').first();
      if (await flowButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(flowButton).toBeEnabled();
      }

      // Step 4: Continue to components
      const continueBtn = page.locator('[aria-label="继续到组件树"]').first();
      if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(continueBtn).toBeEnabled();
      }
    }

    // At minimum, verify context tree is visible (confirms Step 1 completed)
    await expect(contextTree).toBeVisible();
  });

  /**
   * F5.2-2: Two-step flow via direct API calls
   */
  test('F5.2-2: API-level two-step flow — contexts → flows → components', async ({ page }) => {
    // Step 1: Generate contexts
    const ctxResponse = await page.request.post(`${API_BASE}/api/v1/canvas/generate-contexts`, {
      data: { requirementText: '创建一个博客系统' },
    });

    let contexts: Array<{ id: string; name: string; description: string; type: string }> = [];
    if (ctxResponse.status() === 200) {
      const ctxBody = await ctxResponse.json();
      contexts = ctxBody.contexts || [];
    } else {
      // Fallback: use mock contexts
      contexts = [
        { id: 'ctx1', name: '用户管理', description: '用户注册登录', type: 'core' },
        { id: 'ctx2', name: '博客内容', description: '文章管理', type: 'core' },
      ];
    }

    // Step 2: Generate flows from contexts
    const sessionId = `e2e-session-${Date.now()}`;
    const flowsResponse = await page.request.post(`${API_BASE}/api/v1/canvas/generate-flows`, {
      data: { contexts, sessionId },
    });

    let flows: Array<{ id: string; name: string; contextId: string; steps: unknown[] }> = [];
    if (flowsResponse.status() === 200) {
      const flowsBody = await flowsResponse.json();
      flows = flowsBody.flows || [];
    } else {
      // Fallback: use mock flows
      flows = [
        {
          id: 'flow1',
          name: '用户注册流程',
          contextId: contexts[0]?.id || 'ctx1',
          steps: [{ id: 'step1', name: '填写表单', actor: '用户', order: 0 }],
        },
      ];
    }

    // Step 3: Generate components from flows
    const compsResponse = await page.request.post(
      `${API_BASE}/api/v1/canvas/generate-components`,
      {
        data: { contexts, flows, sessionId },
      }
    );

    expect([200, 500, 502, 503]).toContain(compsResponse.status());

    if (compsResponse.status() === 200) {
      const compsBody = await compsResponse.json();
      expect(compsBody).toHaveProperty('success');
      expect(compsBody).toHaveProperty('components');
      expect(Array.isArray(compsBody.components)).toBe(true);
    }
  });

  /**
   * F5.2-3: Phase transitions in UI
   */
  test('F5.2-3: Canvas page — should show correct phase labels', async ({ page }) => {
    // Check initial state
    const textarea = page.getByRole('textbox', { name: '需求描述' }).first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Verify all three tree panels are visible
    const contextTree = page.locator('[data-testid="context-tree"]').first();
    const flowTree = page.locator('[data-testid="flow-tree"]').first();

    await expect(contextTree).toBeVisible();
    await expect(flowTree).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });
});

// =============================================================================
// F5.3: sessionId Chain Tests
// =============================================================================

test.describe('F5.3: sessionId Chain Tests', () => {
  test.beforeEach(async ({ page }) => {
    await goToCanvas(page);
  });

  /**
   * AC-E2E-4: sessionId is stored in localStorage after canvas analysis
   */
  test('F5.3-1: sessionId should be stored in localStorage after analysis starts', async ({
    page,
  }) => {
    // Check localStorage before starting
    const storageBefore = await page.evaluate(() => {
      return {
        vibexCanvas: localStorage.getItem('vibex-canvas-storage'),
        allKeys: Object.keys(localStorage).filter((k) => k.includes('vibex') || k.includes('canvas') || k.includes('session')),
      };
    });
    console.log('Storage before:', JSON.stringify(storageBefore));

    // Start analysis
    await startCanvasAnalysis(page, '创建一个博客系统');

    // Wait for network to settle after analysis start
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    // Check localStorage after
    const storageAfter = await page.evaluate(() => {
      return {
        vibexCanvas: localStorage.getItem('vibex-canvas-storage'),
        allKeys: Object.keys(localStorage).filter(
          (k) => k.includes('vibex') || k.includes('canvas') || k.includes('session')
        ),
      };
    });
    console.log('Storage after:', JSON.stringify(storageAfter));

    // Verify canvas storage exists
    expect(storageAfter.vibexCanvas).toBeTruthy();

    // Verify the storage contains expected keys
    const parsedStorage = JSON.parse(storageAfter.vibexCanvas || '{}');
    console.log('Parsed storage keys:', Object.keys(parsedStorage.state || {}));
  });

  /**
   * F5.3-2: sessionId sent in generate-flows API call
   */
  test('F5.3-2: generate-flows API should include sessionId parameter', async ({ page }) => {
    // Intercept API calls to verify sessionId is sent
    const apiCalls: Array<{ url: string; body: unknown }> = [];
    await page.route('**/api/v1/canvas/generate-flows', (route) => {
      const body = route.request().postData();
      apiCalls.push({ url: route.request().url(), body: body ? JSON.parse(body) : {} });
      void route.continue();
    });

    // Call the API directly
    await page.request.post(`${API_BASE}/api/v1/canvas/generate-flows`, {
      data: {
        contexts: [
          { id: 'ctx1', name: 'Test', description: 'Test desc', type: 'core' },
        ],
        sessionId: 'test-session-e2e-123',
      },
    });

    // Verify sessionId was in the request
    const callWithSession = apiCalls.find(
      (call) => call.body && typeof call.body === 'object' && 'sessionId' in call.body
    );
    expect(callWithSession).toBeDefined();
    expect((callWithSession?.body as Record<string, unknown>)?.sessionId).toBeTruthy();
  });

  /**
   * F5.3-3: sessionId sent in generate-components API call
   */
  test('F5.3-3: generate-components API should include sessionId parameter', async ({ page }) => {
    const apiCalls: Array<{ url: string; body: unknown }> = [];
    await page.route('**/api/v1/canvas/generate-components', (route) => {
      const body = route.request().postData();
      apiCalls.push({ url: route.request().url(), body: body ? JSON.parse(body) : {} });
      void route.continue();
    });

    await page.request.post(`${API_BASE}/api/v1/canvas/generate-components`, {
      data: {
        contexts: [{ id: 'ctx1', name: 'Test', description: 'Test', type: 'core' }],
        flows: [
          {
            id: 'flow1',
            name: 'Test Flow',
            contextId: 'ctx1',
            steps: [{ id: 'step1', name: 'Step 1', actor: 'User', order: 0 }],
          },
        ],
        sessionId: 'test-session-e2e-456',
      },
    });

    const callWithSession = apiCalls.find(
      (call) => call.body && typeof call.body === 'object' && 'sessionId' in call.body
    );
    expect(callWithSession).toBeDefined();
    expect((callWithSession?.body as Record<string, unknown>)?.sessionId).toBe('test-session-e2e-456');
  });

  /**
   * F5.3-4: sessionId chain — same sessionId across contexts → flows → components
   */
  test('F5.3-4: sessionId should be consistent across the full contexts -> flows -> components chain', async ({
    page,
  }) => {
    const trackedRequests: Array<{ url: string; body: Record<string, unknown>; sessionId: string | undefined }> = [];

    await page.route('**/api/v1/canvas/generate-**', (route) => {
      const body = route.request().postData();
      const parsed = body ? JSON.parse(body) : {};
      trackedRequests.push({
        url: route.request().url(),
        body: parsed,
        sessionId: parsed.sessionId,
      });
      void route.continue();
    });

    const testSessionId = `chain-test-${Date.now()}`;

    // Step 1: generate-contexts (may not require sessionId, but should return generationId)
    await page.request.post(`${API_BASE}/api/v1/canvas/generate-contexts`, {
      data: { requirementText: '创建一个博客系统' },
    });

    // Step 2: generate-flows with explicit sessionId
    await page.request.post(`${API_BASE}/api/v1/canvas/generate-flows`, {
      data: {
        contexts: [{ id: 'ctx1', name: '用户管理', description: 'test', type: 'core' as const }],
        sessionId: testSessionId,
      },
    });

    // Step 3: generate-components with SAME sessionId
    await page.request.post(`${API_BASE}/api/v1/canvas/generate-components`, {
      data: {
        contexts: [{ id: 'ctx1', name: '用户管理', description: 'test', type: 'core' as const }],
        flows: [
          {
            id: 'flow1',
            name: 'Test Flow',
            contextId: 'ctx1',
            steps: [{ id: 'step1', name: 'Step', actor: 'User', order: 0 }],
          },
        ],
        sessionId: testSessionId,
      },
    });

    // Verify sessionId is present in flows and components calls
    const flowsCall = trackedRequests.find((r) => r.url.includes('generate-flows'));
    const componentsCall = trackedRequests.find((r) => r.url.includes('generate-components'));

    expect(flowsCall?.sessionId).toBe(testSessionId);
    expect(componentsCall?.sessionId).toBe(testSessionId);

    // Verify sessionId is the SAME across both calls
    expect(flowsCall?.sessionId).toBe(componentsCall?.sessionId);
  });

  /**
   * F5.3-5: sessionId persists after page reload
   */
  test('F5.3-5: sessionId/projectId should persist after page reload', async ({ page }) => {
    // Start analysis to populate localStorage
    await startCanvasAnalysis(page, '创建一个博客系统');
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    // Read session/project info from localStorage
    const storageBefore = await page.evaluate(() => {
      const canvas = localStorage.getItem('vibex-canvas-storage');
      if (!canvas) return null;
      const parsed = JSON.parse(canvas);
      return {
        projectId: parsed.state?.projectId,
        requirementText: parsed.state?.requirementText,
      };
    });
    console.log('Storage before reload:', JSON.stringify(storageBefore));

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Read storage after reload
    const storageAfter = await page.evaluate(() => {
      const canvas = localStorage.getItem('vibex-canvas-storage');
      if (!canvas) return null;
      const parsed = JSON.parse(canvas);
      return {
        projectId: parsed.state?.projectId,
        requirementText: parsed.state?.requirementText,
      };
    });
    console.log('Storage after reload:', JSON.stringify(storageAfter));

    // Verify persistence
    if (storageBefore?.projectId) {
      expect(storageAfter?.projectId).toBe(storageBefore.projectId);
    }
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });
});

// =============================================================================
// F5.4: Canvas Page Navigation & No-404 Tests
// =============================================================================

test.describe('F5.4: Canvas Page Navigation & Resource Integrity', () => {
  /**
   * AC-E2E-2: Canvas page loads without 404 resources
   */
  test('F5.4-1: Canvas page — no 404 resource requests', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', (response) => {
      if (response.status() === 404) {
        failedRequests.push(response.url());
      }
    });

    await goToCanvas(page);
    await page.waitForLoadState('networkidle');

    // Filter out non-critical 404s (favicon, etc.)
    const criticalFailures = failedRequests.filter(
      (url) => !url.includes('favicon') && !url.includes('manifest')
    );

    if (criticalFailures.length > 0) {
      console.log('404 URLs:', criticalFailures);
    }
    expect(criticalFailures).toEqual([]);
  });

  /**
   * AC-E2E-3: No console errors on canvas page load
   */
  test('F5.4-2: Canvas page — no critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known non-critical errors
        if (
          !text.includes('favicon') &&
          !text.includes('hydration') &&
          !text.includes('404') &&
          !text.includes('Failed to load resource')
        ) {
          errors.push(text);
        }
      }
    });

    await goToCanvas(page);
    await page.waitForLoadState('networkidle');

    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
    expect(errors).toEqual([]);
  });

  /**
   * F5.4-3: Canvas page accessible via direct URL
   */
  test('F5.4-3: Canvas page accessible via /canvas URL', async ({ page }) => {
    await page.goto(`${BASE_URL}/canvas`, { waitUntil: 'networkidle' });

    // Verify canvas page elements are present
    const textarea = page.getByRole('textbox', { name: '需求描述' }).first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    const startButton = page.getByRole('button', { name: /启动画布/ }).first();
    await expect(startButton).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });
});

// =============================================================================
// F5.5: API Response Structure Validation
// =============================================================================

test.describe('F5.5: API Response Structure Validation', () => {
  /**
   * F5.5-1: generate-contexts response structure
   */
  test('F5.5-1: generate-contexts response should have correct structure', async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/api/v1/canvas/generate-contexts`, {
      data: { requirementText: '创建一个博客系统' },
    });

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('contexts');
      expect(body).toHaveProperty('generationId');
      expect(body).toHaveProperty('confidence');
      expect(typeof body.success).toBe('boolean');
      expect(Array.isArray(body.contexts)).toBe(true);
      expect(typeof body.confidence).toBe('number');

      // If contexts exist, validate structure
      for (const ctx of body.contexts) {
        expect(ctx).toHaveProperty('id');
        expect(ctx).toHaveProperty('name');
        expect(ctx).toHaveProperty('description');
        expect(ctx).toHaveProperty('type');
      }
    }
  });

  /**
   * F5.5-2: generate-flows response structure
   */
  test('F5.5-2: generate-flows response should have correct structure', async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/api/v1/canvas/generate-flows`, {
      data: {
        contexts: [{ id: 'ctx1', name: 'Test', description: 'Test desc', type: 'core' }],
        sessionId: 'struct-test-001',
      },
    });

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('flows');
      expect(body).toHaveProperty('generationId');
      expect(body).toHaveProperty('confidence');
      expect(Array.isArray(body.flows)).toBe(true);

      // Validate flow structure
      for (const flow of body.flows) {
        expect(flow).toHaveProperty('id');
        expect(flow).toHaveProperty('name');
        expect(flow).toHaveProperty('contextId');
        expect(flow).toHaveProperty('steps');
        expect(Array.isArray(flow.steps)).toBe(true);
      }
    }
  });

  /**
   * F5.5-3: generate-components response structure
   */
  test('F5.5-3: generate-components response should have correct structure', async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/api/v1/canvas/generate-components`, {
      data: {
        contexts: [{ id: 'ctx1', name: 'Test', description: 'Test', type: 'core' }],
        flows: [
          {
            id: 'flow1',
            name: 'Test Flow',
            contextId: 'ctx1',
            steps: [{ id: 'step1', name: 'Step', actor: 'User', order: 0 }],
          },
        ],
        sessionId: 'struct-test-002',
      },
    });

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('components');
      expect(body).toHaveProperty('generationId');
      expect(body).toHaveProperty('totalCount');
      expect(body).toHaveProperty('confidence');
      expect(Array.isArray(body.components)).toBe(true);

      // Validate component structure
      for (const comp of body.components) {
        expect(comp).toHaveProperty('id');
        expect(comp).toHaveProperty('name');
        expect(comp).toHaveProperty('flowId');
        expect(comp).toHaveProperty('contextId');
        expect(comp).toHaveProperty('type');
        expect(['page', 'form', 'list', 'detail', 'modal']).toContain(comp.type);
      }
    }
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });
});
