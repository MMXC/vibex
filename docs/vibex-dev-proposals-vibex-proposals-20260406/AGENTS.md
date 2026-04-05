# 开发约束 — vibex-dev-proposals-20260406

**Agent**: architect  
**Date**: 2026-04-06  
**范围**: Sprint 1 (P0 × 3) + Sprint 2 (P1 × 3)  
**有效期**: 本次修复工作期间（2026-04-06 起）

---

## 1. 代码风格规范

### 1.1 TypeScript 规范

- **严格模式**: 所有 `.ts` / `.tsx` 文件必须通过 `tsc --noEmit`，零错误。
- **禁止 `any` 类型**: 除非绝对必要，且必须附带 `// TODO: <具体类型>` 注释。
- **类型先于实现**: 新增 API 路由时，先定义 `request` / `response` 类型，再实现 handler。
- **测试文件同等要求**: `.test.ts` / `.test.tsx` / `.test.js` 文件同样必须通过类型检查。

### 1.2 React 组件规范

- **单文件行数上限**: 单一 React 组件文件（`.tsx`）不超过 **200 行**。超过则强制拆分。
- **事件处理**: `onChange` 只做一件事，事件处理函数不超过 10 行。
- **禁止裸 `setTimeout`**: 使用 `AbortController` + `setTimeout` 时，必须在 `cancel()` 中 `clearTimeout`。

### 1.3 API/路由规范

- **OPTIONS 路由必须在 authMiddleware 之前**: 这是本项目 E1 的核心教训，任何新增受保护路由必须遵守此顺序。

```typescript
// ✅ 正确顺序
protected_.options('/*', corsHandler);
protected_.use('*', authMiddleware);
protected_.route('/resource', resource);

// ❌ 错误顺序（会导致 CORS 预检失败）
protected_.use('*', authMiddleware);
protected_.options('/*', corsHandler);  // 预检被 401 拦截
```

- **Prompt 约束强制声明**: `generate-*` API 的 Prompt 必须包含：
  - 禁止输出 `unknown`
  - 必须包含关联实体的 ID 字段（flowId、ctx.id）
  - 字段类型必须明确

### 1.4 提交规范

- **原子提交**: 每次 commit 只做一件事（一个 Bug 修复 / 一个重构 / 一个测试补充）。
- **Commit message 格式**:
  ```
  <type>(<scope>): <subject>

  <type>: fix | feat | refactor | test | docs | chore
  <scope>: backend | frontend | common
  ```
- **示例**:
  ```
  fix(backend): 修复 OPTIONS 预检被 authMiddleware 拦截
  fix(frontend): 修复 checkbox onChange 调用 toggleContextNode
  fix(backend): 修复 generate-components flowId 为 unknown
  fix(backend): ai-service chatStream 添加 setTimeout 清理
  fix(backend): rateLimit 改为 CacheStore 优先
  fix(frontend): test-notify generateKey 增加 message 参数
  ```

---

## 2. 禁止事项

### 2.1 绝对禁止（🚫）

| 规则 | 说明 |
|------|------|
| `tsc --noEmit` 未通过 | 任何 PR 在类型检查未通过的情况下不得合并 |
| 新增 TypeScript 错误 | 每个 PR 新增错误 ≤ 0 |
| 新增 `any` 类型 | 除非绝对必要且有 TODO 注释 |
| 组件文件超过 200 行 | Reviewer 强制要求拆分 |
| OPTIONS handler 在 authMiddleware 之后 | 违反将导致 CORS 预检失败 |
| 硬编码 secrets | API key、token 必须通过环境变量 |
| 裸 `setTimeout` 无清理 | 必须在 `cancel()` 中 `clearTimeout` |
| 删除或跳过现有测试 | 除非有等效替代测试 |

### 2.2 强烈不建议（⚠️）

| 规则 | 替代方案 |
|------|---------|
| 循环内的 await | 使用 `Promise.all()` 并行化 |
| 裸 `try/catch` | catch 块必须有具体处理逻辑 |
| 内存 Map 作为跨 Worker 共享状态 | 使用 `caches.default`（Cache API） |
| 内联 Prompt 模板 | 提取到统一模板文件 |
| 硬编码超时值（如 60000） | 定义命名常量 `const SSE_TIMEOUT_MS = 10_000` |

---

## 3. 测试要求

### 3.1 覆盖率要求

| 层级 | 框架 | 覆盖率目标 | 关键路径 |
|------|------|-----------|---------|
| Backend | Jest | > 80% | rateLimit, ai-service, gateway |
| Frontend | Vitest | > 80% | BoundedContextTree |
| Scripts | Jest | 100% | dedup.js |

### 3.2 必须覆盖的测试场景

#### E1: OPTIONS 预检
```typescript
// 必须测试
it('OPTIONS 返回 204 + CORS headers')
it('GET 请求不受 OPTIONS 修复影响')
it('POST 请求不受 OPTIONS 修复影响')
```

#### E2: Canvas checkbox 多选
```typescript
// 必须测试
it('checkbox onChange 调用 onToggleSelect')
it('checkbox onChange 不调用 toggleContextNode')
it('Ctrl+Click card body 触发多选')
```

