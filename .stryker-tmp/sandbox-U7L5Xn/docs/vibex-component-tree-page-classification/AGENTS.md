# AGENTS.md: VibeX Canvas 组件树页面分类修复 — Agent 协作指南

> **项目**: vibex-component-tree-page-classification
> **日期**: 2026-03-30

---

## 角色与职责

| Agent | 职责 | 产出物 |
|-------|------|--------|
| **Analyst** | 问题根因分析 | analysis.md ✅ |
| **PM** | PRD 细化 | prd.md ✅ |
| **Architect** | 架构设计 + 实现计划 | architecture.md ✅, IMPLEMENTATION_PLAN.md ✅ |
| **Dev** | 实施 + 协同 | PR + 代码变更 |
| **Tester** | E2E 测试 | gstack 截图 + 测试报告 |
| **Reviewer** | 代码审查 | review 报告 |

---

## 协同说明

> ⚠️ **重要**: 本项目与 `vibex-component-tree-grouping` **同源**，建议 Dev 在**同一 PR** 中处理两个项目。

### 共享修复内容

| 修复点 | 涉及文件 | 说明 |
|--------|----------|------|
| Backend AI prompt | `backend canvas/index.ts` | Epic 2，两项目共享 |
| `matchFlowNode()` | `ComponentTree.tsx` | 抽取为共享函数 |
| `COMMON_FLOW_IDS` | `ComponentTree.tsx` | 统一常量管理 |
| 单元测试 | `ComponentTree.test.ts` | 两项目共享测试文件 |

---

## 开发流程

### Phase 1: Epic 1 — getPageLabel Fallback (Dev, 2h)

1. 阅读 `ComponentTree.tsx`，理解 `getPageLabel()` 当前逻辑
2. 实现 4 层 fallback（精确匹配 → prefix → name → 兜底）
3. 抽取 `matchFlowNode()` 共享函数
4. 编写单元测试
5. gstack screenshot 验证分类正确

### Phase 2: 协同处理 (Dev)

与 `vibex-component-tree-grouping` 协同，共享：
1. Backend AI prompt 修改
2. `COMMON_FLOW_IDS` 常量统一
3. `matchFlowNode()` 函数复用

---

## 关键文件

| 文件 | 作用 | 修改者 |
|------|--------|--------|
| `ComponentTree.tsx` | 分组 + 分类逻辑 | Dev |
| `ComponentTree.test.ts` | 单元测试 | Dev (新建) |
| `backend canvas/index.ts` | AI prompt | Dev (Backend) |

---

## 协作约定

- **Epic 1 完成后** → 通知 Tester 验证分类（无"未知页面"误报）
- **协同 PR 创建后** → Reviewer 同时审查两个项目
- **gstack screenshot** → 验证组件正确分类到各页面虚线框
