# E2E 截图功能迁移 PRD

**项目**: vibex-e2e-screenshot-fix  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

当前 E2E 测试脚本使用 OpenClaw 的 `browser` 工具进行截图，但该工具在 **headless 服务器环境**中无法正常运行。需要迁移到 Playwright 原生方案。

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 将截图功能从 browser 工具迁移到 Playwright
- 确保 headless 服务器环境下正常运行
- 每个测试点有 expect() 断言
- 截图命名规范明确

### 2.2 Non-Goals
- 不修改业务代码
- 不添加新测试页面
- 不修改现有 Playwright 配置

---

## 3. Epic Breakdown

### Epic 1: Playwright 截图脚本开发 (P0)

| Story | 描述 | 工作量 |
|-------|------|--------|
| Story 1.1 | 创建 e2e-screenshots.spec.ts | 1h |
| Story 1.2 | 添加 expect() 断言验证页面加载 | 0.5h |
| Story 1.3 | 测试脚本本地运行验证 | 0.5h |

### Epic 2: Shell 脚本封装 (P0)

| Story | 描述 | 工作量 |
|-------|------|--------|
| Story 2.1 | 创建 run-e2e-screenshots.sh | 0.5h |
| Story 2.2 | 配置 BASE_URL 和路径变量 | 0.5h |

### Epic 3: 验证与文档 (P1)

| Story | 描述 | 工作量 |
|-------|------|--------|
| Story 3.1 | 验证 headless 模式运行 | 0.5h |
| Story 3.2 | 更新文档说明 | 0.5h |

---

## 4. Test Cases & Acceptance Criteria

### 4.1 测试页面列表

| ID | 页面 | 路径 | 截图文件名 |
|----|------|------|-----------|
| TC-01 | Landing Page | `/landing` | `landing.png` |
| TC-02 | Homepage | `/` | `homepage.png` |
| TC-03 | Login Page | `/auth` | `login-page.png` |
| TC-04 | Dashboard | `/dashboard` | `dashboard.png` |
| TC-05 | Requirements | `/requirements` | `requirements.png` |
| TC-06 | Flow | `/flow` | `flow.png` |
| TC-07 | Project Settings | `/project-settings` | `project-settings.png` |
| TC-08 | Templates | `/templates` | `templates.png` |

### 4.2 TC-01: Landing Page 测试

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 页面加载成功 | `await expect(page).toHaveURL(/\\/landing/)` |
| AC-02 | 主标题可见 | `await expect(page.locator('h1')).toBeVisible()` |
| AC-03存在 | `await | 登录按钮 expect(page.getByRole('button', { name: /登录|login/i })).toBeVisible()` |
| AC-04 | 截图保存成功 | `expect(fs.existsSync(path)).toBe(true)` |
| AC-05 | 截图非空 | `expect(stats.size).toBeGreaterThan(1000)` |

### 4.3 TC-02: Homepage 测试

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 页面加载成功 | `await expect(page).toHaveURL(/\\//)` |
| AC-02 | 页面包含内容 | `await expect(page.locator('body')).not.toBeEmpty()` |
| AC-03 | 无错误提示 | `await expect(page.locator('.error')).not.toBeVisible()` |
| AC-04 | 截图保存成功 | `expect(fs.existsSync(path)).toBe(true)` |

### 4.4 TC-03: Login Page 测试

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 页面加载成功 | `await expect(page).toHaveURL(/\\/auth/)` |
| AC-02 | 邮箱输入框存在 | `await expect(page.getByPlaceholder(/email/i)).toBeVisible()` |
| AC-03 | 密码输入框存在 | `await expect(page.getByPlaceholder(/password/i)).toBeVisible()` |
| AC-04 | 登录按钮存在 | `await expect(page.getByRole('button', { name: /登录|sign in/i })).toBeVisible()` |
| AC-05 | 截图保存成功 | `expect(fs.existsSync(path)).toBe(true)` |

### 4.5 TC-04: Dashboard 测试

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 页面加载成功 | `await expect(page).toHaveURL(/\\/dashboard/)` |
| AC-02 | 项目列表区域存在 | `await expect(page.locator('[class*="project"]')).toBeVisible()` |
| AC-03 | 新建项目按钮存在 | `await expect(page.getByRole('button', { name: /新建|new|create/i })).toBeVisible()` |
| AC-04 | 截图保存成功 | `expect(fs.existsSync(path)).toBe(true)` |

### 4.6 TC-05 ~ TC-08: 通用断言

