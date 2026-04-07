# PRD — Agent Self-Evolution Framework (agent-self-evolution-20260325)

**Version**: 1.0  
**Date**: 2026-03-25  
**Author**: pm  
**Project**: agent-self-evolution-20260325  
**Status**: Draft → Pending Architect Review  

---

## 1. Project Overview

### 1.1 Goal

建立全团队 Agent 每日自检框架，统一自检报告结构、自动化报告生成、提案全生命周期追踪，实现 agent 自我总结与改进的系统化管理。

### 1.2 Scope

| 包含 | 不包含 |
|------|--------|
| 标准化自检报告模板（所有 Agent） | vibex 业务代码改进（由提案转化后另行处理） |
| 自检脚本自动化（heartbeat 触发） | 跨团队人工协作流程 |
| 提案生命周期追踪系统 | CI/CD 基础设施变更 |
| 评分与趋势看板 | 前端 UI 页面开发 |
| 提案 Slack 通知集成 | |
| LEARNINGS.md / MEMORY.md 同步 | |

### 1.3 Key Terms

| 术语 | 定义 |
|------|------|
| **Self-Check Report** | Agent 每日自检报告，含评分、改进项、提案 |
| **Proposal** | Agent 从自检中提炼的改进提案，含优先级和 Owner |
| **Lifecycle Status** | 提案状态：draft → submitted → reviewing → approved → implementing → completed/rejected |
| **Action Item** | 来自自检报告的具体执行项，含状态和截止日期 |
| **LEARNINGS.md** | 跨项目经验沉淀文档 |
| **MEMORY.md** | 单项目上下文文档 |

---

## 2. Epic / Story Breakdown

### Epic 1: 标准化自检报告格式（E1）

> **目标**：所有 Agent 使用统一的报告结构和元数据规范

#### Story 1.1: 通用自检报告模板

| ID | Story | 描述 |
|----|-------|------|
| E1.1 | 通用报告模板 | 定义所有 Agent 共用的报告结构 |

**验收标准**：
```
expect(report.template).toBeDefined()
expect(report.fields).toContain('agent', 'date', 'selfAssessment', 'whatWentWell', 'areasForImprovement', 'proposals', 'actionItems')
expect(report.selfAssessment).toHaveProperty('dimensions')
expect(report.selfAssessment.dimensions.length).toBeGreaterThan(0)
expect(report.proposals).toBeArray()
expect(report.proposals.length).toBeGreaterThanOrEqual(0)
expect(report.actionItems).toBeArray()
```

**DoD**：
- [ ] 模板文档已创建于 `docs/agent-self-evolution-20260325/specs/self-check-template.md`
- [ ] 模板包含所有必填字段和可选字段
- [ ] 字段含义明确，无歧义
- [ ] PM 和 Coord 已审核通过

---

#### Story 1.2: Agent 特化模板

| ID | Story | 描述 |
|----|-------|------|
| E1.2 | Analyst 自检模板 | 准确度评分、洞察提取、任务验证、提案 |
| E1.3 | Architect 自检模板 | 架构设计质量、文档及时性、技术债务追踪 |
| E1.4 | Dev 自检模板 | 代码质量、效率评估、技术债务清理 |
| E1.5 | Reviewer 自检模板 | 审查质量、安全发现、流程改进 |
| E1.6 | Tester 自检模板 | 测试覆盖率、缺陷发现、流程改进 |
| E1.7 | Coord 自检模板 | 项目交付、阻塞解决、团队协作 |

**验收标准**（以 E1.2 为例，其余类推）：
```
expect(analystTemplate).toContain('准确度评分')
expect(analystTemplate).toContain('洞察提取能力')
expect(analystTemplate.scoring).toEqual(expect.arrayContaining([
  expect.objectContaining({ dimension: '准确度', min: 0, max: 10 }),
  expect.objectContaining({ dimension: '洞察能力', min: 0, max: 10 }),
]))
expect(analystTemplate.proposals).toEqual(expect.arrayContaining([
  expect.objectContaining({ priority: expect.stringMatching(/^P[0-3]$/) }),
]))
```

