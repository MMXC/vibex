# VibeX Sprint 20 开发约束

**项目**: vibex-sprint20
**版本**: 1.0
**日期**: 2026-05-01
**架构师**: ARCHITECT

---

## 1. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint20
- **执行日期**: 2026-05-05
- **执行顺序**: P001 → P004 → P003 → P006

---

## 2. 开发约束总则

### 2.1 兼容性要求

| 约束 | 描述 | 优先级 |
|-----|------|--------|
| C-001 | 所有改动必须兼容现有 Epic-E1~E6 交付成果 | P0 |
| C-002 | `pnpm run test` CI 必须在所有改动后通过 | P0 |
| C-003 | `DDSCanvasStore` 现有 API（`cards`、`selectCard` 等）不可改变签名或删除 | P0 |
| C-004 | `CodingAgentService` 现有方法签名保持兼容 | P0 |
| C-005 | 新增 `/workbench` 路由在 `WORKBENCH_ENABLED=false`（默认）时返回 404，不抛出异常 | P0 |

### 2.2 代码质量约束

| 约束 | 描述 |
|-----|------|
| C-010 | TypeScript strict mode：无 any 类型漂移，无 implicit any |
| C-011 | 所有新增 API 路由必须有对应的 Vitest 单元测试（覆盖 4xx/5xx 错误路径） |
| C-012 | 新增 E2E 测试文件命名：`tests/e2e/<feature>-journey.spec.ts` |
| C-013 | Benchmark 脚本：`scripts/benchmark-canvas.ts`，必须 `ts-node` 可执行 |
| C-014 | Feature flag 文档：`docs/feature-flags.md`，每个 flag 必须有类型、默认值、路由行为字段 |

### 2.3 安全约束

| 约束 | 描述 |
|-----|------|
| C-020 | Agent Sessions API 必须有 CORS 配置（`hono/cors`） |
| C-021 | `sessions_spawn` 调用必须捕获 `ECONNREFUSED`，返回结构化错误 `{error, code}` |
| C-022 | User ID 从 `c.req.header('x-user-id')` 或 auth context 获取，不接受前端传入的 userId 字段 |
| C-023 | Artifact 回写 Canvas 前必须验证 session 归属（session.userId === currentUser） |

---

## 3. P001: MCP DoD 收尾 开发约束

### 3.1 实施约束

| 约束 | 描述 |
|-----|------|
| P001-C01 | `/health` endpoint 必须合并到 `packages/mcp-server/src/index.ts` 主启动序列，不启动独立 HTTP 进程 | P0 |
| P001-C02 | `scripts/generate-tool-index.ts` 必须 exit 0，不打印 stderr warnings | P0 |
| P001-C03 | `docs/mcp-tools/INDEX.md` 生成后由 CI commit，不手动编辑 | P1 |
| P001-C04 | mcp-server build 必须在 `packages/mcp-server` 目录下执行 `pnpm run build`，无额外 flags | P1 |

### 3.2 禁止事项

| 禁止 | 原因 |
|-----|------|
| P001-F01 | 禁止为 `/health` 启动独立 `http.createServer()`，必须复用共享 server instance | 确保与 stdio transport 启动顺序一致 |
| P001-F02 | 禁止跳过 `docs/mcp-tools/INDEX.md` 验证步骤 | DoD 合规需要 |

---

## 4. P004: Canvas 虚拟化 开发约束

### 4.1 实施约束

| 约束 | 描述 |
|-----|------|
| P004-C01 | `DDSCanvasStore.ts` 中 card/chapter 渲染路径不得使用 `.map()` | 核心虚拟化目标 |
| P004-C02 | 虚拟化列表必须使用 `@tanstack/react-virtual` `useVirtualizer` hook，不自实现虚拟化 | 复用成熟方案 |
| P004-C03 | overscan 配置：默认 3，前后各渲染 3 个视口外元素 | 平衡性能与内存 |
| P004-C04 | 选择状态跨虚拟边界保持：`selectedCardSnapshot` 在 `get().cards` 中维护，而非 DOM 中 | 跨边界状态不丢失 |
| P004-C05 | `scripts/benchmark-canvas.ts` 必须输出 JSON 格式：`{nodeCount, p50, p95, p99}` | 便于 CI 解析 |
| P004-C06 | 拖拽、缩放、节点连接不受虚拟化影响——这些操作在 Canvas 层处理，不经列表渲染 | 功能不变 |

