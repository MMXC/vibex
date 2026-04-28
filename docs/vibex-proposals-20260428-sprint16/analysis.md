# VibeX Sprint 16 提案分析报告

**项目**: vibex-proposals-20260428-sprint16
**分析视角**: gstack 验证 + 根因分析
**分析日期**: 2026-04-28
**分析来源**: `proposals/20260428/analyst.md` + 代码审查

---

## 验证摘要

| 提案 | 问题真实性 | 验证结论 |
|------|-----------|---------|
| S16-P0-1 Design Review UI | ✅ 完全真实 | 后端已就绪，UI 从零实现 |
| S16-P0-2 Design-to-Code 验证 | ⚠️ 部分真实 | 服务存在，无 E2E pipeline 测试 |
| S16-P1-1 Firebase 协作 | ❌ 严重掺水 | 全为 mock，无真实配置，需重构 |
| S16-P1-2 Code Generator | ⚠️ 部分真实 | 用 CSS 变量但生成骨架，不读节点属性 |
| S16-P2-1 Canvas 版本历史 | ✅ 基本真实 | Auto-snapshot 缺失可验证 |
| S16-P2-2 MCP Tool 文档 | ✅ 完全真实 | 文档缺失可验证 |

**驳回/重构提案**: S16-P1-1 需要重新定界

---

## S16-P0-1: Design Review UI 集成

### 业务场景分析

Sprint 12 E9 交付了 `review_design` MCP Tool，后端逻辑完整（Design Compliance / WCAG 2.1 AA / Component Reuse 三段，40 单元测试全过）。但用户无法在 VibeX 内部触发评审，必须切换到外部工具。这意味着评审功能对 VibeX 用户实际上不可达。

