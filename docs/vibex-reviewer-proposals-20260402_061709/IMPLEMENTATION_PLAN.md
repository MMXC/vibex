# VibeX 代码质量治理 — 实施计划

**项目**: vibex-reviewer-proposals-20260402_061709
**版本**: 1.0
**日期**: 2026-04-02
**作者**: Architect Agent
**状态**: Proposed

---

## 1. Sprint 总体概览

| Sprint | 周期 | 总工时 | 目标 |
|--------|------|--------|------|
| **Sprint 0** | Day 1 | 3.5h | 解除 CI 阻塞 + 安全漏洞 |
| **Sprint 1** | Day 2-5 | 20h | 架构基础建设（TS 严格化 + Store 拆分 + 覆盖率门禁） |
| **Sprint 2** | Day 6-8 | 15h | CSS 模块化 + E2E 旅程 + Git 工作流 |

**总工时**: 38.5h（约 2 个标准 Sprint）

---

## 2. Sprint 0 — 紧急止血（3.5h，Day 1）

### 2.1 Sprint 0 工时分解

| 功能点 | ID | 工时 | 执行顺序 |
|--------|----|------|---------|
| 修复 9 个预存 TS 错误 | S0-1 | 1.0h | 1st |
| 修复 E2E 测试 TS 错误 | S0-2 | 2.0h | 2nd |
| DOMPurify XSS 修复 | S0-3 | 0.5h | 3rd |

### 2.2 详细实施步骤

#### S0-1: 修复 9 个预存 TypeScript 错误（1.0h）

**Step 1: 收集错误**
```bash
cd vibex-frontend
npm run build 2>&1 | tee /tmp/build-output.log
grep "error TS" /tmp/build-output.log
# 预期输出：9 行 error TS
```

**Step 2: 分类错误**
```bash
# 按错误代码分类统计
grep "error TS" /tmp/build-output.log | sed 's/.*\(TS[0-9]*\).*/\1/' | sort | uniq -c
# 预期分类示例：
#   3 TS6133 (未使用变量)
#   4 TS2322 (类型不匹配)
#   2 TS1005 (语法/废弃 API)
```

**Step 3: 修复 TS6133（未使用变量）**
```bash
# 方法：删除或加 `_` 前缀
# 原则：删除明显无用代码；保留可能将来使用的加 `_` 前缀
# 文件定位：grep "TS6133" /tmp/build-output.log 提取文件路径
```

**Step 4: 修复 TS2322（类型不匹配）**
```bash
# 方法：添加显式类型注解
# ts-node 辅助验证：
npx tsc --noEmit --pretty false 2>&1 | grep "TS2322"
# 对每个 TS2322 添加正确类型
```

**Step 5: 修复 TS1005（语法/废弃 API）**
```bash
# 方法：使用替代 API
# 常见废弃 API 替代：
#   require() → import
#   React.FC → 函数组件直接标注类型
```

**Step 6: 验证**
```bash
npm run build
# 期望：退出码 0，无 "error TS" 输出
```

---

#### S0-2: 修复 E2E 测试 TypeScript 错误（2.0h）

**Step 1: 收集 E2E TS 错误**
```bash
cd vibex-frontend
npx tsc --project tests/e2e/tsconfig.json --noEmit 2>&1 | tee /tmp/e2e-ts-output.log
grep "error TS" /tmp/e2e-ts-output.log
```

**Step 2: 添加 tests/ 到 tsconfig.json include**
```bash
# 编辑 tsconfig.json
# 找到 include 字段，添加 "tests"
# 修复前: "include": ["src"]
# 修复后: "include": ["src", "tests"]
```

**Step 3: 修复 TS1434（异步上下文错误）**
```bash
# 定位：grep "TS1434" /tmp/e2e-ts-output.log
# 原因：async 函数中缺少 await 或错误的 async 上下文
# 方法：补全 await 或将同步代码移出 async 上下文
```

**Step 4: 修复 TS1128（语法错误）**
```bash
# 定位：grep "TS1128" /tmp/e2e-ts-output.log
# 原因：缺少分号、括号闭合等
# 方法：逐个修复
```

**Step 5: 替换 waitForTimeout 为条件等待**
```bash
# 全局替换：
# 搜索: grep -rn "waitForTimeout" tests/e2e/
# 替换原则：
#   waitForTimeout(1000) → waitForSelector(locator, { state: 'visible', timeout: 1000 })
#   waitForTimeout(2000) → waitForResponse(url => url.url().includes('/api'), { timeout: 2000 })
# 注意：每个替换需审查上下文，确保替换等效
```

