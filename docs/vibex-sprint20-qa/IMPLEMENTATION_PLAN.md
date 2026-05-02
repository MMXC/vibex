# VibeX Sprint 20 — Implementation Plan

**Architect**: architect 🤖
**Date**: 2026-05-01
**Project**: vibex-sprint20-qa
**Status**: Implementation Plan (Technical Design phase)

---

## Phase Overview

| Phase | Name | Owner | Status |
|-------|------|-------|--------|
| 1 | Requirements Analysis | analyst | ✅ DONE |
| 2 | Technical Design | architect | 🔄 CURRENT |
| 3 | Code Review + /plan-eng-review | engineer | ⏳ PENDING |
| 4 | QA Validation (gstack) | tester | ⏳ PENDING |
| 5 | E2E Performance Tests | tester | ⏳ PENDING |
| 6 | Deployment Sign-off | coord | ⏳ PENDING |

---

## Implementation Order

```
P001 (MCP DoD) → P004 (Canvas) → P003 (Workbench) → P006 (Agent)
```

---

## P001 — MCP DoD 收尾

### 验收标准
- [ ] `node scripts/generate-tool-index.ts` → exit 0，INDEX.md ≥ 7 entries
- [ ] `/health` 在 stdio 前可用
- [ ] `tsc --noEmit` → 0 errors
- [ ] 12 unit tests pass

### 已实现 (代码审查通过)
| 文件 | 说明 |
|------|------|
| `mcp-server/src/index.ts` | `setupHealthEndpoint(3100)` 在 stdio 前调用 ✅ |
| `mcp-server/scripts/generate-tool-index.ts` | exit 0，7 tools written ✅ |
| `mcp-server/src/health.ts` | 可 require 不抛错 ✅ |

### 验证命令
```bash
cd mcp-server
node scripts/generate-tool-index.ts
# 期望: exit 0, 7 tools written
tsc --noEmit
# 期望: 0 errors
pnpm test
# 期望: 12 tests passed
```

---

## P004 — Canvas 虚拟化

### 验收标准
- [ ] `ChapterPanel.tsx` 无 `.map()` 渲染 card
- [ ] `useVirtualizer` estimateSize=120, overscan=3
- [ ] `selectedCardSnapshot` 跨虚拟边界保持
- [ ] `benchmark-canvas.ts` 可执行
- [ ] **真实 DOM P50 < 100ms** (Playwright E2E，未实测)

### 已实现 (代码审查通过)
| 文件 | 说明 |
|------|------|
| `ChapterPanel.tsx` | useVirtualizer 完整实现 ✅ |
| `DDSCanvasStore.ts` | `updateCardVisibility()` 追踪 `wasVisible` ✅ |
| `scripts/benchmark-canvas.ts` | JSON 输出 {nodeCount, p50, p95, p99} ✅ |
| `DDSCanvasStore.test.ts` | +131 lines 测试覆盖 ✅ |

### 验证命令
```bash
# 合成性能测试（Node.js，无真实 DOM）
npx ts-node scripts/benchmark-canvas.ts --nodes=100 --iterations=100

# 真实 DOM 性能（QA 阶段强制执行）
pnpm exec playwright test tests/e2e/canvas-virtualization-perf.spec.ts
# 期望: p50 < 100ms, dropped frames < 2
```

---

## P003 — Workbench 生产化

### 验收标准
- [ ] `WORKBENCH_ENABLED=true` → 200
- [ ] `WORKBENCH_ENABLED=false` → 404
- [ ] `agentSessionStore` 50 上限
- [ ] XSS 防护（React JSX 自动转义）
- [ ] E2E journey 5 tests 全部通过

### 已实现 (代码审查通过)
| 文件 | 说明 |
|------|------|
| `app/workbench/page.tsx` | `NEXT_PUBLIC_WORKBENCH_ENABLED` 控制 ✅ |
| `agentSessionStore` | Map，50 上限 + 自动清理 ✅ |
| `WorkbenchUI.tsx` | React JSX 自动转义 message.content ✅ |
| `tests/e2e/workbench-journey.spec.ts` | 5 tests (4 API + 1 UI 404) ✅ |

