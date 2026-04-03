# PM 提案自检 — 2026-03-24（晚）

**项目**: vibex-pm-proposals-20260324_185417  
**时间**: 2026-03-24 19:27 (Asia/Shanghai)  
**来源**: 基于今日 6 Agent 自检 + PM 工作观察

---

## 执行摘要

PM 视角关注：**用户价值、体验一致性、交付效率**。基于今日提案汇总，识别 3 项 PM 专属提案，重点关注 task_manager 挂起对协调效率的影响及 confirmationStore 拆分对用户流程稳定性的风险。

---

## 提案 1: task_manager 协调效率提升 [P0]

**来源**: PM 观察  
**问题**: task_manager.py list/claim 挂起（P0-2）直接影响 PM 任务领取和状态更新效率。PM 依赖该工具进行每日心跳扫描和任务追踪，挂起导致协调延迟。  
**方案**: 短期：降级为 JSON 直读；长期：重构为无状态设计  
**工时**: 2-4h（dev）  
**产品价值**: 恢复所有 Agent 心跳自动化，提升协调效率 100%  
**验收标准**:
```
expect(task_manager('list').projects).toBeDefined()
expect(task_manager('list').exitTime).toBeLessThan(5000)
```

---

## 提案 2: confirmationStore 拆分用户影响评估 [P1]

**来源**: Architect P1-3  
**问题**: confirmationStore.ts 461 行拆分重构（P1-3）是高破坏性变更，涉及 5 个子流程（RequirementStep/ContextStep/ModelStep/FlowStep/共享状态）。任何迁移遗漏都可能导致用户流程中断。  
**方案**: 
1. 拆分前：建立完整的用户流程回归测试套件
2. 拆分中：分 3 批 PR，每批验证一个 slice 的端到端流程
3. 拆分后：灰度发布，先覆盖 10% 用户流量
**工时**: 0.5d（PM 流程评估）+ dev 1.5d  
**产品价值**: 降低重构风险，避免用户流程回退  
**验收标准**:
```
expect(confirmationFlow.endToEnd()).toHaveNoErrors()
expect(regressionTests.coverage).toBeGreaterThanOrEqual(95)
```

---

## 提案 3: 提案生命周期规范化 [P2]

**来源**: PM 观察  
**问题**: 当前提案收集→汇总→PRD→实施流程分散在多个 agent workspace，缺乏统一入口。Coord 多次催促提案完成，导致重复沟通成本。  
**方案**: 
1. 提案统一存放路径：`vibex/docs/proposals/{date}/`
2. 提案命名规范：`{agent}-proposals-{date}.md`
3. Coord 任务追踪替代人工催促
**工时**: 0.5d（流程文档）+ 1d（工具支持）  
**产品价值**: 减少协调摩擦，提升跨 Agent 协作透明度  
**验收标准**:
```
expect(proposalPath('{agent}', '{date}')).toBeCanonical()
expect(coordTask.pending).toHaveLength(0)
```

---

## 工时汇总

| 优先级 | 提案数 | 工时 |
|--------|--------|------|
| P0 | 1 | 2-4h |
| P1 | 1 | 0.5d+1.5d |
| P2 | 1 | 0.5d+1d |
| **合计** | **3** | **~3.5d** |

---

## 与其他 Agent 提案的关联

| 关联提案 | 关系 | 说明 |
|----------|------|------|
| P0-2 task_manager 挂起 | 依赖 | P0 修复后提案生命周期才能规范化 |
| P1-3 confirmationStore 拆分 | 协同 | PM 评估用户影响，dev 执行拆分 |
| 提案汇总 | 输入 | 本次提案为汇总 P0/P1 补充 PM 视角 |
