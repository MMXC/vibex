# Spec: P002 — 自定义组件统一主题层

## 概述

在 `src/styles/` 下新建 `theme-utilities.css`，封装组件级可复用样式片段（工具类），建立 VibeX Design System 的组件级样式复用机制。

**产出文件**: `src/styles/theme-utilities.css`
**目标**: ≥10 个工具类，覆盖组件开发中最常用的样式模式。

---

## 工具类定义

### 1. 玻璃态容器 — `.vx-glass`

```css
.vx-glass {
  background: var(--color-bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
```

**用途**: JsonTreeRenderer 容器、浮层背景、卡片背景
**设计依据**: VibeX 设计系统核心——玻璃态 + 霓虹发光

### 2. 玻璃态容器（深）— `.vx-glass-deep`

```css
.vx-glass-deep {
  background: rgba(13, 13, 22, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-glass);
}
```

**用途**: 深层面板、模态框背景

### 3. 霓虹悬停边框 — `.vx-neon-hover`

```css
.vx-neon-hover {
  transition: border-color var(--duration-normal) var(--ease-out-expo),
              box-shadow var(--duration-normal) var(--ease-out-expo);
}
.vx-neon-hover:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow-cyan);
}
```

**用途**: 可交互行的悬停反馈、卡片 hover

### 4. 霓虹悬停背景 — `.vx-neon-bg-hover`

```css
.vx-neon-bg-hover {
  transition: background var(--duration-fast), box-shadow var(--duration-normal);
}
.vx-neon-bg-hover:hover {
  background: var(--color-primary-muted);
  box-shadow: inset 0 0 8px var(--color-primary-glow);
}
```

**用途**: 表格行悬停、列表项悬停

### 5. 工具栏容器 — `.vx-toolbar`

```css
.vx-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}
```

**用途**: JsonTreeRenderer 工具栏、ComponentTree 工具栏、搜索栏容器

### 6. 搜索输入框 — `.vx-search`

```css
.vx-search {
  width: 100%;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color var(--duration-normal),
              box-shadow var(--duration-normal);
}
.vx-search::placeholder {
  color: var(--color-text-muted);
}
.vx-search:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-muted);
}
```

**用途**: 搜索框、过滤输入

### 7. 行悬停 — `.vx-row-hover`

```css
.vx-row-hover {
  transition: background var(--duration-fast),
              box-shadow var(--duration-fast);
  cursor: pointer;
}
.vx-row-hover:hover {
  background: var(--color-bg-tertiary);
  box-shadow: inset 0 0 8px var(--color-primary-muted);
}
```

**用途**: JSON 行、树节点行、列表项

### 8. 行选中 — `.vx-row-selected`

```css
.vx-row-selected {
  background: var(--color-primary-muted) !important;
  border-left: 2px solid var(--color-primary);
}
```

**用途**: 被选中的行，强调主色

### 9. 次要文字 — `.vx-text-secondary`

```css
.vx-text-secondary {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
```

**用途**: 统计数字、提示文字、计数显示

### 10. 主文字 — `.vx-text-primary`

```css
.vx-text-primary {
  color: var(--color-text-primary);
  font-weight: var(--font-medium);
}
```

**用途**: 键名、重要标签

### 11. 代码/值文字 — `.vx-text-code`

```css
.vx-text-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}
```

**用途**: JSON 值、代码片段显示

### 12. 小型操作按钮 — `.vx-btn-sm`

```css
.vx-btn-sm {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--duration-fast),
              color var(--duration-fast),
              border-color var(--duration-fast);
}
.vx-btn-sm:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-hover);
}
.vx-btn-sm:active {
  background: var(--color-bg-elevated);
}
```

**用途**: 工具栏按钮、操作按钮

### 13. 空状态容器 — `.vx-empty`

```css
.vx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: var(--space-8);
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  text-align: center;
}
```

**用途**: 无数据时的空状态展示

### 14. 空状态图标 — `.vx-empty-icon`

```css
.vx-empty-icon {
  font-family: var(--font-mono);
  font-size: 2rem;
  color: var(--color-text-muted);
  text-shadow: 0 0 8px var(--color-primary-glow);
  margin-bottom: var(--space-3);
  display: block;
}
```

**用途**: 空状态图标（代码风格 `{}`、`[]`）

### 15. 分隔线 — `.vx-divider`

```css
.vx-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-2) 0;
}
```

**用途**: 工具栏分隔、面板内分隔

---

## 接入规范

### 引用方式

组件 CSS 文件通过 `:global()` 引用工具类：

```css
/* 在 .module.css 中 */
:global(.vx-glass) {
  /* 可以覆盖或补充全局工具类 */
}
```

或在 JSX 中直接使用 className：

```tsx
<div className={`vx-glass ${styles.localClass}`}>
```

### 命名约束

- 工具类必须使用 `vx-` 前缀
- 不得与现有 CSS Modules 本地类名冲突
- 不得使用 `!important` 强制覆盖

---

## CSS 行数目标

| 文件 | 基线行数 | 目标行数 | 减少比例 |
|------|----------|----------|----------|
| `JsonTreeRenderer.module.css` | 213 | ≤149 | ≥30% |

---

## 迁移检查表

- [ ] `.vx-glass` 已定义
- [ ] `.vx-neon-hover` 已定义
- [ ] `.vx-toolbar` 已定义
- [ ] `.vx-search` 已定义
- [ ] `.vx-row-hover` 已定义
- [ ] `.vx-row-selected` 已定义
- [ ] `.vx-text-secondary` 已定义
- [ ] `.vx-text-primary` 已定义
- [ ] `.vx-text-code` 已定义
- [ ] `.vx-btn-sm` 已定义
- [ ] `.vx-empty` 已定义
- [ ] `.vx-empty-icon` 已定义
- [ ] `.vx-divider` 已定义
- [ ] 工具类命名无 `vx-` 前缀以外的名字
- [ ] 无 `!important` 使用
- [ ] JsonTreeRenderer 已接入 ≥5 个工具类
- [ ] ComponentTree 已接入 ≥1 个工具类