**Step 6: 验证**
```bash
npx tsc --project tests/e2e/tsconfig.json --noEmit
# 期望：无 error TS 输出

npx playwright test canvas-expand.spec.ts --reporter=list
# 期望：测试可执行（可能 pass 或 fail，但无 TS 编译错误）
```

---

#### S0-3: DOMPurify XSS 修复（0.5h）

**Step 1: 添加 package.json overrides**
```bash
cd vibex-frontend
# 编辑 package.json
# 在根对象添加（若不存在）：
{
  "overrides": {
    "dompurify": "3.3.3"
  }
}
```

**Step 2: 安装覆盖版本**
```bash
npm install
npm ls dompurify
# 期望：所有 dompurify 均为 3.3.3
```

**Step 3: 安全验证**
```bash
npm audit --audit-level=high
# 期望：输出中 high/critical 数量为 0
```

**Step 4: 功能回归（可选，staging）**
```bash
# 若有 staging 环境，验证 monaco-editor 功能正常
# 无 staging 则跳过此步
```

---

## 3. Sprint 1 — 架构基础建设（20h，Day 2-5）

### 3.1 Sprint 1 工时分解

| 功能点 | ID | 工时 | 执行顺序 |
|--------|----|------|---------|
| TypeScript 严格模式建立 | S1-1 | 4.0h | Day 2 |
| canvasStore 最小化拆分 | S1-2 | 8-12h | Day 2-3（并行 S1-1） |
| ADR-001 checkbox 语义 | S1-3 | 1.0h（ADR）+ 4-6h（实现）| Day 3（ADR） + Day 4（实现） |
| 测试覆盖率门禁基线 | S1-4 | 3.0h | Day 4-5 |

### 3.2 详细实施步骤

#### S1-1: TypeScript 严格模式建立（4.0h，Day 2）

**Step 1: 更新 tsconfig.json**
```json
// 在现有 tsconfig.json 的 compilerOptions 中添加：
{
  "strict": true,
  "noUncheckedIndexedAccess": true
  // "exactOptionalPropertyTypes": true  // Phase 3，可选
}
```

**Step 2: 运行严格模式检查**
```bash
npx tsc --noEmit 2>&1 | tee /tmp/strict-output.log
grep "error TS" /tmp/strict-output.log | wc -l
# 记录新增错误数量（预期 < 5 个重大错误）
```

**Step 3: 分析新增错误**
```bash
# 分类统计
grep "error TS" /tmp/strict-output.log | sed 's/.*\(TS[0-9]*\).*/\1/' | sort | uniq -c
```

**Step 4: 逐类修复**
```bash
# 常见严格模式错误修复策略：
# TS18046: 'x' is of type 'unknown' → 添加类型断言或类型守卫
# TS2345: Argument of type 'X' not assignable to 'Y' → 修正参数类型
# TS2532: Object is possibly 'undefined' → 使用 ?. 或 if (x)
# TS2775: Legacy async callbacks not supported → 改用 await
```

**Step 5: 添加 type-check:strict 脚本**
```json
// package.json scripts 添加：
{
  "type-check:strict": "tsc --noEmit --strict --noUncheckedIndexedAccess"
}
```

**Step 6: 验证**
```bash
npm run type-check:strict
# 期望：退出码 0
```

---

#### S1-2: canvasStore 最小化拆分（8-12h，Day 2-3）

**Phase A: 创建新 store 骨架（2.0h）**

**Step A1: 分析现有 canvasStore**
```bash
# 行数统计
wc -l src/lib/canvas/canvasStore.ts

# 识别每个 state 和 action 的领域归属
grep "interface\|type\|const\|function" src/lib/canvas/canvasStore.ts
```

**Step A2: 创建目录结构**
```bash
mkdir -p src/lib/canvas/stores
mkdir -p src/lib/canvas/stores/__tests__
```

