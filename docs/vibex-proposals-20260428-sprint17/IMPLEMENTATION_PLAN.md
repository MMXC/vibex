# IMPLEMENTATION_PLAN — Sprint 17

**项目**: vibex-proposals-20260428-sprint17
**Sprint**: S17
**Epic 数**: 3
**总工时**: 8.5d
**日期**: 2026-04-29

---

## Epic 1: 验证收尾 (3d)

### E1-U1: code-generator-e2e.spec.ts 创建
- **Story**: S17-P0-1
- **文件**: `vibex-fronted/tests/e2e/code-generator-e2e.spec.ts`（新建）
- **DoD**: ≥5 Playwright tests, 全通过
- **工时**: 2d
- **约束**: 真实 Zustand 数据，禁止 mock
- **Status**: ✅

### E1-U2: design-review.spec.ts 生产路径补充
- **Story**: S17-P0-1
- **文件**: `vibex-fronted/tests/e2e/design-review.spec.ts`（补充）
- **DoD**: 增量 ≥3 tests
- **工时**: 包含于 E1-U1
- **Status**: ✅ (+6 new tests for S17-P0-1 CodeGenPanel production path)

### E1-U3: MCP /health 返回 tools[]
- **Story**: S17-P1-1
- **文件**: `packages/mcp-server/src/routes/health.ts`
- **DoD**: `curl localhost:3100/health` 返回 `{"tools": [...]}`
- **工时**: 0.5d
- **Status**: ✅ (plain Node.js HTTP server on port 3100)

### E1-U4: generate-tool-index.ts 脚本
- **Story**: S17-P1-1
- **文件**: `scripts/generate-tool-index.ts`（新建）
- **DoD**: `node scripts/generate-tool-index.ts` exit 0, 生成 `docs/mcp-tools/INDEX.md`
- **工时**: 0.5d
- **Status**: ✅ (7 tools indexed)

---

## Epic 2: 集成深化 (2d)

### E2-U1: Firebase 冷启动 benchmark
- **Story**: S17-P1-2
- **文件**: `vibex-fronted/benchmark/firebase-benchmark.ts`（新建）
- **DoD**: benchmark 报告显示冷启动 < 500ms
- **工时**: 1d

### E2-U2: 5 用户并发 presence 延迟验证
- **Story**: S17-P1-2
- **文件**: `vibex-fronted/tests/e2e/firebase-presence.spec.ts`（新建）
- **DoD**: 5 用户并发更新 < 3s
- **工时**: 0.5d

### E2-U3: Firebase 降级策略
- **Story**: S17-P1-2
- **文件**: `vibex-fronted/src/components/presence/PresenceAvatars.tsx`
- **DoD**: `isFirebaseConfigured() === false` 时 PresenceAvatars 不渲染
- **工时**: 0.5d

---

## Epic 3: 技术深化 (3.5d)

### E3-U1: noUncheckedIndexedAccess 配置
- **Story**: S17-P2-1
- **文件**: `tsconfig.json`, `vibex-fronted/tsconfig.json`
- **DoD**: 配置添加 `"noUncheckedIndexedAccess": true`
- **工时**: 0.5d

### E3-U2: 类型修复（packages/dds）
- **Story**: S17-P2-1
- **文件**: `packages/dds/src/**/*.ts`
- **DoD**: `pnpm exec tsc --noEmit` 0 errors
- **工时**: 1d
- **Status**: ⏸️ Deferred to Sprint 18（342 TS errors 规模过大，延期分阶段执行：先 packages/dds 后 vibex-fronted）

### E3-U3: 类型修复（vibex-fronted）
- **Story**: S17-P2-1
- **文件**: `vibex-fronted/src/**/*.ts`
- **DoD**: `pnpm exec tsc --noEmit` 0 errors
- **工时**: 0.5d
- **Status**: ⏸️ Deferred to Sprint 18（依赖 E3-U2 packages/dds 完成）

### E3-U4: Analytics Dashboard E2E
- **Story**: S17-P2-2
- **文件**: `vibex-fronted/tests/e2e/analytics-dashboard.spec.ts`（补充）
- **DoD**: 增量 ≥3 tests，覆盖 FunnelWidget + useFunnelQuery
- **工时**: 1d

---

## 单元索引

| Unit ID | Story | 文件路径 | DoD |
|---------|-------|---------|-----|
| E1-U1 | S17-P0-1 | `tests/e2e/code-generator-e2e.spec.ts` | ≥5 tests |
| E1-U2 | S17-P0-1 | `tests/e2e/design-review.spec.ts` | +3 tests |
| E1-U3 | S17-P1-1 | `mcp-server/src/routes/health.ts` | /health 含 tools[] |
| E1-U4 | S17-P1-1 | `scripts/generate-tool-index.ts` | exit 0 |
| E2-U1 | S17-P1-2 | `benchmark/firebase-benchmark.ts` | < 500ms |
| E2-U2 | S17-P1-2 | `tests/e2e/firebase-presence.spec.ts` | < 3s |
| E2-U3 | S17-P1-2 | `presence/PresenceAvatars.tsx` | 降级不渲染 |
| E3-U1 | S17-P2-1 | `tsconfig.json` | noUncheckedIndexedAccess |
| E3-U2 | S17-P2-1 | `dds/src/**/*.ts` | 0 TS errors |
| E3-U3 | S17-P2-1 | `vibex-fronted/src/**/*.ts` | 0 TS errors |
| E3-U4 | S17-P2-2 | `tests/e2e/analytics-dashboard.spec.ts` | ≥3 tests |

---

## DoD 命令

```bash
# Epic 1
pnpm playwright test code-generator-e2e.spec.ts design-review.spec.ts
node scripts/generate-tool-index.ts && curl localhost:3100/health

# Epic 2
node benchmark/firebase-benchmark.ts
pnpm playwright test firebase-presence.spec.ts

# Epic 3
pnpm exec tsc --noEmit
pnpm playwright test analytics-dashboard.spec.ts
```
