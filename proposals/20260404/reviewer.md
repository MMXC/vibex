# Reviewer 提案 — 2026-04-04

**Agent**: reviewer
**日期**: 2026-04-04
**项目**: vibex-proposals-20260404
**仓库**: /root/.openclaw/vibex
**分析视角**: Reviewer — 代码审查质量门禁 + 流程效率优化

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | process | 重复 Slack 通知去重 | team-tasks | P1 |
| P002 | quality | Dev 任务完成验证缺失 | 开发流程 | P1 |
| P003 | quality | 幻影任务检测与清理 | team-tasks | P2 |
| P004 | process | Reviewer Changelog 职责标准化 | 审查流程 | P1 |

---

## 2. 提案详情

### P001: 重复 Slack 通知去重机制

**分析视角**: Reviewer — 收到大量重复的 task ready 通知

**问题描述**:
同一个小羊的同一个任务被多次通知到 #reviewer-channel。例如 `reviewer-push-E5-快捷键配置` 在 5 分钟内收到 3 次相同的 ready 通知。重复通知导致：
1. Reviewer 每次都要检查状态是否为重复
2. 心跳扫描资源浪费
3. 小羊收到大量噪音通知

**根因分析**:
team-tasks 在每次任务状态变更时都会触发 Slack 通知。如果 coord 心跳或任务管理器在同一任务上多次更新状态，会产生重复通知。另外，coordinator 可能在任务未真正完成时就触发了多个 agent 的通知。

**影响范围**:
所有 agent 的通知体验，team-tasks 整体可用性

**建议方案**:
1. team-tasks 增加通知去重窗口期（5 分钟内同一任务只发一次通知）
2. 或在任务描述中加入 `last_notified` 时间戳，避免重复通知
3. 通知消息内容精简（只发 task_id 和状态，不发完整任务描述）

**验收标准**:
- 同一任务 5 分钟内多次状态变更只发 1 条 Slack 通知
- 可通过 `grep "ready" slack-history` 验证通知去重

---

### P002: Dev 任务完成验证 — 代码提交门禁

**分析视角**: Reviewer — 发现 dev 标记 done 但无代码 commit

**问题描述**:
今天发现 `vibex-pm-proposals/reviewer-E5-快捷键配置` 被 dev 标记为 done，但对应的 E5 功能没有任何代码 commit。Reviewer 在审查时发现只有 spec 文档，没有实现代码。

这种情况浪费了 tester 和 reviewer 的时间（tester 测试了空功能，reviewer 需要驳回）。

**根因分析**:
team-tasks 的 dev 任务状态变更只需要调用 `task update <project> dev-E5 done`，没有任何代码层面的验证：
- 没有检查是否有对应的 git commit
- 没有检查 commit message 是否包含 Epic 标识
- tester 依赖于 dev 的 done 状态，但没有前置验证

**影响范围**:
所有项目的开发流程，特别是快速迭代期

**建议方案**:
1. **轻量方案**: team-tasks 记录 `last_commit` 字段，dev 标记 done 时要求 commit hash 与上次不同
2. **中量方案**: 在 `IMPLEMENTATION_PLAN.md` 中记录每个 Epic 的 commit hash，done 时对比
3. **重量方案**: 在 team-tasks 的 `dev-*` 状态变更时，扫描 git log 确认有对应 commit

**验收标准**:
- Dev 标记 done 后，Reviewer 可直接通过 `git log --oneline` 验证是否有新 commit
- 无 commit 的 dev done 应被 team-tasks 拒绝或警告

---

### P003: 幻影任务检测与清理

**分析视角**: Reviewer — heartbeat 扫描报告不存在的任务

**问题描述**:
Reviewer heartbeat 扫描多次发现 phantom tasks（心跳报告显示存在但 team-tasks 系统中查不到）：
- `vibex-canvas-checkbox-dedup` (6 tasks)
- `vibex-domain-model-full-flow-check-fix-v2` (2 tasks)

这些 phantom tasks 可能是：
1. 已取消但 heartbeat 缓存未清理
2. 跨团队的幽灵项目引用
3. team-tasks 系统与心跳扫描的数据不一致

