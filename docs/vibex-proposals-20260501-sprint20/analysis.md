# VibeX Sprint 20 功能提案分析报告

**Analyst**: analyst
**日期**: 2026-05-01
**项目**: vibex-sprint20
**分析视角**: 基于 Sprint 1-19 交付成果，识别下一批高优先级功能增强
**产出路径**: `/root/.openclaw/vibex/docs/vibex-proposals-20260501-sprint20/analysis.md`

---

## 验证摘要

| 提案 | 验证状态 | 核心发现 |
|------|----------|----------|
| P001 MCP DoD 收尾 | ⚠️ 部分不实 | `INDEX.md` 已存在并由脚本生成；`/health` endpoint 存在但独立运行未集成 |
| P002 TS 严格模式 | ❌ 断言不实 | 前端 TS 错误=0，mcp-server TS 错误=0，提案声称"需验证是否还有遗留"是错的 |
| P003 Workbench 生产化 | ⚠️ 验证通过 | Epic 文档完整，测试通过，但前端无 workbench 路由/组件 |
| P004 Canvas 虚拟化 | ✅ 验证通过 | DDSCanvasStore 使用 `.map()` 无虚拟化，100+节点性能风险真实存在 |
| P005 E2E CI 集成 | ✅ 验证通过 | 存在 106 个 E2E 测试文件，CI 已集成 E2E gate |
| P006 Claude Code Agent | ✅ 验证通过 | CodingAgentService 明确标注为 mock，backend 无真实接入 |

---

## 业务场景分析

### P001: MCP DoD 收尾

**问题来源**: Sprint 16 S16-P2-2 MCP Tool Governance 产出文档后，最终验证步骤被跳过。

**当前状态（已验证）**:
- `docs/mcp-tools/INDEX.md` 已存在（2016 bytes，2026-04-30 更新）
- `scripts/generate-tool-index.ts` 运行成功（输出: "Wrote 7 tools"）
- MCP server `src/routes/health.ts` 存在独立 HTTP 服务器（port 3100）
- **关键缺口**: `/health` endpoint 未集成到主 `index.ts`（stdio transport），health.ts 是独立进程

**业务价值**: DoD 缺口修补，工具可观测性提升，支持 MCP 工具清单自动化文档维护。

### P002: TypeScript 严格模式完成

**问题来源**: Sprint 17 声称 342 个 TS 错误，Sprint 18 声称"解决 351 个 TS 严格错误"。

**当前状态（已验证）**:
```
vibex-fronted: 0 errors
packages/mcp-server: 0 errors
```
**结论**: P002 的问题描述已过时。S18 声称完成的工作实际通过了（或者从未有 342 个错误）。提案引用了过期数据。

**注意**: CHANGELOG 中无 CI typecheck gate 验证记录，但 tsc --noEmit 在本地确实干净。这可能意味着：
1. S18 确实完成了（只是没写 CHANGELOG）
2. 本地干净但 CI 环境有差异（需进一步验证 CI）

### P003: Workbench Integration 生产化

**问题来源**: Sprint 17-20 的 6 Epic（E1 SSE / E2 Thread Management / E3 Run Engine / E4 Artifact Registry / E5 Canvas Orchestration / E6 Workbench Shell）测试 100% 通过但未部署。

**当前状态（已验证）**:
- `docs/vibex-workbench-integration/` 有完整的 6 个 epic 测试报告
- 前端 `src/app/` 中无 workbench 路由/组件 → **Workbench UI 未集成到产品**
- 无生产部署记录

**业务价值**: 从 Canvas 到 Agent 的闭环体验是产品差异化的核心。Workbench 不上线，前面所有 Epic 投入都是沉没成本。

### P004: Canvas 虚拟化列表

**问题来源**: Sprint 1-19 没有解决 P1-1 Canvas 虚拟化（100+ 节点性能）。

**当前状态（已验证）**:
- `DDSCanvasStore.ts` 使用 `cards.map()` 渲染，无虚拟化
- `docs/architecture/CHANGELOG.md` 无 S18/S19 记录（文件为空或无 sprint 记录）
- 在线应用 https://vibex-app.pages.dev 确认画布存在

**业务价值**: 大型项目（100+节点）是真实用户场景，P1-1 已积压 19 个 sprint，是明显的性能债务。

### P005: E2E CI 集成化

**问题来源**: E2E 测试产出与 CI gate 执行脱节。

