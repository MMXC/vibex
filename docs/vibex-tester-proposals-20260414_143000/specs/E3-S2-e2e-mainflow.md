# Spec: E3.S2 — E2E 主流程测试

**功能ID**: E3.S2.F1.1, E3.S2.F1.2, E3.S2.F1.3
**Epic**: E3 — E2E 测试基线（Sprint2 范围）
**类型**: Test / P2
**预估工时**: 4h

---

## 1. 背景

建立 E2E 主流程（登录 → 创建 Canvas → 保存）冒烟测试，覆盖用户关键路径。

---

## 2. 验收标准

| # | 验收项 | 断言 |
|---|--------|------|
| 1 | 有效凭据登录成功，UI 跳转至 dashboard | `expect(page).toHaveURL('/dashboard')` |
| 2 | 无效凭据登录失败，显示错误信息 | `expect(page.getByText('Invalid')).toBeVisible()` |
| 3 | 创建 Canvas 并保存成功 | `expect(page.getByText('Saved')).toBeVisible()` |
| 4 | 完整主流程（login → create → save）在 CI 中通过 | `expect(exitCode).toBe(0)` |

---

## 3. 实施步骤

### E3.S2.F1.1 — 登录流程

**Happy Path**:
1. 访问 `/login`
2. 输入有效凭据
3. 点击登录
4. 断言跳转到 `/dashboard`

**Sad Path**:
1. 访问 `/login`
2. 输入无效凭据
3. 断言错误提示显示

### E3.S2.F1.2 — 创建 + 保存

1. 已登录状态访问 `/canvas/new`
2. 填写必要字段（name = `Test Canvas E2E ${Date.now()}`）
3. 点击保存
4. 断言保存成功提示
5. 断言 URL 变为 `/canvas/{id}`

### E3.S2.F1.3 — 主流程冒烟测试

串联 E3.S2.F1.1 和 E3.S2.F1.2，覆盖完整用户路径。

---

## 4. 测试用例

```typescript
// tests/e2e/main-flow.spec.ts
import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'password123',
};

test.describe('E2E Main Flow', () => {
  test('有效凭据登录成功', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('无效凭据登录失败', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
  });

  test('创建 Canvas 并保存', async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard');

    // 创建
    await page.goto('/canvas/new');
    const canvasName = `Test Canvas E2E ${Date.now()}`;
    await page.getByLabel('Name').fill(canvasName);
    await page.getByRole('button', { name: 'Save' }).click();

    // 断言保存成功
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
    // 断言 URL 变为带 ID 的路径
    await expect(page.url()).toMatch(/\/canvas\/[\w-]+$/);
  });
});
```

---

## 5. Definition of Done

- [ ] 登录 E2E 测试（有效+无效凭据）通过
- [ ] 创建 + 保存 E2E 测试通过
- [ ] 完整主流程冒烟测试在 CI 中通过
- [ ] Playwright 截图/screenshot 在失败时自动保存
