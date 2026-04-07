# IMPLEMENTATION_PLAN: VibeX 下一阶段路线图

> **项目**: vibex-next-roadmap-20260330
> **创建日期**: 2026-03-30
> **类型**: 多阶段路线图

---

## 1. Phase 执行顺序

```
Week 1 (Phase 0: Bug Fix Sprint)
├── Day 1: B1 按钮修复 + Checkbox 去重开始
├── Day 2: Checkbox 去重完成 + BC 树连线
├── Day 3: 组件树分类修复 + OverlapHighlightLayer
└── Day 4-5: 回归测试 + Review

Week 2 (Phase 1 + Phase 2 并行)
├── Phase 1: expand-both + maximize
└── Phase 2: task_manager 通知

Week 3 (Phase 3: UX 增强)
└── Phase 3: UX 改进
```

---

## 2. Phase 0: Bug Fix Sprint — 详细计划

### Epic 1: B1 按钮修复 (1h)

| Story | 描述 | 工时 |
|-------|------|------|
| S1.1 | 移除 `disabled={allConfirmed}` | 0.5h |
| S1.2 | 验证按钮可点击跳转 | 0.5h |

**关键文件**: `BoundedContextTree.tsx:519`

### Epic 2: Checkbox 去重 (6h)

| Story | 描述 | 工时 |
|-------|------|------|
| S2.1 | 移除 selection checkbox | 2h |
| S2.2 | 确认 checkbox 移至描述前 | 2h |
| S2.3 | 验证交互正常 | 1h |

**关键文件**: `BoundedContextTree.tsx:233-256`

> 详细方案见 `vibex-canvas-checkbox-dedup/architecture.md`

### Epic 3: BC 树连线修复 (6h)

| Story | 描述 | 工时 |
|-------|------|------|
| S3.1 | CSS 布局改为水平 | 3h |
| S3.2 | bestAnchor 算法加固 | 2h |
| S3.3 | 验证连线水平展开 | 1h |

**关键文件**: `canvas.module.css:809`, `edgePath.ts`

> 详细方案见 `vibex-bc-canvas-edge-render/architecture.md`

### Epic 4: 组件树分类修复 (6h)

| Story | 描述 | 工时 |
|-------|------|------|
| S4.1 | 修复 AI flowId 填充 | 3h |
| S4.2 | 多维分组判断实现 | 2h |
| S4.3 | 验证分类正确 | 1h |

**关键文件**: `ComponentTree.tsx:51-53`, `backend canvas/index.ts`

> 详细方案见 `vibex-component-tree-grouping/architecture.md`

### Epic 5: OverlapHighlightLayer 集成 (2h)

| Story | 描述 | 工时 |
|-------|------|------|
| S5.1 | 导入组件 | 1h |
| S5.2 | 验证渲染 | 1h |

**关键文件**: `CardTreeRenderer.tsx`

---

## 3. Phase 1: Phase2 功能完成 — 详细计划

### Epic 6: 全屏模式 (5h)

| Story | 描述 | 工时 |
|-------|------|------|
| S6.1 | expand-both 实现 | 2h |
| S6.2 | maximize 实现 | 2h |
| S6.3 | 快捷键绑定 (F11/ESC) | 1h |

### Epic 7: 高亮与标记 (4h)

| Story | 描述 | 工时 |
|-------|------|------|
| S7.1 | 交集高亮实现 | 2h |
| S7.2 | 起止节点标记 | 2h |

> 详细方案见 `canvas-phase2/architecture.md`

---

## 4. Phase 2: 基础设施 — 详细计划

### Epic 8: task_manager 通知 (7h)

> 详细方案见 `task-manager-curl-integration/architecture.md`

### Epic 9: 提案收集自动化 (3h)

**实现**: 每日 cron 脚本汇总各 agent 提案

```bash
# scripts/daily-proposal-collection.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
DEST=docs/proposals/${DATE}/
mkdir -p $DEST
# 汇总各 agent 提案...
```

---

## 5. Phase 3: UX 增强 — 待澄清

| 功能 | 描述 | 工时 | 状态 |
|------|------|------|------|
| TBD | 待需求澄清 | ~12h | 待确认 |

---

## 6. 工时汇总

| Phase | Epic | 工时 |
|-------|------|------|
| Phase 0 | Epic 1-5 | ~21h |
| Phase 1 | Epic 6-7 | ~9h |
| Phase 2 | Epic 8-9 | ~10h |
| Phase 3 | TBD | ~12h |
| **合计** | | **~52h** |

---

## 7. 文件清单（跨项目引用）

| 项目 | 文档位置 |
|------|---------|
| Checkbox 去重 | `vibex-canvas-checkbox-dedup/architecture.md` |
| BC 树连线 | `vibex-bc-canvas-edge-render/architecture.md` |
| 组件树分类 | `vibex-component-tree-grouping/architecture.md` |
| Phase2 功能 | `canvas-phase2/architecture.md` |
| task_manager 通知 | `task-manager-curl-integration/architecture.md` |
