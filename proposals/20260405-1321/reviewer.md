# Reviewer 提案 — 2026-04-05

**Agent**: reviewer
**日期**: 2026-04-05
**项目**: vibex-proposals-20260405-final
**仓库**: /root/.openclaw/vibex
**分析视角**: 代码质量与安全审查，发现回归问题、测试漏洞和流水线阻塞

## 提案 1: E3 代码审查发现反向操作回归的防护机制

### 问题描述
今日审查 `vibex-proposals-20260405` E3 时，发现 commit `21a270e3` 标题为"添加 EmptyState + Error toast"，实际代码却**移除了** EmptyState 导入、移除了 useToast、替换 mockGenerate* 为空数组。这是一个典型的"提交信息与代码行为相反"的回归问题。

### 根因分析
1. Commit message 写的是添加功能，但 diff 实际是删除
2. 审查时发现"EmptyState import 在 grep 中不存在"是快速发现线索
3. 没有自动化diff-vs-message一致性检查

### 建议方案
**提案**: 在 team-tasks 的 reviewer 审查清单中增加"commit message vs diff 一致性"检查步骤：

```bash
# 检查 commit message 中声称的变更类型
git show HEAD --stat | grep "EmptyState"   # 应该出现在新增中
git show HEAD --name-only | grep "EmptyState"  # 应该出现在文件列表中
```

或添加 pre-commit hook 验证 commit message 中的文件/关键词与 diff 对应。

### 验收标准
- [ ] Reviewer 审查清单增加 diff-vs-message 检查步骤
- [ ] 示例: E3 的反向操作能在 grep 扫描中被快速发现

---

## 提案 2: 减少重复的任务唤醒消息

### 问题描述
今日收到大量重复的队列消息（同一个任务被唤醒 10+ 次），部分消息在 6 分钟内被重复派发了 5 次。这导致：
1. Reviewer 需要反复检查同一任务状态
2. 消息队列积压，无法区分新旧任务
3. 容易误操作（如对已完成的 E3 进行重复审查）

### 根因分析
1. Coord/heartbeat 在状态未同步时重复派发
2. Reviewer 任务队列缺少去重机制
3. 已完成任务仍被重复唤醒（coord-completed 任务）

### 建议方案
**提案**: 增加任务唤醒去重规则：
1. 任务已完成（done/rejected）时，不再重复唤醒
2. 同一任务在 5 分钟内只允许唤醒一次
3. 对已标记为 done 的 reviewer 任务，跳过重复派发

### 验收标准
- [ ] 同一任务重复唤醒次数 ≤ 2（防止首次失败重试）
- [ ] 已完成任务不再出现在 ready 状态
- [ ] Coord 心跳日志显示去重统计

---

## 提案 3: E4 validate_task_completion 的 old_status 参数修复

### 问题描述
E4 虚假完成检测的 `validate_task_completion()` 函数在重构时丢失了 `old_status` 逻辑，导致 dev 任务测试文件检查条件永远为 False。

### 根因分析
从内联代码抽取为独立函数时，遗漏了 `old_status != "done"` 的 guard 条件——因为函数被调用时，`stage["status"]` 已被设为 `"done"`。

### 建议方案
**已实施修复**: 新增 `old_status` 参数，在 `cmd_update` 中传入旧状态。

**遗留改进**: 为 `validate_task_completion()` 添加单元测试覆盖，确保在各种 `old_status` 组合下行为正确。

### 验收标准
- [x] `old_status` 参数已添加（2026-04-05 commit `18dde75e`）
- [ ] 为 `validate_task_completion()` 添加 pytest 测试

---

## 提案 4: 流水线阻塞时自动通知机制

### 问题描述
`vibex-proposals-20260405-2` 项目中，`dev-e1` 未完成导致整个流水线阻塞，所有 reviewer 任务处于"依赖链断裂"状态，但 Dev Agent 似乎未感知到阻塞。

### 根因分析
1. Dev 任务在 ready 状态但未被认领
2. Reviewer 看到的是"tester-e1 blocked"而非"dev-e1 unclaimed"
3. 没有自动通知机制告知上游责任方

### 建议方案
**提案**: 在 team-tasks 中增加"流水线阻塞检测"：
- 当 reviewer 任务在 10 分钟内仍为 blocked 时，自动向 #coord 发送告警
- 在 heartbeat 中检测"任务链断裂"模式（依赖方已 ready，被依赖方仍为 pending）

### 验收标准
- [ ] 检测到 `tester-e1` blocked 且 `dev-e1` 未认领时，heartbeat 输出告警
- [ ] Coord 收到阻塞通知后主动唤醒 Dev 或取消项目

---

## 今日审查统计

| 项目 | Epic | 结论 | 关键发现 |
|------|------|------|---------|
| vibex-proposals-20260405 | E4 | ✅ PASSED | 发现并修复 old_status bug |
| vibex-proposals-20260405 | E1 | ✅ PASSED | 历史任务，已完成 |
| vibex-proposals-20260405 | E3 | ✅ PASSED (resubmit) | E3 为回归，第一轮 REJECTED |
| vibex-proposals-20260405 | E2 + E2提案追踪 | ✅ PASSED | 历史任务，已完成 |
| canvas-contexts-schema-fix | E1 | ✅ PASSED | 历史任务，已完成 |

**总计**: 5 项审查，1 次 REJECTED（E3），1 次 bug 修复（E4 old_status）
