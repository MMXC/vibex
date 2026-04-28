# VibeX Sprint 16 功能提案 — Analyst 评审汇总

**Agent**: analyst
**日期**: 2026-04-28
**项目**: vibex-proposals-20260428-sprint16
**仓库**: /root/.openclaw/vibex
**分析视角**: 基于 Sprint 1-15 交付成果，识别下一批高优先级功能增强
**数据来源**: `CHANGELOG.md` (Sprint 1-15) + `proposals/20260425/analyst.md` (Sprint 9) + `docs/vibex-proposals-202604*/` 跨 Sprint 分析

---

## 执行摘要

从 Sprint 1 到 Sprint 15，VibeX 已交付核心功能闭环：

- **Canvas 系统**：三章节画布（requirement/context/flow）+ 5章节扩展（api/business-rules）+ React Flow 集成 + 本地持久化
- **AI 集成**：草稿生成 / 代码生成 / 设计评审（MCP）三大 AI 能力
- **交付中心**：DDL/PRD 生成 + 版本 Diff + 批量导出
- **协作基础设施**：Firebase Presence + WebSocket 冲突解决
- **质量基础设施**：CI TypeScript Gate / AST 安全扫描 / MCP 可观测性

**Sprint 16 定位**：*集成验证冲刺*。大量 MVP 功能已经完成但缺乏 UI 集成、端到端验证或真实场景测试。Sprint 16 的核心价值是把已验证的"零件"组装成用户可用的"产品"。

---

## 1. 提案列表

| ID | 类别 | 标题 | 关联 Sprint | 优先级 |
|----|------|------|-------------|--------|
| S16-P0-1 | feature | Design Review UI 集成 | Sprint 12 E9 | P0 |
| S16-P0-2 | improvement | Design-to-Code 双向同步验证 | Sprint 14 E1 | P0 |
| S16-P1-1 | feature | Firebase 协作生产验证 | Sprint 7/8 E2/E4 | P1 |
| S16-P1-2 | improvement | Code Generator 真实组件生成 | Sprint 12 E10 | P1 |
| S16-P2-1 | feature | Canvas 版本历史生产集成 | Sprint 5/6 E6 | P2 |
| S16-P2-2 | improvement | MCP Tool 治理与文档 | Sprint 12 E7 | P2 |

---

## 2. 提案详情

### S16-P0-1: Design Review UI 集成

**问题描述**

Sprint 12 E9 交付了 `review_design` MCP Tool，包含：
- `designCompliance.ts`：硬编码 hex/rgba 检测、间距 4px grid 校验
- `a11yChecker.ts`：WCAG 2.1 AA 检查（missing-alt/critical, missing-aria-label/medium, low-contrast/high）
- `componentReuse.ts`：结构相似度评分

40 个单元测试全通过。但**没有 UI**——用户无法在 VibeX 内部触发设计评审，只能通过 MCP 协议手动调用。这意味着：
1. 用户需要知道工具存在且如何调用
2. 评审结果不直接展示在 Canvas 上
3. 无法与 Design Token Service（E1-U2）联动

**影响范围**
- `/design/dds-canvas` 页面（DDSCanvasPage）
- MCP Server `review_design` tool
- `DesignTokenService`（Sprint 14 E1）

**根因分析**

Sprint 12 PRD 将 E9 定位为"后端工具"，只要求 MCP tool 注册成功、单元测试通过。UI 集成被当作"后续迭代"内容。但没有 UI 的设计评审工具，用户的实际使用路径是：
1. 用户在 Canvas 编辑设计
2. 用户需要切换到外部工具（如 Figma Lighthouse）运行评审
3. 用户手动修复问题

这个路径对 VibeX 用户没有价值。

**建议方案**

**方案 A（推荐）**：在 DDSToolbar 添加 Design Review 按钮
- 点击后：调用 `review_design` MCP tool，传入当前 Canvas 所有节点
- 结果展示：侧边滑出 ReviewReportPanel，显示三段评分（Compliance / Accessibility / Reuse）
- 联动设计 Token：review_design 结果中标注"建议使用 CSS Token"的位置，可一键修复
- 触发时机：手动按钮 + Ctrl+Shift+R 快捷键

实施成本：低（后端已就绪，只需前端 UI + MCP 调用）
风险：低（单元测试验证逻辑，前端只做展示）

