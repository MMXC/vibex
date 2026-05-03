# VibeX Sprint 25 功能提案规划

**Agent**: analyst
**日期**: 2026-05-03
**项目**: vibex-proposals-sprint25
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-24 交付成果，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | feature | Onboarding + 需求模板库捆绑交付 | 新用户转化，留存 | P0 |
| P002 | feature | 跨 Canvas 项目版本对比 | 团队协作，需求追溯 | P1 |
| P003 | tech-debt | Sprint 24 遗留项收尾 | CI 可见性，测试质量 | P1 |
| P004 | feature | 项目搜索与过滤（Dashboard） | 多项目管理，效率 | P2 |
| P005 | feature | 团队协作空间（Teams × Canvas） | 企业用户，协作场景 | P2 |

---

## 2. 提案详情

### P001: Onboarding + 需求模板库捆绑交付

**问题描述**:

Sprint 23 完成了模板库 Phase 1（export/import/history），Sprint 24 提案 FR-009 Onboarding 通过评审但未实施，FR-001 需求模板库（S23 E5 基础完成）也未与 Onboarding 打通。

当前状态：
- 新用户进入 Dashboard → 无引导 → 面对空白画布不知道做什么
- NewProjectModal 有模板选择，但用户不理解每个模板的用途
- 无 onboarding overlay，无分步引导

竞品对标：Figma/Notion/Miro 均将 onboarding 与模板选择融合——模板不是"选择"，而是"引导的终点"。

**影响范围**: 新用户转化率，初始留存

**根因**:
```
根因: Onboarding 和需求模板库是两个独立提案，但用户旅程上它们是连续的
证据:
- FEATURE_REQUESTS.md FR-009 P0 和 FR-001 P0 都未完成
- CHANGELOG S23 无 Onboarding 条目
- NewProjectModal 无引导文案，用户不知道选择哪个模板
- S24 analyst-review: P003 Onboarding "通过"但无实施记录
```

**验收标准**:
- [ ] 首次登录用户看到 onboarding overlay（5 步引导，可跳过）
- [ ] Onboarding 末步推荐模板（基于用户选择的场景）
- [ ] 模板选择后自动填充示例内容（requirement chapter auto-fill）
- [ ] 已跳过用户不再展示（localStorage flag）
- [ ] `data-testid="onboarding-overlay"` / `data-testid="onboarding-skip-btn"` 存在
- [ ] `pnpm run build` → 0 errors

---

### P002: 跨 Canvas 项目版本对比

**问题描述**:

Sprint 15 E15-P004 完成了单项目内的版本对比 UI（SnapshotSelector + VersionPreview），Sprint 23 E2 完成了 Design Review 的 diff 视图（added/removed）。

但跨 Canvas 项目的需求对比从未实现：用户有两个版本的 PRD Canvas，无法对比"这轮迭代改了哪些需求"。

Sprint 24 提案 P005 已通过评审（基于 reviewDiff.ts 扩展），但无实施记录。

**影响范围**: 团队需求管理，迭代回顾

**根因**:
```
根因: 版本对比能力止步于"单 Canvas 内部"，跨项目 diff 是完全空白的领域
证据:
- CHANGELOG E15-P004: 单项目内 Version Compare UI 完成
- useVersionHistory.ts: 仅支持单项目 snapshot
- FEATURE_REQUESTS.md FR-003 P1，未解决
- S24 analyst-review: P005 "通过"但无实施记录
```

**验收标准**:
- [ ] 任意两个 Canvas 项目可选择进行 diff 对比
- [ ] diff 视图显示：新增节点（红）/ 移除节点（绿）/ 修改节点（黄）
- [ ] diff 报告可导出 JSON
- [ ] `data-testid="canvas-diff-btn"` / `data-testid="diff-view"` 存在
- [ ] `pnpm run build` → 0 errors

---

### P003: Sprint 24 遗留项收尾

**问题描述**:

Sprint 24 提案通过评审，但存在多个遗留项：

| 提案 | Sprint 24 状态 | 遗留 |
|------|--------------|------|
| P001 E2E Slack | ⚠️ 降级 | `SLACK_WEBHOOK_URL` 配置未验证 |
| P002 TS 债务 | ⚠️ 范围重评 | 后端/mcp-server TS 状态未确认 |
| P004 API 测试 | ⚠️ 有条件 | auth/project 模块测试未开始 |

当前 CHANGELOG 显示 S23 仍在 `[Unreleased]`，S24 状态未更新。

**影响范围**: CI 质量门禁，代码质量基线

**根因**:
```
根因: 提案通过后缺乏闭环追踪机制——coord 通过后无后续确认
证据:
- vibex-proposals-sprint24 当前状态未知（coord 是否已开启 phase1？）
- CHANGELOG S23 全量仍在 [Unreleased]
- 无 Sprint 关闭流程文档
```

**验收标准**:
- [ ] E2E Slack: 最近一次 CI run 后 Slack #analyst-channel 收到 E2E 报告
- [ ] TS: `pnpm -r exec tsc --noEmit` 所有包 0 errors（或量化剩余错误清单）
- [ ] API 测试: auth.ts 和 project.ts 各 ≥ 20 个新测试用例
- [ ] S23/S24 CHANGELOG 条目移出 [Unreleased]

---

### P004: 项目搜索与过滤（Dashboard）

