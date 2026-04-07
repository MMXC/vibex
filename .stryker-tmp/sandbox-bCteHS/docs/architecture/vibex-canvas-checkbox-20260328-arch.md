# ADR: vibex-canvas-checkbox-20260328 架构设计

## Status
Accepted

## Context
Canvas 组件中多处使用 emoji（✓/○/×）作为 checkbox 视觉替代，无法跟随主题色、不支持深色模式、不符合无障碍规范。需统一替换为纯 CSS box-style checkbox。

## Decision

### Tech Stack
- **Framework**: React 19 + TypeScript（现有）
- **Styling**: CSS Modules（现有）
- **New**: 统一 checkbox CSS Module
- **Test**: Vitest + Testing Library（现有）

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  checkbox.module.css  (NEW - 统一样式定义)                   │
│  ├── .checkbox      — 基础方框（2px border, 16×16）         │
│  ├── .checkbox.checked — 选中态（主题色背景 + 对勾）        │
│  └── .confirmedIcon  — confirmedBadge 专用变体              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
ComponentSelectionStep   NodeSelector       BoundedContextTree
   .tsx + .css           .tsx + .css         .tsx + .css
   F1.2                   F1.3               F1.4
```

### File Changes

| 文件 | 操作 | 描述 |
|------|------|------|
| `src/components/Canvas/styles/checkbox.module.css` | 新建 | 统一 checkbox 样式 |
| `src/components/Canvas/ComponentSelectionStep.tsx` | 修改 | 替换 emoji ✓/○ |
| `src/components/Canvas/ComponentSelectionStep.module.css` | 修改 | 引用 checkbox 样式 |
| `src/components/Canvas/NodeSelector.tsx` | 修改 | 替换 div.checkbox |
| `src/components/Canvas/NodeSelector.module.css` | 修改 | 引用 checkbox 样式 |
| `src/components/Canvas/BoundedContextTree.tsx` | 修改 | confirmedBadge → CSS icon |
| `src/components/Canvas/BoundedContextTree.module.css` | 修改 | .confirmedIcon 样式 |

### CSS Architecture

```css
/* src/components/Canvas/styles/checkbox.module.css */

/* 隐藏原生 checkbox（保留无障碍能力） */
input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* Box checkbox 基础样式 */
.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border, #d1d5db);
  border-radius: 3px;
  background: var(--color-bg, #ffffff);
  transition: border-color 0.15s ease, background-color 0.15s ease;
  flex-shrink: 0;
}

/* 选中态 */
.checkbox.checked {
  border-color: var(--primary-color, #3b82f6);
  background: var(--primary-color, #3b82f6);
}

/* 对勾伪元素 */
.checkbox.checked::after {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg) translateY(-1px);
  display: block;
}

/* confirmedBadge 专用变体 */
.confirmedIcon {
  composes: checkbox;
  border-color: var(--color-success, #10b981);
  background: var(--color-success, #10b981);
}
.confirmedIcon::after {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg) translateY(-1px);
  display: block;
}
```

### Component Changes

```tsx
// ComponentSelectionStep.tsx — F1.2
// Before: {selected ? '✓' : '○'}
// After:
<span
  className={cx(styles.checkbox, isSelected && styles.checked)}
  aria-hidden="true"
/>

// NodeSelector.tsx — F1.3
// Before: div.checkbox {isSelected && '✓'}
// After:
<span
  className={cx(styles.checkbox, isSelected && styles.checked)}
  role="img"
  aria-label={isSelected ? '选中' : '未选中'}
/>

// BoundedContextTree.tsx — F1.4
// Before: confirmedBadge = '✓'
// After:
<span
  className={cx(styles.checkbox, confirmed && styles.checked)}
  aria-label={confirmed ? '已确认' : '未确认'}
/>
```

### Dark Mode Compatibility
CSS 使用 `var(--color-bg)` 和 `var(--color-border)` 变量，已在全局 CSS 中支持深色模式，无需额外处理。

## Consequences

### Positive
- 主题色自动跟随品牌配置
- 深色模式无缝适配
- 无 emoji 跨平台渲染差异
- 保留 `aria-*` 属性，无障碍合规

### Risks
- **风险**: CSS 类名冲突 → **缓解**: 使用 CSS Modules 局部作用域
- **风险**: 深色模式变量缺失 → **缓解**: 检查现有 CSS 变量，缺失则新增
- **风险**: 对勾伪元素在极小尺寸下渲染模糊 → **缓解**: 使用 SVG 而非伪元素（备选方案）

## Testing Strategy

| 测试类型 | 工具 | 覆盖点 |
|----------|------|--------|
| 视觉回归 | Screenshot diff | 选中/未选中/深色模式 |
| 无障碍测试 | axe-core | aria-label 存在性 |
| 状态切换 | Testing Library | classList 变化 |
| 全局 emoji 检测 | Jest | `screen.queryByText(/[✓○×]/)` → null |
