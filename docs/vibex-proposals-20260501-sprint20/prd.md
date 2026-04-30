# VibeX Sprint 20 产品需求文档

**版本**: 1.0
**日期**: 2026-05-01
**产品经理**: PM
**分析师**: Analyst（数据来源：`analysis.md`）
**产品**: VibeX — Canvas 可视化 DDS 工作流 + AI Coding Agent 集成

---

## 1. Executive Summary

VibeX Sprint 20 聚焦四个已验证的功能缺口：**MCP DoD 收尾**（`/health` 未集成）、**Workbench 生产化**（Epic 投入产出比 = 0）、**Canvas 虚拟化**（19 sprint P1-1 技术债）、**AI Agent 真实接入**（mock 状态持续 8 sprint）。本轮不包含 P002（TS 严格模式，TS 错误数已 = 0，问题不真实）和 P005（E2E CI 集成，CI 配置已存在，需求识别错误）。总工时估算 **22–24 小时**，全部可在一周内交付。

---

## 2. User Stories

### US-001: MCP DoD 收尾
> **As a** developer,
> **I want** the MCP server `/health` endpoint to be integrated into the main stdio transport on startup,
> **so that** I can observe tool availability without running a separate HTTP server and the DoD gap from Sprint 16 is formally closed.

**Epic**: Epic-E（Canvas Orchestration）子任务
**Sprint**: S20
**Effort**: 2h

---

### US-002: Workbench Integration 生产化
> **As a** user,
> **I want** to access the Workbench from the Canvas via a feature-flagged route,
> **so that** I can complete the full闭环 journey: Canvas → Agent → Artifact → Canvas, converting 19 sprints of Epic investment into user-facing value.

**Epic**: Epic-E6（Workbench Shell）
**Sprint**: S20
**Effort**: 6h

---

### US-003: Canvas 虚拟化
> **As a** user working on large projects (100+ nodes),
> **I want** the Canvas to virtualize off-screen cards and chapters,
> **so that** rendering remains responsive (P50 < 100ms at 100 nodes) and I can work without lag.

**Epic**: Epic-E5（Canvas Orchestration）性能增强
**Sprint**: S20
**Effort**: 6–8h

---

### US-004: AI Agent 真实接入
> **As a** user,
> **I want** the AI coding agent to execute real code (not mock responses),
> **so that** I can receive actionable code artifacts and the Canvas → Agent core differentiator is actually delivered.

**Epic**: Epic-E2（Thread Management）& Epic-E3（Run Engine）真实化
**Sprint**: S20
**Effort**: 8h

---

## 3. Acceptance Criteria

### AC-001: MCP DoD 收尾

| # | Acceptance Criterion | Verification Method |
|---|---------------------|---------------------|
| AC-001-1 | `scripts/generate-tool-index.ts` exits with code 0 and writes `docs/mcp-tools/INDEX.md` containing ≥ 7 tool entries | `pnpm exec ts-node scripts/generate-tool-index.ts && test $(wc -l < docs/mcp-tools/INDEX.md) -ge 7` |
| AC-001-2 | MCP server starts with `/health` accessible before stdio transport initialization | `curl http://localhost:3100/health` → HTTP 200 within 1s of startup |
| AC-001-3 | `cd packages/mcp-server && pnpm run build` exits with code 0, stdout contains "0 errors" | CI gate |
| AC-001-4 | `node -e "require('./src/routes/health')"` does not throw in mcp-server context | `node -e "require('./src/routes/health')" && echo "OK"` → "OK" |

---

### AC-002: Workbench Integration 生产化

