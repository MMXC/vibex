# VibeX Sprint 36 功能提案规划

**Agent**: analyst
**日期**: 2026-05-11
**项目**: vibex-proposals-sprint36
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-35 交付成果识别高优先级功能增强机会

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 多人协作 MVP：实时光标 + Presence 验证 | Canvas 页面 | P0 |
| P002 | improvement | 模板市场 MVP：只读市场 + 自定义模板上传 | Dashboard / Onboarding | P1 |
| P003 | technical-debt | MCP Tool Governance DoD 补全 | MCP Server | P1 |
| P004 | improvement | 撤销/重做 UI 集成与快捷键绑定 | Canvas 画布 | P2 |
| P005 | quality | AI Design Review E2E 闭环验证 | Design Review 面板 | P2 |

---

## 2. 提案详情

### P001: 多人协作 MVP — 实时光标 + Presence 验证

**问题描述**:

S35-P003 调研已完成：Firebase RTDB 免费层 20 并发瓶颈，WebSocket vs Yjs CRDT 方案对比清晰。方案 A（Firebase RTDB + Presence）5-7 人天推荐优先实现。但调研结论尚未落地实施。

S33-Epic3（意图气泡）和 S33-Epic2（冲突可视化）已交付，但 Firebase presence 端到端验收未完成，存在 P2.2 DoD gaps（S16-P2-2 ⚠️ DoD gaps）。

**影响范围**: Canvas 页面，多人协作场景，所有参与同一个画布的用户

**验收标准**:
- [ ] 2+ 用户打开同一画布时，能看到彼此的光标位置（延迟 < 3s）
- [ ] PresenceAvatars 正确显示在线用户列表（Firebase 未配置时 fallback 到空列表）
- [ ] 用户关闭 tab 时，cursor 在 5s 内从其他用户视角消失
- [ ] Firebase mock 模式下 E2E 测试通过（S27-P1.5 已覆盖）

---

## 根因分析

### 根因
S35-P003 的调研成果停留在文档层面，没有转化为可执行的任务。多人协作能力是 VibeX 的核心差异化功能（S27/S28/S30 已有大量基础设施投入），但最后一步落地验证缺失。

### 证据
- S35-P003 文档 `docs/vibex-proposals-sprint35/collaboration-research.md` 已完成竞品对比和方案选型，结论为"方案 A 推荐 Sprint 36 先实现实时光标验证用户需求"
- S33-Epic2/S33-Epic3 已交付冲突可视化 + 意图气泡，但未与 Firebase presence 端到端串联
- S28-E01 已实现 `useRealtimeSync` hook，但只做验证未做完整 UI 闭环

---

## 建议方案

### 方案 A（推荐）：分阶段 MVP，先落地实时光标

**Phase 1（2-3 人天）**：Firebase presence 端到端
- 集成 `useRealtimeSync` 到 DDSCanvasPage（已有 hook，未集成）
- RemoteCursor 显示其他用户光标（已有组件，未挂载到 Canvas）
- PresenceAvatars 显示在线用户头像（已有组件，确认集成点）
- Firebase 未配置时 mock fallback（已有机制）

**Phase 2（2-4 人天）**：协作状态感知
- IntentionBubble 与 presence 联动（编辑/选择/拖拽意图同步）
- ConflictBubble 与 LWW 仲裁联动（冲突节点高亮 + 解决）
- 在线/离线状态可视化（ConflictBubble 4-state banner 已实现）

- 实施成本：**中**（5-7 人天）
- 风险：**低**（Firebase mock 已覆盖，S33 已交付可视化组件）
- 回滚计划：Firebase 配置回退到 mock 模式，不影响核心功能

### 方案 B：跳过 Firebase，直接实现 Yjs CRDT
- 描述：采用 S35-P003 调研中方案 B（自建 WebSocket + Yjs）
- 实施成本：**高**（10-15 人天），推迟到下个 Sprint

---

## 执行依赖

