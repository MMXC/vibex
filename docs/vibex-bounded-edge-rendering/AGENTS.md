# AGENTS.md: VibeX 限界上下文树连线渲染异常 — Agent 协作指南

> **项目**: vibex-bounded-edge-rendering
> **日期**: 2026-03-30
> **状态**: 与 vibex-bc-canvas-edge-render 共享实现方案

---

## 同根因声明

> ⚠️ 本项目与 `vibex-bc-canvas-edge-render` 为**同一根因**，修复方案完全相同。建议 Coord 合并为单一开发任务。

所有 Agent 协作约定和开发流程见：`vibex-bc-canvas-edge-render/AGENTS.md`

---

## 角色与职责

| Agent | 职责 | 产出物 |
|-------|------|--------|
| **Analyst** | 问题根因分析 | analysis.md ✅ |
| **PM** | PRD 细化 | prd.md ✅ |
| **Architect** | 架构设计 + 实现计划 | architecture.md ✅, IMPLEMENTATION_PLAN.md ✅ |
| **Dev** | **共享 vibex-bc-canvas-edge-render 的实现** | PR + 代码变更 |
| **Tester** | E2E 测试 | gstack 截图 + 测试报告 |
| **Reviewer** | 代码审查 | review 报告 |
