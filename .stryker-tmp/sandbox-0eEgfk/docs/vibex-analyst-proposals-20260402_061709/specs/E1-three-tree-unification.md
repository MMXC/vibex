# Spec: E1 - 三树选择模型统一

## 1. 概述

**工时**: 4-6h | **优先级**: P0
**依赖**: 无外部依赖

## 2. 修改范围

### 2.1 NodeState 枚举定义

**文件**: `packages/canvas/src/types/NodeState.ts`（新建）

```typescript
export enum NodeState {
  Pending = 'pending',
  Confirmed = 'confirmed',
}

export const NodeStateLabels = {
  [NodeState.Pending]: '未确认',
  [NodeState.Confirmed]: '已确认',
};
```

### 2.2 BoundedContextTree 修改

**文件**: `BoundedContextTree.tsx`

**变更**:
1. 删除绝对定位的 `selectionCheckbox`（lines 234-243）
2. 保留 `confirmCheckbox`，前移到 `nodeTypeBadge` 前
3. 添加确认反馈：已确认节点显示绿色 ✓

```tsx
// 删除: <input type="checkbox" className={styles.selectionCheckbox} ... />

// 保留 confirmCheckbox，前移：
<input
  type="checkbox"
  className={styles.contextCheckbox}
  checked={node.status === NodeState.Confirmed}
  onChange={() => confirmContextNode(node.nodeId)}
/>
{node.status === NodeState.Confirmed && (
  <span className={styles.confirmedBadge}>✓</span>
)}
<div className={styles.nodeTypeBadge} ... />
```

### 2.3 ComponentTree 修改

**文件**: `ComponentTree.tsx`

**变更**:
1. 移动 `selectionCheckbox` 到 `nodeCardHeader` 内部、type badge 之前
2. 移除 div 包裹，直接 inline `<input>`

```tsx
<div className={styles.nodeCardHeader}>
  {onToggleSelect && (
    <input
      type="checkbox"
      className={styles.componentCheckbox}
      checked={selectedNodes.has(node.nodeId)}
      onChange={() => toggleNodeSelect(node.nodeId)}
    />
  )}
  <div className={styles.nodeTypeBadge} ... />
</div>
```

### 2.4 CSS 修改

**文件**: `canvas.module.css`

```css
.contextCheckbox,
.componentCheckbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-success);
  cursor: pointer;
  margin-right: 4px;
  flex-shrink: 0;
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

/* 移除 nodeUnconfirmed 黄色边框 */
.nodeUnconfirmed {
  border: 2px solid var(--color-border);
  /* 删除: border-color: var(--color-warning) */
  /* 删除: box-shadow: 0 0 8px rgba(255, 170, 0, 0.2) */
}
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 渲染 ContextTree | status = confirmed | 只有 1 个 checkbox + 绿色 ✓ |
| E1-AC2 | 渲染 ComponentTree | 有 selectionCheckbox | checkbox 在 type badge 前 |
| E1-AC3 | 渲染 pending 节点 | nodeUnconfirmed class | 无 border-color: var(--color-warning) |
| E1-AC4 | Playwright | 30 次选择操作 | successCount = 30 |

## 4. DoD

- [ ] NodeState 枚举定义完成
- [ ] 三树 checkbox 均在 type badge 前
- [ ] 已确认节点显示绿色 ✓
- [ ] nodeUnconfirmed 无黄色边框/阴影
- [ ] Playwright 测试通过
