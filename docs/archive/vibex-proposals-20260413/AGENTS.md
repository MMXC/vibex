# AGENTS.md — VibeX Sprint 2026-04-13

**Agent**: architect
**Date**: 2026-04-10
**Project**: vibex-proposals-20260413

---

## 1. 项目概述

本次 Sprint 是 VibeX 前端组件 Design Token 对齐 + 主题层建设。两个 Epic 并行：

- **P001**: JsonTreeRenderer 风格适配 VibeX Design Tokens
- **P002**: 自定义组件统一主题层架构

---

## 2. 开发约束（必须遵守）

### 2.1 样式系统约束

| 约束 | 原因 |
|------|------|
| **禁止硬编码 hex 颜色** | 破坏主题一致性，新增 token 后无法自动跟随 |
| **优先使用 `var(--color-*)` token** | 统一视觉系统，支持主题切换 |
| **禁止引入 Tailwind CSS / styled-components / vanilla-extract** | 与现有 CSS Modules 技术栈不一致，工期不允许 |
| **工具类统一使用 `vx-` 前缀** | 避免命名空间冲突 |
| **CSS Modules 优先** | 保持组件样式隔离，工具类在 `:global` 中使用 |

### 2.2 文件约束

| 操作 | 约束 |
|------|------|
| **新建** | `src/styles/theme-utilities.css`（主题工具层） |
| **改造** | `src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css` |
| **可选改造** | `src/components/canvas/ComponentTree.module.css` |
| **禁止改动** | `src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.tsx`（逻辑不变） |
| **禁止改动** | `src/hooks/useJsonTreeVisualization.ts`（Hook 不变） |

### 2.3 CSS 改造规则

```css
/* ✅ 正确：使用 token */
.renderer {
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
}

/* ❌ 错误：硬编码 hex */
.renderer {
  background: #fafafa;
  border: 1px solid #e5e7eb;
}

/* ✅ 正确：CSS Modules + global 工具类 */
:global(.vx-glass) {
  /* 全局工具类 */
}

/* ✅ 正确：composes 引用 */
.myRow {
  composes: vx-row-hover from global;
  background: var(--color-bg-tertiary);
}
```

### 2.4 测试约束

| 测试类型 | 要求 |
|----------|------|
| Vitest | 新增深色主题断言测试，100% 通过 |
| Playwright 截图 | `json-tree-dark-theme.png` 截图对比，threshold: 0.1 |
| CSS 行数 | 改造后 ≤ 126 行（减少 ≥ 30%） |
| 工具类数量 | `theme-utilities.css` ≥ 10 个 `vx-*` 类 |

---

## 3. 提交规范

### 3.1 Commit Message 格式

```
feat(design-system): add theme-utilities.css with 15 vx-* utility classes

feat(design-system): adapt JsonTreeRenderer to VibeX design tokens

feat(design-system): integrate ComponentTree with theme-utilities
```

### 3.2 PR 要求

- 标题: `feat: VibeX Design Token 对齐 + 主题层建设`
- 描述: 包含 P001 + P002 改动说明
- 必须包含: Playwright 截图对比报告
- 必须包含: CSS 行数变化报告
- CI: Vitest + Playwright 均通过

---

## 4. 依赖关系

```
theme-utilities.css (Task 1)
    ↓
JsonTreeRenderer.module.css (Task 2) ← 依赖 Task 1 完成
    ↓
ComponentTree.module.css (Task 4) ← 可选，依赖 Task 1 完成
```

---

## 5. 禁止事项

- ❌ 不许修改 `JsonTreeRenderer.tsx` 的 JSX 结构（仅允许 CSS 改动）
- ❌ 不许修改任何 Props 接口定义
- ❌ 不许修改 `useJsonTreeVisualization` hook
- ❌ 不许修改 `design-tokens.css` 中的任何 token 定义
- ❌ 不许在 CSS 中使用 `!important`（主题系统不允许）
- ❌ 不许引入新的 npm 包（纯 CSS 方案）

---

## 6. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260413
- **执行日期**: 2026-04-13