**方案 B**：集成到 AIDraftDrawer 作为 Tab
- 复用现有 AIDraftDrawer，在 Tab 列表添加"设计评审"
- 缺点：语义不匹配（AIDraftDrawer 是草稿生成，Design Review 是质量检查）

**验收标准**
- [ ] DDSToolbar 有 Design Review 按钮（data-testid="design-review-btn"）
- [ ] 点击后调用 `review_design` MCP tool，返回结果正确展示
- [ ] ReviewReportPanel 显示 Compliance / Accessibility / Reuse 三段
- [ ] 无设计问题时显示"设计合规"状态
- [ ] 违反 WCAG AA 时高亮对应节点（点击高亮跳转）
- [ ] 单元测试覆盖 `ReviewReportPanel` 组件（≥10 tests）
- [ ] E2E 测试：`pnpm playwright test design-review.spec.ts` 全通过

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`, `vibex-fronted/src/components/dds/review/ReviewReportPanel.tsx`
- [ ] 前置依赖: Sprint 12 E9 `review_design` MCP tool（已就绪）
- [ ] 需要权限: MCP Server 连接配置
- [ ] 预计工时: 1.5d
- [ ] 测试验证命令: `pnpm playwright test design-review.spec.ts`

---

### S16-P0-2: Design-to-Code 双向同步验证

**问题描述**

Sprint 14 E1 交付了 Design-to-Code Pipeline，核心能力：
- `DesignTokenService.extractTokens()`：从 Figma 提取 Token（200 节点限制）
- `DriftDetector`：检测设计与代码的偏差 + 3-way merge
- `ConflictResolutionDialog`：三面板 Diff UI（本地/服务端/合并结果）
- `BatchExportService`：批量导出（queue + status）

但以下内容**未经验证**：
1. 真实 Figma 文件导入 → Token 提取 → 代码生成的完整链路
2. Drift Detection 在真实使用场景的准确性（误报率）
3. Batch Export 超过 20 个组件的并发导出稳定性

**影响范围**
- `/design/dds-canvas` 页面的 CodeGenPanel
- `packages/mcp-server` 的 DesignTokenService
- `BatchExportService`

**根因分析**

Sprint 14 E1 的验收标准是"单元测试通过 + tsc 无错误"，但缺少端到端场景测试。设计到代码的 pipeline 涉及多个服务串联（DesignTokenService → DriftDetector → CodeGenerator → BatchExport），任何一个环节在真实场景失败都会导致整个 pipeline 不可用。

**建议方案**

**方案 A（推荐）**：端到端验证套件
- 编写 E2E 测试覆盖完整 pipeline：`figma-import → token-extract → drift-detect → code-gen → batch-export`
- 使用真实 Figma API mock 数据验证 Token 提取准确性
- 测试 Drift Detection 在 3 种场景的准确性：代码被修改 / Token 被删除 / 双方都修改
- 使用 Playwright E2E 验证 ConflictResolutionDialog 三面板 Diff UI

**方案 B**：人工验证 + 报告
- Dev 手动走一遍完整流程，产出验证报告
- 缺点：无法持续回归验证，每次变更需要重新手动测试

**验收标准**
- [ ] E2E 测试覆盖完整 pipeline（figma-import → token → drift → code-gen → batch-export）
- [ ] Drift Detection 在 3 种冲突场景的准确性验证（误报率 < 10%）
- [ ] Batch Export 50 个组件并发导出稳定性测试（无内存泄漏）
- [ ] ConflictResolutionDialog 三面板 Diff UI 在真实冲突场景可正常使用
- [ ] `pnpm playwright test design-to-code-e2e.spec.ts` 全通过
- [ ] 验证报告存档：`docs/vibex-sprint16/design-to-code-verification.md`

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/tests/e2e/design-to-code-e2e.spec.ts`, `vibex-fronted/tests/e2e/conflict-resolution-e2e.spec.ts`
- [ ] 前置依赖: Sprint 14 E1 完整交付（E1-S1 ~ E1-S6 已完成）
- [ ] 需要权限: Figma API 测试 token（可用现有 mock 数据）
- [ ] 预计工时: 2d
- [ ] 测试验证命令: `pnpm playwright test design-to-code-e2e.spec.ts`

---

### S16-P1-1: Firebase 协作生产验证

**问题描述**