**DoD**：
- [ ] 每个 Agent 有独立模板文件于 `specs/templates/`
- [ ] 每个模板有评分维度（维度名、最小值、最大值）
- [ ] 每个模板有 Agent 专属 Section（如 analyst 的"洞察提取"）
- [ ] Coord 确认模板与各 Agent 工作内容匹配

---

#### Story 1.3: 报告元数据标准

| ID | Story | 描述 |
|----|-------|------|
| E1.8 | JSON Schema 元数据 | 每份报告附带 `report.json` 元数据文件 |

**验收标准**：
```
expect(metadata).toMatchSchema({
  agent: 'string',           // analyst|architect|dev|reviewer|tester|coord
  date: 'string(ISO-8601)',  // 2026-03-25
  project: 'string',         // agent-self-evolution-YYYYMMDD
  version: 'string',          // semver
  selfAssessmentScore: 'number', // 0-10
  proposalCount: 'number',
  actionItemCount: 'number',
  status: 'draft|final',
})
expect(metadata.agent).toBeValidAgent()
expect(metadata.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
```

**DoD**：
- [ ] `specs/report-metadata.schema.json` 已创建
- [ ] Schema 包含所有必填字段
- [ ] Coord 和 PM 已审核通过

---

### Epic 2: 自检报告自动化（E2）

> **目标**：通过心跳脚本自动触发、生成、提交自检报告**

#### Story 2.1: 自检脚本框架

| ID | Story | 描述 |
|----|-------|------|
| E2.1 | 每日自检触发脚本 | heartbeat 触发各 Agent 执行自检 |
| E2.2 | 报告生成器 | 生成符合模板的报告文件 |
| E2.3 | Git 提交与推送 | 报告自动 commit + push |

**验收标准**：
```bash
# E2.1
expect(scriptExists('scripts/self-check/trigger-all.sh')).toBe(true)
expect(triggerOutput).toContain('analyst')  # 至少 analyst 执行
expect(triggerOutput).toContain('architect')
expect(triggerOutput).toContain('dev')
expect(triggerOutput).toContain('reviewer')

# E2.2
expect(reportContent).toContain('Self-Check')
expect(reportContent).toMatch(/## \d+\. /)  # 带编号的章节
expect(reportContent).toContain('**Agent**:')
expect(reportContent).toContain('**Date**:')

# E2.3
expect(gitStatus).toContain('new file:')
expect(gitLog).toMatch(/self-check.*\d{8}/)
expect(remotePush).toContain('Done')
```

**DoD**：
- [ ] `scripts/self-check/trigger-all.sh` 可接受日期参数，跳过已生成的 Agent
- [ ] 报告文件保存到 `docs/agent-self-evolution-YYYYMMDD/<agent>-self-check-YYYYMMDD.md`
- [ ] Git commit 使用 `feat(self-check): <agent> self-check YYYYMMDD` 格式
- [ ] 幂等性：同一 Agent 同一天重复执行不报错（跳过已生成）

---

#### Story 2.2: 报告完整性校验

| ID | Story | 描述 |
|----|-------|------|
| E2.4 | 报告字段校验 | 报告提交前校验所有必填字段 |
| E2.5 | 不完整报告拦截 | 字段缺失时拒绝提交并报警 |

**验收标准**：
```bash
expect(validateReport('incomplete.md')).toContain('MISSING_FIELD')
expect(validateReport('incomplete.md')).toHaveExitCode(1)
expect(slackNotify).toContain('报告校验失败')
expect(validateReport('complete.md')).toHaveExitCode(0)
```

**DoD**：
- [ ] `scripts/self-check/validate-report.sh` 可校验所有必填字段
- [ ] 校验失败时发送 Slack 通知到 #coord
- [ ] 校验通过后才执行 git commit

