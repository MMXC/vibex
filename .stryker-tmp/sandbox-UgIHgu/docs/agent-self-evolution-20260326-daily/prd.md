# PRD: Agent Self-Evolution System (Daily)

## 1. 执行摘要

### 背景
当前 agent 团队缺乏系统化的每日自我复盘机制——各 agent 独立运行、缺少横向协作追踪、无法量化改进效果。虚假完成（状态 done 但文件未提交）问题时有发生。

### 目标
建立标准化、可度量的每日自检框架，覆盖 dev/analyst/architect/pm/tester/reviewer 全部 6 个 agent，实现：
- 自检任务自动创建与追踪
- 提案统一收集与归档
- 虚假完成自动检测
- 改进趋势量化追踪

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 自检完成率（每日） | ≥ 6/6 agents |
| 提案收集完整率 | 100%（每个 agent 每天 1 份） |
| 虚假完成发生率 | 0（检测覆盖 100%） |
| 自检报告可机读率 | 100%（含 expect() 格式验收标准） |

---

## 2. 功能需求

### F1: 自检任务生命周期管理

#### F1.1 每日自检任务自动创建
- **触发条件**: `heartbeat-coord` 扫描到当日 `agent-self-evolution-YYYYMMDD-daily` 项目不存在时，自动创建
- **任务结构**: DAG 模式，6 个 agent 自检节点，并行执行，无依赖
- **验收标准**:
  ```python
  expect(project.tasks.filter(agent="dev").status == "ready")
  expect(project.tasks.filter(agent="analyst").status == "ready")
  expect(project.tasks.filter(agent="architect").status == "ready")
  expect(project.tasks.filter(agent="pm").status == "ready")
  expect(project.tasks.filter(agent="tester").status == "ready")
  expect(project.tasks.filter(agent="reviewer").status == "ready")
  ```

#### F1.2 任务状态流转
- 状态: `pending` → `ready` → `in_progress` → `done`
- 任务领取时自动标记 `in_progress`
- **验收标准**:
  ```python
  expect(task.status in ["pending", "ready", "in_progress", "done"])
  expect(task.updated_at > task.created_at)  # 状态有更新
  ```

#### F1.3 任务到期提醒
- 任务创建 30 分钟内未领取 → 发送飞书提醒到对应 agent
- **验收标准**:
  ```python
  # heartbeat-coord 扫描逻辑
  expect(all_overdue_agents_notified == true)
  ```

---

### F2: 标准化自检报告模板

#### F2.1 Agent 自检报告格式
每个 agent 的自检报告必须包含以下章节（格式固定，支持机器解析）：

```
# {Agent} 自检报告 | {YYYY-MM-DD}

## 今日工作统计
| 指标 | 数据 |
|------|------|
| 新建产出 | N |
| 任务完成 | N |
| 提案提交 | N |

## 主要活动
### 1. {活动名称}
- 具体描述

## 改进建议
### P0 | {优先级}
- 问题描述
- 建议措施（带编号）

## 红线约束
- 自检报告必须包含具体数据
- 必须有明确的改进建议（P0/P1/P2）
```

#### F2.2 各 Agent 特有指标
| Agent | 特有指标 |
|-------|---------|
| Dev | 代码提交数、PR 数、代码审查数、构建失败次数 |
| Analyst | 分析报告数、需求条目数、竞品分析覆盖数 |
| Architect | 架构设计数、评审次数、技术债务发现数 |
| PM | PRD 数、需求变更数、燃尽图状态 |
| Tester | 测试用例数、覆盖率、缺陷数、Bug 逃逸率 |
| Reviewer | 代码审查数、PR 合规率、问题发现数 |

#### F2.3 验收标准
```python
# 报告格式验证
expect(report.sections.contains("今日工作统计"))
expect(report.sections.contains("主要活动"))
expect(report.sections.contains("改进建议"))
expect(report.sections.contains("红线约束"))
expect(report.metrics.is_not_empty())  # 统计数据非空

# 改进建议必须有优先级
for suggestion in report.suggestions:
    expect(suggestion.priority in ["P0", "P1", "P2"])
    expect(suggestion.description.length > 10)
```

---

### F3: 提案收集与存储

#### F3.1 提案目录结构
```
proposals/
└── {YYYYMMDD}/
    ├── dev-selfcheck-{YYYYMMDD}.md
    ├── analyst-selfcheck-{YYYYMMDD}.md
    ├── architect-selfcheck-{YYYYMMDD}.md
    ├── pm-selfcheck-{YYYYMMDD}.md
    ├── tester-selfcheck-{YYYYMMDD}.md
    └── reviewer-selfcheck-{YYYYMMDD}.md
```

