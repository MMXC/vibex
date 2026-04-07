# PRD — VibeX 架构债务治理

**Project:** vibex-architect-proposals-vibex-proposals-20260408
**Version:** 1.0
**Date:** 2026-04-08
**Author:** PM Agent
**Cycle:** 2026-W15
**Status:** Draft for Sprint Planning

---

## 1. 执行摘要

### 背景

VibeX 在快速发展中积累了显著的架构债务，体现在 3 个维度：

- **类型安全失守**: 25+ 处 `as any` 散落生产代码，TypeScript 编译防线失效
- **状态管理碎片化**: 42 个 Zustand store（7895 LOC），跨 store 同步靠隐式 `useEffect`，bug surface 持续扩大
- **API 可维护性恶化**: v1/canvas 387 行单路由文件，CORS preflight 问题反复出现，Auth 中间件双重实现

这些问题已导致实际 bug（P0 CORS preflight 500、store 状态陈旧导致 UI 异常），如不治理将持续拖累功能迭代速度。

### 目标

通过渐进式重构，在 3 个 sprint（约 18.5d）内系统性解决 9 个架构提案，交付：

- 生产环境 P0 bug 归零
- TypeScript 类型安全覆盖率 100%
- Store 数量从 42 降至 ≤ 20
- 所有 API 路由可独立测试
- WebSocket 实时协作 MVP 可用

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| CORS preflight 成功率 | <80%（生产） | 100% |
| `as any` 出现次数 | 25+ | 0 |
| Store 文件数量 | 42 | ≤ 20 |
| `as any` 消除后 TSC 错误 | 未知 | 0 |
| `v1/canvas/index.ts` 行数 | 387 行 | ≤ 50 行 |
| Playwright E2E 通过率 | ~60% | 100% |
| WebSocket cursor 同步延迟 | N/A | < 500ms |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 优先级 | 工时 |
|----|--------|------|---------|--------|------|
| Ar-P0-1 | CORS Preflight 修复 | 统一全局 CORS 中间件优先于 auth，确保 OPTIONS 返回 204 | CORS preflight 500 bug 反复出现 | P0 | 0.5d |
| Ar-P0-2 | Zustand Store 治理 | 合并重叠 stores，建立跨 store 同步契约，消除隐式依赖 | 状态碎片化导致跨 store bug | P0 | 4d |
| Ar-P0-3 | TypeScript `as any` 消除 | 强制 error 级别 lint gate，逐文件消除类型断言 | 类型安全防线失效 | P0 | 3d |
| Ar-P1-1 | v1/canvas 路由拆分 | 将 387 行单文件拆分为独立子路由 + 独立测试 | API 单点故障风险 | P1 | 2d |
| Ar-P1-2 | Canvas 实时协作 MVP | WebSocket presence layer + SSE 状态推送 | 协作功能缺失 | P1 | 4d |
| Ar-P1-3 | Legacy Store 清理 | 彻底清除废弃 canvasStore 残留引用 | 死代码累积 | P1 | 1d |
| Ar-P2-1 | API Client 统一封装 | 提取统一 HTTP client + TanStack Query 集成 | API 调用重复逻辑 | P2 | 2d |
| Ar-P2-2 | 路由重命名 | 统一 `/ddd` → `/ddd/contexts`，`/diagnosis` → `/requirement/diagnosis` | 路径语义混淆 | P2 | 1d |
| Ar-P2-3 | Auth 中间件统一 | 合并 `middleware/auth.ts` 和 `routes/auth/*` 到 `lib/auth.ts` | auth 逻辑不一致 | P2 | 1d |
| **合计** | | | | | **18.5d** |

---

## 3. Epic 拆分表