Firebase 实时协作从 Sprint 7 开始规划，Sprint 8 交付 MVP：
- E2-U1: Firebase REST API 零 SDK 依赖实现
- E2-U2: PresenceAvatars 四态 UI
- E4-S1~S4: Firebase 配置检查 + RTDB 写入 + PresenceAvatars 订阅 + DDSCanvasPage 集成

但**以下关键验证缺失**：
1. 冷启动性能（Firebase Admin SDK 在 Cloudflare Workers V8 isolate 的初始化时间）
2. 5 用户并发场景的 RTDB 延迟
3. SSE Bridge（Canvas SSE 事件与 Firebase Presence 的桥接）
4. ConflictBubble 与 Firebase 冲突解决的集成

Sprint 7/8 的 P002 Architect 评审报告从未产出。Sprint 9 analyst 提案明确指出这是"中高风险"项。

**影响范围**
- `/canvas` 页面实时协作
- `src/lib/firebase/presence.ts`
- Cloudflare Workers 冷启动性能

**根因分析**

Firebase on Cloudflare Workers 的核心问题：V8 isolate 是无状态、短生命周期的执行环境。Firebase Admin SDK 初始化涉及：
- TLS 握手（HTTPS 连接）
- JWT 验证（Firebase App Check 或 Service Account）
- RTDB 连接建立

在冷启动场景（Workers 从零启动），这个过程可能超过 3s 用户可接受阈值。但从未有人测量过真实数据。

**建议方案**

**方案 A（推荐）**：量化验证 + 条件激活
- Step 1：编写性能测试，测量 Firebase Admin SDK 在 CF Workers 的冷启动时间（目标 < 500ms）
- Step 2：5 用户并发 presence 更新延迟测试（目标 < 3s）
- Step 3：基于 Step 1/2 结果决定激活策略：
  - 冷启动 < 500ms → Firebase Presence 正常激活
  - 冷启动 500ms-2s → 延迟激活（首次操作时激活）
  - 冷启动 > 2s → 降级到轮询模式
- Step 4：SSE Bridge 集成测试（Canvas SSE 事件 ↔ Firebase Presence 同步）

**方案 B**：暂时搁置，等官方 CF + Firebase 集成方案
- 缺点：Firebase 协作功能将无限期推迟

**验收标准**
- [ ] Firebase 冷启动时间 < 500ms（量化报告）
- [ ] 5 用户并发 presence 更新延迟 < 3s
- [ ] ConflictBubble 在真实冲突场景正确触发
- [ ] 断线重连后 presence 状态正确恢复
- [ ] Firebase unconfigured 时 PresenceAvatars 不渲染（优雅降级）
- [ ] E2E 测试：`pnpm playwright test firebase-collab-e2e.spec.ts` 全通过
- [ ] 验证报告存档：`docs/vibex-sprint16/firebase-verification.md`

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/src/lib/firebase/presence.ts`, `vibex-fronted/tests/e2e/firebase-collab-e2e.spec.ts`
- [ ] 前置依赖: Sprint 8 E2/E4 Firebase MVP（已就绪，但未验证）
- [ ] 需要权限: Firebase 项目真实配置（非 mock）
- [ ] 预计工时: 2d
- [ ] 测试验证命令: `pnpm playwright test firebase-collab-e2e.spec.ts`

---

### S16-P1-2: Code Generator 真实组件生成

**问题描述**

Sprint 12 E10 交付了 Code Generator MVP：
- `codeGenerator.ts`：`generateComponentCode(flow, framework)` 生成 TSX 骨架 + CSS Module + TypeScript 类型定义
- `CodeGenPanel UI`：framework selector (React/Vue/Solid) + code preview tabs + download ZIP
- 25 个单元测试全通过

但生成的代码是**骨架占位符**，不是真实可用的组件：
1. 不读取 Canvas 节点的真实属性（只生成模板代码）
2. 不读取 Design Token（硬编码颜色值）
3. 不与 DesignTokenService 集成

**影响范围**
- `/design/dds-canvas` 页面的 CodeGenPanel
- `src/services/codegen/codeGenerator.ts`

**根因分析**

Sprint 12 PRD 将 E10 定位为"代码生成框架"，只要求能生成 TSX 文件和 ZIP 下载。真实组件生成被规划为后续迭代。但骨架代码生成对用户没有直接价值——用户期望的是"从 Canvas 节点一键生成可运行的 React 组件"。

**建议方案**

**方案 A（推荐）**：集成 Canvas 节点数据 + Design Token
- Step 1：读取 `DDSCanvasStore` 中当前 flow 的所有 `FlowStepCard` 节点，提取 `stepName/actor/pre/post` 属性
- Step 2：集成 `DesignTokenService`（Sprint 14 E1），使用 CSS 变量替代硬编码颜色
- Step 3：增强 `generateComponentCode()`，根据节点类型生成真实 Props + State
- Step 4：真实组件模板（基于 React/Vue 最佳实践）

**方案 B**：作为独立 feature，不影响当前 MVP
- 缺点：骨架代码生成无法满足用户期望，可能被废弃

**验收标准**
- [ ] CodeGenPanel 从 DDSCanvasStore 读取 flow 节点数据
- [ ] 生成的组件代码包含真实 Props（从 Canvas 节点推断类型）
- [ ] 生成的代码使用 CSS 变量（Design Token）
- [ ] CodeGenPanel 支持 framework selector（React/Vue/Solid）
- [ ] 生成的代码可复制粘贴到 VS Code 直接运行（无语法错误）
- [ ] 单元测试：`npx vitest run codeGenerator.test.ts` 全通过
- [ ] E2E 测试：`pnpm playwright test code-generator-e2e.spec.ts` 全通过

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/src/services/codegen/codeGenerator.ts`, `vibex-fronted/src/components/dds/canvas/CodeGenPanel.tsx`
- [ ] 前置依赖: Sprint 12 E10 codeGenerator.ts（已就绪）+ Sprint 14 E1 DesignTokenService（已就绪）
- [ ] 需要权限: 无
- [ ] 预计工时: 2d
- [ ] 测试验证命令: `pnpm playwright test code-generator-e2e.spec.ts`