### 上线前检查
```bash
# 检查 flag 是否配置
grep -r "WORKBENCH_ENABLED" .env* 2>/dev/null
# 期望: NEXT_PUBLIC_WORKBENCH_ENABLED=true (若要上线 Workbench)
```

---

## P006 — AI Agent 真实接入

### 验收标准
- [ ] `POST /api/agent/sessions` → 201 + sessionKey
- [ ] `GET /api/agent/sessions/:id/status` → 200
- [ ] `DELETE /api/agent/sessions/:id` → 204
- [ ] 错误 `{error, code}` 格式
- [ ] `sessions_spawn` 30s 超时
- [ ] **Gateway 可达性** (未实测)
- [ ] 40 unit tests pass

### 已实现 (代码审查通过)
| 文件 | 说明 |
|------|------|
| `backend/src/routes/agent/sessions.ts` | 所有端点正确实现 ✅ |
| `OpenClawBridge.ts` | `spawnAgent()` + `AbortController` 30s ✅ |
| sessions tests | 13 tests ✅ |
| Bridge tests | 15 tests ✅ |
| route tests | 12 tests ✅ |

### 验证命令
```bash
# Unit tests
cd vibex-backend && pnpm test
# 期望: 40 tests passed

# Gateway 可达性（QA 阶段强制执行）
curl -s http://localhost:18789/health || echo "Gateway unreachable"
# 期望: {status: "ok"} 或 404（gateway 存活即可）

# API smoke test
curl -X POST http://localhost:3000/api/agent/sessions \
  -H "Content-Type: application/json" \
  -d '{"task": "test connectivity"}'
# 期望: 201 + sessionKey
```

---

## E2E Test Suite

| Test File | 目标 | 命令 |
|-----------|------|------|
| `workbench-journey.spec.ts` | P003 E2E | `pnpm exec playwright test tests/e2e/workbench-journey.spec.ts` |
| `canvas-virtualization-perf.spec.ts` | P004 Performance | `pnpm exec playwright test tests/e2e/canvas-virtualization-perf.spec.ts` |
| `agent-sessions.spec.ts` | P006 API | `pnpm exec playwright test tests/e2e/agent-sessions.spec.ts` |

**强制执行顺序**:
1. `workbench-journey.spec.ts` — 快速（< 2min）
2. `agent-sessions.spec.ts` — 验证 API
3. `canvas-virtualization-perf.spec.ts` — 性能（需要 seed 数据）

---

## Deployment Checklist

| # | Check | Owner | Pass Criterion |
|---|-------|-------|----------------|
| 1 | TypeScript clean | CI | `tsc --noEmit` → 0 errors |
| 2 | Unit tests | CI | `pnpm test` → 0 failures |
| 3 | E2E journey | CI | `workbench-journey.spec.ts` → 0 failures |
| 4 | WORKBENCH_ENABLED configured | coord | flag 已设置 |
| 5 | Gateway reachable | QA | `curl localhost:18789` → 2xx/3xx |
| 6 | P004 real DOM P50 | QA | `< 100ms` |
| 7 | P004 dropped frames | QA | `< 2` |
| 8 | CHANGELOG updated | engineer | 4 commit 均附带 changelog |

---

## Rollback Plan

| Trigger | Action |
|---------|--------|
| P004 P50 ≥ 100ms | Revert canvas-virtualization commit, fallback to `.map()` rendering |
| Workbench 500 on load | `NEXT_PUBLIC_WORKBENCH_ENABLED=false` (kill switch) |
| P006 gateway timeout loop | Disable agent UI, hide `/api/agent/*` behind feature flag |
| MCP server health check fails | Deploy previous mcp-server image, investigate health endpoint |

---

## 执行决策

| 字段 | 内容 |
|------|------|
| **决策** | **已采纳** |
| **执行项目** | vibex-sprint20-qa |
| **执行日期** | 2026-05-01 |

---

*版本: 1.0*
*Architect: architect 🤖*
*计划时间: 2026-05-01 07:58 GMT+8*
