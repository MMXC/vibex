# Spec: E1 - BoundedContextTree Checkbox 修复

## 1. 概述

**工时**: 1.5h | **优先级**: P0
**依赖**: 无

## 2. 修改文件

`BoundedContextTree.tsx` (lines 234-253)

## 3. 修改方案

### 3.1 删除 selectionCheckbox

删除 lines 234-243 的绝对定位 checkbox：
```tsx
// 删除
<input
  type="checkbox"
  className={styles.selectionCheckbox}  // position: absolute ❌
  checked={node.isActive !== false && node.status !== 'pending'}  // 永远 true ❌
  onChange={() => { confirmContextNode(node.nodeId); }}
/>
```

### 3.2 保留并修正 confirmCheckbox

**当前** (lines 246-253):
```tsx
<input
  type="checkbox"
  className={styles.confirmCheckbox}
  checked={node.isActive !== false}
  onChange={() => onEdit(node.nodeId, { isActive: node.isActive === false ? true : false })}
/>
```

**修改为**:
```tsx
<input
  type="checkbox"
  className={styles.nodeCheckbox}
  checked={node.status === 'confirmed'}
  onChange={() => {
    if (node.status === 'confirmed') {
      // 取消确认
      onEdit(node.nodeId, { status: 'pending', isActive: false });
    } else {
      // 确认
      confirmContextNode(node.nodeId);
    }
  }}
/>
```

### 3.3 调整 DOM 结构（标题同行）

```tsx
<div className={styles.nodeCardHeader}>
  <input
    type="checkbox"
    className={styles.nodeCheckbox}
    checked={node.status === 'confirmed'}
    onChange={...}
  />
  <span className={styles.nodeTypeBadge} ... />
  <h4>{node.name}</h4>
</div>
```

### 3.4 CSS 调整

```css
/* 替换 .selectionCheckbox 和 .confirmCheckbox */
.nodeCheckbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-success);
  cursor: pointer;
  margin-right: 4px;
  flex-shrink: 0;
}
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 渲染节点 | BoundedContextTree | 1 个 checkbox |
| E1-AC2 | 检查 DOM | checkbox | 无 position: absolute |
| E1-AC3 | 检查 DOM | checkbox | 与 h4 同一行 |
| E1-AC4 | 点击 checkbox | pending → confirmed | 边框变绿色 |
| E1-AC5 | 点击 checkbox | confirmed → pending | 边框变黄色 |

## 5. DoD

- [ ] 只有 1 个 checkbox
- [ ] checkbox 与标题同行
- [ ] 无绝对定位
- [ ] confirmed 绿色边框
- [ ] pending 黄色边框
- [ ] toggle 工作正常