### 4.2 禁止事项

| 禁止 | 原因 |
|-----|------|
| P004-F01 | 禁止在虚拟化渲染路径中直接访问 `cardStore.cards.length` 用于布局计算 | 改用 `virtualizer.getVirtualItems().length` |
| P004-F02 | 禁止在 `useVirtualizer` 外部的 `.map()` 中渲染 cards | 违反虚拟化目标 |
| P004-F03 | 禁止在滚动时清除 `selectedCardSnapshot` | 用户选中状态必须保留 |

### 4.3 代码规范

```typescript
// ✅ 正确：虚拟化渲染
const virtualizer = useVirtualizer({
  count: cardStore.cards.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => CARD_HEIGHT,
  overscan: 3,
});

// ❌ 错误：直接 .map()
{cardStore.cards.map(card => <Card key={card.id} {...card} />)}
```

```typescript
// ✅ 正确：跨边界选择保持
const isSelected = 
  card.id === selectedCardId ||
  (selectedCardSnapshot?.cardId === card.id && !selectedCardSnapshot.wasVisible);

// ❌ 错误：仅依赖 DOM 可见性
const isSelected = card.id === selectedCardId;
```

---

## 5. P003: Workbench 生产化 开发约束

### 5.1 实施约束

| 约束 | 描述 |
|-----|------|
| P003-C01 | `/workbench` 路由必须使用 `'use client'` 标记 | Next.js App Router 要求 |
| P003-C02 | Feature flag 环境变量：`NEXT_PUBLIC_WORKBENCH_ENABLED`，类型 `string`，不等于 `'true'` 时返回 404 | 灰度开关 |
| P003-C03 | `docs/feature-flags.md` 必须包含 `WORKBENCH_ENABLED` 条目，字段：类型、默认值、环境变量、灰度阶段 | P0 文档要求 |
| P003-C04 | E2E journey spec 必须命名为 `tests/e2e/workbench-journey.spec.ts` | PRD 命名要求 |
| P003-C05 | Workbench 路由在 `WORKBENCH_ENABLED=true` 时必须 SSR，不使用 `dynamic()` lazy load | 首次访问性能 |

### 5.2 禁止事项

| 禁止 | 原因 |
|-----|------|
| P003-F01 | 禁止在 `/workbench` 路由中 `throw new Error()` 来处理 flag=false | 必须用 `notFound()` 返回 404 |
| P003-F02 | 禁止在 Workbench UI 中直接 import `CodingAgentService` 并直接调用 `_spawnRealAgent` | 必须通过 `/api/agent/sessions` 路由 |
| P003-F03 | 禁止在 feature flag 未开启时保留任何可访问的功能入口 | 灰度一致性 |

---

## 6. P006: AI Agent 真实接入 开发约束

### 6.1 实施约束

| 约束 | 描述 |
|-----|------|
| P006-C01 | Agent Sessions 路由前缀：`/api/agent/sessions`，文件路径：`vibex-backend/src/routes/agent/sessions.ts` | RESTful 规范 |
| P006-C02 | 所有 API 响应必须包含 `Content-Type: application/json`（204 除外） | 标准响应头 |
| P006-C03 | 超时时间：`30000ms`（30s），硬限制，不可配置大于此值 | 安全约束 |
| P006-C04 | `sessions_spawn` 调用必须记录日志：`[agent] sessions_spawn called with task=<task>` | 可观测性 |
| P006-C05 | `ECONNREFUSED` 错误必须返回 `{error: string, code: 'RUNTIME_UNAVAILABLE'}`，HTTP 503 | 可降级 |
| P006-C06 | `CodingAgentService.ts` 必须在 PR 审核前完成 mock 代码清理（无 `// MOCK`/`mockAgentCall`） | PRD AC-004-7 |

### 6.2 API 响应格式

```typescript
// ✅ 正确：结构化错误响应
// 400
{ "error": "task is required", "code": "INVALID_TASK" }
// 404
{ "error": "Session not found", "code": "NOT_FOUND" }
// 500
{ "error": "Internal server error", "code": "INTERNAL_ERROR" }
// 503 (降级)
{ "error": "Agent runtime unavailable", "code": "RUNTIME_UNAVAILABLE" }

// ❌ 错误：非结构化错误
{ "message": "error" }  // 缺少 code 字段
"error string"          // 纯字符串响应
```

