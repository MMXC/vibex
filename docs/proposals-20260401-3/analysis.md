# Analysis: 2026-04-01 第三批提案综合分析

**Agent**: analyst
**日期**: 2026-04-01
**项目**: proposals-20260401-3
**数据来源**: 积压提案（20260324 未认领）+ Sprint 1/2 执行发现的新痛点

---

## 1. 执行摘要

第三批提案聚焦两类内容：
1. **积压提案**：来自 20260324 的 3 个未认领提案（P0-P2），长期悬而未决
2. **Sprint 执行发现**：Sprint 1/2 执行中新暴露的 3 个横切痛点

**核心结论**：
- 6 条提案（P0 × 1，P1 × 3，P2 × 2）
- 总工时 ~26h
- 3 条可立即并行，2 条依赖 Phase 1 完成，1 条长期规划

---

## 2. 积压提案分析（20260324 遗留）

### 2.1 积压原因

20260324 提案（11 条）从未进入 team-tasks 任务链。根因：
- `EXECUTION_TRACKER.json` 显示全部 11 条提案 `linked: 0`
- 提案收集后未被 coord 决策采纳，导致项目未建立
- 部分提案（proposal-dedup、heartbeat 幽灵任务）质量高但被遗忘

### 2.2 有效积压提案筛选

| ID | 提案 | 优先级 | 当前有效性 | 处理策略 |
|----|------|--------|-----------|----------|
| P0-3 | proposal-dedup 生产验证缺失 | P0 | ✅ 仍然有效 | 直接采用 |
| P1-2 | heartbeat 脚本幽灵任务误报 | P1 | ✅ 部分缓解（通知过滤已做） | 合并到 P1-1 |
| P1-7 | CardTreeNode 单元测试补全 | P1 | ⚠️ 部分覆盖（Epic3 测试修复已覆盖） | 降级为 CI 测试规范 |
| P2-3 | Accessibility 测试基线 | P2 | ✅ 仍然有效 | 保持 P2 |
| P1-4 | confirmationStore 拆分重构 | P1 | ✅ 已由 Sprint 1 间接覆盖 | 关闭 |
| P1-1 | ErrorBoundary 去重 | P1 | ⚠️ Sprint 1 无直接覆盖 | 保留 P1 |
| P1-5 | E2E 纳入 CI | P1 | ✅ Sprint 1 E5 已覆盖 | 关闭 |
| P1-6 | API 错误处理测试 | P1 | ✅ Sprint 1 E7 已覆盖（Zod 校验） | 关闭 |
| P1-8 | HEARTBEAT 话题追踪 | P1 | ⚠️ 部分实现 | 降级为改进建议 |
| P2-1 | Epic4 Undo/Redo | P2 | ✅ 仍然有效 | 保留 P2 |

**有效积压**: 5 条（P0-3, P1-1, P1-2, P2-1, P2-3）

---

## 3. Sprint 执行发现（新痛点）

### 3.1 发现清单

Sprint 1/2 执行中新暴露了 3 个未被任何 Epic 覆盖的问题：

| # | 痛点 | 来源 | 影响 | 优先级 |
|---|------|------|------|--------|
| N1 | Changelog 手动维护负担 | Sprint 2 执行（每次 commit 手动写 CHANGELOG） | dev 效率 | P1 |
| N2 | Toast/Notification 系统缺失 | Sprint 1 E2/E4 无统一通知组件 | 用户体验 | P1 |
| N3 | Svelte 框架导出 | 竞品 v0 已支持 Svelte | 用户覆盖面 | P2 |

### 3.2 Changelog 自动化痛点

Sprint 2 执行期间，dev 每次完成 Epic 都需要手动写 CHANGELOG：
```
docs: add proposals-20260401-2 E1+Vercel changelog entries
docs: add proposals-20260401-2 E3+Zustand changelog entries
docs: add proposals-20260401-2 E4+MultiFramework changelog entries
```

**根因**: 没有 commit message 规范 + changelog 生成工具。

**JTBD**：「作为开发者，我希望 changelog 自动生成，不再花时间手动维护」

---

## 4. 六条提案详情

### 4.1 P0-1: proposal-dedup 机制生产验证

**来源**: 20260324（积压 P0）

**问题**: proposal-dedup 机制从未在生产环境验证。coord 重复派发任务（reviewer-epic4 两次）证明去重机制失效。

**Sprint 1 证据**: reviewer-epic4 被 coord 催办 2 次，原因是任务状态已更新但通知队列未去重。

**方案对比**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 幂等通知 | 通知前检查任务当前状态，与队列中状态对比 | 2h | 状态同步延迟 |
| B: 事件驱动 | task_manager 状态变更触发 webhook，通知服务订阅 | 4h | 架构改动大 |
| C: 简单去重 | CLI 通知命令加 `--dedup` flag，检查最近 5 分钟内相同任务通知 | 1h | 简单但有效 |

