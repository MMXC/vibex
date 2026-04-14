# Spec: E3.S1 — Playwright E2E 环境配置

**功能ID**: E3.S1.F1.1, E3.S1.F1.2, E3.S1.F1.3
**Epic**: E3 — E2E 测试基线（Sprint2 范围）
**类型**: Infra / P2
**预估工时**: 4h

---

## 1. 背景

在 Sprint2 中需要基于 Playwright 建立 E2E 测试基线。本阶段完成环境配置，确保后续 E2E 测试可执行。

---

## 2. 验收标准

| # | 验收项 | 断言 |
|---|--------|------|
| 1 | Playwright 及浏览器依赖安装成功 | `npx playwright --version` 正常输出 |
| 2 | `playwright.config.ts` 配置完整（baseURL、timeout、reporter） | 配置文件存在且语法正确 |
| 3 | `npx playwright test` 可运行（即使 0 测试文件） | 退出码 0，无报错 |
| 4 | CI 环境变量配置完成 | CI 中 `BASE_URL` 等变量已设置 |

---

## 3. 实施步骤

### E3.S1.F1.1 — Playwright 安装

```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium
```

### E3.S1.F1.2 — 配置文件

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### E3.S1.F1.3 — CI 环境变量

在 GitHub Actions secrets 中配置：
- `BASE_URL`: 测试环境 URL
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`: 测试账号凭据（可使用临时测试账号）

CI workflow 添加：
```yaml
env:
  BASE_URL: ${{ secrets.BASE_URL }}
  TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
  TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

---

## 4. Definition of Done

- [ ] `playwright` 可执行
- [ ] `playwright.config.ts` 配置完整
- [ ] 可本地 `npx playwright test` 运行
- [ ] CI 中 Playwright 步骤不报错
