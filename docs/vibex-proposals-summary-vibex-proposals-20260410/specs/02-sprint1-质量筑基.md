# Spec: Sprint 1 — 质量筑基

**Epic**: E3（类型安全与 Schema 统一）+ E4（测试基础设施）+ E5（测试框架迁移）
**Sprint**: Sprint 1
**工时**: 16h
**目标**: 类型安全 + 测试可靠 + 基础 P1 清理

---

## Spec E3-S1: ESLint no-explicit-any 清理

### 1. 概述

9 个文件含显式 `any` 类型，违反项目 TypeScript 安全规范，导致重构风险不可评估。

### 2. 当前问题文件（需逐个排查）

```bash
# 扫描命令
npx eslint . --ext .ts,.tsx --rule '@typescript-eslint/no-explicit-any: error' --format json
```

典型问题模式：
```typescript
// 禁止模式
const foo: any = response.data;
function handle(value: any) { ... }
const bar = something as any;

// 修复后
const foo: unknown = response.data;
if (typeof foo === 'string') { ... }
function handle(value: string | number) { ... }
```

### 3. 修复策略

| 场景 | 修复方案 |
|------|----------|
| 外部 API 响应 | `unknown` + Zod parse |
| 函数参数类型未知 | `unknown` + 类型守卫 |
| 第三方库类型缺失 | `// @ts-ignore` 仅作为临时方案 + 记录 TODO |
| 真正动态数据 | `Record<string, unknown>` 或具体 interface |

### 4. 验收标准

- `tsc --noEmit` 零 error
- `eslint .` 零 `@typescript-eslint/no-explicit-any` 错误
- 修复后的类型有对应的单元测试或运行时验证

---

## Spec E3-S2: Schema Drift 修复（Zod 统一）

### 1. 概述

前后端对同一实体使用不同字段名（`sessionId` vs `generationId`），导致：
- API 响应字段名与前端期望不一致
- 数据落入 wrong flow
- 连续多轮 bug

### 2. 根因分析

```typescript
// 后端 API（Prisma schema）使用 sessionId
interface FlowSession {
  sessionId: string; // 数据库字段
  createdAt: Date;
}

// 前端 store 使用 generationId
interface FlowStore {
  generationId: string; // 与 sessionId 是同一字段，命名不一致
}
```

### 3. 目标状态

统一命名规范：选择 `generationId` 作为唯一标准名称（语义更清晰）。

```typescript
// schemas/flow.ts（Zod 单一真相来源）
import { z } from 'zod';

export const GenerationSchema = z.object({
  generationId: z.string().uuid(),
  flowId: z.string().uuid().optional(),
  createdAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export type Generation = z.infer<typeof GenerationSchema>;

// 移除所有 sessionId 引用，替换为 generationId
// 迁移期间：Zod schema 支持 backward compatibility
export const LegacySessionSchema = GenerationSchema.extend({
  sessionId: z.string().uuid().optional(), // 迁移兼容
});
```

### 4. 迁移步骤

1. 在 `schemas/flow.ts` 建立 Zod schema（单一真相来源）
2. 数据库字段重命名：`sessionId` → `generationId`（migration）
3. API 层：Zod parse 输入/输出，确保契约一致
4. 前端 store：统一使用 `generationId`
5. 搜索全量代码移除 `sessionId` 残留引用

### 5. 验收标准

```typescript
// expect(zodSchema.parse(apiResponse).generationId).toBeDefined()
// expect('sessionId' in apiResponse).toBe(false)
// expect(GenerationSchema.parse(response).generationId).toBeTruthy()
```

---

## Spec E3-S3: selectedNodeIds 类型统一

### 1. 概述

`selectedNodeIds` 类型分散在多个文件中，定义不一致。

### 2. 目标状态

```typescript
// types/selection.ts
export type Selection = Set<string>;
export type SelectionId = string;

// 全局统一导出
export const emptySelection = Object.freeze(new Set<string>());
```

### 3. 验收标准

- 全局 `selectedNodeIds` 类型为 `Set<string>`
- 无重复类型定义（搜索 `selectedNodeIds: ` 模式一致性）
- 相关 store 和组件类型对齐

---

## Spec E3-S4: getRelationsForEntities 逻辑修复

### 1. 概述

`getRelationsForEntities` 函数只使用 `entityIds[0]`，导致多实体关系查询失效。

### 2. 问题代码

```typescript
// 问题代码
async function getRelationsForEntities(entityIds: string[]) {
  const entityId = entityIds[0]; // ← BUG：只取第一个
  return db.relation.findMany({ where: { entityId } });
}
```

### 3. 目标代码

```typescript
async function getRelationsForEntities(entityIds: string[]) {
  if (entityIds.length === 0) return [];
  return db.relation.findMany({ where: { entityId: { in: entityIds } } });
}
```

### 4. 验收标准

- 单元测试：传入 3 个 entityIds，验证返回 3 个实体的所有关系
- `tsc --noEmit` 通过

---

## Spec E4-S1: Playwright 配置统一

### 1. 概述

根 `playwright.config.ts` vs `tests/e2e/playwright.config.ts` 双重配置，timeout 不一致（10s vs 30s），CI 断言更容易超时。

### 2. 修复方案

合并为单一配置，消除歧义：

```typescript
// playwright.config.ts（唯一配置）
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000, // 统一 30s
  expect: {
    timeout: 10_000,
  },
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
});
```

### 3. 验收标准

- 单一配置文件，无 `tests/e2e/playwright.config.ts`
- `npx playwright test --list` 显示所有测试
- CI config timeout 与本地一致（30s）
- `playwright.config.ts` 提交到 git（配置透明化）

---

## Spec E4-S2: stability.spec.ts 路径错误修复

### 1. 概述

