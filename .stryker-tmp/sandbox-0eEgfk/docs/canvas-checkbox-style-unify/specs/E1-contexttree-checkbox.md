# Spec: E1 - ContextTree Checkbox 合并与确认反馈

## 1. 概述

**文件名**: `BoundedContextTree.tsx`
**行数**: 234-257（需修改）
**工时**: 1.5h

## 2. 当前状态

```tsx
// line 234-243: selectionCheckbox — 绝对定位，占左上角
<input
  type="checkbox"
  className={styles.selectionCheckbox}
  checked={node.isActive !== false && node.status !== 'pending'}
  onChange={() => { confirmContextNode(node.nodeId); }}
/>

// line 246-253: confirmCheckbox — inline，与 selection 重复
<input
  type="checkbox"
  className={styles.confirmCheckbox}
  checked={node.isActive !== false}
  onChange={() => onEdit(node.nodeId, { isActive: node.isActive === false ? true : false })}
/>
```

## 3. 修改方案

### 3.1 删除 selectionCheckbox（绝对定位）

删除 lines 234-243 的 `<input type="checkbox" className={styles.selectionCheckbox} />`

### 3.2 保留 confirmCheckbox，重命名语义

将 `confirmCheckbox` 重命名为 `contextCheckbox`，保留 onChange 调用 `confirmContextNode`：
```tsx
<input
  type="checkbox"
  className={styles.contextCheckbox}
  checked={node.status === 'confirmed'}
  onChange={() => { confirmContextNode(node.nodeId); }}
/>
```

### 3.3 添加确认反馈图标

在 checkbox 后、nodeTypeBadge 前添加：
```tsx
{node.status === 'confirmed' && (
  <span className={styles.confirmedBadge}>✓</span>
)}
```

### 3.4 调整 CSS

`canvas.module.css` 需新增/修改：
```css
/* 替换 .selectionCheckbox 为 .contextCheckbox */
.contextCheckbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-success);
  cursor: pointer;
  margin-right: 4px;
}

.confirmedBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--color-success);
  font-size: 12px;
  font-weight: bold;
  margin-right: 4px;
}
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 渲染节点 | `status === 'confirmed'` | 只有 1 个 checkbox + 绿色 ✓ |
| E1-AC2 | 渲染节点 | `status === 'pending'` | 只有 1 个 checkbox，无确认反馈 |
| E1-AC3 | 点击 checkbox | 调用 confirmContextNode | expect(confirmContextNode).toHaveBeenCalledWith(node.nodeId) |
| E1-AC4 | 节点无拖选 | 删除 selectionCheckbox | `toggleNodeSelect` 不受影响（Ctrl+Click 保留）|

## 5. 依赖

- 无外部依赖
- 内部依赖：`canvas.module.css` 样式定义
