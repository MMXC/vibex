# Spec: E2 - ComponentTree checkbox 位置修正

## 1. 概述

**工时**: 0.5h | **优先级**: P0
**依赖**: 无

## 2. 修改文件

`ComponentTree.tsx`

## 3. 修改方案

### 3.1 checkbox 前移到标题前

**当前**:
```tsx
{onToggleSelect && (
  <div className={styles.selectionCheckbox}>
    <input type="checkbox" ... />
  </div>
)}
<div className={styles.nodeCardHeader}>
  <div className={styles.nodeTypeBadge} ... /> {/* ← 在 checkbox 之后 */}
  ...
</div>
```

**修改为**:
```tsx
<div className={styles.nodeCardHeader}>
  {onToggleSelect && (
    <input
      type="checkbox"
      className={styles.nodeCheckbox}
      checked={selectedNodes.has(node.nodeId)}
      onChange={() => toggleNodeSelect(node.nodeId)}
    />
  )}
  {/* 删除 nodeTypeBadge */}
  <div className={styles.nodeTitle}>...</div>
  ...
</div>
```

### 3.2 删除 nodeTypeBadge

删除 `<div className={styles.nodeTypeBadge}>` 及其相关内容。

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E2-AC1 | 渲染节点 | ComponentTree | checkbox 在标题前，inline |
| E2-AC2 | 检查 DOM | nodeTypeBadge | = 0 |
| E2-AC3 | 点击 checkbox | toggle selected | toggle 工作 |

## 5. DoD

- [ ] checkbox 在标题同一行
- [ ] 无 nodeTypeBadge
- [ ] checkbox toggle 工作
