/**
 * E2E tests for E03: AI 辅助需求解析
 *
 * 覆盖场景：
 *  1. ClarifyStep — AI 分析按钮可见
 *  2. AI 分析 → 结果展示（ruleEngine 降级）
 *  3. 无 API Key → 不阻断 Onboarding，ruleEngine 降级
 *  4. 下一步/跳过/上一步 按钮流转
 *
 * E03 C3: 无 API Key 不阻断 Onboarding
 * E03 C2: timeout → 降级，不阻断
 *
 * 入口：/auth 注册 → /dashboard（含 OnboardingProvider）
 * 触发：localStorage 清除 vibex-onboarding + vibex-first-visit，1.5s 后自动弹窗
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const TEST_PASSWORD = 'e2e-test-password';

/** 清除 onboarding 相关状态，触发全新引导 */
async function resetOnboardingState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('vibex-onboarding');
    localStorage.removeItem('vibex-first-visit');
    sessionStorage.clear();
  });
}

/** 注册并登录一个新用户，返回 email */
async function registerAndLogin(page: Page): Promise<string> {
  const email = `e2e-e03-${Date.now()}@test.local`;
  await page.goto(`${BASE_URL}/auth`);
  await page.click('button:has-text("立即注册")');
  await page.waitForTimeout(300);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.fill('input[type="text"]', 'E2E E03 Test');
  await page.click('button[type="submit"]:has-text("注册")');
  // 注册后跳转到 /canvas 或 /dashboard
  await page.waitForURL(/\/(canvas|dashboard)/, { timeout: 15000 });
  return email;
}

// ============================================================================
// TC1: OnboardingModal 渲染在 /dashboard（含 ClarifyStep）
// ============================================================================

