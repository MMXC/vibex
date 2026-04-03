# 需求分析报告: bc-checkbox-confirm-style-fix

**任务**: 修复限界上下文卡片 checkbox 与标题不同行、勾选后外框不变绿
**分析师**: analyst
**日期**: 2026-04-02

---

## 问题分析

### 问题 1: checkbox 与标题不同行

**现状**: BoundedContextTree 卡片有 2 个 checkbox：
- `selectionCheckbox` — `position: absolute; top: 0.5rem; left: 0.5rem`（绝对定位左上角）
- `confirmCheckbox` — inline 排列

**根因**: `selectionCheckbox` 绝对定位脱离了文档流，与标题 `<h4>` 不在同一行

**代码位置**: `BoundedContextTree.tsx` lines 234-253

### 问题 2: 勾选后外框不变绿

**现状**: `confirmContextNode` 正确设置 `isActive: true, status: 'confirmed'`，卡片 className 使用 `statusClass`（`node.status === 'confirmed'` 时为 `nodeConfirmed` → 绿色边框）。

**但问题在于**: checkbox `checked` 属性绑定错误：
```tsx
// line 234-238: selectionCheckbox — checked 绑定错误
checked={node.isActive !== false && node.status !== 'pending'}  // ← 这个条件永远为 true！

// line 246-250: confirmCheckbox — checked 绑定正确
checked={node.isActive !== false}
```

**根因**: `selectionCheckbox` 的 `checked` 条件是 `node.isActive !== false && node.status !== 'pending'`，即只要 `isActive` 不是 `false` 就 checked。即使 `status` 已经是 `pending`，checkbox 也显示为 checked（但视觉上边框不变绿，因为 status 是 pending）。

同时 `selectionCheckbox` 调用的是 `confirmContextNode()`，而 `confirmCheckbox` 调用的是 `editContextNode({isActive})` — **两个 checkbox 绑定不同逻辑**。

---

## 技术方案

### 方案 A: 合并为单一 checkbox（推荐）

1. 删除 `selectionCheckbox`（绝对定位那个）
2. 保留 `confirmCheckbox`，调整样式到标题行内（inline）
3. 将 `nodeTypeBadge` 前移，紧跟 checkbox
4. checkbox `checked` 绑定 `node.status === 'confirmed'`

**修改文件**: `BoundedContextTree.tsx`

```tsx
// 删除 selectionCheckbox (lines 234-243)
// 保留 confirmCheckbox，前移到标题同一行
<input
  type="checkbox"
  checked={node.status === 'confirmed'}  // 修正绑定
  onChange={() => {
    if (node.status === 'confirmed') {
      // 取消确认：toggleContextNode
      toggleContextNode(node.nodeId);
    } else {
      // 确认：confirmContextNode
      confirmContextNode(node.nodeId);
    }
  }}
  className={styles.confirmCheckbox}
/>
<span className={styles.nodeTypeBadge} ... />
<h4>{node.name}</h4>
```

### 方案 B: 最小修复

只修复 `checked` 绑定和边框问题，保留双 checkbox 结构：
- `selectionCheckbox` 的 `checked` 改为 `node.status === 'confirmed'`
- 统一两个 checkbox 的行为

---

## 工作量估算

| 任务 | 估算 |
|------|------|
| BoundedContextTree: 合并 checkbox + 调整样式 | 1h |
| 验收测试 | 0.5h |
| **总计** | **1.5h** |

---

## 验收标准

1. [ ] 卡片 checkbox 与标题 `<h4>` 在同一行
2. [ ] 勾选卡片 → 外框变绿色（`nodeConfirmed`）
3. [ ] 取消勾选 → 外框恢复黄色（`nodeUnconfirmed`）
4. [ ] 只有一个 checkbox（不是两个）
5. [ ] `toggleContextNode` 可用（已存在 store 中）
