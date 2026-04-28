# VibeX Sprint 17 功能提案分析 — Analyst

**Agent**: analyst
**日期**: 2026-04-29
**项目**: vibex-proposals-20260428-sprint17
**仓库**: /root/.openclaw/vibex
**分析视角**: 基于 Sprint 1-16 交付成果 + gstack 验证，识别 Sprint 17 高优先级功能增强

---

## 执行摘要

Sprint 16 完成 6 个提案（P0-P2-2），全部已合入 main。Sprint 17 的核心定位是：**收尾 + 深化**。前 16 个 Sprint 大量功能完成了"能用"，但缺乏"好用"和"验证完"的环节。Sprint 17 的首要任务不是新功能，而是把已有功能变成真实可用的产品。

**结论**：推荐 **5 个提案**，其中 P0 优先补全 E2E 覆盖率缺口，P1 处理 MCP 工具治理收尾，P2/P3/P4 为技术深化。

---

## 1. 验证结论（gstack 验证）

### 1.1 Sprint 16 交付验证

| 提案 | 提交 SHA | 代码状态 | E2E 状态 |
|------|----------|----------|----------|
| S16-P0-1 Design Review UI | `1e56cac17` | ✅ DDSToolbar + ReviewReportPanel + Ctrl+Shift+R | ⚠️ spec 存在，未验证生产路径 |
| S16-P0-2 Design-to-Code Sync | `8ea6fbee1` | ✅ ConflictResolutionDialog + driftDetector + batchExporter | ✅ 6 E2E tests |
| S16-P1-1 Firebase Mock | `712d23854` | ✅ useFirebase + ConflictBubble | ⚠️ mock 模式，真实 Firebase 未测 |
| S16-P1-2 Code Gen Real Props | `5afccdc7f` | ✅ FlowStepCard + types | ❌ **code-generator-e2e.spec.ts 缺失** |
| S16-P2-1 Version History | `b9c63cc4a` | ✅ auto-snapshot + VersionHistoryPanel | ✅ 7 E2E tests |
| S16-P2-2 MCP Docs | `9e09edfea` | ⚠️ 5 docs，但 **INDEX.md 缺失** | ❌ 缺 generate-tool-index.ts + /health |

### 1.2 技术栈验证

| 检查项 | 状态 | 风险 |
|--------|------|------|
| TypeScript strict 模式 | ✅ strict + strictNullChecks 开启 | 低 |
| noUncheckedIndexedAccess | ❌ 未配置 | 中（数组访问无下标检查） |
| CI TypeScript Gate | ✅ 存在于 `.github/workflows/test.yml`（root 目录，非 vibex-fronted/） | 低 |
| package.json engines | ❌ 未锁定 node/pnpm 版本 | 高 |
| E2E 测试数量 | ✅ 79 个 spec 文件 | 低 |
| MCP Tool INDEX.md | ❌ 已交付 5 docs，INDEX.md + auto-gen script 未完成 | 中 |
| code-generator-e2e.spec.ts | ❌ 缺失（S16-P1-2 验收标准要求） | 中 |

### 1.3 E2E 覆盖率缺口分析

Sprint 16 产出的 E2E 测试（已确认存在）：

```
design-review.spec.ts          ✅ 存在
design-to-code-e2e.spec.ts      ✅ 存在（6 tests）
firebase-presence.spec.ts       ✅ 存在（5 tests）
version-history-e2e.spec.ts     ✅ 存在（7 tests）
code-generator-e2e.spec.ts      ❌ 缺失
```

**根因**：S16-P1-2 的验收标准明确要求 `pnpm playwright test code-generator-e2e.spec.ts` 全通过，但该文件从未创建。design-to-code-e2e.spec.ts 覆盖了 ConflictResolutionDialog 三面板 Diff，未覆盖 CodeGenPanel 真实组件生成逻辑。

---

## 2. Sprint 17 提案列表

| ID | 类别 | 标题 | 验收标准 | 优先级 | 工时 |
|----|------|------|----------|--------|------|
| S17-P0-1 | verification | E2E 覆盖率补全 | code-gen E2E + MCP index 生成 | P0 | 2d |
| S17-P1-1 | improvement | MCP Tool Registry 收尾 | /health 返回 tool 列表 + INDEX.md | P1 | 1d |
| S17-P1-2 | improvement | Firebase 真实集成验证 | 5 用户并发延迟 < 3s | P1 | 2d |
| S17-P2-1 | tech-debt | TypeScript noUncheckedIndexedAccess | 高风险数组访问全部修复 | P2 | 2d |
| S17-P2-2 | feature | Analytics Dashboard E2E 验证 | FunnelWidget + useFunnelQuery E2E | P2 | 1.5d |

