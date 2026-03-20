# Feature: 每日自检任务执行

## Jobs-To-Be-Done
- 作为一个 **Agent**，我希望每天自动领取并完成一次自我审视任务，以便发现自己的改进空间并产出结构化提案。
- 作为一个 **Coord Agent**，我希望系统能自动检测遗漏的 Agent 并双重唤醒（Slack + sessions_send），以确保批次完整执行。

## User Stories
- **US1**: Agent 领取自检任务 → 执行自检（审视当日产出）→ 填写提案 → 更新任务状态为 done
- **US2**: Coord 检测到某 Agent 未在 D+0 08:00 前完成 → 发送 Slack 提醒 + sessions_send 唤醒
- **US3**: 新 Agent 首次加入时，系统自动添加其到自检任务列表

## Requirements
- [ ] (F1.1) Coord 每天 03:12 UTC 自动创建 `agent-self-evolution-YYYYMMDD` 项目（如不存在）
- [ ] (F1.2) 项目包含 6 个子任务（每个 Agent 1 个），状态初始为 `ready`
- [ ] (F1.3) 每个 Agent 心跳时自动领取分配给自己的 `analyze-requirements` 任务
- [ ] (F1.4) Agent 产出的提案保存到 `proposals/YYYYMMDD/[agent]-proposals.md`
- [ ] (F1.5) Coord 在 D+0 06:00 检测未完成 Agent，D+0 08:00 进行最终唤醒
- [ ] (F1.6) 提案使用标准化模板（见 PRD Section 8）
- [ ] (F1.7) 任务完成后更新 `tasks.json` 状态为 `done`

## Technical Notes
- 任务文件路径: `workspace-coord/team-tasks/projects/agent-self-evolution-YYYYMMDD/tasks.json`
- 提案目录: `/root/.openclaw/proposals/YYYYMMDD/`
- 唤醒方式: Slack 消息 + sessions_send（双重保障）
- 心跳脚本: `pm-heartbeat.sh` 等各 Agent 心跳脚本

## Acceptance Criteria
- [ ] **AC1**: Coord 在 03:15 UTC 前完成项目创建和任务派发（正常情况）
- [ ] **AC2**: 每个 Agent 每天至少产出 1 个有效提案（格式达标）
- [ ] **AC3**: 提案文件名符合规范：`[agent]-proposals.md`
- [ ] **AC4**: 所有提案在 D+0 08:00 前保存到正确目录
- [ ] **AC5**: 遗漏 Agent 在 D+0 08:00 收到双重唤醒
- [ ] **AC6**: Coord 心跳报告中体现当日批次状态
