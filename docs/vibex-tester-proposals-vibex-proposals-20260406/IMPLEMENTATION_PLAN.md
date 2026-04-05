# 实现计划: VibeX 测试体系修复

**项目**: vibex-tester-proposals-vibex-proposals-20260406
**提案来源**: P001, P002, P003, P004, P005
**总工期**: 4.5h
**执行项目**: vibex-e2e-test-fix

---

## Epic E1: E2E 框架修复

**工期**: 2h
**目标**: Playwright E2E 测试独立于 Jest 运行，0 测试失败

### 任务 E1.1: 创建独立 Playwright 配置

**执行人**: tester
**工时**: 0.5h

**操作步骤**:

1. 检查现有 `vibex-frontend/playwright.config.ts`，确认是否已有独立配置
2. 如果没有，创建独立配置：

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html']] : [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

3. 确认 `tests/e2e.spec.ts` 和 `tests/performance/` 路径正确

**验收标准**:
- `pnpm playwright test --project=chromium` 可正常运行
- 无 `Class extends value undefined` 错误
- 至少 1 个 E2E 测试通过

---

### 任务 E1.2: 修改 package.json test 脚本

**执行人**: dev
**工时**: 0.5h

**操作步骤**:

1. 修改 `vibex-frontend/package.json`:

```json
{
  "scripts": {
    "test": "jest --passWithNoTests && vitest run",
    "test:e2e": "playwright test",
    "test:all": "jest --passWithNoTests && vitest run && playwright test"
  }
}
```

2. 移除 `jest-playwright` 相关依赖和配置（如果在 `jest.setup.js` 中）

**验收标准**:
- `pnpm test` 不再加载 Playwright
- `pnpm test:e2e` 独立运行 E2E 测试
- `pnpm test:all` 按顺序运行所有测试

---

### 任务 E1.3: 验证 E2E 测试独立运行

**执行人**: tester
**工时**: 0.5h

**操作步骤**:

1. 启动本地 dev server: `cd vibex-frontend && pnpm dev`
2. 运行: `pnpm playwright test`
3. 检查输出，统计通过/失败数
4. 截图保存测试结果

**验收标准**:
- Playwright 进程成功启动 Chromium
- `tests/e2e.spec.ts` 至少部分测试通过
- 无 fatal 错误（允许部分 E2E 因依赖服务不可用 skip，不允许 crash）

---

### 任务 E1.4: 回归验证

**执行人**: tester
**工时**: 0.5h

**操作步骤**:

1. `pnpm test` — 确认 Jest 测试正常运行
2. `pnpm vitest run` — 确认 Vitest 测试正常运行（如果配置了）
3. `pnpm test:e2e` — 确认 Playwright 测试正常运行
4. 三者之间无交叉污染

**验收标准**:
- `pnpm test` 输出不包含 Playwright 错误
- `pnpm test:e2e` 不加载 Jest globals
- 每个 runner 的进程完全独立

---

## Epic E2: Playwright/Jest 隔离（Pre-existing 失败清除）

**工期**: 1h
**目标**: `pnpm test` 显示 0 失败

### 任务 E2.1: 迁移 Vitest Import 到 Jest 标准

**执行人**: dev
**工时**: 0.5h

**操作步骤**:

修复以下 3 个文件，将 vitest import 替换为 Jest 标准：

#### 文件 1: `src/schemas/auth.test.ts`

```typescript
// 修复前
import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

// 修复后
// 直接使用 Jest globals（无需 import）
// vi.fn() → jest.fn()
// 如果有 vi.mock()，改为 jest.mock()
```

#### 文件 2: `src/lib/api-validation.test.ts`

```typescript
// 修复前
import { describe, it, expect } from 'vitest';

// 修复后
// 直接使用 Jest globals
// remove any 'vi.' calls
```

#### 文件 3: `src/lib/high-risk-validation.test.js`

```javascript
// 修复前
import { describe, it, expect, vi } from 'vitest';

// 修复后
// 移除 vitest import
// vi.fn() → jest.fn()
// vi.mock() → jest.mock()
```