**当前状态（已验证）**:
- `vibex-fronted/e2e/`: 25 个测试文件
- `vibex-fronted/tests/e2e/`: 81 个测试文件
- CI `test.yml` 已包含 E2E job: `test:e2e:ci` 命令 → `playwright install --with-deps chromium` + `test:e2e:ci`
- Playwright CI config 存在: `playwright.ci.config.ts`

**结论**: 提案描述的"E2E 未集成到 CI"与实际 CI 配置不符。E2E 已在 CI 中，但需要验证运行状态（是否 flaky / 是否通过）。

### P006: Claude Code Agent 真实接入

**问题来源**: Sprint 12 实现 UI（AgentFeedbackPanel / AgentSessions），后端 mock。

**当前状态（已验证）**:
```typescript
// CodingAgentService.ts
/**
 * - U3: BLOCKED — sessions_spawn is an OpenClaw runtime tool, not callable
 *   from Next.js frontend API routes. Needs backend AI Agent HTTP API.
 * - U4/U5: Implemented as mock service for UI development + testing.
 *   Replace mockAgentCall with real sessions_spawn once backend is ready.
 */
```
**核心障碍**: `sessions_spawn` 是 OpenClaw runtime 工具，Next.js 前端无法直接调用。需要后端 AI Agent HTTP API 作为桥接层。

**业务价值**: AI Coding 是核心差异化功能，mock 状态无法交付用户价值。

---

## 技术方案选项

### P001 技术方案

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| **A-1 (推荐)** | 将 `/health` endpoint 集成到 mcp-server 主进程，添加为 MCP transport 初始化前的 startup check | 2h | 低 |
| **A-2** | 重构 health.ts 为 MCP 协议内工具（而非独立 HTTP server） | 4h | 中 |

### P002 技术方案

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| **B-1** | 验证 CI typecheck 与本地一致，确认无 real issue | 1h | 低 |
| **B-2** | 如 CI 有差异，修复 CI 环境差异 | 2-4h | 中 |

**结论**: P002 当前状态干净，无需"完成"，但缺少 CI 验证记录存在潜在风险。

### P003 技术方案

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| **C-1 (推荐)** | Feature flag 控制，Workbench 独立页面路由，按用户群灰度发布 | 6h | 中 |
| **C-2** | 直接合入主分支，beta 用户可见 | 3h | 高 |

### P004 技术方案

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| **D-1 (推荐)** | 接入 `@tanstack/react-virtual`，对 DDSCanvasStore chapters 和 cards 做虚拟化 | 6-8h | 中 |
| **D-2** | 分页加载（非虚拟化），用户手动翻页 | 4h | 低 |
| **D-3** | 服务端渲染优化，减少首屏 DOM 节点 | 8h | 高 |

### P005 技术方案

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| **E-1 (推荐)** | 验证 CI E2E 实际运行状态，修复 flaky，补充关键路径测试 | 4h | 中 |
| **E-2** | 添加 E2E 覆盖率指标到 PR gate | 2h | 低 |

**结论**: "E2E 未集成 CI"断言不实，真实需求是 E2E 运行质量和覆盖率。

### P006 技术方案

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| **F-1 (推荐)** | 后端 AI Agent HTTP API（桥接 OpenClaw sessions_spawn），前端对接后端 API | 8h | 中（sessions_spawn 可用性） |
| **F-2** | WebSocket 长连接直连 OpenClaw（安全风险高） | 12h | 高 |
| **F-3** | 保留 mock，明确 roadmap 延期 | 0h | 低 |

---

## 可行性评估

| 提案 | 技术可行性 | 工期 | 依赖关系 | 推荐 |
|------|-----------|------|----------|------|
| P001 | ✅ 高 | 2h | 已有完整文档 | **推荐** |
| P002 | ✅ 高（无实际问题） | 1h | 无 | 不需要"完成" |
| P003 | ✅ 高 | 6h | E1-E6 epic 已完成 | **推荐** |
| P004 | ✅ 高 | 6-8h | 无 | **推荐** |
| P005 | ✅ 高 | 4h | E2E 测试已存在 | 需求重新定义 |
| P006 | ⚠️ 中 | 8h | 后端 API 开发 | **有条件推荐** |

---

## 风险矩阵