| # | 验收条件 | 断言示例 |
|---|---------|---------|
| AC-01 | 页面加载成功 | `await expect(page).toHaveURL(new RegExp(path))` |
| AC-02 | 页面无崩溃 | `await expect(page.locator('body')).toBeVisible()` |
| AC-03 | 无严重错误 | `await expect(page.locator('.ant-layout')).toBeVisible()` |
| AC-04 | 截图保存成功 | `expect(fs.existsSync(path)).toBe(true)` |

---

## 5. Screenshot Naming Convention

### 5.1 命名规范

```
{页面名}-{功能点}-{状态}.png

示例:
- landing-hero-loaded.png
- login-form-displayed.png
- dashboard-projects-list.png
```

### 5.2 目录结构

```
tests/e2e/
├── screenshots/
│   └── daily/
│       └── {YYYY-MM-DD}/
│           ├── landing.png
│           ├── homepage.png
│           ├── login-page.png
│           ├── dashboard.png
│           ├── requirements.png
│           ├── flow.png
│           ├── project-settings.png
│           └── templates.png
├── e2e-screenshots.spec.ts
└── run-e2e-screenshots.sh
```

---

## 6. Implementation Details

### 6.1 Playwright 测试文件

```typescript
// tests/e2e/e2e-screenshots.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DATE = new Date().toISOString().split('T')[0];
const SCREENSHOT_DIR = `tests/e2e/screenshots/daily/${DATE}`;

// 确保目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const pages = [
  { name: 'landing', path: '/landing' },
  { name: 'homepage', path: '/' },
  { name: 'login-page', path: '/auth' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'requirements', path: '/requirements' },
  { name: 'flow', path: '/flow' },
  { name: 'project-settings', path: '/project-settings' },
  { name: 'templates', path: '/templates' },
];

for (const { name, path: pagePath } of pages) {
  test(`screenshot: ${name}`, async ({ page }) => {
    // 1. 访问页面
    await page.goto(`${BASE_URL}${pagePath}`);
    
    // 2. 等待加载
    await page.waitForLoadState('networkidle');
    
    // 3. expect 断言
    await expect(page).toHaveURL(new RegExp(pagePath));
    await expect(page.locator('body')).toBeVisible();
    
    // 4. 截图
    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // 5. 验证截图
    const stats = fs.statSync(screenshotPath);
    expect(stats.size).toBeGreaterThan(1000);
  });
}
```

### 6.2 Shell 脚本

```bash
#!/bin/bash
# tests/e2e/run-e2e-screenshots.sh

set -e

DATE=$(date +%Y-%m-%d)
SCREENSHOT_DIR="tests/e2e/screenshots/daily/$DATE"
BASE_URL="${BASE_URL:-http://localhost:3000}"

# 创建目录
mkdir -p "$SCREENSHOT_DIR"

# 运行 Playwright 截图测试
npx playwright test tests/e2e/e2e-screenshots.spec.ts --headed=false

echo "截图完成: $SCREENSHOT_DIR"
```

---

## 7. Definition of Done (DoD)

### 7.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | Playwright 截图脚本创建完成 |
| DoD-2 | 所有 8 个页面测试用例编写完成 |
| DoD-3 | 每个测试用例包含 expect() 断言 |
| DoD-4 | 截图命名符合规范 |
| DoD-5 | 截图保存到正确目录 |
| DoD-6 | Shell 脚本可独立运行 |

### 7.2 质量 DoD

| # | 条件 |
|---|------|
| DoD-7 | headless 模式运行成功 |
| DoD-8 | 截图文件大小 > 1KB |
| DoD-9 | 无运行时错误 |
| DoD-10 | 文档更新完成 |

### 7.3 回归测试

| 场景 | 预期 |
|------|------|
| 运行 screenshot 测试 | 8 个截图文件生成 |
| 查看截图 | 图片清晰可读 |
| 重复运行 | 覆盖已有截图 |

---

## 8. Risk Mitigation

| 风险 | 等级 | 缓解措施 |
|-----|------|---------|
| Playwright 浏览器未安装 | 🟡 中 | 添加 `npx playwright install` 前置检查 |
| 页面加载超时 | 🟢 低 | 设置 30s timeout |
| 目录权限问题 | 🟢 低 | mkdir -p 确保目录存在 |
| BASE_URL 未设置 | 🟢 低 | 脚本默认值 localhost:3000 |

---

## 9. Timeline Estimate

| Epic | 工作量 | 说明 |
|------|--------|------|
| Epic 1: 脚本开发 | 2h | Playwright 测试 + 断言 |
| Epic 2: Shell 封装 | 1h | 运行脚本 |
| Epic 3: 验证文档 | 1h | 测试验证 + 文档 |
| **总计** | **4h** | |

---

## 10. Dependencies

- **前置**: analyze-issue (已完成)
- **依赖**: @playwright/test (已安装)

---

*PRD 完成于 2026-03-05 (PM Agent)*
