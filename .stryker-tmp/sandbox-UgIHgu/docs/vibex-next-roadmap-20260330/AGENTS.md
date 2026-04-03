# AGENTS.md: VibeX 下一阶段路线图 — Agent 协作指南

> **项目**: vibex-next-roadmap-20260330
> **日期**: 2026-03-30

---

## 角色与职责

| Agent | 职责 | 产出物 |
|-------|------|--------|
| **Analyst** | gstack QA 验证 | analysis.md ✅ |
| **PM** | PRD 细化 | prd.md ✅ |
| **Architect** | 路线图架构 + 实现计划 | architecture.md ✅, IMPLEMENTATION_PLAN.md ✅ |
| **Dev** | Phase 0-3 实施 | PR + 代码变更 |
| **Tester** | E2E 测试 | gstack 截图 + 测试报告 |
| **Reviewer** | 代码审查 | review 报告 |

---

## Phase 执行指南

### Phase 0: Bug Fix Sprint (Week 1)

**目标**: 消除 product-blocking bug

| Epic | 任务 | Dev |
|------|------|-----|
| Epic 1 | B1 按钮修复 | dev |
| Epic 2 | Checkbox 去重 | dev |
| Epic 3 | BC 树连线修复 | dev |
| Epic 4 | 组件树分类修复 | dev |
| Epic 5 | OverlapHighlightLayer 集成 | dev |

**文档参考**:
- `vibex-canvas-checkbox-dedup/architecture.md`
- `vibex-bc-canvas-edge-render/architecture.md`
- `vibex-component-tree-grouping/architecture.md`

### Phase 1: Phase2 功能 (Week 2)

**目标**: 完成 expand-both + maximize + 高亮

| Epic | 任务 | Dev |
|------|------|-----|
| Epic 6 | 全屏模式 | dev |
| Epic 7 | 高亮与标记 | dev |

**文档参考**: `canvas-phase2/architecture.md`

### Phase 2: 基础设施 (Week 2 并行)

**目标**: task_manager 通知 + 提案收集自动化

| Epic | 任务 | Dev |
|------|------|-----|
| Epic 8 | task_manager 通知 | dev |
| Epic 9 | 提案收集自动化 | dev |

**文档参考**: `task-manager-curl-integration/architecture.md`

### Phase 3: UX 增强 (Week 3)

**状态**: 待需求澄清

---

## 协作约定

- **每日站会**: 更新任务状态，发现阻塞立即上报
- **Epic 完成**: 通知 Tester 进行 gstack 截图验证
- **Phase 0 完成**: Reviewer 全量代码审查
- **Phase 1+2**: 可并行执行，不同 Dev 负责不同 Phase
