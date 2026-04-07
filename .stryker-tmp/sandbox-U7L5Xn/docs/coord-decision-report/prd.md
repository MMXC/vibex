# PRD: Coord Decision Report 命令

> **项目**: coord-decision-report
> **创建日期**: 2026-03-30
> **类型**: 工具开发
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
Coord 每 5 分钟运行心跳，需要快速获取三个决策答案，但现有脚本提供大量无关数据（CPU/内存/disk），真正决策信息缺失。

### 目标
- **效率**: 30 秒内做出下一步判断
- **精准**: 只提供决策必需信息
- **可操作**: 每条建议都有明确行动

### 关键指标
| 指标 | 目标 |
|------|------|
| 执行时间 | < 2s |
| 决策准确率 | ≥ 90% |
| 命令退出码 | 0 |

---

## 2. Epic 拆分

### Epic 1: Ready 决策引擎

**目标**: 扫描 pending 任务，基于 DAG 依赖判断哪些可以立即执行

**故事点**: 1h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F1.1 | Ready 任务判定 | 筛选 `status=pending` 且 `dependsOn` 全部 `done` 的任务 | `expect(is_ready(task)).toBe(true)` | P0 |
| F1.2 | 等待时长计算 | 计算 `等待时长 = now - MAX(dependsOn.completedAt)` | `expect(wait_duration).toBeGreaterThanOrEqual(0)` | P0 |
| F1.3 | 执行者匹配 | 根据 `agent` 字段确定任务执行者 | `expect(assigned_agent).toBe('dev'|'pm'|...)` | P1 |
| F1.4 | 优先级排序 | 按项目优先级排序 Ready 任务 | `expect(sorted_tasks[0].priority).toBeHighest()` | P1 |

**DoD for Epic 1**:
- [ ] Ready 任务判定逻辑正确
- [ ] 等待时长计算正确
- [ ] 输出包含任务 ID、建议操作

---

### Epic 2: 阻塞根因分析

**目标**: 检测阻塞任务并分类根因

**故事点**: 0.5h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F2.1 | 超时任务检测 | 检测 `status=in-progress` 但超时的任务 | `expect(timeout_tasks.length).toBeGreaterThanOrEqual(0)` | P0 |
| F2.2 | Agent 活跃检查 | 检查 agent 是否仍活跃（通过心跳会话） | `expect(agent_alive).toBe(true\|false)` | P1 |
| F2.3 | 根因分类 | 分类：agent 挂了 / 依赖未完成 | `expect(root_cause).toBeIn(['agent_down', 'dep_pending'])` | P1 |

**DoD for Epic 2**:
- [ ] 超时任务能正确检测
- [ ] 根因分类准确
- [ ] 输出包含阻塞原因

---

### Epic 3: 空转提案推荐

**目标**: 无 ready 任务时，推荐优先提案

**故事点**: 1h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F3.1 | 提案扫描 | 扫描 `proposals/` 目录 | `expect(proposals.length).toBeGreaterThan(0)` | P0 |
| F3.2 | Ranking 算法 | 综合 proposer 多样性 + 成本 + 战略价值 | `expect(top3.length).toBe(3)` | P0 |
| F3.3 | 确定性规则 | 提供确定性规则文档，避免主观性 | `expect(rules_doc).toBeDefined()` | P1 |

**DoD for Epic 3**:
- [ ] 提案 Top3 正确输出
- [ ] Ranking 算法有文档
- [ ] 无提案时输出 "无提案"

---

### Epic 4: CLI + 格式化

**目标**: 提供命令行接口和多种输出格式

**故事点**: 0.5h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F4.1 | 纯文本默认输出 | cron 日志可读格式 | `expect(output).toContain('建议')` | P0 |
| F4.2 | JSON 可选输出 | `--json` 输出 valid JSON | `expect(JSON.parse(output)).toBeValid()` | P1 |
| F4.3 | 向后兼容 | 不破坏现有子命令 | `expect(task_manager.py -h).toContain('decision-report')` | P0 |

**DoD for Epic 4**:
- [ ] 默认输出可读
- [ ] JSON 输出 valid
- [ ] 帮助文档正确

---

## 3. 数据源

| 数据 | 来源 | 格式 |
|------|------|------|
| 活跃任务 | tasks.json | JSON |
| 依赖关系 | tasks.json.dependsOn | Array |
| 提案库 | proposals/ | Markdown |
| 心跳计数 | .heartbeat_count | 文件 |

---

## 4. 验收标准汇总

### P0
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | Ready 任务 | 执行命令 | 输出包含 "do it now" / "skip" / "lower priority" |
| AC1.2 | 等待时长 | 任务 pending | 计算值 ≥ 0 |
| AC2.1 | 超时任务 | 存在超时 in-progress | 输出阻塞原因 |
| AC3.1 | 提案扫描 | proposals/ 有内容 | 输出 Top3 |
| AC4.1 | 命令执行 | `task_manager.py decision-report` | 退出码 = 0 |
| AC4.2 | 执行时间 | 命令运行 | < 2s |

### P1
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.3 | agent 字段为空 | 任务无 agent | 输出 "unassigned" |
| AC2.2 | Agent 活跃检查 | 心跳会话丢失 | 降级为 "unknown" |
| AC3.2 | Ranking 算法 | 无提案 | 输出 "无提案" |
| AC4.3 | JSON 输出 | `--json` 参数 | valid JSON 可解析 |

---

## 5. 明确排除项

| 排除项 | 原因 |
|--------|------|
| 系统资源（CPU/内存/磁盘） | 与决策无关 |
| completed/terminated 数量 | 不影响决策 |
| 服务器 uptime | 与决策无关 |
| 虚假完成检测 | 由 dev 环节保证 |

---

## 6. 非功能需求

| 需求 | 标准 |
|------|------|
| 性能 | 执行时间 < 2s |
| 依赖 | 仅使用现有 psutil（已有） |
| 兼容性 | 向后兼容现有子命令 |

---

## 7. 工作量估算

| Epic | 工时 |
|------|------|
| Epic 1: Ready 决策引擎 | 1h |
| Epic 2: 阻塞根因分析 | 0.5h |
| Epic 3: 空转提案推荐 | 1h |
| Epic 4: CLI + 格式化 | 0.5h |
| **总计** | **3h** |

---

## 8. 快速验收单

```bash
# 命令存在
task_manager.py decision-report --help

# 执行成功
task_manager.py decision-report; echo $?

# 执行时间
time task_manager.py decision-report

# JSON 输出
task_manager.py decision-report --json | jq .
```

---

**文档版本**: v1.0
**下次审查**: 2026-03-31