| # | Acceptance Criterion | Verification Method |
|---|---------------------|---------------------|
| AC-002-1 | Route `/workbench` returns HTTP 200 when `NEXT_PUBLIC_WORKBENCH_ENABLED=true` | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/workbench` → "200" |
| AC-002-2 | Route `/workbench` returns HTTP 404 when `NEXT_PUBLIC_WORKBENCH_ENABLED=false` (default) | Same curl with flag=false → "404" |
| AC-002-3 | Canvas → Agent → Artifact → Canvas E2E journey test passes | `pnpm exec playwright test tests/e2e/workbench-journey.spec.ts` → 0 failures |
| AC-002-4 | Existing CI suite (`pnpm run test`) is unaffected by Workbench route addition | CI pipeline exit code 0 |
| AC-002-5 | Workbench feature flag is documented in `docs/feature-flags.md` | File exists, contains `WORKBENCH_ENABLED` entry |

---

### AC-003: Canvas 虚拟化

| # | Acceptance Criterion | Verification Method |
|---|---------------------|---------------------|
| AC-003-1 | 100 nodes rendered in under 100ms (P50) on a 2024 MacBook Pro equivalent | `pnpm run benchmark --nodes=100` → "P50 < 100ms" |
| AC-003-2 | `DDSCanvasStore.ts` does not use raw `.map()` for card rendering — virtualized list used | `grep -n "\.map(" src/stores/DDSCanvasStore.ts` → 0 results on card/chapter rendering paths |
| AC-003-3 | Scrolling through 150 nodes does not cause layout jank (no dropped frames > 2) | Playwright performance trace: "Dropped frames < 2" at 60fps |
| AC-003-4 | Card selection state (selected, hover) is preserved across virtual scroll boundaries | Automated test: select card at index 0, scroll 50 items, verify selection state |
| AC-003-5 | Benchmark script exists at `scripts/benchmark-canvas.ts` and is runnable | `pnpm exec ts-node scripts/benchmark-canvas.ts --nodes=100` → exits 0 |

---

### AC-004: AI Agent 真实接入

| # | Acceptance Criterion | Verification Method |
|---|---------------------|---------------------|
| AC-004-1 | `POST /api/agent/sessions` creates a new session and returns HTTP 201 with `sessionId` | `curl -X POST http://localhost:3000/api/agent/sessions -H "Content-Type: application/json" -d '{"task":"list files"}' -w "\n%{http_code}"` → 201 + JSON with `sessionId` |
| AC-004-2 | `GET /api/agent/sessions/:id/status` returns current session state | `curl http://localhost:3000/api/agent/sessions/{sessionId}/status` → 200 + JSON `{status, progress}` |
| AC-004-3 | `DELETE /api/agent/sessions/:id` terminates a session | `curl -X DELETE http://localhost:3000/api/agent/sessions/{sessionId}` → 204 |
| AC-004-4 | Agent result is written back to Canvas as an artifact node | E2E test verifies: agent task → artifact node appears in DDSCanvasStore within 30s |
| AC-004-5 | Timeout (30s) and network error scenarios return structured error JSON | `curl -X POST /api/agent/sessions -d '{}'` → 400 + `{error, code}` |
| AC-004-6 | Backend successfully calls OpenClaw `sessions_spawn` tool | Backend logs contain "sessions_spawn called with" and no "ECONNREFUSED" |
| AC-004-7 | `CodingAgentService.ts` no longer contains `// MOCK` or `mockAgentCall` | `grep -r "MOCK\|mockAgentCall" src/services/CodingAgentService.ts` → 0 results |

---

## 4. Prioritization Matrix

### RICE 计算

| 提案 | Reach | Impact | Confidence | Effort (h) | RICE Score |
|------|-------|--------|------------|------------|------------|
| P001 MCP DoD 收尾 | 10 | 2 | 100% | 2 | **20.0** |
| P003 Workbench 生产化 | 10 | 5 | 90% | 6 | **30.0** |
| P004 Canvas 虚拟化 | 8 | 4 | 80% | 7 | **14.6** |
| P006 AI Agent 真实接入 | 8 | 5 | 75% | 8 | **11.3** |

**RICE 公式**: (Reach × Impact × Confidence) ÷ Effort

**优先级排序**:
1. **P003** (RICE 30.0) — 最高 ROI，Epic 投入变现，用户价值最直接
2. **P001** (RICE 20.0) — 低成本快速收尾，DoD 合规，无技术风险
3. **P004** (RICE 14.6) — 性能债务真实，80% confidence 影响分数，但 19 sprint 积压应优先处理
4. **P006** (RICE 11.3) — 价值最高但 effort 最高 + confidence 最低，R3 风险需先评估

---

## 5. Epic Mapping

| Epic ID | Epic 名称 | Sprint 状态 | S20 提案 | 关系 |
|---------|-----------|-------------|---------|------|
| Epic-E1 | SSE Communication | S17 完成 ✅ | — | 无直接关联 |
| Epic-E2 | Thread Management | S18 完成 ✅ | P006 | 真实化（U3-U5 mock → real） |
| Epic-E3 | Run Engine | S18 完成 ✅ | P006 | 依赖后端 API |
| Epic-E4 | Artifact Registry | S18 完成 ✅ | P006 | Agent 输出写入 artifact |
| Epic-E5 | Canvas Orchestration | S19 完成 ✅ | P003, P004 | Workbench 集成 + 虚拟化 |
| Epic-E6 | Workbench Shell | S19 完成 ✅ | P003 | 生产化上线 |
| Epic-D | MCP Tool Governance | S16 完成 ✅ | P001 | DoD 收尾 |