---

### Epic 3: 提案生命周期追踪（E3）

> **目标**：建立提案从提出到完成的闭环追踪**

#### Story 3.1: 提案数据模型

| ID | Story | 描述 |
|----|-------|------|
| E3.1 | 提案数据模型 | 提案 JSON 数据结构和校验 Schema |

**验收标准**：
```javascript
expect(proposalSchema).toEqual({
  id: expect.stringMatching(/^[A-Z]{2,6}-\d{3}$/), // e.g., VIBEX-A1, DEV-B2
  title: 'string',
  agent: 'string',          // analyst|architect|dev|reviewer|tester|coord
  priority: 'P0|P1|P2|P3',
  status: 'draft|submitted|reviewing|approved|implementing|completed|rejected',
  owner: 'string|null',
  relatedProject: 'string|null',
  effortEstimate: 'string',  // e.g., "2d", "4h"
  createdDate: 'ISO-8601',
  updatedDate: 'ISO-8601',
  description: 'string',
  acceptanceCriteria: ['string'],
  linkedEpic: 'string|null',
})
expect(proposal.id).toBeUnique() // 全局无重复
```

**DoD**：
- [ ] `specs/proposal.schema.json` 已创建
- [ ] 所有现有提案已按 Schema 规范化
- [ ] 提案 ID 全局唯一性校验通过

---

#### Story 3.2: 提案追踪数据库

| ID | Story | 描述 |
|----|-------|------|
| E3.2 | 提案追踪数据库 | JSON 文件存储所有提案状态历史 |
| E3.3 | 提案状态更新脚本 | Agent 可更新提案状态 |

**验收标准**：
```bash
expect(dbPath).toBe('docs/agent-self-evolution/proposals/proposals.json')
expect(db).toHaveProperty('proposals')
expect(db).toHaveProperty('history')  // 状态变更历史
expect(getProposal('VIBEX-A1')).toEqual(expect.objectContaining({ id: 'VIBEX-A1' }))
expect(updateProposalStatus('VIBEX-A1', 'approved')).toHaveProperty('updatedDate')
expect(getHistory('VIBEX-A1').length).toBeGreaterThan(0)  // 有状态变更记录
```

**DoD**：
- [ ] `scripts/self-check/update-proposal.sh <proposal-id> <new-status>` 可用
- [ ] 状态变更记录到 history 数组
- [ ] 提案数据库在 git 版本控制下

---

#### Story 3.3: 提案去重机制

| ID | Story | 描述 |
|----|-------|------|
| E3.4 | 提案去重脚本 | 新提案提交时检测与已有提案的重合度 |

**验收标准**：
```bash
expect(dedupCheck('新提案: ReactFlow虚拟化')).toContain('VIBEX-A1')  # 已有相似提案
expect(dedupCheck('全新功能提案')).toHaveProperty('duplicates', 0)
expect(dedupCheck('高度相似提案')).toHaveProperty('similarity', expect.any(Number))
# 相似度 > 0.7 时提示人工确认
```

**DoD**：
- [ ] 去重算法基于关键词匹配（TF-IDF 或 Jaccard）
- [ ] 相似度 > 0.7 时触发 Slack 人工确认通知
- [ ] 去重结果记录到提案元数据

---

### Epic 4: 自检评分与趋势看板（E4）

> **目标**：汇总所有 Agent 自检评分，支持趋势分析和跨团队洞察**

#### Story 4.1: 评分汇总脚本

| ID | Story | 描述 |
|----|-------|------|
| E4.1 | 评分汇总 | 从所有报告提取评分，生成 JSON 汇总 |