**注意**: 如果文件中有 `import { describe, it, expect } from 'vitest'` 但文件本身使用 `test()` 而非 `it()`，检查实际使用的函数，统一替换。

**验收标准**:
- 3 个文件均可被 Jest 识别和运行
- `pnpm test --testPathPattern="auth|api-validation|high-risk"` 全部通过

---

### 任务 E2.2: 全量测试验证

**执行人**: tester
**工时**: 0.5h

**操作步骤**:

```bash
cd vibex-frontend
pnpm test 2>&1 | tee test-output.log
```

检查输出中：
- 总测试数
- 通过/失败/跳过数量
- 失败列表（应为空）

**验收标准**:
- `pnpm test` 输出 0 FAIL
- 所有之前 failed 的测试现在 passed 或 skipped
- 无新的测试被引入

---

## Epic E3: CI Gate 建立

**工期**: 1h
**目标**: E2E 测试进入 CI 流程，前端 PR 必须通过 /qa 截图验证

### 任务 E3.1: GitHub Actions E2E Step

**执行人**: dev
**工时**: 0.5h

**操作步骤**:

在 `.github/workflows/test.yml` 中添加 Playwright E2E step：

```yaml
  e2e-test:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: [frontend-test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install --with-deps chromium
      - run: pnpm dev &
        env:
          CI: true
      - name: Wait for dev server
        run: npx wait-on http://localhost:3000 --timeout 60000
      - name: Run Playwright tests
        run: pnpm playwright test
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**验收标准**:
- CI pipeline 中 E2E step 存在且可执行
- E2E 失败时 CI 整体 fail
- E2E 通过时 CI 继续或通过

---

### 任务 E3.2: /qa 截图强制检查

**执行人**: reviewer（通过 PR review checklist）
**工时**: 0.5h（非代码时间，流程建立）

**操作步骤**:

1. 在 `.github/pull_request_template.md` 或 `CONTRIBUTING.md` 添加：

```markdown
## 前端变更 /qa 验证

> 所有涉及前端代码变更的 PR，必须附上 gstack `/qa` 截图证据。
>
> 截图要求：
> - 覆盖所有 UI 变更区域
> - 包含控制台无 Error 级别日志截图
> - 文件命名: `qa-<feature-name>-<date>.png`
>
> Reviewer 将在审核时检查此截图，未提供者 PR blocking。
```

2. reviewer 在审核前端 PR 时强制检查截图

**验收标准**:
- PR template 或 CONTRIBUTING.md 包含 /qa 截图要求
- 前端相关 PR 的 description 包含截图上传记录

---

## 实施时间线

```
Day 1 (today)
├── T+0:00 — E1.1 创建独立 Playwright 配置
├── T+0:30 — E1.2 修改 package.json 脚本
├── T+0:30 — E1.3 E2E 测试独立运行验证
├── T+1:00 — E1.4 回归验证（并行）
├── T+1:00 — E2.1 迁移 3 个 vitest 文件
├── T+1:30 — E2.2 全量测试验证
├── T+1:30 — E3.1 GitHub Actions E2E step
└── T+2:00 — E3.2 /qa 截图规范建立

✅ 预计完成: 2h（部分任务并行执行）
```

---

## 验收总览

| Epic | 验收标准 | 验证命令 |
|------|----------|----------|
| E1 | `pnpm playwright test` 正常运行，0 fatal error | `pnpm test:e2e` |
| E1 | E2E 测试与 Jest 完全隔离 | 进程检查 |
| E2 | `pnpm test` 显示 0 FAIL | `pnpm test` |
| E2 | 3 个 pre-existing 失败文件全部修复 | `pnpm test --testPathPattern="auth\|api-validation\|high-risk"` |
| E3 | GitHub Actions E2E step 存在 | 查看 CI yaml |
| E3 | PR template 包含 /qa 要求 | 查看 PR 格式 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