### 6.3 禁止事项

| 禁止 | 原因 |
|-----|------|
| P006-F01 | 禁止在 `CodingAgentService` 中直接 `eval()` 或 `new Function()` 执行动态代码 | 安全风险 |
| P006-F02 | 禁止 `sessions_spawn` 调用不设置 timeout | 可能导致 backend 线程阻塞 |
| P006-F03 | 禁止返回 `sessionId` 字段名为其他变体（如 `id`、`session_id`） | AC 验收要求接口固定 |
| P006-F04 | 禁止在 mock 清理前合入 PR | PRD DoD |

---

## 7. 测试约束

### 7.1 单元测试覆盖率要求

| 模块 | 覆盖率目标 | 测试框架 |
|-----|-----------|---------|
| Agent Sessions API routes | > 90% | Vitest |
| `DDSCanvasStore` (虚拟化状态) | > 80% | Vitest |
| Feature flag routing logic | 100% | Vitest |
| `OpenClawBridge` (错误处理) | > 90% | Vitest |

### 7.2 E2E 测试要求

| 测试文件 | 场景 | 超时 |
|---------|------|------|
| `tests/e2e/workbench-journey.spec.ts` | Canvas → Agent → Artifact → Canvas | 60s |
| `tests/e2e/workbench-flag.spec.ts` | Feature flag 200/404 切换 | 30s |
| `scripts/benchmark-canvas.ts` | 100 节点性能基准 | 120s |

### 7.3 CI 门禁

| 门禁 | 要求 |
|-----|------|
| `pnpm run test` | 全部通过（0 failures） |
| `pnpm run test:e2e:ci` | workbench journey 0 failures |
| `pnpm exec ts-node scripts/generate-tool-index.ts` | exit 0 |
| `pnpm exec ts-node scripts/benchmark-canvas.ts --nodes=100` | P50 < 100ms |
| TypeScript build | 0 errors (`pnpm run build`) |

---

## 8. 日志与可观测性

### 8.1 日志格式要求

```typescript
// 所有新增日志必须包含以下字段
{
  "timestamp": "ISO 8601",
  "level": "info|warn|error",
  "service": "vibex-backend|vibex-frontend|mcp-server",
  "event": "session_created|sessions_spawn_called|artifact_written",
  "sessionId": "uuid",
  "userId": "string",
  "durationMs": number
}
```

### 8.2 关键日志点

| 事件 | 级别 | 内容 |
|-----|------|------|
| `sessions_spawn called` | info | `task=<task> sessionId=<id>` |
| `sessions_spawn success` | info | `sessionId=<id> durationMs=<ms>` |
| `sessions_spawn failed` | error | `sessionId=<id> error=<err>` |
| `artifact written to canvas` | info | `sessionId=<id> artifactType=<type>` |
| `runtime unavailable` | warn | `ECONNREFUSED detected, returning 503` |

---

## 9. 依赖版本约束

| 包 | 版本 | 来源 |
|-----|------|------|
| `@tanstack/react-virtual` | `^3.8.0` | `pnpm add @tanstack/react-virtual`（P004 新增）|
| `react` | `^18.x`（现有）| — |
| `zustand` | 现有 | — |
| `hono` | 现有 | — |
| `@openclaw/sdk` | 现有 | — |

---

## 10. 检查清单

### 实施前检查
- [ ] 代码符合所有 P0 约束（C-001 ~ C-005）
- [ ] 新增 API routes 有 Vitest 单元测试
- [ ] 新增 E2E 测试文件命名符合规范
- [ ] Feature flag 文档已创建/更新

### 审核检查
- [ ] PR 中包含 `scripts/benchmark-canvas.ts` 性能报告
- [ ] `CodingAgentService.ts` 无 `MOCK` / `mockAgentCall`
- [ ] API 错误响应符合结构化格式
- [ ] 日志包含 `sessions_spawn called` 事件

### 上线前检查
- [ ] CI `pnpm run test` 全部通过
- [ ] CI `pnpm run test:e2e:ci` workbench journey 0 failures
- [ ] `pnpm exec ts-node scripts/benchmark-canvas.ts --nodes=100` → P50 < 100ms
- [ ] Feature flag 灰度计划已记录（内部 → Beta → GA）

---

*文档版本: 1.0*
*创建时间: 2026-05-01*
*架构师: ARCHITECT*
