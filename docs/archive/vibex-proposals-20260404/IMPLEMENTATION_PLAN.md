# Implementation Plan — vibex-proposals-20260404

**项目**: vibex-proposals-20260404
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex
**总工时**: 13-17h（4 Sprint）

---

## ✅ Sprint 总览

| Sprint | 日期 | Epic | 工时 | 目标 |
|--------|------|------|------|------|
| Sprint 1 | Day 1 | E1: 任务质量门禁 | 3-4h | 消除虚假完成 |
| Sprint 2 | Day 1-2 | E2: Canvas UX 修复 | 4-5h | 消除白屏 |
| Sprint 3 | Day 2-3 | E3: 提案流程优化 | 5-6h | 标准化提案 |
| Sprint 4 | Day 3 | E4: 通知体验优化 | 1-2h | 减少噪音 |

---

## Sprint 1: E1 — 任务质量门禁（3-4h）

### 负责人
Dev Agent

### 目标
消除任务虚假完成，建立 commit hash + 测试覆盖率双重门禁。

### 任务分解

| 任务 | 描述 | 工时 | 依赖 |
|------|------|------|------|
| E1-T1 | 修改 `task_manager.py` — 新增 commit hash 记录 | 1h | 无 |
| E1-T2 | 修改 `task_manager.py` — 重复 done 警告逻辑 | 0.5h | E1-T1 |
| E1-T3 | 修改 `task_manager.py` — Dev 任务测试文件检查 | 1h | E1-T1 |
| E1-T4 | 编写 `test_task_manager.py` 单元测试 | 1h | E1-T1,T2,T3 |

### 交付物
- `~/.openclaw/skills/team-tasks/scripts/task_manager.py`（已修改）
- `vibex/skills/team-tasks/scripts/test_task_manager.py`（新增）

### 验收检查点
- [x] `task update X Y done` 后 task JSON 中存在 `commit` 字段（40字符 SHA-1）
- [x] 重复 done 无新 commit 时输出警告（不阻塞）
- [x] Dev 任务 done 无测试文件变更时输出警告
- [x] pytest 覆盖率 > 80%

---

## Sprint 2: E2 — Canvas UX 修复（4-5h）

### 负责人
Dev Agent

### 目标
消除 Canvas 页面加载白屏/闪烁，增加快捷键帮助面板。

### 任务分解

| 任务 | 描述 | 工时 | 依赖 |
|------|------|------|------|
| E2-T1 | 创建 `CanvasSkeleton.tsx` 骨架屏组件 | 1h | 无 |
| E2-T2 | 修改 `CanvasPage.tsx` — 外层包裹 Suspense | 0.5h | E2-T1 |
| E2-T3 | 修改 `canvasStore` / `useSessionStore` — 新增 isLoading 状态 | 0.5h | 无 |
| E2-T4 | 创建 `ShortcutHelpPanel.tsx` 组件 | 1.5h | E2-T2 |
| E2-T5 | 绑定 `?` 键快捷键到 HelpPanel 切换 | 0.5h | E2-T4 |
| E2-T6 | Playwright E2E 测试：skeleton + 消失 + 快捷键 | 1h | E2-T1,T4 |

### 交付物
- `vibex-fronted/src/components/canvas/CanvasSkeleton.tsx`（新增）
- `vibex-fronted/src/components/canvas/ShortcutHelpPanel.tsx`（新增）
- `vibex-fronted/src/app/canvas/CanvasPage.tsx`（已修改）
- `vibex-fronted/src/lib/canvas/__tests__/canvasSkeleton.test.tsx`（新增）
- `vibex-fronted/src/lib/canvas/__tests__/shortcutHelpPanel.test.tsx`（新增）

### 验收检查点
- [x] Playwright: `/canvas` 加载时 skeleton 可见（<500ms）
- [x] Playwright: 数据加载完成后 skeleton 消失（<30s）
- [x] Playwright: 按 `?` 键 HelpPanel 显示，再次按隐藏
- [x] HelpPanel 列出至少 5 个快捷键

---

## Sprint 3: E3 — 提案流程优化（5-6h）

### 负责人
Dev + Reviewer Agent

