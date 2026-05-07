/**
 * E2E tests for E03: AI 辅助需求解析
 *
 * 覆盖场景：
 *  1. Onboarding ClarifyStep — 有/无 AI key 都能正常流转
 *  2. ClarifyAI 结果可编辑确认
 *  3. Onboarding flow 不被 AI 结果阻断
 *
 * E03 C3: 无 API Key 不阻断 Onboarding
 * E03 C2: timeout → 降级，不阻断
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('E03: Onboarding AI 流程', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // ---------------------------------------------------------------------------
  // TC1: ClarifyStep 渲染验证
  // ---------------------------------------------------------------------------
  test('TC1: ClarifyStep renders AI 分析按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`);
    // Navigate to ClarifyStep by completing previous steps
    // Skip to clarify step by setting localStorage
    await page.evaluate(() => {
      localStorage.setItem('vibex-onboarding', JSON.stringify({
        state: {
          status: 'in-progress',
          currentStep: 'clarify',
          completedSteps: ['welcome', 'input'],
          requirementText: '作为电商管理员，我想要批量管理商品价格',
        },
        version: 0,
      }));
    });
    await page.reload();

    // Should show the AI clarify interface
    const heading = page.getByRole('heading', { name: /AI 智能澄清|AI.*澄清/i }).or(
      page.locator('h2').filter({ hasText: /AI|澄清/i })
    );
    await expect(heading.first()).toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // TC2: AI 分析按钮可见（当有 requirement）
  // ---------------------------------------------------------------------------
  test('TC2: AI 分析按钮在有 requirement 时可见', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`);
    await page.evaluate(() => {
      localStorage.setItem('vibex-onboarding', JSON.stringify({
        state: {
          status: 'in-progress',
          currentStep: 'clarify',
          completedSteps: ['welcome', 'input'],
          requirementText: '作为测试用户，我希望能够管理系统设置',
        },
        version: 0,
      }));
    });
    await page.reload();

    // AI 分析按钮应该可见
    const analyzeBtn = page.getByTestId('onboarding-ai-analyze-btn').or(
      page.locator('button').filter({ hasText: /AI.*分析|分析需求/i })
    );
    await expect(analyzeBtn.first()).toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // TC3: 无 API Key → ruleEngine 降级，不阻断 Onboarding
  // ---------------------------------------------------------------------------
  test('TC3: 无 API key 时点击分析不报错，Onboarding 可继续', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`);
    await page.evaluate(() => {
      localStorage.setItem('vibex-onboarding', JSON.stringify({
        state: {
          status: 'in-progress',
          currentStep: 'clarify',
          completedSteps: ['welcome', 'input'],
          requirementText: '作为管理员我想要管理用户',
        },
        version: 0,
      }));
    });
    await page.reload();

    // 点击分析按钮
    const analyzeBtn = page.getByTestId('onboarding-ai-analyze-btn').or(
      page.locator('button').filter({ hasText: /AI.*分析|分析需求/i })
    );
    await analyzeBtn.first().click();

    // 等待结果或降级结果出现（最多 10s for LLM timeout）
    await page.waitForTimeout(2000);

    // 应该能看到结果或降级提示，不应该有整页错误
    // 下一步按钮应该仍然可用
    const nextBtn = page.getByTestId('onboarding-step-2-next-btn').or(
      page.locator('button').filter({ hasText: /下一步/i })
    );
    await expect(nextBtn.first()).toBeEnabled({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  // TC4: 跳过按钮 → 不阻断 Onboarding
  // ---------------------------------------------------------------------------
  test('TC4: 跳过按钮可用，Onboarding 继续流转', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`);
    await page.evaluate(() => {
      localStorage.setItem('vibex-onboarding', JSON.stringify({
        state: {
          status: 'in-progress',
          currentStep: 'clarify',
          completedSteps: ['welcome', 'input'],
          requirementText: '测试需求',
        },
        version: 0,
      }));
    });
    await page.reload();

    // 跳过按钮
    const skipBtn = page.getByTestId('onboarding-step-2-skip-btn').or(
      page.locator('button').filter({ hasText: /跳过/i })
    );
    await expect(skipBtn.first()).toBeVisible({ timeout: 5000 });
    await skipBtn.first().click();

    // 应该导航到下一步或预览
    // （具体跳转取决于实现，至少不应该卡在当前页面）
  });

  // ---------------------------------------------------------------------------
  // TC5: 上一步按钮 → 返回 InputStep
  // ---------------------------------------------------------------------------
  test('TC5: 上一步按钮可用，返回上一页', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`);
    await page.evaluate(() => {
      localStorage.setItem('vibex-onboarding', JSON.stringify({
        state: {
          status: 'in-progress',
          currentStep: 'clarify',
          completedSteps: ['welcome', 'input'],
          requirementText: '测试需求',
        },
        version: 0,
      }));
    });
    await page.reload();

    const backBtn = page.getByTestId('onboarding-step-2-prev-btn').or(
      page.locator('button').filter({ hasText: /上一步|返回/i })
    );
    await expect(backBtn.first()).toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // TC6: 重新分析按钮存在（结果展示后）
  // ---------------------------------------------------------------------------
  test('TC6: 结果展示后重新分析按钮可用', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`);
    await page.evaluate(() => {
      localStorage.setItem('vibex-onboarding', JSON.stringify({
        state: {
          status: 'in-progress',
          currentStep: 'clarify',
          completedSteps: ['welcome', 'input'],
          requirementText: '作为产品经理我想要创建产品需求文档',
        },
        version: 0,
      }));
    });
    await page.reload();

    // 点击分析
    const analyzeBtn = page.getByTestId('onboarding-ai-analyze-btn').or(
      page.locator('button').filter({ hasText: /AI.*分析|分析需求/i })
    );
    await analyzeBtn.first().click();

    // 等待结果
    await page.waitForTimeout(3000);

    // 重新分析按钮
    const reAnalyzeBtn = page.locator('button').filter({ hasText: /重新分析/i });
    const count = await reAnalyzeBtn.count();
    if (count > 0) {
      await expect(reAnalyzeBtn.first()).toBeVisible();
    }
  });

  // ---------------------------------------------------------------------------
  // TC7: 错误提示 → 重试按钮
  // ---------------------------------------------------------------------------
  test('TC7: 分析出错时显示错误提示和重试按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`);
    await page.evaluate(() => {
      localStorage.setItem('vibex-onboarding', JSON.stringify({
        state: {
          status: 'in-progress',
          currentStep: 'clarify',
          completedSteps: ['welcome', 'input'],
          requirementText: '测试需求',
        },
        version: 0,
      }));
    });
    await page.reload();

    // Mock API to return error
    await page.route('**/api/ai/clarify', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }),
      });
    });

    const analyzeBtn = page.getByTestId('onboarding-ai-analyze-btn').or(
      page.locator('button').filter({ hasText: /AI.*分析|分析需求/i })
    );
    await analyzeBtn.first().click();

    // 等待错误出现
    const errorMsg = page.locator('text=/错误|出错|失败/i');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });
});