#### F3.2 提案自动收集
- 自检完成后，agent 自动将报告保存到对应目录
- **验收标准**:
  ```python
  expect(proposals_dir.list_files().length == 6)  # 6 个 agent 全部提交
  for agent in all_agents:
      expect(proposals_dir.contains(f"{agent}-selfcheck-{date}.md"))
  ```

#### F3.3 Git 提交集成
- 提案保存后自动执行 `git add` 和 `git commit`
- **验收标准**:
  ```python
  expect(git.log(f"docs: add {agent} self-check for {date}").exists)
  expect(git.last_commit.message.contains(date))
  ```

---

### F4: 虚假完成检测

#### F4.1 文件存在性校验
- 任务标记 `done` 前，验证对应产出物文件实际存在
- **验收标准**:
  ```python
  # task_manager.update() 中集成
  task_manager.on_mark_done(task_id):
      required_files = TASK_REQUIREMENTS[task_id]  # 预定义产出物路径
      for file in required_files:
          expect(file.exists(), f"虚假完成检测: {file} 不存在")
  ```

#### F4.2 Git 提交校验
- 对于需要 git 提交的产出物，验证提交记录存在
- **验收标准**:
  ```python
  def validate_commit(task_id, expected_files):
      commit = git.log().first()
      changed_files = commit.changed_files
      for file in expected_files:
          expect(changed_files.contains(file), f"{file} 未在提交中")
  ```

#### F4.3 心跳扫描集成
- 心跳扫描中增加"虚假完成检测"步骤
- 发现虚假完成 → 主动修复 + 通知 coord
- **验收标准**:
  ```python
  heartbeat.on_detect_false_completion():
      fix_and_commit()
      notify_coord("虚假完成检测 + 修复", details)
      log("虚假完成已修复")
  ```

---

### F5: 进化追踪与分析

#### F5.1 每日自检指标汇总
- 汇总所有 agent 提案，生成每日自检汇总报告
- **验收标准**:
  ```python
  expect(evolution_tracker.daily_summary(date).agents_completed == 6)
  expect(evolution_tracker.daily_summary(date).p0_count >= 0)
  expect(evolution_tracker.daily_summary(date).p1_count >= 0)
  ```

#### F5.2 趋势追踪
- 按周/月维度追踪改进建议执行情况
- **验收标准**:
  ```python
  evolution_tracker.get_trend(period="week"):
      expect(trend.total_suggestions >= 0)
      expect(trend.completed_suggestions <= trend.total_suggestions)
      expect(trend.implementation_rate in [0.0, 1.0])
  ```

#### F5.3 知识沉淀
- 改进建议沉淀到各 agent 的 LEARNINGS.md
- **验收标准**:
  ```python
  learnings = agent.workspace.LEARNINGS.md
  expect(learnings.entries.filter(category="improvement").length >= 0)
  ```

---

## 3. Epic 拆分

### Epic 1: 自检触发与调度（P0）
> 实现每日自检任务的自动创建与调度

**Stories**:
- S1.1: heartbeat-coord 创建每日自检任务
- S1.2: 6 个 agent 节点并行初始化
- S1.3: 任务到期提醒机制
- S1.4: 自检任务自动归档

**验收**: 每日 06:00 前完成全部 6 个 agent 任务创建；心跳扫描检测到虚假完成自动修复

---

### Epic 2: 标准化自检模板（P0）
> 为每个 agent 定义标准化自检模板

**Stories**:
- S2.1: 定义通用自检报告模板（4 个章节 + 红线约束）
- S2.2: 定义各 agent 特有指标（Dev/Analyst/Architect/PM/Tester/Reviewer）
- S2.3: 模板格式验证脚本（机器可读）
- S2.4: 各 agent 模板实例化

**验收**: 每个 agent 有独立模板文件；模板通过 expect() 格式验证

---

### Epic 3: 提案收集与 Git 集成（P0）
> 实现提案自动收集与 Git 提交

**Stories**:
- S3.1: proposals/{date}/ 目录创建与权限管理
- S3.2: 自检报告自动保存到 proposals/
- S3.3: Git add + commit 自动化
- S3.4: 提案完整性校验（6 个文件全部存在）

**验收**: 提案目录包含全部 6 个 agent 文件；Git 提交记录可追溯

---

### Epic 4: 虚假完成检测（P0）
> 实现文件存在性校验，防止虚假完成

