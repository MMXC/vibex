# 提案模板

**Agent**: analyst
**日期**: 2026-05-01
**项目**: vibex-sprint20
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-19 交付成果，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | tech-debt | Design-to-Code DoD 收尾 | MCP tools, CI | P0 |
| P002 | quality | TypeScript 严格模式完成 | vibex-fronted, mcp-server | P0 |
| P003 | feature | Workbench Integration 生产化 | 用户体验, 留存 | P1 |
| P004 | feature | Canvas 虚拟化列表 | 100+ 节点性能 | P1 |
| P005 | quality | E2E CI 集成化 | 测试基础设施 | P1 |
| P006 | feature | Claude Code Agent 真实接入 | AI Coding 功能 | P2 |

---

## 2. 提案详情

### P001: Design-to-Code DoD 收尾

**问题描述**:
Sprint 16 S16-P2-2 MCP Tool Governance 已产出完整文档（222/175/176/134/243 行），但 DoD gaps 未完成：
- `docs/mcp-tools/INDEX.md` 未生成
- `scripts/generate-tool-index.ts` 未运行
- MCP server `GET /health` endpoint 未集成到 main index.ts

**影响范围**:
`packages/mcp-server/`, `docs/mcp-tools/`, CI pipeline

**验收标准**:
- `pnpm run build` → 0 errors
- `scripts/generate-tool-index.ts` exit 0，生成 INDEX.md
- MCP server `/health` 返回 `{status, version, tools: {registered, names}}`

---

### P002: TypeScript 严格模式完成

**问题描述**:
Sprint 17 E3 TypeScript `noUncheckedIndexedAccess` 启用后，vibex-fronted 剩余 342 个 TS 错误（S17-E3-U2/U3 延期到 Sprint 18）。Sprint 18 声称完成 E18-TSFIX-2（"解决 351 个 TS 严格错误"），但需验证是否还有遗留。

**影响范围**:
vibex-fronted, packages/mcp-server, packages/types

**验收标准**:
- `cd vibex-fronted && pnpm exec tsc --noEmit` → 0 errors
- `cd packages/mcp-server && pnpm exec tsc --noEmit` → 0 errors
- CI typecheck gate 通过

---

### P003: Workbench Integration 生产化

**问题描述**:
Sprint 17-20 的 Workbench Integration Epic 1-6 全部测试通过（E1 SSE / E2 Thread Management / E3 Run Engine / E4 Artifact Registry / E5 Canvas Orchestration / E6 Workbench Shell），但未集成到主产品，未部署。

**影响范围**:
用户旅程（从 Canvas 到 Agent 的闭环体验），留存

**验收标准**:
- Workbench 功能对 beta 用户可见
- 端到端用户旅程测试通过（Canvas → Agent → Artifact → Canvas）
- 不影响当前 CI 测试套件

---

### P004: Canvas 虚拟化列表

**问题描述**:
Sprint 1-19 没有解决 P1-1 Canvas 虚拟化（100+ 节点性能）。当前 DDSCanvasStore/card 渲染无虚拟化，大型项目卡顿风险已存在 17 个 sprint。

**影响范围**:
Canvas 性能，用户体验（大型项目）

**验收标准**:
- 100 个节点渲染 < 100ms（P50）
- 虚拟化列表 API 接入现有 chapter/flow/component 结构

---

### P005: E2E CI 集成化

**问题描述**:
Sprint 2-19 产出了大量 Playwright E2E 测试（canvas-e2e / firebase-presence / design-review / version-history / keyboard-shortcuts 等），但 E2E 测试未集成到 CI gate，测试产出 vs 测试执行脱节。

**影响范围**:
CI pipeline，质量门禁完整性

**验收标准**:
- E2E 测试在 CI 中可执行（非 flaky）
- PR 合入需要 E2E 关键路径测试通过
- E2E 报告自动生成并可访问

---

### P006: Claude Code Agent 真实接入

**问题描述**:
Sprint 12 E2 AI Coding Agent 功能已实现 UI（AgentFeedbackPanel / AgentSessions），但后端真实接入未完成。Sprint 14 E1-US 实现了 "Send to AI Agent" 按钮（`?agentSession=new`），但实际 agent 接入是 mock。

**影响范围**:
AI Coding 核心功能，用户价值

**验收标准**:
- Agent 会话可真实创建和管理
- CodeGen 结果可回写到 Canvas
- 异常处理完善

---

## 根因分析

### 根因

