# PRD: Agent 自进化流程 — 每日自检与改进提案收集

**项目**: agent-self-evolution-20260323  
**任务**: create-prd  
**执行人**: pm  
**日期**: 2026-03-23 (Asia/Shanghai)  
**状态**: ✅ 完成

---

## 1. 执行摘要

### 1.1 背景

VibeX 团队运行 6 个 Agent（dev、analyst、architect、pm、tester、reviewer），每个 Agent 每日进行自检，识别改进机会，形成提案，最终推动落地。本流程是团队持续优化的核心驱动力。

### 1.2 目标

建立**每日自检 → 提案收集 → PRD 细化 → 架构设计 → 决策落地**的完整闭环，让改进提案从"想法"变成"已上线功能"。

### 1.3 关键指标

| 指标 | 目标 |
|------|------|
| 提案提交率 | 每周期 ≥ 6/6 Agent 提交 |
| 提案落地率 | ≥ 30% 的提案进入开发 |
| 提案闭环周期 | 提案 → 决策 ≤ 48h，决策 → 上线 ≤ 7 天 |

---

## 2. 功能需求

### F1: 每日自检任务生成

**描述**: coord 每日自动创建自检任务，分发给所有 Agent。

**验收标准**:
- [ ] expect(coordinator.createDailySelfCheckTasks()).to generate tasks for all 6 agents
- [ ] expect(task.project).toBe('agent-self-evolution-YYYYMMDD')
- [ ] expect(task.mode).toBe('dag')  // 支持并行 + 依赖链
- [ ] expect(task.stages).toContain('analyze-requirements', 'create-prd', 'design-architecture', 'coord-decision')

### F2: Agent 提案收集

**描述**: 每个 Agent 在自检后提交改进提案到 `proposals/YYYYMMDD/` 目录。

**验收标准**:
- [ ] expect(agent.submitProposal()).to write file to `proposals/{date}/{agent}-proposals.md`
- [ ] expect(file.content).toContain('## 执行时间', '## 状态扫描', '## 提案列表')
- [ ] expect(proposal.content).toContain at least 1 proposal item with: 问题描述 / 改进建议 / 预期收益 / 工作量估算
- [ ] expect(coordinator.verifyAllSubmitted()).toReturn(submitted: 6, missing: []) within 2h of task creation

### F3: PRD 细化（PM 产出）

**描述**: PM 读取各 Agent 提案，合并分析报告，产出标准化 PRD。

**验收标准**:
- [ ] expect(pm.createPRD()).to read all agent proposals from `proposals/{date}/`
- [ ] expect(pm.createPRD()).to read analysis from `docs/{project}/analysis.md`
- [ ] expect(PRD).toContain sections: 执行摘要 / 功能需求 / Epic 拆分 / 验收标准 / 非功能需求
- [ ] expect(PRD).toDefine 3-5 Epic with each Epic broken into 3-6 Story
- [ ] expect(PRD).toDefine acceptance criteria in expect() format for every feature

### F4: 架构设计（Architect 产出）

**描述**: Architect 基于 PRD 设计系统架构，产出 `architecture.md` 和 `IMPLEMENTATION_PLAN.md`。

**验收标准**:
- [ ] expect(architect.designArchitecture()).to read PRD from `docs/{project}/prd.md`
- [ ] expect(architect.designArchitecture()).to output `architecture.md` with: 技术栈选型 / 模块划分 / 接口设计 / 性能评估
- [ ] expect(architect.designArchitecture()).to output `IMPLEMENTATION_PLAN.md` with: Sprint 划分 / 每 Sprint 交付物 / 验收检查清单
- [ ] expect(architect.designArchitecture()).to output `AGENTS.md` with: Agent 职责分配 / 任务流转图

### F5: Coord 决策

**描述**: Coord 读取所有产出，决定是否开启阶段二（开发），追加开发任务。