**推荐方案 C**（简单去重）：工时 1h，插入现有通知管道。

**验收标准**：
- `proposals-20260401-2` 阶段任务（已执行）无重复通知
- CLI `notify` 命令对相同 task_id 在 5 分钟内不重复发送

---

### 4.2 P1-1: ErrorBoundary 去重

**来源**: 20260324（积压 P1）

**问题**: 项目中多个 ErrorBoundary 组件，行为不一致。部分捕获错误，部分透传到全局。

**Sprint 1 证据**: 测试文件中有 `ErrorBoundary` 相关 mock，说明 ErrorBoundary 在多个位置有不同实现。

**JTBD**：「作为开发者，我希望 ErrorBoundary 行为统一，不需要在每个组件上单独处理错误」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 统一 ErrorBoundary 组件 | 创建 `components/common/AppErrorBoundary`，统一行为 | 2h | 需改动多个文件 |
| B: 错误处理中间件 | 在 API 层统一捕获，提供 fallback UI | 3h | 架构改动大 |

**推荐方案 A**：工时 2h，标准化 ErrorBoundary。

**验收标准**：
- `AppErrorBoundary` 组件存在且统一导出
- 画布页面、导出页面均使用统一 ErrorBoundary
- 错误场景下显示友好 fallback（非白屏）

---

### 4.3 P1-2: heartbeat 幽灵任务 + changelog 自动化

**来源**: 20260324（P1-2 heartbeat）+ Sprint 2 发现（N1 changelog）

**问题 A**: heartbeat 脚本报告幽灵任务（任务已完成但仍显示 active）。

**问题 B**: Sprint 2 执行中每次 commit 需手动维护 CHANGELOG，dev 时间浪费。

**JTBD**：「作为开发者，我希望 CHANGELOG 自动生成，heartbeat 报告准确无误」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: Heartbeat 精确检查 + changelog-gen CLI | 双重保障 | 4h | changelog 格式需规范 |
| B: changelog-gen CLI | 仅解决 changelog 问题 | 2h | heartbeat 幽灵任务继续存在 |
| C: changelog-gen + git hooks | changelog-gen 集成到 commit-msg hook | 3h | hook 安装需开发者配合 |

**推荐方案 A**：工时 4h，一次性解决两个问题。

**Heartbeat 修复**：
- 任务 startedAt 有值但 completedAt 为 null → 检查 task_manager 日志
- 任务 output 文件不存在但状态为 done → 标记为虚假完成

**Changelog 自动生成**：
- 约定 commit message 格式：`type(scope): description`（Angular convention）
- `changelog-gen` CLI 读取 commit history，自动生成 CHANGELOG.md

**验收标准**：
- Heartbeat 报告中无幽灵任务（activeMinutes > 60 但实际已完成）
- `changelog-gen --from=<tag> --to=HEAD` 生成有效 CHANGELOG
- Sprint 3（下一个 sprint）的 CHANGELOG 通过 CLI 生成，无需手动

---

### 4.4 P2-1: Undo/Redo Epic 完成

**来源**: 20260330（P2-1）

**问题**: Epic4 Undo/Redo 功能未完成。canvas-data-model-unification Epic6 合并了 historySlice，但未实现 undo/redo UI。

**Sprint 1 证据**: historySlice 已存在，但用户无法通过快捷键或按钮触发 undo/redo。

**JTBD**：「作为用户，我希望操作有误时可以撤销，不需要刷新页面重来」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: Ctrl+Z/Y 快捷键 | 实现 document.execCommand('undo') 或自定义 | 3h | 历史栈需验证 |
| B: UndoBar UI | 工具栏显示 Undo/Redo 按钮 + 步数计数 | 2h | UI 需集成 |
| C: 完整实现 | 快捷键 + UndoBar + 状态快照 | 5h | 时间较长 |

**推荐方案 C**（完整实现）：工时 5h。与 Sprint 1 E4（ShortcutBar）协同，在 ShortcutBar 上增加 Undo/Redo 按钮。

**验收标准**：
- Ctrl+Z 撤销最近一次操作（节点添加/删除/编辑）
- Ctrl+Y 重做被撤销的操作
- UndoBar 显示可撤销步数
- 最多保留 50 步历史

---

### 4.5 P2-2: Accessibility 测试基线

**来源**: 20260324（积压 P2）

**问题**: VibeX 无 accessibility 测试。用户使用屏幕阅读器时可能遇到障碍。

**Sprint 1 证据**: canvas-three-tree-unification Epic3/Epic4 无 accessibility 相关的测试用例。

