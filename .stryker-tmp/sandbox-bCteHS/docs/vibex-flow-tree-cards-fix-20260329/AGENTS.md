# Vibex 流程树卡片显示 Bug 修复 — 开发约束

**项目**: vibex-flow-tree-cards-fix-20260329  
**文档类型**: 开发约束（供 dev / tester / reviewer 使用）  
**日期**: 2026-03-29  
**状态**: ✅ 修复已实施，待 QA 验证

---

## 🎯 核心约束

### 必须遵守

| # | 约束 | 原因 |
|---|------|------|
| **C1** | 不得恢复 `.flowCard` 的 `overflow: hidden` | 恢复将重新引入卡片截断 bug |
| **C2** | 不得恢复 `.stepsList` 的 `max-height: 300px` | 恢复将重新引入步骤上限截断 |
| **C3** | 不得在 `.flowCard` 上添加固定 `height` 或 `max-height` | 会阻止卡片随内容扩展 |
| **C4** | 不得修改 `.flowCard` 的 `transition` 覆盖项 | 当前 `transition: border-color 0.2s ease` 仅用于边框颜色动画，不影响高度 |
| **C5** | 不得删除 `position: relative`（`.flowCard`） | 该属性保留给 checkbox 绝对定位 |

### 允许的变更

| # | 变更 | 说明 |
|---|------|------|
| A1 | 在 `.flowCard` 上添加 `min-height` | 如需保证最小高度，可添加 `min-height` |
| A2 | 在 `.stepsList` 上添加 `max-height`（值需 > 300px） | 如需保留内滚动，可设更大值并经 UX 确认 |
| A3 | 调整 `.flowCard` 的 `border`、`border-radius`、`background` | 仅样式调整，不影响布局 |
| A4 | 在 `.flowCard` 上添加 `box-shadow` | 不影响高度计算 |

---

## 🚫 禁止事项

1. **禁止**在 `.flowCard` 上设置任何形式的固定高度（`height`、`max-height`）
2. **禁止**在 `.stepsList` 上重新添加 `max-height` 限制（除非经过 UX 评审）
3. **禁止**在修改后的 CSS 周围添加未注释的废弃代码
4. **禁止**修改 `BusinessFlowTree.tsx` 组件逻辑（本次修复为纯 CSS）

---

## 📐 设计决策记录

| 决策 | 结论 | 日期 |
|------|------|------|
| `.flowCard` 是否移除 `overflow: hidden`？ | ✅ 移除 | 2026-03-29 |
| `.stepsList` 是否移除 `max-height: 300px`？ | ✅ 移除 | 2026-03-29 |
| `.stepsList` 是否移除 `overflow-y: auto`？ | ✅ 移除（与 max-height 联动） | 2026-03-29 |
| 滚动功能由谁承接？ | `.flowList` 的 `overflow-y: auto` | 2026-03-29 |

---

## 🔗 相关文件

| 文件 | 作用 | 约束级别 |
|------|------|---------|
| `vibex-fronted/src/components/canvas/canvas.module.css` | CSS 样式（修改范围） | 🔴 核心 |
| `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` | 组件逻辑（禁止修改） | 🔴 禁止 |
| `docs/vibex-flow-tree-cards-fix-20260329/architecture.md` | 架构设计 | 📖 参考 |
| `docs/vibex-flow-tree-cards-fix-20260329/prd.md` | 需求文档 | 📖 参考 |

---

## 👥 角色职责

| 角色 | 职责 |
|------|------|
| **dev** | 遵守本约束文件中的 C1-C5 和禁止事项 |
| **tester** | 执行 IMPLEMENTATION_PLAN.md 中的 8 项回归检查 |
| **reviewer** | PR 审查时确认无违反约束的代码变更 |

---

## 📌 备注

- 本次修复为**纯 CSS 变更**，无 TypeScript / React 逻辑修改
- 变更范围：1 个文件，3 行删除
- 修复提交：`510ed216`