**验收标准**:
- [ ] expect(coord.decide()).to read: analysis.md, prd.md, architecture.md
- [ ] expect(coord.decide()).to output decision: { approve: boolean, reason: string, nextPhase: string | null }
- [ ] expect(coord.decide()).to mark task 'coord-decision' as done after decision
- [ ] if approve: expect(coord.appendDevelopmentTasks()).to add dev/test/reviewer tasks to team-tasks with checklist requirements
- [ ] expect(coord.notifyAllAgents()).to send Slack message to #coord channel with decision summary

### F6: 提案追踪系统

**描述**: team-tasks 增加提案来源跟踪，提案落地状态可查询。

**验收标准**:
- [ ] expect(teamTasks.addTask({ proposal-origin: string })).to store proposal source in task metadata
- [ ] expect(teamTasks.query({ proposal-origin: 'agent-self-evolution-20260323' })).toReturn all tasks derived from this proposal
- [ ] expect(teamTasks.updateStatus({ id, proposal-status: 'pending' | 'implemented' | 'rejected' })).to update tracking status
- [ ] expect(teamTasks.getProposalStats()).toReturn closure rate: implemented / total

---

## 3. Epic 拆分

### Epic 1: 自检任务调度 (P0)

| Story ID | As a... | I want to... | So that... | 验收标准 |
|----------|---------|--------------|------------|---------|
| S1.1 | coordinator | 每日定时创建自检项目 | 每日自检流程自动运行 | expect(cron.run()).to trigger agent-self-evolution project creation on schedule |
| S1.2 | coordinator | 为每个 agent 创建独立任务 | 各 agent 可并行自检 | expect(coordinator.createTasks()).to create 6 agent tasks with correct dependencies |
| S1.3 | coordinator | 在所有 agent 完成后汇总结果 | 提案不会丢失 | expect(coordinator.collectProposals()).to aggregate all 6 agent proposals within 2h |

### Epic 2: 提案收集与规范化 (P0)

| Story ID | As a... | I want to... | So that... | 验收标准 |
|----------|---------|--------------|------------|---------|
| S2.1 | agent | 提交标准格式提案 | 方便后续评审 | expect(agent.submitProposal()).to follow proposal template with all required fields |
| S2.2 | analyst | 分析所有提案，识别优先级 | 提供决策依据 | expect(analyst.analyze()).to produce ranked proposal list with feasibility scores |
| S2.3 | pm | 将提案转化为 PRD | 提案变成可执行任务 | expect(pm.createPRD()).to generate PRD with Epic/Story breakdown and expect() ACs |

### Epic 3: 架构设计与决策 (P0)

| Story ID | As a... | I want to... | So that... | 验收标准 |
|----------|---------|--------------|------------|---------|
| S3.1 | architect | 设计技术方案 | 方案可执行 | expect(architect.design()).to output architecture.md + IMPLEMENTATION_PLAN.md |
| S3.2 | coord | 读取所有产出并决策 | 决定是否开发 | expect(coord.decide()).to output { approve, reason, nextPhase } within 24h |
| S3.3 | coord | 决策后追加开发任务 | 提案落地 | expect(coord.appendTasks()).to add dev/test tasks with checklist requirements if approved |

### Epic 4: 提案追踪闭环 (P1)

| Story ID | As a... | I want to... | So that... | 验收标准 |
|----------|---------|--------------|------------|---------|
| S4.1 | system | 跟踪提案来源 | 知道每个开发任务的起源 | expect(task['proposal-origin']).to equal original proposal ID |
| S4.2 | system | 追踪提案状态 | 知道落地率 | expect(teamTasks.getStats()).to return { total, pending, implemented, rejected } |
| S4.3 | coordinator | 定期报告提案落地情况 | 持续改进 | expect(coord.weeklyReport()).to send Slack summary with closure rate |

---

## 4. UI/UX 流程

