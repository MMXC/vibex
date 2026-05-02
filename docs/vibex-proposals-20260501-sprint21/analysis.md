# VibeX Sprint 21 提案分析报告

**Agent**: analyst
**日期**: 2026-05-01
**分析任务**: analyst-review — 验证提案真实性，评估可行性与风险
**提案来源**: `/root/.openclaw/vibex/proposals/20260501/analyst.md`
**产出路径**: `/root/.openclaw/vibex/docs/vibex-proposals-20260501-sprint21/analysis.md`

---

## 摘要

6 个提案中：
- **P001, P002**: Sprint 20 已完成，无需重复执行
- **P003, P004, P006**: Sprint 20 已完成，产出有 CHANGELOG 记录 + 提交验证
- **P005**: 部分完成（E2E CI 已集成，但执行稳定性未验证）

**结论**: 当前提案清单反映的是 Sprint 20 的工作内容，而非 Sprint 21 的新方向。需重新识别真正的下一批功能增强。

---

## 业务场景分析

### VibeX 当前状态（Sprint 1-20）

经过 20 个 sprint，VibeX 已具备：
- **Canvas 核心**: 三章节卡片、DAG 编辑、虚拟化列表
- **设计到代码**: MCP Server、Figma 导入、Code Generator
- **协作**: Firebase Presence、版本历史、设计评审
- **AI Agent**: OpenClaw Bridge 真实接入、会话管理
- **质量门禁**: TypeScript 严格模式、单元测试、E2E CI

### 待解决问题

基于 CHANGELOG + git history 分析，遗留的真实问题：

| # | 问题 | 验证方式 | 状态 |
|---|------|----------|------|
| Q1 | MCP tool 新增后 INDEX.md 需手动同步（无自动化） | 代码审查 | 待改进 |
| Q2 | E2E CI 执行 flaky（BASE_URL 依赖外部 Vibex.top） | CI 日志审查 | 风险 |
| Q3 | Design Review 真实 API vs mock 链路 | 代码审查 | 待验证 |
| Q4 | Canvas 虚拟化性能基准未建立 | benchmark script 存在 | 待验证 |
| Q5 | Workbench 功能对普通用户不可见（flag=false） | 线上验证 | 待确认 |
| Q6 | PRD Editor UI 功能未完成 | 代码审查 | 待确认 |

---

## 提案逐项验证

### P001: Design-to-Code DoD 收尾

**验证结果**: ✅ 已完成

**证据**:
- `docs/mcp-tools/INDEX.md` 存在，包含 7 个 tool（`health_check`, `review_design`, `coding_agent`, `createProject`, `getProject`, `listComponents`, `generateCode`）
- `scripts/generate-tool-index.ts` 存在且可执行（INDEX.md 生成时间为 `2026-04-30T20:51:51.461Z`）
- `packages/mcp-server/src/index.ts` 已集成 `setupHealthEndpoint(3100)`
- CHANGELOG 提交 `85e114400`

**技术风险**: 低。已验证完成。

**结论**: P001 驳回——问题已解决，无需重复执行。

---

### P002: TypeScript 严格模式完成

**验证结果**: ✅ 已完成

**证据**:
- `cd vibex-fronted && pnpm exec tsc --noEmit` → 0 errors ✅
- `cd packages/mcp-server && pnpm exec tsc --noEmit` → 0 errors ✅
- CHANGELOG 记录 S18-E18-TSFIX-2（351 errors fixed）+ S18-E18-TSFIX-1（7 errors fixed）
- 提交记录 `93b33afe3`, `d6332dd3f`, `126823bb1`

**技术风险**: 低。已验证完成。

**结论**: P002 驳回——问题已解决，无需重复执行。

---

### P003: Workbench Integration 生产化

**验证结果**: ✅ 已完成

**证据**:
- `vibex-fronted/src/app/workbench/page.tsx` 存在，feature flag `NEXT_PUBLIC_WORKBENCH_ENABLED` 已实现
- CHANGELOG 提交 `3f2903613`, `abcd0b75e` — P003-T1/T2/T3/T4 全部完成
- E2E 测试 `tests/e2e/workbench-journey.spec.ts` 8 tests passed ✅
- QA 验证 `vibex-sprint20-qa E2-QA` — feature flag 404 降级正确 ✅
- 提交 `6fe2388f4`

**技术风险**: 中。Workbench 需确认 `NEXT_PUBLIC_WORKBENCH_ENABLED=true` 后才能对 beta 用户可见，当前默认 `false`。建议 coord 确认发布计划。

**结论**: 技术完成，等待 feature flag 开启。无需作为新提案重复执行。

---

### P004: Canvas 虚拟化列表

**验证结果**: ✅ 已完成

**证据**:
- `ChapterPanel.tsx` 使用 `@tanstack/react-virtual` `useVirtualizer`（行 19, 449）
- CHANGELOG 提交 `a5db58799`, `9588265db`, `9eac94c1d`, `25cc0aaf0`, `bc08c8eca`, `c5d90ab6e`
- `DDSCanvasStore` 新增 `selectedCardSnapshot` + `updateCardVisibility`
- E2E 性能测试 `tests/e2e/canvas-virtualization-perf.spec.ts` 存在
- Benchmark script `scripts/benchmark-canvas.ts` 存在
- QA 验证 `vibex-sprint20-qa E2-QA` — 100节点性能已测 ✅

**技术风险**: 低。实现完成。benchmark script 存在但线上性能基准未记录到 CHANGELOG。

**结论**: P004 驳回——问题已解决。

---

### P005: E2E CI 集成化

**验证结果**: ⚠️ 部分完成，有风险

