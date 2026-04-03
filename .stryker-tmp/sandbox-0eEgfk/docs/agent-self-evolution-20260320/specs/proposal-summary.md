# Feature: 提案汇总与优先级排序

## Jobs-To-Be-Done
- 作为一个 **Coord Agent**，我希望所有提案自动汇总到统一目录并生成索引，以便 PM 快速浏览和决策。
- 作为一个 **PM**，我希望能一眼看到所有提案的优先级排序和关键信息，以便高效决策。
- 作为一个 **Analyst**，我希望能对提案进行可行性评估，输出结构化分析报告。

## User Stories
- **US4**: Coord 检测到所有 Agent 提案已提交 → 自动汇总到 `proposals/YYYYMMDD/INDEX.md`
- **US5**: Analyst 对所有提案进行可行性评估（P0/P1/P2 + 工作量估算）
- **US6**: PM 确认优先级，输出 Sprint 路线图建议

## Requirements
- [ ] (F2.1) Coord 在所有 Agent 完成提案后，自动生成 `proposals/YYYYMMDD/INDEX.md`
- [ ] (F2.2) INDEX.md 包含：所有提案标题、提案人、优先级（P0/P1/P2）、状态
- [ ] (F2.3) Analyst 在 D+1 12:00 前完成所有提案的可行性评估
- [ ] (F2.4) 评估结果附加到每份提案末尾（`## 可行性评估` 章节）
- [ ] (F2.5) PM 在 D+1 18:00 前确认优先级，生成路线图建议
- [ ] (F2.6) 路线图保存到 `proposals/YYYYMMDD/ROADMAP.md`

## Technical Notes
- 汇总时机：所有 6 个任务状态为 `done` 时触发
- 汇总脚本：可复用现有 `proposals-summary` 项目逻辑
- Slack 通知：汇总完成后发送到 #coord 频道

## Acceptance Criteria
- [ ] **AC7**: INDEX.md 包含所有提案的标题、提案人、优先级、文件链接
- [ ] **AC8**: 可行性评估覆盖 100% 提案（不允许遗漏）
- [ ] **AC9**: ROADMAP.md 包含 P0/P1/P2 分类和资源估算
- [ ] **AC10**: PM 确认后 Slack 通知到 #pm 频道