---

### S16-P2-1: Canvas 版本历史生产集成

**问题描述**

Sprint 5/6 E6 交付了版本历史功能：
- `/health` 端点 P50/P95/P99 延迟
- Web Vitals 阈值监控（LCP>4000ms / CLS>0.1）
- `VersionHistoryPanel`：快照列表 + Diff 对比 + 恢复

但 Canvas 版本的版本历史存在以下问题：
1. `/project` 页面的 VersionHistoryPanel 需要 projectId，但初始化时可能为 null
2. 版本历史 Diff 对比功能在 Sprint 2 交付后无更新
3. 没有与 Canvas 的 Auto-save 集成（用户修改后自动创建快照）

**影响范围**
- `/project` 页面（VersionHistoryPanel）
- `useVersionHistory.ts` hook

**建议方案**

**方案 A（推荐）**：Canvas 自动快照集成
- Step 1：Canvas 页面添加 Auto-snapshot 逻辑（防抖：用户停止操作 30s 后自动创建快照）
- Step 2：修复 projectId=null 边界（已部分完成，需确认是否还有遗漏）
- Step 3：VersionHistoryPanel 与 Auto-snapshot 联动，显示"自动保存"vs"手动保存"标记

**方案 B**：人工触发快照
- 缺点：用户体验不如自动快照，但实现更简单