---

## 3. 提案详情

### S17-P0-1: E2E 覆盖率补全

**问题描述**

S16-P1-2 的验收标准要求 `code-generator-e2e.spec.ts` 全通过，但该文件从未创建。同时，S16-P0-1 的 design-review.spec.ts 存在但未在生产环境验证（mock 模式运行）。两个缺失导致 Sprint 16 的 P0/P1 交付没有完整的 E2E 回归保护。

**影响范围**
- `vibex-fronted/tests/e2e/code-generator-e2e.spec.ts`（新建）
- `vibex-fronted/tests/e2e/design-review.spec.ts`（补充生产路径测试）

**根因分析**

Sprint 16 冲刺阶段为按时交付省略了 E2E 补全。code-generator-e2e 的优先级被排在 CodeGenPanel UI 实现之后，但 E2E 缺失意味着 CodeGenPanel 的真实组件生成能力无法持续回归验证。

**建议方案**

**方案 A（推荐）**：补全缺失 E2E + 标记 tech debt

- Step 1：创建 `code-generator-e2e.spec.ts`，覆盖：
  - CodeGenPanel 从 DDSCanvasStore 读取 flow 节点数据（真实 props）
  - 生成的 TSX 代码包含 `stepName`/`actor`/`pre`/`post` 等真实属性
  - Framework selector（React/Vue/Solid）切换生成不同代码
  - CSS 变量替代硬编码颜色
  - 生成的代码无语法错误（Playwright 断言）
- Step 2：补充 `design-review.spec.ts` 生产路径测试：
  - Ctrl+Shift+R 快捷键触发 review
  - ReviewReportPanel 加载态/结果态/空态
  - WCAG 违规节点高亮跳转

