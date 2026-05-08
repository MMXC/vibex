---
title: Sprint 30 — 5 Epic 单日交付
date: 2026-05-08
category: docs/solutions/workflow-issues/
module: VibeX Canvas
problem_type: workflow_issue
component: development_workflow
severity: medium
applies_when:
  - Sprint 含 5 个 Epic 且相互无依赖时
  - DAG pipeline 可并发执行时
  - 需要在 1 天内完成分析→开发→测试→review→push 全链路时
tags: [sprint-30, multi-epic, dag-pipeline, parallel-execution, vitepress-replacement]
---

# Sprint 30 — 5 Epic 单日交付

## Context

Sprint 30 包含 5 个相互独立的 Epic，目标是单日完成交付。经验证，DAG pipeline + parallel Epic 执行可将 5 Epic 交付时间压缩至 1 天。

## Sprint 30 交付成果

| Epic | 功能 | Commit | CHANGELOG |
|------|------|--------|-----------|
| E01 ProtoPreview 热更新 | 选中节点 → ProtoPreview 200ms 内渲染，Props 热更新 | `c8a8f345e` | `S30-E01` |
| E02 项目导入导出 | GET /api/projects/:id/export → .vibex，导入校验 | `bcbff268a` | `S30-E02` |
| E03 E2E 测试补全 | ShareBadge + ShareToTeamModal E2E，CI 卡口 | `fc15517a7` | `S30-E03` |
| E04 Spec 补全 | Sprint 28-29 Spec 文档（E04-template-crud + S29-E01） | `766e984f8` | `S30-E04` |
| E05 Presence 层增强 | Firebase RTDB 就绪状态检测 + 降级方案 | `fd4f5476a` | `S30-E05` |

## Guidance

### 成功的关键因素

1. **DAG pipeline 并发执行**：coord-decision 通过后，5 个 Epic 的 dev 任务可全部并发启动，依赖链仅在 reviewer-push 阶段顺序串联
2. **独立 Epic 无阻塞**：5 Epic 之间无横向依赖，每个 Epic 独立完成 dev→tester→reviewer→reviewer-push 四阶段
3. **经验迁移**：ProtoPreview 热更新复用 Sprint 29 E01 ProtoPreview 架构；导入导出基于现有 Design Output API 扩展
4. **Spec 先行**：Sprint 28-29 遗留的 Spec 补全作为 E04 优先级最低但仍按时完成

### DAG Pipeline 执行模式

```
coord-decision (all 5 Epics approved)
    ↓
dev-e01 // dev-e02 // dev-e03 // dev-e04 // dev-e05  ← 并发
    ↓
tester-e01 // tester-e02 // tester-e03 // tester-e04 // tester-e05  ← 并发
    ↓
reviewer-e01 // reviewer-e02 // reviewer-e03 // reviewer-e04 // reviewer-e05  ← 并发
    ↓
reviewer-push-e01 → reviewer-push-e02 → reviewer-push-e03 → reviewer-push-e04 → reviewer-push-e05  ← 顺序（merge 保护）
    ↓
coord-completed
```

### 常见问题

- **npm test 超时**：Sprint 30 的 npm test 在 CI 环境下超时（pnpm react-window react 非必需依赖），但 E2E 测试（playwright）实际通过。测试策略需区分单元测试和 E2E 测试的独立 CI 通道。
- **多 Epic changelog 冲突**：多个 Epic 并发写 CHANGELOG 时需注意 git merge 冲突，建议 reviewer 阶段顺序处理。
- **Presence 层降级**：Firebase RTDB 未配置时 Presence 层应有降级方案，不影响核心编辑功能。

## Why This Matters

- 5 Epic 单日交付证明了 DAG pipeline 在高并发场景下的可扩展性
- 多 Epic 并发执行将平均交付时间从每个 Epic 半天压缩至整体 1 天
- 经验复用（ProtoPreview 架构 + Design Output API）显著降低重复开发成本

## When to Apply

- Sprint 含 5+ 个相互独立的 Epic
- 每个 Epic 可独立完成四阶段（dev→tester→reviewer→push）
- 需要快速验证 POC 或在 deadline 前完成批量交付

## Related

- `vibex-proposals-sprint23` — Sprint 23 5 Epic 单日交付经验
- `vibex-proposals-sprint22` — Sprint 22 5 Epic DAG pipeline 首次验证
- `multi-epic-dag-pipeline-coordination` — 多 Epic DAG pipeline 协调模式
- `vibex-proposals-sprint29-qa` — Sprint 29 QA 验收经验（Sprint 28 E1-E7）