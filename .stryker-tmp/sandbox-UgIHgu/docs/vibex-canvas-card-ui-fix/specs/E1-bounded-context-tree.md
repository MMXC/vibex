# Spec: E1 - BoundedContextTree 卡片修复

## 1. 概述

**工时**: 1h | **优先级**: P0
**依赖**: 无

## 2. 修改文件

`BoundedContextTree.tsx`

## 3. 修改方案

### 3.1 合并双 checkbox 为 1 个 toggle

**删除**:
- `selectionCheckbox` (绝对定位，占左上角)
- `confirmCheckbox` (inline)

**新增**:
```tsx
<input
  type="checkbox"
  className={styles.nodeCheckbox}
  checked={node.status === 'confirmed'}
  onChange={() => {
    if (node.status === 'confirmed') {
      onEdit(node.nodeId, { status: 'pending' });
    } else {
      confirmContextNode(node.nodeId);
    }
  }}
/>
```

### 3.2 删除 nodeTypeBadge

删除 `<div className={styles.nodeTypeBadge}>` 及其相关内容。

### 3.3 删除 confirmedBadge

删除 `<span className={styles.confirmedBadge}>` 及其相关内容。

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 渲染节点 | BoundedContextTree | 1 个 checkbox |
| E1-AC2 | 点击 checkbox | confirmed → unconfirmed | border 变黄色 |
| E1-AC3 | 点击 checkbox | unconfirmed → confirmed | border 变绿色 |
| E1-AC4 | 检查 DOM | nodeTypeBadge | = 0 |
| E1-AC5 | 检查 DOM | confirmedBadge | = 0 |

## 5. DoD

- [ ] 只有 1 个 checkbox
- [ ] checkbox toggle 双向工作
- [ ] 无 nodeTypeBadge
- [ ] 无 confirmedBadge