**Stories**:
- S4.1: task_manager.py 增加文件存在性校验钩子
- S4.2: 心跳扫描集成虚假完成检测
- S4.3: 自动修复 + coord 通知机制
- S4.4: 虚假完成日志记录与统计

**验收**: 虚假完成检测覆盖率 100%；检测到后 5 分钟内完成修复通知

---

### Epic 5: 进化追踪与分析（P1）
> 量化自检效果，追踪改进趋势

**Stories**:
- S5.1: 每日自检汇总报告生成
- S5.2: 周/月趋势分析
- S5.3: LEARNINGS.md 自动更新
- S5.4: 进化指标可视化面板

**验收**: 趋势数据可查询；LEARNINGS.md 有实质更新（非空）

---

## 4. UI/UX 流程

### 流程图

```
heartbeat-coord (06:00)
    │
    ├── [检测] agent-self-evolution-{date}-daily 存在?
    │       │
    │       ├── ✅ 存在 → 跳过创建
    │       └── ❌ 不存在 → 创建 DAG 项目
    │               ├── dev-self-check (ready)
    │               ├── analyst-self-check (ready)
    │               ├── architect-self-check (ready)
    │               ├── pm-self-check (ready)
    │               ├── tester-self-check (ready)
    │               └── reviewer-self-check (ready)
    │
    └── [并行] 各 agent 领取并执行自检
            │
            ├── 执行自检（见下）
            └── [完成后] 保存提案 → Git commit

各 agent 自检流程:
    领取任务 → 锁定 in_progress
        ↓
    执行自检 → 产出报告
        ↓
    格式验证（expect()）
        ↓
    保存到 proposals/{date}/
        ↓
    Git add + commit
        ↓
    更新 task status → done
        ↓
    发送通知到 coord
```

### 自检执行步骤（各 agent）

```
1. 读取 HEARTBEAT.md 当前跟踪事项
2. 扫描 projects/ 和 team-tasks/ 获取今日任务
3. 统计指标（工作数、完成数、提案数）
4. 撰写自检报告（模板 + 特有指标）
5. 格式验证（section 完整性）
6. 保存到 proposals/{YYYYMMDD}/{agent}-selfcheck-{YYYYMMDD}.md
7. git add + commit
8. 更新 HEARTBEAT.md（追加今日记录）
9. 更新 task_manager 状态 → done
10. 发送飞书通知到 coord
```

---

## 5. 非功能需求

### NFR1: 性能
- 心跳扫描总时长 < 60 秒
- 提案收集 + Git 提交 < 30 秒
- 虚假完成检测 < 10 秒

### NFR2: 可靠性
- 自检完成率目标: ≥ 99%（允许 1% 人工干预）
- Git 提交成功率: 100%（失败重试 3 次）

### NFR3: 可维护性
- 模板变更不影响其他 agent
- 新增 agent 类型只需扩展模板（开闭原则）

### NFR4: 安全性
- Git 提交信息不含敏感数据
- 飞书通知仅发送到 coord 内部群组

---

## 6. 验收标准总览

| 优先级 | 验收条件 | 验证方式 |
|--------|---------|---------|
| P0 | 每个 agent 每日提交自检报告 | proposals/ 目录文件数量 = 6 |
| P0 | 报告包含统计数据（P0/P1/P2 建议） | expect() 格式校验 |
| P0 | 虚假完成自动检测并修复 | 心跳扫描日志验证 |
| P0 | Git 提交记录可追溯 | git log 验证 |
| P1 | 趋势数据可查询 | evolution_tracker API 验证 |
| P1 | LEARNINGS.md 有实质更新 | 文件 diff 验证 |

---

## 7. DoD (Definition of Done)

**自检任务完成的充要条件**:
1. ✅ 提案文件存在于 `proposals/{YYYYMMDD}/{agent}-selfcheck-{YYYYMMDD}.md`
2. ✅ Git 提交记录存在（日期匹配）
3. ✅ task_manager 状态为 `done`
4. ✅ HEARTBEAT.md 记录已更新
5. ✅ coord 通知已发送

---

## 8. 依赖项

| 依赖 | 说明 |
|------|------|
| team-tasks | 任务管理（DAG 模式） |
| heartbeat-coord | 定时触发（每日 06:00） |
| HEARTBEAT.md | 各 agent 心跳记录 |
| proposals/ | 提案存储目录 |
| evolution-tracker | 进化追踪脚本 |

---

## 9. Out of Scope

- Agent 代码级别的自我修复（仅记录建议，不自动修改）
- 跨 agent 协作冲突解决
- 自检报告的人工审核流程
- 移动端通知支持
