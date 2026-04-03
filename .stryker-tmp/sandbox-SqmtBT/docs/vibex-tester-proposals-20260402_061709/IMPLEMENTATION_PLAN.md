# VibeX 测试改进 — 实施计划

**文档版本**: v1.0
**编写日期**: 2026-04-02
**编写角色**: Architect
**项目**: vibex-tester-proposals-20260402_061709

---

## 目录

1. [实施概览](#1-实施概览)
2. [Phase 1 — 修复测试阻塞问题（1-2 天）](#2-phase-1--修复测试阻塞问题1-2-天)
3. [Phase 2 — 建立 Playwright E2E 基础（2-3 天）](#3-phase-2--建立-playwright-e2e-基础2-3-天)
4. [Phase 4-3-视觉回归--用户旅程（3-4 天）](#4-phase-3--视觉回归--用户旅程3-4-天)
5. [测试执行计划](#5-测试执行计划)
6. [回滚计划](#6-回滚计划)
7. [验收检查清单](#7-验收检查清单)

---

## 1. 实施概览

### 1.1 Sprint 分解

| Phase | Epic | 工时 | Sprint | 负责人 |
|-------|------|------|--------|-------|
| Phase 1 | Epic 1: 修复测试阻塞问题 | 1-2d | Sprint 1 | dev + tester |
| Phase 2 | Epic 2: 建立 Playwright E2E 基础 | 2-3d | Sprint 2 | tester + dev |
| Phase 3 | Epic 3: 视觉回归 + 用户旅程 | 3-4d | Sprint 3 | tester |

**总工时**: 6-9 人天

### 1.2 文件修改清单

| 序号 | 文件路径 | 操作 | Epic |
|------|---------|------|------|
| 1 | `vibex-fronted/jest.config.ts` | 修改 | S1.4 快慢套件分离 |
| 2 | `vibex-fronted/src/components/canvas/BoundedContextTree.test.tsx` | 修改 | S1.2 E1 用例 |
| 3 | `vibex-fronted/src/components/canvas/ComponentTree.test.tsx` | 修改 | S1.2 E2 用例 |
| 4 | `vibex-fronted/src/lib/canvas/__tests__/canvasStoreEpic1.test.ts` | 新增 | S1.1 store alias |
| 5 | `AGENTS.md` | 修改 | S1.3 DoD 明确 |
| 6 | `vibex-fronted/playwright-canvas-crash-test.config.cjs` | 修改 | S2.1 chromium only |
| 7 | `vibex-fronted/tests/e2e/canvas-tree-load.spec.ts` | 新增 | S2.2 T1 |
| 8 | `vibex-fronted/tests/e2e/canvas-node-select.spec.ts` | 新增 | S2.3 T2 |
| 9 | `vibex-fronted/tests/e2e/canvas-node-confirm.spec.ts` | 新增 | S2.4 T3 |
| 10 | `vibex-fronted/tests/e2e/canvas-style-change.spec.ts` | 新增 | S2.5 T4 |
| 11 | `vibex-fronted/tests/fixtures/canvasStore.fixture.ts` | 新增 | S2.7 fixture |
| 12 | `.github/workflows/e2e.yml` | 新增 | S2.6 CI 集成 |
| 13 | `vibex-fronted/tests/visual-baselines/` | 新增（目录）| S3.2 baseline |
| 14 | `vibex-fronted/tests/visual/canvas-visual.spec.ts` | 新增 | S3.1 pixelmatch |
| 15 | `vibex-fronted/tests/e2e/user-journey-create-project.spec.ts` | 新增 | S3.3 旅程1 |
| 16 | `vibex-fronted/tests/e2e/user-journey-generate-export.spec.ts` | 新增 | S3.4 旅程2 |
| 17 | `tsconfig.json` | 修改 | S3.5 TS strict |
| 18 | `commitlint.config.js` | 新增 | S3.6 commit lint |
| 19 | `package.json` | 修改 | S1.4 / S3.6 scripts |
| 20 | `docs/testing/component-state-naming.md` | 新增 | S3.5 命名规范 |

### 1.3 前置条件

- [ ] `cd /root/.openclaw/vibex/vibex-fronted` 执行所有命令
- [ ] Node.js 20+, pnpm 已安装
- [ ] `npx playwright install chromium` 已执行

---

## 2. Phase 1 — 修复测试阻塞问题（1-2 天）

### Sprint 1: Epic 1 实施步骤

---

#### S1.1: 修复 Jest 路径别名（0.5 天）

**目标**: 确保 `@/lib/canvas/canvasStore` 在 Jest 测试中正确解析

**步骤**:

```bash
# 1. 检查当前 jest.config.ts alias 配置
cat jest.config.ts | grep -A5 moduleNameMapper

# 2. 确认 @/ alias 映射到 src/
# 当前已配置: '^@/(.*)$': '<rootDir>/src/$1'
# 若缺失，补全
```

**验证命令**:
```bash
cd vibex-fronted
npm run test -- --testPathPattern="BoundedContextTree" --passWithNoTests
# 应退出码 0，无 "Cannot find module '@/lib/canvas/canvasStore'" 错误
```

**回滚**: 还原 `jest.config.ts` 的 `moduleNameMapper` 配置

---

#### S1.2: 修复 E1/E2 测试用例（0.5 天）

**目标**: `BoundedContextTree.test.tsx` 和 `ComponentTree.test.tsx` 包含 E1/E2 断言

**步骤**:

**E1 测试（修改 `src/components/canvas/BoundedContextTree.test.tsx`）**:

```typescript
// 在现有 describe 块中添加：
describe('E1: Checkbox 单选行为', () => {
  it('E1: 渲染单个 checkbox，无重复', () => {
    render(<BoundedContextTree />);
    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(1);
  });
});
```

**E2 测试（修改 `src/components/canvas/ComponentTree.test.tsx`）**:

```typescript
// 在现有 describe 块中添加：
describe('E2: Checkbox 位置验证', () => {
  it('E2: checkbox 位于 .node-item 内部', () => {
    const { container } = render(<ComponentTree nodes={mockNodes} />);
    const nodeItem = container.querySelector('.node-item');
    const checkbox = nodeItem?.querySelector('.checkbox');
    expect(checkbox).toBeInTheDocument();
  });
});
```

**验证命令**:
```bash
npm run test -- --testPathPattern="BoundedContextTree"
npm run test -- --testPathPattern="ComponentTree"
# 均应 exit 0
```

**回滚**: 保留原文件 git 版本，通过 `git checkout` 还原

---

#### S1.3: 明确 DoD 测试准备要求（0.25 天）

**目标**: AGENTS.md 中 DoD 包含测试准备约束

**步骤**:

在 `AGENTS.md` 的 DoD 列表中增加：

```markdown
## DoD (Definition of Done)
- [ ] 代码实现完成
- [ ] 单元测试通过（`npm run test:unit` 退出码为 0）
- [ ] 测试文件与实现同步更新（不得遗留陈旧测试）
- [ ] E2E 测试覆盖（如涉及 UI 交互）
- [ ] PR checklist 包含测试相关检查项
- [ ] 可执行断言描述具体可验证（不满足则 PR 不可合并）
```

**验证命令**:
```bash
grep -c "测试文件与实现同步" AGENTS.md
# 应输出 1
```

**回滚**: 还原 AGENTS.md

---

#### S1.4: npm test 快慢套件分离（0.5 天）

**目标**: `npm run test:unit` <60s，`npm test` <120s

**步骤**:

**1. 修改 `package.json` scripts**:

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathIgnorePatterns='/node_modules/ /tests/e2e/ /FlowEditor/ /MermaidCodeEditor/'",
    "test:e2e": "playwright test",
    "test:all": "npm run test:unit && npm run test:e2e",
    "test:fast": "jest --testPathIgnorePatterns='/node_modules/ /tests/e2e/ /FlowEditor/ /MermaidCodeEditor/' --maxWorkers=2"
  }
}
```

**2. 运行基准测试**:
```bash
cd vibex-fronted
time npm run test:unit
# 记录时间，目标 <60s
```

**3. 若 >60s，进一步分析**:
```bash
npm run test:unit -- --coverage --coverageReporters=text-summary
# 找到耗时 >10s 的测试文件，考虑跳过或优化
```

**验证命令**:
```bash
time npm run test:unit
# 应 <60s
```

**回滚**: 还原 `package.json` scripts

---

## 3. Phase 2 — 建立 Playwright E2E 基础（2-3 天）

### Sprint 2: Epic 2 实施步骤

---

#### S2.1: 配置 Playwright Chromium Only（0.5 天）

**目标**: `playwright-canvas-crash-test.config.cjs` 仅配置 chromium

**步骤**:

**检查当前配置**:
```bash
cat playwright-canvas-crash-test.config.cjs
```

**更新配置（确保 projects 仅含 chromium）**:
```javascript
// playwright-canvas-crash-test.config.cjs
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,           // CI 环境 retry 1 次
  workers: 1,            // 避免 canvas 状态竞争
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

**验证命令**:
```bash
npx playwright install chromium
npx playwright test --list
# 应列出所有 e2e 测试
```

---

#### S2.2–S2.5: 编写 4 个 Canvas 核心交互 E2E（1 天）

**目标**: T1/T2/T3/T4 四个 E2E 测试文件

**T1 — 三棵树加载**:
```typescript
// tests/e2e/canvas-tree-load.spec.ts
import { test, expect } from '@playwright/test';

test('T1: 三棵树均正常加载', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('.context-tree')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.flow-tree')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.component-tree')).toBeVisible({ timeout: 10_000 });
});
```

**T2 — 节点单选 checkbox**:
```typescript
// tests/e2e/canvas-node-select.spec.ts
import { test, expect } from '@playwright/test';

test('T2: 同一时间只有一个 checkbox 被选中', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('.checkbox')).toHaveCount(1);
  await page.click('.node-item');
  await expect(page.locator('.checkbox.checked')).toHaveCount(1);

  const nodes = page.locator('.node-item');
  const count = await nodes.count();
  if (count > 1) {
    await nodes.nth(1).click();
    await expect(page.locator('.checkbox.checked')).toHaveCount(1);
  }
});
```

**T3 — isActive 确认反馈**:
```typescript
// tests/e2e/canvas-node-confirm.spec.ts
import { test, expect } from '@playwright/test';

test('T3: 确认节点后 isActive class 正确', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForLoadState('networkidle');

  await page.click('.node-item');
  await page.click('.confirm-btn');
  await expect(page.locator('.node-item.active')).toHaveClass(/isActive/);
});
```

**T4 — 黄色边框移除**:
```typescript
// tests/e2e/canvas-style-change.spec.ts
import { test, expect } from '@playwright/test';

test('T4: 样式变更后黄色边框移除', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForLoadState('networkidle');

  const node = page.locator('.node-item').first();
  await page.click('.style-change-btn');
  await expect(node).not.toHaveClass(/yellow-border/);
});
```

**验证命令**:
```bash
cd vibex-fronted
npm run dev &
sleep 15
npx playwright test --config=playwright-canvas-crash-test.config.cjs
# 所有 4 个测试应 PASS
```

---

#### S2.6: 集成 Playwright 到 CI（0.5 天）

**目标**: GitHub Actions 中运行 E2E 测试

**步骤**:

**创建 `.github/workflows/e2e.yml`**:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Start dev server
        run: |
          pnpm run dev &
          sleep 20  # 等待 Next.js 启动

      - name: Run E2E tests
        run: npx playwright test --config=playwright-canvas-crash-test.config.cjs

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: test-results/
```

**验证**: 触发 PR 或 push，观察 GitHub Actions 日志

---

#### S2.7: canvasStore Zustand Fixture 重构（1 天）

**目标**: 创建 `tests/fixtures/canvasStore.fixture.ts`，替代现有重 mock

**步骤**:

```typescript
// tests/fixtures/canvasStore.fixture.ts
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import type { BoundedContextNode, ComponentNode, BusinessFlowNode } from '@/lib/canvas/types';

export interface MockCanvasState {
  contextNodes?: BoundedContextNode[];
  componentNodes?: ComponentNode[];
  flowNodes?: BusinessFlowNode[];
  selectedNodeId?: string | null;
}

export const createCanvasStoreFixture = (initial: MockCanvasState = {}) => {
  const defaultCtx: BoundedContextNode[] = [
    {
      nodeId: 'ctx-test-1',
      name: 'Test Context',
      type: 'core',
      isActive: false,
      status: 'pending',
      children: [],
    },
  ];

  beforeEach(() => {
    useCanvasStore.setState({
      contextNodes: initial.contextNodes ?? defaultCtx,
      componentNodes: initial.componentNodes ?? [],
      flowNodes: initial.flowNodes ?? [],
      selectedNodeId: initial.selectedNodeId ?? null,
    });
  });

  afterEach(() => {
    useCanvasStore.setState({
      contextNodes: [],
      componentNodes: [],
      flowNodes: [],
      selectedNodeId: null,
    });
  });
};
```

**使用示例**:
```typescript
// src/components/canvas/BoundedContextTree.test.tsx
import { createCanvasStoreFixture } from '@/tests/fixtures/canvasStore.fixture';

describe('BoundedContextTree', () => {
  createCanvasStoreFixture();

  it('renders correctly', () => {
    // 直接使用 fixture，无需手动 mock
  });
});
```

**验证**:
```bash
npm run test -- --testPathPattern="BoundedContextTree"
# 应 PASS，无破坏性变更
```

---

## 4. Phase 3 — 视觉回归 + 用户旅程（3-4 天）

### Sprint 3: Epic 3 实施步骤

---

#### S3.1: 引入 pixelmatch 截图对比（1 天）

**目标**: 安装 pixelmatch，编写视觉回归测试

**步骤**:

**1. 安装依赖**:
```bash
pnpm add -D pixelmatch pngjs @types/pixelmatch
```

**2. 创建目录结构**:
```bash
mkdir -p tests/visual-baselines
mkdir -p tests/visual
```

**3. 编写视觉回归测试**:

```typescript
// tests/visual/canvas-visual.spec.ts
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const PAGES = [
  { route: '/canvas', selector: '.context-tree', name: 'canvas-homepage' },
  { route: '/canvas', selector: '.context-tree', name: 'context-tree-panel' },
  { route: '/canvas', selector: '.component-tree', name: 'component-tree-panel' },
  { route: '/design-system', selector: 'main', name: 'design-system-components' },
];

for (const { route, selector, name } of PAGES) {
  test(`视觉回归: ${name}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.locator(selector).waitFor({ state: 'visible' });

    const screenshot = await page.locator(selector).screenshot();
    const baselinePath = join(__dirname, `../visual-baselines/${name}.png`);

    if (!existsSync(baselinePath)) {
      // 首次运行：生成 baseline
      writeFileSync(baselinePath, screenshot);
      console.log(`[visual-regression] Baseline created: ${baselinePath}`);
      test.skip();
    }

    const baseline = PNG.sync.read(readFileSync(baselinePath));
    const current = PNG.sync.read(screenshot);
    const diff = new PNG(baseline.width, baseline.height);

    const diffPixels = pixelmatch(
      baseline.data, current.data, diff.data,
      baseline.width, baseline.height,
      { threshold: 0.1 },
    );

    const ratio = diffPixels / (baseline.width * baseline.height);
    expect(ratio).toBeLessThan(0.01);
  });
}
```

**验证**:
```bash
npx playwright test tests/visual/canvas-visual.spec.ts
# 首次运行生成 baseline，第2次运行对比
```

---

#### S3.2: 建立视觉 baseline 管理机制（0.5 天）

**目标**: `tests/visual-baselines/` 目录 + `tests/update-baselines.ts` 脚本

**步骤**:

**创建 `tests/update-baselines.ts`**:
```typescript
// tests/update-baselines.ts
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASELINES = [
  { url: 'http://localhost:3000/canvas', name: 'canvas-homepage', selector: '.context-tree' },
  { url: 'http://localhost:3000/canvas', name: 'context-tree-panel', selector: '.context-tree' },
  { url: 'http://localhost:3000/canvas', name: 'component-tree-panel', selector: '.component-tree' },
  { url: 'http://localhost:3000/design-system', name: 'design-system-components', selector: 'main' },
];

async function update() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  mkdirSync('tests/visual-baselines', { recursive: true });

  for (const { url, name, selector } of BASELINES) {
    await page.goto(url);
    await page.waitForSelector(selector, { timeout: 10_000 });
    const screenshot = await page.locator(selector).screenshot();
    writeFileSync(join(__dirname, `visual-baselines/${name}.png`), screenshot);
    console.log(`Updated: ${name}.png`);
  }

  await browser.close();
  console.log('All baselines updated.');
}

update().catch(console.error);
```

**添加 npm script**:
```json
{
  "scripts": {
    "test:visual:update": "npx ts-node tests/update-baselines.ts"
  }
}
```

**验证**:
```bash
# 确保 dev server 运行
npm run dev &
sleep 20
npm run test:visual:update
ls tests/visual-baselines/
```

---

#### S3.3: 用户旅程 E2E — 创建项目 → 添加上下文（0.5 天）

**目标**: 完整用户旅程测试 1

```typescript
// tests/e2e/user-journey-create-project.spec.ts
import { test, expect } from '@playwright/test';

test('用户旅程: 创建项目 → 添加限界上下文', async ({ page }) => {
  // 1. 创建项目
  await page.goto('/');
  await page.click('[data-testid="new-project-btn"]');
  await page.fill('[data-testid="project-name-input"]', 'VibeX E2E Test Project');
  await page.click('[data-testid="create-project-submit"]');

  await expect(page.locator('.project-created')).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/project\/.+/);

  // 2. 添加限界上下文
  await page.click('[data-testid="add-context-btn"]');
  await page.fill('[data-testid="context-name-input"]', 'E2E Test Context');
  await page.click('[data-testid="add-context-submit"]');

  await expect(page.locator('.bounded-context')).toHaveCount(1, { timeout: 10_000 });
});
```

---

#### S3.4: 用户旅程 E2E — 生成组件树 → 导出代码（1 天）

**目标**: 完整用户旅程测试 2

```typescript
// tests/e2e/user-journey-generate-export.spec.ts
import { test, expect } from '@playwright/test';

test('用户旅程: 生成组件树 → 导出代码', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForLoadState('networkidle');

  // 1. 生成组件树
  await page.click('[data-testid="generate-btn"]');
  await page.waitForSelector('.component-tree .node', { timeout: 30_000 });

  const nodes = page.locator('.component-tree .node');
  const count = await nodes.count();
  expect(count).toBeGreaterThan(0);

  // 2. 导出代码
  await page.click('[data-testid="export-btn"]');
  await expect(page.locator('.export-success')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.export-code')).toContainText('export default');
});
```

---

#### S3.5: TS strict + 组件状态命名规范（0.5 天）

**目标**: `tsconfig.json` 开启 strict，文档化命名规范

**步骤**:

**修改 `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnnecessaryCondition": true,
    "strictNullChecks": true
  }
}
```

**创建命名规范文档**:
```markdown
<!-- docs/testing/component-state-naming.md -->
# 组件状态命名规范

| 状态类型 | 命名规范 | 正确示例 | 错误示例 |
|---------|---------|---------|---------|
| Boolean 状态 | `is`/`has`/`can` 前缀 | `isActive`, `hasChildren` | `active`, `confirmed` |
| 异步加载 | `isLoading`/`isPending` | `isLoading: boolean` | `loading: boolean` |
| 错误状态 | `error` / `isError` | `error: Error \| null` | `err: string` |
| 禁用状态 | `disabled` | `disabled: boolean` | `disable: boolean` |
| 展开/折叠 | `isExpanded` | `isExpanded: boolean` | `expanded: boolean` |
```

**验证**:
```bash
cd vibex-fronted
npx tsc --noEmit
# 修复所有 strict 错误
```

---

#### S3.6: Commit message lint（0.25 天）

**目标**: commitlint 强制 conventional commits 格式

**步骤**:

**1. 安装**:
```bash
pnpm add -D @commitlint/config-conventional commitlint
```

**2. 创建 `commitlint.config.js`**:
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-case': [2, 'always', 'sentence-case'],
  },
};
```

**3. 配置 husky**:
```bash
npx husky add .husky/commit-msg 'npx commitlint --edit $1'
```

**验证**:
```bash
git commit -m "fix: resolve import alias in jest config"
# 应 PASS
git commit -m "FIX: Import alias broken"
# 应 FAIL（需小写）
```

---

## 5. 测试执行计划

### 5.1 本地开发测试

```bash
# 1. 快套件（开发中 save-watch）
npm run test:fast

# 2. 单文件测试
npm run test -- --testPathPattern="BoundedContextTree"

# 3. 覆盖率报告
npm run test -- --coverage --coverageReporters=lcov

# 4. E2E 本地
npm run dev &
sleep 20
npx playwright test

# 5. 视觉回归（需先生成 baseline）
npm run test:visual:update
npx playwright test tests/visual/
```

### 5.2 CI 测试（GitHub Actions）

```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npm run test:unit
        env:
          CI: true

  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps chromium
      - run: pnpm run dev &
        sleep: 20
      - run: npx playwright test

  visual-regression:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install chromium
      - run: pnpm run dev &
        sleep: 20
      - run: npx playwright test tests/visual/

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npx tsc --noEmit
      - run: npx commitlint --from HEAD~1 --to HEAD
```

### 5.3 覆盖率 Gate

```
Phase 1: 覆盖率 ≥ 70% → CI PASS
Phase 2: 覆盖率 ≥ 75% → CI PASS
Phase 3: 覆盖率 ≥ 80% → CI PASS
```

---

## 6. 回滚计划

### 6.1 Phase 回滚策略

| Phase | 回滚命令 | 恢复时间 |
|-------|---------|---------|
| Phase 1 | `git checkout HEAD~1 -- vibex-fronted/src/ vibex-fronted/jest.config.ts` | <5 min |
| Phase 2 | `git checkout HEAD~1 -- vibex-fronted/tests/e2e/ .github/workflows/e2e.yml` | <5 min |
| Phase 3 | `git checkout HEAD~1 -- vibex-fronted/tests/visual/ tests/visual-baselines/` | <5 min |

### 6.2 Feature Flag 策略

**视觉回归不阻断 CI（第一周）**:
```yaml
# .github/workflows/visual-regression.yml
# 视觉回归失败仅发送告警，不 block merge
- name: Visual regression (advisory)
  if: always()
  run: npx playwright test tests/visual/ || echo "Visual regression: advisory only"
```

**一周后确认稳定后改为必需**:
```yaml
- name: Visual regression (required)
  run: npx playwright test tests/visual/
```

### 6.3 数据恢复

- 视觉 baseline 存储在 `tests/visual-baselines/`（git lfs 管理）
- 回滚后 baseline 保留，无需重新生成
- `git lfs pull` 恢复 baseline

---

## 7. 验收检查清单

### Phase 1 验收

- [ ] `npm run test:unit` 退出码为 0，无 `@/lib/canvas/canvasStore` 解析错误
- [ ] `BoundedContextTree.test.tsx` 包含 E1 测试：`expect(screen.queryAllByRole('checkbox')).toHaveLength(1)` 通过
- [ ] `ComponentTree.test.tsx` 包含 E2 测试：`expect(container.querySelector('.checkbox')).toBeInTheDocument()` 通过
- [ ] `AGENTS.md` DoD 包含 "测试文件与实现同步更新"
- [ ] `npm run test:unit` 执行时间 <60s
- [ ] `npm run test:fast` 执行时间 <60s

### Phase 2 验收

- [ ] `playwright-canvas-crash-test.config.cjs` projects 仅含 chromium
- [ ] `npx playwright test tests/e2e/canvas-tree-load.spec.ts` PASS
- [ ] `npx playwright test tests/e2e/canvas-node-select.spec.ts` PASS
- [ ] `npx playwright test tests/e2e/canvas-node-confirm.spec.ts` PASS
- [ ] `npx playwright test tests/e2e/canvas-style-change.spec.ts` PASS
- [ ] `.github/workflows/e2e.yml` 在 PR 中触发，E2E 测试通过
- [ ] `tests/fixtures/canvasStore.fixture.ts` 创建，单元测试使用 fixture 后通过
- [ ] E2E flaky rate <5%（CI 重复 3 次统计）

### Phase 3 验收

- [ ] `tests/visual-baselines/` 包含 4 个 PNG 文件
- [ ] `tests/visual/canvas-visual.spec.ts` 执行，无新失败
- [ ] `pixelmatch diff ratio < 0.01` 对所有 4 个页面成立
- [ ] `tests/e2e/user-journey-create-project.spec.ts` PASS
- [ ] `tests/e2e/user-journey-generate-export.spec.ts` PASS
- [ ] `npx tsc --noEmit` 退出码 0
- [ ] `commitlint --from HEAD~1 --to HEAD` 通过
- [ ] 完整 CI pipeline（unit + e2e + visual + lint）全部 PASS

### 最终验收指标

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| npm test 运行时间（单元）| <60s | 待测 | ⬜ |
| vitest 导入路径错误 | 0 | 待测 | ⬜ |
| Canvas E2E 覆盖率 | ≥80% | 待测 | ⬜ |
| E2E 测试稳定率 | <5% flaky | 待测 | ⬜ |
| 视觉回归基线覆盖 | 4 个页面 | 待测 | ⬜ |
| 测试与实现同步率 | 100% | 待测 | ⬜ |
| 单元测试通过率 | 100% | 待测 | ⬜ |

---

_实施计划完成。产出物：vibex-tester-proposals-20260402_061709/IMPLEMENTATION_PLAN.md_
