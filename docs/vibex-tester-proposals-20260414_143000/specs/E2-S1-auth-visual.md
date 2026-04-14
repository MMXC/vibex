# Spec: E2.S1 — Auth Dark Theme 视觉回归测试

**功能ID**: E2.S1.F1.1, E2.S1.F1.2
**Epic**: E2 — Sprint1 提案配套测试
**类型**: Test / P1
**预估工时**: 2h

---

## 1. 背景

Auth 模块（登录 + 注册）在 dark theme 下存在视觉 regression 风险。需建立视觉回归测试，防止样式变更引入问题。

---

## 2. 验收标准

| # | 验收项 | 断言 |
|---|--------|------|
| 1 | 登录页 dark theme 截图与 baseline diff < 阈值（或 CI diff URL 可用） | `expect(diffPercent).toBeLessThan(5)` |
| 2 | 注册页 dark theme 截图与 baseline diff < 阈值 | `expect(diffPercent).toBeLessThan(5)` |
| 3 | 测试在 CI 中稳定通过（无 flaky） | 连续 3 次 CI run 均通过 |

---

## 3. 实施步骤

### 登录页测试 (E2.S1.F1.1)

1. 启动前端开发服务器（或使用 `preview` 模式）
2. 访问 `/login`
3. 切换至 dark theme（通过 localStorage 或 UI toggle）
4. 等待页面稳定（`waitForLoadState('networkidle')`）
5. 截图保存至 `tests/visual/baseline/login-dark.png`
6. 运行 Playwright 视觉对比（或使用 `@playwright/test` 内置 screenshot 功能）
7. 若 diff > 5%，人工审查 diff 图片决定接受或修复

### 注册页测试 (E2.S1.F1.2)

1. 访问 `/register`
2. 重复登录页步骤 3-7

### 工具选型

推荐使用 Playwright 内置 screenshot 配合 `pixelmatch` 或 CI 服务（Arskan、Percy）存储 baseline。

---

## 4. 测试用例

```typescript
// tests/e2e/visual/auth-dark-theme.spec.ts
import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Auth Dark Theme Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // 强制 dark theme
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
  });

  test('登录页 dark theme 无视觉 regression', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-dark.png', { maxDiffPixels: 500 });
  });

  test('注册页 dark theme 无视觉 regression', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('register-dark.png', { maxDiffPixels: 500 });
  });
});
```

---

## 5. Definition of Done

- [ ] 登录页 dark theme 视觉测试 ×1 通过
- [ ] 注册页 dark theme 视觉测试 ×1 通过
- [ ] Baseline 截图已提交仓库
- [ ] CI 视觉回归步骤通过
