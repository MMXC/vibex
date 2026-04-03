# PRD: task_manager.py current-report 命令（决策导向版）

> **项目**: task-manager-current-report
> **创建日期**: 2026-03-30
> **类型**: 功能增强
> **状态**: Draft → Updated 2026-03-30
> **负责人**: PM Agent
> **核心原则**: 报告是给 Coord Agent 自己用的，目标是**够我直接做决策**，不是给人类看的数据看板

---

## 1. 执行摘要

### 背景
Coord Agent 做决策需要三个答案：下一步做什么、有没有卡住、我该不该创建新项目。现有报告（summary 计数、completed 数量、系统资源）对决策无用，是噪音。

### 目标
一条命令输出**最小决策集**：
1. **Ready 任务决策建议** — 该催谁 + 为什么现在做 + 阻塞了多久
2. **阻塞根因** — blocked 是 agent 挂了还是依赖方没完成
3. **空转时的提案推荐** — 连续 N 次空转后，下一个该拉哪个项目

### 成功指标
| 指标 | 目标 |
|------|------|
| Ready 任务显示 | 含"为什么现在做"的决策理由 |
| 阻塞任务 | 含根因（agent 挂了 / 依赖未完成） |
| 空转提案推荐 | 来自提案库 ranked by priority |
| 执行时间 | < 2 秒 |

---

## 2. 决策要素定义

### D1: Ready 任务决策建议（最高优先级）

每个 ready 任务输出：
```
📋 {project}/{task_id}
   → 目标 agent: {agent}
   → 依赖: {dependsOn} (已全部 done)
   → 阻塞: {blocked_by_task_id} (如果有)
   → 等待时长: {waiting_minutes}min
   → 决策建议: {do it now / skip / lower priority}
```

**决策建议生成规则：**
- `do it now`: 依赖链末端，下游所有任务在等
- `skip`: 依赖方还未 done，只是刚好统计窗口内看到
- `lower priority`: 有更高优先级的任务在队列里

### D2: 阻塞根因分析

每个 blocked 任务输出：
```
🔴 {project}/{task_id} blocked
   → 原因: {root_cause}
     - agent 挂了 → 显示 agent 名称 + 最后活跃时间
     - 依赖未完成 → 显示依赖任务 ID + 依赖方的 status
   → 阻塞时长: {blocked_minutes}min
   → 建议动作: {降级 pending / 人工介入 / 等待}
```

### D3: 空转时提案推荐

当 `active=0 且 ready=0` 且连续 N 次空转：
```
🚀 连续{N}次空转，提案库 Top 推荐：
   1. {proposal_name} — {value_proposition} (优先级: {rank})
   2. {proposal_name} — {value_proposition} (优先级: {rank})
   
   输入 y 确认执行，n 跳过
```

**提案 ranking 规则：**
- 来自 `agent-proposals-*` 项目的未完成提案
- 按 proposer agent 评分 + 目标用户数 + 实现成本 综合排序

---

## 3. 功能需求

### F1: Ready 任务决策建议

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F1.1 | 扫描 pending 任务 | 找出 status=pending 且依赖已全部 done 的任务 | `expect(len(ready) >= 0)` |
| F1.2 | 计算等待时长 | `now - max(dependsOn.doneAt)` | `expect(minutes >= 0)` |
| F1.3 | 生成决策建议 | 根据依赖链位置 + 等待时长给出建议 | 输出 `do it now / skip / lower priority` |
| F1.4 | 按优先级排序 | 依赖链末端的优先，显示在下 | 下游任务排前 |

### F2: 阻塞根因分析

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F2.1 | 检测 blocked 任务 | status=blocked 的任务 | `expect(len(blocked) >= 0)` |
| F2.2 | 根因分类 | agent 挂了 vs 依赖未完成 | 分类准确率 100% |
| F2.3 | 活跃时间检测 | agent 最后活跃时间（读 tasks.json startedAt） | `expect(timestamp > 0)` |
| F2.4 | 建议动作生成 | 根因 → 动作映射 | 输出可执行的动作建议 |

### F3: 空转提案推荐

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F3.1 | 提案库扫描 | 扫描 `proposals/` 目录下未完成的提案 | `expect(len(proposals) >= 0)` |
| F3.2 | Ranking 算法 | 按评分 + 用户数 + 成本排序 | top 3 提案合理 |
| F3.3 | 确认机制 | 用户确认后返回项目创建指令 | `expect(y/n input works)` |