### Epic 1: P0 稳定性修复 — Sprint 1（5d）

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|---------|
| Epic 1 | Ar-P0-1: CORS Preflight 全局中间件 | 0.5d | OPTIONS 请求到任意 API 路由返回 204；Playwright 跨域 fetch 不触发 401 |
| Epic 1 | Ar-P0-2: Store 治理 Phase 1（清单+依赖图） | 1d | `pnpm exec ts-node scripts/audit-stores.ts` 输出 store 清单.csv + dependency-graph.dot |
| Epic 1 | Ar-P0-2: Store 治理 Phase 2（合并重叠） | 2d | auth slice 合并完成；`find src/stores -name "*.ts" \| wc -l` ≤ 30 |
| Epic 1 | Ar-P0-2: Store 治理 Phase 3（同步契约） | 1d | 跨 store 同步用 middleware 而非 useEffect；`grep -r "useEffect.*store" src/components/canvas/ \| wc -l` ≤ 3 |
| Epic 1 | Ar-P0-3: `as any` 消除 — lint gate | 0.5d | `.eslintrc` 中 `no-explicit-any` 为 error 级别；CI 失败检测 `as any` |
| Epic 1 | Ar-P0-3: `as any` 消除 — 逐文件修复 | 2.5d | `grep -rn "as any" src/ --include="*.ts" --include="*.tsx" \| grep -v test \| wc -l` = 0；`pnpm build` 无 TSC 错误 |

### Epic 2: P1 可维护性改进 — Sprint 2（7d）

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|---------|
| Epic 2 | Ar-P1-1: v1/canvas 路由拆分 | 2d | 每个 canvas 端点独立文件；`wc -l routes/v1/canvas/index.ts` ≤ 50；覆盖率 ≥ 80% |
| Epic 2 | Ar-P1-2: WebSocket Presence Layer | 2d | 两个 tab 打开同一 canvas，cursor 位置同步 < 500ms；无内存泄漏 |
| Epic 2 | Ar-P1-2: SSE 状态推送 | 2d | canvas 对象增删改时订阅者收到推送；Playwright E2E 验证 |
| Epic 2 | Ar-P1-3: Legacy Store 清理 | 1d | 所有 legacy store 有 `@deprecated` 注释；`grep -rn "canvasStore\b" src/ --include="*.ts" \| wc -l` = 0 |

### Epic 3: P2 平台基础设施 — Sprint 3（6.5d）

| Epic | Story | 工时 | 验收标准 |
|------|-------|------|---------|
| Epic 3 | Ar-P2-1: API Client 统一封装 | 2d | `services/api/client.ts` 存在；每个 module 文件减少 ≥ 50% 重复代码 |
| Epic 3 | Ar-P2-2: 路由重命名 | 1d | API 文档中 16 个 tag 无语义重叠；`api-contract.yaml` 更新；migration guide 存在 |
| Epic 3 | Ar-P2-3: Auth 中间件统一 | 1d | `lib/auth.ts` 是唯一 auth 核心逻辑来源；Auth 单元测试 ≥ 10 个 |

---

## 4. 验收标准（可执行断言）

### Epic 1 — P0 稳定性修复

#### Story: Ar-P0-1 CORS Preflight

```typescript
// e2e/vibex-cors.spec.ts
test('OPTIONS preflight to any API route returns 204', async ({ request }) => {
  const routes = [
    '/api/v1/canvas/generate-contexts',
    '/api/v1/canvas/generate-flows',
    '/api/auth/login',
    '/api/projects',
  ];
  for (const route of routes) {
    const res = await request.options(`https://api.vibex.top${route}`, {
      headers: { 'Origin': 'https://vibex-app.pages.dev', 'Access-Control-Request-Method': 'POST' },
    });
    expect(res.status()).toBe(204);
    expect(res.headers()['access-control-allow-origin']).toBeTruthy();
  }
});

test('cross-origin fetch to canvas API does not trigger 401', async ({ page }) => {
  await page.goto('https://vibex-app.pages.dev/project/test-project');
  // Intercept fetch and verify OPTIONS → 204 → POST → 200
  const response = await page.evaluate(async () => {
    const res = await fetch('https://api.vibex.top/api/v1/canvas/generate-contexts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'test' }),
    });
    return { status: res.status, ok: res.ok };
  });
  expect(response.ok).toBe(true);
  expect(response.status).not.toBe(401);
});
```

#### Story: Ar-P0-2 Store 治理

```typescript
// e2e/vibex-store-governance.spec.ts
test('total store file count ≤ 20', () => {
  const count = execSync('find vibex-fronted/src/stores -name "*.ts" | wc -l', { encoding: 'utf-8' }).trim();
  expect(parseInt(count)).toBeLessThanOrEqual(20);
});