**验收标准**：
```javascript
const summary = await generateScoreSummary('2026-03-25')
expect(summary).toEqual(expect.objectContaining({
  date: '2026-03-25',
  agents: expect.objectContaining({
    analyst: expect.objectContaining({ overall: expect.any(Number) }),
    architect: expect.objectContaining({ overall: expect.any(Number) }),
    dev: expect.objectContaining({ overall: expect.any(Number) }),
    reviewer: expect.objectContaining({ overall: expect.any(Number) }),
  }),
  teamAverage: expect.any(Number),
}))
expect(summary.analyst.overall).toBeGreaterThanOrEqual(0)
expect(summary.analyst.overall).toBeLessThanOrEqual(10)
```

**DoD**：
- [ ] `scripts/self-check/score-summary.sh` 可从指定日期目录提取评分
- [ ] 评分汇总保存到 `docs/agent-self-evolution-YYYYMMDD/score-summary.json`
- [ ] 无评分报告时输出空值而非报错

---

#### Story 4.2: 趋势分析

| ID | Story | 描述 |
|----|-------|------|
| E4.2 | 周趋势报告 | 聚合一周评分，计算各维度趋势（↑↓→） |
| E4.3 | 跨团队洞察 | 发现跨 Agent 共性问题（如多个 Agent 提案同一主题） |

**验收标准**：
```javascript
const trend = await generateTrendReport('2026-03-19', '2026-03-25')
expect(trend).toHaveProperty('analyst.trend')  // overall 趋势
expect(trend.analyst.trend.direction).toMatch(/↑|↓|→/)
expect(trend.analyst.trend.delta).toBeDefined()
expect(trend.crossTeamInsights.length).toBeGreaterThanOrEqual(0)
expect(trend.crossTeamInsights).toEqual(expect.arrayContaining([
  expect.objectContaining({
    theme: 'string',  // e.g., "技术债务追踪"
    agents: expect.arrayContaining(['analyst', 'architect']),
  }),
]))
```

**DoD**：
- [ ] 支持任意起止日期的周趋势分析
- [ ] 跨团队洞察识别 2+ Agent 提出相似主题的情况
- [ ] 趋势报告生成到 `docs/agent-self-evolution/score-summary.json`

---

### Epic 5: 提案通知与同步（E5）

> **目标**：提案状态变更触发 Slack 通知，与 team-tasks 系统联动**

#### Story 5.1: Slack 通知集成

| ID | Story | 描述 |
|----|-------|------|
| E5.1 | 提案提交通知 | 新提案提交时通知 #coord |
| E5.2 | 提案状态变更通知 | 状态变更时通知相关 Agent |
| E5.3 | 每日自检汇总通知 | 每日报告生成后发送汇总到 #coord |

**验收标准**：
```javascript
// E5.1
const notify = await sendProposalNotification({ type: 'new', proposal: { id: 'VIBEX-A1', title: '架构债务收口', agent: 'architect' } })
expect(notify.ok).toBe(true)
expect(notify).toContain('VIBEX-A1')
expect(notify).toContain('architect')

// E5.2
const statusNotify = await sendProposalNotification({ type: 'status_change', proposalId: 'VIBEX-A1', oldStatus: 'approved', newStatus: 'completed' })
expect(statusNotify.ok).toBe(true)

// E5.3
const dailySummary = await sendDailySummary({ date: '2026-03-25', reportsCount: 6, proposalsCount: 8 })
expect(dailySummary.ok).toBe(true)
expect(dailySummary).toContain('agent-self-evolution')
expect(dailySummary).toContain('proposals: 8')
```

**DoD**：
- [ ] `scripts/self-check/slack-notify.sh` 支持 new / status_change / daily_summary 类型
- [ ] 通知内容包含提案 ID、标题、Agent、优先级、状态
- [ ] Slack 通知发送到 #coord 频道

---

#### Story 5.2: team-tasks 联动

| ID | Story | 描述 |
|----|-------|------|
| E5.4 | 提案→任务同步 | approved 提案自动创建 team-tasks 项目 |
| E5.5 | LEARNINGS 同步 | 自检报告中的 lessons 同步到 LEARNINGS.md |

