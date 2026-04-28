# VibeX Sprint 17 — 架构设计

**项目**: vibex-proposals-20260428-sprint17
**Agent**: Architect
**日期**: 2026-04-29
**基于**: prd.md + Epic Specs (specs/)

---

## 1. 背景与目标

Sprint 17 的首要任务是**收尾 + 深化**——把已有功能变成真实可用的产品，而不是堆新功能。

Sprint 1-16 存在以下关键缺口：
- E2E 覆盖率缺口：`code-generator-e2e.spec.ts` 从未创建
- MCP 工具治理：`GET /health` tool 列表未实现，`INDEX.md` 缺失
- Firebase 真实集成：从没在真实配置下验证过
- TypeScript 类型安全：`noUncheckedIndexedAccess` 未开启
- Analytics Dashboard：FunnelWidget + useFunnelQuery 无 E2E 保护

---

## 2. Epic 架构概览

### Epic 1：验证收尾（Verification Completion）

| Story ID | 功能 | 技术路径 | 工时 |
|----------|------|----------|------|
| S17-P0-1 | E2E 覆盖率补全 | Playwright E2E 测试 | 2d |
| S17-P1-1 | MCP Tool Registry 收尾 | MCP Server /health + 索引脚本 | 1d |

**关键技术决策**：
- Playwright 配置复用现有 `tests/e2e/` 基础设施
- MCP /health 端点在 `packages/mcp-server/src/routes/health.ts` 新增
- 索引脚本独立运行于 `scripts/generate-tool-index.ts`

### Epic 2：集成深化（Integration Deepening）

| Story ID | 功能 | 技术路径 | 工时 |
|----------|------|----------|------|
| S17-P1-2 | Firebase 真实集成验证 | Firebase 真实配置 + benchmark | 2d |

**关键技术决策**：
- Firebase benchmark 使用 Playwright 测量真实初始化时间
- 降级策略：在 `isFirebaseConfigured() === false` 时不渲染 PresenceAvatars
- 5 用户并发使用 Firebase Emulator Suite 或真实多标签页并发

### Epic 3：技术深化（Technical Deepening）

| Story ID | 功能 | 工时 |
|----------|------|------|
| S17-P2-1 | TypeScript noUncheckedIndexedAccess | 2d |
| S17-P2-2 | Analytics Dashboard E2E 验证 | 1.5d |

**关键技术决策**：
- `tsconfig.json` 添加 `"noUncheckedIndexedAccess": true`
- 预计影响文件：`packages/dds/src/**/*.ts`, `vibex-fronted/src/**/*.ts`
- Analytics E2E 复用 `analytics-dashboard.spec.ts` 框架

---

## 3. 技术风险评估

| 风险 | 级别 | 缓解策略 |
|------|------|----------|
| `noUncheckedIndexedAccess` 产生大量 TS 错误 | 高 | 分阶段修复：先 `dds/` 包，再 `vibex-fronted/` |
| Firebase 真实配置 CI 不可用 | 中 | 本地验证 + 标记 `@slow` 排除 CI |
| E2E 测试 flaky（Firebase presence） | 中 | 使用 `waitForFunction` + 重试机制 |

---

## 4. 依赖关系

```
Epic 1 (S17-P0-1, S17-P1-1)
  └─ 依赖 Sprint 16 P0/P1 交付物就绪
Epic 2 (S17-P1-2)
  └─ 依赖 Sprint 16 P1-1 Firebase presence 基础
Epic 3 (S17-P2-1, S17-P2-2)
  └─ 无跨 Sprint 依赖，可与 Epic 1/2 并行
```

---

## 5. 文件变更概览

### 新增文件
- `vibex-fronted/tests/e2e/code-generator-e2e.spec.ts` (E1)
- `scripts/generate-tool-index.ts` (E1)
- `docs/mcp-tools/INDEX.md` (E1)
- `vibex-fronted/benchmark/firebase-benchmark.ts` (E2)
- `vibex-fronted/tests/e2e/analytics-dashboard.spec.ts` 补充测试 (E3)

### 修改文件
- `packages/mcp-server/src/routes/health.ts` — 添加 tools[] 字段 (E1)
- `packages/mcp-server/src/tools/*.ts` — 完善 tool metadata (E1)
- `tsconfig.json` — 添加 noUncheckedIndexedAccess (E3)
- `vibex-fronted/tsconfig.json` — 继承配置 (E3)
- `vibex-fronted/tests/e2e/design-review.spec.ts` — 补充 3 测试 (E1)
- `vibex-fronted/src/components/presence/PresenceAvatars.tsx` — 降级策略 (E2)

---

## 6. 测试策略

| 层级 | 工具 | 覆盖率目标 |
|------|------|-----------|
| E2E | Playwright | code-generator-e2e ≥5 tests, analytics ≥3 tests |
| 单元 | Vitest | noUncheckedIndexedAccess 修复覆盖 |
| 类型 | TypeScript tsc | 0 errors |

---

## 7. 性能基准

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| Firebase 冷启动 | < 500ms | Playwright benchmark |
| 5 用户并发 presence | < 3s | Multi-tab concurrent test |
| tsc --noEmit | 0 errors | CI gate |
