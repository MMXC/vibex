# AGENTS.md: VibeX Proposals 2026-04-06

> **项目**: vibex-tester-proposals-vibex-proposals-20260406  
> **阶段**: design-architecture  
> **作者**: architect (subagent)  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 1. 开发约束

### 1.1 适用项目

| 项目 | 路径 |
|------|------|
| Backend | `vibex-backend/src/` |
| Frontend | `vibex-fronted/src/` |
| Scripts | `vibex-backend/scripts/` |

### 1.2 技术规范

| 规范 | 要求 |
|------|------|
| 语言 | TypeScript 5.x，保持 strict 模式 |
| 运行时 | Cloudflare Workers (Wrangler 3.x) |
| 测试框架 | Jest + ts-jest (现有 jest.config.js) |
| E2E 测试 | Playwright (现有 playwright.config.ts) |
| Linter | ESLint (现有 eslint.config.mjs) |
| 格式化 | Prettier (如项目有配置) |

### 1.3 Epic 特定约束

#### E1: OPTIONS 路由修复
- **禁止**: 在 `corsOptionsHandler` 中引入新的业务逻辑
- **禁止**: 改变其他已注册中间件的顺序（仅调整 OPTIONS 位置）
- **必须**: OPTIONS handler 不经过 authMiddleware
- **必须**: 保留所有现有 CORS headers

#### E2: Canvas checkbox 修复
- **禁止**: 在 checkbox onChange 中同时调用 `toggleContextNode` 和 `onToggleSelect`
- **禁止**: 改变 checkbox 的其他事件行为（仅修 onChange 回调）
- **必须**: 保持 `selectedNodeIds` Set 的不可变性（创建新 Set）

#### E3: flowId schema 修复
- **禁止**: 删除或重命名现有 schema 字段（向后兼容）
- **禁止**: AI prompt 中删除其他必要字段（仅新增 flowId 要求）
- **必须**: 后端添加 flowId 验证，非法值抛出 ValidationError

#### E4: SSE 超时
- **禁止**: 在 `cancel()` 中引入 async 阻塞操作（必须同步清理 timer）
- **禁止**: 移除现有 `aiService.chat()` 的错误处理
- **必须**: 使用 `AbortController.timeout(10000)` 或 `setTimeout` + `clearTimeout`
- **必须**: `cancel()` 中必须调用 `clearTimeout`

#### E5: 分布式限流
- **禁止**: 修改 `RateLimitResult` 接口签名（外部依赖不变）
- **禁止**: 在 Cache API 操作中引入不必要的 await（性能）
- **必须**: `caches.default` 操作必须加 try-catch（Cache 可能不可用）
- **必须**: wrangler.toml `compatibility_date` ≥ 2022-10-10

#### E6: test-notify 去重
- **禁止**: 在 `.dedup-cache.json` 中存储敏感数据
- **禁止**: 使用数据库实现（保持脚本轻量）
- **必须**: `checkDedup()` 幂等，多次调用不改变状态
- **必须**: 文件读写使用同步操作（Node 单进程）

---

## 2. 代码风格规范

### 2.1 TypeScript

```typescript
// ✅ 使用具体类型，避免 any
function validateFlowId(component: GeneratedComponent): void

// ❌ 禁止
function validateFlowId(component: any): void

// ✅ 接口命名
interface RateLimitResult { allowed: boolean; remaining: number; resetAt: number; }

// ✅ 错误处理
try {
  const cached = await cache.match(key);
} catch (err) {
  console.error('[rateLimit] Cache unavailable:', err);
  // 降级到允许
  return { allowed: true, remaining: limit, resetAt: Date.now() };
}
```

### 2.2 Jest 测试

```typescript
// ✅ 描述性测试名
describe('E4: SSE Timeout + Cleanup', () => {
  it('clears timeout on cancel', async () => { ... });
});

// ❌ 模糊测试名
it('test 1', () => { ... });

// ✅ 使用 fake timers 明确
jest.useFakeTimers();
// ...
jest.useRealTimers();

// ✅ 每个验收标准对应至少一个测试
describe('AC1: OPTIONS returns 204 + CORS headers', () => {
  it('returns 204 for OPTIONS request', ...);
  it('includes Access-Control-Allow-Origin header', ...);
  it('does not return 401 for OPTIONS', ...);
});
```

