# AGENTS.md: VibeX Sprint 2 QA Testing

**Project**: vibex-qa-canvas-dashboard
**Phase**: design-architecture
**Date**: 2026-04-15
**Origin**: docs/vibex-qa-canvas-dashboard/architecture.md

---

## Context

Sprint 2 QA 验收测试。E5（项目持久化）和 E1（Tab State 修复）已完成实现，等待 QA 验证；E6（三树持久化）处于 Phase 2 规划阶段。

**关键约束**: 这是一个 QA 测试项目，不是功能开发项目。所有工作围绕测试补全、验证和执行展开。

---

## Tech Stack Constraints

| Layer | Allowed | Forbidden |
|-------|---------|-----------|
| Unit Testing | Vitest | Jest, Mocha |
| E2E Testing | Playwright | Cypress, Puppeteer |
| Mocking | `vi.mock`, `msw` | 直接修改 `node_modules` |
| API Client | 现有 `httpClient` | 引入新的 HTTP 库 |
| State Management | React Query | Redux Test Utils（除非现有） |

---

## File Change Rules

### 允许修改的文件

| File | 变更类型 |
|------|---------|
| `vibex-fronted/src/components/flow-project/__tests__/ProjectCreationStep.test.tsx` | 补充测试用例 |
| `vibex-fronted/e2e/canvas-project-creation.spec.ts` | 确认/补充 E2E |
| `vibex-fronted/e2e/tab-state.spec.ts` | 新建 |
| `vibex-fronted/tests/api/canvasProject.spec.ts` | 新建（Phase 2）|
| `vibex-fronted/e2e/canvas-three-tree-persistence.spec.ts` | 新建（Phase 2，skip）|
| `vibex-fronted/playwright.config.ts` | 配置调整（如需） |

### 禁止修改的文件

- `vibex-fronted/src/components/flow-project/ProjectCreationStep.tsx` — E5 实现已锁定
- `vibex-fronted/src/app/dashboard/page.tsx` — Dashboard 实现已锁定
- `vibex-fronted/src/services/api/modules/project.ts` — API 实现已锁定
- `vibex-backend/` — 后端代码不在本次 QA 范围

### 原则

> 测试写人，不写死。被测代码不可改，改被测代码走变更流程。

---

## Test Naming Conventions

```
TC-E5-<NN>:  E5 单元测试
TC-E2E-E5-<NN>: E5 E2E 测试
TC-E2E-E1-<NN>: E1 E2E 测试
TC-E2E-E6-<NN>: E6 E2E 测试（Phase 2）
TC-API-E6-<NN>: E6 API 契约测试（Phase 2）
```

---

## Test Code Style

### Vitest 单元测试

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCreationStep } from '../ProjectCreationStep';
import { projectApi } from '@/services/api/modules/project';

vi.mock('@/services/api/modules/project', () => ({
  projectApi: { createProject: vi.fn() },
}));

// 遵循现有模式：mock projectApi，不 mock useRouter
// 每个 test 开头 vi.clearAllMocks()
describe('ProjectCreationStep', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  // ...
});
```

### Playwright E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas Project Creation E2E', () => {
  // 使用 test.skip() 包裹 Phase 2 测试直到 API 实现
  test.skip('three-tree persistence round-trip', async ({ page }) => {
    // Phase 2 测试
  });

  test('Canvas 创建 → Dashboard 可见', async ({ page }) => {
    await page.goto('/canvas');
    // 使用 data-testid 而非 XPath 或 CSS selector
    const btn = page.getByRole('button', { name: /Create Project/i });
    await btn.click();
  });
});
```

---

## Naming Conventions

- **测试文件名**: `*.test.tsx` (Vitest) / `*.spec.ts` (Playwright)
- **测试目录**: `__tests__/` (unit) / `e2e/` (Playwright)
- **Mock 变量**: `mockXXX` 前缀（e.g., `mockCreateProject`）
- **E2E Selector**: 优先 `data-testid` > `getByRole` > `getByText` > CSS

---

## Phase 2 Gate

E6（Phase 2）测试必须满足以下条件才能激活：

1. `/api/v1/canvas/project` 端点已实现并通过 API 契约测试
2. `canvasProject` 双写逻辑已在后端实现
3. E6-U1（API 契约测试）全部 PASS
4. E5 Phase 1 全部测试 PASS

**强制**: Phase 2 测试文件必须用 `test.skip()` 或环境变量 `TEST_PHASE2=1` 控制激活，防止 QA 在功能未就绪时执行失败测试。

```typescript
const isPhase2Enabled = process.env.TEST_PHASE2 === '1';
test.skip('three-tree persistence', isPhase2Enabled ? undefined : 'Phase 2 not ready', async ({ page }) => {
  // ...
});
```

---

## Authentication Handling (E2E)

E2E 测试处理认证有三种方式，优先顺序：

1. **`storageState` fixture**（推荐）: 在 `playwright.config.ts` 中配置全局 `storageState`，预先登录
2. **API mock**: 使用 MSW 拦截 `/api/v1/auth/*` 响应
3. **`page.addCookies()`**: 在每个 test 开头手动设置 cookie

禁止在测试代码中硬编码 token 或将真实 token 提交到仓库。

---

## Performance Thresholds

| Metric | Threshold | Enforcement |
|--------|-----------|-------------|
| 单个 E2E 测试执行时间 | < 60s | `expect.timeout: 30000ms` |
| 单元测试全量执行时间 | < 10s | CI 告警 |
| Dashboard 刷新等待 | 3s | `waitFor({ timeout: 5000 })` |
| React Query 重Fetch | < 500ms | API 性能目标 |

---

## CI/CD Integration

```yaml
# .github/workflows/qa-sprint2.yml
name: Sprint 2 QA
on:
  push:
    branches: [main]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter vibex-fronted test:unit --run
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter vibex-fronted dev &
      - run: sleep 15  # wait for Next.js dev server
      - run: pnpm --filter vibex-fronted test:e2e --project=chromium
```

---

## Defect Handling

| Scenario | Action |
|----------|--------|
| 测试 FAIL（实现 BUG） | 记录到 `docs/vibex-qa-canvas-dashboard/defects.md`，打回 dev 修复 |
| 测试 FAIL（测试 BUG） | 修复测试代码，重跑 |
| Flaky 测试 | 增加 `retries: 3`，记录 flaky 率 |
| Phase 2 API 未就绪 | 激活 `test.skip()` + 环境变量控制 |

---

## Definitions

| Term | Definition |
|------|-----------|
| E5 | Epic 5: Canvas-Dashboard 项目持久化（Phase 1） |
| E1 | Epic 1: Tab State 修复 |
| E6 | Epic 6: 三树数据持久化（Phase 2） |
| TC | Test Case |
| SUT | System Under Test |
| MSW | Mock Service Worker |

---

## References

- PRD: `docs/vibex-qa-canvas-dashboard/prd.md`
- Architecture: `docs/vibex-qa-canvas-dashboard/architecture.md`
- Existing tests: `vibex-fronted/src/components/flow-project/__tests__/ProjectCreationStep.test.tsx`
- Playwright config: `vibex-fronted/playwright.config.ts`
