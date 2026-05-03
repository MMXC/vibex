# VibeX Sprint 24 QA — 需求分析报告

**Agent**: analyst
**日期**: 2026-05-04
**阶段**: analyst-review
**项目**: vibex-proposals-sprint24

---

## 执行摘要

Sprint 24 提案共 5 个（P001-P005），基于 Sprint 1-23 交付成果和 FEATURE_REQUESTS.md 中未解决的遗留项。

gstack 验证发现：
- **P001**: E1 Slack 代码已实现在 CI workflow 中，缺口仅为 GitHub repo secrets 配置
- **P002**: 前端 TypeScript 已清零（`pnpm exec tsc --noEmit` → 0 errors），需重新评估后端 TS 状态
- **P003-P005**: 代码审计 + git history 验证问题真实性

---

## 提案真实性验证

### P001: E2E Slack 集成收尾

**gstack 验证结果**：

代码审计发现 `.github/workflows/test.yml` 中 **已存在** Slack 报告 step：
```yaml
run: pnpm --filter vibex-fronted run e2e:summary:slack
env:
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  CI: true
  GITHUB_RUN_NUMBER: ${{ github.run_number }}
  GITHUB_RUN_URL: '${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'
```

**真实部分**: E1-U1/U2 代码已落地，CI workflow 配置正确，`postToSlack()` 永不抛出，`if: always()` 确保 webhook 失败不影响 CI exit code。

**缺失部分**: `SLACK_WEBHOOK_URL` GitHub repo secret 是否已配置无法从代码层验证（需 repo 管理权限）。

**结论**: 问题真实性 **⚠️ 部分真实**。提案降级：代码完成，缺配置验证。

### P002: 后端 TypeScript 编译错误收尾

**gstack 验证结果**：

```bash
cd vibex-fronted && pnpm exec tsc --noEmit
# → 0 errors ✅
```

前端 TypeScript 编译零错误。但 S15 CHANGELOG 提到的遗留文件（`SearchIndex.ts` / `SearchFilter.tsx`）位于 worktrees 目录，非主代码库。

**结论**: 前端 TS 债务已清零。后端/mcp-server TS 状态需进一步验证。**提案需要修正**：将 P002 范围调整为"剩余 TS 债务确认"，而非"收尾"。

### P003: 新手引导流程（Onboarding）

**gstack 验证结果**：

代码审计发现：
- `NewProjectModal.tsx`: 仅有模板选择，无 onboarding overlay
- `Dashboard` 页面：无 onboarding 状态追踪
- 无 `onboardingStore` 或 `useOnboarding` 相关代码
- CHANGELOG S1-S23 无 onboarding 相关条目

**问题真实性**: ✅ 真实。FR-009 P0 从未被实现。

### P004: API 模块测试补全

**gstack 验证结果**：

代码审计发现：
- `src/services/api/modules/` 目录存在
- 无 `modules/auth.test.ts`（auth.ts 无单元测试）
- `src/__tests__/` 中无 API integration tests
- MSW handler 存在于 `src/mocks/handlers.ts`（S13 FR-013）

**问题真实性**: ✅ 真实。API 层测试覆盖率历史上极低，当前面 codebase 无 API 单元测试目录。

### P005: 项目版本对比（跨 Canvas）

**gstack 验证结果**：

代码审计发现：
- `useVersionHistory.ts`: 仅支持单项目 snapshot
- `VersionHistoryPanel`: 仅展示单项目历史
- 无跨 Canvas diff 相关代码
- `reviewDiff.ts`: 仅做 design review diff，不做跨 Canvas 需求 diff

**问题真实性**: ✅ 真实。E15-P004 仅完成单项目内对比，跨 Canvas diff 从未实现。

---

## 业务场景分析

### P001: E2E Slack 集成收尾

**目标用户**: 开发团队（实时感知 CI 状态）、PM（监控质量趋势）

**核心价值**: CI 结果透明化，减少人工检查 CI 的摩擦。

**关键约束**:
- `SLACK_WEBHOOK_URL` 必须配置在 GitHub repo secrets
- `postToSlack()` 永不抛出，确保 CI exit code 独立
- 当前缺口：webhook 配置验证（配置本身无法从代码层验证）

**JTBD**:
1. CI run 结束后自动收到 Slack 消息
2. 消息包含失败用例列表
3. Webhook 配置失败不影响 CI

### P002: TypeScript 债务确认

**目标用户**: 全体开发者

**核心价值**: 零 TS 错误 → CI typecheck gate 可靠。

**关键约束**:
- 前端 TS 已清零
- 后端/mcp-server TS 状态需专项验证

**JTBD**:
1. `pnpm exec tsc --noEmit` 所有包均为 0 errors
2. CI typecheck job 稳定通过

