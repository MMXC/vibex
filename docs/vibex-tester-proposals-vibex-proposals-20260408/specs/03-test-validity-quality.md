# Spec: Epic 3 — 测试有效性与质量指标

**项目**: vibex-tester-proposals-vibex-proposals-20260408  
**Epic**: 测试有效性与质量指标  
**工时**: 1.5 人天  
**Owner**: Tester Agent / Architect Agent  

---

## 1. 概述与目标

Epic 3 聚焦于建立测试有效性保障机制和 API mock 规范化。当前 Stryker 突变测试在 pnpm workspace 环境下阻塞无法运行，导致无法验证测试套件自身的有效性；同时 E2E 测试的 API mock 策略不统一（部分用 `page.route()`，部分硬编码），影响测试准确性和可维护性。本 Epic 目标是在 1.5 人天内试点 MSW 统一 mock 策略，并在 Week 3 做出 Stryker 方案决策。

## 2. Story S3.1: MSW 试点引入

### 目标
在 `tests/contract/sync.contract.spec.ts` 中试点引入 Mock Service Worker (MSW)，提取共享 mock handlers 到 `tests/fixtures/msw/`，统一 API mock 策略。

### 背景

**当前问题**:
- `sync.contract.spec.ts` 使用 `page.route()` mock HTTP 请求
- 单元测试使用 `vi.mock()` / `jest.mock()`
- 两种策略不一致，mock 数据可能与实际 API schema 脱节

**MSW 优势**:
- 统一 mock 策略：E2E 和单元测试共用 handlers
- 浏览器真实环境中的 API 拦截（更接近真实场景）
- mock 数据与 Zod schema 一致（单一来源）

### 实施步骤

#### Step 1: 安装 MSW
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm add -D @mswjs/msw @mswjs/interceptors msw
```

#### Step 2: 创建 handlers 目录
```bash
mkdir -p tests/fixtures/msw
```

#### Step 3: 创建共享 handlers
```typescript
// tests/fixtures/msw/canvas.handlers.ts
import { http, HttpResponse } from 'msw';
import { z } from 'zod';

// Zod schema（单一来源）
const SnapshotSchema = z.object({
  id: z.string(),
  canvasId: z.string(),
  data: z.record(z.unknown()),
  createdAt: z.string().datetime()
});

