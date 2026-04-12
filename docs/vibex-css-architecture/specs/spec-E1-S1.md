# Spec: E1-S1 — 修复 PrototypeQueuePanel 队列项类名引用

## 文件

- **修改**: `vibex-fronted/src/components/canvas/PrototypeQueuePanel.tsx`
- **Line 56 当前**: `styles[\`queueItem_\${statusVariant}\`]`
- **期望**: `styles[\`queueItem\${capitalize(statusVariant)}\`]`

## 背景

`statusVariant` 取值范围：`queued` | `generating` | `done` | `error`

CSS 中定义（`canvas.export.module.css`）：
```css
.queueItemQueued    { /* ... */ }
.queueItemGenerating { /* ... */ }
.queueItemDone      { /* ... */ }
.queueItemError     { /* ... */ }
```

Line 90 `styles.queueItemError`（camelCase）已是正确写法，无需修改。

## 修改方案

```tsx
// 修改前 (line 56)
<li className={`${styles.queueItem} ${styles[`queueItem_${statusVariant}`]}`}>

// 修改后
<li className={`${styles.queueItem} ${styles[`queueItem${capitalize(statusVariant)}`]}`}>
```

如项目无 `capitalize` 辅助函数，可直接内联或用 `.charAt(0).toUpperCase() +.slice(1)`：

```tsx
const statusClass = `queueItem${statusVariant.charAt(0).toUpperCase() + statusVariant.slice(1)}`;
<li className={`${styles.queueItem} ${styles[statusClass]}`}>
```

## DoD 检查单

- [ ] `statusVariant.charAt(0).toUpperCase() + statusVariant.slice(1)` 正确处理 4 种状态
- [ ] `queued` → `queueItemQueued`
- [ ] `generating` → `queueItemGenerating`
- [ ] `done` → `queueItemDone`
- [ ] `error` → `queueItemError`
- [ ] `npm run build` 成功
- [ ] Vitest 测试通过（E4-S1）

## 回归风险

低。修改仅影响 PrototypeQueuePanel 的队列项状态样式，不影响其他组件。