**根因分析**:
心跳脚本扫描 `team-tasks/projects/` 目录下的 JSON 文件，但可能在以下情况产生幻影：
- 临时文件未清理
- team-tasks 的 project list 和实际文件不同步
- 其他 agent 创建了项目但未正确注册到 team-tasks

**影响范围**:
心跳报告准确性，可能影响 coord 的决策质量

**建议方案**:
1. team-tasks 增加 `projects INDEX` 命令，列出所有注册项目
2. 心跳扫描前先验证项目文件是否存在
3. 定期清理 30 天以上未更新的项目

**验收标准**:
- heartbeat 报告的任务 100% 在 team-tasks 中存在
- 可通过 `find team-tasks/projects -mtime +30` 检查长期未更新的项目

---

### P004: Reviewer Changelog 职责标准化

**分析视角**: Reviewer — Changelog 补全是 Reviewer 的职责，不是 Dev

**问题描述**:
今天处理多个项目的 E1-E5 审查时，发现许多 commit 虽然包含代码但 changelog（CHANGELOG.md、fed CHANGELOG.md、page.tsx）缺失。这导致：
1. Reviewer 需要花时间补全 changelog
2. 如果 Reviewer 不补全，功能变更无法追溯
3. Dev 可能认为 changelog 是 Reviewer 的工作，产生了依赖关系混淆

**根因分析**:
当前约定（根据 AGENTS.md 和本项目实践）：
- Dev 负责功能代码 commit
- Reviewer 负责 changelog 补全（这是 Reviewer 的标准职责）
- Changelog 更新通过单独的 commit 完成

这个模式本身是合理的，但需要明确文档化，避免 Dev 误以为自己需要写 changelog。

**影响范围**:
整个团队的 changelog 维护流程

**建议方案**:
在 `AGENTS.md` 或 `CHANGELOG_CONVENTION.md` 中明确：
1. **Changelog 补全是 Reviewer 的职责**
2. Dev 的 commit 不需要包含 changelog（除非是纯文档变更）
3. Reviewer 在审查通过后负责更新 root CHANGELOG.md + fed CHANGELOG.md + page.tsx
4. Changelog commit message 格式：`docs(changelog): add <project> <Epic> entry`

**验收标准**:
- 每个 Epic 审查通过后，Reviewer 都会更新 3 个 changelog 文件
- changelog commit 与功能 commit 分离，格式规范

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| reviewer-E4-ComponentConfirm | checkbox-persist-bug | ✅ PASSED | `f34702e1` + `b7ab7762` |
| reviewer-push-E4-ComponentConfirm | checkbox-persist-bug | ✅ PASSED | changelog补全 |
| reviewer-push-E1-TypeScript | vibex-dev-proposals | ✅ PASSED | `b304f3e3` |
| reviewer-E2-项目模板 | vibex-pm-proposals | ✅ PASSED | `bf1e9cec` + `5343de97` |
| reviewer-E1-新手引导 | vibex-pm-proposals | ✅ PASSED | `d55d9996` + `6f1546d6` |
| reviewer-E3-统一交付中心 | vibex-pm-proposals | ✅ PASSED | `0ad59199` + `fb31ed6a` |
| reviewer-E4-项目浏览优化 | vibex-pm-proposals | ✅ PASSED | `8f8eaa79` + `5a418b9b` |
| reviewer-E5-快捷键配置 (x2) | vibex-pm-proposals | ✅ PASSED (after resubmit) | `a81a1cbd` + `e2bd00dc` |
| proposal-reviewer | vibex-proposals-20260404 | ✅ DONE | 本提案 |

---

## 4. 做得好的

1. **快速驳回 + 重试**: E5 pm-proposals 第一次无 commit 立即驳回，dev 补货后快速通过
2. **批量处理**: 小羊批量唤醒多个 Epic 时，按项目分组批量审查，效率最高
3. **Sub-agent 并行化**: 复杂项目使用 sub-agent 并行审查多个 Epic

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | 重复 Slack 通知 | team-tasks 去重窗口期 |
| 2 | Dev 无代码标记 done | team-tasks 增加 commit 验证 |
| 3 | 幻影任务干扰心跳 | team-tasks INDEX + 定期清理 |
| 4 | Changelog 职责文档化 | 在 AGENTS.md 中明确 Reviewer 职责 |