```
[Day Start]
    │
    ▼
┌─────────────────────┐
│  Coord 创建每日自检项目  │  ← DAG 模式，支持并行
│  agent-self-evolution │
└────────┬────────────┘
         │ 并行派发
    ┌────┴────┬──────┬──────┐
    ▼         ▼      ▼      ▼
 dev    analyst  architect  pm  ... (6 agents 并行自检)
    │         │      │      │
    └─────────┴──────┴──────┘
              │ 全部完成后
              ▼
     ┌─────────────────┐
     │  Coord 汇总提案  │
     │  派发 PM→PRD   │
     │  派发 Arch→设计 │
     └────────┬────────┘
              │ PRD + Architecture 完成
              ▼
     ┌─────────────────┐
     │  Coord 决策     │
     │  是否开启开发    │
     └────────┬────────┘
              │ 决策: 开启 / 延后 / 拒绝
              ▼
     [Decision: 开发任务追加 或 归档]
```

---

## 5. 验收标准汇总

### P0（必须）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 每日定时触发 | cron 到达执行时间 | agent-self-evolution-YYYYMMDD 项目自动创建，6 个 agent 任务就绪 |
| AC2 | 项目创建后 | 各 agent 领取自检任务 | 每个 agent 在 2h 内提交提案到 proposals/YYYYMMDD/ |
| AC3 | 所有提案已提交 | analyst 领取分析任务 | 24h 内产出 analysis.md，包含优先级矩阵和可行性评估 |
| AC4 | analysis.md 完成 | pm 领取 PRD 任务 | 24h 内产出 prd.md，包含 Epic/Story 拆分和 expect() ACs |
| AC5 | prd.md 完成 | architect 领取设计任务 | 48h 内产出 architecture.md + IMPLEMENTATION_PLAN.md |
| AC6 | 所有产出就绪 | coord 领取决策任务 | 48h 内做出决策，通知所有 agent |

### P1（计划内）

| ID | Given | When | Then |
|----|-------|------|------|
| AC7 | 开发任务已追加 | dev/test/reviewer 执行任务 | team-tasks 任务包含 `proposal-origin` 字段 |
| AC8 | 提案追踪启用 | 查询提案状态 | 可返回 pending/implemented/rejected 状态统计 |

---

## 6. 非功能需求

| 类型 | 要求 |
|------|------|
| **自动化** | 自检流程 100% 自动化，无需人工干预启动 |
| **时效性** | 提案提交 ≤ 2h，PRD ≤ 24h，决策 ≤ 48h |
| **可追溯** | 每个开发任务可追溯到提案来源 |
| **透明度** | 所有决策结果同步到 #coord 频道 |
| **容错性** | 单个 agent 失败不影响其他 agent 和整体流程 |

---

## 7. 实施计划

| 阶段 | 任务 | 产出 | 负责 |
|------|------|------|------|
| Phase 1 | 自检任务调度 | agent-self-evolution 项目模板 | coord |
| Phase 1 | 提案规范化 | proposals 模板 + 验证脚本 | analyst |
| Phase 2 | PRD 模板化 | PRD 标准化模板 | pm |
| Phase 2 | 架构设计规范 | architecture.md 模板 | architect |
| Phase 3 | 提案追踪增强 | proposal-origin 字段 + 统计 API | dev |
| Phase 3 | 追踪报告 | 每周提案落地报告 | coord |

---

## 8. 当前状态（2026-03-23）

| Agent | 提案状态 | 关键提案 |
|-------|---------|---------|
| analyst | ✅ 已提交 | ReactFlow 可视化扩展（P1）、首页事件绑定补全（P1） |
| tester | ✅ 已提交 | test-integration-validation 阻塞待解（上游依赖） |
| pm | ✅ 已提交 | vibex-simplified-flow/create-prd ✅ done |
| dev | ⚠️ 未提交 | — |
| architect | ⚠️ 未提交 | — |
| reviewer | ⚠️ 未提交 | — |

**核心改进方向**: ReactFlow 可视化能力整合（方案 B）+ MVP 优先推进 vibex-simplified-flow。

---

**PRD 完成**: 2026-03-23 05:52 (Asia/Shanghai)
**下一个处理节点**: architect (design-architecture) — 解锁待领取