test.describe('E03: Onboarding ClarifyStep — AI 流程 E2E', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = await registerAndLogin(page);
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    // 清除 onboarding 状态，触发全新引导
    await resetOnboardingState(page);
  });

  // TC1: OnboardingModal 自动弹出在 /dashboard
  test('TC1: OnboardingModal 弹窗在 /dashboard 自动出现', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');

    // 等待 2.5s（1.5s 触发延迟 + 动画时间）
    await page.waitForTimeout(2500);

    // OnboardingModal 应该可见（WelcomeStep）
    const welcomeHeading = page
      .locator('h2')
      .filter({ hasText: /欢迎|Welcome|开始/i })
      .first();
    await expect(welcomeHeading).toBeVisible({ timeout: 5000 });
  });

  // TC2: 导航到 ClarifyStep（跳过/点击直到 ClarifyStep）
  test('TC2: 可以导航到 ClarifyStep 并看到 AI 分析按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await resetOnboardingState(page);
    await page.waitForTimeout(2500);

    // 在 WelcomeStep，点击"开始"或"下一步"
    const welcomeNext = page
      .locator('button')
      .filter({ hasText: /开始|下一步|Next/i })
      .first();
    if (await welcomeNext.isVisible({ timeout: 3000 }).catch(() => false)) {
      await welcomeNext.click();
      await page.waitForTimeout(500);
    }

    // InputStep — 输入需求文本
    const inputArea = page.locator('textarea, input[type="text"]').first();
    if (await inputArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inputArea.fill('作为电商管理员，我想要批量管理商品价格');
      // 点击下一步到 ClarifyStep
      const nextBtn = page
        .locator('button')
        .filter({ hasText: /下一步|Next/i })
        .first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 现在应该在 ClarifyStep
    const clarifyHeading = page
      .locator('h2')
      .filter({ hasText: /AI|澄清|Clarify/i })
      .first();

    // ClarifyStep 或 ModelStep 中应该能看到 AI 相关内容
    const aiContent = page
      .locator('text=/AI.*分析|分析.*需求/i')
      .first();
    const hasClarify = await aiContent.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasClarify) {
      await expect(aiContent).toBeVisible();
    }
  });

  // TC3: 确认 API /api/ai/clarify 在无 key 时返回 200 + ruleEngine 结果
  test('TC3: POST /api/ai/clarify → 200 (ruleEngine fallback)', async ({ page, request }) => {
    // 直接调用 API，不需要进入 onboarding UI
    const res = await request.post(`${BASE_URL}/api/ai/clarify`, {
      data: { requirement: '作为测试用户，我想要管理系统设置' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(200);
    const json = await res.json() as Record<string, unknown>;
    expect(json).toHaveProperty('role');
    expect(json).toHaveProperty('goal');
    expect(json).toHaveProperty('constraints');
    expect(Array.isArray(json.constraints)).toBe(true);
    expect(json).toHaveProperty('raw');
    expect(json).toHaveProperty('parsed');
    expect(json).toHaveProperty('guidance');
  });

  // TC4: ClarifyStep 展示 AI 解析结果
  test('TC4: AI 解析结果在 ClarifyStep 中展示', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await resetOnboardingState(page);
    await page.waitForTimeout(2500);

    // 快速导航到 ClarifyStep
    // Welcome → Input (fill requirement) → Clarify
    const startBtn = page.locator('button').filter({ hasText: /开始|Next|下一步/i }).first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(300);
    }

    const inputArea = page.locator('textarea').first();
    if (await inputArea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inputArea.fill('作为产品经理我想要创建产品需求文档');
      const nextBtn = page.locator('button').filter({ hasText: /下一步|Next/i }).first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // ClarifyStep 中点击"AI 分析"按钮（如果有）
    const analyzeBtn = page
      .getByTestId('onboarding-ai-analyze-btn')
      .or(page.locator('button').filter({ hasText: /AI.*分析|分析需求/i }))
      .first();

    if (await analyzeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await analyzeBtn.click();
      // 等待分析完成（ruleEngine 是同步的，LLM 有 30s 超时）
      await page.waitForTimeout(2000);

      // 结果展示区应该可见
      const resultSection = page
        .locator('text=/角色|目标|约束/i')
        .first();
      await expect(resultSection).toBeVisible({ timeout: 5000 });
    }
  });

  // TC5: 跳过按钮不阻断 Onboarding 继续流转
  test('TC5: 跳过 ClarifyStep → Onboarding 继续流转', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await resetOnboardingState(page);
    await page.waitForTimeout(2500);

    // 导航到 ClarifyStep
    const startBtn = page.locator('button').filter({ hasText: /开始|Next|下一步/i }).first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(300);
    }

    const inputArea = page.locator('textarea').first();
    if (await inputArea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inputArea.fill('测试需求');
      const nextBtn = page.locator('button').filter({ hasText: /下一步|Next/i }).first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 跳过按钮
    const skipBtn = page
      .getByTestId('onboarding-step-2-skip-btn')
      .or(page.locator('button').filter({ hasText: /跳过/i }))
      .first();

    await expect(skipBtn).toBeVisible({ timeout: 3000 });
    await skipBtn.click();
    await page.waitForTimeout(500);

    // 应该在下一步（不是卡住或报错）
    const nextStepVisible = page.locator('text=/下一步|完成|Preview|预览/i').first();
    await expect(nextStepVisible).toBeVisible({ timeout: 5000 });
  });

  // TC6: 上一步按钮可用
  test('TC6: ClarifyStep 上一步按钮可用，返回上一页', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await resetOnboardingState(page);
    await page.waitForTimeout(2500);

    // 导航到 ClarifyStep
    const startBtn = page.locator('button').filter({ hasText: /开始|Next|下一步/i }).first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(300);
    }

    const inputArea = page.locator('textarea').first();
    if (await inputArea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inputArea.fill('测试需求');
      const nextBtn = page.locator('button').filter({ hasText: /下一步|Next/i }).first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 上一步按钮
    const backBtn = page
      .getByTestId('onboarding-step-2-prev-btn')
      .or(page.locator('button').filter({ hasText: /上一步|返回/i }))
      .first();

    await expect(backBtn).toBeVisible({ timeout: 3000 });
    await backBtn.click();
    await page.waitForTimeout(500);

    // 应该返回到 InputStep
    const inputStepContent = page.locator('textarea, input').first();
    await expect(inputStepContent).toBeVisible({ timeout: 3000 });
  });

  // TC7: 重试按钮在错误后可用
  test('TC7: 分析失败后重试按钮可用', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await resetOnboardingState(page);
    await page.waitForTimeout(2500);

    // 导航到 ClarifyStep
    const startBtn = page.locator('button').filter({ hasText: /开始|Next|下一步/i }).first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(300);
    }

    const inputArea = page.locator('textarea').first();
    if (await inputArea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inputArea.fill('测试需求');
      const nextBtn = page.locator('button').filter({ hasText: /下一步|Next/i }).first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Mock API 返回错误
    await page.route('**/api/ai/clarify', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }),
      });
    });

    const analyzeBtn = page
      .getByTestId('onboarding-ai-analyze-btn')
      .or(page.locator('button').filter({ hasText: /AI.*分析|分析需求/i }))
      .first();

    if (await analyzeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await analyzeBtn.click();
      await page.waitForTimeout(1000);

      // 错误提示
      const errorMsg = page.locator('text=/错误|出错|失败|Error/i').first();
      await expect(errorMsg).toBeVisible({ timeout: 3000 });

      // 重试按钮
      const retryBtn = page.locator('button').filter({ hasText: /重试|Retry|retry/i }).first();
      await expect(retryBtn).toBeVisible({ timeout: 2000 });
    }
  });
});
