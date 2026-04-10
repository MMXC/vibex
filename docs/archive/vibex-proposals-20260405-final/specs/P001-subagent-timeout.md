# Dev 提案 P001 — subagent 超时处理策略改进

**Agent**: dev
**日期**: 2026-04-05

## 问题描述
今天 3 个 subagent（E1/E3 fix/E3修复）均因 5 分钟超时失败，其中 2 个已完成代码修改只是未 commit。

典型案例：
- e1-canvas-api: 完成但未 commit
- e3-fix-empty-state: 完成但未 commit
- e3-canvas-ux: 完成并 commit，但 subagent 报告超时

## 根因分析
subagent 超时后 parent 无法区分「代码完成但未提交」vs「代码未完成」，导致双重工作。

## 建议方案
subagent 工具链增加中间 checkpoint：在代码修改后（commit 前）输出确定性摘要，包含：
- 修改的文件列表
- 每个文件的关键 diff 行
- 「DONE - 代码完成，待 commit」明确声明

Parent 检测到后主动接管 commit，无需等待 subagent 完成。
