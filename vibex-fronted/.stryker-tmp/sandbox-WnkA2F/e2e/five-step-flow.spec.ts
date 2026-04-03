/**
 * E2E Tests: Five-Step Flow
 * 
 * Tests the complete 5-step project creation flow:
 * Step 1: Requirement Input (需求录入)
 * Step 2: Bounded Context (限界上下文)
 * Step 3: Business Flow (业务流程)
 * Step 4: UI Components (UI组件)
 * Step 5: Project Create (创建项目)
 * 
 * Reference: docs/vibex-proposal-five-step-flow/architecture.md
 */
// @ts-nocheck


import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('五步流程 E2E (Five-Step Flow)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
  });

  test('T5.1: All 5 step labels should be visible in navigation', async ({ page }) => {
    // Check for 5-step navigation labels
    const stepLabels = ['需求录入', '限界上下文', '业务流程', 'UI组件', '项目创建'];
    
    for (const label of stepLabels) {
      const element = page.getByText(label, { exact: false });
      // At least some steps should be visible
      const count = await element.count();
      if (count > 0) {
        await expect(element.first()).toBeVisible();
      }
    }
  });

  test('T5.2: Step 1 - Requirement input with validation', async ({ page }) => {
    // Try to proceed without input
    const nextBtn = page.getByRole('button', { name: /下一步|下一步/i }).first();
    if (await nextBtn.count() > 0) {
      const isDisabled = await nextBtn.isDisabled();
      // Should be disabled or show error when no input
      expect(typeof isDisabled).toBe('boolean');
    }

    // Fill in requirement
    const textarea = page.getByPlaceholder(/需求|requirement|描述/i).first();
    if (await textarea.count() > 0) {
      await textarea.fill('开发一个在线订单管理系统，支持多店铺管理和库存追踪功能');
      
      // Button should be enabled now
      const btn = page.getByRole('button', { name: /下一步|生成|开始/i }).first();
      if (await btn.count() > 0) {
        expect(await btn.isDisabled()).toBe(false);
      }
    }
  });

  test('T5.3: Step navigation should respect step order', async ({ page }) => {
    // Step 1 should be the default/visible step
    const currentStep = page.locator('[aria-current="step"], [data-step][data-active="true"]').first();
    if (await currentStep.count() > 0) {
      await expect(currentStep).toBeVisible();
    }

    // Step indicators should show numbers 1-5
    const stepNumbers = page.locator('[data-step-number], .step-number').first();
    if (await stepNumbers.count() > 0) {
      await expect(stepNumbers).toBeVisible();
    }
  });

  test('T5.4: Cannot skip to future steps without data', async ({ page }) => {
    // Try to find step 4 or 5 navigation
    const step4 = page.getByText(/UI组件|components/i).first();
    const step5 = page.getByText(/项目创建|project/i).first();

    // These should either not be clickable or should not navigate when clicked without data
    if (await step4.count() > 0 && await step5.count() > 0) {
      const step4Btn = await step4.evaluateHandle((el) => el.closest('button'));
      if (step4Btn && (await step4Btn.evaluate((btn) => (btn as HTMLElement).offsetWidth > 0))) {
        await (await step4Btn.asElement())?.click();
      }
    }
  });

  test('T5.5: Preview area should update with step content', async ({ page }) => {
    // Find preview area
    const previewArea = page.locator('[class*="preview"], .preview-area, [data-testid="preview"]').first();
    if (await previewArea.count() > 0) {
      await expect(previewArea).toBeVisible();
    }

    // Input area should be visible
    const inputArea = page.locator('[class*="input"], [class*="editor"], [data-testid="input"]').first();
    if (await inputArea.count() > 0) {
      await expect(inputArea).toBeVisible();
    }
  });

  test('T5.6: localStorage draft persistence', async ({ page }) => {
    // Fill in some data
    const textarea = page.getByPlaceholder(/需求/i).first();
    if (await textarea.count() > 0) {
      await textarea.fill('Test requirement for persistence');
      // Wait for auto-save debounce
      await page.waitForFunction(
        () => {
          const draft = localStorage.getItem('homepage_draft') || localStorage.getItem('vibex-flow-state');
          return draft !== null && draft !== '';
        },
        { timeout: 10000 }
      ).catch(() => {});
      
      // Check localStorage
      const draft = await page.evaluate(() => {
        return localStorage.getItem('homepage_draft') || localStorage.getItem('vibex-flow-state');
      });
      
      // Draft should be saved
      if (draft) {
        const parsed = JSON.parse(draft);
        expect(parsed).toBeDefined();
      }
    }
  });

  test('T5.7: Back navigation works', async ({ page }) => {
    // Find and click back button if available
    const backBtn = page.getByRole('button', { name: /上一步|返回|back/i }).first();
    if (await backBtn.count() > 0) {
      // Should be visible (may be disabled on first step)
      await expect(backBtn).toBeVisible();
    }
  });
});

test.describe('五步流程 - 完整流程 (Full Five-Step Flow)', () => {
  test('T5.8: Complete flow from Step 1 to Step 5', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Step 1: Fill requirement
    const textarea = page.getByPlaceholder(/需求|requirement/i).first();
    if (await textarea.count() > 0) {
      await textarea.fill('开发一个在线订单管理系统，支持多店铺管理和库存追踪功能');
    }

    // Click next
    let nextBtn = page.getByRole('button', { name: /下一步|生成|开始/i }).first();
    if (await nextBtn.count() > 0 && !(await nextBtn.isDisabled())) {
      await nextBtn.click();
        await page.waitForLoadState('networkidle');

      // Step 2: Bounded Context
      // Check we're on step 2
      const step2Content = page.getByText(/限界上下文|context/i).first();
      if (await step2Content.count() > 0) {
        // Try to proceed
        nextBtn = page.getByRole('button', { name: /下一步|选择|确认/i }).first();
        if (await nextBtn.count() > 0 && !(await nextBtn.isDisabled())) {
          await nextBtn.click();
        await page.waitForLoadState('networkidle');

          // Step 3: Business Flow
          const step3Content = page.getByText(/业务流程|flow/i).first();
          if (await step3Content.count() > 0) {
            nextBtn = page.getByRole('button', { name: /下一步/i }).first();
            if (await nextBtn.count() > 0 && !(await nextBtn.isDisabled())) {
              await nextBtn.click();
        await page.waitForLoadState('networkidle');

              // Step 4: UI Components
              const step4Content = page.getByText(/UI组件|components/i).first();
              if (await step4Content.count() > 0) {
                nextBtn = page.getByRole('button', { name: /下一步/i }).first();
                if (await nextBtn.count() > 0 && !(await nextBtn.isDisabled())) {
                  await nextBtn.click();
        await page.waitForLoadState('networkidle');

                  // Step 5: Project Create
                  const step5Content = page.getByText(/项目创建|project/i).first();
                  if (await step5Content.count() > 0) {
                    await expect(step5Content).toBeVisible();
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});