**Step A3: 创建 contextStore.ts**
```typescript
// src/lib/canvas/stores/contextStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ContextNode {
  id: string;
  name: string;
  description?: string;
  confirmed: boolean;
  selected: boolean;
  position: { x: number; y: number };
  createdAt: number;
}

interface ContextStore {
  nodes: ContextNode[];
  addContext: (payload: { name: string; description?: string }) => ContextNode;
  removeContext: (id: string) => void;
  updateContext: (id: string, patch: Partial<Omit<ContextNode, 'id' | 'createdAt'>>) => void;
  selectContext: (id: string) => void;
  deselectContext: (id: string) => void;
  toggleContextSelection: (id: string) => void;
  clearSelection: () => void;
  getSelected: () => ContextNode[];
  confirmContextNode: (id: string) => void;
  unconfirmContextNode: (id: string) => void;
  isContextConfirmed: (id: string) => boolean;
}

export const useContextStore = create<ContextStore>()(
  devtools((set, get) => ({
    nodes: [],
    addContext: ({ name, description }) => {
      const node: ContextNode = {
        id: crypto.randomUUID(),
        name,
        description,
        confirmed: false,
        selected: false,
        position: { x: 0, y: 0 },
        createdAt: Date.now(),
      };
      set(state => ({ nodes: [...state.nodes, node] }));
      return node;
    },
    removeContext: (id) =>
      set(state => ({ nodes: state.nodes.filter(n => n.id !== id) })),
    updateContext: (id, patch) =>
      set(state => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, ...patch } : n),
      })),
    selectContext: (id) =>
      set(state => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, selected: true } : n),
      })),
    deselectContext: (id) =>
      set(state => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, selected: false } : n),
      })),
    toggleContextSelection: (id) => {
      const node = get().nodes.find(n => n.id === id);
      if (node) {
        set(state => ({
          nodes: state.nodes.map(n =>
            n.id === id ? { ...n, selected: !n.selected } : n
          ),
        }));
      }
    },
    clearSelection: () =>
      set(state => ({ nodes: state.nodes.map(n => ({ ...n, selected: false })) })),
    getSelected: () => get().nodes.filter(n => n.selected),
    confirmContextNode: (id) =>
      set(state => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, confirmed: true } : n),
      })),
    unconfirmContextNode: (id) =>
      set(state => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, confirmed: false } : n),
      })),
    isContextConfirmed: (id) => !!get().nodes.find(n => n.id === id)?.confirmed,
  }))
);
```

**Step A4: 重复创建 flowStore.ts, componentStore.ts, uiStore.ts**
- flowStore.ts: 同理，添加 `getFlowsByContext(contextId)` 查询方法
- componentStore.ts: 同理，添加 `getComponentsByFlow(flowId)` 查询方法
- uiStore.ts: 管理 `activeTab`、`panelOpen`、`scrollTop`、`expandedNodes`

**Step A5: 验证行数**
```bash
wc -l src/lib/canvas/stores/*.ts
# 期望：每文件 < 300 行
```

**Phase B: 迁移三树组件（4-6h）**

**Step B1: 迁移 BoundedContextTree**
```bash
# 1. 将 useCanvasStore 导入改为 useContextStore
# 2. 替换状态引用
# 3. 替换 confirmContextNode 调用
# 4. 替换 selectContext 调用
```

**Step B2: 迁移 BusinessFlowTree**
- 同理，迁移到 useFlowStore
- 使用 `confirmFlowNode(id)` API

**Step B3: 迁移 ComponentTree**
- 同理，迁移到 useComponentStore
- 使用 `confirmComponentNode(id)` API

**Step B4: 全量 E2E 回归**
```bash
npx playwright test --reporter=list
# 期望：所有测试通过（无 regression）
```

**Phase C: 清理 canvasStore.ts（2-4h）**

**Step C1: 标记 canvasStore 为 deprecated**
```typescript
// 在 canvasStore.ts 顶部添加：
/**
 * @deprecated S1-2: 请使用 useContextStore / useFlowStore / useComponentStore / useUIStore
 * canvasStore.ts 将于 Sprint 2 后清空并删除。
 */
```

**Step C2: 逐步移除未迁移代码**
- 每移除一个 action，验证三树组件 + E2E 测试仍通过
- 保持 Git commit 原子性

**Step C3: 最终验证**
```bash
wc -l src/lib/canvas/canvasStore.ts
# 目标：< 100 行
```

---

#### S1-3: ADR-001 三树 Checkbox 语义规范（1.0h ADR + 4-6h 实现）

