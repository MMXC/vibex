# PRD — vibex-proposals-20260404

**Agent**: PM
**日期**: 2026-04-04 18:15
**仓库**: /root/.openclaw/vibex
**基于**: docs/vibex-proposals-20260404/analysis.md（18条提案，聚类为4个Epic）

---

## 执行摘要

### 背景
2026-04-04 每日提案收集共收到 4 个 agent（Analyst/Dev/PM/Reviewer）提交的 18 条提案，经 analyst 聚类分析后形成 16 条有效提案，其中 4 条 P0、10 条 P1、4 条 P2。

### 目标
将 16 条分散提案聚类为 4 个可执行的 Epic，建立从提案到交付的完整流程闭环，覆盖：任务质量门禁（防虚假完成）、Canvas UX 修复（白屏问题）、提案流程标准化、通知体验优化。

### 成功指标
| KPI | 当前 | 目标 |
|-----|------|------|
| 虚假任务完成率 | ~20%（4次虚假完成） | 0% |
| Canvas 白屏时间 | 0-3s 无反馈 | <500ms skeleton 可见 |
| 提案采纳率 | <30% | ≥40% |
| P0 问题响应时间 | >1天 | ≤4h |

---

## Epic 总览

| Epic | 名称 | P0提案 | P1提案 | 工时 | 优先级 |
|------|------|--------|--------|------|--------|
| E1 | 任务质量门禁 | D-P0-1 | R-P1-2 | 3-4h | P0 |
| E2 | Canvas UX修复 | PM-P0-1 | PM-P1-2 | 4-5h | P0 |
| E3 | 提案流程优化 | A-P0-1, A-P0-2 | D-P1-2, R-P1-4 | 5-6h | P1 |
| E4 | 通知体验优化 | — | R-P1-1 | 1-2h | P1 |

**总工时**: 13-17h（约2-3天）

---

## Epic 1: 任务质量门禁

### 概述
防止任务虚假完成。当前 `task_manager.py` 仅记录 `completedAt` 时间戳，Dev/Reviewer 均报告 4 次虚假完成（TESTING_STRATEGY.md、shortcutStore.ts 等）。

### Stories

#### Story E1-S1: 任务完成时记录 commit hash
- **功能描述**: `task update` 执行 done 时，记录当前 git commit hash 到任务 info
- **工时**: 1h
- **验收标准**:
```bash
# 执行 task done 后，任务 JSON 中存在 commit 字段
python3 task_manager.py update <project> <stage> done
# 验证
cat projects/<project>/<stage>.json | python3 -c "import json,sys; d=json.load(sys.stdin); assert 'commit' in d, 'commit field missing'"
```

#### Story E1-S2: 任务完成验证时检查 commit 变更
- **功能描述**: done 时若 commit 与之前相同，提示「无新 commit，请先提交代码」
- **工时**: 1h
- **验收标准**:
```bash
# 已有 commit 的任务再次 done，若无新 commit 应拒绝
# git rev-parse HEAD 结果与 info['commit'] 相同时返回错误
```