**证据**:
- `.github/workflows/test.yml` 已包含 `e2e` job（行 173-205）
- E2E 在 merge gate 中作为必要条件（行 217）
- 配置文件 `playwright.ci.config.ts` 存在
- 但：`BASE_URL` 依赖 `${{ vars.BASE_URL || 'https://vibex.top' }}`，使用生产环境作为 E2E 测试环境是危险设计
- 无 staging/dev 环境的 E2E 测试配置
- 无 E2E 测试覆盖率报告生成到 CI artifact 之外的机制

**技术风险**:
- **高**: 生产环境做 E2E 测试 = 数据污染 + 竞态条件
- **中**: 无 E2E 测试隔离，flaky 测试会阻塞 merge
- **中**: E2E 报告只在 artifact 中，无自动化告警

**建议方案**:

| 方案 | 描述 | 成本 | 风险 |
|------|------|------|------|
| A（推荐） | 引入 staging 环境 + CI 使用 staging BASE_URL，staging 数据隔离 | 中（2-4h） | 低 |
| B | 使用 mock backend + playwright mock API mode（不依赖外部服务） | 中（3-5h） | 中 |
| C | 当前配置接受风险，继续用生产环境跑 E2E | 低 | 高 |

**结论**: P005 问题真实，但解决方案需要决策。建议 coord 评审时确认采用哪个方案。

---

### P006: Claude Code Agent 真实接入

**验证结果**: ✅ 已完成

**证据**:
- `vibex-backend/src/services/OpenClawBridge.ts` 真实调用 `sessions_spawn`（行 50-89）
- `vibex-backend/src/routes/agent/sessions.ts` 完整 CRUD
- `vibex-fronted/src/app/api/agent/sessions/route.ts` proxy 层
- CHANGELOG 提交 `70075de94`, `e365a712f`, `e2aa8d9c6`
- 40 个 unit tests passed ✅（sessions.test.ts 13 + OpenClawBridge.test.ts 15 + agent-sessions.test.ts 12）
- QA 验证 `vibex-sprint20-qa E2-QA` — P006 API 输入校验 + 降级处理正确 ✅

**技术风险**: 低。已验证完成。

**结论**: P006 驳回——问题已解决，无需重复执行。

---

## 技术风险矩阵

| 风险 ID | 描述 | 影响 | 可能性 | 优先级 |
|---------|------|------|--------|--------|
| R1 | E2E 依赖生产环境（BASE_URL= vibex.top） | 高 | 高 | P0 |
| R2 | Workbench `NEXT_PUBLIC_WORKBENCH_ENABLED=false` 默认关闭 | 中 | 低 | P1 |
| R3 | MCP tool 新增后 INDEX.md 需手动同步 | 低 | 高 | P2 |
| R4 | PRD Editor UI 存在但完成度未知 | 中 | 中 | P1 |
| R5 | Design Review 真实 API 调用链路未端到端验证 | 高 | 中 | P1 |

---

## 建议方案

### Q1: E2E CI 环境隔离（最紧迫）

**方案 A（推荐）**: 引入 staging E2E 模式
- 方案：添加 `staging` playwright config，使用 CI-only 环境的数据隔离
- 成本：2-4h
- 风险：低
- 验收：
  - [ ] `pnpm --filter vibex-fronted run test:e2e:ci` 在 staging 环境执行
  - [ ] E2E 测试之间数据隔离（每个 spec 用独立 fixture）
  - [ ] CI merge gate 使用 staging E2E 结果

### Q3: Design Review 真实 API 验证

**方案**: 使用 gstack `/browse` 验证真实 API 链路
- 成本：1h（验证）+ 4h（修复）
- 验收：
  - [ ] Ctrl+Shift+R 触发真实 `review_design` MCP call
  - [ ] ReviewReportPanel 展示非 mock 数据

### Q4: PRD Editor UI 完成度评估

**方案**: 代码审查 + gstack 验证
- 成本：1h
- 验收：
  - [ ] `/editor` 页面存在且 JSON/YAML 切换可用
  - [ ] 解析错误内联展示

---

## 执行决策

- **决策**: 驳回（提案清单过时）
- **驳回原因**: P001/P002/P003/P004/P006 已在 Sprint 20 完成并验证；P005 问题真实但需重新定义范围
- **建议**: 重新收集 Sprint 21 提案，基于真实未解决问题

---

## 附录：Sprint 20 实际完成情况

| 提案 ID | CHANGELOG 提交 | 状态 | 验证方式 |
|---------|---------------|------|----------|
| P001 | `85e114400` | ✅ 完成 | 代码+INDEX.md |
| P002 | `93b33afe3` | ✅ 完成 | tsc --noEmit |
| P003 | `3f2903613`, `abcd0b75e` | ✅ 完成 | 代码+E2E |
| P004 | `a5db58799`~`c5d90ab6e` | ✅ 完成 | 代码+性能测试 |
| P005 | - | ⚠️ 部分 | CI 已集成但有环境风险 |
| P006 | `70075de94`, `e2aa8d9c6` | ✅ 完成 | 代码+UT+E2E |

---

## 附录：E2E CI 当前配置

```yaml
# .github/workflows/test.yml
e2e:
  env:
    CI: true
    BASE_URL: ${{ vars.BASE_URL || 'https://vibex.top' }}
  run: pnpm --filter vibex-fronted run test:e2e:ci
```

**问题**: `https://vibex.top` 是生产环境，在 CI 中对生产跑 E2E 会导致：
1. 测试数据污染生产数据库
2. 并发测试竞态条件
3. 外部依赖不稳定导致 flaky