test('no overlapping keys across auth-related stores', () => {
  const storeKeys = new Set<string>();
  const authStores = ['authStore', 'guidanceStore', 'onboardingStore'];
  for (const storeName of authStores) {
    const store = require(`@/stores/${storeName}`).default;
    const keys = Object.keys(store.getState());
    for (const key of keys) {
      expect(storeKeys.has(key)).toBe(false).fail(`Duplicate key "${key}" across stores`);
      storeKeys.add(key);
    }
  }
});

test('cross-store sync via middleware, not useEffect', () => {
  const count = execSync(
    'grep -r "useEffect.*store" vibex-fronted/src/components/canvas/ | wc -l',
    { encoding: 'utf-8' }
  ).trim();
  expect(parseInt(count)).toBeLessThanOrEqual(3);
});

test('store unit tests pass 100%', () => {
  const result = execSync('pnpm test:unit stores/ --run', { encoding: 'utf-8' });
  expect(result).toContain('Test Suites: 100% passed');
});
```

#### Story: Ar-P0-3 `as any` 消除

```typescript
// e2e/vibex-typescript-safety.spec.ts
test('zero as any in production code', () => {
  const violations = execSync(
    'grep -rn "as any" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v test',
    { encoding: 'utf-8' }
  );
  expect(violations.trim()).toBe('');
});

test('pnpm build has zero TSC errors', () => {
  const result = execSync('cd vibex-fronted && pnpm build 2>&1', { encoding: 'utf-8' });
  expect(result).not.toContain('error TS');
});