### F4: 报告输出格式

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F4.1 | 纯文本输出（默认） | 人类可读，聚焦决策要素 | 30 秒内可做决策 |
| F4.2 | JSON 输出（--json） | 程序可解析 | valid JSON |
| F4.3 | 执行时间 | < 2 秒 | `time.task_manager.current-report < 2s` |

---

## 4. UI/UX 流程

### 默认输出（纯文本）
```
=== Coord Decision Report ===
Generated: 2026-03-30 14:42

--- Ready to Execute ---
📋 task-manager-current-report/design-architecture [architect]
   依赖: create-prd ✅ done
   等待: 23min
   决策: ✅ do it now — 下游 coord-decision 阻塞中

📋 vibex-canvas-redesign/dev-epic1 [dev]
   依赖: coord-decision ✅ done
   等待: 5min
   决策: ✅ do it now — 唯一活跃项目

--- Blocked Tasks ---
🔴 None

--- Idle Projects ---
⏳ 0 active | 📋 0 ready | 连续空转: 3/3
   → 提案库 Top1: canvas-phase2-expand — 三栏全屏展开 [dev]
   → 提案库 Top2: step-context-ui-fix — 上下文面板交互优化 [tester]
   → 输入 y 确认拉起 Top1，n 跳过
```

### --json 输出
```json
{
  "generated_at": "2026-03-30T14:42:00",
  "ready_tasks": [
    {
      "project": "task-manager-current-report",
      "task_id": "design-architecture",
      "agent": "architect",
      "waiting_min": 23,
      "decision": "do it now",
      "reason": "downstream coord-decision blocked",
      "blocked_by": null
    }
  ],
  "blocked_tasks": [],
  "idle": {
    "active": 0,
    "ready": 0,
    "consecutive_idle": 3,
    "top_proposals": [
      {"name": "canvas-phase2-expand", "proposer": "dev", "rank": 1}
    ]
  }
}
```

---

## 5. 不做（明确排除）

以下内容**不在本命令范围内**，原因是"对 Coord 决策无用"：
- ❌ 系统资源（CPU/内存/磁盘）— 给人看的，不是决策依据
- ❌ completed/terminated 项目数量统计 — 刷数量不代表价值
- ❌ 服务器 uptime — 与决策无关
- ❌ false completion 检测（文件是否存在）— 已在 dev 环节保证

---

## 6. Epic 拆分

### Epic 1: Ready 任务决策建议 (P0)
- Story 1.1: 扫描 pending + dependsOn 已 done → ready 列表
- Story 1.2: 计算等待时长 + 依赖链位置
- Story 1.3: 生成 do it now / skip / lower priority 决策建议
- Story 1.4: 按依赖链下游优先排序

### Epic 2: 阻塞根因分析 (P0)
- Story 2.1: 检测 blocked 任务
- Story 2.2: 分类根因（agent 挂了 / 依赖未完成）
- Story 2.3: 生成建议动作

### Epic 3: 空转提案推荐 (P0)
- Story 3.1: 扫描 proposals/ 目录下的未完成提案
- Story 3.2: Ranking 算法实现
- Story 3.3: 输出确认机制

### Epic 4: CLI 集成 + 输出格式化 (P0)
- Story 4.1: 注册 current-report 子命令
- Story 4.2: 纯文本格式化（决策导向）
- Story 4.3: --json 选项

---

## 7. 验收标准

### P0 (必须完成)
- [ ] `task_manager.py current-report` 命令存在且返回 0
- [ ] Ready 任务含"决策建议"字段（do it now / skip / lower priority）
- [ ] Blocked 任务含"根因"字段
- [ ] 空转时显示提案库 Top3
- [ ] 执行时间 < 2 秒

### P1 (应该完成)
- [ ] --json 选项输出 valid JSON
- [ ] 单元测试覆盖核心逻辑

---

## 8. 实施计划

1. **Phase 1**: Epic 1（Ready 决策）+ Epic 4（CLI 基础框架）
2. **Phase 2**: Epic 2（阻塞根因）
3. **Phase 3**: Epic 3（空转提案推荐）

预计总工时: 3h

---

## 9. 变更记录

| 日期 | 变更内容 |
|------|----------|
| 2026-03-30 | v2: 全面重构 PRD，核心原则改为"决策导向"，删除了对 Coord 决策无用的系统资源和 completed 统计，新增 ready 决策建议、阻塞根因、空转提案推荐三大决策要素 |
