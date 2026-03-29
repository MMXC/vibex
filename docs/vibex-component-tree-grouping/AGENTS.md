# AGENTS.md: VibeX Canvas 组件树分组修复 — Agent 协作指南

> **项目**: vibex-component-tree-grouping
> **日期**: 2026-03-30

---

## 角色与职责

| Agent | 职责 | 产出物 |
|-------|------|--------|
| **Analyst** | 问题根因分析 | analysis.md ✅ |
| **PM** | PRD 细化 | prd.md ✅ |
| **Architect** | 架构设计 + 实现计划 | architecture.md ✅, IMPLEMENTATION_PLAN.md ✅ |
| **Dev** | Epic 1-3 实施 | PR + 代码变更 |
| **Tester** | E2E 测试 | gstack 截图 + 测试报告 |
| **Reviewer** | 代码审查 | review 报告 |

---

## 开发流程

### Phase 1: Epic 1 — 分组逻辑多维判断 (Dev, 3h)

1. 阅读 `ComponentTree.tsx`，理解 `inferIsCommon()` 和 `getPageLabel()`
2. 修改 `COMMON_FLOW_IDS`，移除 `'common'`
3. 新增 `COMMON_COMPONENT_TYPES`
4. 修改 `inferIsCommon()` 支持多维判断
5. 编写 `ComponentTree.test.ts` 单元测试
6. 确保覆盖率 ≥ 80%

### Phase 2: Epic 2 — Backend AI flowId 修复 (Dev, 4h)

1. 修改 backend AI prompt，要求输出 `flowId`
2. 后端验证 `flowId` 有效性
3. 前端 `canvasApi.ts` fallback 优化
4. 集成测试：AI 生成的组件有正确的 flowId

### Phase 3: Epic 3 — 手动重分组 UI (Dev, 6h, P1)

1. 实现右键重分组菜单
2. 实现 drag-drop 重分组
3. 状态持久化到后端
4. gstack E2E 测试

---

## 关键文件

| 文件 | 作用 | 修改者 |
|------|--------|--------|
| `ComponentTree.tsx` | 分组逻辑 | Dev |
| `canvasApi.ts` | 前端 API fallback | Dev |
| `backend canvas/index.ts` | AI prompt | Dev (Backend) |
| `ComponentTree.test.ts` | 单元测试 | Dev (新建) |

---

## 协作约定

- **Epic 1 完成后** → 通知 Tester 验证组件分组（通用 vs 非通用）
- **Epic 2 完成后** → 端到端测试 AI 生成组件的 flowId
- **Epic 3 完成后** → 全量 E2E 测试重分组功能
- **PR 创建后** → Reviewer 代码审查