- [ ] 需要修改的文件: `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`（集成 useRealtimeSync）, `vibex-fronted/src/lib/firebase/presence.ts`（端到端联调）
- [ ] 前置依赖: `docs/vibex-proposals-sprint35/collaboration-research.md`（S35-P003 调研结论）
- [ ] 需要权限: Firebase RTDB 配置（NEXT_PUBLIC_FIREBASE_* 环境变量）
- [ ] 预计工时: 5-7 人天
- [ ] 测试验证命令: `pnpm test:e2e -- tests/e2e/presence-mvp.spec.ts`

---

### P002: 模板市场 MVP — 只读市场 + 自定义模板上传

**问题描述**:

S35-P004 调研已完成：自建/GitHub Gist/Notion 三个方案对比，MVP 阶段只读市场安全风险可控。但调研结论未落地，用户无法使用模板市场功能。

S25-E1 已实现 Onboarding + 需求模板库捆绑交付（auto-fill + 场景化推荐），S27-P004/S28-E04 实现了模板 API CRUD，但模板市场（模板发现/浏览/选择）功能缺失。

**影响范围**: Dashboard 模板页面，Onboarding 流程，团队协作场景

**验收标准**:
- [ ] `/dashboard/templates` 页面显示预置模板列表（至少 3 个行业模板）
- [ ] 用户可以创建自定义模板（从当前项目导出）
- [ ] Onboarding Step 5 可以从市场选择模板并 auto-fill
- [ ] 模板 CRUD API 完整可用（S28-E04 已完成，无需重复实现）

---

## 根因分析

### 根因
模板市场是一个独立的发现层功能，区别于模板 CRUD（已实现）和模板 auto-fill（已实现）。用户当前只能通过 Onboarding 看到模板，无法主动浏览和发现已有模板。市场层缺失导致模板资产无法复用。

### 证据
- S35-P004 调研结论：`docs/vibex-proposals-sprint35/template-market-research.md` — 自建方案 4-6 人天，Gist 方案 2-3 人天，MVP 只读市场安全可控
- S25-E1 已实现：场景化推荐（new-feature/refactor/bugfix/documentation）+ auto-fill guard
- S28-E04 已实现：模板 CRUD API（31 tests passed）+ 导入/导出

---

## 建议方案

### 方案 A（推荐）：MVP 只读市场 + GitHub Gist 存储（2-3 人天）

- **市场展示层**: `vibex-fronted/src/app/dashboard/templates/page.tsx` — 模板卡片列表，场景过滤（industry filter），预览功能
- **Gist 存储后端**: `vibex-backend/src/app/api/templates/marketplace/route.ts` — GET /api/templates/marketplace，返回预置模板 JSON（GitHub Gist API 或静态 JSON）
- **自定义模板上传**: 用户从项目创建模板 → POST /api/v1/templates（已有 API）
- **Onboarding 集成**: 复用 S25-E1 的 `useTemplates()` hook，过滤 market templates

- 实施成本：**低**（2-3 人天）
- 风险：**低**（只读市场，无需写 API；已有模板 API 无需修改）
- 回滚计划：市场页面降级为静态 JSON，无网络依赖

---

## 执行依赖

- [ ] 需要修改的文件: `vibex-fronted/src/app/dashboard/templates/page.tsx`（市场展示）, `vibex-backend/src/app/api/templates/marketplace/route.ts`（后端接口）
- [ ] 前置依赖: `docs/vibex-proposals-sprint35/template-market-research.md`（S35-P004 调研结论）
- [ ] 需要权限: GitHub Gist API token（可选，静态 JSON fallback）
- [ ] 预计工时: 2-3 人天
- [ ] 测试验证命令: `pnpm test:e2e -- tests/e2e/templates-crud.spec.ts`

---

### P003: MCP Tool Governance DoD 补全

**问题描述**:

S16-P2-2 MCP Tool Governance 文档已交付（222 行规格 + 175 行 figma_import + 176 行 generate_code + 134 行 governance + 243 行 error handling），但存在 DoD gaps：

