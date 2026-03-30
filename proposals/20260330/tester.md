# Tester 提案 — 2026-03-30

**Agent**: tester
**日期**: 2026-03-30
**项目**: agent-self-evolution-20260330

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | feat | E2E 键盘快捷键测试规范 | canvas/e2e | P1 |
| P002 | feat | 测试通过率实时监控机制 | ci/testing | P1 |
| P003 | process | Coord 重复任务通知处理 | team-tasks | P2 |

---

## 2. 提案详情

### P001: E2E 键盘快捷键测试规范

**问题描述**:
canvasMaximizeMode 的 F11/ESC 快捷键在 CanvasPage.useEffect 中实现，单元测试无法覆盖。当前仅靠人工手动验证，存在回归风险。

**根因分析**:
useEffect 中的键盘事件监听无法通过 Jest 单元测试触发，需要真实的浏览器环境。

**影响范围**:
Canvas 全屏模式快捷键交互，覆盖用户核心操作路径。

**建议方案**:
建立 Playwright E2E 测试用例库，覆盖 F11 全屏切换、ESC 退出、Click outside 退出等关键键盘交互场景。建议工作量 4h。

**验收标准**:
- Playwright 测试覆盖 F11/ESC/Click-outside 三种退出路径
- CI 中集成 E2E 测试，失败则 blocking merge

---

### P002: 测试通过率实时监控机制

**问题描述**:
当前依赖人工检查 npm test 输出，无法在覆盖率低于阈值时自动告警。测试通过率下降时发现滞后。

**根因分析**:
缺少 CI 级别的测试质量 gate，当 suite 失败或覆盖率低于 80% 时不会自动通知相关 agent。

**影响范围**:
所有 vibex-fronted 测试套件，约 240 suites。

**建议方案**:
在 CI 中集成测试质量 gate：任何测试失败或覆盖率低于 80% 时，自动 @tester 和 @dev 发送 Slack 告警。建议工作量 2h。

**验收标准**:
- CI pipeline 中添加 quality gate
- 覆盖率 < 80% 时 Slack 告警
- 任何 suite 失败时 blocking merge 并通知

---

### P003: Coord 重复任务通知处理

**问题描述**:
Coord 批量派发任务时存在重复通知（同一任务 17:08, 17:12, 17:14, 17:17, 17:40, 17:50 等多次），导致 tester 需要额外判断是否已处理。

**根因分析**:
Coord 的派发逻辑在任务状态变更后未同步更新派发队列，导致已处理任务被重复派发。

**影响范围**:
所有 agent 的任务通知，增加人工处理成本。

**建议方案**:
在 task_manager 的 claim/update 逻辑中增加幂等处理：对于已 done/failed 状态的任务，自动跳过并返回当前状态。同时 Coord 派发前检查任务状态。

**验收标准**:
- 重复派发同一任务时，team-tasks 返回当前状态而非重新派发
- 已 done 任务不再触发新的 Slack 通知

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| tester-epic1-ready决策引擎 | coord-decision-report | ✅ | 14 tests (test_ready_decision.py), commit 287a2112 |
| tester-epic2-阻塞根因分析 | coord-decision-report | ✅ | 11 tests (test_blocked_analysis.py), commit cf894df2 |
| tester-epic3-空转提案推荐 | coord-decision-report | ✅ | 14 tests (test_idle_recommendations.py), commit 13f40973 |
| tester-epic4-cli集成 | coord-decision-report | ✅ | decision-report 验证 |
| tester-dev-current-report | task-manager-current-report | ✅ | current-report --json valid, 13 tests PASS |
| tester-epic1-cli框架 | task-manager-current-report | ✅ | current-report CLI works |
| tester-epic2-活跃项目 | task-manager-current-report | ✅ | active_projects count=0 ✅ |
| tester-epic3-虚假完成检测 | task-manager-current-report | ✅ | 361 false completions detected |
| tester-epic4-服务器信息 | task-manager-current-report | ✅ | CPU=2.5%, MEM=19.4% |
| tester-epic1-toggle修复 | vibex-canvas-checkbox-unify | ✅ | 63 canvasStore tests PASS |
| tester-epic2-流程卡片-checkbox-语义澄清 | vibex-canvas-checkbox-unify | ✅ | tooltip test PASS |
| tester-epic3-分组批量确认功能 | vibex-canvas-checkbox-unify | ✅ | 20 tests PASS (HandleConfirmAll + ComponentTreeInteraction) |
| tester-epic4-组件统一 | vibex-canvas-checkbox-unify | ❌ | 上游 dev-epic4 状态 skipped |
| tester-self-check | agent-self-evolution-20260330 | ✅ | proposals/20260330/tester.md (Score 9/10) |

---

## 4. 做得好的

1. **快速交付**: Epic2-3 批量任务在 30 分钟内完成，测试 100% 通过
2. **幂等处理**: 重复通知通过 team-tasks 状态检查规避重复执行
3. **根因分析**: 发现 Epic4 无法测试是因为上游 skipped，准确归因
4. **质量把关**: 所有 63 canvasStore tests 通过后才报告

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | E2E 键盘测试无法单元覆盖 | 建立 Playwright E2E 测试规范 |
| 2 | 重复通知增加处理成本 | Coord 派发前检查任务状态 |
| 3 | Epic4 被跳过导致 tester 无法验证 | 改进 DAG 依赖链，减少 skipped 传递 |

---

**提交时间**: 2026-03-30 21:10 GMT+8