### 2.3 React 组件 (E2)

```typescript
// ✅ 事件处理清晰
<Checkbox
  checked={selectedNodeIds.has(node.id)}
  onChange={() => onToggleSelect(node.id)}
/>

// ❌ 内联复杂逻辑
<Checkbox onChange={() => {
  const newSet = new Set(selectedNodeIds);
  newSet.has(node.id) ? newSet.delete(node.id) : newSet.add(node.id);
  setSelectedNodeIds(newSet);
}} />

// ✅ 使用 useCallback 优化
const handleToggle = useCallback((nodeId: string) => {
  onToggleSelect(nodeId);
}, [onToggleSelect]);
```

---

## 3. 禁止事项

| # | 禁止行为 | 原因 | 替代方案 |
|---|---------|------|----------|
| B1 | `git push --force` 到 main | 破坏历史 | `git revert` |
| B2 | 直接修改 `node_modules/` | 不可持久化 | 修改源码或配置 |
| B3 | 在测试中使用 `setTimeout` 真实延迟 | 拖慢 CI | `jest.useFakeTimers()` |
| B4 | `console.log` 在生产代码中 | 无结构化日志 | 使用 `logger.ts` |
| B5 | 跳过 lint/prettier 检查 | 代码风格不一致 | `pnpm lint && pnpm format` |
| B6 | 修改其他 Epic 的代码 | 职责范围外 | 走 PR + reviewer |
| B7 | 在 E5 中删除内存 Map 而不保留接口 | Breaking change | 保留 `RateLimitResult` |
| B8 | E6 使用数据库存储去重状态 | 过度工程 | JSON 文件 |
| B9 | `any` 类型无注释 | 类型安全 | 明确类型或 `// TODO: type` |

---

## 4. 测试要求

### 4.1 覆盖率目标

```bash
# 所有测试必须通过，且覆盖率达标
pnpm --filter vibex-backend test -- --coverage
# Expected: lines ≥ 80%, branches ≥ 80%
```

### 4.2 Epic 测试映射

| Epic | 测试文件 | 覆盖率目标 |
|------|----------|-----------|
| E1 | `tests/e1-options-cors.test.ts` | 100% branches |
| E2 | `tests/e2-canvas-checkbox.test.tsx` | ≥ 90% |
| E3 | `tests/e3-flowid-generation.test.ts` | 100% validation |
| E4 | `tests/e4-sse-timeout.test.ts` | 100% timer paths |
| E5 | `tests/e5-distributed-ratelimit.test.ts` | ≥ 95% branches |
| E6 | `tests/e6-dedup.test.ts` | 100% paths |

### 4.3 测试用例示例（必须实现）

```typescript
// E1: 最小测试集
describe('E1 OPTIONS Preflight', () => {
  it('returns 204', () => { expect(res.status).toBe(204); });
  it('has CORS header', () => { expect(header).toBeTruthy(); });
  it('not 401', () => { expect(res.status).not.toBe(401); });
  it('GET unaffected', () => { expect([200, 401]).toContain(res.status); });
});

// E4: 使用 fake timers
describe('E4 SSE', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it('timeout fires after 10s', () => { ... });
  it('clearTimeout called on cancel', () => { ... });
});

// E6: 文件操作
describe('E6 Dedup', () => {
  afterEach(() => { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); });
  it('skips duplicate in window', () => { ... });
  it('allows after window expires', () => { ... });
});
```

### 4.4 E2E 测试要求

```typescript
// Playwright E2E (E2 canvas 交互)
// tests/e2e/canvas-checkbox.spec.ts
test('AC2: checkbox selects multiple contexts', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="context-checkbox-node1"]');
  await page.click('[data-testid="context-checkbox-node2"]');
  const selected = await page.evaluate(() =>
    window.__STORE__.selectedNodeIds.size
  );
  expect(selected).toBe(2);
});
```

---

## 5. PR 审查清单

### 5.1 开发者自检

- [ ] `pnpm lint` 通过，0 errors
- [ ] `pnpm build` 通过，0 errors
- [ ] `pnpm test` 全量通过，0 failures
- [ ] 覆盖率报告 lines ≥ 80%
- [ ] 无 `console.log` (使用 logger)
- [ ] 无 `any` 类型（除非有 `// TODO` 注释）
- [ ] 测试描述清晰（不是 `test 1`）
- [ ] 每个 AC 至少一个测试
- [ ] Epic 特定约束已遵守
- [ ] `git diff` 审查过每一行变更