**问题描述**:

FEATURE_REQUESTS.md FR-010 P1（"项目多了后无法快速找到目标，需要搜索和分类"）。

当前 Dashboard 项目列表：
- 无搜索框
- 无过滤器（按状态/日期/标签）
- 无排序（按名称/更新时间）
- 超过 10 个项目后用户需要滚动查找

**影响范围**: 多项目管理效率

**根因**:
```
根因: Dashboard 项目列表未考虑规模化场景
证据:
- FEATURE_REQUESTS.md FR-010 P1，未解决
- Dashboard 组件无 search/filter 相关 UI
- 无 `useProjectSearch` 或类似 hook
```

**验收标准**:
- [ ] Dashboard 添加搜索框（按项目名过滤，实时）
- [ ] 添加过滤器：全部 / 最近7天 / 最近30天 / 我创建的
- [ ] 添加排序：最新更新 / 最早更新 / 名称 A-Z
- [ ] `data-testid="project-search-input"` / `data-testid="project-filter-btn"` 存在
- [ ] `pnpm run build` → 0 errors

---

### P005: 团队协作空间（Teams × Canvas）

**问题描述**:

FEATURE_REQUESTS.md FR-004 P1（"仅支持个人项目，无法团队共享/协作，限制企业场景"）。

当前 Teams API（Sprint 13-14 完成后端）和 Teams Dashboard（Sprint 7）已就绪，但：
- Canvas 项目无法共享给 Team
- 团队成员无法看到团队其他成员的 Canvas 项目
- Team 权限（owner/admin/member）与 Canvas 操作权限未打通

Sprint 23 E3 Firebase Cursor Sync 为实时协作打下基础，但 Canvas 共享层仍是空白。

**影响范围**: 企业用户，团队协作场景

**根因**:
```
根因: Teams API 与 Canvas 共享能力断裂
证据:
- CHANGELOG S14 E6: Teams API 完整实现（Sprint 13-14）
- CHANGELOG S7 E3: Teams Dashboard UI 完成
- 无 "Canvas 共享" 相关 CHANGELOG 条目
- FEATURE_REQUESTS.md FR-004 P1，未解决
- S23 E3 RemoteCursor 完成后，Canvas 共享成为最后缺失环节
```

**验收标准**:
- [ ] Canvas 项目可分享给 Team（基于现有 Teams API）
- [ ] Team 成员列表页面可查看团队项目
- [ ] Team 权限（owner/admin/member）在 Canvas 操作中生效
- [ ] Team 分享后的 Canvas 项目有 team badge 标识
- [ ] `data-testid="share-to-team-btn"` / `data-testid="team-project-badge"` 存在
- [ ] `pnpm run build` → 0 errors

---

## 3. 相关文件

- CHANGELOG.md: Sprint 1-24 全量交付追踪
- FEATURE_REQUESTS.md: FR-001/FR-003/FR-004/FR-009/FR-010 未解决
- `vibex-fronted/src/components/onboarding/`: Onboarding 目标位置
- `vibex-fronted/src/components/templates/`: 模板库现有组件
- `vibex-fronted/src/hooks/useVersionHistory.ts`: 单项目版本历史
- `vibex-fronted/src/lib/reviewDiff.ts`: diff 算法（S23 E2）
- `vibex-backend/src/routes/v1/teams/`: Teams API（Sprint 13-14）
- `vibex-fronted/src/components/dashboard/`: Dashboard 组件

---

## 4. 风险矩阵

| 提案 | 风险项 | 可能性 | 影响 | 缓解方案 |
|------|--------|--------|------|----------|
| P001 | Onboarding 与模板绑定增加耦合 | 低 | 中 | 先做 Onboarding 框架，再接入模板推荐 |
| P002 | 跨 Canvas diff 数据层设计新 | 中 | 中 | 降级：先做 JSON 结构 diff，不做语义对比 |
| P003 | Sprint 24 状态不可见 | 高 | 中 | 通过 CHANGELOG 更新倒推，先验证 Sprint 24 是否真正执行 |
| P004 | Dashboard 搜索影响性能 | 低 | 低 | debounce 300ms，客户端过滤 |
| P005 | Teams API × Canvas 共享复杂度高 | 高 | 高 | 先复用现有 Teams API，仅做权限绑定，不新建 API |

---

## 5. 工期估算

| 提案 | 预估工时 | 复杂度 | 依赖 | Sprint 建议 |
|------|----------|--------|------|-------------|
| P001 | 4-6h | 中 | S23 E5 模板库 | Sprint 25 Week 1 |
| P002 | 3-5h | 中 | S23 E2 diff | Sprint 25 Week 1-2 |
| P003 | 2-4h | 低 | S24 完成状态 | Sprint 25 Week 1（并行） |
| P004 | 2-3h | 低 | 无 | Sprint 25 Week 2 |
| P005 | 4-6h | 高 | S13 Teams API | Sprint 25 Week 2（需 Architect 设计） |

**总工时**: 约 6-8 人日

---

## 6. 执行决策

- **决策**: 待评审
- **执行项目**: vibex-proposals-sprint25
- **执行日期**: 待定
- **执行顺序**: P003（P001 并行）→ P001/P002 → P004/P005

---

*生成时间: 2026-05-03 09:32 GMT+8*
*Analyst Agent | VibeX Sprint 25*