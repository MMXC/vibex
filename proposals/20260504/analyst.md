# VibeX Sprint 24 功能提案规划

**Agent**: analyst
**日期**: 2026-05-04
**项目**: vibex-proposals-sprint24
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-23 交付成果，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | tech-debt | E2E Slack 集成收尾 | CI pipeline，发布可见性 | P0 |
| P002 | tech-debt | 后端 TypeScript 编译错误收尾 | 全体开发体验 | P0 |
| P003 | feature | 新手引导流程（Onboarding） | 新用户转化，留存 | P1 |
| P004 | tech-debt | API 模块测试补全 | 质量保障，回归防御 | P1 |
| P005 | feature | 项目版本对比（跨 Canvas） | 团队协作，需求追溯 | P2 |

---

## 2. 提案详情

### P001: E2E Slack 集成收尾

**问题描述**:

Sprint 23 E1 Epic 声称已完成 E2E Slack 报告链路（commit `276f1ba26` 修改了 `.github/workflows/test.yml` + `e2e-summary-to-slack.ts`），但 vibex-sprint23-qa 的 analysis.md 指出：

> CI e2e job 中 `e2e-summary-slack.ts` 脚本调用链路存在，但 **Slack Webhook URL 配置**和**真实环境验证**尚未完成。E1 当前状态为"代码存在但未被 CI 调用"。

当前 git log 显示 E1-U1/U2 commit 存在，但 Slack webhook 真实发送未被 CI 环境验证。

**影响范围**: CI pipeline，团队对 CI 状态的感知延迟

**根因**:
```
根因: E2E Slack 报告链路的"最后 1 公里"未打通——脚本存在但 webhook URL 配置缺失
证据:
- vibex-sprint23-qa/analysis.md: "E1 实现 80%，缺 CI 配置"
- .github/workflows/test.yml 中 e2e:summary:slack step 依赖 SLACK_WEBHOOK_URL secret
- 无 GitHub repo secrets 中 SLACK_WEBHOOK_URL 配置记录
- 无真实 webhook 发送的 CI run 日志
```

**验收标准**:
- [ ] GitHub repo secrets 中已配置 SLACK_WEBHOOK_URL
- [ ] `.github/workflows/test.yml` e2e job 末尾 step 调用 `e2e:summary:slack`（`if: always()`）
- [ ] 最近一次 CI run 后 Slack #analyst-channel 收到 E2E 报告消息（Block Kit 格式）
- [ ] CI e2e job 的 exit code 不受 Slack webhook 失败影响（`postToSlack` 永不抛出）

---

### P002: 后端 TypeScript 编译错误收尾

**问题描述**:

Sprint 15 E15-P006 Tech Debt Cleanup 声称将 ESLint 错误从 197 降至 28，但遗留了 4 个文件：
- `SearchIndex.ts` — TypeScript 类型错误
- `SearchFilter.tsx` — TypeScript 类型错误
- `useCanvasExport.ts` — TypeScript 类型错误
- `api-generated.ts` — 类型生成不完整

Sprint 23 全量 Epic 交付后，这些遗留错误仍未修复，影响 `pnpm exec tsc --noEmit` 在后端包中的零错误目标。

**影响范围**: 全体开发体验，CI typecheck gate 不可靠

**根因**:
```
根因: TS 债务修复是"部分完成"而非"全部完成"——每次只修一部分
证据:
- CHANGELOG S15-E15-P006: "197 → 28 errors (remaining: SearchIndex.ts, SearchFilter.tsx, useCanvasExport.ts, api-generated.ts)"
- S23 CHANGELOG 无 TS 收尾条目
- `pnpm exec tsc --noEmit` 在 vibex-backend 或 packages/types 中仍有错误输出
```

**验收标准**:
- [ ] `cd /root/.openclaw/vibex && pnpm exec tsc --noEmit` → 0 errors（所有 workspace packages）
- [ ] `pnpm run build` → 0 errors
- [ ] CI typecheck job 通过（无 TS 错误导致的 blocking）

---

### P003: 新手引导流程（Onboarding）

**问题描述**:

FEATURE_REQUESTS.md FR-009 标记为 P0（"新用户进入 Dashboard 后无引导，不知道从哪开始"），FR-001 标记为 P0（"新用户不知如何描述需求，提供行业模板可降低使用门槛 50%"）。

Sprint 23 完成了模板库 Phase 1（export/import/history），但新用户的 **第一入口** 仍然是空白的 NewProjectModal，无引导。

竞品对标：Figma/Notion/Miro 均有 onboarding overlay——5 步引导覆盖"创建 → 添加内容 → 导出"核心路径。

**影响范围**: 新用户转化率，初始留存

**根因**:
```
根因: 产品功能已完善但 onboarding 缺失——用户不知道如何使用
证据:
- FEATURE_REQUESTS.md FR-009 P0 标记，未解决
- CHANGELOG S1-S23 无 onboarding 相关条目
- NewProjectModal 无引导流程，用户从空白画布开始不知道下一步
- 竞品均有 onboarding overlay（如 Figma 的 5 步引导）
```

**验收标准**:
- [ ] 首次登录用户看到 onboarding overlay（可跳过）
- [ ] Onboarding 覆盖：创建项目 → 添加 BoundedContext → 生成流程 → 导出
- [ ] 完成引导的用户能独立完成基础操作
- [ ] 已跳过用户不会再次看到引导（localStorage flag）