**JTBD**：「作为用户，我希望 VibeX 可被辅助技术使用，符合 WCAG 2.1 AA 标准」

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: axe-core 集成 | Playwright + axe-core，CI 中运行 accessibility 测试 | 4h | axe 结果需人工审查 |
| B: 手动 audit | 用 axe DevTools 手动检查主要页面 | 2h | 无自动化回归 |
| C: axe-core + 关键页面 | Playwright 在 CI 运行 axe，focus 在画布和导出页面 | 6h | 全覆盖 |

**推荐方案 B**（手动 audit + 关键页面自动化）：工时 3h。先用 axe DevTools 手动检查 5 个核心页面，建立基线。

**验收标准**：
- 核心页面（Homepage、Canvas、Export）无 Critical/Serious accessibility 违规
- `tests/a11y/canvas.spec.ts` axe 检查存在且 CI blocking
- accessibility 测试报告在 `reports/a11y/` 目录

---

### 4.6 P2-3: Svelte Framework 导出

**来源**: Sprint 2 发现（N3）

**问题**: Sprint 2 E4 完成了 Vue 导出，但 Svelte 用户群体（尤其在东南亚市场）无法使用。

**JTBD**：「作为 Svelte 开发者，我希望 VibeX 能导出我熟悉的框架代码」

**竞品**: v0.dev 支持 Svelte；VibeX 不支持是竞争差距。

**方案**:

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 复用 Vue 映射模式 | Svelte 与 Vue 语法相似，映射表复用度高 | 4h | 组件语义映射困难 |
| B: DSL-based 生成器 | 重构为 AST → 目标框架，通用性强 | 12h | 架构改动大 |
| C: 第三方转换 | 使用 `svelteify` 类工具转换 Vue 输出 | 3h | 转换质量不可控 |

**推荐方案 A**：工时 4h。复用 `components/react2vue/` 的映射模式，创建 `components/react2svelte/`。

**验收标准**：
- 导出面板支持 React/Vue/Svelte 三框架切换
- 基础组件（Button/Input/Card）在 Svelte 下可运行
- 单元测试覆盖率 ≥ 80%

---

## 5. Epic 拆分建议

| Epic | 包含 | 工时 | 优先级 | 并行性 |
|------|------|------|--------|--------|
| Epic1: proposal-dedup + ErrorBoundary | P0-1 + P1-1 | 4h | P0 | 可并行 |
| Epic2: heartbeat + changelog | P1-2 | 4h | P1 | 可并行 |
| Epic3: Undo/Redo | P2-1 | 5h | P1 | 依赖 Sprint 1 E4 ShortcutBar |
| Epic4: Accessibility | P2-2 | 3h | P2 | 可并行 |
| Epic5: Svelte 导出 | P2-3 | 4h | P2 | 可并行 |

**总工时**: 20h

---

## 6. 方案对比

**方案 A（激进合并）**: Epic1（4h）+ Epic2（4h）+ Epic3（5h）= 13h，Epic4+Epic5 延后
✅ 快速消除 Sprint 1 积压问题
❌ P2 方向（Accessibility + Svelte）再等一个 sprint

**方案 B（适度并行）**: 全部 5 个 Epic 并行
✅ 用户覆盖面最大化
❌ Dev 并行负担重（5 条 Epic 同时进行）

**推荐方案 B**（适度并行）：理由：
1. Epic1-3 解决 Sprint 1 积压问题（必须做）
2. Epic4-5 是用户覆盖面扩展（竞品压力）
3. Epic1 与 Epic2 无依赖，可立即并行
4. Epic3 依赖 ShortcutBar（已存在），可快速集成

---

## 7. 验收标准

| Epic | 验收标准 |
|------|----------|
| Epic1 | 相同 task_id 在 5 分钟内不重复通知；AppErrorBoundary 统一导出且无重复实现 |
| Epic2 | Heartbeat 无幽灵任务；`changelog-gen` CLI 生成有效 CHANGELOG |
| Epic3 | Ctrl+Z/Y 快捷键可用；UndoBar 显示步数；最多 50 步 |
| Epic4 | axe 检查无 Critical/Serious 违规；CI blocking 测试存在 |
| Epic5 | 三框架切换可用；Svelte 组件可运行 |

---

## 8. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Epic3 undo 历史栈与 Zustand migration 冲突 | 低 | 高 | Epic2 的 migration 库已建立，测试覆盖 |
| Svelte 映射质量差（第三方生态差异） | 中 | 中 | 先 MVP（Button/Input）再扩展 |
| changelog-gen CLI 格式不规范导致生成失败 | 低 | 中 | 先建立 commit message 规范 |