**Step 1: 编写 ADR 文档**
```bash
mkdir -p docs/adr
cat > docs/adr/ADR-001-checkbox-semantics.md << 'EOF'
# ADR-001: Canvas 三树组件 Checkbox 语义

## Status
Accepted — 2026-04-02

## Context
BoundedContextTree、BusinessFlowTree、ComponentTree 三树组件的 checkbox 语义不一致，
导致用户操作预期混乱，开发者维护成本高。

## Decision

### Selection Checkbox（多选）
- 用途: Ctrl+Click 多选场景
- 状态: `selected: boolean`
- 视觉: checkbox 在 type badge 之前，背景色高亮
- API: `selectContext(id)` / `selectFlow(id)` / `selectComponent(id)`

### Confirmation Checkbox（单点确认）
- 用途: 单节点确认
- 状态: `confirmed: boolean`
- 视觉: 绿色 checkbox ✓
- API: `confirmContextNode(id)` / `confirmFlowNode(id)` / `confirmComponentNode(id)`

### 状态机
idle → selected → confirmed → error
idle → selected → idle (取消选择)

## Consequences
- 所有三树组件必须实现统一的 confirm*Node API
- 新增树节点组件必须遵守此 ADR
- PR review 时检查 checkbox 语义合规性
EOF
```

**Step 2: 实现三树对齐（4-6h）**
- BoundedContextTree: 实现 `confirmContextNode` + `selectContext`
- BusinessFlowTree: 实现 `confirmFlowNode` + `selectFlow`
- ComponentTree: 实现 `confirmComponentNode` + `selectComponent`
- UI 验证: checkbox 视觉位置正确（在 type badge 之前）

**Step 3: 验证 ADR 合规**
```bash
# 验证统一 API 调用存在
grep -E "confirmContextNode|confirmFlowNode|confirmComponentNode" \
  src/components/canvas/*.tsx | wc -l
# 期望: >= 3
```

---

#### S1-4: 测试覆盖率门禁基线（3.0h，Day 4-5）

**Step 1: 配置 Vitest 覆盖率**
```bash
# 安装依赖（如未安装）
npm install -D vitest @vitest/coverage-v8
```

**Step 2: 创建/更新 vitest.config.ts**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/App.tsx',
      ],
    },
  },
});
```

**Step 3: 创建 check-coverage.js**
```javascript
// scripts/check-coverage.js
const fs = require('fs');
const path = require('path');

const SUMMARY_PATH = path.join(__dirname, '../coverage/coverage-summary.json');

const THRESHOLDS = {
  statements: 50,
  branches: 45,
  functions: 55,
  lines: 50,
};

function checkCoverage() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.error('❌ coverage-summary.json not found. Run "npm run test:coverage" first.');
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'));
  const total = summary.total;

  const actual = {
    statements: Math.round((total.statements.covered / total.statements.total) * 100),
    branches: Math.round((total.branches.covered / total.branches.total) * 100),
    functions: Math.round((total.functions.covered / total.functions.total) * 100),
    lines: Math.round((total.lines.covered / total.lines.total) * 100),
  };

  const failedMetrics = [];

  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    if (actual[key] < threshold) {
      failedMetrics.push(`${key}: ${actual[key]}% < ${threshold}%`);
    }
  }

  if (failedMetrics.length > 0) {
    console.error('❌ Coverage gate FAILED:');
    failedMetrics.forEach(m => console.error(`   - ${m}`));
    console.error(`\n   Actual: statements=${actual.statements}% branches=${actual.branches}% functions=${actual.functions}% lines=${actual.lines}%`);
    process.exit(1);
  }

  console.log('✅ Coverage gate PASSED:');
  console.log(`   statements=${actual.statements}% branches=${actual.branches}% functions=${actual.functions}% lines=${actual.lines}%`);
  process.exit(0);
}