1. `INDEX.md` 未生成（S16-P2-2 ⚠️ DoD gaps）
2. `generate-tool-index.ts` 脚本未实现
3. `GET /health` 端点未在 `index.ts` 主进程启动前注册（S17-E1-U3 已实现独立 /health，但未与 MCP stdio 生命周期整合）

**影响范围**: MCP Server，所有使用 MCP tool 的客户端

**验收标准**:
- [ ] `docs/mcp-tools/INDEX.md` 存在且包含所有注册 tool（7 tools）
- [ ] `scripts/generate-tool-index.ts` 运行 exit 0，输出与 `index.ts` 同步
- [ ] MCP Server 启动时 `/health` 可访问，返回 `{status, version, uptime, tools: {registered, names}}`

---

## 根因分析

### 根因
DoD gaps 意味着功能交付不完整。Index.md 和 generate-tool-index.ts 是 Governance 规范的一部分，缺失导致 tool 文档无法自动同步。GET /health 独立 HTTP 服务未与 MCP stdio 主进程整合，导致健康检查与实际部署不一致。

### 证据
- S16-P2-2 ⚠️ DoD gaps 明确指出：`INDEX.md` + `generate-tool-index.ts` + `GET /health` endpoint in `index.ts` 未实现
- S17-E1-U3 已实现 `packages/mcp-server/src/routes/health.ts` 独立健康检查（standalone Node.js HTTP `/health` on port 3100）
- 文档：`docs/vibex-proposals-sprint16/mcp-tool-governance.md`

---

## 建议方案

### 方案 A（推荐）：DoD 补全（0.5 人天）

**S1**: 复用 `scripts/generate-tool-index.ts`（S17-E1-U4 已实现），运行验证
**S2**: 生成 `docs/mcp-tools/INDEX.md`，7 tools 表格（name/description/input schema）
**S3**: 将 S17-E1-U3 的独立 `/health` 端点集成到 MCP stdio 主进程生命周期

- 实施成本：**低**（0.5 人天，有现成实现）
- 风险：**低**（已有独立实现，仅需串联）
- 回滚计划：独立 HTTP 服务可独立运行，降级使用

---

## 执行依赖

- [ ] 需要修改的文件: `packages/mcp-server/src/index.ts`（health endpoint 集成）, `docs/mcp-tools/INDEX.md`（生成）, `scripts/generate-tool-index.ts`（运行验证）
- [ ] 前置依赖: S16-P2-2 MCP Tool Governance 文档（S17-E1-U3 已实现 /health，S17-E1-U4 已实现 generate-tool-index.ts）
- [ ] 需要权限: 无
- [ ] 预计工时: 0.5 人天
- [ ] 测试验证命令: `node scripts/generate-tool-index.ts && cat docs/mcp-tools/INDEX.md`

---

### P004: 撤销/重做 UI 集成与快捷键绑定

**问题描述**:

S34-P001 实现了撤销/重做系统（Command Pattern + Zustand + 50步限制），S35-P001 补充了 localStorage 持久化（DDSCanvasPage 调用 loadHistoryFromStorage/saveHistoryToStorage）。

但 UI 集成不完整：
1. 快捷键绑定未实现（S32-E2 中 ShortcutEditModal 已实现，但撤销/重做快捷键 `Ctrl+Z`/`Ctrl+Y` 为 placeholder stub）
2. Toolbar 可能缺少撤销/重做按钮

**影响范围**: Canvas 画布，所有卡片编辑操作

**验收标准**:
- [ ] `Ctrl+Z` 撤销上一操作（50步限制）
- [ ] `Ctrl+Y` 或 `Ctrl+Shift+Z` 重做（50步限制）
- [ ] Toolbar 显示撤销/重做按钮（可点击状态 vs disabled 状态）
- [ ] localStorage 刷新后历史不丢失

---

## 根因分析

