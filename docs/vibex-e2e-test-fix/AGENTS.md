# VibeX E2E Test Fix — Agent 协作规范

> **项目**: vibex-e2e-test-fix
> **版本**: v1.0
> **日期**: 2026-04-06
> **作者**: architect agent

---

## 1. 强制规范

### 1.1 测试分层规范（强制）

| 层级 | 工具 | 入口命令 | 文件位置 |
|------|------|----------|----------|
| **E2E** | Playwright | `pnpm run test:e2e` | `tests/e2e/*.spec.ts` |
| **单元** | Vitest | `pnpm run test:unit` | `tests/unit/*.test.ts` |
| **CI 完整** | All | `pnpm run test:ci` | `.github/workflows/test.yml` |

**强制规则**：
- ❌ **禁止**在 `tests/e2e/` 中编写纯逻辑测试（属于单元测试范畴）
- ❌ **禁止**在 `tests/unit/` 中使用 Playwright（属于 E2E 范畴）
- ✅ E2E 测试必须以页面交互为驱动（点击、导航、表单）
- ✅ 单元测试必须隔离外部依赖（网络、文件系统）

### 1.2 Playwright 规范（强制）

#### 1.2.1 Locator 选择器优先级

```typescript
// ✅ 推荐顺序（稳定性从高到低）
1. role       // 无障碍角色，最稳定
   await page.getByRole('button', { name: 'Submit' })

2. label       // 表单标签
   await page.getByLabel('Email address')

3. placeholder // 占位符文本
   await page.getByPlaceholder('Search...')

4. text        // 精确文本
   await page.getByText('Welcome back')

5. test-id     // 显式 data-testid（最后手段）
   await page.getByTestId('submit-button')

// ❌ 禁止使用（脆弱，易受 UI 变更影响）
// - CSS 选择器:  '.submit-btn', '#main'
// - XPath:       '//button[contains(@class, "submit")]'
// - nth 索引:    page.locator('button').nth(0)
```

#### 1.2.2 测试超时控制

```typescript
// 每个 test 必须设置合理的超时
test('Canvas 保存流程', async ({ page }) => {
  test.setTimeout(60000); // 页面级操作 60s

  await page.goto('/editor');
  const saveBtn = page.getByRole('button', { name: 'Save' });
  await saveBtn.click();  // actionTimeout: 15s（默认）

  await expect(page.getByText('Saved')).toBeVisible({ timeout: 10000 });
});
```

#### 1.2.3 页面对象模式（Page Object）

```typescript
// tests/e2e/pages/EditorPage.ts
import { Page, expect } from '@playwright/test';

export class EditorPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/editor');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  get statusMessage() {
    return this.page.getByText('Saved');
  }

  async save() {
    await this.saveButton.click();
    await expect(this.statusMessage).toBeVisible({ timeout: 10000 });
  }
}

// tests/e2e/editor-flow.spec.ts
import { EditorPage } from '../pages/EditorPage';

test('保存编辑器内容', async ({ page }) => {
  const editor = new EditorPage(page);
  await editor.goto();
  await editor.save();
});
```

### 1.3 Vitest 规范（强制）

#### 1.3.1 Mock 规范

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthStore } from '@/stores/auth';

// ✅ 正确：使用 vi.mock 路径别名
vi.mock('@/stores/auth', () => ({
  useAuth: vi.fn(() => ({ user: null, login: vi.fn() })),
}));

// ❌ 错误：mock 具体实现混入测试体
beforeEach(() => {
  vi.mock('@/stores/auth'); // mock 在 beforeEach 中无效
});

// ✅ 正确：带实现的 mock
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    post: vi.fn().mockResolvedValue({ ok: true }),
  },
}));
```

#### 1.3.2 异步测试

```typescript
// ✅ 使用 fake timers 加速异步测试
it('should debounce input', async () => {
  vi.useFakeTimers();
  const fn = vi.fn();

  const debounced = debounce(fn, 300);
  debounced();
  debounced();
  debounced();

  // 快进到 300ms 后
  vi.advanceTimersByTime(300);

  expect(fn).toHaveBeenCalledTimes(1);

  vi.useRealTimers(); // 恢复真实 timers
});
```

### 1.4 环境规范（强制）

#### 1.4.1 环境变量命名

| 变量 | 用途 | 本地默认 | CI 默认 |
|------|------|----------|---------|
| `BASE_URL` | 被测应用 URL | `http://localhost:3000` | `https://vibex.top` |
| `CI` | CI 环境标识 | `false` | `true` |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | 跳过浏览器下载 | - | `1` |

#### 1.4.2 .env 文件规范

```
tests/e2e/.env.test       # E2E 测试环境（不提交）
.env.test.local           # 本地覆盖（不提交）
.env.test.ci              # CI 专用（可提交）
```

❌ **禁止**将真实 API 密钥、数据库凭证写入任何 `.env.*` 文件。

---

## 2. 测试覆盖率要求

### 2.1 覆盖率阈值（强制）

| 测试类型 | 指标 | 阈值 | 报告命令 |
|----------|------|------|----------|
| **单元测试** | 行覆盖 (lines) | ≥ 80% | `pnpm run test:unit:coverage` |
| **单元测试** | 函数覆盖 (functions) | ≥ 80% | 同上 |
| **单元测试** | 分支覆盖 (branches) | ≥ 70% | 同上 |
| **单元测试** | 语句覆盖 (statements) | ≥ 80% | 同上 |
| **E2E 测试** | 关键路径覆盖 | 100% | 人工审查 |