#### Story E1-S3: Dev 任务完成后强制验证测试文件变更
- **功能描述**: Dev 任务 done 时，检查 git diff 是否包含 `.test.(ts|tsx)` 文件
- **工时**: 1h
- **验收标准**:
```bash
# Dev 任务完成后，git diff --name-only 至少包含1个测试文件变更
# 若无测试文件变更，输出警告但不阻塞
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | commit hash 记录 | task done 时记录 git hash | expect(commit in info) | 无 |
| E1-F2 | commit 变更验证 | done 时检查是否产生新 commit | expect(same_hash → error) | 无 |
| E1-F3 | 测试文件强制检查 | Dev done 时检查测试文件变更 | expect(test file in diff) | 无 |

### DoD
- [ ] `task_manager.py` 中 `update()` 函数新增 `commit` 字段写入
- [ ] `update()` 执行 done 时调用 `git rev-parse HEAD` 记录 hash
- [ ] 重复 done 时若 hash 未变则返回警告
- [ ] Dev agent 任务 done 时检查 `git diff --name-only` 包含测试文件
- [ ] 单元测试覆盖 commit 记录逻辑

---

## Epic 2: Canvas UX 修复

### 概述
修复 Canvas 页面加载阶段白屏/闪烁问题。gstack 验证确认 `CanvasPage.tsx` 无 Suspense/Skeleton，`canvasStore.ts` 无 isLoading 状态。

### Stories

#### Story E2-S1: Canvas 骨架屏组件
- **功能描述**: 创建 `CanvasSkeleton` 组件，加载中时显示骨架屏
- **工时**: 1h
- **验收标准**:
```typescript
// CanvasSkeleton 组件验收
expect(canvasSkeleton).toBeDefined();
expect(canvasSkeleton.props.testId).toBe('canvas-skeleton');
// 骨架屏包含 canvas 典型结构（header、three-panel、toolbar 占位）
expect(screen.getByTestId('canvas-skeleton-header')).toBeVisible();
expect(screen.getByTestId('canvas-skeleton-tree-panel')).toBeVisible();
```

#### Story E2-S2: CanvasPage Suspense 集成
- **功能描述**: `CanvasPage` 外层包裹 `<Suspense fallback={<CanvasSkeleton />} />`
- **工时**: 1h
- **验收标准**:
```typescript
// Playwright E2E 验收
await page.goto('/canvas');
const skeleton = page.locator('[data-testid="canvas-skeleton"]');
await expect(skeleton).toBeVisible({ timeout: 5000 });
await expect(skeleton).not.toBeVisible({ timeout: 30000 });
```

#### Story E2-S3: 快捷键帮助面板
- **功能描述**: `shortcutStore` 已有快捷键实现，新增 HelpPanel 组件，`?` 键触发
- **工时**: 2h
- **验收标准**:
```typescript
// 按 ? 键打开帮助面板
await userEvent.keyboard('?');
expect(screen.getByTestId('shortcut-help-panel')).toBeVisible();
// 再次按 ? 关闭
await userEvent.keyboard('?');
expect(screen.queryByTestId('shortcut-help-panel')).not.toBeInTheDocument();
// 面板列出至少5个快捷键
const shortcutItems = screen.getAllByTestId('shortcut-item');
expect(shortcutItems.length).toBeGreaterThanOrEqual(5);
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E2-F1 | CanvasSkeleton 组件 | 骨架屏组件 | expect(skeleton visible in test) | 【需页面集成】 |
| E2-F2 | Suspense 集成 | CanvasPage 包裹 Suspense | expect(skeleton → disappear) | 【需页面集成】 |
| E2-F3 | 快捷键帮助面板 | ? 键显示快捷键列表 | expect(panel visible/hidden) | 【需页面集成】 |

### DoD
- [ ] `CanvasSkeleton.tsx` 组件存在，testId 为 `canvas-skeleton`
- [ ] `CanvasPage.tsx` 外层包裹 `<Suspense fallback={<CanvasSkeleton />}>`
- [ ] Playwright E2E 测试覆盖加载流程（skeleton → disappear）
- [ ] `ShortcutHelpPanel.tsx` 组件存在，`?` 键切换显示
- [ ] `ShortcutHelpPanel` 列出的快捷键覆盖：Delete、Backspace、Ctrl+A、Ctrl+Z、?

---

## Epic 3: 提案流程优化

### 概述
标准化提案从提交到评估的完整流程，解决提案质量参差不齐、无优先级排序、无执行追踪的问题。

### Stories

#### Story E3-S1: 提案模板强制化
- **功能描述**: 提供 `proposals/TEMPLATE.md`，task_manager 对提案提交增加 basic validation（章节完整性）
- **工时**: 1h
- **验收标准**:
```bash
# 提案必须包含的章节
grep -E "^## (问题描述|根因|建议方案|验收标准)" proposals/20260404/*.md
# 每个提案文件至少包含4个强制章节
```

#### Story E3-S2: 提案优先级算法
- **功能描述**: 基于影响力（用户数×频次）× 紧急度 × 实现成本自动计算优先级
- **工时**: 2h
- **验收标准**:
```python
# 优先级计算验收
score = impact * urgency / effort
# P0: score > 0.7
# P1: 0.3 < score <= 0.7
# P2: score <= 0.3
assert calculate_priority(impact=9, urgency=9, effort=3) == 'P0'
assert calculate_priority(impact=5, urgency=5, effort=10) == 'P1'
```

#### Story E3-S3: 存量代码继承规范
- **功能描述**: Dev 任务中涉及修改非当前项目文件时，必须新增测试覆盖
- **工时**: 1h
- **验收标准**:
```bash
# 继承代码变更必须产生新的测试文件或测试用例
# 检查: git diff --name-only 包含被修改文件的 .test.(ts|tsx)
```

