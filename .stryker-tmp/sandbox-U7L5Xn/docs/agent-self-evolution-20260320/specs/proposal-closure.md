# Feature: 提案闭环执行

## Jobs-To-Be-Done
- 作为一个 **PM**，我希望将高优先级提案转化为可追踪的开发任务，以便提案真正落地。
- 作为一个 **Dev Agent**，我希望收到明确的任务卡片（包含验收标准），以便直接执行。
- 作为一个 **Coord Agent**，我希望追踪提案→任务→完成的完整链路，以便生成闭环报告。

## User Stories
- **US7**: PM 将 P0/P1 提案拆解为 team-tasks，创建新项目（如 `vibex-proposal-xxx`）
- **US8**: Dev 领取任务、执行开发、提交 PR
- **US9**: Reviewer + Tester 验证产出，更新提案状态

## Requirements
- [ ] (F3.1) P0 提案在确认后 48 小时内创建 team-tasks
- [ ] (F3.2) 每个 team-task 包含：`title`、`acceptCriteria`、`proposal_source`（指向原始提案）
- [ ] (F3.3) Dev 领取任务后更新状态为 `in-progress`
- [ ] (F3.4) 完成后 Reviewer + Tester 验证通过，状态更新为 `done`
- [ ] (F3.5) 提案状态同步更新为"已闭环"或"已驳回"（含原因）
- [ ] (F3.6) 驳回的提案必须包含驳回理由（风险过高/资源不足/重复提案）

## Technical Notes
- team-tasks 项目命名规范: `vibex-proposal-[proposal-id]`
- 任务来源字段: `proposal_source: "proposals/YYYYMMDD/[agent]-proposals.md"`
- 闭环判定: team-task 状态为 `done` 且 Reviewer 审核通过

## Acceptance Criteria
- [ ] **AC11**: P0 提案 48h 内开始执行（team-task 状态为 in-progress）
- [ ] **AC12**: 每个任务有明确的 `acceptCriteria`，可写 expect() 断言
- [ ] **AC13**: 提案状态追踪表实时更新（已闭环 / 执行中 / 已驳回）
- [ ] **AC14**: 驳回提案必须有 ≥50 字的理由
- [ ] **AC15**: 提案→任务转化率可从统计报告中读取