### 2.2 E2E 关键路径（必须覆盖）

| # | 路径名称 | 描述 | 测试文件 |
|---|----------|------|----------|
| 1 | 登录流程 | 完整登录+登出 | `auth-flow.spec.ts` |
| 2 | 项目创建 | 新建→编辑→保存 | `project-flow.spec.ts` |
| 3 | Canvas 交互 | 画布加载+操作 | `canvas-api.spec.ts` |
| 4 | 撤销重做 | 操作撤销+重做 | `undo-redo.spec.ts` |
| 5 | 导出功能 | 多格式导出 | `export-formats.spec.ts` |
| 6 | 冲突解决 | 并发编辑冲突处理 | `conflict-resolution.spec.ts` |
| 7 | 首页导航 | 首页→编辑器导航 | `homepage-flow.spec.ts` |

### 2.3 覆盖率报告检查

```bash
# 覆盖率检查（失败即退出）
pnpm run test:unit:coverage
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "❌ Line coverage $COVERAGE% < 80%"
  exit 1
fi
echo "✅ Coverage passed: $COVERAGE%"
```

### 2.4 覆盖率豁免规则

以下场景可豁免覆盖率要求（需添加注释说明）：

```typescript
// istanbul ignore next: 外部 SDK 封装，无实际逻辑
const analytics = new ThirdPartySDK();
```

---

## 3. 审查清单

### 3.1 PR 提交前检查（Dev Agent 必读）

#### 3.1.1 代码层面

- [ ] **无 `test.skip` 新增**：新增的 `test.skip` 必须经 architect 审批
- [ ] **无 `test.only`**：提交前必须移除所有 `test.only`
- [ ] **无硬编码 URL**：`BASE_URL` 之外禁止硬编码 URL
- [ ] **测试可独立运行**：`pnpm run test:e2e` 和 `pnpm run test:unit` 各自独立成功
- [ ] **无控制台错误**：E2E 测试运行期间无 `console.error`（除预期的错误测试）

#### 3.1.2 E2E 测试规范

- [ ] 使用 `role`/`label`/`text`/`test-id` 选择器（禁止 CSS/XPath/nth）
- [ ] 测试内无 `page.waitForTimeout()`（用 `expect` 替代）
- [ ] 每个 `test()` 有明确超时：`test.setTimeout(60000)`
- [ ] 失败时截图自动保存（`screenshot: 'only-on-failure'`）
- [ ] 测试之间无状态泄漏（使用 `beforeEach` 重置）

#### 3.1.3 单元测试规范

- [ ] 每个文件有 `describe` 块包裹
- [ ] Mock 使用 `vi.mock()` 而非 `vi.fn()` 手动 mock
- [ ] 异步测试正确使用 `async/await`
- [ ] 无 `setTimeout` 实际等待（用 fake timers）
- [ ] `afterEach` 中清理 mocks：`vi.clearAllMocks()`

### 3.2 审查者检查清单（Reviewer Agent 必读）

#### 3.2.1 功能审查

- [ ] 新增测试覆盖了对应功能的边界情况
- [ ] 断言有意义（非 `toBe(true)` 这种无意义断言）
- [ ] 测试描述清晰（`test('登录失败时显示错误提示')` 而非 `test('login test')`）

#### 3.2.2 稳定性审查

- [ ] 无网络依赖（外部 API 调用已被 mock）
- [ ] 无时间依赖（无 `new Date()` 比较）
- [ ] 无并发竞争（`fullyParallel: false` 保证串行）

#### 3.2.3 安全审查

- [ ] 无敏感信息泄漏（凭证、密钥）
- [ ] 测试数据使用 fixture 而非生产数据
- [ ] `BASE_URL` 在 CI 中使用环境变量

### 3.3 CI 失败处理流程

```
CI 失败
  │
  ├─ Lint 失败 ──────────→ Dev 修复 lint 错误
  │
  ├─ Unit 失败 ──────────→ Dev 修复单元测试
  │     ├─ 覆盖率不足 ──→ 增加测试用例
  │     └─ 测试失败 ────→ 修复被测代码或修正测试
  │
  └─ E2E 失败 ───────────→ Dev 调查
        ├─ 偶发性 ────────→ 增加 retries，检查网络
        ├─ 功能回归 ──────→ 修复被测代码
        └─ 环境问题 ──────→ 检查 BASE_URL 和浏览器
```

### 3.4 测试数据规范

```typescript
// ✅ 使用 fixture 生成测试数据
import { test as base } from '@playwright/test';

export const test = base.extend({
  // 每个测试独立的匿名用户
  user: async ({ page }, use) => {
    const user = await createTestUser();
    await use(user);
    await cleanupTestUser(user.id);
  },
});

// tests/e2e/auth-flow.spec.ts
test('匿名用户看到登录入口', async ({ page, user }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
```

### 3.5 性能基准

| 指标 | 目标 | 超时阈值 |
|------|------|----------|
| 单元测试总时长 | < 30s | 60s |
| E2E 单个测试 | < 60s | 90s |
| E2E 完整套件（20 tests） | < 20min | 30min |

---

## 4. 违规处理

| 违规类型 | 处理方式 |
|----------|----------|
| 新增 `test.skip` 未申报 | Architect 审批，24h 内处理 |
| 覆盖率低于阈值 | **阻止合并**，直到达标 |
| 提交 `test.only` | Reviewer 驳回 |
| CI 截图缺失（失败时） | Dev 补录截图后重跑 |
| 硬编码 URL | Reviewer 标记，Dev 修复 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