test('CI lint gate blocks as any', () => {
  // Simulate CI: lint must fail if as any exists
  const result = execSync('cd vibex-fronted && pnpm lint 2>&1', { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' });
  expect(result).not.toContain('error  @typescript-eslint/no-explicit-any');
});
```

### Epic 2 — P1 可维护性改进

#### Story: Ar-P1-1 路由拆分

```typescript
// e2e/vibex-route-split.spec.ts
test('v1/canvas/index.ts ≤ 50 lines', () => {
  const lines = execSync('wc -l < routes/v1/canvas/index.ts', { encoding: 'utf-8' }).trim();
  expect(parseInt(lines)).toBeLessThanOrEqual(50);
});

test('each canvas endpoint has independent test file', () => {
  const routeFiles = execSync(
    'ls routes/v1/canvas/ | grep -v index.ts | grep -v __tests__',
    { encoding: 'utf-8' }
  ).trim().split('\n').filter(f => f.endsWith('.ts'));
  for (const file of routeFiles) {
    const testFile = `routes/v1/canvas/__tests__/${file.replace('.ts', '.test.ts')}`;
    expect(execSync(`test -f ${testFile} && echo yes || echo no`, { encoding: 'utf-8' }).trim()).toBe('yes');
  }
});

test('canvas route test coverage ≥ 80%', () => {
  const result = execSync('pnpm test:coverage routes/v1/canvas/ --run', { encoding: 'utf-8' });
  // Extract coverage percentage from output
  const match = result.match(/All files.*?(\d+\.?\d*)%/);
  expect(match).not.toBeNull();
  expect(parseFloat(match[1])).toBeGreaterThanOrEqual(80);
});
```

#### Story: Ar-P1-2 实时协作

```typescript
// e2e/vibex-realtime-collaboration.spec.ts
test('two tabs see same cursor position within 500ms', async ({ browser }) => {
  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  await Promise.all([
    page1.goto('https://vibex-app.pages.dev/project/test-canvas'),
    page2.goto('https://vibex-app.pages.dev/project/test-canvas'),
  ]);

  await page1.mouse.move(200, 200);

  // Wait for cursor sync
  const cursorVisible = await page2.locator('.cursor-indicator').last().isVisible({ timeout: 500 });
  expect(cursorVisible).toBe(true);

  await ctx1.close();
  await ctx2.close();
});

test('WebSocket connection pool has no memory leak', async ({ browser }) => {
  // Open/close 100 connections
  for (let i = 0; i < 100; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('https://vibex-app.pages.dev/project/test-canvas');
    await ctx.close();
  }
  // Memory should stabilize (check via process.memoryUsage() if accessible)
  // Or: connection count returns to near-zero after GC
});
```

#### Story: Ar-P1-3 Legacy 清理

```typescript
// e2e/vibex-legacy-cleanup.spec.ts
test('all legacy stores have @deprecated annotation', () => {
  const legacyStores = execSync(
    'grep -rl "canvasStore\\|deprecatedStore" vibex-fronted/src/stores/ --include="*.ts"',
    { encoding: 'utf-8' }
  ).trim().split('\n').filter(Boolean);
  for (const file of legacyStores) {
    const content = execSync(`cat ${file}`, { encoding: 'utf-8' });
    expect(content).toContain('@deprecated');
  }
});

test('zero canvasStore references in production code', () => {
  const refs = execSync(
    'grep -rn "canvasStore\\b" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v test | grep -v deprecated',
    { encoding: 'utf-8' }
  );
  expect(refs.trim()).toBe('');
});
```

### Epic 3 — P2 平台基础设施

#### Story: Ar-P2-1 API Client

```typescript
// e2e/vibex-api-client.spec.ts
test('services/api/client.ts exists with unified methods', () => {
  const content = execSync('cat services/api/client.ts', { encoding: 'utf-8' });
  expect(content).toContain('get(');
  expect(content).toContain('post(');
  expect(content).toContain('fetchWithRetry');
});

test('module files use apiClient instead of raw fetch', () => {
  const violations = execSync(
    'grep -rn "fetch(" services/api/modules/ --include="*.ts" | grep -v client.ts | grep -v test',
    { encoding: 'utf-8' }
  );
  expect(violations.trim()).toBe('');
});
```

#### Story: Ar-P2-2 路由重命名

```typescript
// e2e/vibex-route-rename.spec.ts
test('api-contract.yaml reflects renamed routes', () => {
  const content = execSync('cat api-contract.yaml', { encoding: 'utf-8' });
  expect(content).toContain('/ddd/contexts');
  expect(content).toContain('/requirement/diagnosis');
  expect(content).not.toMatch(/\/ddd\s*:\s*\n\s*description:.*\n\s*(?!.*context)/');
});

test('no semantic overlap across 16 API tags', () => {
  // Ensure each tag description is unique enough to distinguish
  const tagDescriptions = execSync(
    'grep -A2 "^  /" api-contract.yaml | grep description',
    { encoding: 'utf-8' }
  );
  // Manual review required — but check for common confusion pairs
  expect(tagDescriptions).not.toContain('DDD AND diagnosis overlap');
});
```

#### Story: Ar-P2-3 Auth 中间件统一

```typescript
// e2e/vibex-auth-unified.spec.ts
test('lib/auth.ts is single source of truth for auth logic', () => {
  const libAuthContent = execSync('cat lib/auth.ts', { encoding: 'utf-8' });
  expect(libAuthContent).toContain('verifyToken');
  expect(libAuthContent).toContain('hashPassword');
  expect(libAuthContent).not.toContain('// duplicated');
});

test('middleware and routes import from lib/auth', () => {
  const middlewareContent = execSync('cat middleware/auth.ts', { encoding: 'utf-8' });
  expect(middlewareContent).toContain("from '../lib/auth'");
  
  const routesContent = execSync('cat routes/auth/login.ts', { encoding: 'utf-8' });
  expect(routesContent).toContain("from '../../lib/auth'");
});

test('auth unit tests ≥ 10 covering edge cases', () => {
  const result = execSync('pnpm test:unit lib/auth.test.ts --run', { encoding: 'utf-8' });
  const match = result.match(/Tests:\s+(\d+)\s+passed/);
  expect(match).not.toBeNull();
  expect(parseInt(match[1])).toBeGreaterThanOrEqual(10);
});
```

---

## 5. Definition of Done（DoD）

### Sprint-level DoD

- [ ] 所有 P0 Bug 修复已合并到 `main` 分支
- [ ] Playwright E2E 测试 100% 通过
- [ ] `pnpm build` 零 TSC 错误
- [ ] `pnpm lint` 零 `@typescript-eslint/no-explicit-any` 错误
- [ ] Store 数量从 42 降至 ≤ 20
- [ ] `v1/canvas/index.ts` 从 387 行降至 ≤ 50 行
- [ ] WebSocket cursor 同步延迟 < 500ms（已验证）
- [ ] 所有 API 路由有独立测试文件，覆盖率 ≥ 80%
- [ ] `api-contract.yaml` 与实际路由 100% 对齐
- [ ] PR review 通过，无未解决的 blocking comments
- [ ] Migration guide 已发布（路由重命名场景）
- [ ] 技术债务追踪文档已更新（`docs/learnings/`）

### Story-level DoD（每个 Story 必须满足）

- [ ] 功能代码已实现，通过 Code Review
- [ ] 对应的 Playwright E2E 测试存在且通过
- [ ] 对应的单元测试存在且通过（如适用）
- [ ] 文档已更新（README / api-contract.yaml / migration guide）
- [ ] 无新增 `as any` 或 `// TODO` 引入新的 tech debt
- [ ] 验收标准中的 `expect()` 断言已写入测试文件

### Non-Functional DoD（贯穿全项目）

- [ ] **性能**: 任意单个 API 响应时间 P95 < 500ms（现有基线）
- [ ] **稳定性**: CI 通过率 ≥ 95%（当前 sprint 周期内）
- [ ] **可维护性**: 每个 PR 的 changed lines ≤ 500（鼓励小 PR）
- [ ] **安全性**: Auth 逻辑无双重标准，JWT 验证统一在 `lib/auth.ts`
- [ ] **向后兼容**: 路由重命名时旧路由保留 30 天 alias（deprecation period）

---

## 6. 执行计划

### Sprint 1: P0 稳定性修复（5d）

```
Day 1:   Ar-P0-1 (0.5d) + Ar-P0-2 Phase1 (0.5d) + Ar-P0-3 lint gate (0.5d)
Day 2-3: Ar-P0-2 Phase2 (2d) — Store 合并
Day 4:   Ar-P0-2 Phase3 (1d) + Ar-P0-3 逐文件修复 (1d)
Day 5:   Ar-P0-3 逐文件修复 (1.5d) + Sprint1 验收
```

### Sprint 2: P1 可维护性改进（7d）

```
Day 1-2: Ar-P1-1 路由拆分 (2d)
Day 3-4: Ar-P1-2 WebSocket Presence (2d)
Day 5-6: Ar-P1-2 SSE 推送 (2d)
Day 7:   Ar-P1-3 Legacy 清理 (1d) + Sprint2 验收
```

### Sprint 3: P2 平台基础设施（6.5d）

```
Day 1-2: Ar-P2-1 API Client (2d)
Day 3:   Ar-P2-2 路由重命名 (1d)
Day 4:   Ar-P2-3 Auth 统一 (1d)
Day 5:   集成测试 + 回归测试
Day 6-7: Sprint3 验收 + 全量回归
```

---

## 7. Out of Scope

- 新功能开发（暂停，待架构稳定后恢复）
- 移动端适配
- GraphQL Federation 迁移（方案 C 中的外部依赖）
- 国际化（i18n）
- 性能优化（CDN、图片压缩等非架构议题）

---

## 8. 依赖关系

| 前置条件 | 影响项 |
|---------|--------|
| Ar-P0-1 CORS 修复 | Ar-P1-2 实时协作（SSE/WebSocket 依赖 CORS） |
| Ar-P0-2 Store 治理 | Ar-P1-1 路由拆分（共享 store 数据模型） |
| Ar-P0-3 `as any` 消除 | Ar-P2-1 API Client 封装（类型安全是封装前提） |
| Ar-P1-1 路由拆分 | Ar-P2-2 路由重命名（拆分后统一命名） |

---

*文档版本: v1.0 | 最后更新: 2026-04-08*