### 根因
撤销/重做功能实现了后端逻辑（store + middleware），但前端 UI 集成缺失。快捷键 Stub 存在但未连接到真实 store，Toolbar 未添加按钮。

### 证据
- S34-P001 提交: `0a02febcf`, `c2e4942d0` — canvasHistoryStore execute/undo/redo/clear/canUndo/canRedo
- S35-P001 提交: `6452d2f1c` — DDSCanvasPage loadHistoryFromStorage/saveHistoryToStorage
- S32-E2-S3 描述: "Ctrl+Z/Ctrl+Y → placeholder stub"（未连接真实 store）

---

## 建议方案

### 方案 A（推荐）：UI 集成（1-2 人天）

**S1**: `useKeyboardShortcuts` hook 连接 `canvasHistoryStore`
- `Ctrl+Z` → `canvasHistoryStore.undo()`（guard: `canUndo()` 时才触发）
- `Ctrl+Y` / `Ctrl+Shift+Z` → `canvasHistoryStore.redo()`

**S2**: `DDSToolbar.tsx` 添加 Undo/Redo 按钮
- 使用 `useDDSCanvasFlow` 返回 `canUndo`/`canRedo` 状态
- disabled 状态按钮样式

- 实施成本：**低**（1-2 人天）
- 风险：**低**（store API 已就绪，仅 UI 集成）
- 回滚计划：快捷键可通过 ShortcutEditModal 自定义，Toolbar 按钮不影响核心功能

---

## 执行依赖

- [ ] 需要修改的文件: `vibex-fronted/src/hooks/dds/useKeyboardShortcuts.ts`（连接 undo/redo）, `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`（添加按钮）
- [ ] 前置依赖: `canvasHistoryStore` 已实现（S34-P001），`DDSCanvasPage` 调用已添加（S35-P001）
- [ ] 需要权限: 无
- [ ] 预计工时: 1-2 人天
- [ ] 测试验证命令: `pnpm test:e2e -- tests/e2e/keyboard-shortcuts.spec.ts`（需补充 Ctrl+Z/Ctrl+Y 测试用例）

---

### P005: AI Design Review E2E 闭环验证

**问题描述**:

S16-P0-1 实现了 Design Review UI（ReviewReportPanel + Ctrl+Shift+R 快捷键），S16-P2-2 交付了 MCP tool governance 文档。但 Design Review MCP 集成存在 DoD gaps，且 E2E 测试闭环未完成。

S24-P003 中 `design-review.spec.ts` 覆盖了 Toolbar 按钮、快捷键、3 tabs、关闭按钮，但未覆盖真实 AI 评审流程（实际调用 MCP tool 而非 mock）。

**影响范围**: Design Review 面板，AI Agent 集成

**验收标准**:
- [ ] Ctrl+Shift+R 触发真实 MCP `review_design` 调用（生产路径，非 mock）
- [ ] E2E 测试验证评审结果正确渲染（compliance/a11y/reuse 三 tab）
- [ ] 无 AI provider 时优雅降级（显示"AI 评审暂时不可用"）
- [ ] 评审结果数据属性完整（data-testid 覆盖）

---

## 根因分析

### 根因
Design Review 功能实现了 UI 层和 MCP tool 层，但两者之间的端到端集成验证缺失。E2E 测试覆盖了 UI 交互，但未覆盖真实 API 调用路径，导致生产路径可能存在问题。

### 证据
- S16-P0-1: ReviewReportPanel 已实现（glassmorphism overlay + 3 tabs + severity/priority badges）
- S16-P2-2: `review_design` MCP tool 已注册到 `list.ts` + `execute.ts`
- S24-P003: `design-review.spec.ts` 7 tests 覆盖 UI 交互，未覆盖真实 API 调用
- `packages/mcp-server/src/tools/reviewDesign.ts` 已实现

---

## 建议方案

### 方案 A（推荐）：E2E 闭环 + 降级路径（1-2 人天）

