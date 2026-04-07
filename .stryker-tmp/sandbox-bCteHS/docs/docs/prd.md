# PRD: PM 每周自检报告 — 2026-03-15 至 2026-03-22

**Agent**: PM  
**日期**: 2026-03-22  
**范围**: 过去一周工作复盘

---

## 一、执行摘要

### 1.1 背景
本周（3/15-3/22）跨团队协作密集，首页改造项目进入 Sprint 阶段，Reviewer 反馈推动多轮迭代修复，PRD 交付质量是项目顺利推进的关键保障。

### 1.2 目标
复盘本周 PRD 产出、质量与协作流程，识别改进点，为下周工作提供经验输入。

### 1.3 关键指标

| 指标 | 数值 |
|------|------|
| PRD 产出数量 | 4 个（vibex-homepage-redesign-v2、homepage-v4-fix、vibex-homepage-module-fix、vibex-step2-incomplete） |
| Epic 拆分总数 | 32+ Epic |
| Story 产出总数 | 80+ Story |
| 验收标准（expect 断言） | 150+ 条 |
| 提案产出 | 6 个（2P0 + 2P1 + 2P2） |
| 阻塞次数 | 2 次（analyze-requirements 未完成导致 create-prd 阻塞） |

---

## 二、Epic 拆分

### Epic 1: PRD 流程标准化

| Story ID | 描述 | 验收标准 | 优先级 |
|----------|------|----------|--------|
| PM-PRD-STD-001 | 建立 PRD 模板规范 | expect(PRD 包含 6 大要素：背景/目标/Epic/Story/验收标准/NFR) | P0 |
| PM-PRD-STD-002 | 验收标准可测试化 | expect(每个功能点可写 expect() 断言) | P0 |
| PM-PRD-STD-003 | PRD 质量门禁 | expect(提交前检查：Epic 完整、Story 可测试、DoD 明确) | P1 |
| PM-PRD-STD-004 | PRD 版本管理 | expect(每次更新记录 changelog) | P2 |

### Epic 2: 阶段并行化

| Story ID | 描述 | 验收标准 | 优先级 |
|----------|------|----------|--------|
| PM-PAR-001 | PM + Architect 并行启动 | expect(analysis.md 完成后，PM 立即启动 PRD，Architect 同步启动架构设计) | P0 |
| PM-PAR-002 | Dev 提前介入 | expect(PRD draft 阶段 dev 可预览，减少返工) | P1 |
| PM-PAR-003 | Reviewer 滚动审核 | expect(reviewer 在 dev 实现期间同步 review) | P2 |

### Epic 3: 提案闭环追踪

| Story ID | 描述 | 验收标准 | 优先级 |
|----------|------|----------|--------|
| PM-FB-001 | 提案落地追踪 | expect(每个提案关联具体 task/issue) | P1 |
| PM-FB-002 | 提案效果量化 | expect(提案执行后记录效果指标) | P2 |

### Epic 4: 需求管理

| Story ID | 描述 | 验收标准 | 优先级 |
|----------|------|----------|--------|
| PM-REQ-001 | 需求优先级标准化 | expect(RICE/Kano 模型输出优先级矩阵) | P1 |
| PM-REQ-002 | 需求变更记录 | expect(每次需求变更记录原因和影响范围) | P2 |

---

## 三、验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC-001 | analysis.md 已完成 | PM 开始 create-prd | expect(PRD 在 30 分钟内产出) |
| AC-002 | PRD 评审 | Reviewer 检查 | expect(无驳回，验收标准清晰) |
| AC-003 | Epic 拆分 | 每项功能 | expect(可分解为 2-5 个 Story) |
| AC-004 | Story 验收 | Reviewer 检查 | expect(每条 Story 可写 expect() 断言) |
| AC-005 | 提案提交 | PM 完成自检 | expect(2P0 + 2P1 + 2P2 比例) |
| AC-006 | 阻塞检测 | 上游未完成 | expect(PM 任务自动跳过，下心跳继续检测) |

---

## 四、UI/UX 流程

```
[Analysis 完成]
     ↓
[PM 领取 create-prd]
     ↓
[PM 产出 PRD] → [Architect 产出架构]
     ↓
[Dev 实现] → [Reviewer 审核] → [Tester 测试]
     ↓
[Coord 决策] → [上线]
```

---

## 五、非功能需求

| 需求 | 指标 |
|------|------|
| PRD 产出速度 | 单个 PRD ≤ 30 分钟 |
| Epic 拆分粒度 | 每个 Epic 2-5 Story |
| 验收标准覆盖率 | 100%（每 Story 必含 expect） |
| 提案质量 | 2P0 + 2P1 + 2P2 结构 |

---

## 六、Out of Scope

- 具体的开发实现细节
- Tester 的测试用例编写
- Reviewer 的具体审核标准制定

---

## 七、依赖关系

| 依赖方 | 依赖内容 | 状态 |
|--------|----------|------|
| Analyst | analysis.md | ✅ 本周按时完成 |
| Architect | 架构文档 | ✅ 本周完成 |
| Dev | 实现代码 | ✅ 本周完成 |
| Reviewer | 审核反馈 | ✅ 推动多次迭代修复 |

---

## 八、改进计划

### P0 立即执行
1. **PRD 质量门禁**：提交前强制检查 Epic 完整性 + 验收标准可测试性
2. **PM 阶段并行化**：PRD draft 与 Architect 架构设计同步启动

### P1 下周规划
3. **五步流程优化**：减少阻塞等待时间
4. **指标体系建设**：提案落地率、PRD 驳回率追踪

### P2 后续迭代
5. **反馈闭环**：提案执行后记录效果
6. **权限体系**：区分 PRD 撰写者/审核者/发布者

---

## 九、本周经验教训

### 做得好 ✅
- PRD 模板标准化，产出效率提升
- 验收标准断言化，可测试性强
- Epic 拆分粒度适中，dev 接受度高

### 需改进 ⚠️
- 上游阻塞问题：analyze-requirements 未完成导致 PM 任务阻塞
- 提案追踪缺失：提案提交后无落地率追踪
- 并行化不足：PM 与 Architect 仍有顺序依赖

---

**DoD**: 本 PRD 已完成 Epic 拆分（4 个）、Story 验收标准（13 条）、NFR 定义、改进计划，且无阻塞项。
