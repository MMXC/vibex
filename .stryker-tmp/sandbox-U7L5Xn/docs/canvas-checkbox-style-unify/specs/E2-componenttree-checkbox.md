# Spec: E2 - ComponentTree Checkbox 位置修正

## 1. 概述

**文件名**: `ComponentTree.tsx`
**行数**: 426-439（需修改）
**工时**: 0.5h

## 2. 当前状态

```tsx
{/* E3-F2: Selection checkbox — 在 type badge 之后 */}
{onToggleSelect && (
  <div className={styles.selectionCheckbox} onClick={(e) => { e.stopPropagation(); }}>
    <input type="checkbox" ... />
  </div>
)}
<div className={styles.nodeCardHeader}>
  <div className={styles.nodeTypeBadge} ... />  {/* ← type badge 在 checkbox 后面! */}
  ...
</div>
```

**问题**: `.selectionCheckbox` 在 CSS 中定义为 `position: absolute`，但其子元素 `<input>` 没有继承绝对定位，导致实际渲染在 type badge 之后（inline）。

## 3. 修改方案

### 3.1 移动 checkbox 到 nodeCardHeader 内部

```tsx
<div className={styles.nodeCardHeader}>
  {/* 移到这里，type badge 之前 */}
  {onToggleSelect && (
    <input
      type="checkbox"
      className={styles.componentCheckbox}
      checked={selectedNodes.has(node.nodeId)}
      onChange={() => toggleNodeSelect(node.nodeId)}
      onClick={(e) => e.stopPropagation()}
    />
  )}
  <div className={styles.nodeTypeBadge} ... />
  ...
</div>
```

### 3.2 移除 div 包裹

删除外层 `<div className={styles.selectionCheckbox}>`，直接使用 `<input>` inline。

### 3.3 调整 CSS

`canvas.module.css` 需新增/修改：
```css
/* 替换 .selectionCheckbox 为 .componentCheckbox */
.componentCheckbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
  margin-right: 4px;
  flex-shrink: 0;
}
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E2-AC1 | 渲染节点 | 有 onToggleSelect | checkbox 在 type badge 前 |
| E2-AC2 | DOM 结构 | 渲染完成 | `<input>` 直接在 header 内，无 div 包裹 |
| E2-AC3 | 样式 | 检查 CSS | checkbox 无 `position: absolute` |
| E2-AC4 | 点击 checkbox | 调用 toggleNodeSelect | `toggleNodeSelect(node.nodeId)` |

## 5. 依赖

- 无外部依赖
- 内部依赖：`ComponentTree.tsx` 的 `toggleNodeSelect` prop