**验收标准**：
```bash
# E5.4
expect(syncToTeamTasks('VIBEX-A1')).toContain('Created project')
expect(taskManagerProjects).toContain('vibex-arch-debt-closure')  # 对应 VIBEX-A1

# E5.5
expect(learningsUpdate.log).toContain('sync')
expect(learningsUpdate.linesAdded).toBeGreaterThan(0)
expect(learningsUpdate).toContain('VIBEX-A1')  # 关联到源提案
```

**DoD**：
- [ ] P0/P1 提案approved 后自动创建 phase1 项目
- [ ] LEARNINGS.md 新增条目包含来源报告和日期
- [ ] 同步脚本记录同步历史

---

### Epic 6: 自检报告管理（E6）

> **目标**：建立自检报告的版本管理、访问控制和归档机制**

#### Story 6.1: 报告版本管理

| ID | Story | 描述 |
|----|-------|------|
| E6.1 | Git 版本控制 | 所有报告在 git 管理下，保留历史 |
| E6.2 | 报告编辑流程 | 报告草稿→最终版→锁定的生命周期 |

**验收标准**：
```
expect(gitLog('docs/agent-self-evolution-20260325/')).toContain('analyst-self-check-20260325')
expect(gitLog('docs/agent-self-evolution-20260325/')).toContain('architect-self-check-20260325')
expect(gitLog('docs/agent-self-evolution-20260325/')).toContain('dev-self-check-20260325')
expect(gitLog('docs/agent-self-evolution-20260325/')).toContain('reviewer-self-check-20260325')
expect(getReportVersion('2026-03-25', 'analyst')).toBe(1)  # 每日仅一版
```

**DoD**：
- [ ] 每个 Agent 每天仅一个报告版本
- [ ] 报告在 git 版本控制下，保留完整历史
- [ ] 历史报告不可删除，只能归档

---

#### Story 6.2: 报告归档

| ID | Story | 描述 |
|----|-------|------|
| E6.3 | 过期报告归档 | 超过 30 天的报告移动到归档目录 |
| E6.4 | 历史报告检索 | 按 Agent/日期/评分检索历史报告 |

**验收标准**：
```bash
expect(archiveOldReports(30)).toContain('archived')
expect(listReports({ agent: 'analyst', from: '2026-02-01', to: '2026-02-28' })).toHaveLength(expect.any(Number))
expect(listReports({ agent: 'analyst' })).toBeSortedBy('date', { descending: true })
```

**DoD**：
- [ ] 30 天前报告自动归档到 `docs/agent-self-evolution/archive/YYYY-MM/`
- [ ] 归档报告仍可检索但标记为 archived
- [ ] 归档脚本每周一执行（cron）

---

## 3. Priority Matrix (MoSCoW)

| ID | 功能 | 优先级 | 理由 |
|----|------|--------|------|
| E1.1 | 通用报告模板 | **Must** | 所有后续功能的基础 |
| E1.2–E1.7 | Agent 特化模板 | **Must** | 6 个 Agent 都需要 |
| E1.8 | 元数据 Schema | **Must** | 数据标准化基础 |
| E2.1 | 自检触发脚本 | **Must** | 自动化核心 |
| E2.2 | 报告生成器 | **Must** | 自动化核心 |
| E2.3 | Git 提交推送 | **Must** | 自动化核心 |
| E3.1 | 提案数据模型 | **Must** | 提案追踪基础 |
| E3.2 | 提案数据库 | **Should** | 追踪持久化 |
| E4.1 | 评分汇总脚本 | **Should** | 趋势分析基础 |
| E5.3 | 每日汇总通知 | **Should** | 团队可见性 |
| E2.4–E2.5 | 完整性校验 | **Should** | 质量保障 |
| E3.3 | 去重机制 | **Should** | 防止重复提案 |
| E4.2–E4.3 | 趋势分析 | **Could** | 增值功能 |
| E5.1–E5.2 | Slack 通知 | **Could** | 通知集成 |
| E5.4–E5.5 | team-tasks 联动 | **Could** | 工作流集成 |
| E6.1–E6.4 | 版本管理+归档 | **Won't (This Iteration)** | 可后续迭代 |