**映射说明**:
- P003 连接 Epic-E6 → Epic-E5 → Epic-E4 → Epic-E3 → Epic-E2，完成 **Canvas → Agent → Artifact → Canvas** 完整闭环
- P006 驱动 Epic-E2 和 Epic-E3 从 mock 状态变为生产就绪
- P004 独立优化 Epic-E5 的性能质量

---

## 6. Dependency Map

```
[Canvas: DDSCanvasStore]
       │
       ├──[P004]──► @tanstack/react-virtual 接入
       │                   │
       │                   ▼
       │            Canvas 渲染性能（P50 < 100ms）
       │
       ├──[P003]──► /workbench 路由（Feature Flag: WORKBENCH_ENABLED）
       │                   │
       │                   ▼
       │            [Epic-E6] Workbench Shell（已有测试）
       │                   │
       │                   ▼
       │            Agent Sessions UI（CodingAgentService）
       │                   │
       │         ┌─────────┴──────────┐
       │         ▼                     ▼
       │  [Epic-E3] Run Engine   [Epic-E4] Artifact Registry
       │         │                     │
       │         └─────────┬───────────┘
       │                   ▼
       │         [P006] Backend AI Agent HTTP API
       │                   │
       │                   ▼
       │         OpenClaw sessions_spawn tool
       │
       └──[P001]──► MCP Tool Governance（DoD 收尾）
                       │
                       ▼
              /health endpoint 集成到 stdio transport
                       │
                       ▼
              docs/mcp-tools/INDEX.md 自动生成
```

### 技术依赖

| 依赖 | 源 | 目标 | 类型 | 风险 |
|------|-----|------|------|------|
| `@tanstack/react-virtual` | P004 | Canvas | npm 包引入 | 低 |
| `sessions_spawn` OpenClaw 工具 | P006 | Backend API | 运行时依赖 | **高（R3）** |
| Epic-E1 ~ E6 测试通过 | P003 | Workbench 路由 | 质量门禁 | 低 |
| `WORKBENCH_ENABLED` feature flag | P003 | 路由可见性 | 逻辑开关 | 低 |
| `/health` endpoint 源码 | P001 | mcp-server | 已有代码 | 低 |

### 工作流依赖

| 依赖 | 说明 |
|------|------|
| P006 → P003 | P006 后端 API 完成后，P003 E2E journey 测试才有端到端价值 |
| P004 → P003 | Canvas 虚拟化是 Workbench 体验的底层依赖（滚动性能） |
| P001 → (独立) | 无上游依赖，可最先完成 |

---

## 7. Definition of Done

### P001: MCP DoD 收尾

- [ ] `scripts/generate-tool-index.ts` 在 CI 和本地均 exit 0
- [ ] `docs/mcp-tools/INDEX.md` 存在且包含 ≥ 7 个工具条目
- [ ] `/health` 在 mcp-server 主进程启动序列中可访问（独立 HTTP 进程已移除或合并）
- [ ] `packages/mcp-server` build 无 TypeScript 错误
- [ ] CHANGELOG.md 记录本次收尾（引用 S16 DoD 缺口）

### P003: Workbench Integration 生产化

- [ ] `src/app/workbench/page.tsx` 存在且 `NEXT_PUBLIC_WORKBENCH_ENABLED=true` 时 HTTP 200
- [ ] `NEXT_PUBLIC_WORKBENCH_ENABLED=false`（默认）时 HTTP 404
- [ ] `docs/feature-flags.md` 包含 `WORKBENCH_ENABLED` 条目
- [ ] E2E 测试 `tests/e2e/workbench-journey.spec.ts` 覆盖完整旅程且 0 failures
- [ ] CI pipeline `pnpm run test` 全部通过
- [ ] PR 包含 feature flag 灰度计划（先内部用户，再 beta，再 GA）

### P004: Canvas 虚拟化

- [ ] `DDSCanvasStore.ts` 不含 `.map()` 用于 card/chapter 渲染（已替换为虚拟化列表）
- [ ] `scripts/benchmark-canvas.ts` 存在且可执行
- [ ] `pnpm run benchmark --nodes=100` 输出 P50 < 100ms
- [ ] 150 节点滚动 Playwright trace：Dropped frames < 2
- [ ] 卡片选中状态跨虚拟边界保持（自动化测试）
- [ ] 不影响现有 Canvas 功能（拖拽、缩放、节点连接）

### P006: AI Agent 真实接入