**验收标准**
- [ ] Canvas 编辑后 30s 自动创建快照（防抖）
- [ ] VersionHistoryPanel 区分"自动保存"和"手动保存"快照
- [ ] projectId=null 时引导 UI 正确显示
- [ ] 快照列表按时间倒序（最新在上）
- [ ] 快照恢复后 Canvas 正确显示历史内容
- [ ] E2E 测试：`pnpm playwright test version-history-e2e.spec.ts` 全通过

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/src/hooks/useVersionHistory.ts`, `vibex-fronted/src/components/project/VersionHistoryPanel.tsx`
- [ ] 前置依赖: Sprint 2 E2 版本历史 MVP（已就绪）
- [ ] 需要权限: 无
- [ ] 预计工时: 1.5d
- [ ] 测试验证命令: `pnpm playwright test version-history-e2e.spec.ts`

---

### S16-P2-2: MCP Tool 治理与文档

**问题描述**

Sprint 12 E7 交付了 MCP Server 可观测性：
- 动态版本读取（`package.json.version`）
- Structured Logging（JSON 格式 + 敏感数据脱敏）
- Health Check 端点

当前 MCP Server 注册了多个 tool：
- `review_design`（Sprint 12 E9）
- `figma_import`（Sprint 6 E1）
- `generate_code`（Sprint 12 E10）

但**没有 MCP Tool 文档**：
1. 外部 AI Agent 不知道有哪些 tool 可用、参数是什么
2. 没有 tool 调用示例
3. 没有 tool 版本管理（tool 变更时无法追踪）

**建议方案**

**方案 A（推荐）**：MCP Tool Registry 文档
- 创建 `docs/mcp-tools/` 目录，每个 tool 一个 `.md` 文件
- 每个文档包含：tool name、参数 schema、调用示例、返回格式
- 使用 MCP 协议内省接口自动生成文档索引

**验收标准**
- [ ] `docs/mcp-tools/review_design.md` 文档完整（参数/示例/返回格式）
- [ ] `docs/mcp-tools/figma_import.md` 文档完整
- [ ] `docs/mcp-tools/generate_code.md` 文档完整
- [ ] `docs/mcp-tools/INDEX.md` 索引页自动生成
- [ ] Health Check 端点返回完整 tool 列表

**执行依赖**
- [ ] 需要修改的文件: `docs/mcp-tools/` 目录新建
- [ ] 前置依赖: MCP Server 各 tool 已注册
- [ ] 需要权限: 无
- [ ] 预计工时: 1d
- [ ] 测试验证命令: `curl localhost:3100/health` 验证 tool 列表

---

## 3. 风险矩阵

| 提案 | 可能性 | 影响 | 综合风险 | 工时估算 |
|------|--------|------|----------|----------|
| S16-P0-1 Design Review UI | 低 | 高 | 🟢 低 | 1.5d |
| S16-P0-2 Design-to-Code 验证 | 中 | 高 | 🟡 中 | 2d |
| S16-P1-1 Firebase 生产验证 | 中 | 高 | 🟠 中高 | 2d |
| S16-P1-2 Code Generator 增强 | 中 | 中 | 🟡 中 | 2d |
| S16-P2-1 Canvas 版本历史集成 | 低 | 中 | 🟢 低 | 1.5d |
| S16-P2-2 MCP Tool 文档 | 低 | 低 | 🟢 低 | 1d |

---

## 4. Sprint 16 容量建议

| 提案 | 工时 | 优先级 | 批次 |
|------|------|--------|------|
| S16-P0-1 Design Review UI | 1.5d | 必选 | 第一批 |
| S16-P0-2 Design-to-Code 验证 | 2d | 必选 | 第一批 |
| S16-P1-1 Firebase 生产验证 | 2d | 建议 | 第二批 |
| S16-P1-2 Code Generator 增强 | 2d | 建议 | 第二批 |
| S16-P2-1 Canvas 版本历史 | 1.5d | 可选 | 第三批 |
| S16-P2-2 MCP Tool 文档 | 1d | 可选 | 第三批 |

**建议 Sprint 16 分两批交付**：
- **第一批（3.5d）**：S16-P0-1 + S16-P0-2 — 让现有 MVP 功能对用户可见可用
- **第二批（4d）**：S16-P1-1 + S16-P1-2 — 技术增强，视 Firebase 验证结论决定顺序

**总工时**：7.5-9.5d（基于 2 人 Sprint 容量）

---

## 5. 跨 Sprint 依赖追踪

以下功能在早期 Sprint 规划但一直未完成，需确认是否仍在范围内：

| 功能 | 原始 Sprint | 状态 | 建议 |
|------|------------|------|------|
| Analytics Dashboard Widget | Sprint 7/8/9 | ⚠️ 已部分完成（纯 SVG 图表）| Sprint 16 需验证 E2E |
| Teams API 前端集成 | Sprint 7/8/9 | ❌ 未开始 | 降级为 P2，下一 Sprint 再做 |
| Import/Export round-trip E2E | Sprint 7 | ⚠️ 未完成 | S16-P0-2 可顺带验证 |
| SSE Bridge Firebase | Sprint 8 | ❌ 未完成 | S16-P1-1 Firebase 验证时一并处理 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260428-sprint16
- **执行日期**: 2026-04-29（建议）
- **前置条件**: Sprint 15 收尾确认

*文档版本: v1.0 | 2026-04-28 | analyst*