---

### P004: API 模块测试补全

**问题描述**:

S17-E3 TypeScript `noUncheckedIndexedAccess` 启用时识别了 API 模块测试覆盖率极低：
- `modules/agent.ts`: 5.55%
- `modules/auth.ts`: 21.42%
- `modules/clarification.ts`: 7.14%
- `project.ts`: 未测试

Sprint 23 完成了 5 Epic 全量交付，但 API 模块测试覆盖率仍未系统性提升。关键 API 端点（Canvas 生成、Design Review、Agent 会话）缺乏单元测试保障。

**影响范围**: 回归防御，CI 质量门禁可靠性

**根因**:
```
根因: API 模块测试覆盖率是长期技术债，S17 识别后从未系统性推进
证据:
- FEATURE_REQUESTS.md A-008 P0 已提议但未执行
- CHANGELOG S1-S23 无 API 测试补全条目
- 现有测试以组件/hook 单元测试为主，API 集成层测试缺失
```

**验收标准**:
- [ ] `modules/auth.ts` 覆盖率 ≥ 60%
- [ ] `modules/project.ts` 覆盖率 ≥ 60%
- [ ] Canvas API endpoints (`/api/canvas/generate-contexts` 等) 有集成测试
- [ ] `pnpm test` 覆盖增加 ≥ 20 个新测试用例

---

### P005: 项目版本对比（跨 Canvas）

**问题描述**:

Sprint 23 E2 完成了 Design Review 的 diff 视图（重评后对比 added/removed），Sprint 15 E15-P004 完成了 Version Compare UI（单项目内的版本对比）。

但跨 Canvas 项目的需求版本对比从未实现。用户无法对比"当前迭代的需求"与"上一迭代的需求"之间的变更——两个 Canvas 是完全独立的数据体。

**影响范围**: 团队需求管理，迭代回顾

**根因**:
```
根因: 版本对比能力止步于"单 Canvas 内部"，未延伸到"跨 Canvas 项目"
证据:
- CHANGELOG E15-P004: "单项目内 Version Compare UI 完成"
- FEATURE_REQUESTS.md FR-003 P1 标记，未解决
- 无跨 Canvas 的 diff 对比机制
- useVersionHistory hook 仅支持单项目
```

**验收标准**:
- [ ] 两个 Canvas 项目可选择进行 diff 对比（基于 requirement chapter 内容）
- [ ] Diff 视图显示：新增节点（红）/ 移除节点（绿）/ 修改节点（黄）
- [ ] Diff 报告可导出（JSON/Markdown）
- [ ] `pnpm run build` → 0 errors

---

## 3. 相关文件

- CHANGELOG.md: Sprint 1-23 全量交付追踪
- FEATURE_REQUESTS.md: FR-001/FR-003/FR-009/A-008 未解决
- `.github/workflows/test.yml`: E1 Slack CI 配置
- `vibex-backend/src/modules/`: API 模块测试补全目标
- `vibex-fronted/src/components/onboarding/`: Onboarding overlay 目标位置
- `vibex-fronted/src/hooks/useCanvasExport.ts`: TS 收尾目标文件

---

## 4. 风险矩阵

| 提案 | 风险项 | 可能性 | 影响 | 风险等级 | 缓解方案 |
|------|--------|--------|------|----------|----------|
| P001 | Slack webhook URL 配置需要 repo 权限 | 中 | 中 | 🟡 | GitHub repo secrets 由有权限者配置，脚本本身 `if: always()` 不影响 CI |
| P002 | 遗留 TS 错误涉及 schema 生成器 | 中 | 中 | 🟡 | 先从最简单的 `useCanvasExport.ts` 开始，逐个击破 |
| P003 | Onboarding 引导可能增加认知负担 | 低 | 低 | 🟢 | 可跳过，不强制，不影响已有用户 |
| P004 | Mock 难度高（需要精确的 API response） | 高 | 中 | 🟠 | 使用 MSW（已在 S13 完成），无需真实 API |
| P005 | 跨 Canvas diff 算法复杂度高 | 中 | 中 | 🟡 | 先做基于 JSON 结构的简单 diff，不做语义对比 |

---

## 5. 工期估算

| 提案 | 预估工时 | 复杂度 | 依赖 | Sprint 建议 |
|------|----------|--------|------|-------------|
| P001 | 0.5h | 低 | S23 E1 代码 | Sprint 24 Week 1 |
| P002 | 1-2h | 低 | 无 | Sprint 24 Week 1 |
| P003 | 3-5h | 中 | S23 E5 模板库基础 | Sprint 24 Week 1-2 |
| P004 | 2-3 人日 | 高 | 无 | Sprint 24 Week 2（分 Epic） |
| P005 | 3-4h | 中 | S23 E2 diff 基础 | Sprint 24 Week 2 |

**总工时**: 约 6-8 人日

---

## 6. 执行决策

- **决策**: 待评审
- **执行项目**: vibex-proposals-sprint24
- **执行日期**: 待定
- **执行顺序**: P001 → P002（Week 1 并行）→ P003（Week 1-2）→ P004/P005（Week 2 并行）

---

*生成时间: 2026-05-04 09:00 GMT+8*
*Analyst Agent | VibeX Sprint 24*