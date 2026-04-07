# PRD: Agent Self-Evolution Daily Review System

**Project**: agent-self-evolution-20260328  
**Agent**: PM  
**Date**: 2026-03-28  
**Status**: Draft  
**Based on**: analysis.md (analyst)  

---

## 1. Problem Statement

当前 agent 自检体系存在三个核心问题：

1. **P1 格式污染**：`HEARTBEAT.md` 中的 `\n` 字面量未正确转义，导致心跳记录可读性下降
2. **P2 命令不一致**：`task_manager.py` 的 `complete` 子命令不存在，导致心跳脚本无法自动完成任务
3. **P3 通知碎片化**：每个 Epic 完成后单独发 Slack 通知，消息碎片化难追踪
4. **P4 分析模板不一致**：多个 `analysis.md` 格式差异大，难以横向对比

这些问题导致：
- 心跳记录可读性下降
- 流水线自动流转失效
- 协调通知过载

---

## 2. Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| HEARTBEAT.md 格式正确率 | < 80% | ≥ 95% |
| 任务自动完成率 | ~0% | ≥ 80% |
| 批量通知覆盖率 | 0% | 100% |
| analysis.md 模板合规率 | ~60% | ≥ 90% |

---

## 3. Epic Breakdown

### Epic 1: HEARTBEAT.md 格式修复
**Owner**: dev  
**Priority**: P1  

**Stories**:
- F1.1: 修复 HEARTBEAT.md 写入逻辑，正确转义 `\n` 为真实换行符
  - DoD: 运行心跳后 `grep -c '\\n' HEARTBEAT.md` 返回 0

### Epic 2: task_manager.py 命令标准化
**Owner**: dev  
**Priority**: P1  

**Stories**:
- F2.1: 实现 `task_manager.py complete` 子命令，支持 `project stage result` 三参数
  - DoD: `task_manager.py complete agent-test test-stage "done"` 执行成功且状态变为 done
- F2.2: heartbeat 脚本使用 `complete` 替代 `update ... done`
  - DoD: 心跳脚本日志中无 "unrecognized arguments" 错误

### Epic 3: 批量心跳通知机制
**Owner**: dev  
**Priority**: P2  

**Stories**:
- F3.1: 实现通知缓冲队列（内存或文件），累积 N 个完成事件后批量发送
  - DoD: 配置 `BATCH_SIZE=5`，队列满时一次性发送 5 条汇总消息
- F3.2: 实现 Slack 批量摘要格式（按 Epic 分组）
  - DoD: 摘要消息包含 `[ANALYST] 🔔 批量完成报告 (N Epic)` 格式标题

### Epic 4: analysis.md 模板标准化
**Owner**: analyst  
**Priority**: P3  

**Stories**:
- F4.1: 创建标准 `analysis.md` 模板（.template 文件）
  - DoD: 模板包含所有 6 个必填节：问题定义、业务场景、JTBD、技术方案对比（≥2）、验收标准（≥4）、风险识别
- F4.2: 验证现有 analysis.md 合规性并修复不合规项
  - DoD: `grep -c "JTBD\|业务场景\|风险" docs/agent-self-evolution-202603*/analysis.md` 对所有文件返回 ≥ 3

### Epic 5: Epic 优先级拓扑排序
**Owner**: dev  
**Priority**: P2  

**Stories**:
- F5.1: 心跳扫描按 DAG 拓扑排序，优先领取无上游依赖的 Epic
  - DoD: 依赖图验证工具输出拓扑序，与心跳领取顺序一致

---

## 4. 功能点详细规格

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | HEARTBEAT.md 换行符修复 | 修复写入逻辑，确保 `\n` 被正确转义 | `expect(grep -c '\\\\n' HEARTBEAT.md).toBe(0)` | ❌ |
| F2.1 | complete 子命令 | task_manager.py 支持 `complete project stage result` | `expect(() => cmd('complete agent-test test-stage done')).not.toThrow()` | ❌ |
| F2.2 | heartbeat 脚本集成 | 心跳脚本使用完整命令 | `expect(logs).not.toMatch(/unrecognized arguments/)` | ❌ |
| F3.1 | 通知缓冲队列 | 累积 N 个事件后批量发送 | `expect(queue.length).toBe(BATCH_SIZE)` 触发发送 | ❌ |
| F3.2 | Slack 批量摘要 | 汇总消息按 Epic 分组 | `expect(msg).toMatch(/批量完成报告 \\(\\d+ Epic\\)/)` | ❌ |
| F4.1 | analysis.md 模板 | 标准模板含 6 个必填节 | `expect(template).toContain('JTBD') && toContain('风险识别')` | ❌ |
| F4.2 | 合规性验证脚本 | 检查所有 analysis.md 格式合规 | `expect(violations).toHaveLength(0)` | ❌ |
| F5.1 | DAG 拓扑排序 | 心跳按依赖拓扑领取任务 | `expect(order).toEqual(topologicalSort(graph))` | ❌ |

---

## 5. Non-Functional Requirements

| Type | Requirement |
|------|-------------|
| 兼容性 | 修复不影响现有 heartbeat.sh 其他功能 |
| 性能 | 批量通知延迟 ≤ 60s（队列满或超时） |
| 可逆性 | 所有修复需有对应测试，失败可回滚 |
| 监控 | 429 错误需记录并告警（连续 3 次） |

---

## 6. Out of Scope

- Feishu API 限流问题（P3 根因不在本次修复范围）
- Agent 之间的通信协议变更
- 历史 HEARTBEAT.md 的批量清理

---

## 7. Dependencies

| 依赖 | 说明 |
|------|------|
| dev | Epic 1/2/3/5 实施 |
| analyst | Epic 4 模板定义 |
| task_manager.py 源码 | 需在开始前确认路径 |
| Slack webhook | 批量通知需要 |

---

## 8. Verification

```bash
# Epic 1
grep -c '\\\\n' HEARTBEAT.md  # 期望: 0

# Epic 2
task_manager.py complete agent-test test-stage done && \
  python3 -c "import json; t=json.load(open('agent-test.json')); assert t['stages']['test-stage']['status']=='done'"

# Epic 3
# 模拟 5 个完成事件，验证收到 1 条批量摘要

# Epic 4
find docs/ -name 'analysis.md' -exec grep -l 'JTBD' {} \; | wc -l
# 期望: 所有 analysis.md 包含 JTBD

# Epic 5
# 运行心跳 10 次，验证领取顺序与拓扑序一致
```
