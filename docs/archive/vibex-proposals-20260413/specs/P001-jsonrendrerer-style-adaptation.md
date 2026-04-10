# Spec: P001 — JsonTreeRenderer 风格适配

## 概述

将 `JsonTreeRenderer` 组件的 CSS 从浅色主题迁移到 VibeX 深色玻璃态 + 霓虹发光风格，对接 `design-tokens.css` 设计变量。

**涉及文件**: `src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css`

---

## 样式映射表

### 渲染器容器

| CSS 类 | 当前值 | 目标值 | 说明 |
|--------|--------|--------|------|
| `.renderer` | `background: #fafafa` | `background: var(--color-bg-glass)` | 玻璃态半透明深色背景 |
| `.renderer` | 无 | `backdrop-filter: blur(12px)` | 背景模糊效果 |
| `.renderer` | `border-radius: 8px` | 保留 | 圆角保持不变 |

### 工具栏

| CSS 类 | 当前值 | 目标值 | 说明 |
|--------|--------|--------|------|
| `.toolbar` | `background: #f3f4f6` | `background: var(--color-bg-elevated)` | 深色层级背景 |
| `.toolbar` | `border-bottom: 1px solid #e5e7eb` | `border-bottom: 1px solid var(--color-border)` | 边框使用 token |
| `.stats` | `color: #6b7280` | `color: var(--color-text-secondary)` | 次要文字 |
| `.toolbarBtn` | `background: white` | `background: var(--color-bg-secondary)` | 深色按钮背景 |
| `.toolbarBtn` | `border: 1px solid #d1d5db` | `border: 1px solid var(--color-border)` | 边框使用 token |
| `.toolbarBtn:hover` | `background: #f9fafb` | `background: var(--color-bg-tertiary)` | hover 深色 |
| `.toolbarActions` | - | 保留 | flex gap 布局 |

### 搜索栏

| CSS 类 | 当前值 | 目标值 | 说明 |
|--------|--------|--------|------|
| `.searchBar` | `background: white` | `background: var(--color-bg-secondary)` | 深色背景 |
| `.searchBar` | `border-bottom: 1px solid #e5e7eb` | `border-bottom: 1px solid var(--color-border)` | 边框使用 token |
| `.searchInput` | `border: 1px solid #d1d5db` | `border: 1px solid var(--color-border)` | 边框使用 token |
| `.searchInput:focus` | `border-color: #3b82f6` | `border-color: var(--color-primary)` + `box-shadow: 0 0 0 2px var(--color-primary-muted)` | 聚焦时 neon glow |
| `.searchCount` | `color: #6b7280` | `color: var(--color-text-secondary)` | 次要文字 |

### JSON 值类型颜色

| CSS 类 | 当前值 | 目标值 | 说明 |
|--------|--------|--------|------|
| `.string` | `color: #059669` (绿色) | `color: var(--color-green)` | 霓虹绿 |
| `.number` | `color: #2563eb` (蓝色) | `color: var(--color-primary)` | 赛博青 |
| `.boolean` | `color: #7c3aed` (紫色) | `color: var(--color-accent)` | 蓝紫渐变 |
| `.null` | `color: #9ca3af` | `color: var(--color-text-muted)` | 弱化文字 |

### 行状态

| CSS 类 | 当前值 | 目标值 | 说明 |
|--------|--------|--------|------|
| `.key` | `color: #1f2937` | `color: var(--color-text-primary)` | 主文字色 |
| `.colon` | `color: #6b7280` | `color: var(--color-text-secondary)` | 次要文字 |
| `.row:hover` | `background: #f3f4f6` | `background: var(--color-bg-tertiary)` | 深色悬停背景 |
| `.rowSelected` | `background: #dbeafe !important` | `background: var(--color-primary-muted)` + `border-left: 2px solid var(--color-primary)` | 主色选中强调 |
| `.rowMatch` | `background: #fef9c3` | `background: var(--color-accent-muted)` | 搜索匹配高亮 |

### 展开箭头

| CSS 类 | 当前值 | 目标值 | 说明 |
|--------|--------|--------|------|
| `.toggle` | `color: #6b7280` | `color: var(--color-text-secondary)` | 默认态 |
| `.toggle:hover` | `color: #374151` | `color: var(--color-text-primary)` | 悬停态 |
| `.toggleOpen` | `color: #3b82f6` | `color: var(--color-accent)` | 展开态 |

### 高亮和复制

| CSS 类 | 当前值 | 目标值 | 说明 |
|--------|--------|--------|------|
| `.highlight` | `background: #fde047` + `color: #1f2937` | `background: var(--color-accent-muted)` + `color: var(--color-accent)` | 强调高亮 |
| `.copyBtn` | - | 保留交互逻辑 | CSS 改色 |

### 空状态

| CSS 类 | 当前值 | 目标值 | 说明 |
|--------|--------|--------|------|
| `.empty` | `background: #fafafa` | `background: var(--color-bg-primary)` | 主背景色 |
| `.emptyText` | `color: #374151` | `color: var(--color-text-primary)` | 主文字 |
| `.emptyHint` | `color: #9ca3af` | `color: var(--color-text-muted)` | 次要文字 |
| `.emptyIcon` | emoji 浅色图标 | 替换为 `{}` 代码风格文字 + `text-shadow: 0 0 8px var(--color-primary-glow)` | neon glow 风格 |

---

## 禁用的硬编码颜色

迁移完成后，以下 hex 值不得出现在 `JsonTreeRenderer.module.css` 中：

- `#fafafa` (浅色背景)
- `#f3f4f6` (浅灰背景)
- `#dbeafe` (浅蓝选中)
- `#fef9c3` (黄色高亮)
- `#fde047` (黄色强调)
- `#6b7280` (浅灰文字)
- `#9ca3af` (浅灰文字)
- `#1f2937` (深灰文字)
- `#374151` (中灰文字)
- `#059669` (绿色值)
- `#2563eb` (蓝色值)
- `#3b82f6` (蓝色强调)
- `#7c3aed` (紫色值)
- `#e5e7eb` (浅灰边框)
- `#d1d5db` (中灰边框)
- `#f9fafb` (浅灰 hover)
- `#ffffff` / `white` (白色背景/文字)