**S1**: 新增 `design-review-mcp.spec.ts` E2E 测试
- 真实调用 `/api/mcp/review_design` 端点（S16-P2-2 已实现）
- 验证 response 格式（compliance/a11y/reuse 三段）
- 验证降级路径（MCP bridge fallback）

**S2**: ReviewReportPanel 降级 UI
- MCP server 不可达时显示"AI 评审暂时不可用"（已有 error state，但需确认触发路径）

**S3**: 确认 data-testid 完整覆盖
- `design-review-btn`（Toolbar 按钮）
- `review-report-panel`（Panel 容器）
- `review-tab-{compliance|accessibility|reuse}`（Tab 切换）

- 实施成本：**低**（1-2 人天，有完整实现）
- 风险：**低**（已有实现，仅补全测试和降级路径）
- 回滚计划：降级路径已有 error state UI

---

## 执行依赖

- [ ] 需要修改的文件: `vibex-fronted/tests/e2e/design-review-mcp.spec.ts`（新增 E2E 测试）, `vibex-fronted/src/components/dds/canvas/ReviewReportPanel.tsx`（确认降级 UI）
- [ ] 前置依赖: `packages/mcp-server/src/tools/reviewDesign.ts`（MCP tool 已实现）, S16-P0-1 Design Review UI 已交付
- [ ] 需要权限: MCP server 运行时（`pnpm --filter mcp-server dev`）
- [ ] 预计工时: 1-2 人天
- [ ] 测试验证命令: `pnpm test:e2e -- tests/e2e/design-review-mcp.spec.ts`

---

## 3. 相关文件

- 设计文档: `/root/.openclaw/vibex/docs/vibex-proposals-sprint35/collaboration-research.md`（P001 参考）
- 设计文档: `/root/.openclaw/vibex/docs/vibex-proposals-sprint35/template-market-research.md`（P002 参考）
- 设计文档: `/root/.openclaw/vibex/docs/vibex-proposals-sprint16/mcp-tool-governance.md`（P003 参考）
- 实施计划: `/root/.openclaw/vibex/CHANGELOG.md`（S34-P001, S35-P001 撤销重做）
- 实施计划: `/root/.openclaw/vibex/CHANGELOG.md`（S16-P0-1 Design Review UI）

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint36
- **执行日期**: 2026-05-11
- **提交**: `/root/.openclaw/vibex/proposals/20260511/analyst.md`

---

## 提案优先级矩阵

| 提案 | 用户影响 | 技术可行性 | 资源投入 | 综合得分 | 建议 Sprint |
|------|----------|------------|----------|----------|-------------|
| P001 多人协作 MVP | 高 | 高（已有 Firebase） | 中（5-7 人天） | **9** | Sprint 36 |
| P002 模板市场 MVP | 高 | 高（已有 CRUD API） | 低（2-3 人天） | **8** | Sprint 36 |
| P003 MCP DoD 补全 | 中 | 高（已有独立实现） | 低（0.5 人天） | **7** | Sprint 36 |
| P004 撤销重做 UI | 中 | 高（已有 Store） | 低（1-2 人天） | **6** | Sprint 36 |
| P005 Design Review E2E | 中 | 中（需 MCP server） | 低（1-2 人天） | **5** | Sprint 36-37 |

---

## 风险矩阵

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Firebase RTDB 20 并发上限 | 高 | 低 | 监控并发数，超限后 graceful degradation |
| 模板市场 GitHub Gist API 限流 | 中 | 低 | 静态 JSON fallback |
| MCP /health 集成破坏 stdio 启动 | 高 | 低 | 独立健康检查进程，staging 验证 |
| 撤销/重做快捷键与浏览器冲突 | 低 | 低 | ShortcutEditModal 可自定义绑定 |
| AI Design Review 真实调用超时 | 中 | 中 | 30s 超时降级到 error state |

---

*本文档由 analyst agent 基于 Sprint 1-35 交付记录自动生成。*
*生成时间: 2026-05-11 19:50 GMT+8*