`stability.spec.ts` 检查 `./e2e/` 目录，但该目录不存在（实际目录为 `e2e/` 或 `tests/e2e/`），导致检查永远 PASS，`waitForTimeout` 违规被掩盖。

### 2. 修复方案

```typescript
// e2e/stability.spec.ts
import { test, expect } from '@playwright/test';
import { readdir, stat } from 'fs/promises';
import path from 'path';

test.describe('Stability checks', () => {
  test('no waitForTimeout usage in e2e tests', async () => {
    const e2eDir = path.join(process.cwd(), 'e2e');
    const files = await getTsFiles(e2eDir);
    const violations: string[] = [];

    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('waitForTimeout')) {
          violations.push(`${file}:${i + 1}: ${line.trim()}`);
        }
      });
    }

    // 修复后：应该发现违规（此前永远 PASS，现在必须发现实际违规）
    expect(violations, `Found waitForTimeout violations:\n${violations.join('\n')}`).toHaveLength(0);
  });
});
```

### 3. 验收标准

- `stability.spec.ts` 实际检查有效目录
- 运行 `playwright test stability.spec.ts` 发现真实的 `waitForTimeout` 违规
- 不再永远 PASS

---

## Spec E4-S3: @ci-blocking grepInvert 移除

### 1. 概述

CI 配置使用 `grepInvert: '@ci-blocking'`，导致 35+ 核心测试（conflict-resolution、undo-redo、a11y 等）被跳过，CI 覆盖率形同虚设。

### 2. 修复方案

**Phase 1**: 先修复被跳过的测试（确保它们在 CI 环境稳定运行）
- conflict-resolution 相关测试 → 修复 flaky 原因
- undo-redo 相关测试 → 修复状态同步问题
- a11y 相关测试 → 修复 Playwright a11y 插件兼容

**Phase 2**: 移除 grepInvert 配置

```typescript
// playwright.config.ts（移除 grepInvert）
export default defineConfig({
  // grep: process.env.CI ? /\b@ci\b/ : undefined,
  // grepInvert: '@ci-blocking',  ← 删除此行
});
```

### 3. 验收标准

- grepInvert 完全移除
- CI 测试数恢复到 skip 前水平
- CI 通过率 ≥ 95%（允许合理的 flaky 重试）

---

## Spec E4-S4: generate-components flowId E2E 验证

### 1. 概述

组件生成时 flowId 未被 E2E 测试验证，组件可能落入 `unknown` flow，协作数据错乱。

### 2. 目标状态

```typescript
// e2e/component-generation.spec.ts
test('generated component has valid flowId', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="generate-component"]');

  const response = await page.waitForResponse(
    resp => resp.url().includes('/api/generate/component')
  );
  const json = await response.json();

  // flowId 必须存在且为有效 UUID
  expect(json.flowId).toMatch(/^[0-9a-f-]{36}$/);
  expect(json.flowId).not.toBe('unknown');

  // 组件落入了有效的 flow
  const componentInStore = await page.evaluate(() => {
    return window.__componentStore__.getByFlowId(json.flowId);
  });
  expect(componentInStore).toBeDefined();
});
```

### 3. 验收标准

- E2E 测试覆盖 flowId 存在性验证
- `unknown` flow 组件被 API 拒绝（4xx）
- component store 正确关联 flowId

---

## Spec E5-S1: Vitest 迁移

### 1. 概述

Jest + Vitest 双框架共存，维护成本高（两套配置需同步），CI 混乱。统一迁移到 Vitest。

### 2. 迁移步骤

**Step 1**: 安装 Vitest（保留 Jest 逐步迁移）
```bash
npm install -D vitest @vitest/coverage-v8
```

**Step 2**: 创建 Vitest 配置
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'e2e/'],
    },
  },
});
```

**Step 3**: 逐文件迁移 Jest → Vitest

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')` |
| `expect().toHaveBeenCalled()` | `expect().toHaveBeenCalled()`（兼容） |
| `describe.skip` | `describe.skip`（兼容） |
| `beforeAll` | `beforeAll`（兼容） |

**Step 4**: 移除 Jest 配置
```bash
# 删除 jest.config.ts / jest.setup.ts
# 从 package.json scripts 中移除 jest
# 从 package.json devDependencies 移除 jest 相关
```

### 3. 验收标准

- `vitest run` CI 通过
- coverage 报告正常生成（HTML + text）
- Jest 配置完全移除（无 `jest.config` 文件）
- 测试迁移覆盖率 100%（无遗漏测试文件）

---

## Spec E5-S2: waitForTimeout 残留清理

### 1. 概述

20+ 处 `waitForTimeout` 残留（已由 stability.spec.ts 检测），替换为智能等待策略。

### 2. 替换策略

| 场景 | 替换方案 |
|------|----------|
| 等待 API 响应 | `page.waitForResponse()` / `page.waitForRequest()` |
| 等待 DOM 变化 | `page.waitForSelector()` |
| 等待数据加载 | `page.waitForFunction()` 轮询状态 |
| 真实延迟需求 | `page.waitForTimeout()` 仅用于模拟网络延迟测试 |
| 动画完成 | CSS transition + `page.waitForFunction()` |

### 3. 示例

```typescript
// 替换前
await page.waitForTimeout(2000); // 硬编码等待

// 替换后（推荐）
await page.waitForSelector('[data-testid="component-loaded"]');

// 替换后（复杂场景）
await page.waitForFunction(
  () => document.querySelector('[data-testid="component-loaded"]') !== null,
  { timeout: 5000 }
);
```

### 4. 验收标准

- `stability.spec.ts` 零 violations
- 无新的 `waitForTimeout` 引入（lint 规则 `no-waitForTimeout`）
- 测试稳定性提升（无因硬编码等待导致的 flakiness）