| 风险 ID | 描述 | 可能性 | 影响 | 缓解方案 |
|---------|------|--------|------|----------|
| R1 | P003 Workbench 用户体验未验证 | 中 | 高 | Beta 用户灰度，控制 feature flag |
| R2 | P004 虚拟化影响已有 UX（滚动行为/选中状态） | 中 | 中 | 自动化回归测试 + 手动验收 |
| R3 | P006 sessions_spawn 在非 OpenClaw 环境不可用 | 高 | 高 | F-1 方案需要评估 backend 调用 sessions_spawn 的可行性 |
| R4 | P005 E2E flaky 导致 CI 不稳定 | 中 | 中 | 隔离 flaky 测试，retry 策略 |
| R5 | P002 伪需求（无 TS 错误但提案说有） | - | 中 | 更新提案数据，修正断言 |

---

## 根因分析

基于 Sprint 1-19 的 CHANGELOG 分析，识别以下根因模式：

1. **DoD 缺口累积**: S16 文档产出完整但最终验证步骤被跳过（MCP INDEX.md `/health` 未集成）
2. **技术债务延期螺旋**: S17/S18 的 TS 修复工作未记录验证结果，导致 S20 仍引用过期数据
3. **功能发布 Gap**: Workbench 6 Epic 100% 测试通过但从未上线，Epic 投入产出比=0
4. **E2E 建设 vs 集成脱节**: E2E 测试持续产出但质量/覆盖率信息不透明
5. **MVP 之后无深化**: AI Agent UI 实现（S12）后接入层搁置超过 8 个 sprint

---

## 验收标准

### P001: MCP DoD 收尾
- `pnpm run build` 在 mcp-server → 0 errors
- `scripts/generate-tool-index.ts` exit 0，生成 INDEX.md（已验证通过）
- MCP server `/health` 在 stdio 初始化前可访问
- **验证命令**: `node -e "const s=require('./src/routes/health')"` → 不抛出

### P003: Workbench 生产化
- Workbench 路由 `/workbench` 可访问（feature flag=ON 时）
- E2E 测试覆盖 Canvas → Agent → Artifact → Canvas 完整旅程
- 不影响现有 CI 测试套件
- **验证命令**: `pnpm exec playwright test tests/e2e/workbench-journey.spec.ts`

### P004: Canvas 虚拟化
- 100 个节点渲染 P50 < 100ms（benchmark 脚本）
- DDSCanvasStore chapters/cards 使用虚拟化列表
- 手动测试：滚动、选中、拖拽行为正常
- **验证命令**: `pnpm run benchmark` → 100 nodes < 100ms

### P005: E2E CI 质量
- E2E 测试在 CI 实际运行（不是仅配置存在）
- 关键路径覆盖率 > 80%
- flaky 率 < 5%
- **验证命令**: `pnpm playwright test --reporter=html` → CI report 可访问

### P006: Agent 真实接入
- 后端 AI Agent API 可创建/管理会话
- CodeGen 结果可回写到 Canvas
- 异常处理完善（超时/网络错误/agent 崩溃）
- **验证命令**: `curl -X POST /api/agent/sessions -d '{"task":"..."}'` → 201 返回

---

## 驳回摘要

| 提案 | 驳回原因 |
|------|----------|
| P002 | 提案断言"需验证是否还有遗留"，实际验证显示 TS 错误=0。问题不真实。建议降级为"验证 CI typecheck 一致性"。 |
| P005 | 提案描述"E2E 未集成 CI"与实际 CI 配置不符（CI 已配置 E2E job）。需求被错误识别。真实需求是"E2E 运行质量和覆盖率提升"。 |

---

## 执行决策

- **决策**: 有条件推荐
- **执行项目**: vibex-sprint20
- **执行日期**: 待定

### 优先级排序

| 优先级 | 提案 | 工时 | 理由 |
|--------|------|------|------|
| P0 | P001 | 2h | 快速收尾，DoD 缺口明确 |
| P0 | P002 重定义 | 1h | 问题不真实，修正后降级处理 |
| P1 | P003 | 6h | Workbench 已完成测试，不上线=沉没成本 |
| P1 | P004 | 6-8h | 19 sprint 技术债，性能风险真实 |
| P1 | P005 重定义 | 4h | 需求修正后执行 E2E 质量提升 |
| P2 | P006 | 8h | 依赖后端 API 开发，优先级低于基础设施 |

### 总工时估算: 27-29h（含 P002 重定义）

---

**分析师**: analyst 🤖
**评审时间**: 2026-05-01 04:00 GMT+8
**下次审查**: 提案执行后更新