基于 Sprint 1-19 的 CHANGELOG 分析，识别出以下根因模式：

**1. DoD 缺口累积**：Sprint 16 文档产出完整但最终验证步骤被跳过（MCP INDEX.md `/health`）
**2. 技术债务延期螺旋**：342 个 TS 错误（S17）→ 宣布完成（S18）→ 未验证
**3. 功能发布 Gap**：Workbench 6 Epic 100% 测试通过但从未发布
**4. E2E 建设 vs 集成脱节**：测试建设持续但 CI gate 缺失
**5. MVP 之后无深化**：AI Agent UI 实现后接入层搁置

### 证据

- S16-P2-2 DoD gaps 明确记录在 CHANGELOG 中
- S18-E18-TSFIX-2 声称 "解决 351 个 TS 严格错误"，但 CHANGELOG 无 CI 验证记录
- docs/vibex-workbench-integration/ 有 6 个完整 epic 测试报告，无生产部署记录
- 无 E2E CI 集成的 CHANGELOG 条目
- Agent UI 实现于 S12，无后续 backend 接入记录

---

## 建议方案

### P001: Design-to-Code DoD 收尾（方案 A — 推荐）

- **描述**：运行 `scripts/generate-tool-index.ts`，集成 `/health` endpoint，验证 build
- **实施成本**：低（2-4h）
- **风险**：低（有完整测试覆盖）
- **回滚计划**：git revert

### P001（方案 B）

- **描述**：重构 generate-tool-index.ts 为 MCP server 内置功能
- **实施成本**：中（4-6h）
- **风险**：中（引入变更）

### P002: TypeScript 严格模式完成

- **描述**：全量运行 tsc --noEmit，逐一解决剩余 TS 错误
- **实施成本**：高（6-8h for 100+ remaining errors）
- **风险**：中（可能影响已有功能）
- **回滚计划**：revert 或 disable noUncheckedIndexedAccess

### P003: Workbench 生产化

- **描述**：功能开关控制，渐进发布到 beta 渠道
- **实施成本**：中（4-6h）
- **风险**：中（用户体验风险）
- **回滚计划**：feature flag 关闭

---

## 执行依赖

- [ ] 需要修改的文件: `packages/mcp-server/src/`, `docs/mcp-tools/`, `vibex-fronted/tsconfig.json`
- [ ] 前置依赖: S16-P2-2 (MCP Tool Governance 文档已产出)
- [ ] 需要权限: GitHub Actions CI write access（E2E CI 集成）
- [ ] 预计工时: P001(4h) + P002(8h) + P003(6h) + P004(6h) + P005(6h) + P006(8h) = 38h
- [ ] 测试验证命令:
  - P001: `cd packages/mcp-server && pnpm run build && node scripts/generate-tool-index.ts`
  - P002: `cd vibex-fronted && pnpm exec tsc --noEmit`
  - P003: manual QA + e2e workbench spec
  - P004: performance benchmark 100 nodes
  - P005: `pnpm playwright test --reporter=html`
  - P006: `cd packages/mcp-server && pnpm run build`

---

## 执行决策

- **决策**: 待评审
- **执行项目**: vibex-sprint20
- **执行日期**: 待定

---

## Sprint 1-19 关键交付摘要

| Sprint | 核心交付 |
|--------|----------|
| S1-S3 | 拖拽编辑器, Mock数据, 路由树, 页面跳转 |
| S4 | 三章节卡片, 横向滚奏, AI草稿, DAG关系 |
| S5 | 数据层, 跨画布导航, DDL生成, PRD融合 |
| S6 | 设计稿导入, AI Coding Agent, 版本Diff |
| S7 | Firebase Presence, 协作冲突, 批量导出 |
| S8-S9 | Import/Export, Teams API, API错误格式 |
| S10 | Canvas持久化, TabBar对齐 |
| S11 | 后端TS债务, Wrangler types |
| S12 | 设计评审, Prompts AST扫描, MCP可观测性 |
| S13 | 身份验证, Middleware, Auth 401处理 |
| S14 | Design-to-Code Pipeline |
| S15 | Version History, Firebase Mock, Code Generator |
| S16 | Design Review UI, Canvas Version History, Bidirectional Sync |
| S17 | TypeScript严格模式, Analytics E2E, Firebase Degradation |
| S18 | DX改进, 测试覆盖率, 三树空状态, 骨架屏 |
| S19 | (参考 CHANGELOG 确认) |