checkCoverage();
```

**Step 4: 添加 npm scripts**
```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "coverage:check": "vitest run --coverage && node scripts/check-coverage.js",
    "precommit": "npm run coverage:check && npm run type-check:strict"
  }
}
```

**Step 5: 首次运行覆盖率**
```bash
npm run test:coverage
# 预期：Statements 可能 < 50%，需补充测试
```

**Step 6: 补充关键路径测试（若覆盖率不达标）**
```bash
# 优先覆盖核心 store 逻辑
npm run vitest -- src/lib/canvas/stores/__tests__/
```

**Step 7: 验证 CI gate**
```bash
node scripts/check-coverage.js
# 期望：退出码 0
```

---

## 4. Sprint 2 — 质量提升（15h，Day 6-8）

### 4.1 Sprint 2 工时分解

| 功能点 | ID | 工时 | 执行顺序 |
|--------|----|------|---------|
| CSS Modules 组件拆分 | S2-1 | 6.0h | Day 6-7 |
| Playwright E2E 核心旅程 | S2-2 | 8-10h | Day 7-8 |
| Git 工作流规范 | S2-3 | 1.0h | Day 8 |

### 4.2 详细实施步骤

#### S2-1: CSS Modules 组件拆分（6.0h，Day 6-7）

**Step 1: 分析现有 canvas.module.css**
```bash
wc -l src/components/canvas/canvas.module.css
# 记录当前行数
grep -n "\." src/components/canvas/canvas.module.css | head -50
# 分析选择器模式，识别哪些属于哪个组件
```

**Step 2: 创建 CSS 文件结构**
```bash
touch src/components/canvas/BoundedContextTree.module.css
touch src/components/canvas/BusinessFlowTree.module.css
touch src/components/canvas/ComponentTree.module.css
touch src/components/canvas/canvas-layout.module.css
touch src/components/canvas/canvas-variables.module.css
```

**Step 3: 迁移 canvas-variables.module.css（0.5h）**
```css
/* canvas-variables.module.css — CSS 变量定义 */
:root {
  --canvas-primary: #4a90e2;
  --canvas-bg: #fafafa;
  --canvas-border: #e0e0e0;
  --canvas-text: #333;
  --canvas-spacing-xs: 4px;
  --canvas-spacing-sm: 8px;
  --canvas-spacing-md: 16px;
  --canvas-spacing-lg: 24px;
}
```

**Step 4: 迁移组件 CSS（3.5h）**
```bash
# 按组件迁移选择器
# 原则：
#   .context-node* → BoundedContextTree.module.css
#   .flow-node* → BusinessFlowTree.module.css
#   .component-node* → ComponentTree.module.css
#   .panel* | .drawer* | .layout* → canvas-layout.module.css
```

**Step 5: 更新组件导入（1.0h）**
```typescript
// BoundedContextTree.tsx
// 旧: import styles from './canvas.module.css';
// 新: import styles from './BoundedContextTree.module.css';
```

**Step 6: 视觉回归测试（1.0h）**
```bash
# 使用 Playwright 或手动截图对比
# 三个页面：
#   /canvas/bounded-context
#   /canvas/business-flow
#   /canvas/component-tree
```

**Step 7: 验证行数约束**
```bash
wc -l src/components/canvas/*.module.css
# 期望：每文件 < 500 行，canvas.module.css < 200 行
```

---

#### S2-2: Playwright E2E 核心旅程覆盖（8-10h，Day 7-8）

**Journey 1: journey-create-context.spec.ts（2.5h）**

```bash
cat > tests/e2e/journey-create-context.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Journey: Create BoundedContext', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForSelector('[data-testid="context-tree"]', { state: 'visible' });
  });

  test('用户成功创建一个 BoundedContext', async ({ page }) => {
    await page.getByRole('button', { name: /add context/i }).click();
    await page.getByPlaceholder('Context Name').fill('Order Service');
    await page.getByRole('button', { name: /confirm/i }).click();
    const contextNode = page.locator('[data-testid="context-node"]').first();
    await expect(contextNode).toBeVisible();
    await expect(contextNode).toContainText('Order Service');
  });

  test('确认 checkbox 后节点变为 confirmed 状态', async ({ page }) => {
    await page.getByRole('button', { name: /add context/i }).click();
    await page.getByPlaceholder('Context Name').fill('Payment');
    await page.getByRole('button', { name: /confirm/i }).click();
    const checkbox = page.locator('[data-testid="context-node"]').first()
      .locator('[data-testid="confirm-checkbox"]');
    await checkbox.click();
    await expect(
      page.locator('[data-testid="context-node"]').first()
    ).toHaveAttribute('data-confirmed', 'true');
  });

  test('Ctrl+Click 多选两个节点', async ({ page }) => {
    // 创建两个 context
    await page.getByRole('button', { name: /add context/i }).click();
    await page.getByPlaceholder('Context Name').fill('Service A');
    await page.getByRole('button', { name: /confirm/i }).click();
    
    await page.getByRole('button', { name: /add context/i }).click();
    await page.getByPlaceholder('Context Name').fill('Service B');
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Ctrl+Click 多选
    const nodeA = page.locator('[data-testid="context-node"]').nth(0);
    const nodeB = page.locator('[data-testid="context-node"]').nth(1);
    await nodeA.click();
    await nodeB.click({ modifiers: ['Control'] });
    
    await expect(nodeA).toHaveAttribute('data-selected', 'true');
    await expect(nodeB).toHaveAttribute('data-selected', 'true');
  });
});
EOF
```

**Journey 2: journey-generate-flow.spec.ts（3.0h）**

```bash
cat > tests/e2e/journey-generate-flow.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Journey: Generate BusinessFlow from Context', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForSelector('[data-testid="context-tree"]', { state: 'visible' });
  });

  test('从 Context 节点生成 Flow', async ({ page }) => {
    // 1. 创建 Context
    await page.getByRole('button', { name: /add context/i }).click();
    await page.getByPlaceholder('Context Name').fill('Order Service');
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // 2. 确认 Context
    const contextNode = page.locator('[data-testid="context-node"]').first();
    await contextNode.locator('[data-testid="confirm-checkbox"]').click();
    
    // 3. 切换到 Flow Tab
    await page.getByRole('tab', { name: /flow/i }).click();
    await page.waitForSelector('[data-testid="flow-tree"]', { state: 'visible' });
    
    // 4. 生成 Flow
    await page.getByRole('button', { name: /generate flow/i }).click();
    await page.getByPlaceholder('Flow Name').fill('Order Processing');
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // 5. 验证 Flow 生成
    const flowNode = page.locator('[data-testid="flow-node"]').first();
    await expect(flowNode).toBeVisible();
    await expect(flowNode).toContainText('Order Processing');
  });

  test('Flow 生成后可以多选', async ({ page }) => {
    // Setup: 创建多个 Flow
    await page.getByRole('tab', { name: /flow/i }).click();
    // ... (create multiple flows)
    const flows = page.locator('[data-testid="flow-node"]');
    await expect(flows).toHaveCount(2);
  });
});
EOF
```

**Journey 3: journey-multi-select.spec.ts（2.5h）**

```bash
cat > tests/e2e/journey-multi-select.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Journey: Multi-select Nodes Across Trees', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForSelector('[data-testid="context-tree"]', { state: 'visible' });
  });

  test('跨树多选节点并批量确认', async ({ page }) => {
    // 1. 创建多个 Context
    for (const name of ['Service A', 'Service B', 'Service C']) {
      await page.getByRole('button', { name: /add context/i }).click();
      await page.getByPlaceholder('Context Name').fill(name);
      await page.getByRole('button', { name: /confirm/i }).click();
    }
    
    // 2. 多选所有 Context（Shift+Click 或 Ctrl+Click）
    const nodes = page.locator('[data-testid="context-node"]');
    const count = await nodes.count();
    for (let i = 0; i < count; i++) {
      await nodes.nth(i).click({ modifiers: ['Control'] });
    }
    
    // 3. 批量确认
    await page.getByRole('button', { name: /confirm selected/i }).click();
    
    // 4. 验证所有已确认
    const confirmedNodes = page.locator('[data-testid="context-node"][data-confirmed="true"]');
    await expect(confirmedNodes).toHaveCount(count);
  });

  test('空选择状态批量操作按钮禁用', async ({ page }) => {
    const confirmSelectedBtn = page.getByRole('button', { name: /confirm selected/i });
    await expect(confirmSelectedBtn).toBeDisabled();
  });
});
EOF
```

**Step: 验证所有旅程**
```bash
# 运行所有 E2E 测试
npx playwright test tests/e2e/journey-*.spec.ts --reporter=list
# 期望：全部 passed

# Flaky 检测：连续运行 3 次
for i in 1 2 3; do
  echo "=== Run $i ==="
  npx playwright test tests/e2e/journey-*.spec.ts --reporter=list 2>&1 | grep -E "passed|failed"
done
# 期望：3 次结果完全一致
```

---

#### S2-3: Git 工作流规范（1.0h，Day 8）

**Step 1: 创建 CONTRIBUTING.md**
```bash
mkdir -p .github
cat > .github/CONTRIBUTING.md << 'EOF'
# VibeX 贡献指南

## Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

feat(canvas): 添加 BoundedContextTree 确认功能
fix(store): 修复 contextStore selectContext 重复调用问题
refactor(ui): 拆分 canvasStore 为领域 store
test(e2e): 添加 journey-create-context E2E 测试
docs(adr): 新增 ADR-001 checkbox 语义规范
```

**Type 列表**:
- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 重构（无行为变化）
- `test`: 测试
- `docs`: 文档
- `chore`: 维护任务
- `perf`: 性能优化

**Scope 列表**:
- `canvas`: canvas 相关
- `store`: 状态管理相关
- `e2e`: E2E 测试相关
- `ci`: CI/CD 相关

## 分支规范

```
main ← ← ← ← ← ← ← ← ← ← ← ← ← PR: feature/xxx
  ↑
  ↑--- PR: fix/xxx
  ↑--- PR: refactor/xxx
```

## Pull Request 流程

### 1. 创建分支
```bash
git checkout -b feature/canvas-store-split
```

### 2. 开发 + Commit
```bash
git add .
git commit -m "feat(store): 拆分 canvasStore 为 contextStore"
```

### 3. Push
```bash
git push origin feature/canvas-store-split
```

### 4. 创建 PR
在 GitHub 创建 PR，填写以下信息：
- **Title**: 采用 Conventional Commits 格式
- **Description**: 包含 What/Why/How
- **Linked Issue**: 关联相关 Issue

### 5. PR Checklist（必须全部通过）

#### 代码质量
- [ ] `npm run build` 通过，无 TS 编译错误
- [ ] `npm run type-check:strict` 通过，退出码 0
- [ ] `npm run coverage:check` 通过（Statements ≥ 50%）

#### 架构合规
- [ ] 新增 Zustand store < 300 行
- [ ] 新增 CSS 使用 `*.module.css`（无全局样式污染）
- [ ] 遵守 [ADR-001 checkbox 语义规范](../docs/adr/ADR-001-checkbox-semantics.md)

#### 测试
- [ ] 新增功能有单元测试覆盖
- [ ] E2E 测试使用 Playwright 条件等待，无 `waitForTimeout`
- [ ] E2E 测试 0 个 flaky（连续 3 次执行结果一致）

#### 安全性
- [ ] `npm audit --audit-level=high` 无 high/critical 漏洞
- [ ] 无硬编码密钥或 secrets

#### 可维护性
- [ ] 代码自解释（无过度注释）
- [ ] 无 TODO 遗留（除非有 linked Issue）
- [ ] TypeScript 类型完备（无 `any` 滥用）

### 6. Review 流程
- 至少 1 人 Approve 后可合并
- Reviewer 关注：架构合规、安全、可维护性
- 禁止 self-merge（即使是你创建的 PR）

## 代码审查标准

### 接受标准
- 所有 checklist 项通过
- 无未解决的 Reviewer comments
- CI pipeline 全绿

### 拒绝标准
- [ ] 未运行 `npm run coverage:check` 或覆盖率不达标
- [ ] 违反 ADR-001 checkbox 语义规范
- [ ] 新增 store > 300 行
- [ ] 新增非 module CSS 文件
- [ ] 使用 `waitForTimeout` 而非 Playwright 条件等待
- [ ] 引入 high/critical 安全漏洞
- [ ] 包含 `any` 类型且无充分理由

## 发布流程

```
main → Tag vX.Y.Z → GitHub Release → Changelog 更新
```

Changelog 使用 [Keep a Changelog](https://keepachangelog.com/) 格式。

## 依赖管理

- 禁止直接修改 `package-lock.json`
- 新增依赖需在 PR description 中说明理由
- DOMPurify 版本必须通过 `overrides.dompurify: "3.3.3"` 锁定
EOF
```

---

## 5. Testing Execution Plan

### 5.1 各 Sprint 测试策略

| Sprint | 测试活动 | 工具 | 目标 |
|--------|---------|------|------|
| Sprint 0 | TS 编译验证 | `tsc --noEmit` | 0 个 TS 错误 |
| Sprint 0 | 安全审计 | `npm audit` | 0 high/critical |
| Sprint 0 | E2E 可执行性 | `playwright test` | 无 TS 编译错误 |
| Sprint 1 | 单元测试 | Vitest | 新增 store 100% 覆盖 |
| Sprint 1 | 覆盖率检查 | check-coverage.js | Statements ≥ 50% |
| Sprint 1 | 回归测试 | 全量 E2E | 全部 passed |
| Sprint 2 | 核心旅程 E2E | Playwright | 3 个 journey 100% |
| Sprint 2 | Flaky 检测 | 连续 3 次运行 | 结果一致 |

### 5.2 CI Pipeline 集成

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest