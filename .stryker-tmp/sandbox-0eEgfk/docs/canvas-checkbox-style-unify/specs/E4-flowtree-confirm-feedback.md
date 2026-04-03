# Spec: E4 - FlowTree 确认反馈一致性

## 1. 概述

**文件名**: `BusinessFlowTree.tsx`
**行数**: 待定（需修改）
**工时**: 0.5h

## 2. 当前状态

`BusinessFlowTree` 的 FlowCard 已有 `flowCardCheckbox` 在 header 最前面，位置正确，但无确认状态反馈。

## 3. 修改方案

### 3.1 添加确认反馈图标

在 `flowCardCheckbox` 后、nodeTypeBadge 前添加：
```tsx
{flow.status === 'confirmed' && (
  <span className={styles.confirmedBadge}>✓</span>
)}
```

### 3.2 复用 confirmedBadge 样式

与 ContextTree 保持一致的 `confirmedBadge` 样式。

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E4-AC1 | 渲染 FlowCard | `status === 'confirmed'` | 显示绿色 ✓ |
| E4-AC2 | 渲染 FlowCard | `status !== 'confirmed'` | 无确认反馈 |
| E4-AC3 | 视觉一致性 | 对比三树 | FlowCard 确认反馈与 ContextTree/ComponentTree 一致 |

## 5. 依赖

- 无外部依赖
- 内部依赖：`canvas.module.css` 的 `.confirmedBadge` 样式（E1 中定义）