- [ ] `POST /api/agent/sessions` → 201 + `sessionId`
- [ ] `GET /api/agent/sessions/:id/status` → 200 + 状态
- [ ] `DELETE /api/agent/sessions/:id` → 204
- [ ] Agent 执行结果写入 Canvas artifact（E2E 验证）
- [ ] 超时和网络错误返回 `{error, code}` 结构化响应
- [ ] Backend 日志包含 `sessions_spawn called`，无 `ECONNREFUSED`
- [ ] `CodingAgentService.ts` 无 `MOCK` / `mockAgentCall` 注释
- [ ] CI agent API 测试通过（mock server 或 test environment）

---

## 8. Execution Decision

| 字段 | 内容 |
|------|------|
| **决策** | **已采纳** |
| **执行项目** | vibex-sprint20（team-tasks 项目 ID 待绑定） |
| **执行日期** | 2026-05-05（计划） |
| **执行顺序** | P001 → P004 → P003 → P006 |
| **总工时估算** | 22–24 小时（单人） |

**说明**:
P001 先行（2h，独立性强，DoD 合规价值）。P004 次之（虚拟化是大型项目的性能基线，且 P003 依赖 P004 的滚动性能）。P003 第三（Workbench 上线是最大 ROI 的用户价值交付）。P006 最后（依赖后端 API 开发，effort 最大，sessions_spawn 可用性需在 S20 开始前确认）。

P002（TS 严格模式）**不执行** — 分析师验证 TS 错误 = 0，提案基于过期数据，建议降级为 CI typecheck 一致性确认任务（1h，不占用 Sprint 20 核心交付）。

P005（E2E CI 集成）**不执行** — CI E2E job 已存在，提案描述与实际不符，真实需求是 E2E 运行质量和覆盖率，拆分为独立维护任务。

---

## 9. Excluded Proposals

### P002: TypeScript 严格模式完成

**状态**: ❌ 已拒绝

**分析师结论**: `vibex-fronted` 和 `packages/mcp-server` 的 TypeScript 错误数均为 **0**。P002 提案引用 "S17 342 个错误" 和 "S18 解决 351 个 TS 严格错误"，但未经验证的过期数据。

**拒绝理由**: 问题不真实。提案声称 "需验证是否还有遗留"，但 `tsc --noEmit` 在本地返回 0 errors 已验证。真正的风险是 CI 环境与本地的一致性未被记录，但这不需要"Sprint 20 功能提案"级别的工作量。

**后续处理**: 建议作为 tech debt 维护任务（1h），验证 `CI typecheck` 与本地一致并写入 CHANGELOG，不占用 Sprint 20 核心交付。

---

### P005: E2E CI 集成化

**状态**: ❌ 已拒绝

**分析师结论**: `vibex-fronted/e2e/` 和 `vibex-fronted/tests/e2e/` 共计 106 个测试文件存在；CI `test.yml` 已包含 E2E job，执行 `test:e2e:ci` 命令；`playwright.ci.config.ts` 存在。P005 断言 "E2E 未集成到 CI" 与实际 CI 配置 **不符**。

**拒绝理由**: 提案对现状的描述错误，需求识别基于错误前提。"E2E 已集成 CI" 是事实，真实需求是：
1. E2E 在 CI 中的实际运行状态（flaky? 通过率?）
2. 关键路径覆盖率 > 80%
3. flaky 率 < 5%

**后续处理**: 建议拆分为独立维护任务 "E2E 运行质量提升"，与 Sprint 20 核心功能解耦，不占用本轮带宽。

---

## 附录：关键参考文件

| 文件 | 路径 |
|------|------|
| Analyst 验证报告 | `/root/.openclaw/vibex/docs/vibex-proposals-20260501-sprint20/analysis.md` |
| MCP Tool INDEX | `docs/mcp-tools/INDEX.md` |
| 工具索引生成脚本 | `scripts/generate-tool-index.ts` |
| MCP Health Route | `packages/mcp-server/src/routes/health.ts` |
| Canvas Store | `src/stores/DDSCanvasStore.ts` |
| Coding Agent Service | `src/services/CodingAgentService.ts` |
| Workbench Journey E2E | `tests/e2e/workbench-journey.spec.ts` |
| Feature Flags 文档 | `docs/feature-flags.md`（待创建） |
| Canvas Benchmark 脚本 | `scripts/benchmark-canvas.ts`（待创建） |

---

**文档版本**: 1.0
**PM**: pm 🤖
**最后更新**: 2026-05-01 04:16 GMT+8