### 5.2 变更范围检查

| Epic | 预期修改文件 | PR 中是否仅包含 |
|------|-------------|----------------|
| E1 | `gateway.ts`, `middleware/cors.ts` | ✓ |
| E2 | `BoundedContextTree.tsx` | ✓ |
| E3 | `schemas/component.ts`, `prompts/*.ts`, `routes/component-generator.ts` | ✓ |
| E4 | `lib/sse-stream-lib/stream.ts` (new), `routes/chat.ts` | ✓ |
| E5 | `lib/rateLimit.ts` | ✓ |
| E6 | `lib/dedup.ts` (new), `scripts/test-notify.js` | ✓ |

**额外允许**: 测试文件 (`tests/*.test.ts`) 和文档更新

### 5.3 审查者检查

| # | 检查项 | 通过 | 需修复 |
|---|--------|------|--------|
| 1 | 测试覆盖率达标 | [ ] | [ ] |
| 2 | E2E 测试覆盖关键路径 | [ ] | [ ] |
| 3 | 无 breaking changes | [ ] | [ ] |
| 4 | 回滚方案可行 | [ ] | [ ] |
| 5 | 变更范围符合 Epic 边界 | [ ] | [ ] |
| 6 | 接口签名未变 (E5) | [ ] | [ ] |
| 7 | error handling 完整 | [ ] | [ ] |
| 8 | TypeScript strict 模式合规 | [ ] | [ ] |
| 9 | Mermaid 图中的接口定义准确 | [ ] | [ ] |
| 10 | PR 描述包含 AC 验证结果 | [ ] | [ ] |

### 5.4 PR 描述模板

```markdown
## Summary
修复 6 个 Epic (3 P0 + 3 P1)，解决 OPTIONS CORS、Canvas 多选、flowId 缺失等阻塞性问题。

## Epic 变更

### E1: OPTIONS 预检路由修复
- 修改: `gateway.ts` 路由注册顺序
- 测试: `tests/e1-options-cors.test.ts` ✅

### E2: Canvas Context 多选
- 修改: `BoundedContextTree.tsx` onChange 回调
- 测试: `tests/e2-canvas-checkbox.test.tsx` ✅

### E3: generate-components flowId
- 修改: `schemas/component.ts`, `prompts/`
- 测试: `tests/e3-flowid-generation.test.ts` ✅

### E4: SSE 超时 + 连接清理
- 新建: `lib/sse-stream-lib/stream.ts`
- 修改: `routes/chat.ts`
- 测试: `tests/e4-sse-timeout.test.ts` ✅

### E5: 分布式限流
- 修改: `lib/rateLimit.ts` (内存 → Cache API)
- 测试: `tests/e5-distributed-ratelimit.test.ts` ✅

### E6: test-notify 去重
- 新建: `lib/dedup.ts`
- 修改: `scripts/test-notify.js`
- 测试: `tests/e6-dedup.test.ts` ✅

## 验收标准验证

| AC | 描述 | 结果 |
|----|------|------|
| AC1 | OPTIONS 204 + CORS | ✅ `curl` 实测通过 |
| AC2 | Canvas checkbox 多选 | ✅ Playwright E2E 通过 |
| AC3 | flowId 格式正确 | ✅ jest 测试通过 |
| AC4 | SSE 10s 超时 | ✅ fake timers 测试通过 |
| AC5 | 跨 Worker 限流 | ✅ 并发测试通过 |
| AC6 | 5min 去重 | ✅ jest 测试通过 |

## 覆盖率报告

```
File             | % Lines | % Branches
-----------------|---------|-----------
rateLimit.ts     |  95.2   |  93.0
dedup.ts         | 100.0   | 100.0
stream.ts        | 100.0   | 100.0
-----------------|---------|-----------
TOTAL            |  83.5   |  81.2    ✅ ≥ 80%
```

## 回滚方案
```bash
git revert <commit-hash>
wrangler deploy
```
```

---

## 6. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-dev-proposals-vibex-proposals-20260406
- **执行日期**: 2026-04-06

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
