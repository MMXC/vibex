# Epic 5: canvas-e2e 修复与 Contract 扩展

**Epic ID**: E5
**项目**: vibex-tester-proposals-vibex-proposals-20260410
**概述**: 修复 canvas-e2e project 的 testDir 配置，新增 flows API 合约测试，产出 Stryker 决策

---

## 1. 背景

### canvas-e2e project 修复
根 `vibex-fronted/playwright.config.ts` 定义：
```ts
{ name: 'canvas-e2e', testDir: './e2e', use: {...} }
```
`./e2e` 目录不存在，canvas-e2e 项目无法找到任何测试。

### Contract 测试扩展
仅有 `sync.contract.spec.ts`（318 行），flows CRUD API 无合约测试覆盖。

### Stryker 决策
Stryker mutation testing 在 pnpm workspace 阻塞，需要明确决策（Docker CI / 替代指标 / Vitest runner）。

## 2. 范围

### 2.1 包含
- 修正 canvas-e2e testDir 从 `./e2e` 到 `./tests/e2e`
- 新增 flows.contract.spec.ts（参考 sync.contract.spec.ts 模式）
- 产出 Stryker approach 决策文档

### 2.2 不包含
- 实际的 Stryker 执行（仅做方案决策）
- daily-stability.md 建立
- 核心库测试补充（template-applier、requirementValidator 等）

## 3. 技术方案

### 3.1 canvas-e2e testDir 修复

**修改前** (`vibex-fronted/playwright.config.ts`):
```ts
{
  name: 'canvas-e2e',
  testDir: './e2e',
  use: {
    ...devices['Desktop Chrome'],
  },
},
```

**修改后**:
```ts
{
  name: 'canvas-e2e',
  testDir: './tests/e2e',
  use: {
    ...devices['Desktop Chrome'],
  },
},
```

**验证**:
```bash
npx playwright test --project=canvas-e2e --list 2>/dev/null | grep "·" | wc -l
# >= 1
```

### 3.2 flows.contract.spec.ts 新增

**模式**: 参考 `tests/contract/sync.contract.spec.ts`（Zod schema validation + Playwright）

**目标 API**: `/v1/canvas/flows`

**测试内容**:

```ts
// tests/contract/flows.contract.spec.ts
import { test, expect } from '@playwright/test';
import { z } from 'zod';

// Zod schema 定义
const flowSchema = z.object({
  id: z.string(),
  name: z.string(),
  canvasId: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const flowListSchema = z.array(flowSchema);

// API 测试
test.describe('Flows API Contract', () => {
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

  test('GET /v1/canvas/flows returns valid schema', async ({ request }) => {
    const response = await request.get(`${baseUrl}/v1/canvas/flows`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    const result = flowListSchema.safeParse(body);
    expect(result.success, `Schema validation failed: ${result.error}`).toBe(true);
  });

  test('POST /v1/canvas/flows creates flow with valid schema', async ({ request }) => {
    const payload = { name: 'Test Flow', canvasId: 'test-canvas' };
    const response = await request.post(`${baseUrl}/v1/canvas/flows`, { data: payload });
    
    // 201 或 200
    expect([200, 201]).toContain(response.status());
    
    const body = await response.json();
    const result = flowSchema.safeParse(body);
    expect(result.success, `Schema validation failed: ${result.error}`).toBe(true);
  });

  test('GET /v1/canvas/flows/:id returns valid schema', async ({ request }) => {
    // 先创建一个
    const create = await request.post(`${baseUrl}/v1/canvas/flows`, {
      data: { name: 'Temp', canvasId: 'test' }
    });
    const { id } = await create.json();
    
    const response = await request.get(`${baseUrl}/v1/canvas/flows/${id}`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    const result = flowSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  test('PUT /v1/canvas/flows/:id returns valid schema', async ({ request }) => {
    const create = await request.post(`${baseUrl}/v1/canvas/flows`, {
      data: { name: 'Update Me', canvasId: 'test' }
    });
    const { id } = await create.json();

    const response = await request.put(`${baseUrl}/v1/canvas/flows/${id}`, {
      data: { name: 'Updated', status: 'published' }
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const result = flowSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  test('DELETE /v1/canvas/flows/:id returns 204', async ({ request }) => {
    const create = await request.post(`${baseUrl}/v1/canvas/flows`, {
      data: { name: 'Delete Me', canvasId: 'test' }
    });
    const { id } = await create.json();

    const response = await request.delete(`${baseUrl}/v1/canvas/flows/${id}`);
    expect(response.status()).toBe(204);
  });
});
```

### 3.3 Stryker 方案决策

**选项 A: Docker CI 隔离**
- 在 Docker 容器（npm 独立环境）中运行 Stryker
- pros: 绕过 pnpm workspace shaken node_modules
- cons: CI 时间增加 ~10 分钟，需要 Docker build

**选项 B: 接受替代指标**
- E2 contract 测试覆盖 + store coverage 100%
- pros: 无需额外配置
- cons: 无法验证测试有效性（mutation coverage）

**选项 C: Vitest runner 迁移**
- 迁移到 `@stryker-mutator/vitest-runner`
- pros: 与当前 Vitest 生态一致
- cons: Vitest runner 生态尚不成熟，稳定性存疑

**决策文档结构** (`docs/decisions/stryker-approach.md`):
```markdown
# ADR: Stryker Mutation Testing 方案决策

## 状态: 已决定

## 决策
选择: [A/B/C]
理由: ...

## 选项对比
| 维度 | A (Docker) | B (替代指标) | C (Vitest runner) |
|------|-----------|-------------|-------------------|
| 实现成本 | 中 | 低 | 高 |
| 稳定性 | 高 | 高 | 低 |
| CI 时间增量 | ~10min | 无 | ~5min |
| 有效性保障 | 完整 | 部分 | 完整 |
```

## 4. 验收标准

| Story | 验收条件 | 验证命令 |
|-------|---------|---------|
| S5.1 | canvas-e2e testDir 指向 `./tests/e2e` | `grep -A5 "name: 'canvas-e2e'" vibex-fronted/playwright.config.ts \| grep "testDir"` 包含 `./tests/e2e` |
| S5.1 | canvas-e2e 项目找到测试 | `npx playwright test --project=canvas-e2e --list \| grep "·" \| wc -l` >= 1 |
| S5.2 | flows.contract.spec.ts 存在 | `test -f vibex-fronted/tests/contract/flows.contract.spec.ts && echo "PASS"` |
| S5.2 | flows.contract.spec.ts 通过 | `cd vibex-fronted && npx playwright test tests/contract/flows.contract.spec.ts` 0 failures |
| S5.3 | Stryker 决策文档存在 | `test -f vibex-fronted/docs/decisions/stryker-approach.md && echo "PASS"` |

## 5. 预期文件变更

```
# 修改
vibex-fronted/playwright.config.ts                            # canvas-e2e testDir 修复

# 新增
vibex-fronted/tests/contract/flows.contract.spec.ts
vibex-fronted/docs/decisions/stryker-approach.md
```

## 6. 风险

- flows.contract.spec.ts 依赖真实 API 服务，需要 webServer 在 CI 中正常运行
- 缓解: Epic 1 已确保 webServer 配置迁移到根配置，flows 测试可在 E2E CI job 中运行
- Stryker 决策可能引发团队讨论（需要提前准备选项对比）

## 7. 依赖

- Epic 1（Playwright 配置统一）: flows.contract.spec.ts 需要 webServer 配置在根配置中
- 无外部依赖