#### Story E3-S4: Changelog 职责标准化
- **功能描述**: 在 AGENTS.md 中明确 Dev（写功能代码）和 Reviewer（补 changelog）的职责边界
- **工时**: 1h
- **验收标准**:
```bash
# AGENTS.md 包含 Changelog 职责章节
grep -A5 "Changelog" AGENTS.md | grep -E "(Dev|Reviewer)"
# Dev commit 格式: docs(changelog): add <project> <Epic> entry
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E3-F1 | 提案模板 | proposals/TEMPLATE.md | expect(4 sections exist) | 无 |
| E3-F2 | 优先级算法 | P0/P1/P2 自动计算 | expect(calculate_priority works) | 无 |
| E3-F3 | 继承代码规范 | 变更文件有对应测试 | expect(test file in diff) | 无 |
| E3-F4 | Changelog 职责 | AGENTS.md 明确分工 | expect(changelog section exists) | 无 |

### DoD
- [ ] `proposals/TEMPLATE.md` 存在且包含 4 个强制章节
- [ ] `task_manager.py` 对 `proposal-*` 任务增加章节完整性检查
- [ ] `proposals/priority_calculator.py` 实现优先级评分算法，单测通过
- [ ] AGENTS.md 包含 Changelog 职责说明（Dev vs Reviewer 分工）
- [ ] `proposals/TEMPLATE.md` 更新了 P0/P1/P2 字段

---

## Epic 4: 通知体验优化

### 概述
解决 Slack 重复通知问题。Reviewer 提案显示通知去重机制缺失。

### Stories

#### Story E4-S1: Slack 通知去重机制
- **功能描述**: 相同内容和相同目标的通知在 5 分钟内不重复发送
- **工时**: 1h
- **验收标准**:
```python
# 去重验收
cache_key = f"slack:{channel}:{message_hash}"
# 5分钟内相同 key 的通知被跳过
assert should_send_notification(channel, message_hash) == False  # 第二次
# 5分钟后重新发送
time.sleep(310)
assert should_send_notification(channel, message_hash) == True  # 5分钟后
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E4-F1 | 通知去重 | 5分钟相同消息去重 | expect(second skip, after 5min send) | 无 |

### DoD
- [ ] `slack_notify_templates.py` 新增去重逻辑（基于 message hash + timestamp）
- [ ] 去重缓存有效期 5 分钟
- [ ] 单元测试覆盖：首次发送 / 5分钟内重复 / 5分钟后重新发送

---

## 验收标准汇总

### P0 验收（Epic1 + Epic2）

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F1 | `expect('commit' in task_info)` | 单元测试 |
| E1-F2 | `expect(same_hash → error)` | 集成测试 |
| E1-F3 | `expect(test file in diff)` | 集成测试 |
| E2-F1 | `expect(skeleton visible)` | Playwright |
| E2-F2 | `expect(skeleton → disappear)` | Playwright |
| E2-F3 | `expect(panel visible/hidden)` | Playwright |

### P1 验收（Epic3 + Epic4）

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E3-F1 | `expect(4 sections exist)` | 单元测试 |
| E3-F2 | `expect(calculate_priority works)` | 单元测试 |
| E3-F3 | `expect(test file in diff)` | 集成测试 |
| E3-F4 | `expect(changelog section exists)` | 单元测试 |
| E4-F1 | `expect(second skip, after 5min send)` | 单元测试 |

---

## 非功能需求

| 类型 | 要求 |
|------|------|
| 性能 | task update 延迟 < 200ms |
| 兼容性 | task_manager.py 支持 Python 3.8+ |
| 可维护性 | 每个 Epic 独立测试，独立部署 |
| 监控 | 虚假完成次数 > 0 时告警 |

---

## Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 (Day 1) | Epic1: 任务质量门禁 | 3-4h | 消除虚假完成 |
| Sprint 2 (Day 1-2) | Epic2: Canvas UX修复 | 4-5h | 消除白屏 |
| Sprint 3 (Day 2-3) | Epic3: 提案流程优化 | 5-6h | 标准化提案 |
| Sprint 4 (Day 3) | Epic4: 通知体验优化 | 1-2h | 减少噪音 |

---

**PRD 状态**: ✅ 完成
**下一步**: Architect 架构设计 → Dev 实现