**验收标准**
- [ ] `pnpm playwright test code-generator-e2e.spec.ts` 全通过（≥5 tests）
- [ ] `pnpm playwright test design-review.spec.ts` 全通过（当前 + 新增 ≥3 tests）
- [ ] E2E 测试覆盖 CodeGenPanel 真实组件生成逻辑（FlowStepCard props → TSX 输出）
- [ ] E2E 测试覆盖 Design Review 快捷键 + ReportPanel 状态

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/tests/e2e/code-generator-e2e.spec.ts`（新建）
- [ ] 前置依赖: S16-P1-2 code generator 组件生成（已就绪）
- [ ] 需要权限: 无
- [ ] 预计工时: 2d
- [ ] 测试验证命令: `pnpm playwright test code-generator-e2e.spec.ts design-review.spec.ts`

---

### S17-P1-1: MCP Tool Registry 收尾

**问题描述**

S16-P2-2 交付了 5 个 MCP 工具文档（review_design / figma_import / generate_code / ERROR_HANDLING_POLICY / MCP_TOOL_GOVERNANCE），但 S16-P2-2 验收标准中的以下两项**未完成**：

1. `docs/mcp-tools/INDEX.md` 自动生成索引
2. `generate-tool-index.ts` 自动生成脚本
3. `GET /health` 端点返回完整 tool 列表（`index.ts` 中未实现）

Sprint 16 的 DoD gaps 明确记录了这些缺失项。

**影响范围**
- `packages/mcp-server/src/index.ts`（GET /health tool 列表）
- `scripts/generate-tool-index.ts`（新建）
- `docs/mcp-tools/INDEX.md`（新建）

**根因分析**

S16-P2-2 的 3 个 DoD gaps 属于"最后一公里"问题——所有工具文档已就绪，但自动化脚本和 API 端点被遗忘在提交前。这导致外部 AI Agent 无法自动发现可用工具。

**建议方案**

**方案 A（推荐）**：完成 DoD gaps

- Step 1：`packages/mcp-server/src/index.ts` 添加 GET /health 端点，返回 `tools[]` 字段
- Step 2：创建 `scripts/generate-tool-index.ts`，读取 `docs/mcp-tools/*.md`，提取 name/description，生成 INDEX.md
- Step 3：运行脚本生成 `docs/mcp-tools/INDEX.md`

**验收标准**
- [ ] `curl localhost:3100/health` 返回 `tools[]` 数组（含 name/description）
- [ ] `docs/mcp-tools/INDEX.md` 自动生成，包含所有 tool 索引
- [ ] `scripts/generate-tool-index.ts` 可独立运行

**执行依赖**
- [ ] 需要修改的文件: `packages/mcp-server/src/index.ts`, `scripts/generate-tool-index.ts`
- [ ] 前置依赖: S16-P2-2 MCP 工具文档（5 docs 已就绪）
- [ ] 需要权限: 无
- [ ] 预计工时: 1d
- [ ] 测试验证命令: `curl localhost:3100/health && node scripts/generate-tool-index.ts`

---

### S17-P1-2: Firebase 真实集成验证

**问题描述**

S16-P1-1 交付了 Firebase Mock（useFirebase hook + ConflictBubble），但**从未在真实 Firebase 配置下验证**。当前状态：
- `useFirebase` 的 `connect()` 调用 mock
- `isFirebaseConfigured()` guard 在未配置时返回 false，PresenceAvatars 不渲染
- 5 用户并发延迟未知
- Cold start 时间未测量

Sprint 9 的 analyst 提案已将 Firebase 生产验证标记为"中高风险"，但一直没有执行。

**影响范围**
- `vibex-fronted/src/lib/firebase/presence.ts`
- `vibex-fronted/src/hooks/useFirebase.ts`

**根因分析**

Firebase 真实集成验证需要 Firebase 项目配置，而测试环境可能缺乏真实凭证。但 mock 的 Firebase 永远无法验证 CF Workers 冷启动性能和真实 RTDB 延迟。

**建议方案**

**方案 A（推荐）**：量化验证 + 条件激活

- Step 1：编写性能基准测试（使用 Firebase Emulator 或 Jest mock 精确测量）：
  - Firebase Admin SDK 初始化时间（目标 < 500ms）
  - setPresence() 延迟（目标 < 3s for 5 users）
- Step 2：基于测量结果决定激活策略：
  - 冷启动 < 500ms → 正常激活 Firebase Presence
  - 冷启动 500ms-2s → 延迟激活（首次操作时）
  - 冷启动 > 2s → 降级到 polling 模式
- Step 3：添加 Firebase Emulator 支持，便于本地开发测试

**验收标准**
- [ ] Firebase 冷启动时间量化报告（benchmark）
- [ ] 5 用户并发 presence 更新延迟 < 3s
- [ ] `isFirebaseConfigured() === false` 时 PresenceAvatars 不渲染（已验证）
- [ ] 降级策略在 mock 和真实环境均可触发
- [ ] `pnpm playwright test firebase-presence.spec.ts` 全通过

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/src/lib/firebase/presence.ts`, `vibex-fronted/tests/benchmarks/`
- [ ] 前置依赖: S16-P1-1 Firebase mock（已就绪）
- [ ] 需要权限: Firebase Emulator 或真实 Firebase 项目凭证
- [ ] 预计工时: 2d
- [ ] 测试验证命令: `pnpm playwright test firebase-presence.spec.ts`

---

### S17-P2-1: TypeScript noUncheckedIndexedAccess

**问题描述**

当前 tsconfig.json 开启了 `strict` + `strictNullChecks`，但**未开启 `noUncheckedIndexedAccess`**。这意味着数组访问（如 `arr[0]`）即使越界也返回 `T | undefined`，但 TypeScript 不强制检查。

当前代码库中可能存在高风险数组访问点，未经验证。

**影响范围**
- `vibex-fronted/tsconfig.json`
- 所有使用数组下标访问的 `.ts/.tsx` 文件

**根因分析**

`noUncheckedIndexedAccess` 是一个破坏性变更，开启后任何数组下标访问都必须处理 `undefined` 情况。历史上未开启可能是因为担心大规模重构。但 Sprint 16 的 TypeScript debt 清理（P001）已经解决了 169 个 TS 错误，这是继续推进的窗口期。

**建议方案**

**方案 A（推荐）**：增量修复

- Step 1：开启 `noUncheckedIndexedAccess`
- Step 2：`pnpm exec tsc --noEmit` 扫描所有下标访问错误
- Step 3：分类修复（高风险数组访问优先）

**验收标准**
- [ ] `tsconfig.json` 添加 `"noUncheckedIndexedAccess": true`
- [ ] `pnpm exec tsc --noEmit` 0 errors
- [ ] 重点审查：数组下标访问在 `src/services/` 和 `src/lib/` 目录

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/tsconfig.json`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 2d（含全量扫描 + 高风险修复）
- [ ] 测试验证命令: `pnpm exec tsc --noEmit`

---

### S17-P2-2: Analytics Dashboard E2E 验证

**问题描述**

Sprint 14 E4 交付了 Analytics Dashboard：
- `FunnelWidget`：纯 SVG 折线图组件（无 recharts/chart.js 依赖）
- `useFunnelQuery`：TanStack Query hook
- `GET /api/analytics` 聚合层（App Router → backend）

但**没有 E2E 测试**验证 FunnelWidget 在真实数据场景的渲染，以及 useFunnelQuery 的 error/loading 状态。

**影响范围**
- `vibex-fronted/tests/e2e/analytics-dashboard.spec.ts`（新建）
- `vibex-fronted/src/components/dashboard/FunnelWidget.tsx`

**建议方案**

**方案 A（推荐）**：补充 E2E + 单元测试

- Step 1：创建 `analytics-dashboard.spec.ts`，覆盖：
  - FunnelWidget 四态（idle/loading/success/error）
  - 真实数据场景折线图渲染
  - useFunnelQuery error 状态降级 UI
- Step 2：补充 `useFunnelQuery` 单元测试

**验收标准**
- [ ] `pnpm playwright test analytics-dashboard.spec.ts` 全通过（≥5 tests）
- [ ] `npx vitest run useFunnelQuery.test.ts` 全通过
- [ ] FunnelWidget 在 error 状态显示降级文案（非空白）

**执行依赖**
- [ ] 需要修改的文件: `vibex-fronted/tests/e2e/analytics-dashboard.spec.ts`（新建）
- [ ] 前置依赖: Sprint 14 E4 Analytics Dashboard（已就绪）
- [ ] 需要权限: 无
- [ ] 预计工时: 1.5d
- [ ] 测试验证命令: `pnpm playwright test analytics-dashboard.spec.ts`

---

## 4. 风险矩阵

| 提案 | 可能性 | 影响 | 综合风险 | 工时 |
|------|--------|------|----------|------|
| S17-P0-1 E2E 覆盖率补全 | 低 | 高 | 🟢 低 | 2d |
| S17-P1-1 MCP Registry 收尾 | 低 | 低 | 🟢 低 | 1d |
| S17-P1-2 Firebase 真实集成 | 中 | 高 | 🟠 中 | 2d |
| S17-P2-1 noUncheckedIndexedAccess | 中 | 中 | 🟡 中 | 2d |
| S17-P2-2 Analytics E2E | 低 | 中 | 🟢 低 | 1.5d |

---

## 5. Sprint 17 容量建议

| 批次 | 提案 | 工时 | 说明 |
|------|------|------|------|
| 第一批（3d） | S17-P0-1 | 2d | E2E 覆盖率缺口，P0 必须完成 |
| | S17-P1-1 | 1d | MCP 收尾，可并行 |
| 第二批（3.5d） | S17-P1-2 | 2d | Firebase 真实验证，高风险先测 |
| | S17-P2-2 | 1.5d | Analytics E2E |
| 第三批（2d） | S17-P2-1 | 2d | TypeScript 严格化，独立推进 |

**总工时**：8.5d（基于 2 人 Sprint 容量可分两批完成）

---

## 6. 跨 Sprint 未完成项追踪

| 功能 | 原始 Sprint | 当前状态 | Sprint 17 建议 |
|------|------------|----------|----------------|
| Import/Export round-trip E2E | Sprint 7/14 | ⚠️ spec 存在但未验证生产 | S17-P0-1 可顺带覆盖 |
| SSE Bridge Firebase 集成 | Sprint 8 | ❌ 未开始 | S17-P1-2 Firebase 验证时一并处理 |
| Analytics Dashboard E2E | Sprint 14 | ❌ 缺失 | S17-P2-2 补全 |
| Teams API 前端集成 | Sprint 7 | ✅ UI 完成 | 无需操作 |
| Undo/Redo | Sprint 2/4 | ❌ 未完成 | 降级为 Sprint 18 P1 |

---

## 7. 技术风险

### 风险 1：E2E 测试覆盖率掩盖了集成风险
- **描述**：`design-review.spec.ts` 和 `firebase-presence.spec.ts` 在 mock 模式下全通过，但生产路径（真实 MCP 调用 / 真实 Firebase）未被验证
- **缓解**：S17-P0-1 补充生产路径 E2E，S17-P1-2 验证 Firebase 真实集成

### 风险 2：package.json 未锁定引擎版本
- **描述**：`node`/`pnpm` 版本未锁定，环境漂移可能导致 CI 不一致
- **缓解**：建议在 Sprint 17 添加 `engines` 字段，或在 tech debt 追踪中标记

### 风险 3：noUncheckedIndexedAccess 破坏性变更
- **描述**：开启后数组下标访问全部变成 `T | undefined`，可能产生大量 TS 错误
- **缓解**：先扫描统计错误数量，再决定是否在 Sprint 17 实施或延后

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260428-sprint17
- **执行日期**: 2026-04-29（建议）

*文档版本: v1.0 | 2026-04-29 | analyst*