**MoSCoW Summary**:
- **Must (P0)**: E1.1, E1.2–E1.8, E2.1–E2.3, E3.1
- **Should (P1)**: E3.2, E4.1, E5.3, E2.4–E2.5, E3.3
- **Could (P2)**: E4.2–E4.3, E5.1–E5.2, E5.4–E5.5
- **Won't (P3)**: E6.1–E6.4（归档、版本管理下期迭代）

---

## 4. Definition of Done

### 4.1 全局 DoD

| 条件 | 说明 |
|------|------|
| 报告可执行 | 所有脚本在目标环境运行无报错 |
| 幂等性 | 重复执行不产生重复数据或报错 |
| 错误处理 | 失败场景有 fallback 或有意义的错误信息 |
| 日志可查 | 关键操作记录到日志文件 |
| Slack 通知 | 关键事件触发 Slack 通知到 #coord |
| Git 管理 | 所有产出物在 git 版本控制下 |
| 文档完整 | 每个脚本有 `--help` 或 README 说明 |

### 4.2 Epic DoD

| Epic | DoD |
|------|-----|
| **E1** | 所有 Agent 可使用新模板生成报告，PM/Coord 审核通过 |
| **E2** | heartbeat 触发后所有 Agent 报告自动生成，git push 成功 |
| **E3** | 提案数据库运行 7 天，无数据丢失，状态更新正常 |
| **E4** | 评分汇总脚本输出可解析 JSON，趋势数据准确 |
| **E5** | Slack 通知到达率 > 95%，team-tasks 联动正常 |
| **E6** | 归档脚本可执行，历史报告可检索 |

---

## 5. Implementation Notes

### 5.1 现有提案整合

以下提案来自 2026-03-25 各 Agent 自检报告，需在 E3 阶段处理：

| 提案 | 来源 | 优先级 | 对应功能 |
|------|------|--------|---------|
| 架构债务收口 Epic | architect | P2 | E3.2 |
| ADR 文档自动化同步 | architect | P3 | E5.4（扩展）|
| 提案生命周期管理 | architect | P1 | E3.2 全链路 |
| E2E 测试失败修复跟踪 | analyst | P0 | 独立项目 |
| 提案去重机制 | analyst | P1 | E3.3 |
| 合入 Epic3 ErrorClassifier | dev | P0 | 独立项目 |
| CardTreeNode 单元测试 | dev | P1 | 独立项目 |
| ESLint 缓存优化 | dev | P2 | 独立项目 |

### 5.2 依赖关系

```
E1 (模板) → E2 (自动化) → E4 (评分) → E5 (通知)
                ↓
          E3 (提案追踪) → E5.4 (team-tasks联动)
```

### 5.3 风险识别

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Agent 报告内容主观 | 评分不可比 | 模板固定评分维度，减少自由发挥空间 |
| 提案数量膨胀 | 管理成本↑ | E3.3 去重机制 + P3 提案需 Coord 审批 |
| 脚本执行失败无告警 | 问题延迟发现 | E2.5 完整性校验 + Slack 通知 |
| team-tasks 联动冲突 | 提案与任务状态不一致 | 只同步 approved+ 状态 |

---

## 6. Out of Scope (This Iteration)

- vibex 业务代码改进（由提案转化为正式项目后处理）
- 前端 UI 看板开发
- 历史数据迁移（2026-03-25 之前）
- tester 自检模板详细设计（待 tester agent 自检后补充）

---

*PRD Created: 2026-03-25 by pm agent*
*Next: Architect Review → Coord Decision*
