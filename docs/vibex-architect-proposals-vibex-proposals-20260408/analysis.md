# Requirements Analysis — vibex-architect-proposals-20260408

**Analyst:** Architect Agent
**Date:** 2026-04-08
**Cycle:** 2026-W15
**Work Directory:** `/root/.openclaw/vibex`

---

## 业务场景分析

### 1. 当前系统架构现状

VibeX 是一个 AI 驱动的 DDD（Domain-Driven Design）产品建模平台，核心架构：

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 15, App Router)                        │
│  ├── vibex-fronted/src/stores/ (42 files, 7895 LOC)      │
│  ├── vibex-fronted/src/hooks/                             │
│  ├── vibex-fronted/src/services/api/modules/ (15+ modules)│
│  └── vibex-fronted/src/app/ (11+ pages)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                     REST API + SSE
                            │
┌─────────────────────────────────────────────────────────────┐
│  Backend (Cloudflare Workers)                             │
│  ├── routes/ (legacy: 50+ routes)                         │
│  ├── routes/v1/ (new: Hono, 12 routes)                    │
│  ├── services/ (business logic)                           │
│  └── websocket/ (infrastructure present, unused)          │
└─────────────────────────────────────────────────────────────┘
                            │
                     Cloudflare D1 + KV + R2
```

### 2. 关键业务流

| 业务流 | 涉及系统 | 当前状态 |
|--------|---------|---------|
| 用户登录认证 | Auth middleware + JWT | 双重实现，逻辑分散 |
| 创建项目 → 生成 DDD 模型 | Chat → DDD → Canvas | API 已完成，但无实时协作 |
| Canvas 协作编辑 | Canvas + WebSocket | WebSocket 基础设施存在但未集成 |
| API 契约管理 | api-contract.yaml vs 实际路由 | 4668 行契约，90+ 端点，v1 双写问题 |

### 3. 已知的架构债务（来自 docs/learnings/）

**canvas-testing-strategy.md (2026-04-05):**
- Canvas hooks 无测试覆盖导致重构边界条件遗漏
- Mock store 过于简化，无法真实反映 Zustand 行为 → 建议使用真实 store 测试

**vibex-e2e-test-fix.md (2026-04-05):**
- 测试框架边界模糊（Jest + Playwright 冲突）
- `@ci-blocking` 标记失控
- `BASE_URL` 硬编码

**canvas-cors-preflight-500.md:**
- OPTIONS 预检请求命中 auth 中间件返回 401 → 已修复但可能被新代码重新引入

### 4. Git History 关键发现（最近 30 commits）

| 提交 | 主题 | 架构启示 |
|------|------|---------|
| `573f6e0c` | 删除未使用的 CSS | 代码清理及时，tech debt 控制意识好 |
| `9b9ddf4e` | 使用 clearComponentCanvas | API 规范化，单一职责 |
| `c812b06e` | B1 dedup key + E2 retry+timeout | 错误处理标准化待建立 |
| `4fa339e1` | flowId/contextId fallback | API 契约稳定性问题，fallback 掩盖设计缺陷 |
| `68d63021` | OPTIONS preflight 修复 | CORS 问题已修，但未固化到中间件层 |

---

## 技术方案选项

### 方案 A: 渐进式架构重构（推荐）

**核心思路**: 保持现有分支结构不变，通过增量 PR 逐步解决 P0 问题，不阻断业务迭代。

| 阶段 | 行动 | 收益 | 风险 |
|------|------|------|------|
| Sprint 1 | Ar-P0-1 (CORS) + Ar-P0-3 (as any) | 类型安全 + API 稳定性立竿见影 | 中间件变更可能影响全站 |
| Sprint 2 | Ar-P0-2 (Store 治理) | 状态管理健康度大幅提升 | 跨 store 重构需全量回归测试 |
| Sprint 3 | Ar-P1-1 (路由拆分) + Ar-P2-3 (Auth) | API 可维护性 + Auth 一致性 | 路由路径变更需 API 版本管理 |

**优点**:
- 低风险：每个 PR 独立可回滚
- 可测试：每个阶段可独立验收
- 不阻断：业务迭代照常进行

**缺点**:
- 耗时长：18.5d 分散在 3 个 sprint
- 无银弹：P0-2 (Store 治理) 重构时仍可能遗漏边界

### 方案 B: 激进式重构（Big Bang）

**核心思路**: 冻结非关键功能开发，集中 2 周解决所有架构债务。

| 阶段 | 行动 | 收益 | 风险 |
|------|------|------|------|
| Week 1 | Ar-P0-2 + Ar-P0-3 + Ar-P2-1 | 状态管理 + 类型安全 + API 封装一次性到位 | 高并发冲突，PR review 积压 |
| Week 2 | Ar-P1-1 + Ar-P1-2 + Ar-P1-3 | Canvas 路由 + 实时协作 + 清理一次性完成 | 集成测试周期长 |

**优点**:
- 快速见效：2 周内架构健康度全面提升
- 无历史包袱：一次性解决，不留尾巴

**缺点**:
- 高风险：大规模重构冲突概率高，review 积压
- 阻塞业务：2 周内无新功能交付
- 测试地狱：需全量回归，无分层验证

### 方案 C: 外部依赖优先（最小化内部重构）

**核心思路**: 引入外部服务（Sentry 监控、GraphQL 网关）减少内部重构压力。

| 阶段 | 行动 | 收益 | 风险 |
|------|------|------|------|
| Week 1 | 接入 Sentry（监控 as any 影响范围） | 量化问题，指导重构优先级 | 仅观测，不修复 |
| Week 2 | GraphQL Federation 封装现有 REST API | 渐进式 API 版本管理 | 引入新复杂度 |
| Week 3 | Store 治理（按 Sentry 数据排序优先级） | 数据驱动的重构顺序 | GraphQL 学习成本 |

**优点**:
- 外部工具验证问题范围
- 渐进式迁移

**缺点**:
- 引入新依赖（Sentry/GraphQL）
- 未解决核心问题，只是延迟

---

## 可行性评估

### 技术可行性矩阵

| 提案 | 技术难度 | 依赖项 | 团队能力 | 可行性 |
|------|---------|--------|---------|--------|
| Ar-P0-1 CORS | 低 | 无 | 已有修复经验 | ✅ 高 |
| Ar-P0-2 Store 治理 | 高 | Vitest 测试框架 | 需加强 Zustand 测试经验 | ⚠️ 中 |
| Ar-P0-3 as any 消除 | 中 | ESLint error 配置 | 现有 lint 能力覆盖 | ✅ 高 |
| Ar-P1-1 路由拆分 | 中 | v1/canvas 当前实现 | Hono 路由经验已有 | ✅ 高 |
| Ar-P1-2 实时协作 | 高 | WebSocket 基础设施 | 需新增 WebSocket 集成经验 | ⚠️ 中 |
| Ar-P1-3 Legacy 清理 | 低 | git history 分析 | 已有清理经验 | ✅ 高 |
| Ar-P2-1 API Client | 中 | TanStack Query 引入 | 需新增 TanStack Query 经验 | ⚠️ 中 |
| Ar-P2-2 路由重名 | 低 | API contract 更新 | 需协调前端路由修改 | ✅ 高 |
| Ar-P2-3 Auth 双重 | 中 | 中间件重构 | 现有 auth 经验覆盖 | ✅ 高 |

### 资源评估

| 资源 | 当前状态 | 需求 | 缺口 |
|------|---------|------|------|
| 前端 Dev | 1-2 人 | Ar-P0-2 + Ar-P1-2 | 建议增加 1 人专注 Canvas |
| 后端 Dev | 1 人 | Ar-P1-1 + Ar-P2-3 | 现有能力覆盖 |
| QA | 1 人 | 全阶段测试覆盖 | 建议自动化测试先行 |
| Reviewer | 1 人 | 大规模重构 review | 建议分层 review |

---

## 初步风险识别

### 高风险（立即处理）

| # | 风险 | 可能性 | 影响 | 缓解 |
|---|------|--------|------|------|
| R1 | Store 治理重构导致现有功能 regression | 高 | 高 | 必须在 Phase 1 建立完整的 store 测试套件 |
| R2 | CORS 中间件变更影响未测试的 API 路径 | 中 | 高 | 扩大测试范围：覆盖所有跨域 API 调用 |
| R3 | as any 消除引入 TSC 错误，阻断 build | 高 | 中 | 先建立 CI gate，逐文件修复，不一次性全改 |

### 中风险（次优先）

| # | 风险 | 可能性 | 影响 | 缓解 |
|---|------|--------|------|------|
| R4 | v1/canvas 路由拆分导致 API 契约不兼容 | 低 | 高 | 保留旧路由作为 alias，逐步迁移 |
| R5 | 实时协作引入 WebSocket 状态竞争 | 中 | 高 | 使用现有 Redis/KV 的乐观锁机制 |
| R6 | Auth 中间件重构导致现有登录用户 session 失效 | 低 | 中 | 增量式重构，保留旧路径兼容 |

### 低风险（监控）

| # | 风险 | 可能性 | 影响 |
|---|------|--------|------|
| R7 | 路由重名导致 API 文档与实际不一致 | 低 | 低 |
| R8 | API Client 封装引入 TanStack Query 学习曲线 | 中 | 低 |

---

## 验收标准（具体可测试）

### Ar-P0-1: CORS Preflight

```typescript
// test: CORS preflight always returns 204
test('OPTIONS request to any API route returns 204', async ({ request }) => {
  const routes = [
    '/api/v1/canvas/generate-contexts',
    '/api/v1/canvas/generate-flows',
    '/api/auth/login',
    '/api/projects',
  ];
  for (const route of routes) {
    const response = await request.options(`https://api.vibex.top${route}`, {
      headers: { 'Origin': 'https://vibex-app.pages.dev' },
    });
    expect(response.status()).toBe(204);
  }
});
```

### Ar-P0-2: Store 治理

```typescript
// test: no overlapping state keys across stores
test('no overlapping keys between auth-related stores', () => {
  const storeKeys = new Set<string>();
  const authStores = ['authStore', 'guidanceStore', 'onboardingStore'];
  
  for (const storeName of authStores) {
    const store = require(`@/stores/${storeName}`).default;
    const keys = Object.keys(store.getState());
    for (const key of keys) {
      expect(storeKeys.has(key)).toBe(false);
      storeKeys.add(key);
    }
  }
});
```

### Ar-P0-3: as any 消除

```typescript
// test: CI gate — zero as any in production code
test('zero as any violations in production code', () => {
  const violations = execSync(
    'grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v test',
    { encoding: 'utf-8' }
  );
  expect(violations.trim()).toBe('');
});
```

### Ar-P1-1: 路由拆分

```typescript
// test: each canvas endpoint has independent test coverage
test('v1/canvas routes are independently testable', () => {
  const routeFiles = fs.readdirSync('routes/v1/canvas/').filter(f => f.endsWith('.ts') && f !== 'index.ts');
  for (const file of routeFiles) {
    const testFile = `routes/v1/canvas/__tests__/${file.replace('.ts', '.test.ts')}`;
    expect(fs.existsSync(testFile)).toBe(true);
  }
});
```

### Ar-P1-2: 实时协作

```typescript
// test: two tabs see same cursor position within 500ms
test('canvas cursor sync across tabs', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  await page1.goto('/project/test-canvas');
  await page2.goto('/project/test-canvas');

  // Move cursor on page1
  await page1.mouse.move(200, 200);
  
  // Verify cursor visible on page2 within 500ms
  await expect(page2.locator('.cursor-indicator').last()).toBeVisible({ timeout: 500 });
});
```

### Ar-P1-3: Legacy 清理

```typescript
// test: no legacy store references remain
test('canvasStore references are zero', () => {
  const refs = execSync(
    'grep -rn "canvasStore\\b" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v test',
    { encoding: 'utf-8' }
  );
  expect(refs.trim()).toBe('');
});
```

---

## 结论

**推荐方案: 方案 A（渐进式重构）**，分 3 个 sprint 执行：

1. **Sprint 1 (5d)**: P0 Bug 修复 + 类型安全 — 立即提升系统稳定性
2. **Sprint 2 (7d)**: Store 治理 + 路由拆分 — 可维护性核心改进
3. **Sprint 3 (6.5d)**: 实时协作 + TechDebt 清理 — 功能完整性提升

**关键决策点**:
- Store 治理需在 Sprint 1 同步建立测试套件，否则 Sprint 2 重构风险不可控
- as any 消除与 Store 治理可并行（分别由不同人执行）
- Canvas 实时协作作为长期目标，Sprint 3 交付 MVP 即可