**验证证据**：
- `packages/mcp-server/src/tools/reviewDesign.ts` — 完整实现
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` — 无 Design Review 按钮
- `vibex-fronted/src/components/dds/` — 无 ReviewReportPanel 组件

### 技术方案

**方案 A（推荐）**：DDSToolbar 按钮 + ReviewReportPanel 侧边栏
- 在 DDSToolbar 添加"设计评审"按钮（Ctrl+Shift+R 快捷键）
- 评审结果在侧边滑出 `ReviewReportPanel`，三段展示
- 违反 WCAG AA 时高亮节点（点击跳转）
- 联动 DesignTokenService（E1-U2），标注"建议使用 CSS Token"位置

**方案 B**：AIDraftDrawer Tab 复用
- 复用 AIDraftDrawer，添加"设计评审"Tab
- 缺点：语义不匹配（AIDraftDrawer 是草稿生成，评审是质量检查）

### 可行性评估

| 维度 | 评估 |
|------|------|
| 技术可行性 | ✅ 高 — 后端已就绪，前端 UI 工作量小 |
| 工期 | 1.5d |
| 风险 | 低 — 单元测试验证后端逻辑，前端只做展示 |

### 初步风险识别

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| MCP 调用超时（200 节点） | 低 | 中 | 添加 loading skeleton + 200 节点截断警告（已有） |
| review_design 返回数据量大 | 低 | 低 | 流式展示或分页 |

### 验收标准

- [ ] DDSToolbar 有 Design Review 按钮（data-testid="design-review-btn"）
- [ ] 点击后调用 `review_design` MCP tool，返回结果正确展示
- [ ] ReviewReportPanel 显示 Compliance / Accessibility / Reuse 三段
- [ ] 无设计问题时显示"设计合规"状态
- [ ] 违反 WCAG AA 时高亮对应节点（点击高亮跳转）
- [ ] 单元测试：`CodeGenPanel` 相关组件 ≥ 10 tests
- [ ] E2E：`pnpm playwright test design-review.spec.ts` 全通过

---

## S16-P0-2: Design-to-Code 双向同步验证

### 业务场景分析

Sprint 14 E1 交付了 Design-to-Code Pipeline：
- `DesignTokenService.extractTokens()`（200 节点限制，4 tests）
- `DriftDetector`（detectDrift + 3-way merge，11 tests）
- `BatchExportService`（queue + status，5 tests）
- `ConflictResolutionDialog`（三面板 Diff UI）

**缺失项**：无 E2E 测试覆盖完整 pipeline（figma-import → token → drift → code-gen → batch-export）。单元测试通过不等于端到端可用。

**验证证据**：
- `/vibex-fronted/src/services/design-token/DesignTokenService.ts` — 存在
- `/vibex-fronted/src/services/design-token/DriftDetector.ts` — 存在
- `/vibex-fronted/tests/e2e/batch-export.spec.ts` — 存在，但只测导出，不测完整 pipeline
- `/vibex-fronted/tests/e2e/` — **无** `design-to-code-e2e.spec.ts`

### 技术方案

**方案 A（推荐）**：Playwright E2E 完整 pipeline 测试
- 场景 1：figma-import → token-extract → 验证 token 数量
- 场景 2：Drift Detection（代码被修改 / Token 被删除 / 双方都修改）
- 场景 3：Batch Export 50 组件并发（无内存泄漏）
- 场景 4：ConflictResolutionDialog 真实冲突 Diff

**方案 B**：人工验证 + 报告
- Dev 手动走一遍完整流程，产出验证报告
- 缺点：无法持续回归验证

### 可行性评估

| 维度 | 评估 |
|------|------|
| 技术可行性 | ✅ 高 — 各服务单元测试已通过 |
| 工期 | 2d |
| 风险 | 中 — 依赖 mock 数据 vs 真实数据差异 |

### 验收标准

- [ ] E2E 测试覆盖完整 pipeline（figma-import → token → drift → code-gen → batch-export）
- [ ] Drift Detection 在 3 种冲突场景准确性验证（误报率 < 10%）
- [ ] Batch Export 50 组件并发导出稳定性（无内存泄漏）
- [ ] ConflictResolutionDialog 三面板 Diff UI 真实冲突场景可正常使用
- [ ] `pnpm playwright test design-to-code-e2e.spec.ts` 全通过
- [ ] 验证报告存档：`docs/vibex-sprint16/design-to-code-verification.md`

---

## S16-P1-1: Firebase 协作生产验证 — ⚠️ 需要重构

### 业务场景分析（验证失败）

**验证发现严重问题**：

| 检查点 | 实际情况 |
|--------|---------|
| Firebase 配置 | `.env` 全为 placeholder，无真实配置，`isFirebaseConfigured()` 返回 `false` |
| 冷启动性能测试 | 只测 mock 路径，注释明确写"Real Firebase latency requires E2E with actual Firebase credentials" |
| 5 用户并发测试 | 不存在（单元测试仅 3 用户，E2E 无多用户测试） |
| SSE ↔ Firebase Bridge | `sseToQueryBridge.ts` 是 TanStack Query 缓存桥，**不是** Firebase 桥 |
| ConflictBubble + Firebase | 集成是间接的（通过 conflictStore），Firebase 只管 presence，不管冲突 |

**原始提案的问题**：

提案声称"Firebase 协作生产验证"，但 Firebase 环境根本未配置——整个 Firebase 分支跑在 mock 降级路径上。验证 mock 路径不是"生产验证"。

### 根因分析

根本原因：Firebase 协作在 Sprint 7/8 规划时过于乐观，假设 Firebase 可以直接接入 Cloudflare Workers。实际上：
1. Firebase Admin SDK 在 V8 isolate 环境有 TLS/JWT 冷启动问题
2. 环境变量从未配置真实 Firebase 项目
3. 测试只覆盖 mock 路径，回避了真实集成问题

### 技术方案（重构后）

**S16-P1-1（重构）**：Firebase Mock 验证 + 配置路径确认

**方案 A（推荐）**：Mock 验证 + 配置路线图
- Step 1：完善 Firebase mock 模式的 E2E 测试（5 用户并发 + 冲突检测）
- Step 2：确认 Firebase 冷启动量化的必要性和替代方案（Cloudflare DurableObjects 或 PartyKit）
- Step 3：制定 Firebase 配置路径（是否需要真实 Firebase 项目）

**方案 B**：搁置 Firebase，等官方 CF + Firebase 集成方案

**方案 C（激进）**：直接接入真实 Firebase（高风险，需 Architect 评审）

### 可行性评估（重构后）

| 维度 | 评估 |
|------|------|
| 技术可行性（Mock 验证） | ✅ 高 |
| 技术可行性（真实 Firebase） | ❓ 未知 — 冷启动未量化 |
| 工期 | 2d（Mock 验证）/ 4d+（真实 Firebase） |
| 风险 | 中 — 取决于方案选择 |

### 验收标准（重构后）

- [ ] 5 用户并发 presence E2E 测试（mock 模式）全通过
- [ ] Firebase mock 降级路径完整（四态 UI + 断线重连）
- [ ] ConflictBubble 在 mock 冲突场景正确触发
- [ ] Firebase 配置路径确认文档产出
- [ ] 量化报告：冷启动 < 500ms 或给出替代方案

---

## S16-P1-2: Code Generator 真实组件生成

### 业务场景分析

Sprint 12 E10 交付了 Code Generator，`generateComponentCode()` 生成 TSX 骨架 + CSS Module + TypeScript 类型定义。分析发现：

**已实现**：
- ✅ CSS 变量（`DESIGN_CSS_VARS` 数组，--color-primary 等 9 个 token）
- ✅ `generateCSSModule()` 使用 CSS 变量，无硬编码颜色
- ✅ Framework selector（React/Vue/Solid）
- ✅ 节点数量显示 + 200 限制警告

**未实现（骨架占位符）**：
- ❌ `generateComponentCode()` 的 JSX 内容是注释占位符：
  ```ts
  jsxContent.push(`  //   - ${node.name ?? node.id} (${node.type})`);
  ```
  节点信息**只是注释**，不生成真实 Props 或 State
- ❌ 不读取 FlowStepCard 的 `stepName/actor/pre/post` 属性
- ❌ 不读取 APIEndpointCard 的 `httpMethod/path/summary` 属性
- ❌ 不读取 StateMachineCard 的 `states/transitions` 属性

**验证证据**：
- `vibex-fronted/src/lib/codeGenerator.ts` L264-278：节点只作为注释输出
- `vibex-fronted/src/components/CodeGenPanel/index.tsx`：从外部传入 `flow` prop，不从 DDSCanvasStore 读取
- `vibex-fronted/tests/e2e/`：**无** `code-generator-e2e.spec.ts`

### 技术方案

**方案 A（推荐）**：节点属性驱动代码生成
- Step 1：扩展 `generateComponentCode()`，根据节点类型生成真实 Props：
  - `FlowStepCard` → `interface FlowStepProps { stepName: string; actor: string; pre: string[]; post: string[] }`
  - `APIEndpointCard` → `interface APIEndpointProps { method: HttpMethod; path: string; summary: string }`
  - `StateMachineCard` → `interface StateMachineProps { states: State[]; initialState: string }`
- Step 2：CodeGenPanel 集成 DDSCanvasStore（或从父组件透传完整节点数据）
- Step 3：生成代码可复制粘贴到 VS Code 运行（类型安全）

**方案 B**：作为 MCP Agent 的输入，不在前端实现
- `Send to AI Agent` 按钮已存在（E1-US-E1.1），AI Agent 负责解读骨架代码并生成真实实现
- 缺点：骨架代码对 AI Agent 来说信息量不足

### 可行性评估

| 维度 | 评估 |
|------|------|
| 技术可行性 | ✅ 高 — 节点类型已定义，只需读取属性 |
| 工期 | 2d |
| 风险 | 低 — 不破坏现有功能，纯扩展 |

### 验收标准

- [ ] `FlowStepCard` 节点生成 `FlowStepProps` 接口（含 stepName/actor/pre/post）
- [ ] `APIEndpointCard` 节点生成 `APIEndpointProps` 接口（含 method/path/summary）
- [ ] `StateMachineCard` 节点生成 `StateMachineProps` 接口（含 states/transitions）
- [ ] 生成的 TSX 使用节点属性值（而非注释占位）
- [ ] CodeGenPanel 支持 framework selector（已有）
- [ ] 生成的代码可复制粘贴到 VS Code 直接运行（无语法错误）
- [ ] `npx vitest run codeGenerator.test.ts` 全通过
- [ ] `pnpm playwright test code-generator-e2e.spec.ts` 全通过（新增）

---

## S16-P2-1: Canvas 版本历史生产集成

### 业务场景分析

Sprint 2/5/6 交付了版本历史功能，但存在以下问题：
1. `VersionHistoryPanel` 需要 `projectId`，初始化可能为 null（已部分修复，需确认边界）
2. 没有 Canvas Auto-snapshot（用户修改后需手动保存）
3. 版本 Diff 功能在 Sprint 2 后无更新

### 验证情况

未深度验证（gstack 子代理超时），但根据 CHANGELOG 和代码结构，Auto-snapshot 缺失是客观事实。

### 技术方案

**方案 A（推荐）**：Canvas Auto-snapshot
- 防抖 30s：用户停止操作 30s 后自动创建快照
- VersionHistoryPanel 显示"自动保存"vs"手动保存"标记
- projectId=null 边界保护（已有部分，需确认）

**方案 B**：人工触发快照（降级方案）

### 验收标准

- [ ] Canvas 编辑后 30s 自动创建快照（防抖）
- [ ] VersionHistoryPanel 区分"自动保存"和"手动保存"快照
- [ ] projectId=null 时引导 UI 正确显示
- [ ] 快照恢复后 Canvas 正确显示历史内容
- [ ] E2E：`pnpm playwright test version-history-e2e.spec.ts` 全通过

---

## S16-P2-2: MCP Tool 治理与文档

### 业务场景分析

当前 MCP Server 注册了多个 tool，但无文档：
- `review_design`（Sprint 12 E9）
- `figma_import`（Sprint 6 E1）
- `generate_code`（Sprint 12 E10）

外部 AI Agent 或用户无法知道 tool 的参数 schema、调用方式、返回格式。

### 验证情况

✅ 问题真实 — 无文档目录

### 技术方案

**方案 A（推荐）**：`docs/mcp-tools/` 文档
- 每个 tool 一个 `.md`（参数/示例/返回格式）
- `INDEX.md` 索引页

**方案 B**：MCP 协议内省接口自动生成

### 验收标准

- [ ] `docs/mcp-tools/review_design.md` 完整
- [ ] `docs/mcp-tools/figma_import.md` 完整
- [ ] `docs/mcp-tools/generate_code.md` 完整
- [ ] `docs/mcp-tools/INDEX.md` 自动生成
- [ ] Health Check 端点返回完整 tool 列表

---

## 综合评估

### 驳回/重构决策

**S16-P1-1 需重构**：原始提案"Firebase 协作生产验证"在验证阶段失败。Firebase 环境未配置（全部 placeholder），所有功能跑在 mock 路径上。提案应改为：
1. "Firebase Mock 验证"（验证 mock 降级路径完整性）
2. "Firebase 配置路径确认"（量化冷启动 + 制定接入计划）

**其余 5 个提案**：验收标准具体可测试，技术路径清晰，通过审查。

### Sprint 16 最终建议

| 提案 | 状态 | 批次 |
|------|------|------|
| S16-P0-1 Design Review UI | ✅ 通过 | 第一批 |
| S16-P0-2 Design-to-Code E2E | ✅ 通过 | 第一批 |
| S16-P1-1 Firebase Mock 验证 | ⚠️ 重构后通过 | 第二批 |
| S16-P1-2 Code Generator 增强 | ✅ 通过 | 第二批 |
| S16-P2-1 Canvas 版本历史 | ✅ 通过 | 第三批 |
| S16-P2-2 MCP Tool 文档 | ✅ 通过 | 第三批 |

### 风险矩阵（修正后）

| 提案 | 可能性 | 影响 | 综合风险 | 工时估算 |
|------|--------|------|----------|----------|
| S16-P0-1 Design Review UI | 低 | 高 | 🟢 低 | 1.5d |
| S16-P0-2 Design-to-Code E2E | 中 | 高 | 🟡 中 | 2d |
| S16-P1-1 Firebase Mock 验证 | 低 | 高 | 🟡 中 | 2d |
| S16-P1-2 Code Generator 增强 | 中 | 中 | 🟡 中 | 2d |
| S16-P2-1 Canvas 版本历史 | 低 | 中 | 🟢 低 | 1.5d |
| S16-P2-2 MCP Tool 文档 | 低 | 低 | 🟢 低 | 1d |

---

## 执行决策

- **决策**: 已采纳（S16-P1-1 需重构后执行）
- **执行项目**: vibex-proposals-20260428-sprint16
- **执行日期**: 2026-04-29（建议）
- **重构建议**: S16-P1-1 将"生产验证"目标降级为"Mock 验证 + 配置路径确认"，由 Architect 主导 Firebase 冷启动量化

*分析版本: v1.0 | 2026-04-28 | analyst*