#### E3: flowId 生成
```typescript
// 必须测试
it('AI 输出 components 包含有效 flowId（非 unknown）')
it('flowId 格式为 flow-*')
```

#### E4: SSE 超时
```typescript
// 必须测试
it('ReadableStream.cancel() 调用 clearTimeout')
it('AbortController timeout 为 10000ms')
it('chatStream 返回 ReadableStream 有 cancel 处理')
```

#### E5: 分布式限流
```typescript
// 必须测试
it('CacheStore.get 优先于 InMemoryStore.get')
it('recordRequest 双写 CacheStore + InMemoryStore')
it('并发 100 请求计数一致')
```

#### E6: test-notify 去重
```typescript
// 必须测试
it('generateKey 第二个参数有效（非空）')
it('首次通知不 skip')
it('5分钟内重复通知 skip')
it('不同 status 不被误去重')
```

### 3.3 Mock 规范

```typescript
// 允许 mock 的依赖
vi.mock('@/lib/rateLimit', () => ({
  rateLimit: vi.fn(),
  inMemoryStore: { get: vi.fn(), put: vi.fn(), clear: vi.fn() },
  cacheStore: { get: vi.fn(), put: vi.fn(), isAvailable: vi.fn() },
}));

// 不允许 mock 的内容
// - globalThis.caches（改为 isAvailable() 检查）
// - AbortController（使用 vi.spyOn）
// - fs（使用 tmpFile + afterEach cleanup）
```

---

## 4. PR 审查清单

### 4.1 代码质量检查

- [ ] `cd vibex-backend && npx tsc --noEmit` → `Found 0 errors`
- [ ] `cd vibex-fronted && npx tsc --noEmit` → `Found 0 errors`
- [ ] `pnpm --filter vibex-backend test` → 全部通过
- [ ] `pnpm --filter vibex-fronted test` → 全部通过
- [ ] ESLint 无新增 warnings/errors
- [ ] 新增代码行数 ≤ 实际需要（无冗余代码）

### 4.2 架构规范检查

- [ ] **E1**: `gateway.ts` 中 `protected_.options` 在 `authMiddleware` 之前
- [ ] **E2**: `BoundedContextTree.tsx` checkbox `onChange` 不调用 `toggleContextNode`
- [ ] **E3**: `generate-components/route.ts` 的 `contextSummary` 包含 `ctx.id`
- [ ] **E4**: `ai-service.ts` 的 `chatStream` 在 `cancel()` 中 `clearTimeout`
- [ ] **E5**: `rateLimit.ts` 中 `recordRequest` 优先使用 `CacheStore`
- [ ] **E6**: `test-notify.js` 的 `generateKey` 调用包含第二个参数

### 4.3 业务正确性检查

- [ ] `curl -X OPTIONS -I /v1/projects` → `HTTP/1.1 204`
- [ ] Canvas checkbox 点击后选中状态正确更新
- [ ] `generate-components` API 返回的 `flowId` 非 `unknown`
- [ ] SSE stream 可正常取消（`ReadableStream.cancel()` 有效）
- [ ] 限流在多 Worker 环境下计数一致
- [ ] test-notify 在 5 分钟内不重复发送

### 4.4 测试覆盖检查

- [ ] 每个 Epic 有对应测试文件
- [ ] 测试用例数量 ≥ 验收标准数量
- [ ] `coverageThreshold` 配置更新（> 80%）
- [ ] 无 `test.skip` / `test.only` 遗留

### 4.5 回滚能力检查

- [ ] 修复前代码通过 `git diff` 可清晰查看变更
- [ ] 每个 Epic 可独立回滚（不依赖其他 Epic）
- [ ] 回滚命令已记录在 IMPLEMENTATION_PLAN.md

### 4.6 特殊检查（本项目）

- [ ] E4: 不使用 `setInterval`，只使用 `setTimeout` + 重设
- [ ] E5: `wrangler.jsonc` 中未添加不必要的 `kv_namespaces`
- [ ] E6: `dedup.js` 测试使用临时文件 `tmpFile`，`afterEach` 清理

---

## 5. 违反处理

| 违规行为 | 处理方式 | 优先级 |
|----------|----------|--------|
| CI 中 `tsc --noEmit` 失败 | 阻断合并，自动通知 | P0 |
| OPTIONS 路由顺序错误 | Reviewer 强制要求修正 | P0 |
| `setTimeout` 无清理 | Reviewer 强制要求修正 | P0 |
| 测试覆盖率 < 80% | CI 失败，禁止合并 | P1 |
| 组件文件超过 200 行 | Reviewer 强制要求拆分 | P1 |
| 新增 `any` 类型 | Reviewer 要求明确类型定义 | P1 |
| commit message 格式不规范 | 要求重写 commit | P2 |

---

## 6. 例外申请流程

如因特殊原因需要突破上述约束（如紧急 hotfix），必须：

1. 在 PR description 中明确说明例外原因
2. 附带 `// FIXME: <具体问题>` 注释并附上 ticket 链接
3. 在 24h 内提交后续修复 PR

---

*本文档由 Architect Agent 编制，作为 Dev Agent 和 Reviewer Agent 的执行标准。所有约束在本次技术债务修复期间强制生效。*