export const canvasHandlers = [
  // GET /v1/canvas/snapshots
  http.get('/v1/canvas/snapshots', ({ request }) => {
    const url = new URL(request.url);
    const canvasId = url.searchParams.get('canvasId');
    
    return HttpResponse.json({
      snapshots: [
        {
          id: 'snap-001',
          canvasId: canvasId || 'canvas-123',
          data: { nodes: [], edges: [] },
          createdAt: new Date().toISOString()
        }
      ]
    });
  }),
  
  // POST /v1/canvas/snapshots
  http.post('/v1/canvas/snapshots', async ({ request }) => {
    const body = await request.json();
    
    // Zod validation
    const result = SnapshotSchema.safeParse(body);
    if (!result.success) {
      return HttpResponse.json(
        { error: 'Invalid snapshot data', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      id: `snap-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    }, { status: 201 });
  }),
  
  // GET /v1/canvas/snapshots/:id
  http.get('/v1/canvas/snapshots/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      canvasId: 'canvas-123',
      data: { nodes: [], edges: [] },
      createdAt: new Date().toISOString()
    });
  }),
  
  // POST /v1/canvas/snapshots/:id/restore
  http.post('/v1/canvas/snapshots/:id/restore', () => {
    return HttpResponse.json({ success: true });
  }),
  
  // GET /v1/canvas/snapshots/:id/rollback
  http.get('/v1/canvas/snapshots/:id/rollback', () => {
    return HttpResponse.json({
      snapshot: { id: 'snap-rollback', data: {} }
    });
  }),
  
  // POST /v1/canvas/snapshots/:id/rollback
  http.post('/v1/canvas/snapshots/:id/rollback', () => {
    return HttpResponse.json({ success: true });
  })
];
```

#### Step 4: 创建 browser worker setup
```typescript
// tests/fixtures/msw/browser.ts
import { setupWorker } from 'msw/browser';
import { canvasHandlers } from './canvas.handlers';

export const worker = setupWorker(...canvasHandlers);
```

#### Step 5: 创建 MSW 初始化辅助函数
```typescript
// tests/fixtures/msw/index.ts
import { setupServer } from 'msw/node';
import { canvasHandlers } from './canvas.handlers';

// Node.js server (for unit tests)
export const server = setupServer(...canvasHandlers);

// Browser worker (for E2E tests)
export { worker } from './browser';
```

#### Step 6: 迁移 sync.contract.spec.ts
```typescript
// tests/contract/sync.contract.spec.ts (迁移后)
import { test, expect } from '@playwright/test';
import { worker } from '../fixtures/msw';

test.beforeEach(async ({ page }) => {
  // 启动 MSW worker
  await worker.start({
    onUnhandledRequest: 'bypass', // 允许未处理的请求通过
  });
});

test.afterEach(async () => {
  // 停止 MSW worker
  await worker.stop();
});

test.describe('Snapshot API Contract Tests', () => {
  test('GET /v1/canvas/snapshots returns valid snapshot list', async ({ page }) => {
    const response = await page.request.get('/v1/canvas/snapshots?canvasId=canvas-123');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.snapshots).toBeInstanceOf(Array);
    expect(body.snapshots[0]).toHaveProperty('id');
    expect(body.snapshots[0]).toHaveProperty('canvasId');
    expect(body.snapshots[0]).toHaveProperty('data');
    expect(body.snapshots[0]).toHaveProperty('createdAt');
  });
  
  test('POST /v1/canvas/snapshots creates snapshot with valid data', async ({ page }) => {
    const payload = {
      canvasId: 'canvas-123',
      data: { nodes: [], edges: [] }
    };
    
    const response = await page.request.post('/v1/canvas/snapshots', {
      data: payload
    });
    
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.canvasId).toBe(payload.canvasId);
  });
  
  test('POST /v1/canvas/snapshots rejects invalid data', async ({ page }) => {
    const response = await page.request.post('/v1/canvas/snapshots', {
      data: { invalidField: 'value' } // 缺少必需字段
    });
    
    expect(response.status()).toBe(400);
  });
});
```

### 验收标准
- [ ] `tests/fixtures/msw/` 目录存在，包含 `canvas.handlers.ts`
- [ ] `sync.contract.spec.ts` 使用 MSW 而非 `page.route()`
- [ ] MSW handlers 使用 Zod schema 验证请求数据
- [ ] `npx playwright test tests/contract/sync.contract.spec.ts` 全部通过
- [ ] `page.route()` 在 sync.contract.spec.ts 中的使用数量 = 0

---

## 3. Story S3.2: Stryker 方案决策

### 目标
在 Week 3（2026-04-14~18）评估 Stryker 运行状况，做出明确的决策：接受替代指标或迁移 Vitest。

### 背景

**当前阻塞**:
- Stryker 已在 `stryker.conf.json` 配置，1492 mutants 通过 instrumenter
- 但 `@stryker-mutator/jest-runner` 无法加载（pnpm workspace shaken node_modules）
- `test-quality-report.md`（2026-04-03/04）详细记录了问题

**替代指标现状**:
- E2 contract tests: 66 个（已达标）
- Store 覆盖率: 100%（canvas stores，110 tests）

### 决策流程

#### 评估时间
Week 3 Day 3（2026-04-16）

#### 评估维度

| 维度 | 接受替代指标 | 迁移 Vitest |
|------|-------------|-------------|
| 工作量 | 0.5 天（写决策文档） | 2 天（迁移） |
| 风险 | 无（Stryker 仍可选） | 中（大规模语法迁移） |
| 测试有效性保障 | 间接（通过 E2 合约 + 覆盖率） | 直接（mutation score） |
| 长期维护 | 中（Stryker 仍阻塞） | 高（统一 Vitest） |

#### 方案 A: 接受替代指标
```markdown
# docs/decisions/stryker-decision.md

## Decision: 接受 Stryker 替代指标

### Status: ACCEPTED

### Context
Stryker 在 pnpm workspace 环境下无法运行，尝试方案包括：
- CI Docker 容器隔离（npm 独立环境）
- 迁移到 Vitest + vitest-runner

### Decision
**接受替代指标，不强行解决 Stryker 阻塞问题**

### Rationale
1. **替代指标已充分**：
   - E2 合约测试 66 个，覆盖主要 API 端点
   - Canvas store 覆盖率 100%（110 tests）
   - E1-E6 Hook 覆盖率 97.29%
2. **Stryker 工作量不划算**：解决 pnpm workspace 阻塞需要 ≥2 天，且可能引入新问题
3. **迁移 Vitest 可选**：作为独立技术债务，不在本项目范围内

### Consequences
- 测试有效性通过覆盖率 + 合约测试间接保障
- Stryker 决策文档记录在 `docs/decisions/stryker-decision.md`
- 如未来有需要，可随时启动 Vitest 迁移项目

### Alternatives Considered
- **CI Docker**: 需要额外基础设施，不在本项目范围内
- **迁移 Vitest**: 工作量 2 天，优先级低于功能开发
```

#### 方案 B: 迁移 Vitest
```markdown
# docs/decisions/stryker-decision.md

## Decision: 迁移 Jest → Vitest

### Status: ACCEPTED

### Context
Stryker 在 pnpm workspace 环境下无法运行，根因是 `@stryker-mutator/jest-runner` 与 pnpm shaken node_modules 不兼容。

### Decision
**迁移前端测试框架到 Vitest，使用 @stryker-mutator/vitest-runner**

### Implementation
1. 安装 Vitest 并配置 `vitest.config.ts`
2. 迁移 `jest.fn()` → `vi.fn()`
3. 迁移 `jest.mock()` → `vi.mock()`
4. 运行 Stryker with vitest-runner
5. 验收：mutation score ≥ 60%

### Consequences
- 测试框架统一（Vitest），维护成本降低
- Stryker 可用，测试有效性直接可测
- 需要更新 CI pipeline（Jest → Vitest）
```

### 验收标准
- [ ] `docs/decisions/stryker-decision.md` 存在
- [ ] 文档包含完整的 Context、Decision、Consequences、Alternatives
- [ ] 文档经过团队评审（至少 1 人 approve）
- [ ] 如果接受替代指标：E2 contract tests ≥ 20，store 覆盖率 100% 已记录
- [ ] 如果迁移 Vitest：`vitest.config.ts` 存在且通过验证

---

## 4. 交付物清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `tests/fixtures/msw/canvas.handlers.ts` | 新增 | Canvas API MSW handlers |
| `tests/fixtures/msw/browser.ts` | 新增 | MSW browser worker setup |
| `tests/fixtures/msw/index.ts` | 新增 | MSW 导出入口 |
| `tests/contract/sync.contract.spec.ts` | 修改 | 迁移到 MSW |
| `docs/decisions/stryker-decision.md` | 新增 | Stryker 决策文档 |

---

## 5. 技术约束

1. **向后兼容**: MSW 试点不影响现有 `page.route()` 测试，逐步迁移
2. **Schema 单一来源**: MSW handlers 必须基于 Zod schema，避免 mock 数据与 API 实际行为脱节
3. **Worker 生命周期**: 每个测试前启动 (`worker.start`)，测试后停止 (`worker.stop`)
4. **unhandledRequest**: 设置 `onUnhandledRequest: 'bypass'`，避免误拦截
5. **Stryker 决策文档**: 必须包含完整的 ADR (Architecture Decision Record) 格式

---

*Spec 由 PM Agent 生成于 2026-04-08*