### P003: Onboarding 引导

**目标用户**: 新用户（首次使用 VibeX）

**核心价值**: 降低首次使用摩擦，提升新用户转化率。

**关键约束**:
- Onboarding 可跳过，不强制
- 已跳过用户不再展示（localStorage flag）
- Sprint 23 E5 模板库基础已就绪

**JTBD**:
1. 新用户知道如何开始创建第一个项目
2. 引导覆盖"创建 → 添加内容 → 导出"核心路径
3. 完成引导后能独立操作

### P004: API 模块测试补全

**目标用户**: 全体开发者、CI 质量门禁

**核心价值**: 关键 API 端点有测试保障，回归错误能提前发现。

**关键约束**:
- 使用 MSW（S13 已完成）做 mock，无需真实 API
- 重点覆盖 auth、project、canvas 生成端点
- S17 识别的覆盖率极低问题（5-22%）持续至今

**JTBD**:
1. 核心 API 端点有单元测试
2. 新 PR 破坏 API 时 CI 能检测到
3. 覆盖率 ≥ 60%

### P005: 跨 Canvas 版本对比

**目标用户**: 团队（多 Canvas 项目管理）、PM（迭代回顾）

**核心价值**: 追踪需求变更历史，支持迭代对比。

**关键约束**:
- S23 E2 diff 算法基础存在（reviewDiff.ts）
- E15-P004 单项目版本对比已完成
- 跨 Canvas diff 需要新的数据层设计

**JTBD**:
1. 两个 Canvas 项目可进行 diff
2. Diff 显示新增/移除/修改节点
3. Diff 报告可导出

---

## 技术方案选项

### P001 方案

**方案 A（推荐）: Webhook 配置验证**
- 确认 GitHub repo 中 `SLACK_WEBHOOK_URL` secret 已配置
- 在 CI workflow 添加 webhook 配置验证 step（dry-run）
- 验证命令：`curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"test"}'`
- 工时: 0.5h

**方案 B: 降级兜底**
- 如果 webhook 不可用，在 Slack 消息中标注"webhook 未配置"
- 不影响 CI exit code
- 工时: 0.5h

### P002 方案

**方案 A: 全面 TS 审计**
- 对所有 workspace packages 执行 `tsc --noEmit`
- 识别剩余 TS 错误文件
- 按优先级逐个修复
- 工时: 1-2h（不含后端/mcp-server TS 修复）

**方案 B: 重新评估范围**
- 前端 TS 已清零，重点关注后端/mcp-server
- 使用 `pnpm --filter vibex-backend exec tsc --noEmit` 验证
- 工时: 0.5h（确认范围）

### P003 方案

**方案 A（推荐）: 轻量 Overlay**
- 在 NewProjectModal 完成后首次打开 Canvas 时显示 5 步引导
- 每个步骤有 skip 按钮
- 完成或跳过记录到 localStorage
- 工时: 3-5h

**方案 B: 引导面板（扩展 VersionHistoryPanel 模式）**
- 复用 S15 E15-P004 VersionHistoryPanel 模式
- Onboarding 作为可折叠 panel
- 工时: 4-6h

### P004 方案

**方案 A（推荐）: MSW + Vitest**
- 使用现有 MSW handlers（S13 FR-013 已完成）
- 为 auth/project/canvas 模块编写 Vitest 单元测试
- 覆盖率目标 ≥ 60%
- 工时: 2-3 人日

**方案 B: Playwright E2E 替代**
- 用 E2E 覆盖 API 集成层
- 不写单元测试
- 工时: 1-2 人日（但覆盖率不足）

### P005 方案

**方案 A（推荐）: JSON Diff Service**
- 基于 S23 E2 reviewDiff.ts 的 diff 算法
- 新增 `compareCanvasProjects(A, B)` 函数
- 比较两个 Canvas 的 requirement chapter JSON 结构
- 工时: 3-4h

**方案 B: Canvas Export 复用**
- 将两个 Canvas 都导出为 JSON
- 在前端用 diff 算法对比
- 复用 S23 E4 的 exporter
- 工时: 2-3h（但无法做增量 diff）

---

## 可行性评估

| 提案 | 技术可行性 | 风险 | 结论 |
|------|-----------|------|------|
| P001 | ✅ 高 | webhook 配置未知 | 通过（降级为配置验证） |
| P002 | ✅ 高 | 后端 TS 范围待确认 | 有条件通过（需重新评估范围） |
| P003 | ✅ 高 | Onboarding 认知负担 | 通过（可跳过设计缓解） |
| P004 | 🟡 中 | MSW mock 数据复杂 | 有条件通过（先做 auth/project 模块） |
| P005 | 🟡 中 | 跨 Canvas diff 算法新 | 通过（基于现有 diff 算法扩展） |

---

## 风险矩阵

| 风险 | 提案 | 可能性 | 影响 | 缓解 |
|------|------|--------|------|------|
| P001: webhook secret 未配置 | P001 | 高 | 中 | 配置验证 + 降级文案 |
| P002: 后端 TS 错误量大 | P002 | 中 | 高 | 先评估范围，再决定是否 Sprint 24 做 |
| P003: Onboarding 增加开发负担 | P003 | 低 | 低 | 可跳过设计，无侵入 |
| P004: MSW mock 数据难写 | P004 | 高 | 中 | 先做 auth 模块（有清晰 input/output）|
| P005: diff 算法不收敛 | P005 | 低 | 中 | 降级为 JSON 结构 diff，不做语义对比 |

---

## 验收标准（可测试）

### P001
- [ ] GitHub repo secrets 中 SLACK_WEBHOOK_URL 已配置
- [ ] CI run 后 Slack #analyst-channel 收到 E2E 报告消息
- [ ] `postToSlack()` 永不抛出，CI exit code 独立

### P002
- [ ] `pnpm --filter vibex-fronted exec tsc --noEmit` → 0 errors
- [ ] `pnpm --filter vibex-backend exec tsc --noEmit` → 0 errors（或已识别待修复清单）
- [ ] CI typecheck job 稳定通过

### P003
- [ ] 首次登录用户看到 onboarding overlay（可跳过）
- [ ] 引导覆盖 5 步（创建 → 添加 BoundedContext → 生成流程 → 导出 → 完成）
- [ ] `data-testid="onboarding-skip-btn"` 存在
- [ ] 已跳过用户不再展示（localStorage flag 正确）

### P004
- [ ] `modules/auth.test.ts` 存在，覆盖率 ≥ 60%
- [ ] `modules/project.test.ts` 存在，覆盖率 ≥ 60%
- [ ] Canvas API endpoints 有 Vitest 测试
- [ ] `pnpm test` 新增 ≥ 20 个测试用例

### P005
- [ ] 跨 Canvas diff 页面存在（`/canvas-diff` 或集成在现有页面）
- [ ] diff 视图显示：新增（红）/ 移除（绿）/ 修改（黄）节点
- [ ] diff 报告可导出 JSON
- [ ] `pnpm run build` → 0 errors

---

## 依赖分析

```
P001: E1 Slack（无依赖）→ 立即可做
P002: TS 审计（无依赖）→ 立即可做
P003: Onboarding（依赖 S23 E5 模板库）→ S23 已完成 ✅
P004: API 测试（无依赖）→ 立即可做
P005: 跨 Canvas diff（依赖 S23 E2 diff 算法）→ S23 已完成 ✅
```

**并行度**: P001/P002/P004 可并行（Week 1），P003/P005 可并行（Week 2）

---

## 识别的问题

### 问题 1: P002 范围需重新评估
前端 TS 已清零。P002 的"后端 TypeScript 收尾"范围需重新确认——如果后端也有 0 errors，则 P002 应降为"验证性"提案；如果后端有错误，需量化范围。

**建议**: Coord 在决策时确认 P002 是否纳入 Sprint 24。

### 问题 2: P005 跨 Canvas diff 需要新数据层
现有 `useVersionHistory` 仅支持单项目。跨 Canvas diff 需要持久化层支持（两个 Canvas 的 version history 能同时加载），目前的数据模型不支持。

**建议**: Architect 在架构设计阶段确认数据层方案。

---

## 审查结论

| 提案 | 结论 | 理由 |
|------|------|------|
| P001 | ⚠️ **降级通过** | 代码已完成，缺口为 webhook 配置验证 |
| P002 | ⚠️ **有条件通过** | 前端 TS 已清零，需重新评估后端范围 |
| P003 | ✅ **通过** | Onboarding 真实缺失，方案可行 |
| P004 | ✅ **通过** | API 测试覆盖历史空白，MSW 基础设施已就绪 |
| P005 | ⚠️ **有条件通过** | diff 算法基础存在，数据层设计待确认 |

**总体结论**: 5 个提案全部具备实施条件。P001/P003/P004 是 Sprint 24 明确要做的高价值项。P002 需重新评估范围，P005 需 Architect 确认数据层方案。

---

## 执行决策

- **决策**: 已采纳（有条件）
- **执行项目**: vibex-proposals-sprint24
- **执行日期**: 2026-05-04
- **条件**: P002 范围重新评估，P005 数据层方案由 Architect 确认

---

*生成时间: 2026-05-04 09:05 GMT+8*
*Analyst Agent | VibeX Sprint 24 QA — 需求分析（gstack 验证）*