### 目标
标准化提案模板，建立优先级算法，明确 Changelog 职责边界。

### 任务分解

| 任务 | 描述 | 工时 | 依赖 |
|------|------|------|------|
| E3-T1 | 创建 `proposals/TEMPLATE.md` 强制模板 | 0.5h | 无 |
| E3-T2 | 创建 `proposals/priority_calculator.py` 优先级算法 | 1.5h | 无 |
| E3-T3 | 修改 `task_manager.py` — 提案提交章节完整性校验 | 1h | E3-T1 |
| E3-T4 | 更新 `AGENTS.md` — 明确 Changelog 职责边界 | 0.5h | 无 |
| E3-T5 | 编写 `test_priority_calculator.py` 单元测试 | 0.5h | E3-T2 |
| E3-T6 | 验证所有提案目录下存在 `TEMPLATE.md` 引用 | 0.5h | E3-T1 |

### 交付物
- `vibex/proposals/TEMPLATE.md`（新增）
- `vibex/proposals/priority_calculator.py`（新增）
- `vibex/AGENTS.md`（已更新）
- `vibex/proposals/test_priority_calculator.py`（新增）

### 验收检查点
- [x] `TEMPLATE.md` 包含所有强制章节
- [x] `priority_calculator.py` P0/P1/P2 边界正确（边界用例测试通过）
- [x] `task_manager.py` 对 `proposal-*` 任务拒绝无模板章节的提案
- [x] `AGENTS.md` 包含 Changelog 章节，明确 Dev 写代码、Reviewer 补 changelog

---

## Sprint 4: E4 — 通知体验优化（1-2h）

### 负责人
Dev Agent

### 目标
5分钟窗口内相同消息不重复发送。

### 任务分解

| 任务 | 描述 | 工时 | 依赖 |
|------|------|------|------|
| E4-T1 | 修改 `slack_notify_templates.py` — 实现 `_should_send` 去重逻辑 | 0.5h | 无 |
| E4-T2 | 修改 `slack_notify_templates.py` — `send_slack` 调用去重检查 | 0.5h | E4-T1 |
| E4-T3 | 编写 `test_slack_notify.py` 单元测试（首次/重复/超时场景） | 0.5h | E4-T2 |

### 交付物
- `~/.openclaw/skills/team-tasks/scripts/slack_notify_templates.py`（已修改）
- `vibex/skills/team-tasks/scripts/test_slack_notify.py`（新增）

### 验收检查点
- [x] 首次调用 `send_slack` → 真实调用 Slack API
- [x] 5分钟内相同消息再次调用 → 跳过，返回 `{skipped: true}`
- [x] 5分钟后相同消息调用 → 再次发送
- [x] pytest 覆盖率 > 80%

---

## 执行检查清单

### Sprint 1 前置
- [x] 读取 `specs/epic1-task-quality-gate.md`
- [x] `git status` 确认无未提交更改

### Sprint 2 前置
- [x] 确认 `CanvasSkeleton.tsx` 组件设计通过 review
- [x] `git stash` 应用 E1 更改（E1/E2 并行开发时隔离）

### Sprint 3 前置
- [x] `proposals/TEMPLATE.md` 通过 PM 审批
- [x] `priority_calculator.py` 通过 Architect review

### Sprint 4 前置
- [x] `slack_notify_templates.py` 架构 review 通过
- [x] `SLACK_BOT_TOKEN` 环境变量已配置

### Sprint 间
- [x] 每个 Epic 完成时运行 `pytest` 全量测试
- [x] 每个 Epic 完成时更新 `CHANGELOG.md`

---

## 回滚计划

| Epic | 回滚方式 | 影响范围 |
|------|---------|---------|
| E1 | `git revert` 最近 commit | task_manager.py 逻辑 |
| E2 | `git revert` 最近 commit | CanvasPage.tsx, CanvasSkeleton.tsx |
| E3 | 删除新增文件 + git revert AGENTS.md | proposals/TEMPLATE.md, priority_calculator.py |
| E4 | `git revert` 最近 commit | slack_notify_templates.py |

---

*本文档由 Architect Agent 生成于 2026-04-04 18:25 GMT+8*
